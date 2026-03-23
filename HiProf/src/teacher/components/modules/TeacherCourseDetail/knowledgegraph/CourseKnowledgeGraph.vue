<template>
  <div class="course-knowledge-graph">
    <!-- 页面标题 -->
    <div class="section-header">
      <div class="section-title-area">
        <h2 class="section-title">知识图谱</h2>
        <span v-if="currentKnowledgeGraph" class="graph-name">{{ currentKnowledgeGraph.name }}</span>
      </div>
      <div class="section-actions">
        <button
          class="btn btn-outline-edit"
          @click="goToOutline"
          :disabled="!currentKnowledgeGraph || loading"
        >
          进入大纲编辑
        </button>
        <button
          class="btn btn-settings"
          @click="openSettingsDialog"
          :disabled="!currentKnowledgeGraph || loading"
          title="知识图谱设置"
        >
          设置
        </button>
        <button
          class="btn btn-ai-generate"
          @click="aiSmartGenerate"
          :disabled="loading"
        >
          AI生成知识图谱
        </button>

        <!-- 布局类型选择 -->
        <div class="layout-type-controls">
          <label class="layout-label">布局类型：</label>
          <div class="layout-buttons">
            <button
              class="btn btn-layout-type"
              :class="{ active: graphSettings.layoutType === 'center' }"
              @click="switchLayoutType('center')"
              title="中心布局"
            >
              中心
            </button>
            <button
              class="btn btn-layout-type"
              :class="{ active: graphSettings.layoutType === 'tree' }"
              @click="switchLayoutType('tree')"
              title="树形布局"
            >
              树形
            </button>
            <button
              class="btn btn-layout-type"
              :class="{ active: graphSettings.layoutType === 'bidirectional-tree' }"
              @click="switchLayoutType('bidirectional-tree')"
              title="双向树布局"
            >
              双向树
            </button>
          </div>
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
          :settings="graphSettings"
          @node-click="handleTreeNodeClick"
          @line-click="handleTreeLineClick"
        />

        <!-- 树形布局组件 -->
        <TreeLayoutComponent
          v-else-if="graphSettings.layoutType === 'tree'"
          ref="treeLayoutRef"
          :courseId="courseId"
          :graphId="currentKnowledgeGraph.id"
          :settings="graphSettings"
          @node-click="handleTreeNodeClick"
          @line-click="handleTreeLineClick"
        />

        <!-- 双向树布局组件 -->
        <BidirectionalTreeLayoutComponent
          v-else-if="graphSettings.layoutType === 'bidirectional-tree'"
          ref="bidirectionalTreeLayoutRef"
          :courseId="courseId"
          :graphId="currentKnowledgeGraph.id"
          :settings="graphSettings"
          @node-click="handleTreeNodeClick"
          @line-click="handleTreeLineClick"
        />
      </div>

      <!-- 节点详情面板 -->
      <div v-if="showNodeEditDialog && selectedNode" class="node-panel-container">
        <NodeDetailPanel
          :node="selectedNode"
          :related-nodes="[]"
          :course-id="courseId"
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
      <p class="empty-description">点击"生成图谱"按钮创建课程知识图谱</p>
      <button class="btn btn-primary" @click="generateGraph" :disabled="loading">
        <i class="generate-icon"></i>
        {{ loading ? '正在生成...' : '生成知识图谱' }}
      </button>
    </div>

    <!-- 知识图谱设置对话框 -->
    <KnowledgeGraphSettingsDialog
      v-model="showSettingsDialog"
      :course-id="courseId"
      :knowledge-graph="currentKnowledgeGraph"
      @settings-updated="handleSettingsUpdated"
    />


  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { getCourseKnowledgeGraphList, createKnowledgeGraph, getKnowledgeGraphNodes, createNode, updateNode } from '@/api/graph';
import { getCourseById } from '@/api/courses';
import KnowledgeGraphSettingsDialog from './KnowledgeGraphSettingsDialog.vue';
import TreeLayoutComponent from './TreeLayoutComponent.vue';
import CenterLayoutComponent from './CenterLayoutComponent.vue';
import BidirectionalTreeLayoutComponent from './BidirectionalTreeLayoutComponent.vue';
import NodeDetailPanel from '@/ui/graph/NodeDetailPanel.vue';
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
const autoCreatedCourseId = ref(null);
const iframeKey = ref(0); // 用于强制重新加载iframe
const showSettingsDialog = ref(false); // 设置对话框显示状态
const showNodeEditDialog = ref(false); // 节点编辑面板显示状态
const selectedNode = ref(null); // 当前选中的节点
const treeLayoutRef = ref(null); // TreeLayoutComponent引用
const centerLayoutRef = ref(null); // CenterLayoutComponent引用
const bidirectionalTreeLayoutRef = ref(null); // BidirectionalTreeLayoutComponent引用

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

