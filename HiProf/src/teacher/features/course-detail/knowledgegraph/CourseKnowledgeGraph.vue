<template>
  <div class="course-knowledge-graph">
    <div class="section-header section-header--toolbar">
      <div class="section-actions">
        <button
          class="btn btn-outline-edit"
          @click="goToOutline"
          :disabled="!currentKnowledgeGraph || loading"
        >
          进入大纲编辑
        </button>
        <button
          class="btn btn-ai-generate"
          @click="aiSmartGenerate"
          :disabled="loading"
        >
          AI生成知识图谱
        </button>

        <div class="graph-viewer-tools">
          <div class="graph-search">
            <input
              v-model.trim="graphSearchKeyword"
              class="graph-search-input"
              type="search"
              placeholder="搜索知识点"
              @keydown.enter.prevent="selectGraphSearchResult(graphSearchResults[0])"
            />
            <div v-if="graphSearchKeyword" class="graph-search-popover">
              <div class="graph-search-status">{{ graphSearchStatus }}</div>
              <button
                v-for="result in graphSearchResults"
                :key="result.id"
                type="button"
                class="graph-search-result"
                @click="selectGraphSearchResult(result)"
              >
                {{ getGraphNodeDisplayText(result) }}
              </button>
              <button
                v-if="graphSearchKeyword"
                type="button"
                class="graph-search-clear"
                @click="clearGraphSearch"
              >
                清空搜索
              </button>
            </div>
          </div>

          <div class="layout-type-controls">
            <label class="layout-label">查看方式：</label>
            <div class="layout-buttons">
              <button
                v-for="layout in layoutOptions"
                :key="layout.value"
                class="btn btn-layout-type"
                :class="{ active: graphSettings.layoutType === layout.value }"
                :title="layout.title"
                @click="switchLayoutType(layout.value)"
              >
                {{ layout.label }}
              </button>
            </div>
          </div>

          <button
            type="button"
            class="btn btn-view-tool"
            :disabled="!currentKnowledgeGraph || loading"
            @click="fitGraphView"
          >
            适配视图
          </button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在生成知识图谱...</p>
    </div>

    <!-- 知识图谱主容器 -->
    <div v-else-if="currentKnowledgeGraph" class="graph-main-container">
      <!-- 知识图谱容器 -->
      <div class="graph-container" :class="{ 'with-panel': showNodeEditDialog }">
        <!-- 中心布局组件 -->
        <CenterLayoutComponent
          v-if="graphSettings.layoutType === 'center'"
          ref="centerLayoutRef"
          :courseId="courseId"
          :graphId="currentKnowledgeGraph.id"
          :course-name="courseName"
          :settings="graphSettings"
          :interaction-state="graphInteractionState"
          @node-click="handleTreeNodeClick"
          @line-click="handleTreeLineClick"
          @canvas-click="clearGraphFocus"
        />

        <!-- 树形布局组件 -->
        <TreeLayoutComponent
          v-else-if="graphSettings.layoutType === 'tree'"
          ref="treeLayoutRef"
          :courseId="courseId"
          :graphId="currentKnowledgeGraph.id"
          :course-name="courseName"
          :settings="graphSettings"
          :interaction-state="graphInteractionState"
          @node-click="handleTreeNodeClick"
          @line-click="handleTreeLineClick"
          @canvas-click="clearGraphFocus"
        />

        <!-- 双向树布局组件 -->
        <BidirectionalTreeLayoutComponent
          v-else-if="graphSettings.layoutType === 'bidirectional-tree'"
          ref="bidirectionalTreeLayoutRef"
          :courseId="courseId"
          :graphId="currentKnowledgeGraph.id"
          :course-name="courseName"
          :settings="graphSettings"
          :interaction-state="graphInteractionState"
          @node-click="handleTreeNodeClick"
          @line-click="handleTreeLineClick"
          @canvas-click="clearGraphFocus"
        />
      </div>

      <!-- 节点详情面板 -->
      <div v-if="showNodeEditDialog && selectedNode" class="node-panel-container">
        <NodeDetailPanel
          :node="selectedNode"
          :related-nodes="[]"
          :course-id="courseId"
          :course-name="courseName"
          @close="handleNodeEditClose"
          @save="handleNodeEditSave"
          @cancel="handleNodeEditClose"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon" aria-hidden="true">
        <WorkspaceIcon name="knowledgeGraph" :size="34" />
      </div>
      <h3 class="empty-title">暂无知识图谱</h3>
      <p class="empty-description">通过后端 AI 生成接口创建并更新课程知识图谱</p>
      <button class="btn btn-primary" @click="generateGraph" :disabled="loading">
        <i class="generate-icon"></i>
        {{ loading ? '正在跳转...' : 'AI 生成知识图谱' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { getCourseKnowledgeGraphList, updateNode } from '@/api/graph';
import { getNodeDetail } from '@/api/node';
import { getCourseById } from '@/api/courses';
import TreeLayoutComponent from './TreeLayoutComponent.vue';
import CenterLayoutComponent from './CenterLayoutComponent.vue';
import BidirectionalTreeLayoutComponent from './BidirectionalTreeLayoutComponent.vue';
import NodeDetailPanel from '@/shared/features/graph/components/graph/NodeDetailPanel.vue';
import WorkspaceIcon from '@/ui/workspace/WorkspaceIcon.vue';

const router = useRouter();

// 定义props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
});

