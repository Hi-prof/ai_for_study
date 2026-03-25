from __future__ import annotations

import json


def build_skeleton_prompt(
    course_name: str,
    teacher_requirements: str,
    source_summary: str,
    graph_type: str = "0",
) -> tuple[str, str]:
    language_rule = (
        "All node titles, summaries, examples, and explanations must be written in Simplified Chinese. "
        "If the source material is in English, translate the knowledge points into natural Simplified Chinese. "
        "Only keep acronyms, formulas, or indispensable technical terms in their original language when necessary."
    )
    if graph_type == "1":
        system_prompt = (
            "You are a curriculum chapter planner. "
            "Return valid JSON only. Build a concise but complete chapter skeleton. "
            + language_rule
        )
        user_prompt = json.dumps(
            {
                "task": "Generate a chapter graph skeleton",
                "requirements": {
                    "courseName": course_name,
                    "teacherRequirements": teacher_requirements,
                    "sourceSummary": source_summary,
                    "rules": [
                        "Prefer 4 to 8 level-1 chapter topics.",
                        "Each level-1 topic may have 2 to 5 child topics.",
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

    system_prompt = (
        "You are a curriculum knowledge graph planner. "
        "Return valid JSON only. Build a concise but complete course skeleton with one overview node under the course root. "
        + language_rule
    )
    user_prompt = json.dumps(
        {
            "task": "Generate a knowledge graph skeleton",
            "requirements": {
                "courseName": course_name,
                "teacherRequirements": teacher_requirements,
                "sourceSummary": source_summary,
                "rules": [
                    "Do not output the course root node. The backend will create the root node with the course name.",
                    "Return exactly one level-1 overview node that summarizes all provided material.",
                    "All other nodes must be descendants of that overview node.",
                    "Prefer 3 to 6 level-2 topics under the overview node.",
                    "Each level-2 topic may have 2 to 5 child topics.",
                    "summaryTitle should be a concise overview phrase.",
                    "All returned content must be in Simplified Chinese.",
                    "Return JSON only.",
                ],
                "outputSchema": {
                    "graphTitle": "string",
                    "summaryTitle": "string",
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
                "All returned content must be in Simplified Chinese."
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
            "rules": [
                "All returned content must be in Simplified Chinese."
            ],
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
            "rules": [
                "All returned content must be in Simplified Chinese."
            ],
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
