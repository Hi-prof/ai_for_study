from __future__ import annotations

import re
from collections import Counter

from .llm import llm_client
from .models import (
    DeepCard,
    GenerationRequest,
    GraphNode,
    KnowledgeGraphResult,
    LightweightCard,
    TaskRecord,
    TaskStage,
    TaskStatus,
    ValidationResult,
)
from .pdf import extract_pdf_text
from .prompts import (
    build_deep_card_prompt,
    build_light_card_prompt,
    build_skeleton_prompt,
)
from .store import task_store


class KnowledgeGraphAgent:
    def run_task(self, task_id: str) -> None:
        task = task_store.get(task_id)
        if task is None:
            return

        try:
            self._update(
                task, TaskStatus.running, TaskStage.loading_sources, "Loading sources"
            )
            source_summary = self._load_sources(task.request)

            self._update(
                task,
                TaskStatus.running,
                TaskStage.generating_skeleton,
                "Generating skeleton",
            )
            nodes, graph_title = self._generate_skeleton(task.request, source_summary)

            self._update(
                task,
                TaskStatus.running,
                TaskStage.generating_light_cards,
                "Generating lightweight cards",
            )
            self._generate_light_cards(task.request, source_summary, nodes)

            self._update(
                task,
                TaskStatus.running,
                TaskStage.generating_deep_cards,
                "Generating deep cards",
            )
            self._generate_deep_cards(task.request, source_summary, nodes)

            self._update(
                task, TaskStatus.running, TaskStage.validating, "Validating graph"
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
            )
        except Exception as exc:
            task.error = str(exc)
            self._update(task, TaskStatus.failed, TaskStage.failed, "Generation failed")

    def _update(
        self, task: TaskRecord, status: TaskStatus, stage: TaskStage, message: str
    ) -> None:
        task.status = status
        task.stage = stage
        task.message = message
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
        self, request: GenerationRequest, source_summary: str
    ) -> tuple[list[GraphNode], str]:
        if llm_client.enabled:
            system_prompt, user_prompt = build_skeleton_prompt(
                request.courseName,
                request.teacherRequirements,
                source_summary,
            )
            payload = llm_client.complete_json(system_prompt, user_prompt)
            return self._normalize_skeleton_payload(
                payload, request.courseName, source_summary
            )
        return self._fallback_skeleton(request.courseName, source_summary)

    def _normalize_skeleton_payload(
        self, payload: dict, fallback_title: str, source_summary: str
    ) -> tuple[list[GraphNode], str]:
        raw_nodes = payload.get("nodes") or []
        nodes: list[GraphNode] = []
        seen: set[str] = set()
        for index, item in enumerate(raw_nodes, start=1):
            node_id = str(item.get("id") or f"n{index}")
            if node_id in seen:
                node_id = f"{node_id}_{index}"
            seen.add(node_id)
            nodes.append(
                GraphNode(
                    id=node_id,
                    title=str(item.get("title") or f"Topic {index}"),
                    parentId=item.get("parentId"),
                    level=int(item.get("level") or (2 if item.get("parentId") else 1)),
                )
            )
        if not nodes:
            return self._fallback_skeleton(fallback_title, source_summary)
        return nodes, str(payload.get("graphTitle") or fallback_title)

    def _fallback_skeleton(
        self, course_name: str, source_summary: str
    ) -> tuple[list[GraphNode], str]:
        candidates = self._extract_topics(source_summary)
        top_topics = candidates[:6] or [
            "Course Overview",
            "Core Concepts",
            "Methods and Processes",
            "Applications",
        ]
        nodes: list[GraphNode] = []
        for index, topic in enumerate(top_topics, start=1):
            parent_id = f"t{index}"
            nodes.append(GraphNode(id=parent_id, title=topic, parentId=None, level=1))
            for child_index, child in enumerate(self._derive_children(topic), start=1):
                nodes.append(
                    GraphNode(
                        id=f"{parent_id}-{child_index}",
                        title=child,
                        parentId=parent_id,
                        level=2,
                    )
                )
        return nodes, course_name

    def _extract_topics(self, text: str) -> list[str]:
        splitters = re.split(r"[.;:!?,()\[\]{}\\/\-|\n]", text)
        words = []
        for part in splitters:
            segment = part.strip()
            if len(segment) < 4:
                continue
            if segment.lower().startswith("chapter"):
                words.append(segment.title())
                continue
            words.extend(re.findall(r"[A-Za-z][A-Za-z0-9 ]{3,40}", segment))
        counter = Counter(
            item.strip().title() for item in words if len(item.strip()) >= 4
        )
        return [item for item, _ in counter.most_common(8)]

    def _derive_children(self, topic: str) -> list[str]:
        return [
            f"{topic} Definition",
            f"{topic} Key Points",
            f"{topic} Examples",
        ]

    def _generate_light_cards(
        self, request: GenerationRequest, source_summary: str, nodes: list[GraphNode]
    ) -> None:
        if llm_client.enabled:
            system_prompt, user_prompt = build_light_card_prompt(
                request.courseName,
                source_summary,
                [self._node_stub(node) for node in nodes],
            )
            payload = llm_client.complete_json(system_prompt, user_prompt)
            cards = {str(item.get("id")): item for item in payload.get("cards") or []}
        else:
            cards = {}
        for node in nodes:
            card = cards.get(node.id) or self._fallback_light_card(node, nodes)
            node.lightweightCard = LightweightCard(
                definition=str(
                    card.get("definition")
                    or f"{node.title} is an important concept in {request.courseName}."
                ),
                keywords=self._to_list(card.get("keywords"))
                or self._default_keywords(node.title),
                example=str(
                    card.get("example")
                    or f"Use {node.title} in a classroom explanation or exercise."
                ),
                relatedKnowledge=self._to_list(card.get("relatedKnowledge"))
                or self._related_titles(node, nodes),
            )

    def _generate_deep_cards(
        self, request: GenerationRequest, source_summary: str, nodes: list[GraphNode]
    ) -> None:
        focus_nodes = self._pick_focus_nodes(request, nodes)
        if not focus_nodes:
            return
        if llm_client.enabled:
            system_prompt, user_prompt = build_deep_card_prompt(
                request.courseName,
                source_summary,
                [self._node_stub(node) for node in focus_nodes],
            )
            payload = llm_client.complete_json(system_prompt, user_prompt)
            cards = {str(item.get("id")): item for item in payload.get("cards") or []}
        else:
            cards = {}
        for node in focus_nodes:
            node.isFocus = True
            card = cards.get(node.id) or self._fallback_deep_card(
                node, request.courseName
            )
            node.deepCard = DeepCard(
                detailedDefinition=str(
                    card.get("detailedDefinition")
                    or f"{node.title} is a key topic in {request.courseName}."
                ),
                coreFeatures=self._to_list(card.get("coreFeatures"))
                or ["Core idea", "Typical structure", "Learning value"],
                applicationScenarios=self._to_list(card.get("applicationScenarios"))
                or ["Teaching explanation", "Exercises", "Practical use"],
                commonQuestions=self._to_list(card.get("commonQuestions"))
                or [f"What is {node.title}?", f"Why does {node.title} matter?"],
                relatedExplanation=str(
                    card.get("relatedExplanation")
                    or f"{node.title} connects to adjacent topics in the same course graph."
                ),
                references=self._to_list(card.get("references"))
                or [request.courseName],
            )

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

    def _fallback_light_card(self, node: GraphNode, nodes: list[GraphNode]) -> dict:
        return {
            "definition": f"{node.title} is a foundational learning point in the current course map.",
            "keywords": self._default_keywords(node.title),
            "example": f"Explain {node.title} with one concept description and one classroom case.",
            "relatedKnowledge": self._related_titles(node, nodes),
        }

    def _fallback_deep_card(self, node: GraphNode, course_name: str) -> dict:
        return {
            "detailedDefinition": f"{node.title} is expanded as a focus topic for {course_name}, covering concept, method, and practical usage.",
            "coreFeatures": ["Definition", "Key structure", "Common variants"],
            "applicationScenarios": [
                "Course teaching",
                "Assignments",
                "Scenario analysis",
            ],
            "commonQuestions": [
                f"How do we understand {node.title}?",
                f"How is {node.title} applied?",
            ],
            "relatedExplanation": f"{node.title} should be learned together with its prerequisite and related child concepts.",
            "references": [course_name, node.title],
        }

    def _default_keywords(self, title: str) -> list[str]:
        words = [word for word in re.split(r"\s+", title) if word]
        return words[:3] or [title]

    def _related_titles(self, node: GraphNode, nodes: list[GraphNode]) -> list[str]:
        related = []
        for candidate in nodes:
            if candidate.id == node.id:
                continue
            if (
                candidate.parentId == node.parentId
                or candidate.parentId == node.id
                or node.parentId == candidate.id
            ):
                related.append(candidate.title)
        return related[:4]

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


knowledge_graph_agent = KnowledgeGraphAgent()
