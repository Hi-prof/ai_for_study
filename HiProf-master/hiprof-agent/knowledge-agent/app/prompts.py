from __future__ import annotations

import json


def build_skeleton_prompt(
    course_name: str, teacher_requirements: str, source_summary: str
) -> tuple[str, str]:
    system_prompt = (
        "You are a curriculum knowledge graph planner. "
        "Return valid JSON only. Build a concise but complete course skeleton."
    )
    user_prompt = json.dumps(
        {
            "task": "Generate a knowledge graph skeleton",
            "requirements": {
                "courseName": course_name,
                "teacherRequirements": teacher_requirements,
                "sourceSummary": source_summary,
                "rules": [
                    "Prefer 4 to 8 level-1 topics.",
                    "Each level-1 topic may have 2 to 5 level-2 topics.",
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


def build_light_card_prompt(
    course_name: str, source_summary: str, nodes: list[dict]
) -> tuple[str, str]:
    system_prompt = (
        "You enrich course graph nodes with lightweight cards. "
        "Return valid JSON only. Keep each card concise and classroom friendly."
    )
    user_prompt = json.dumps(
        {
            "task": "Generate lightweight cards for graph nodes",
            "courseName": course_name,
            "sourceSummary": source_summary,
            "nodes": nodes,
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
        "Return valid JSON only and focus on depth rather than breadth."
    )
    user_prompt = json.dumps(
        {
            "task": "Generate deep cards for focus nodes",
            "courseName": course_name,
            "sourceSummary": source_summary,
            "nodes": nodes,
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
