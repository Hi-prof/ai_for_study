<template>
  <div class="ai-generation-service">
    <!-- 这个组件不渲染UI，只提供服务 -->
  </div>
</template>

<script setup>
import { ref, defineEmits, defineExpose } from 'vue';
import {
  createKnowledgeGraphGenerationTask,
  getKnowledgeGraphGenerationTask,
  persistKnowledgeGraphGenerationTask
} from '@/api/graph';

const TASK_POLL_INTERVAL_MS = 1000;
const TASK_MAX_POLL_ATTEMPTS = 600;

const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  },
  courseName: {
    type: String,
    default: ''
  }
});

// 定义事件
const emit = defineEmits([
  'generation-start',
  'generation-progress', // 新增：流式输出进度事件
  'generation-success', 
  'generation-error',
  'generation-complete'
]);

// 生成状态
const isGenerating = ref(false);
const generatedResult = ref('');
const originalResult = ref(''); // 保存AI原始生成的内容
const isResultModified = ref(false); // 标记结果是否被修改
const currentTaskId = ref('');
const currentGraphId = ref('');
const latestTaskResult = ref(null);
const latestTaskDetail = ref(null);
let requestAbortController = null;

// 生成知识图谱方法
const generateKnowledgeGraph = async (payload) => {
  const requirements = typeof payload === 'string' ? payload : payload?.requirements || '';
  const sourceText = typeof payload === 'string' ? payload : payload?.sourceText || requirements;
  const pdfPaths = Array.isArray(payload?.pdfPaths) ? payload.pdfPaths : [];

  if ((!requirements || !requirements.trim()) && (!sourceText || !sourceText.trim()) && pdfPaths.length === 0) {
    const error = new Error('请输入知识图谱内容描述或上传文档');
    emit('generation-error', error);
    return;
  }

  isGenerating.value = true;
  emit('generation-start');

  try {
    generatedResult.value = '';
    originalResult.value = '';
    isResultModified.value = false;
    latestTaskResult.value = null;
    latestTaskDetail.value = null;
    currentTaskId.value = '';
    currentGraphId.value = '';
    requestAbortController = new AbortController();

    const requestPayload = {
      courseId: props.courseId,
      courseName: props.courseName || `课程-${props.courseId}`,
      teacherRequirements: requirements,
      sourceText,
      pdfPaths,
      graphType: '0'
    };

    const createResponse = await createKnowledgeGraphGenerationTask(
      requestPayload,
      requestAbortController.signal
    );
    const createData = unwrapApiData(createResponse);
    currentTaskId.value = createData.taskId || createData.task?.taskId || '';
    if (!currentTaskId.value) {
      throw new Error('未获取到知识图谱任务ID');
    }

    emit('generation-progress', {
      accumulated: '任务已提交，正在解析资料并生成一级节点...',
      progress: { percent: 10 },
      taskId: currentTaskId.value,
      partial: true
    });

    const completedTask = await pollGenerationTask(
      currentTaskId.value,
      requestAbortController.signal
    );
    const completedPreviewText = buildPreviewText(completedTask.result);

    emit('generation-progress', {
      accumulated: '图谱内容已生成，正在保存到课程图谱...',
      progress: { percent: 95 },
      taskId: currentTaskId.value,
      taskResult: completedTask.result,
      taskDetail: completedTask,
      result: completedPreviewText,
      original: completedPreviewText,
      partial: true
    });

    const persistResponse = await persistKnowledgeGraphGenerationTask(
      currentTaskId.value,
      requestAbortController.signal
    );
    const data = unwrapApiData(persistResponse);
    const taskResult = data.result || data.task?.result || null;
    const previewText = buildPreviewText(taskResult);

    currentTaskId.value = data.taskId || data.task?.taskId || currentTaskId.value;
    currentGraphId.value = data.graphId || '';
    latestTaskResult.value = taskResult;
    latestTaskDetail.value = data.task || null;
    generatedResult.value = previewText;
    originalResult.value = previewText;
    isResultModified.value = false;

    emit('generation-progress', {
      accumulated: '后端已完成 AI 生成、结果解析和知识图谱更新',
      progress: { percent: 100 }
    });

    emit('generation-success', {
      result: previewText,
      original: previewText,
      taskId: currentTaskId.value,
      graphId: currentGraphId.value,
      taskResult,
      taskDetail: latestTaskDetail.value,
      partial: false,
      autoPersisted: true
    });

  } catch (error) {
    console.error('生成知识图谱失败:', error);

    // 根据错误类型提供更详细的错误信息
    let errorMessage = '生成知识图谱失败，请重试';
    if (error.name === 'CanceledError' || error.name === 'AbortError') {
      errorMessage = '知识图谱生成已取消';
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      errorMessage = '网络连接失败，请检查网络连接';
    } else if (error.response && error.response.status === 429) {
      errorMessage = 'API调用频率过高，请稍后重试';
    } else if (error.response && error.response.status === 401) {
      errorMessage = 'API认证失败，请检查API密钥';
    } else if (error.message) {
      errorMessage = error.message;
    }

    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    emit('generation-error', enhancedError);
  } finally {
    requestAbortController = null;
    isGenerating.value = false;
    emit('generation-complete');
  }
};

