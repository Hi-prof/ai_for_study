<template>
  <div class="node-creation-service">
    <!-- 隐藏的TextNodeParser组件引用 -->
    <TextNodeParser ref="textNodeParserRef" style="display: none;" />
  </div>
</template>

<script setup>
import { ref, defineEmits, defineExpose } from 'vue';
import TextNodeParser from '../../textparser/TextNodeParser.vue';
import { createNode } from '@/api/node';

// 定义事件
const emit = defineEmits([
  'node-creation-progress',
  'node-creation-result',
  'node-creation-complete',
  'node-creation-error'
]);

// TextNodeParser组件引用
const textNodeParserRef = ref(null);

// 创建知识图谱节点的函数（基于TextNodeParser但创建知识图谱节点）
const createKnowledgeGraphNodes = async (text, graphId, options = {}) => {
  if (!text || !text.trim()) {
    throw new Error('请提供要解析的文本内容');
  }

  if (!graphId) {
    throw new Error('请提供知识图谱ID');
  }

  if (!textNodeParserRef.value) {
    throw new Error('TextNodeParser组件未加载');
  }

  const results = {
    success: [],
    failed: [],
    total: 0,
    progress: 0
  };

  const onProgress = options.onProgress || (() => {});
  const onResult = options.onResult || (() => {});
  const parentNodeId = options.parentNodeId || null; // 获取指定的父节点ID

  try {
    // 使用TextNodeParser解析文本
    const nodes = textNodeParserRef.value.parseText(text);
    if (nodes.length === 0) {
      throw new Error('未识别到有效的节点格式');
    }

    // 计算总节点数（包括子节点）
    const countAllNodes = (nodeList) => {
      let count = 0;
      nodeList.forEach(node => {
        count++;
        if (node.children) {
          count += countAllNodes(node.children);
        }
      });
      return count;
    };

    const totalNodes = countAllNodes(nodes);
    results.total = totalNodes;
    let createdCount = 0;

    // 递归创建知识图谱节点
    const createNodesRecursively = async (nodeList, parentId = null) => {
      for (const node of nodeList) {
        try {
          const progressMessage = `正在创建知识图谱节点: ${node.title} (层级: ${node.level})`;
          onProgress(progressMessage);
          emit('node-creation-progress', {
            message: progressMessage,
            current: createdCount + 1,
            total: totalNodes,
            progress: Math.round(((createdCount + 1) / totalNodes) * 100)
          });

          // 构建知识图谱节点数据
          const nodeData = {
            name: node.title,
            content: node.content || `${node.number} ${node.title}`, // 使用解析出的内容，如果没有则使用默认格式
            parentId: parentId,
            graphId: graphId
          };

          console.log('🔵 创建节点，请求数据:', nodeData);

          const response = await createNode(nodeData);

          // 检查响应是否成功
          const isSuccess = response && (
            response.code === 200 ||
            response.code === '200' ||
            (!response.error && !response.code) ||
            response.success === true
          );

          if (isSuccess) {
            // 获取创建的节点ID
            let currentId = null;
            if (response.data && typeof response.data === 'object') {
              currentId = response.data.id || response.data.nodeId;
            } else if (typeof response.data === 'number' || typeof response.data === 'string') {
              currentId = response.data;
            } else if (response.id) {
              currentId = response.id;
            }

            // 记录成功结果
            const result = {
              id: node.id,
              title: node.title, // 节点名称
              content: node.content, // 节点内容（AI生成的context部分）
              success: true,
              nodeId: currentId,
              level: node.level
            };
            results.success.push(result);
            onResult(result);
            emit('node-creation-result', result);

            // 如果有子节点，递归创建
            if (node.children && node.children.length > 0 && currentId) {
              await createNodesRecursively(node.children, currentId);
            }
          } else {
            throw new Error(response?.msg || response?.message || '创建失败');
          }

          createdCount++;
          results.progress = Math.round((createdCount / totalNodes) * 100);

        } catch (error) {
          console.error(`创建知识图谱节点失败: ${node.title}`, error);

          const result = {
            id: node.id,
            title: node.title, // 节点名称
            content: node.content, // 节点内容
            success: false,
            error: error.message || '创建失败',
            level: node.level
          };
          results.failed.push(result);
          onResult(result);
          emit('node-creation-result', result);
          
          createdCount++;
          results.progress = Math.round((createdCount / totalNodes) * 100);
        }
      }
    };

    // 开始创建节点，一级节点使用用户选择的父节点ID
    await createNodesRecursively(nodes, parentNodeId);

    const completeMessage = '知识图谱节点创建完成！';
    onProgress(completeMessage);
    results.progress = 100;

    emit('node-creation-complete', results);
    return results;

  } catch (error) {
    console.error('创建知识图谱节点过程中发生错误:', error);
    emit('node-creation-error', error);
    throw error;
  }
};

// 获取节点数量
const getNodeCount = (text) => {
  if (!text || !text.trim() || !textNodeParserRef.value) {
    return 0;
  }
  try {
    const nodes = textNodeParserRef.value.parseText(text);
    // 计算总节点数（包括子节点）
    const countAllNodes = (nodeList) => {
      let count = 0;
      nodeList.forEach(node => {
        count++;
        if (node.children) {
          count += countAllNodes(node.children);
        }
      });
      return count;
    };
    return countAllNodes(nodes);
  } catch (error) {
    return 0;
  }
};

// 暴露方法给父组件
defineExpose({
  createKnowledgeGraphNodes,
  getNodeCount,
  textNodeParserRef
});
</script>

<style scoped>
.node-creation-service {
  display: none;
}
</style>
