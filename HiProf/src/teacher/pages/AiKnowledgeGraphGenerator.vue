<template>
  <div class="ai-knowledge-graph-generator">
    <div class="page-header">
      <button class="btn btn-secondary" @click="goBack">
        <i class="back-icon"></i>
        返回
      </button>
      <h2 class="page-title">AI生成知识图谱</h2>
    </div>

    <main class="ai-chat-shell">
      <KnowledgeGraphChatInput
        v-model="graphRequirements"
        :is-submitting="isSubmitting"
        :progress-text="generationProgressText"
        @generate="handleGenerate"
        @stop="handleStop"
      />
    </main>

    <KnowledgeGraphManager
      ref="knowledgeGraphManager"
      :course-id="courseId"
      @course-info-loaded="onCourseInfoLoaded"
      @operation-error="onOperationError"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { createKnowledgeGraphGenerationTask } from '@/api/graph';
import KnowledgeGraphChatInput from '@/teacher/features/course-detail/knowledgegraph/KnowledgeGraphChatInput.vue';
import KnowledgeGraphManager from '@/teacher/features/course-detail/knowledgegraph/refactored/KnowledgeGraphManager.vue';
import '@/teacher/styles/ai-knowledge-graph-generator.css';

const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
});

const router = useRouter();
const knowledgeGraphManager = ref(null);
const graphRequirements = ref('');
const isSubmitting = ref(false);
const generationProgressText = ref('');
const courseName = ref('');
let generationAbortController = null;

const goBack = () => {
  router.back();
};

const resolveTaskId = (response) => {
  const data = response?.data || response || {};
  return data.taskId || data.task?.taskId || data.data?.taskId || data.data?.task?.taskId;
};

const handleGenerate = async (payload) => {
  if (isSubmitting.value) return;

  if (!payload?.requirements?.trim() && !payload?.sourceText?.trim()) {
    alert('请输入生成要求或上传可解析的资料');
    return;
  }

  generationAbortController = new AbortController();
  isSubmitting.value = true;
  generationProgressText.value = '正在创建知识图谱生成任务...';

  try {
    const response = await createKnowledgeGraphGenerationTask({
      courseId: props.courseId,
      courseName: courseName.value || `课程-${props.courseId}`,
      teacherRequirements: payload.requirements,
      sourceText: payload.sourceText,
      pdfPaths: payload.pdfPaths || [],
      graphType: '0'
    }, generationAbortController.signal);
    const taskId = resolveTaskId(response);

    if (!taskId) {
      throw new Error('未获取到知识图谱任务ID');
    }

    generationProgressText.value = '任务已创建，正在进入预览页...';
    router.push(`/teacher/course/${props.courseId}/ai-knowledge-graph/preview/${taskId}`);
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
      generationProgressText.value = '已停止创建知识图谱生成任务';
      return;
    }

    generationProgressText.value = error?.response?.data?.message
      || error?.response?.data?.msg
      || error?.message
      || '创建知识图谱生成任务失败';
    alert(generationProgressText.value);
  } finally {
    generationAbortController = null;
    isSubmitting.value = false;
  }
};

const handleStop = () => {
  if (generationAbortController) {
    generationAbortController.abort();
  }
};

const onCourseInfoLoaded = (name) => {
  courseName.value = name;
};

const onOperationError = (error) => {
  console.error('操作错误:', error);
  alert(error.message);
};
</script>
