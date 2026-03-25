from __future__ import annotations

import json


CHINESE_LANGUAGE_RULE = (
    "All node titles, summaries, examples, and explanations must be written in Simplified Chinese. "
    "If the source material is in English, translate the knowledge points into natural Simplified Chinese. "
    "Only keep acronyms, formulas, or indispensable technical terms in their original language when necessary."
)


def build_chapter_skeleton_prompt(
    course_name: str, teacher_requirements: str, source_summary: str
) -> tuple[str, str]:
    system_prompt = (
        "You are a curriculum chapter planner. "
        "Return valid JSON only. Build a concise but complete chapter skeleton. "
        + CHINESE_LANGUAGE_RULE
    )
    user_prompt = json.dumps(
        {
            "task": "Generate a chapter graph skeleton",
            "requirements": {
                "courseName": course_name,
                "teacherRequirements": teacher_requirements,
                "sourceSummary": source_summary,
                "rules": [
                    "Prefer 5 to 10 level-1 chapter topics when source material is rich.",
                    "Each level-1 topic may have 2 to 6 child topics.",
                    "Keep chapter titles concrete and classroom-usable.",
                    "All returned content must be in Simplified Chinese.",
                    "Return JSON only.",
                ],
                "outputSchema": {
                    "graphTitle": "string",
                    "nodes": [
                        {
                            "id": "string",
                            "title": "string",
                            "parentId": "string|null",
                            "level": "number",
                        }
                    ],
                },
            },
        },
        ensure_ascii=True,
    )
    return system_prompt, user_prompt


def build_course_overview_prompt(
    course_name: str,
    teacher_requirements: str,
    source_summary: str,
    target_plan: dict[str, int | bool],
) -> tuple[str, str]:
    top_level_min = int(target_plan.get("top_level_min") or 6)
    top_level_max = int(target_plan.get("top_level_max") or 9)
    system_prompt = (
        "You are a curriculum knowledge graph architect. "
        "Return valid JSON only. First build the overview node and the top-level knowledge topics of the course. "
        + CHINESE_LANGUAGE_RULE
    )
    user_prompt = json.dumps(
        {
            "task": "Generate a course overview node and top-level topics for a knowledge graph",
            "requirements": {
                "courseName": course_name,
                "teacherRequirements": teacher_requirements,
                "sourceSummary": source_summary,
                "targetPlan": target_plan,
                "rules": [
                    "Do not output the course root node. The backend will create the root node with the course name.",
                    "Return exactly one overview node that summarizes the whole course material.",
                    f"Return {top_level_min} to {top_level_max} top-level topics under the overview node. If the material is dense, stay near the upper bound.",
                    "Top-level topics should collectively cover the major knowledge areas and avoid obvious overlap.",
                    "Avoid vague nodes such as 其他、补充、杂项 unless the source material clearly requires them.",
                    "All returned content must be in Simplified Chinese.",
                    "Return JSON only.",
                ],
                "outputSchema": {
                    "graphTitle": "string",
                    "summaryTitle": "string",
                    "topLevelTopics": [{"title": "string"}],
                },
            },
        },
        ensure_ascii=True,
    )
    return system_prompt, user_prompt


