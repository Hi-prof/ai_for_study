from __future__ import annotations

import unittest

from app import agent as agent_module
from app.agent import KnowledgeGraphAgent
from app.document_parser import parse_document
from app.models import GenerationRequest, GraphNode, TaskRecord


class KnowledgeGraphAgentTest(unittest.TestCase):
    def test_summarize_text_keeps_structural_lines_from_long_documents(self) -> None:
        agent = KnowledgeGraphAgent()
        lines = [f"普通内容 {index}" for index in range(120)]
        lines.insert(2, "第一章 课程导论")
        lines.insert(75, "第九章 期末综合实践")
        lines.append("课程结语与评价")

        summary = agent._summarize_text("\n".join(lines), max_chars=260)

        self.assertLessEqual(len(summary), 260)
        self.assertIn("第一章 课程导论", summary)
        self.assertIn("第九章 期末综合实践", summary)
        self.assertIn("课程结语与评价", summary)

    def test_limit_nodes_by_breadth_preserves_valid_tree(self) -> None:
        agent = KnowledgeGraphAgent()
        nodes = [
            GraphNode(id="root", title="课程", parentId=None),
            GraphNode(id="a", title="A", parentId="root"),
            GraphNode(id="b", title="B", parentId="root"),
            GraphNode(id="a1", title="A1", parentId="a"),
            GraphNode(id="b1", title="B1", parentId="b"),
        ]

        limited = agent._limit_nodes_by_breadth(nodes, max_nodes=4)

        self.assertEqual(["root", "a", "b", "a1"], [node.id for node in limited])
        limited_ids = {node.id for node in limited}
        self.assertTrue(
            all(node.parentId is None or node.parentId in limited_ids for node in limited)
        )

    def test_course_skeleton_saves_top_level_result_before_expansion(self) -> None:
        agent = KnowledgeGraphAgent()
        task = TaskRecord(request=GenerationRequest(courseName="课程"))
        responses = [
            {
                "graphTitle": "课程图谱",
                "summaryTitle": "课程总览",
                "topLevelTopics": [{"title": "主题一"}, {"title": "主题二"}],
            },
            {
                "topicExpansions": [
                    {"topicId": "topic_1", "children": [{"title": "子主题一"}]},
                    {"topicId": "topic_2", "children": [{"title": "子主题二"}]},
                ]
            },
        ]
        saved_snapshots = []
        original_complete_json = agent_module.llm_client.complete_json
        original_save = agent_module.task_store.save

        def fake_complete_json(*args, **kwargs):
            if len(responses) == 1:
                self.assertIsNotNone(task.result)
                self.assertEqual(
                    ["summary", "topic_1", "topic_2"],
                    [node.id for node in task.result.nodes],
                )
            return responses.pop(0)

        agent_module.llm_client.complete_json = fake_complete_json
        agent_module.task_store.save = lambda item: saved_snapshots.append(
            item.model_copy(deep=True)
        )

        try:
            nodes, graph_title = agent._generate_course_skeleton(
                task, task.request, "第一章 课程导论"
            )
        finally:
            agent_module.llm_client.complete_json = original_complete_json
            agent_module.task_store.save = original_save

        result_snapshots = [item for item in saved_snapshots if item.result is not None]
        self.assertEqual("课程图谱", graph_title)
        self.assertEqual(
            ["summary", "topic_1", "topic_2"],
            [node.id for node in result_snapshots[0].result.nodes],
        )
        self.assertEqual(5, len(nodes))

    def test_course_skeleton_saves_partial_result_after_each_topic_batch(self) -> None:
        agent = KnowledgeGraphAgent()
        task = TaskRecord(request=GenerationRequest(courseName="课程"))
        responses = [
            {
                "graphTitle": "课程图谱",
                "summaryTitle": "课程总览",
                "topLevelTopics": [
                    {"title": "主题一"},
                    {"title": "主题二"},
                    {"title": "主题三"},
                ],
            },
            {"topicExpansions": [{"topicId": "topic_1", "children": [{"title": "子主题一"}]}]},
            {"topicExpansions": [{"topicId": "topic_2", "children": [{"title": "子主题二"}]}]},
            {"topicExpansions": [{"topicId": "topic_3", "children": [{"title": "子主题三"}]}]},
        ]
        saved_snapshots = []
        original_batch_size = agent.COURSE_TOPIC_BATCH_SIZE
        original_complete_json = agent_module.llm_client.complete_json
        original_save = agent_module.task_store.save

        agent.COURSE_TOPIC_BATCH_SIZE = 1
        agent_module.llm_client.complete_json = lambda *args, **kwargs: responses.pop(0)
        agent_module.task_store.save = lambda item: saved_snapshots.append(
            item.model_copy(deep=True)
        )

        try:
            nodes, _graph_title = agent._generate_course_skeleton(
                task,
                task.request,
                "=== 课程资料 全文 ===\n主题一\n主题二\n主题三",
            )
        finally:
            agent.COURSE_TOPIC_BATCH_SIZE = original_batch_size
            agent_module.llm_client.complete_json = original_complete_json
            agent_module.task_store.save = original_save

        result_lengths = [
            len(item.result.nodes)
            for item in saved_snapshots
            if item.result is not None
        ]
        self.assertIn(4, result_lengths)
        self.assertIn(5, result_lengths)
        self.assertIn(6, result_lengths)
        self.assertIn(7, result_lengths)
        self.assertEqual(7, len(nodes))

    def test_parse_document_extracts_txt_with_source_marker(self) -> None:
        parsed = parse_document("课程资料.txt", "第一章 课程导论".encode("utf-8"))

        self.assertEqual("课程资料.txt", parsed["fileName"])
        self.assertEqual("txt", parsed["fileType"])
        self.assertIn("=== 课程资料.txt 全文 ===", parsed["text"])
        self.assertIn("第一章 课程导论", parsed["text"])

    def test_attach_source_refs_prefers_matching_section(self) -> None:
        agent = KnowledgeGraphAgent()
        nodes = [GraphNode(id="n1", title="线性表", parentId=None)]

        agent._attach_source_references(
            nodes,
            "=== 数据结构.pdf 第 1 页 ===\n栈和队列\n"
            "=== 数据结构.pdf 第 2 页 ===\n线性表的顺序存储和链式存储",
        )

        self.assertEqual("数据结构.pdf", nodes[0].sourceRefs[0].sourceName)
        self.assertEqual("第 2 页", nodes[0].sourceRefs[0].locator)
        self.assertIn("线性表", nodes[0].sourceRefs[0].excerpt)

    def test_light_card_generation_retries_missing_cards(self) -> None:
        agent = KnowledgeGraphAgent()
        nodes = [
            GraphNode(id="n1", title="节点一", parentId=None),
            GraphNode(id="n2", title="节点二", parentId="n1"),
        ]
        responses = [
            {
                "cards": [
                    {
                        "id": "n1",
                        "definition": "节点一定义",
                        "keywords": ["一"],
                        "example": "示例一",
                        "relatedKnowledge": ["节点二"],
                    }
                ]
            },
            {
                "cards": [
                    {
                        "id": "n2",
                        "definition": "节点二定义",
                        "keywords": ["二"],
                        "example": "示例二",
                        "relatedKnowledge": ["节点一"],
                    }
                ]
            },
        ]
        original_complete_json = agent_module.llm_client.complete_json
        agent_module.llm_client.complete_json = lambda *args, **kwargs: responses.pop(0)

        try:
            cards = agent._generate_light_cards_for_nodes("课程", "资料", nodes)
        finally:
            agent_module.llm_client.complete_json = original_complete_json

        self.assertEqual("节点一定义", cards["n1"].definition)
        self.assertEqual("节点二定义", cards["n2"].definition)


if __name__ == "__main__":
    unittest.main()