// 停止生成
const stopGeneration = () => {
  if (isGenerating.value && requestAbortController) {
    console.log('用户取消知识图谱生成请求');
    requestAbortController.abort();
  }
};

// 重置结果为AI原始生成内容
const resetResult = () => {
  if (originalResult.value) {
    generatedResult.value = originalResult.value;
    isResultModified.value = false;
    return originalResult.value;
  }
  return '';
};

// 更新生成结果
const updateResult = (newResult) => {
  generatedResult.value = newResult;
  if (originalResult.value && newResult !== originalResult.value) {
    isResultModified.value = true;
  } else if (newResult === originalResult.value) {
    isResultModified.value = false;
  }
};

// 获取当前状态
const getState = () => ({
  isGenerating: isGenerating.value,
  generatedResult: generatedResult.value,
  originalResult: originalResult.value,
  isResultModified: isResultModified.value,
  currentTaskId: currentTaskId.value,
  currentGraphId: currentGraphId.value,
  latestTaskResult: latestTaskResult.value,
  latestTaskDetail: latestTaskDetail.value
});

const getTaskId = () => currentTaskId.value;

const getGraphId = () => currentGraphId.value;

const getTaskResult = () => latestTaskResult.value;

const getNodeCount = () => latestTaskResult.value?.nodes?.length || 0;

const pollGenerationTask = async (taskId, signal) => {
  for (let attempt = 0; attempt < TASK_MAX_POLL_ATTEMPTS; attempt += 1) {
    throwIfAborted(signal);
    const response = await getKnowledgeGraphGenerationTask(taskId, signal);
    const task = unwrapApiData(response);
    handleTaskUpdate(task);

    if (task.status === 'completed') {
      return task;
    }

    if (task.status === 'failed') {
      throw new Error(task.error || task.message || '知识图谱生成失败');
    }

    await waitForNextPoll(signal);
  }

  throw new Error('知识图谱生成超时，请稍后重试');
};

const handleTaskUpdate = (task) => {
  latestTaskDetail.value = task;
  const taskResult = task.result || null;
  const previewText = buildPreviewText(taskResult);

  if (previewText) {
    latestTaskResult.value = taskResult;
    generatedResult.value = previewText;
    originalResult.value = previewText;
    isResultModified.value = false;
  }

  emit('generation-progress', {
    accumulated: resolveTaskProgressText(task),
    progress: { percent: resolveTaskProgressPercent(task) },
    taskId: currentTaskId.value,
    taskResult,
    taskDetail: task,
    result: previewText,
    original: previewText,
    partial: task.status !== 'completed'
  });
};

