<template>
  <div class="ai-generation-service">
    <!-- 这个组件不渲染UI，只提供服务 -->
  </div>
</template>

<script setup>
import { ref, defineEmits, defineExpose } from 'vue';
import { createKnowledgeAgentTask, getKnowledgeAgentTask } from '@/api/graph';

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
const latestTaskResult = ref(null);
const latestTaskDetail = ref(null);
let pollingTimer = null;

// 生成知识图谱方法
const generateKnowledgeGraph = async (payload) => {
  const requirements = typeof payload === 'string' ? payload : payload?.requirements || '';
  const pdfPaths = Array.isArray(payload?.pdfPaths) ? payload.pdfPaths : [];

  if ((!requirements || !requirements.trim()) && pdfPaths.length === 0) {
    const error = new Error('请输入知识图谱内容描述或上传 PDF 文件');
    emit('generation-error', error);
    return;
  }

  isGenerating.value = true;
  emit('generation-start');

  try {
    // 重置结果状态
    generatedResult.value = '';
    originalResult.value = '';
    isResultModified.value = false;
    latestTaskResult.value = null;
    latestTaskDetail.value = null;
    clearPolling();

    const response = await createKnowledgeAgentTask({
      courseId: props.courseId,
      courseName: props.courseName || `课程-${props.courseId}`,
      teacherRequirements: requirements,
      sourceText: requirements,
      pdfPaths,
      graphType: '0'
    });

    const taskId = response?.data?.taskId || response?.taskId;
    if (!taskId) {
      throw new Error('未获取到知识图谱任务ID');
    }

    currentTaskId.value = taskId;
    emit('generation-progress', {
      chunk: '',
      accumulated: '任务已提交，正在准备生成...',
      length: 0,
      stage: 'submitted'
    });

    await pollTaskResult(taskId);

  } catch (error) {
    console.error('生成知识图谱失败:', error);

    // 根据错误类型提供更详细的错误信息
    let errorMessage = '生成知识图谱失败，请重试';
    if (error.message.includes('network') || error.message.includes('timeout')) {
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
    isGenerating.value = false;
    emit('generation-complete');
  }
};

// 停止生成
const stopGeneration = () => {
  if (isGenerating.value) {
    console.log('用户停止知识图谱任务轮询');
    isGenerating.value = false;
    clearPolling();
    emit('generation-complete');
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
  latestTaskResult: latestTaskResult.value,
  latestTaskDetail: latestTaskDetail.value
});

const getTaskId = () => currentTaskId.value;

const getTaskResult = () => latestTaskResult.value;

const getNodeCount = () => latestTaskResult.value?.nodes?.length || 0;

const pollTaskResult = async (taskId) => {
  const maxAttempts = 120;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (!isGenerating.value) {
      return;
    }

    const response = await getKnowledgeAgentTask(taskId);
    const taskDetail = response?.data || response;
    latestTaskDetail.value = taskDetail;

    const status = taskDetail?.status;
    const stage = taskDetail?.stage;
    const message = taskDetail?.message || '正在生成知识图谱...';

    emit('generation-progress', {
      chunk: '',
      accumulated: formatProgressMessage(stage, message),
      length: 0,
      stage
    });

    if (status === 'completed' && taskDetail?.result) {
      latestTaskResult.value = taskDetail.result;
      const previewText = buildPreviewText(taskDetail.result);
      generatedResult.value = previewText;
      originalResult.value = previewText;
      isResultModified.value = false;
      emit('generation-success', {
        result: previewText,
        original: previewText,
        taskId,
        taskResult: taskDetail.result,
        taskDetail
      });
      return;
    }

    if (status === 'failed') {
      throw new Error(taskDetail?.error || taskDetail?.message || '知识图谱生成失败');
    }

    await delay(2000);
  }

  throw new Error('知识图谱生成超时，请稍后重新查询任务状态');
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
    const key = node.parentId || 'root';
    if (!childrenMap.has(key)) {
      childrenMap.set(key, []);
    }
    childrenMap.get(key).push(node);
  });

  const lines = [];
  const walk = (parentId, prefix = '') => {
    const children = childrenMap.get(parentId) || [];
    children.forEach((node, index) => {
      const current = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
      lines.push(`${current}:${node.title}`);
      walk(node.id, current);
    });
  };

  walk('root');
  return lines.join('\n');
};

const formatProgressMessage = (stage, message) => {
  const stageTextMap = {
    submitted: '任务已提交',
    loading_sources: '正在读取资料',
    generating_skeleton: '正在生成骨架图',
    generating_light_cards: '正在生成轻卡片',
    generating_deep_cards: '正在生成深卡片',
    validating: '正在校验结果',
    completed: '知识图谱生成完成',
    failed: '知识图谱生成失败'
  };
  return `${stageTextMap[stage] || '正在处理'}：${message || ''}`;
};

const delay = (ms) => new Promise(resolve => {
  pollingTimer = setTimeout(resolve, ms);
});

const clearPolling = () => {
  if (pollingTimer) {
    clearTimeout(pollingTimer);
    pollingTimer = null;
  }
};

// 暴露方法给父组件
defineExpose({
  generateKnowledgeGraph,
  stopGeneration,
  resetResult,
  updateResult,
  getState,
  getTaskId,
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