// 定义emits
const emit = defineEmits(['refresh']);

// 响应式数据
const loading = ref(false);
const knowledgeGraphList = ref([]);
const currentKnowledgeGraph = ref(null);
const showNodeEditDialog = ref(false); // 节点编辑面板显示状态
const selectedNode = ref(null); // 当前选中的节点
const courseName = ref('课程知识图谱');
const treeLayoutRef = ref(null); // TreeLayoutComponent引用
const centerLayoutRef = ref(null); // CenterLayoutComponent引用
const bidirectionalTreeLayoutRef = ref(null); // BidirectionalTreeLayoutComponent引用
const graphSearchKeyword = ref('');
const graphSearchResults = ref([]);
const graphInteractionState = ref({
  selectedNodeId: null
});
const GRAPH_PANEL_TRANSITION_DELAY_MS = 320;

const layoutOptions = [
  {
    value: 'tree',
    label: '结构阅读',
    title: '从左到右阅读课程结构'
  },
  {
    value: 'bidirectional-tree',
    label: '双向展开',
    title: '从课程主干向左右展开分支'
  },
  {
    value: 'center',
    label: '关系探索',
    title: '探索知识点之间的复杂关系'
  }
];

// 图谱设置数据
const graphSettings = ref({
  nodeStyle: 'rectangle', // 默认长方形节点
  linkStyle: 'straight',  // 默认直线连接
  layoutType: 'bidirectional-tree', // 'center' | 'tree' | 'bidirectional-tree'
  treeDirection: 'horizontal', // 'horizontal' | 'vertical'
  showLabels: true,
  enableZoom: true,
  enableDrag: true,
  maxNodes: 100,
  enableAnimation: true
});

const graphSearchStatus = computed(() => {
  if (!graphSearchKeyword.value) {
    return '';
  }

  if (graphSearchResults.value.length === 0) {
    return '未找到相关知识点';
  }

  return `找到 ${graphSearchResults.value.length} 个结果`;
});

const getActiveLayoutRef = () => {
  if (graphSettings.value.layoutType === 'center') {
    return centerLayoutRef.value;
  }

  if (graphSettings.value.layoutType === 'tree') {
    return treeLayoutRef.value;
  }

  return bidirectionalTreeLayoutRef.value;
};

const getGraphNodeDisplayText = (node) => {
  return node?.text || node?.name || node?.data?.fullText || `节点${node?.id || ''}`;
};

const runGraphSearch = () => {
  const activeLayout = getActiveLayoutRef();
  if (!graphSearchKeyword.value || !activeLayout?.searchNodes) {
    graphSearchResults.value = [];
    return;
  }

  graphSearchResults.value = activeLayout.searchNodes(graphSearchKeyword.value).slice(0, 8);
};

const clearGraphSearch = () => {
  graphSearchKeyword.value = '';
  graphSearchResults.value = [];
};

