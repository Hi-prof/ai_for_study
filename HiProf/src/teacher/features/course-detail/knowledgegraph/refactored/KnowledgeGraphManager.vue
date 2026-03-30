<template>
  <div class="knowledge-graph-manager">
    <!-- 这个组件不渲染UI，只提供服务 -->
  </div>
</template>

<script setup>
import { ref, defineEmits, defineExpose, onMounted } from 'vue';
import { getCourseById } from '@/api/courses';
import { getCourseKnowledgeGraphList, createKnowledgeGraph } from '@/api/graph';
import { createNode, getKnowledgeGraphNodes, deleteNode } from '@/api/node';

// 定义props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
});

// 定义事件
const emit = defineEmits([
  'course-info-loaded',
  'parent-nodes-loaded',
  'graph-created',
  'nodes-created',
  'operation-error'
]);

// 响应式数据
const courseName = ref('');
const availableParentNodes = ref([]);
const isLoadingNodes = ref(false);

// 获取课程信息
const loadCourseInfo = async () => {
  try {
    if (props.courseId) {
      const courseResponse = await getCourseById(props.courseId);
      if (courseResponse && courseResponse.courseData) {
        courseName.value = courseResponse.courseData.name || '未命名课程';
        emit('course-info-loaded', courseName.value);
      }
    }
  } catch (error) {
    console.error('获取课程信息失败:', error);
    courseName.value = '未知课程';
    emit('operation-error', new Error('获取课程信息失败: ' + error.message));
  }
};

// 获取可用的父节点列表
const loadAvailableParentNodes = async () => {
  if (!props.courseId) {
    console.warn('课程ID为空，无法加载父节点列表');
    return;
  }

  isLoadingNodes.value = true;
  try {
    // 首先获取课程的知识图谱列表
    const graphListResponse = await getCourseKnowledgeGraphList(props.courseId);

    if (graphListResponse && graphListResponse.rows && graphListResponse.rows.length > 0) {
      // 获取第一个知识图谱的节点列表
      const graphId = graphListResponse.rows[0].id;
      const nodesResponse = await getKnowledgeGraphNodes(graphId);

      if (nodesResponse && nodesResponse.rows && Array.isArray(nodesResponse.rows)) {
        availableParentNodes.value = nodesResponse.rows;
        console.log('成功加载父节点列表:', availableParentNodes.value.length, '个节点');
        emit('parent-nodes-loaded', availableParentNodes.value);
      } else {
        console.warn('节点列表响应格式异常:', nodesResponse);
        availableParentNodes.value = [];
        emit('parent-nodes-loaded', []);
      }
    } else {
      console.log('暂无现有知识图谱，无可选父节点');
      availableParentNodes.value = [];
      emit('parent-nodes-loaded', []);
    }
  } catch (error) {
    console.error('获取父节点列表失败:', error);
    availableParentNodes.value = [];
    emit('operation-error', new Error('获取父节点列表失败: ' + error.message));
  } finally {
    isLoadingNodes.value = false;
  }
};

// 获取节点显示名称（包含层级信息）
const getNodeDisplayName = (node) => {
  if (!node) return '未知节点';

  // 如果节点有父节点，尝试显示层级信息
  if (node.parentId) {
    // 简单显示：子节点名称
    return `└─ ${node.name || '未命名节点'}`;
  } else {
    // 根节点
    return `${node.name || '未命名节点'}`;
  }
};

// 创建或获取知识图谱
const ensureKnowledgeGraph = async (options = {}) => {
  try {
    let graphId = null;

    // 检查是否已有知识图谱
    const graphListResponse = await getCourseKnowledgeGraphList(props.courseId);
    if (graphListResponse && graphListResponse.rows && graphListResponse.rows.length > 0) {
      graphId = graphListResponse.rows[0].id;
    } else {
      // 创建新的知识图谱
      const graphData = {
        courseId: props.courseId,
        name: options.name || `${courseName.value}-AI生成知识图谱`,
        content: options.description || 'AI智能生成的知识图谱',
        remark: 'AI智能生成的知识图谱',
        graphType: "0"
      };

      const graphResponse = await createKnowledgeGraph(graphData);
      if (graphResponse && graphResponse.data) {
        graphId = graphResponse.data;
        emit('graph-created', graphId);
      } else {
        throw new Error('创建知识图谱失败');
      }
    }

    return graphId;
  } catch (error) {
    console.error('确保知识图谱存在失败:', error);
    throw error;
  }
};

// 删除知识图谱的所有节点（只删除根节点，子节点会自动删除）
const deleteAllKnowledgeGraphNodes = async (graphId, onProgress) => {
  try {
    // 获取知识图谱的所有节点
    const nodesResponse = await getKnowledgeGraphNodes(graphId);
    let nodes = [];

    if (nodesResponse && nodesResponse.rows) {
      nodes = nodesResponse.rows;
    } else if (Array.isArray(nodesResponse)) {
      nodes = nodesResponse;
    }

    if (nodes.length === 0) {
      console.log('知识图谱没有现有节点，跳过删除');
      return;
    }

    // 筛选出根节点（没有父节点的节点）
    const rootNodes = nodes.filter(node =>
      node.parentId === null ||
      node.parentId === undefined ||
      node.parentId === ''
    );

    if (rootNodes.length === 0) {
      console.log('没有找到根节点，删除所有节点');
      // 如果没有根节点，可能数据结构异常，删除所有节点
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (onProgress) {
          onProgress(`正在删除节点 ${i + 1}/${nodes.length}: ${node.name || '未命名节点'}`);
        }
        try {
          await deleteNode(String(node.id));
          console.log(`删除节点成功: ${node.name}`);
        } catch (error) {
          console.error(`删除节点失败: ${node.name}`, error);
        }
      }
    } else {
      console.log(`找到 ${rootNodes.length} 个根节点，删除后子节点将自动删除...`);

      // 只删除根节点，子节点会自动删除
      for (let i = 0; i < rootNodes.length; i++) {
        const rootNode = rootNodes[i];
        if (onProgress) {
          onProgress(`正在删除根节点 ${i + 1}/${rootNodes.length}: ${rootNode.name || '未命名节点'}`);
        }

        try {
          await deleteNode(String(rootNode.id));
          console.log(`删除根节点成功: ${rootNode.name}，子节点已自动删除`);
        } catch (error) {
          console.error(`删除根节点失败: ${rootNode.name}`, error);
          // 继续删除其他根节点，不中断整个流程
        }
      }
    }

    console.log('所有旧节点删除完成');
  } catch (error) {
    console.error('删除知识图谱节点失败:', error);
    throw new Error('删除现有节点失败: ' + (error.message || '请重试'));
  }
};

// 组件挂载时加载课程信息和父节点列表
onMounted(() => {
  console.log('KnowledgeGraphManager 组件挂载，课程ID:', props.courseId);
  console.log('开始加载课程信息和父节点列表...');
  loadCourseInfo();
  loadAvailableParentNodes();
});

// 暴露方法和数据给父组件
defineExpose({
  loadCourseInfo,
  loadAvailableParentNodes,
  getNodeDisplayName,
  ensureKnowledgeGraph,
  deleteAllKnowledgeGraphNodes,
  courseName,
  availableParentNodes,
  isLoadingNodes
});
</script>

<style scoped>
.knowledge-graph-manager {
  display: none;
}
</style>
