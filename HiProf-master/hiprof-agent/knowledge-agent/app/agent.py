from __future__ import annotations

import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

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
    SourceReference,
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
    COURSE_TOPIC_BATCH_SIZE = max(settings.course_topic_batch_size, 1)
    LIGHT_CARD_BATCH_SIZE = max(settings.light_card_batch_size, 1)
    LIGHT_CARD_CONCURRENCY = max(settings.light_card_concurrency, 1)
    LIGHT_CARD_MAX_ATTEMPTS = 2
    MAX_INITIAL_NODES = max(settings.max_initial_nodes, 8)
    MAX_SOURCE_CHARS = max(settings.max_source_chars, 4000)
    STRUCTURE_LINE_PATTERN = re.compile(
        r"(第[一二三四五六七八九十百\d]+[章节单元]|chapter\s+\d+|unit\s+\d+|module\s+\d+|"
        r"专题|模块|单元|知识点|学习目标|重点|难点|\d+[.、]\d*)",
        flags=re.IGNORECASE,
    )

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
        self._attach_source_references(nodes, source_summary)
        task.result = KnowledgeGraphResult(
            graphTitle=graph_title,
            nodes=nodes,
            validation=ValidationResult(
                isValid=True,
                warnings=[],
                stats=self._validation_stats(nodes),
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
        limit = max_chars or self.MAX_SOURCE_CHARS
        normalized = text.replace("\r\n", "\n").replace("\r", "\n")
        lines = [
            re.sub(r"\s+", " ", line).strip()
            for line in normalized.split("\n")
        ]
        cleaned = "\n".join(line for line in lines if line)
        if len(cleaned) <= limit:
            return cleaned

        non_empty_lines = [line for line in lines if line]
        head_lines = self._fit_lines(non_empty_lines[:8], max(limit // 4, 1))
        tail_lines = self._fit_lines(non_empty_lines[-6:], max(limit // 4, 1))
        reserved = len("\n".join([*head_lines, *tail_lines])) + 2
        middle_budget = max(limit - reserved, 0)
        head_set = set(head_lines)
        tail_set = set(tail_lines)
        structure_lines = [
            line
            for line in non_empty_lines
            if line not in head_set
            and line not in tail_set
            and self.STRUCTURE_LINE_PATTERN.search(line)
        ]
        middle_lines = self._fit_lines(structure_lines, middle_budget)
        summary = "\n".join([*head_lines, *middle_lines, *tail_lines]).strip()
        return summary[:limit]

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
        self._save_partial_result(task, graph_title, overview_nodes, source_summary)
        self._update(
            task,
            TaskStatus.running,
            TaskStage.generating_skeleton,
            "Top-level topics ready",
            progress=self._progress_payload(
                4,
                6,
                f"一级节点已生成，共 {len(topic_nodes)} 个，正在继续扩展二三级节点",
            ),
        )
        topic_batches = self._chunk_nodes(topic_nodes, self.COURSE_TOPIC_BATCH_SIZE)
        self._update(
            task,
            TaskStatus.running,
            TaskStage.generating_skeleton,
            "Expanding lower-level topics by batch",
            progress=self._progress_payload(
                0, len(topic_batches), "开始按一级主题分批扩展二三级知识点"
            ),
        )

        expansion_nodes: list[GraphNode] = []
        for batch_index, topic_batch in enumerate(topic_batches, start=1):
            expansion_system_prompt, expansion_user_prompt = (
                build_course_topic_expansion_prompt(
                    request.courseName,
                    request.teacherRequirements,
                    source_summary,
                    overview_nodes[0].title,
                    [self._node_stub(node) for node in topic_batch],
                    target_plan,
                )
            )
            expansion_payload = llm_client.complete_json(
                expansion_system_prompt,
                expansion_user_prompt,
                model=settings.skeleton_model,
            )
            expansion_nodes.extend(
                self._build_course_expansion_nodes(expansion_payload, topic_batch)
            )
            partial_nodes = self._normalize_levels(overview_nodes + expansion_nodes)
            partial_nodes = self._limit_nodes_by_breadth(
                partial_nodes, self.MAX_INITIAL_NODES
            )
            partial_nodes = self._normalize_levels(partial_nodes)
            self._save_partial_result(task, graph_title, partial_nodes, source_summary)
            self._update(
                task,
                TaskStatus.running,
                TaskStage.generating_skeleton,
                f"Expanded lower-level topics batch {batch_index}/{len(topic_batches)}",
                progress=self._progress_payload(
                    batch_index,
                    len(topic_batches),
                    f"已扩展第 {batch_index}/{len(topic_batches)} 批一级节点",
                ),
            )

        all_nodes = self._normalize_levels(overview_nodes + expansion_nodes)
        all_nodes = self._limit_nodes_by_breadth(all_nodes, self.MAX_INITIAL_NODES)
        all_nodes = self._normalize_levels(all_nodes)
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

    def _limit_nodes_by_breadth(
        self, nodes: list[GraphNode], max_nodes: int
    ) -> list[GraphNode]:
        if max_nodes <= 0 or len(nodes) <= max_nodes:
            return nodes

        children_map: dict[str, list[GraphNode]] = {}
        roots: list[GraphNode] = []
        for node in nodes:
            if node.parentId is None:
                roots.append(node)
            else:
                children_map.setdefault(node.parentId, []).append(node)

        queue = [*roots]
        selected: list[GraphNode] = []
        selected_ids: set[str] = set()
        while queue and len(selected) < max_nodes:
            current = queue.pop(0)
            if current.id in selected_ids:
                continue
            if current.parentId is not None and current.parentId not in selected_ids:
                continue
            selected.append(current)
            selected_ids.add(current.id)
            queue.extend(children_map.get(current.id, []))

        return selected or nodes[:max_nodes]

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

        completed = 0
        chunks = self._chunk_nodes(nodes, self.LIGHT_CARD_BATCH_SIZE)
        max_workers = min(self.LIGHT_CARD_CONCURRENCY, len(chunks))
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_map = {
                executor.submit(
                    self._generate_light_cards_for_nodes,
                    request.courseName,
                    source_summary,
                    node_chunk,
                ): node_chunk
                for node_chunk in chunks
            }
            for future in as_completed(future_map):
                node_chunk = future_map[future]
                cards = future.result()
                self._apply_light_cards(node_chunk, cards)
                completed += len(node_chunk)
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

    def _generate_light_cards_for_nodes(
        self, course_name: str, source_summary: str, nodes: list[GraphNode]
    ) -> dict[str, LightweightCard]:
        remaining = [*nodes]
        cards: dict[str, LightweightCard] = {}

        for _attempt in range(self.LIGHT_CARD_MAX_ATTEMPTS):
            system_prompt, user_prompt = build_light_card_prompt(
                course_name,
                source_summary,
                [self._node_stub(node) for node in remaining],
            )
            payload = llm_client.complete_json(
                system_prompt, user_prompt, model=settings.card_model
            )
            raw_cards = {
                str(item.get("id")): item
                for item in payload.get("cards") or []
                if isinstance(item, dict) and item.get("id")
            }
            for node in remaining:
                card = raw_cards.get(node.id)
                if card is None or not str(card.get("definition") or "").strip():
                    continue
                cards[node.id] = LightweightCard(
                    definition=str(card.get("definition") or ""),
                    keywords=self._to_list(card.get("keywords")),
                    example=str(card.get("example") or ""),
                    relatedKnowledge=self._to_list(card.get("relatedKnowledge")),
                )
            remaining = [node for node in remaining if node.id not in cards]
            if not remaining:
                return cards

        missing = "、".join(f"{node.id}({node.title})" for node in remaining)
        raise RuntimeError(f"Remote LLM returned no light card for nodes: {missing}")

    def _apply_light_cards(
        self, nodes: list[GraphNode], cards: dict[str, LightweightCard]
    ) -> None:
        for node in nodes:
            card = cards.get(node.id)
            if card is None:
                raise RuntimeError(
                    f"Remote LLM returned no light card for node {node.id}"
                )
            node.lightweightCard = card

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
        seen_titles: set[str] = set()
        for node in nodes:
            if node.parentId and node.parentId not in node_ids:
                warnings.append(f"Missing parent for node {node.id}")
            if not node.lightweightCard.definition:
                warnings.append(
                    f"Lightweight card missing definition for node {node.id}"
                )
            normalized_title = node.title.strip()
            if normalized_title in seen_titles:
                warnings.append(f"Duplicate node title: {node.title}")
            seen_titles.add(normalized_title)
            if node.level > 4:
                warnings.append(f"Node level is too deep for {node.id}")
        if len(nodes) < 4:
            warnings.append("Graph contains too few nodes")
        return ValidationResult(
            isValid=not warnings,
            warnings=warnings,
            stats=self._validation_stats(nodes),
        )

    def _validation_stats(self, nodes: list[GraphNode]) -> dict:
        return {
            "totalNodes": len(nodes),
            "focusNodes": sum(1 for node in nodes if node.isFocus),
            "lightCards": sum(
                1 for node in nodes if node.lightweightCard.definition
            ),
            "deepCards": sum(1 for node in nodes if node.deepCard is not None),
            "sourceReferencedNodes": sum(1 for node in nodes if node.sourceRefs),
        }

    def _attach_source_references(
        self, nodes: list[GraphNode], source_summary: str
    ) -> None:
        sections = self._extract_source_sections(source_summary)
        if not sections:
            return
        for node in nodes:
            node.sourceRefs = self._infer_source_references(node.title, sections)

    def _extract_source_sections(self, source_summary: str) -> list[dict[str, str]]:
        lines = source_summary.splitlines()
        sections: list[dict[str, str]] = []
        current: dict[str, str] | None = None
        current_lines: list[str] = []

        def flush() -> None:
            if current is None:
                return
            text = "\n".join(line.strip() for line in current_lines if line.strip())
            if text:
                sections.append({**current, "text": text})

        for line in lines:
            marker_match = re.match(r"^===\s*(.+?)\s*===$", line.strip())
            if marker_match:
                flush()
                current = self._parse_source_marker(marker_match.group(1))
                current_lines = []
                continue
            if current is None:
                current = {
                    "sourceName": "教师输入与课程资料",
                    "locator": "摘要",
                }
            current_lines.append(line)

        flush()
        return sections

    def _parse_source_marker(self, marker: str) -> dict[str, str]:
        marker = re.sub(r"\s+", " ", marker).strip()
        locator_match = re.search(
            r"(第\s*\d+\s*页|幻灯片\s*\d+|正文|全文|header\d*|footer\d*)$",
            marker,
            flags=re.IGNORECASE,
        )
        if not locator_match:
            return {"sourceName": marker, "locator": ""}

        locator = locator_match.group(1).strip()
        source_name = marker[: locator_match.start()].strip()
        return {
            "sourceName": source_name or marker,
            "locator": locator,
        }

    def _infer_source_references(
        self, title: str, sections: list[dict[str, str]]
    ) -> list[SourceReference]:
        tokens = self._source_match_tokens(title)
        scored_sections: list[tuple[int, dict[str, str], str]] = []
        for section in sections:
            text = section["text"]
            score = 0
            best_token = ""
            if title and title in text:
                score += 10
                best_token = title
            for token in tokens:
                if token in text:
                    score += 1
                    if not best_token or len(token) > len(best_token):
                        best_token = token
            if score > 0:
                scored_sections.append((score, section, best_token))

        if not scored_sections:
            return []

        scored_sections.sort(key=lambda item: item[0], reverse=True)
        references = []
        for _score, section, token in scored_sections[:2]:
            references.append(
                SourceReference(
                    sourceName=section["sourceName"],
                    locator=section["locator"],
                    excerpt=self._source_excerpt(section["text"], token),
                )
            )
        return references

    def _source_match_tokens(self, title: str) -> list[str]:
        cleaned = re.sub(r"[^\w\u4e00-\u9fff]+", " ", title).strip()
        parts = [part for part in cleaned.split() if len(part) >= 2]
        if parts:
            return parts[:6]

        compact = cleaned.replace(" ", "")
        tokens = []
        for size in (6, 5, 4, 3, 2):
            for index in range(0, max(len(compact) - size + 1, 0)):
                token = compact[index : index + size]
                if token and token not in tokens:
                    tokens.append(token)
                if len(tokens) >= 6:
                    return tokens
        return tokens

    def _source_excerpt(self, text: str, token: str) -> str:
        normalized = re.sub(r"\s+", " ", text).strip()
        if not normalized:
            return ""
        index = normalized.find(token) if token else -1
        if index < 0:
            return normalized[:120]
        start = max(index - 40, 0)
        end = min(index + len(token) + 80, len(normalized))
        return normalized[start:end]

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

    def _fit_lines(self, lines: list[str], max_chars: int) -> list[str]:
        selected: list[str] = []
        used = 0
        for line in lines:
            candidate = line if len(line) <= max_chars else line[:max_chars].rstrip()
            if not candidate:
                continue
            cost = len(candidate) + (1 if selected else 0)
            if used + cost > max_chars:
                continue
            selected.append(candidate)
            used += cost
        return selected


knowledge_graph_agent = KnowledgeGraphAgent()
