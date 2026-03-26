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
          :course-name="courseName"
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
          :course-name="courseName"
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
          :course-name="courseName"
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
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { getCourseKnowledgeGraphList, updateNode } from '@/api/graph';
import { getNodeDetail } from '@/api/node';
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
const showSettingsDialog = ref(false); // 设置对话框显示状态
const showNodeEditDialog = ref(false); // 节点编辑面板显示状态
const selectedNode = ref(null); // 当前选中的节点
const courseName = ref('课程知识图谱');
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
const handleTreeNodeClick = async (node) => {
  if (!node || node.data?.isVirtualRoot) {
    return;
  }

  console.log('CourseKnowledgeGraph: 树形节点点击:', node);

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