// 获取课程知识图谱列表
const loadKnowledgeGraphList = async ({ allowAutoCreate = true } = {}) => {
  try {
    const response = await getCourseKnowledgeGraphList(props.courseId);

    if (response && Array.isArray(response.rows)) {
      knowledgeGraphList.value = response.rows;

      // 如果有知识图谱，选择第一个作为当前图谱
      if (knowledgeGraphList.value.length > 0) {
        currentKnowledgeGraph.value = knowledgeGraphList.value[0];
        await loadGraphData();
      } else if (allowAutoCreate && autoCreatedCourseId.value !== String(props.courseId)) {
        // 如果没有知识图谱，创建默认的知识图谱
        autoCreatedCourseId.value = String(props.courseId);
        await createDefaultKnowledgeGraph();
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

// 创建默认知识图谱
const createDefaultKnowledgeGraph = async () => {
  try {
    const defaultGraphData = {
      courseId: props.courseId,
      graphType: "0", // 知识图谱类型
      name: "课程知识图谱",
      content: "这是系统自动生成的课程知识图谱，展示了课程的知识结构和关联关系。",
      remark: "系统自动创建的默认知识图谱"
    };

    const createResponse = await createKnowledgeGraph(defaultGraphData);

    if (createResponse) {
      // 重新加载知识图谱列表
      await loadKnowledgeGraphList({ allowAutoCreate: false });
      return createResponse;
    } else {
      throw new Error(createResponse?.msg || '创建默认知识图谱失败');
    }
  } catch (error) {
    console.error('创建默认知识图谱失败:', error);
    throw error;
  }
};

// 检查并创建根节点（如果知识图谱没有节点）
const checkAndCreateRootNode = async () => {
  if (!currentKnowledgeGraph.value) {
    console.warn('没有当前知识图谱，无法检查节点');
    return;
  }

  try {
    // 检查知识图谱是否已有节点
    const nodesResponse = await getKnowledgeGraphNodes(currentKnowledgeGraph.value.id);
    const nodes = nodesResponse?.rows || [];

    console.log(`知识图谱 ${currentKnowledgeGraph.value.id} 当前节点数量:`, nodes.length);

    // 如果没有节点，自动创建根节点
    if (nodes.length === 0) {
      console.log('知识图谱没有节点，开始创建根节点...');

      // 获取课程信息以获取课程名称
      let courseName = '课程知识图谱'; // 默认名称
      try {
        const courseResponse = await getCourseById(props.courseId);
        // 从多个可能的位置提取课程名称
        if (courseResponse?.data?.name) {
          courseName = courseResponse.data.name;
        } else if (courseResponse?.courseData?.name) {
          courseName = courseResponse.courseData.name;
        } else if (courseResponse?.name) {
          courseName = courseResponse.name;
        }
        console.log('获取到课程名称:', courseName);
      } catch (error) {
        console.warn('获取课程信息失败，使用默认名称:', error);
      }

      // 创建根节点
      const rootNodeData = {
        name: courseName,
        content: `${courseName}的知识结构图`,
        parentId: null, // 根节点没有父节点
        graphId: currentKnowledgeGraph.value.id
      };

      console.log('正在创建根节点:', rootNodeData);
      const createResponse = await createNode(rootNodeData);

      if (createResponse && !createResponse.error) {
        console.log('根节点创建成功:', createResponse);
        // 强制重新加载iframe以显示新创建的节点
        iframeKey.value += 1;
        await nextTick();
      } else {
        console.error('根节点创建失败:', createResponse);
      }
    }
  } catch (error) {
    console.error('检查或创建根节点失败:', error);
    // 即使失败也不影响主要功能，只记录错误
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
    // 图谱可视化将通过iframe加载，这里只需要确认数据存在
    // 检查并创建根节点（如果需要）
    await checkAndCreateRootNode();
  } catch (error) {
    console.error('加载知识图谱数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 获取图谱URL（兼容Hash路由）
const getGraphUrl = () => {
  if (!currentKnowledgeGraph.value) {
    return '';
  }
  
  // 基于域名/IP判断是否为生产环境（更可靠的方法）
  const hostname = window.location.hostname;
  const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '0.0.0.0';
  
  // 生产环境强制使用hash路由
  const baseUrl = isProduction ? '/#/graph' : '/graph';
  const params = `embedded=true&courseId=${props.courseId}&graphId=${currentKnowledgeGraph.value.id}&t=${Date.now()}`;
  

  return `${baseUrl}?${params}`;
};

// iframe加载完成回调
const onGraphIframeLoad = () => {
  // iframe加载完成
};

// iframe错误处理
const handleIframeError = (event) => {
  console.error('知识图谱iframe加载错误:', event);
  console.error('错误的URL:', getGraphUrl());
  console.error('当前页面URL:', window.location.href);
  
  // 尝试用不同的URL格式重新加载
  alert(`图谱加载失败，URL: ${getGraphUrl()}\n请检查控制台了解详情，然后重试`);
  
  setTimeout(() => {
    iframeKey.value += 1;
  }, 1000);
};

// 监听全屏状态变化
const handleFullscreenChange = () => {
  // 当退出全屏时，确保页面状态正常
  if (!document.fullscreenElement) {
    setTimeout(() => {
      iframeKey.value += 1;
    }, 100);
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

// 打开设置对话框
const openSettingsDialog = () => {
  if (currentKnowledgeGraph.value) {
    showSettingsDialog.value = true;
  } else {
    alert('请先生成知识图谱');
  }
};

// 处理设置更新
const handleSettingsUpdated = (newSettings) => {
  console.log('CourseKnowledgeGraph: 收到设置更新:', newSettings);

  // 更新图谱设置
  if (newSettings) {
    Object.assign(graphSettings.value, newSettings);
  }

  // 如果切换到iframe模式，需要刷新iframe
  if (graphSettings.value.layoutType !== 'real-tree') {
    refreshKnowledgeGraph();
  }

  console.log('CourseKnowledgeGraph: 当前设置:', graphSettings.value);
};

// 处理树形布局节点点击
const handleTreeNodeClick = (node) => {
  console.log('CourseKnowledgeGraph: 树形节点点击:', node);

  // 设置选中的节点数据，适配NodeDetailPanel的数据结构
  selectedNode.value = {
    id: node.id,
    name: node.text || '',
    text: node.text || '',
    content: node.data?.content || ''
  };

  // 显示节点编辑面板
  showNodeEditDialog.value = true;
};

// 处理树形布局连线点击
const handleTreeLineClick = (line) => {
  console.log('CourseKnowledgeGraph: 树形连线点击:', line);
  // 这里可以添加连线点击的处理逻辑
};

// 处理节点编辑面板关闭
const handleNodeEditClose = () => {
  showNodeEditDialog.value = false;
  selectedNode.value = null;
};

// 处理节点编辑保存
const handleNodeEditSave = async (nodeData) => {
  try {
    console.log('保存节点数据:', nodeData);

    // 验证必要的数据
    if (!nodeData.id) {
      console.error('节点ID不能为空');
      alert('节点ID不能为空，无法保存');
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

    // 关闭面板
    handleNodeEditClose();

    // 刷新图谱数据以显示更新
    await refreshKnowledgeGraph();

    console.log('节点更新成功');
  } catch (error) {
    console.error('节点更新失败:', error);
    console.error('错误详情:', error.response?.data || error.message);

    let errorMessage = '节点更新失败，请重试';
    if (error.response?.data?.msg) {
      errorMessage = `节点更新失败: ${error.response.data.msg}`;
    } else if (error.message) {
      errorMessage = `节点更新失败: ${error.message}`;
    }

    alert(errorMessage);
  }
};

// 刷新知识图谱数据
const refreshKnowledgeGraph = async () => {
  await loadKnowledgeGraphList();
  // 强制重新加载iframe
  iframeKey.value += 1;
  await nextTick();
  emit('refresh');
};



// 暴露刷新方法给父组件
defineExpose({
  refreshKnowledgeGraph
});

// 生成知识图谱（空状态下的按钮）
const generateGraph = async () => {
  loading.value = true;

  try {
    // 创建默认知识图谱
    await createDefaultKnowledgeGraph();
  } catch (error) {
    console.error('生成知识图谱失败:', error);
    alert('生成知识图谱失败，请重试');
  } finally {
    loading.value = false;
  }
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

// 组件挂载时加载数据
onMounted(() => {
  // 自动加载知识图谱列表
  loadKnowledgeGraphList();

  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
});

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
});
</script>

<style scoped>
@import '@/teacher/styles/course-knowledge-graph.css';
</style>
