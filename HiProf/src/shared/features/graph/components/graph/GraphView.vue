<template>
  <div class="graph-container" ref="graphContainer">
    <div v-if="isGraphLoading" class="graph-loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载知识图谱中...</div>
    </div>

    <div v-else-if="isEmptyGraph" class="empty-graph">
      <div class="empty-icon">📊</div>
      <div class="empty-title">暂无知识图谱数据</div>
      <div class="empty-description">当前课程还没有创建知识节点，请先添加一些知识内容</div>
      <button class="retry-button" @click="retryLoadGraph">重新加载</button>
    </div>

    <RelationGraph
      v-else
      ref="graphRef"
      :options="graphOptions"
      :on-node-click="handleNodeClick"
      :on-line-click="handleLineClick"
      :on-node-mouseenter="handleNodeHover"
      :on-node-mouseleave="() => hoveredNode = null"
    />
    
    <div class="node-tooltip" v-if="hoveredNode" :style="tooltipStyle">
      <div class="tooltip-title">{{ hoveredNode.text }}</div>
      <div class="tooltip-content" v-if="hoveredNode.content">
        {{ hoveredNode.content.substring(0, 100) }}{{ hoveredNode.content.length > 100 ? '...' : '' }}
      </div>
      <div class="tooltip-category" v-if="hoveredNode.category">
        类别: <span>{{ getCategoryName(hoveredNode.category) }}</span>
      </div>
    </div>
    
    <node-detail-panel
      v-if="selectedNode"
      :key="selectedNode.id"
      :node="selectedNode"
      :relatedNodes="relatedNodes"
      @save="handleNodeSave"
      @cancel="handleNodeCancel"
      @close="handleNodeClose"
      @select-related="handleRelatedNodeSelect"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, nextTick } from 'vue';
import RelationGraph from 'relation-graph-vue3';
import type { RGNode, RelationGraphComponent } from 'relation-graph-vue3';
import { getKnowledgeGraphNodes, getNodeLines, getNodeStyle, getNodeDetail, updateNode as updateNodeApi } from '@/api/node';
import NodeDetailPanel from '@/shared/features/graph/components/graph/NodeDetailPanel.vue';
import { graphOptions, getCategoryName } from '@/shared/features/graph/utils/graphConfig.js';
import { processNodeData, processLineData, buildGraphData } from '@/shared/features/graph/utils/graphUtils.js';

// 定义类型接口
interface Node {
  id: string | number;
  text?: string;
  name?: string;
  content?: string;
  category?: string;
  data?: any;
}

interface Course {
  id: string | number;
  name: string;
  content?: string;
  nodeCount?: number;
}

// 定义 props
interface Props {
  courseId?: string | number;
  graphId?: string | number;
  currentCourse?: Course | null;
}

const props = defineProps<Props>();

// 定义 emits
const emit = defineEmits<{
  nodeSelect: [node: Node];
  nodeHover: [node: Node | null];
  nodeSave: [nodeData: any];
}>();

// 响应式数据
const graphRef = ref<RelationGraphComponent>();
const graphContainer = ref<HTMLElement | null>(null);
const isGraphLoading = ref(false);
const isEmptyGraph = ref(false);
const selectedNode = ref<Node | null>(null);
const hoveredNode = ref<Node | null>(null);
const relatedNodes = ref<Node[]>([]);
const currentLayout = ref('center');


const tooltipStyle = reactive({
  left: '0px',
  top: '0px'
});

// 加载图谱数据
const loadGraphData = async () => {
  // 优先使用 graphId，如果没有则使用 courseId
  const targetId = props.graphId || props.courseId;
  if (!targetId) {
    console.warn('GraphView: 缺少targetId，无法加载图谱数据');
    return;
  }

  isGraphLoading.value = true;
  isEmptyGraph.value = false;

  try {
    // 1. 获取节点数据
    const nodesResponse = await getKnowledgeGraphNodes(String(targetId));

    // 提取节点数组
    let nodes: any[] = [];
    if (nodesResponse && nodesResponse.rows) {
      nodes = nodesResponse.rows;
    } else if (Array.isArray(nodesResponse)) {
      nodes = nodesResponse;
    } else {
      console.warn('GraphView: 节点数据格式异常:', nodesResponse);
    }

    if (!nodes || nodes.length === 0) {
      isGraphLoading.value = false;
      isEmptyGraph.value = true;
      return;
    }

    // 2. 处理节点数据 - 添加错误处理
    const processedNodes = await processNodeData(nodes, getNodeStyle);

    // 3. 获取所有节点的连线 - 添加错误处理
    const linePromises = nodes.map((node: any) => {
      return getNodeLines(String(node.id)).catch(error => {
        console.warn(`GraphView: 获取节点${node.id}连线失败:`, error);
        return []; // 返回空数组而不是抛出错误
      });
    });
    const linesArrays = await Promise.all(linePromises);

    // 4. 处理连线数据
    const processedLines = processLineData(linesArrays);

    // 5. 构建图谱数据
    const graphData = buildGraphData(nodes, processedNodes, processedLines);

    // 6. 等待组件挂载并渲染图谱
    await nextTick(); // 确保DOM更新

    // 延迟渲染，确保RelationGraph组件完全初始化
    setTimeout(async () => {
      await renderGraph(graphData);
    }, 500);

  } catch (error) {
    console.error('GraphView: 加载图谱数据失败:', error);
    // 显示错误状态而不是空状态
    isEmptyGraph.value = true;
  } finally {
    isGraphLoading.value = false;
  }
};