def build_course_topic_expansion_prompt(
    course_name: str,
    teacher_requirements: str,
    source_summary: str,
    summary_title: str,
    topics: list[dict],
    target_plan: dict[str, int | bool],
) -> tuple[str, str]:
    child_min = int(target_plan.get("child_min") or 3)
    child_max = int(target_plan.get("child_max") or 5)
    grandchild_min = int(target_plan.get("grandchild_min") or 0)
    grandchild_max = int(target_plan.get("grandchild_max") or 0)
    allow_grandchildren = bool(target_plan.get("allow_grandchildren"))
    system_prompt = (
        "You are a curriculum knowledge graph architect. "
        "Return valid JSON only. Expand each top-level topic into a richer multi-level knowledge skeleton. "
        + CHINESE_LANGUAGE_RULE
    )
    rules = [
        f"For each top-level topic, generate {child_min} to {child_max} direct child topics.",
        "Children under the same parent should stay at the same granularity.",
        "Prefer concrete knowledge points, methods, principles, cases, structures, or problem types instead of generic placeholders.",
        "Avoid repeating the same child titles under different top-level topics unless the repetition is necessary and explicitly justified by the source.",
        "All returned content must be in Simplified Chinese.",
        "Return JSON only.",
    ]
    if allow_grandchildren:
        rules.insert(
            1,
            f"For broad or information-dense child topics, add {grandchild_min} to {grandchild_max} grandchildren under that child topic.",
        )

    user_prompt = json.dumps(
        {
            "task": "Expand top-level course topics into second-level and optional third-level knowledge nodes",
            "requirements": {
                "courseName": course_name,
                "teacherRequirements": teacher_requirements,
                "sourceSummary": source_summary,
                "summaryTitle": summary_title,
                "topics": topics,
                "targetPlan": target_plan,
                "rules": rules,
                "outputSchema": {
                    "topicExpansions": [
                        {
                            "topicId": "string",
                            "children": [
                                {
                                    "title": "string",
                                    "children": [{"title": "string"}],
                                }
                            ],
                        }
                    ]
                },
            },
        },
        ensure_ascii=True,
    )
    return system_prompt, user_prompt


def build_light_card_prompt(
    course_name: str, source_summary: str, nodes: list[dict]
) -> tuple[str, str]:
    system_prompt = (
        "You enrich course graph nodes with lightweight cards. "
        "Return valid JSON only. Keep each card concise and classroom friendly. "
        "All card content must be in Simplified Chinese. Translate English source concepts into natural Chinese when needed."
    )
    user_prompt = json.dumps(
        {
            "task": "Generate lightweight cards for graph nodes",
            "courseName": course_name,
            "sourceSummary": source_summary,
            "nodes": nodes,
            "rules": [
                "If a node is the overall overview node, its definition should summarize the full source material.",
                "All returned content must be in Simplified Chinese.",
            ],
            "outputSchema": {
                "cards": [
                    {
                        "id": "string",
                        "definition": "string",
                        "keywords": ["string"],
                        "example": "string",
                        "relatedKnowledge": ["string"],
                    }
                ]
            },
        },
        ensure_ascii=True,
    )
    return system_prompt, user_prompt


def build_deep_card_prompt(
    course_name: str, source_summary: str, nodes: list[dict]
) -> tuple[str, str]:
    system_prompt = (
        "You generate deep learning cards for important curriculum nodes. "
        "Return valid JSON only and focus on depth rather than breadth. "
        "All card content must be in Simplified Chinese. Translate English source concepts into natural Chinese when needed."
    )
    user_prompt = json.dumps(
        {
            "task": "Generate deep cards for focus nodes",
            "courseName": course_name,
            "sourceSummary": source_summary,
            "nodes": nodes,
            "rules": ["All returned content must be in Simplified Chinese."],
            "outputSchema": {
                "cards": [
                    {
                        "id": "string",
                        "detailedDefinition": "string",
                        "coreFeatures": ["string"],
                        "applicationScenarios": ["string"],
                        "commonQuestions": ["string"],
                        "relatedExplanation": "string",
                        "references": ["string"],
                    }
                ]
            },
        },
        ensure_ascii=True,
    )
    return system_prompt, user_prompt


def build_single_deep_card_prompt(
    course_name: str, source_summary: str, node: dict
) -> tuple[str, str]:
    system_prompt = (
        "You generate one deep learning card for a teacher-selected curriculum node. "
        "Return valid JSON only. Be specific, accurate, and useful for teaching. "
        "All card content must be in Simplified Chinese. Translate English source concepts into natural Chinese when needed."
    )
    user_prompt = json.dumps(
        {
            "task": "Generate a deep card for one selected node",
            "courseName": course_name,
            "sourceSummary": source_summary,
            "node": node,
            "rules": ["All returned content must be in Simplified Chinese."],
            "outputSchema": {
                "deepCard": {
                    "detailedDefinition": "string",
                    "coreFeatures": ["string"],
                    "applicationScenarios": ["string"],
                    "commonQuestions": ["string"],
                    "relatedExplanation": "string",
                    "references": ["string"],
                }
            },
        },
        ensure_ascii=True,
    )
    return system_prompt, user_prompt
