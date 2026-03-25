from __future__ import annotations

import json
import re

from .config import settings
from .llm import llm_client
from .models import (
    DeepCard,
    DeepCardResponse,
    GenerationRequest,
    GraphNode,
    KnowledgeGraphResult,
    LightweightCard,
    ManualDeepCardRequest,
    TaskRecord,
    TaskStage,
    TaskStatus,
    ValidationResult,
)
from .pdf import extract_pdf_text
from .prompts import (
    build_deep_card_prompt,
    build_light_card_prompt,
    build_single_deep_card_prompt,
    build_skeleton_prompt,
)
from .store import task_store


class KnowledgeGraphAgent:
    LIGHT_CARD_BATCH_SIZE = 3

    def run_task(self, task_id: str) -> None:
        task = task_store.get(task_id)
        if task is None:
            return

        try:
            self._update(
                task,
                TaskStatus.running,
                TaskStage.loading_sources,
                "Loading sources",
                progress=self._progress_payload(0, 1, "读取教师输入与 PDF 内容"),
            )
            source_summary = self._load_sources(task.request)
            self._update(
                task,
                TaskStatus.running,
                TaskStage.loading_sources,
                "Sources loaded",
                progress=self._progress_payload(1, 1, "资料读取完成"),
            )

            self._update(
                task,
                TaskStatus.running,
                TaskStage.generating_skeleton,
                "Generating skeleton",
                progress=self._progress_payload(1, 4, "整理课程上下文"),
            )
            nodes, graph_title = self._generate_skeleton(
                task, task.request, source_summary
            )
            self._save_partial_result(task, graph_title, nodes, source_summary)
            self._update(
                task,
                TaskStatus.running,
                TaskStage.generating_skeleton,
                "Skeleton ready",
                progress=self._progress_payload(
                    len(nodes), len(nodes), f"骨架图已生成，共 {len(nodes)} 个节点"
                ),
            )

            self._update(
                task,
                TaskStatus.running,
                TaskStage.generating_light_cards,
                "Generating lightweight cards",
                progress=self._progress_payload(0, len(nodes), "准备生成轻卡片"),
            )
            self._generate_light_cards(task, task.request, source_summary, nodes)
            self._save_partial_result(task, graph_title, nodes, source_summary)

            self._update(
                task,
                TaskStatus.running,
                TaskStage.validating,
                "Validating graph",
                progress=self._progress_payload(0, 1, "校验图谱结构与卡片内容"),
            )
            validation = self._validate(nodes)

            task.result = KnowledgeGraphResult(
                graphTitle=graph_title,
                nodes=nodes,
                validation=validation,
                sourceSummary=source_summary,
            )
            self._update(
                task,
                TaskStatus.completed,
                TaskStage.completed,
                "Knowledge graph generated",
                progress=self._progress_payload(1, 1, "知识图谱生成完成"),
            )
        except Exception as exc:
            task.error = str(exc)
            self._update(
                task,
                TaskStatus.failed,
                TaskStage.failed,
                "Generation failed",
                progress=self._progress_payload(0, 1, str(exc)),
            )

    def _update(
        self,
        task: TaskRecord,
        status: TaskStatus,
        stage: TaskStage,
        message: str,
        progress: dict | None = None,
    ) -> None:
        task.status = status
        task.stage = stage
        task.message = message
        if progress is not None:
            task.progress = progress
        task_store.save(task)

    def _save_partial_result(
        self,
        task: TaskRecord,
        graph_title: str,
        nodes: list[GraphNode],
        source_summary: str,
    ) -> None:
        task.result = KnowledgeGraphResult(
            graphTitle=graph_title,
            nodes=nodes,
            validation=ValidationResult(
                isValid=True,
                warnings=[],
                stats={
                    "totalNodes": len(nodes),
                    "focusNodes": sum(1 for node in nodes if node.isFocus),
                    "lightCards": sum(
                        1 for node in nodes if node.lightweightCard.definition
                    ),
                    "deepCards": sum(1 for node in nodes if node.deepCard is not None),
                },
            ),
            sourceSummary=source_summary,
        )
        task_store.save(task)

    def _load_sources(self, request: GenerationRequest) -> str:
        pdf_texts = [extract_pdf_text(path) for path in request.pdfPaths]
        combined = "\n\n".join(
            part.strip()
            for part in [request.teacherRequirements, request.sourceText, *pdf_texts]
            if part and part.strip()
        )
        if not combined:
            combined = request.courseName
        return self._summarize_text(combined)

    def _summarize_text(self, text: str, max_chars: int = 4000) -> str:
        cleaned = re.sub(r"\s+", " ", text).strip()
        return cleaned[:max_chars]

    def _generate_skeleton(
        self, task: TaskRecord, request: GenerationRequest, source_summary: str
    ) -> tuple[list[GraphNode], str]:
        self._ensure_llm_enabled()
        system_prompt, user_prompt = build_skeleton_prompt(
            request.courseName,
            request.teacherRequirements,
            source_summary,
            request.graphType,
        )
        self._update(
            task,
            TaskStatus.running,
            TaskStage.generating_skeleton,
            "Generating skeleton",
            progress=self._progress_payload(2, 4, "调用骨架生成模型"),
        )
        payload = llm_client.complete_json(
            system_prompt, user_prompt, model=settings.skeleton_model
        )
        self._update(
            task,
            TaskStatus.running,
            TaskStage.generating_skeleton,
            "Skeleton raw result received",
            progress=self._progress_payload(3, 4, "整理骨架节点关系"),
        )
        result = self._normalize_skeleton_payload(
            payload,
            request.courseName,
            source_summary,
            request.graphType,
        )
        self._update(
            task,
            TaskStatus.running,
            TaskStage.generating_skeleton,
            "Skeleton normalized",
            progress=self._progress_payload(4, 4, "骨架节点整理完成"),
        )
        return result

    def _normalize_skeleton_payload(
        self,
        payload: dict,
        fallback_title: str,
        source_summary: str,
        graph_type: str = "0",
    ) -> tuple[list[GraphNode], str]:
        raw_nodes = payload.get("nodes") or []
        nodes: list[GraphNode] = []
        seen: set[str] = set()
        for index, item in enumerate(raw_nodes, start=1):
            node_id = str(item.get("id") or f"n{index}")
            if node_id in seen:
                node_id = f"{node_id}_{index}"
            seen.add(node_id)
            parent_id = item.get("parentId")
            nodes.append(
                GraphNode(
                    id=node_id,
                    title=str(item.get("title") or f"Topic {index}"),
                    parentId=(
                        str(parent_id)
                        if parent_id not in (None, "", 0, "0")
                        else None
                    ),
                    level=int(item.get("level") or (2 if parent_id else 1)),
                )
            )
        if not nodes:
            raise RuntimeError("Remote LLM returned no graph nodes")
        if graph_type == "1":
            normalized_nodes = self._normalize_levels(nodes)
            return normalized_nodes, str(payload.get("graphTitle") or fallback_title)

        normalized_nodes = self._ensure_summary_parent(
            nodes,
            fallback_title,
            str(payload.get("summaryTitle") or ""),
            source_summary,
        )
        return normalized_nodes, str(payload.get("graphTitle") or fallback_title)

    def _ensure_summary_parent(
        self,
        nodes: list[GraphNode],
        course_name: str,
        summary_title: str,
        source_summary: str,
    ) -> list[GraphNode]:
        normalized_nodes = self._unwrap_explicit_course_root(nodes, course_name)
        normalized_nodes = self._normalize_levels(normalized_nodes)

        root_nodes = [node for node in normalized_nodes if node.parentId is None]
        if len(root_nodes) != 1:
            summary_node = GraphNode(
                id=self._next_node_id(normalized_nodes, "summary"),
                title=self._resolve_summary_title(
                    summary_title,
                    root_nodes,
                    course_name,
                    source_summary,
                ),
                parentId=None,
                level=1,
            )
            root_ids = {node.id for node in root_nodes}
            for node in normalized_nodes:
                if node.id in root_ids:
                    node.parentId = summary_node.id
            normalized_nodes.append(summary_node)

        return self._normalize_levels(normalized_nodes)

    def _unwrap_explicit_course_root(
        self, nodes: list[GraphNode], course_name: str
    ) -> list[GraphNode]:
        if not course_name.strip():
            return nodes

        course_root_ids = {
            node.id
            for node in nodes
            if node.parentId is None and self._titles_match(node.title, course_name)
        }
        if not course_root_ids:
            return nodes

        normalized_nodes = [node for node in nodes if node.id not in course_root_ids]
        for node in normalized_nodes:
            if node.parentId in course_root_ids:
                node.parentId = None
        return normalized_nodes

    def _resolve_summary_title(
        self,
        summary_title: str,
        root_nodes: list[GraphNode],
        course_name: str,
        source_summary: str,
    ) -> str:
        candidates = [summary_title]
        if len(root_nodes) == 1:
            candidates.append(root_nodes[0].title)

        for candidate in candidates:
            normalized = self._sanitize_summary_title(candidate, course_name)
            if normalized:
                return normalized

        fallback = self._sanitize_summary_title(source_summary, course_name)
        return fallback or "课程内容总结"

    def _sanitize_summary_title(self, value: str, course_name: str) -> str:
        cleaned = re.sub(r"\s+", " ", str(value or "")).strip(" ,，。；;：:")
        if not cleaned:
            return ""
        if self._titles_match(cleaned, course_name):
            return f"{course_name.strip()}内容总结"
        if len(cleaned) <= 24:
            return cleaned
        sentence = re.split(r"[。！？；;]", cleaned, maxsplit=1)[0].strip()
        if sentence and len(sentence) <= 24:
            return sentence
        return cleaned[:24].rstrip(" ,，。；;：:") + "..."

    def _next_node_id(self, nodes: list[GraphNode], prefix: str) -> str:
        existing_ids = {node.id for node in nodes}
        if prefix not in existing_ids:
            return prefix
        index = 2
        while f"{prefix}_{index}" in existing_ids:
            index += 1
        return f"{prefix}_{index}"

    def _titles_match(self, left: str, right: str) -> bool:
        return left.strip().lower() == right.strip().lower()

    def _normalize_levels(self, nodes: list[GraphNode]) -> list[GraphNode]:
        if not nodes:
            return nodes

        node_map = {node.id: node for node in nodes}
        for node in nodes:
            if node.parentId and node.parentId not in node_map:
                node.parentId = None

        roots = [node for node in nodes if node.parentId is None]
        if not roots:
            nodes[0].parentId = None
            roots = [nodes[0]]

        children_map: dict[str, list[GraphNode]] = {}
        for node in nodes:
            if node.parentId is None:
                continue
            children_map.setdefault(node.parentId, []).append(node)

        visited: set[str] = set()
        queue: list[tuple[GraphNode, int]] = [(root, 1) for root in roots]
        while queue:
            current, level = queue.pop(0)
            if current.id in visited:
                continue
            visited.add(current.id)
            current.level = level
            for child in children_map.get(current.id, []):
                queue.append((child, level + 1))

        if len(visited) != len(nodes):
            anchor_id = roots[0].id
            for node in nodes:
                if node.id not in visited and node.id != anchor_id:
                    node.parentId = anchor_id
            return self._normalize_levels(nodes)

        return nodes

    def _generate_light_cards(
        self,
        task: TaskRecord,
        request: GenerationRequest,
        source_summary: str,
        nodes: list[GraphNode],
    ) -> None:
        self._ensure_llm_enabled()
        total = len(nodes)
        if total == 0:
            return

        for chunk_index, node_chunk in enumerate(
            self._chunk_nodes(nodes, self.LIGHT_CARD_BATCH_SIZE), start=1
        ):
            system_prompt, user_prompt = build_light_card_prompt(
                request.courseName,
                source_summary,
                [self._node_stub(node) for node in node_chunk],
            )
            payload = llm_client.complete_json(
                system_prompt, user_prompt, model=settings.card_model
            )
            cards = {str(item.get("id")): item for item in payload.get("cards") or []}
            for node in node_chunk:
                card = cards.get(node.id)
                if card is None:
                    raise RuntimeError(
                        f"Remote LLM returned no light card for node {node.id}"
                    )
                node.lightweightCard = LightweightCard(
                    definition=str(card.get("definition") or ""),
                    keywords=self._to_list(card.get("keywords")),
                    example=str(card.get("example") or ""),
                    relatedKnowledge=self._to_list(card.get("relatedKnowledge")),
                )

            completed = min(chunk_index * self.LIGHT_CARD_BATCH_SIZE, total)
            self._save_partial_result(
                task,
                task.result.graphTitle if task.result else request.courseName,
                nodes,
                source_summary,
            )
            current_node = node_chunk[-1].title if node_chunk else ""
            self._update(
                task,
                TaskStatus.running,
                TaskStage.generating_light_cards,
                f"Generating lightweight cards {completed}/{total}",
                progress=self._progress_payload(
                    completed,
                    total,
                    current_node,
                ),
            )

    def _generate_deep_cards(
        self, request: GenerationRequest, source_summary: str, nodes: list[GraphNode]
    ) -> None:
        focus_nodes = self._pick_focus_nodes(request, nodes)
        if not focus_nodes:
            return
        self._ensure_llm_enabled()
        system_prompt, user_prompt = build_deep_card_prompt(
            request.courseName,
            source_summary,
            [self._node_stub(node) for node in focus_nodes],
        )
        payload = llm_client.complete_json(
            system_prompt, user_prompt, model=settings.card_model
        )
        cards = {str(item.get("id")): item for item in payload.get("cards") or []}
        for node in focus_nodes:
            node.isFocus = True
            card = cards.get(node.id)
            if card is None:
                raise RuntimeError(
                    f"Remote LLM returned no deep card for node {node.id}"
                )
            node.deepCard = DeepCard(
                detailedDefinition=str(card.get("detailedDefinition") or ""),
                coreFeatures=self._to_list(card.get("coreFeatures")),
                applicationScenarios=self._to_list(card.get("applicationScenarios")),
                commonQuestions=self._to_list(card.get("commonQuestions")),
                relatedExplanation=str(card.get("relatedExplanation") or ""),
                references=self._to_list(card.get("references")),
            )

    def generate_manual_deep_card(
        self, request: ManualDeepCardRequest
    ) -> DeepCardResponse:
        self._ensure_llm_enabled()
        node_payload = dict(request.node or {})
        node_id = str(node_payload.get("id") or "manual-node")
        node_title = str(
            node_payload.get("title") or node_payload.get("name") or "未命名节点"
        )

        source_summary = self._summarize_text(
            "\n\n".join(
                part.strip()
                for part in [
                    request.sourceText,
                    json.dumps(node_payload, ensure_ascii=False),
                ]
                if part and part.strip()
            )
        )
        system_prompt, user_prompt = build_single_deep_card_prompt(
            request.courseName,
            source_summary,
            {
                "id": node_id,
                "title": node_title,
                "lightweightCard": node_payload.get("lightweightCard") or {},
                "relatedKnowledge": node_payload.get("lightweightCard", {}).get(
                    "relatedKnowledge"
                )
                or [],
            },
        )
        payload = llm_client.complete_json(
            system_prompt, user_prompt, model=settings.card_model
        )
        card = payload.get("deepCard") or {}
        deep_card = DeepCard(
            detailedDefinition=str(card.get("detailedDefinition") or ""),
            coreFeatures=self._to_list(card.get("coreFeatures")),
            applicationScenarios=self._to_list(card.get("applicationScenarios")),
            commonQuestions=self._to_list(card.get("commonQuestions")),
            relatedExplanation=str(card.get("relatedExplanation") or ""),
            references=self._to_list(card.get("references")),
        )
        node_payload["id"] = node_id
        node_payload["title"] = node_title
        node_payload["isFocus"] = True
        node_payload["deepCard"] = deep_card.model_dump(mode="json")
        return DeepCardResponse(node=node_payload, deepCard=deep_card)

    def _pick_focus_nodes(
        self, request: GenerationRequest, nodes: list[GraphNode]
    ) -> list[GraphNode]:
        requested = {
            item.strip().lower() for item in request.focusNodes if item.strip()
        }
        if requested:
            selected = [
                node for node in nodes if node.title.strip().lower() in requested
            ]
            if selected:
                return selected[:6]
        level_one_nodes = [node for node in nodes if node.level == 1]
        return level_one_nodes[: min(3, len(level_one_nodes))]

    def _validate(self, nodes: list[GraphNode]) -> ValidationResult:
        warnings: list[str] = []
        node_ids = {node.id for node in nodes}
        for node in nodes:
            if node.parentId and node.parentId not in node_ids:
                warnings.append(f"Missing parent for node {node.id}")
            if not node.lightweightCard.definition:
                warnings.append(
                    f"Lightweight card missing definition for node {node.id}"
                )
        if len(nodes) < 4:
            warnings.append("Graph contains too few nodes")
        return ValidationResult(
            isValid=not warnings,
            warnings=warnings,
            stats={
                "totalNodes": len(nodes),
                "focusNodes": sum(1 for node in nodes if node.isFocus),
                "lightCards": sum(
                    1 for node in nodes if node.lightweightCard.definition
                ),
                "deepCards": sum(1 for node in nodes if node.deepCard is not None),
            },
        )

    def _ensure_llm_enabled(self) -> None:
        if not llm_client.enabled:
            raise RuntimeError(
                "Knowledge agent API key is not configured. Set KNOWLEDGE_AGENT_API_KEY in .env before generating."
            )

    def _to_list(self, value: object) -> list[str]:
        if isinstance(value, list):
            return [str(item) for item in value if str(item).strip()]
        return []

    def _node_stub(self, node: GraphNode) -> dict:
        return {
            "id": node.id,
            "title": node.title,
            "parentId": node.parentId,
            "level": node.level,
        }

    def _progress_payload(
        self, completed: int, total: int, current_item: str = ""
    ) -> dict:
        safe_total = max(total, 1)
        safe_completed = min(max(completed, 0), safe_total)
        payload = {
            "completed": safe_completed,
            "total": safe_total,
            "percent": int((safe_completed / safe_total) * 100),
        }
        if current_item:
            payload["currentItem"] = current_item
        return payload

    def _chunk_nodes(
        self, nodes: list[GraphNode], chunk_size: int
    ) -> list[list[GraphNode]]:
        if chunk_size <= 0:
            return [nodes]
        return [
            nodes[index : index + chunk_size]
            for index in range(0, len(nodes), chunk_size)
        ]


knowledge_graph_agent = KnowledgeGraphAgent()
