<template>
  <div class="ai-generation-service">
    <!-- 这个组件不渲染UI，只提供服务 -->
  </div>
</template>

<script setup>
import { ref, defineEmits, defineExpose } from 'vue';
import { generateKnowledgeGraphAndPersist } from '@/api/graph';

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
    const error = new Error('请输入知识图谱内容描述或上传 PDF 文件');
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

    emit('generation-progress', {
      accumulated: '已提交后端生成请求，正在等待后端完成 AI 生成和图谱入库...',
      progress: { percent: 20 }
    });

    const response = await generateKnowledgeGraphAndPersist({
      courseId: props.courseId,
      courseName: props.courseName || `课程-${props.courseId}`,
      teacherRequirements: requirements,
      sourceText,
      pdfPaths,
      graphType: '0'
    }, requestAbortController.signal);

    const data = response?.data || response || {};
    const taskResult = data.result || data.task?.result || null;
    const previewText = buildPreviewText(taskResult);

    currentTaskId.value = data.taskId || data.task?.taskId || '';
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
