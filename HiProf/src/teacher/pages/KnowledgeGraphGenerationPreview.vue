<template>
  <div class="kg-preview-page">
    <div class="page-header">
      <button class="btn btn-secondary" @click="cancelPreview">
        <i class="back-icon"></i>
        返回
      </button>
      <h2 class="page-title">知识图谱生成预览</h2>
    </div>

    <main class="kg-preview-shell">
      <section class="kg-preview-toolbar">
        <div class="kg-preview-status">
          <div class="kg-preview-stage">{{ stageText }}</div>
          <div class="kg-preview-meta">
            任务 {{ taskId }} · {{ draftNodeCount }} 个草稿节点
          </div>
          <div v-if="errorMessage" class="kg-preview-error">{{ errorMessage }}</div>
        </div>
        <div class="kg-preview-actions">
          <button type="button" class="btn btn-secondary" :disabled="isPersisting" @click="openStream">
            刷新进度
          </button>
          <button type="button" class="btn btn-secondary" :disabled="isPersisting" @click="cancelPreview">
            取消
          </button>
          <button type="button" class="btn btn-ai" :disabled="!canConfirm || isPersisting" @click="confirmPersist">
            <i v-if="isPersisting" class="loading-icon"></i>
            确认替换当前图谱
          </button>
        </div>
      </section>

      <section class="kg-preview-graph-panel">
        <RelationGraph
          ref="graphRef"
          class="kg-preview-graph"
          :options="graphOptions"
          :on-node-click="handleNodeClick"
        />
        <div v-if="draftGraph.nodes.length === 0" class="kg-preview-empty">
          <div class="kg-preview-empty-title">等待生成结果</div>
          <div class="kg-preview-empty-text">{{ stageText }}</div>
        </div>
      </section>

      <section v-if="selectedNode" class="kg-preview-node-panel">
        <div class="kg-preview-node-title">{{ selectedNode.text }}</div>
        <div class="kg-preview-node-content">
          {{ selectedNode.data?.content || selectedNode.data?.fullText || '暂无节点说明' }}
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import RelationGraph from 'relation-graph-vue3';
import {
  getKnowledgeGraphGenerationTask,
  getKnowledgeGraphGenerationTaskStreamUrl,
  persistKnowledgeGraphGenerationTask
} from '@/api/graph';
import { mapTaskResultToDraftGraph } from '@/teacher/features/course-detail/knowledgegraph/generationTaskGraphMapper.js';
import '@/teacher/styles/ai-knowledge-graph-generator.css';

const props = defineProps({
  courseId: [String, Number],
  taskId: String
});

const router = useRouter();
const graphRef = ref(null);
const taskDetail = ref(null);
const draftGraph = ref({ rootId: 'draft-root', nodes: [], links: [] });
const stream = ref(null);
const isPersisting = ref(false);
const errorMessage = ref('');
const selectedNode = ref(null);

const graphOptions = {
  backgroundColor: '#ffffff',
  moveToCenterWhenRefresh: false,
  zoomToFitWhenRefresh: false,
  defaultNodeShape: 1,
  defaultNodeWidth: 160,
  defaultNodeHeight: 56,
  defaultNodeBorderWidth: 1,
  defaultLineShape: 4,
  defaultJunctionPoint: 'lr',
  defaultLineColor: '#94a3b8',
  allowShowMiniToolBar: true,
  allowShowMiniView: true,
  layout: {
    label: '草稿树形图',
    layoutName: 'tree',
    from: 'left',
    layoutDirection: 'h',
    min_per_width: 260,
    max_per_width: 500,
    min_per_height: 90,
    max_per_height: 180
  }
};

const canConfirm = computed(() => {
  return taskDetail.value?.status === 'completed' && draftGraph.value.nodes.length > 1;
});

const draftNodeCount = computed(() => Math.max(draftGraph.value.nodes.length - 1, 0));

const courseName = computed(() => {
  return taskDetail.value?.request?.courseName || taskDetail.value?.result?.graphTitle || '课程知识图谱';
});

const stageText = computed(() => resolveTaskStageText(taskDetail.value));

const closeStream = () => {
  if (stream.value) {
    stream.value.close();
    stream.value = null;
  }
};