const resolveTaskProgressText = (task) => {
  const currentItem = task?.progress?.currentItem || '';
  const nodeCount = Array.isArray(task?.result?.nodes) ? task.result.nodes.length : 0;

  if (task?.status === 'completed') {
    return '知识图谱内容已生成，正在保存到课程图谱...';
  }
  if (task?.stage === 'generating_skeleton' && nodeCount > 0) {
    const topLevelCount = countReturnedTopLevelNodes(task.result.nodes);
    return `一级节点已返回，共 ${topLevelCount} 个节点，正在继续生成下级节点...`;
  }
  if (task?.stage === 'generating_light_cards') {
    return currentItem
      ? `图谱结构已返回，正在补充节点卡片：${currentItem}`
      : '图谱结构已返回，正在补充节点卡片...';
  }
  if (currentItem) {
    return currentItem;
  }

  return task?.message || '知识图谱生成中...';
};

const resolveTaskProgressPercent = (task) => {
  if (task?.status === 'completed') {
    return 95;
  }
  if (task?.status === 'failed') {
    return 0;
  }

  const stagePercent = Number(task?.progress?.percent || 0);
  const ranges = {
    submitted: [5, 10],
    loading_sources: [10, 20],
    generating_skeleton: [20, 55],
    generating_light_cards: [55, 90],
    validating: [90, 95]
  };
  const range = ranges[task?.stage] || [10, 90];
  const mapped = range[0] + Math.round(((range[1] - range[0]) * stagePercent) / 100);
  return Math.min(Math.max(mapped, range[0]), range[1]);
};

const unwrapApiData = (response) => response?.data || response || {};

const countReturnedTopLevelNodes = (nodes) => {
  const summaryChildren = nodes.filter(node => String(node.parentId || '') === 'summary');
  if (summaryChildren.length > 0) {
    return summaryChildren.length;
  }
  return Math.max(nodes.length - 1, 0);
};

const waitForNextPoll = (signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) {
    reject(createAbortError());
    return;
  }

  const onAbort = () => {
    clearTimeout(timer);
    reject(createAbortError());
  };
  const timer = setTimeout(() => {
    signal?.removeEventListener('abort', onAbort);
    resolve();
  }, TASK_POLL_INTERVAL_MS);

  signal?.addEventListener('abort', onAbort, { once: true });
});

const throwIfAborted = (signal) => {
  if (signal?.aborted) {
    throw createAbortError();
  }
};

const createAbortError = () => {
  const error = new Error('知识图谱生成已取消');
  error.name = 'AbortError';
  return error;
};

const buildPreviewText = (result) => {
  const nodes = Array.isArray(result?.nodes) ? result.nodes : [];
  if (!nodes.length) {
    return '';
  }

  const ordered = [...nodes].sort((a, b) => {
    if ((a.level || 0) !== (b.level || 0)) {
      return (a.level || 0) - (b.level || 0);
    }
    return String(a.id || '').localeCompare(String(b.id || ''));
  });

  const childrenMap = new Map();
  ordered.forEach(node => {
    const parentId = node.parentId;
    const key = parentId === null || parentId === undefined || parentId === '' || parentId === 0 || parentId === '0'
      ? 'root'
      : String(parentId);
    if (!childrenMap.has(key)) {
      childrenMap.set(key, []);
    }
    childrenMap.get(key).push(node);
  });

  const lines = [];
  const visited = new Set();
  const walk = (parentId, prefix = '') => {
    const children = childrenMap.get(parentId) || [];
    children.forEach((node, index) => {
      const current = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
      const nodeId = String(node.id || `${parentId}-${index}`);
      const title = String(node.title || node.name || node.label || '').trim();
      if (!title || visited.has(nodeId)) {
        return;
      }
      visited.add(nodeId);
      lines.push(`${current}:${title}`);
      walk(nodeId, current);
    });
  };

  walk('root');

  if (!lines.length) {
    ordered.forEach((node, index) => {
      const title = String(node.title || node.name || node.label || '').trim();
      if (title) {
        lines.push(`${index + 1}:${title}`);
      }
    });
  }

  return lines.join('\n');
};

// 暴露方法给父组件
defineExpose({
  generateKnowledgeGraph,
  stopGeneration,
  resetResult,
  updateResult,
  getState,
  getTaskId,
  getGraphId,
  getTaskResult,
  getNodeCount,
  isGenerating,
  generatedResult,
  originalResult,
  isResultModified
});
</script>

<style scoped>
.ai-generation-service {
  display: none;
}
</style>
