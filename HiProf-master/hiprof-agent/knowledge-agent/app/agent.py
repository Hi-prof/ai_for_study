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
    build_chapter_skeleton_prompt,
    build_course_overview_prompt,
    build_course_topic_expansion_prompt,
    build_deep_card_prompt,
    build_light_card_prompt,
    build_single_deep_card_prompt,
)
from .store import task_store


class KnowledgeGraphAgent:
    LIGHT_CARD_BATCH_SIZE = 6
    MAX_SOURCE_CHARS = 12000

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

    def _summarize_text(
        self, text: str, max_chars: int | None = None
    ) -> str:
        normalized = text.replace("\r\n", "\n").replace("\r", "\n")
        lines = [
            re.sub(r"\s+", " ", line).strip()
            for line in normalized.split("\n")
        ]
        cleaned = "\n".join(line for line in lines if line)
        return cleaned[: (max_chars or self.MAX_SOURCE_CHARS)]

    def _generate_skeleton(
        self, task: TaskRecord, request: GenerationRequest, source_summary: str
    ) -> tuple[list[GraphNode], str]:
        self._ensure_llm_enabled()
        if request.graphType == "1":
            return self._generate_chapter_skeleton(task, request, source_summary)
        return self._generate_course_skeleton(task, request, source_summary)

    def _generate_chapter_skeleton(
        self, task: TaskRecord, request: GenerationRequest, source_summary: str
    ) -> tuple[list[GraphNode], str]:
        system_prompt, user_prompt = build_chapter_skeleton_prompt(
            request.courseName,
            request.teacherRequirements,
            source_summary,
        )
        self._update(
            task,
            TaskStatus.running,
            TaskStage.generating_skeleton,
            "Generating chapter skeleton",
            progress=self._progress_payload(2, 4, "调用章节骨架模型"),
        )
        payload = llm_client.complete_json(
            system_prompt, user_prompt, model=settings.skeleton_model
        )
        self._update(
            task,
            TaskStatus.running,
            TaskStage.generating_skeleton,
            "Chapter skeleton raw result received",
            progress=self._progress_payload(3, 4, "整理章节节点关系"),
        )
        nodes, graph_title = self._normalize_flat_skeleton_payload(
            payload, request.courseName
        )
        self._update(
            task,
            TaskStatus.running,
            TaskStage.generating_skeleton,
            "Chapter skeleton normalized",
            progress=self._progress_payload(4, 4, "章节骨架整理完成"),
        )
        return nodes, graph_title

    def _generate_course_skeleton(
        self, task: TaskRecord, request: GenerationRequest, source_summary: str
    ) -> tuple[list[GraphNode], str]:
        target_plan = self._estimate_course_skeleton_plan(
            source_summary, request.teacherRequirements
        )
        self._update(
            task,
            TaskStatus.running,
            TaskStage.generating_skeleton,
            "Planning course skeleton size",
            progress=self._progress_payload(
                2,
                6,
                f"规划骨架规模：一级主题 {target_plan['top_level_min']}-{target_plan['top_level_max']} 个",
            ),
        )
        overview_system_prompt, overview_user_prompt = build_course_overview_prompt(
            request.courseName,
            request.teacherRequirements,
            source_summary,
            target_plan,
        )
        self._update(
            task,
            TaskStatus.running,
            TaskStage.generating_skeleton,
            "Generating top-level course topics",
            progress=self._progress_payload(3, 6, "生成总览节点与一级主题"),
        )
        overview_payload = llm_client.complete_json(
            overview_system_prompt,
            overview_user_prompt,
            model=settings.skeleton_model,
        )
        overview_nodes, graph_title = self._normalize_course_overview_payload(
            overview_payload,
            request.courseName,
            source_summary,
        )
        topic_nodes = [node for node in overview_nodes if node.parentId == "summary"]
        self._update(
            task,
            TaskStatus.running,
            TaskStage.generating_skeleton,
            "Top-level topics ready",
            progress=self._progress_payload(
                4,
                6,
                f"一级主题已生成，共 {len(topic_nodes)} 个",
            ),
        )
        expansion_system_prompt, expansion_user_prompt = (
            build_course_topic_expansion_prompt(
                request.courseName,
                request.teacherRequirements,
                source_summary,
                overview_nodes[0].title,
                [self._node_stub(node) for node in topic_nodes],
                target_plan,
            )
        )
        self._update(
            task,
            TaskStatus.running,
            TaskStage.generating_skeleton,
            "Expanding lower-level topics",
            progress=self._progress_payload(5, 6, "扩展二三级知识点"),
        )
        expansion_payload = llm_client.complete_json(
            expansion_system_prompt,
            expansion_user_prompt,
            model=settings.skeleton_model,
        )
        expansion_nodes = self._build_course_expansion_nodes(
            expansion_payload, topic_nodes
        )
        all_nodes = self._normalize_levels(overview_nodes + expansion_nodes)
        self._update(
            task,
            TaskStatus.running,
            TaskStage.generating_skeleton,
            "Course skeleton expanded",
            progress=self._progress_payload(
                6,
                6,
                f"骨架扩展完成，共 {len(all_nodes)} 个节点",
            ),
        )
        return all_nodes, graph_title

    def _estimate_course_skeleton_plan(
        self, source_summary: str, teacher_requirements: str
    ) -> dict[str, int | bool]:
        combined = "\n".join(
            part.strip()
            for part in [teacher_requirements, source_summary]
            if part and part.strip()
        )
        char_count = len(combined)
        line_count = len([line for line in combined.splitlines() if line.strip()])
        structure_hits = len(
            re.findall(
                r"(第[一二三四五六七八九十百]+[章节单元]|chapter\s+\d+|unit\s+\d+|module\s+\d+|专题|模块|单元|知识点|学习目标|重点|难点|\d+\.\d+)",
                combined,
                flags=re.IGNORECASE,
            )
        )

        top_level_min = 5
        if char_count > 1400:
            top_level_min += 1
        if char_count > 3200:
            top_level_min += 1
        if structure_hits > 8 or line_count > 16:
            top_level_min += 1
        top_level_max = min(top_level_min + 2, 10)

        child_min = 3
        if char_count > 1800 or line_count > 12:
            child_min += 1
        if char_count > 4200 or structure_hits > 12:
            child_min += 1
        child_max = min(child_min + 1, 7)

        allow_grandchildren = (
            char_count > 1200 or structure_hits > 6 or line_count > 10
        )
        grandchild_min = 0
        grandchild_max = 0
        if allow_grandchildren:
            grandchild_min = 1
            grandchild_max = 2
        if char_count > 4200 or structure_hits > 12:
            grandchild_min = 2
            grandchild_max = 3

        return {
            "top_level_min": top_level_min,
            "top_level_max": top_level_max,
            "child_min": child_min,
            "child_max": child_max,
            "grandchild_min": grandchild_min,
            "grandchild_max": grandchild_max,
            "allow_grandchildren": allow_grandchildren,
        }

    def _normalize_flat_skeleton_payload(
        self, payload: dict, fallback_title: str
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
        return self._normalize_levels(nodes), str(
            payload.get("graphTitle") or fallback_title
        )

    def _normalize_course_overview_payload(
        self, payload: dict, course_name: str, source_summary: str
    ) -> tuple[list[GraphNode], str]:
        summary_title = self._sanitize_summary_title(
            payload.get("summaryTitle"), course_name
        )
        if not summary_title:
            summary_title = self._sanitize_summary_title(source_summary, course_name)
        if not summary_title:
            summary_title = "课程内容总览"

        raw_topics = payload.get("topLevelTopics") or []
        topic_nodes: list[GraphNode] = []
        seen_titles: set[str] = set()
        for item in raw_topics:
            raw_title = item if isinstance(item, str) else item.get("title")
            title = self._sanitize_topic_title(raw_title)
            if not title or title in seen_titles:
                continue
            seen_titles.add(title)
            topic_nodes.append(
                GraphNode(
                    id=f"topic_{len(topic_nodes) + 1}",
                    title=title,
                    parentId="summary",
                    level=2,
                )
            )
        if not topic_nodes:
            raise RuntimeError("Remote LLM returned no top-level topics")

        nodes = [
            GraphNode(id="summary", title=summary_title, parentId=None, level=1),
            *topic_nodes,
        ]
        return nodes, str(payload.get("graphTitle") or course_name)

    def _build_course_expansion_nodes(
        self, payload: dict, topic_nodes: list[GraphNode]
    ) -> list[GraphNode]:
        raw_expansions = payload.get("topicExpansions") or []
        expansion_map = {
            str(item.get("topicId")): item
            for item in raw_expansions
            if isinstance(item, dict) and item.get("topicId")
        }
        nodes: list[GraphNode] = []
        for topic in topic_nodes:
            topic_payload = expansion_map.get(topic.id) or {}
            children = topic_payload.get("children") or []
            self._append_nested_nodes(
                nodes,
                parent_id=topic.id,
                items=children,
                level=topic.level + 1,
                prefix=f"{topic.id}_child",
            )
        if not nodes:
            raise RuntimeError("Remote LLM returned no expanded child topics")
        return nodes

    def _append_nested_nodes(
        self,
        collector: list[GraphNode],
        parent_id: str,
        items: list,
        level: int,
        prefix: str,
    ) -> None:
        for index, item in enumerate(items, start=1):
            if not isinstance(item, dict):
                continue
            title = self._sanitize_topic_title(item.get("title"))
            if not title:
                continue
            node_id = f"{prefix}_{index}"
            node = GraphNode(
                id=node_id,
                title=title,
                parentId=parent_id,
                level=level,
            )
            collector.append(node)
            nested_children = item.get("children") or []
            if nested_children:
                self._append_nested_nodes(
                    collector,
                    parent_id=node_id,
                    items=nested_children,
                    level=level + 1,
                    prefix=f"{node_id}_child",
                )

    def _sanitize_summary_title(self, value: object, course_name: str) -> str:
        cleaned = re.sub(r"\s+", " ", str(value or "")).strip(" ,，。；;：:-")
        if not cleaned:
            return ""
        if cleaned == course_name.strip():
            return f"{course_name.strip()}内容总览"
        sentence = re.split(r"[。！？；;]", cleaned, maxsplit=1)[0].strip()
        candidate = sentence or cleaned
        if len(candidate) > 24:
            candidate = candidate[:24].rstrip(" ,，。；;：:-") + "..."
        return candidate

    def _sanitize_topic_title(self, value: object) -> str:
        cleaned = re.sub(r"\s+", " ", str(value or "")).strip(" ,，。；;：:-")
        cleaned = re.sub(
            r"^(主题|Topic|知识点)\s*\d+\s*[:：-]?\s*",
            "",
            cleaned,
            flags=re.IGNORECASE,
        )
        if len(cleaned) > 28:
            cleaned = cleaned[:28].rstrip(" ,，。；;：:-") + "..."
        return cleaned

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