const setSelectedGraphNodeId = (nodeId) => {
  graphInteractionState.value = {
    ...graphInteractionState.value,
    selectedNodeId: nodeId ? String(nodeId) : null
  };
};

const focusGraphNode = async (node) => {
  if (!node?.id) {
    return;
  }

  setSelectedGraphNodeId(node.id);
  await nextTick();
  const activeLayout = getActiveLayoutRef();
  await activeLayout?.focusNodeById?.(String(node.id));
};

const waitForGraphPanelTransition = () => {
  return new Promise(resolve => window.setTimeout(resolve, GRAPH_PANEL_TRANSITION_DELAY_MS));
};

const focusGraphNodeAfterPanelUpdate = async (node, shouldWaitForPanelTransition = false) => {
  if (!node?.id) {
    return;
  }

  const targetNodeId = String(node.id);
  await nextTick();

  if (shouldWaitForPanelTransition) {
    await waitForGraphPanelTransition();
  }

  if (graphInteractionState.value.selectedNodeId !== targetNodeId || !showNodeEditDialog.value) {
    return;
  }

  await focusGraphNode(node);
};

const selectGraphSearchResult = async (node) => {
  if (!node) {
    return;
  }

  await handleTreeNodeClick(node);
};

const fitGraphView = async () => {
  const activeLayout = getActiveLayoutRef();
  await activeLayout?.fitView?.();
};

const clearGraphFocus = () => {
  setSelectedGraphNodeId(null);
};

const loadCourseInfo = async () => {
  try {
    const courseResponse = await getCourseById(props.courseId);
    if (courseResponse?.data?.name) {
      courseName.value = courseResponse.data.name;
    } else if (courseResponse?.courseData?.name) {
      courseName.value = courseResponse.courseData.name;
    } else if (courseResponse?.name) {
      courseName.value = courseResponse.name;
    }
  } catch (error) {
    console.warn('获取课程信息失败，使用默认课程名称:', error);
  }
};

// 获取课程知识图谱列表
const loadKnowledgeGraphList = async () => {
  try {
    const response = await getCourseKnowledgeGraphList(props.courseId);

    if (response && Array.isArray(response.rows)) {
      knowledgeGraphList.value = response.rows;

      // 如果有知识图谱，选择第一个作为当前图谱
      if (knowledgeGraphList.value.length > 0) {
        currentKnowledgeGraph.value = knowledgeGraphList.value[0];
        await loadGraphData();
      } else {
        currentKnowledgeGraph.value = null;
      }
    } else {
      console.warn('知识图谱列表响应格式异常:', response);
      knowledgeGraphList.value = [];
      currentKnowledgeGraph.value = null;
    }
  } catch (error) {
    console.error('获取知识图谱列表失败:', error);
    knowledgeGraphList.value = [];
    currentKnowledgeGraph.value = null;
  }
};