// 渲染图谱数据
const renderGraph = async (graphData: any) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('GraphView: 开始渲染图谱，数据:', graphData);

      // 验证图谱数据格式
      if (!graphData || !graphData.nodes || !Array.isArray(graphData.nodes)) {
        console.error('GraphView: 图谱数据格式无效:', graphData);
        throw new Error('图谱数据格式无效');
      }

      console.log('GraphView: 图谱数据验证通过，节点数量:', graphData.nodes.length);

      // 等待组件完全挂载
      await nextTick();

      // 多次尝试获取图谱实例，因为组件可能还在初始化
      let graphInstance: any = null;
      let attempts = 0;
      const maxAttempts = 20; // 增加尝试次数

      while (!graphInstance && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 200)); // 增加等待时间

        try {
          graphInstance = graphRef.value?.getInstance();
          if (graphInstance) {
            console.log(`GraphView: 图谱实例获取成功，第${attempts + 1}次尝试`);
            break;
          }
        } catch (error) {
          console.warn(`GraphView: 第${attempts + 1}次获取实例失败:`, error);
        }

        attempts++;
        console.log(`GraphView: 尝试获取图谱实例，第${attempts}次`);
      }

      if (!graphInstance) {
        console.error('GraphView: 无法获取图谱实例，已尝试', maxAttempts, '次');
        throw new Error('无法获取图谱实例');
      }

      console.log('GraphView: 图谱实例获取成功，类型:', typeof graphInstance);

      // 设置当前布局
      try {
        if (graphInstance.options) {
          graphInstance.options.layoutName = currentLayout.value;
          console.log('GraphView: 设置布局:', currentLayout.value);
        }
      } catch (optionError) {
        console.warn('GraphView: 设置布局失败:', optionError);
      }

      // 加载数据
      await graphInstance.setJsonData(graphData);

      // 等待渲染完成
      await new Promise(resolve => setTimeout(resolve, 500));

      // 居中和适配视图
      try {
        if (typeof graphInstance.moveToCenter === 'function') {
          graphInstance.moveToCenter();
        }
        if (typeof graphInstance.zoomToFit === 'function') {
          graphInstance.zoomToFit();
        }
      } catch (viewError) {
        console.warn('GraphView: 视图调整失败:', viewError);
      }

      resolve(true);

    } catch (error) {
      console.error('GraphView: 渲染图谱失败:', error);
      // 显示错误状态
      isEmptyGraph.value = true;
      reject(error);
    }
  });
};

// 处理节点点击
const handleNodeClick = async (node: RGNode) => {
  try {
    // 获取节点详细信息
    const nodeDetail = await getNodeDetail(node.id);

    // 创建节点数据结构，优先使用API返回的详细信息
    const nodeData = {
      id: node.id,
      name: nodeDetail?.name || node.text || '',
      content: nodeDetail?.content || node.data?.content || ''
    };

    selectedNode.value = nodeData;
    emit('nodeSelect', nodeData);
  } catch (error) {
    // 如果获取详细信息失败，使用基本信息
    const nodeData = {
      id: node.id,
      name: node.text || '',
      content: node.data?.content || ''
    };

    selectedNode.value = nodeData;
    emit('nodeSelect', nodeData);
  }
  
  // 获取关联节点
  const graphInstance = graphRef.value?.getInstance();
  if (graphInstance) {
    const relations = graphInstance.getLinesByNode(String(node.id));
    relatedNodes.value = relations.map((rel: any) => {
      const relatedNodeId = rel.fromNodeId === node.id ? rel.toNodeId : rel.fromNodeId;
      const relatedNode = graphInstance.getNodeById(String(relatedNodeId));

      if (!relatedNode) {
        return null;
      }
      
      return {
        id: relatedNodeId,
        name: relatedNode.text || '',
        content: relatedNode.data?.content || '',
        relationType: rel.text || '关联',
        category: relatedNode.data?.category || '',
      };
    }).filter(Boolean) as Node[];
  }
};