const applyTask = async (task) => {
  taskDetail.value = task;
  selectedNode.value = null;

  if (task?.result?.nodes?.length) {
    draftGraph.value = mapTaskResultToDraftGraph(task.result, courseName.value);
    await renderDraftGraph();
  }
};

const renderDraftGraph = async () => {
  await nextTick();
  const graphInstance = graphRef.value?.getInstance();
  if (!graphInstance || !draftGraph.value.nodes.length) return;

  await graphInstance.setJsonData(draftGraph.value);
  await graphInstance.moveToCenter();
  await graphInstance.zoomToFit();
};

const openStream = async () => {
  closeStream();
  errorMessage.value = '';

  try {
    const initial = await getKnowledgeGraphGenerationTask(props.taskId);
    const initialTask = unwrapApiData(initial);
    await applyTask(initialTask);

    if (['completed', 'failed'].includes(initialTask?.status)) {
      if (initialTask.status === 'failed') {
        errorMessage.value = initialTask.error || initialTask.message || '知识图谱生成失败';
      }
      return;
    }

    const streamUrl = buildStreamUrl(getKnowledgeGraphGenerationTaskStreamUrl(props.taskId));
    stream.value = new EventSource(streamUrl, { withCredentials: true });
    stream.value.addEventListener('task', handleTaskEvent);
    stream.value.addEventListener('completed', handleCompletedEvent);
    stream.value.addEventListener('failed', handleFailedEvent);
    stream.value.onerror = () => {
      errorMessage.value = '任务流连接中断，请刷新页面恢复进度';
      closeStream();
    };
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error, '加载知识图谱生成任务失败');
  }
};

const handleTaskEvent = async (event) => {
  await applyTask(JSON.parse(event.data));
};

const handleCompletedEvent = async (event) => {
  await applyTask(JSON.parse(event.data));
  closeStream();
};

const handleFailedEvent = async (event) => {
  const task = JSON.parse(event.data);
  await applyTask(task);
  errorMessage.value = task.error || task.message || '知识图谱生成失败';
  closeStream();
};

const confirmPersist = async () => {
  if (!canConfirm.value || isPersisting.value) return;

  isPersisting.value = true;
  errorMessage.value = '';
  closeStream();

  try {
    await persistKnowledgeGraphGenerationTask(props.taskId);
    router.push(`/teacher/course/${props.courseId}`);
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error, '保存知识图谱生成结果失败');
    alert(errorMessage.value);
  } finally {
    isPersisting.value = false;
  }
};

const cancelPreview = () => {
  closeStream();
  router.push(`/teacher/course/${props.courseId}`);
};

const handleNodeClick = (node) => {
  selectedNode.value = node;
};

const buildStreamUrl = (streamPath) => {
  if (streamPath.startsWith('http')) return streamPath;

  const apiBase = `${window.location.origin}/api`;
  return `${apiBase}${streamPath}`;
};

const resolveTaskStageText = (task) => {
  if (!task) return '正在加载任务状态...';
  if (task.status === 'completed') return '生成完成，等待确认替换当前图谱';
  if (task.status === 'failed') return '生成失败，当前草稿不会替换课程图谱';

  const currentItem = task?.progress?.currentItem || '';
  const nodeCount = Array.isArray(task?.result?.nodes) ? task.result.nodes.length : 0;

  if (task.stage === 'generating_skeleton' && nodeCount > 0) {
    return `已生成 ${nodeCount} 个节点，正在继续扩展结构`;
  }
  if (task.stage === 'generating_light_cards') {
    return currentItem ? `正在补充节点卡片：${currentItem}` : '正在补充节点卡片';
  }
  return currentItem || task.message || '知识图谱生成中...';
};

const unwrapApiData = (response) => response?.data || response || {};

const resolveErrorMessage = (error, fallback) => {
  return error?.businessResponse?.msg
    || error?.businessResponse?.message
    || error?.response?.data?.msg
    || error?.response?.data?.message
    || error?.message
    || fallback;
};

watch(() => props.taskId, () => {
  draftGraph.value = { rootId: 'draft-root', nodes: [], links: [] };
  openStream();
});

onMounted(openStream);
onBeforeUnmount(closeStream);
</script>