// 加载知识图谱数据
const loadGraphData = async () => {
  if (!currentKnowledgeGraph.value) {
    console.warn('没有当前知识图谱，无法加载数据');
    return;
  }

  loading.value = true;
  try {
    await nextTick();
  } catch (error) {
    console.error('加载知识图谱数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 切换布局类型
const switchLayoutType = async (layoutType) => {
  try {
    // 更新图谱设置
    graphSettings.value.layoutType = layoutType;

    console.log(`切换到${layoutType}布局`);

    // 如果切换到树形布局，设置为水平方向（唯一选项）
    if (layoutType === 'tree') {
      graphSettings.value.treeDirection = 'horizontal';
    }
    // 如果切换到双向树布局，设置默认为水平方向
    else if (layoutType === 'bidirectional-tree') {
      graphSettings.value.treeDirection = 'horizontal';
    }

    // 触发图谱重新渲染
    await nextTick();
    runGraphSearch();

  } catch (error) {
    console.error('切换布局类型失败:', error);
  }
};

// 进入大纲编辑
const goToOutline = () => {
  if (currentKnowledgeGraph.value) {
    // 使用路由跳转到大纲编辑页面，传递知识图谱ID作为路径参数，课程ID和编辑模式作为查询参数
    router.push(`/outline/${currentKnowledgeGraph.value.id}?courseId=${props.courseId}&edit=true`);
  } else {
    alert('请先生成知识图谱');
  }
};

// AI生成知识图谱
const aiSmartGenerate = () => {
  // 跳转到AI生成知识图谱页面
  router.push(`/teacher/course/${props.courseId}/ai-knowledge-graph`);
};

// 处理树形布局节点点击
const handleTreeNodeClick = async (node) => {
  if (!node || node.data?.isVirtualRoot) {
    return;
  }

  console.log('CourseKnowledgeGraph: 树形节点点击:', node);
  setSelectedGraphNodeId(node.id);
  const shouldWaitForPanelTransition = !showNodeEditDialog.value;

  let detailContent = node.data?.content || '';
  try {
    const detail = await getNodeDetail(node.id);
    detailContent = detail?.content || detailContent;
  } catch (error) {
    console.warn('获取节点详情失败，使用当前节点数据回显:', error);
  }

  selectedNode.value = {
    id: node.id,
    name: node.text || '',
    text: node.text || '',
    content: detailContent
  };

  showNodeEditDialog.value = true;
  await focusGraphNodeAfterPanelUpdate(node, shouldWaitForPanelTransition);
};

// 处理树形布局连线点击
const handleTreeLineClick = (line) => {
  console.log('CourseKnowledgeGraph: 树形连线点击:', line);
  // 这里可以添加连线点击的处理逻辑
};

// 处理节点编辑面板关闭
const handleNodeEditClose = async (options = {}) => {
  showNodeEditDialog.value = false;
  selectedNode.value = null;
  setSelectedGraphNodeId(null);

  if (options?.refreshGraph) {
    await refreshKnowledgeGraph();
  }
};

// 处理节点编辑保存
const handleNodeEditSave = async (nodeData, resolve, reject, options = {}) => {
  try {
    console.log('保存节点数据:', nodeData);

    // 验证必要的数据
    if (!nodeData.id) {
      console.error('节点ID不能为空');
      const message = '节点ID不能为空，无法保存';
      if (options?.showError !== false) {
        alert(message);
      }
      reject?.(new Error(message));
      return;
    }

    // 构建API需要的数据格式
    const updateData = {
      id: nodeData.id,
      name: nodeData.text || '',
      content: nodeData.content || ''
    };

    console.log('准备发送的更新数据:', updateData);

    // 调用API更新节点
    const response = await updateNode(updateData);
    console.log('API响应:', response);

    console.log('节点更新成功');
    resolve?.(response);
  } catch (error) {
    console.error('节点更新失败:', error);
    console.error('错误详情:', error.response?.data || error.message);

    let errorMessage = '节点更新失败，请重试';
    if (error.response?.data?.msg) {
      errorMessage = `节点更新失败: ${error.response.data.msg}`;
    } else if (error.message) {
      errorMessage = `节点更新失败: ${error.message}`;
    }

    if (options?.showError !== false) {
      alert(errorMessage);
    }
    reject?.(new Error(errorMessage));
  }
};

// 刷新知识图谱数据
const refreshKnowledgeGraph = async () => {
  await loadKnowledgeGraphList();
  await nextTick();
  emit('refresh');
};



// 暴露刷新方法给父组件
defineExpose({
  refreshKnowledgeGraph
});

// 生成知识图谱（空状态下的按钮）
const generateGraph = async () => {
  aiSmartGenerate();
};

// 监听路由变化，当从AI生成页面返回时刷新数据
watch(() => router.currentRoute.value.path, (newPath, oldPath) => {
  // 如果从AI生成页面返回到当前页面，刷新数据
  if (oldPath && oldPath.includes('ai-knowledge-graph') &&
      newPath.includes(`/teacher/course/${props.courseId}`)) {
    setTimeout(() => {
      refreshKnowledgeGraph();
    }, 500); // 延迟一点时间确保页面完全加载
  }
});

watch(graphSearchKeyword, () => {
  runGraphSearch();
});

// 组件挂载时加载数据
onMounted(() => {
  // 自动加载知识图谱列表
  loadCourseInfo();
  loadKnowledgeGraphList();
});
</script>

<style scoped>
@import '@/teacher/styles/course-knowledge-graph.css';
</style>