// 处理线条点击
const handleLineClick = () => {
  // 线条点击处理逻辑
};

// 处理节点悬停
const handleNodeHover = (node: any, event: MouseEvent) => {
  if (node) {
    hoveredNode.value = node.data;
    emit('nodeHover', node.data);
    
    // 计算提示框位置
    const rect = (event.target as Element)?.getBoundingClientRect();
    const containerRect = graphContainer.value?.getBoundingClientRect();
    
    if (rect && containerRect) {
      tooltipStyle.left = `${rect.left - containerRect.left + rect.width / 2}px`;
      tooltipStyle.top = `${rect.top - containerRect.top - 10}px`;
    }
  } else {
    hoveredNode.value = null;
    emit('nodeHover', null);
  }
};

// 处理节点保存
const handleNodeSave = async (updatedNode: any) => {
  if (!selectedNode.value) return;
  
  // 更新节点内容
  if (selectedNode.value) {
    selectedNode.value.content = updatedNode.content;
    selectedNode.value.name = updatedNode.text;
  }


  
  // 更新图谱中的节点数据
  const graphInstance = graphRef.value?.getInstance();
  if (graphInstance && selectedNode.value) {
    const node = graphInstance.getNodeById(String(selectedNode.value.id));
    if (node) {
      // 更新节点数据
      node.data.content = updatedNode.content;
      node.data.text = updatedNode.text;
      node.text = updatedNode.text;
      
      // 直接更新DOM中的节点文本
      const nodeElement = document.querySelector(`.rel-node[node-id="${selectedNode.value.id}"] .c-node-text`);
      if (nodeElement) {
        nodeElement.textContent = updatedNode.text;
      }
      
      // 更新悬停节点信息
      if (hoveredNode.value && hoveredNode.value.id === selectedNode.value.id) {
        hoveredNode.value.text = updatedNode.text;
        hoveredNode.value.content = updatedNode.content;
      }
      
      // 调用API保存到后端

      await updateNodeApi({
        id: String(selectedNode.value.id),
        name: updatedNode.text,
        content: updatedNode.content
      });
      
      // 刷新图谱
      graphInstance.refresh();
    }
  }
  
  emit('nodeSave', updatedNode);
};

// 处理节点取消编辑
const handleNodeCancel = () => {
  selectedNode.value = null;
  relatedNodes.value = [];
};

// 处理节点详情关闭
const handleNodeClose = () => {
  selectedNode.value = null;
  relatedNodes.value = [];
};

// 处理关联节点选择
const handleRelatedNodeSelect = async (node: Node) => {
  const graphInstance = graphRef.value?.getInstance();
  if (graphInstance) {
    const targetNode = graphInstance.getNodeById(node.id);
    if (targetNode) {
      // 聚焦到节点
      graphInstance.focusNodeById(node.id);

      try {
        // 获取节点详细信息
        const nodeDetail = await getNodeDetail(node.id);

        // 设置选中节点数据，优先使用API返回的详细信息
        selectedNode.value = {
          id: node.id,
          name: nodeDetail?.name || node.name || '',
          content: nodeDetail?.content || node.content || ''
        };
      } catch (error) {
        // 如果获取详细信息失败，使用基本信息
        selectedNode.value = {
          id: node.id,
          name: node.name || '',
          content: node.content || ''
        };
      }
    }
  }
};

// 监听课程ID和图谱ID变化
watch(() => [props.courseId, props.graphId], async ([newCourseId, newGraphId]) => {
  if (newCourseId || newGraphId) {
    // 延迟一点时间确保组件完全挂载
    await nextTick();
    setTimeout(() => {
      loadGraphData();
    }, 1000); // 增加延迟时间
  }
}, { immediate: true });

// 重新加载图谱数据
const retryLoadGraph = () => {
  loadGraphData();
};



// 暴露方法给父组件
defineExpose({
  loadGraphData,
  retryLoadGraph
});
</script>

<style scoped>
.graph-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 120px);
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
}

.graph-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #4299e1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 16px;
  color: #4a5568;
}

.empty-graph {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #f8f9fa;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
}

.empty-description {
  font-size: 14px;
  color: #718096;
  text-align: center;
  max-width: 300px;
  line-height: 1.5;
}

.node-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  max-width: 200px;
  z-index: 1000;
  pointer-events: none;
  transform: translateX(-50%) translateY(-100%);
}

.tooltip-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.tooltip-content {
  margin-bottom: 4px;
  line-height: 1.4;
}

.tooltip-category span {
  color: #ffd700;
}

.retry-button {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background-color: #3182ce;
  transform: translateY(-1px);
}


</style>
