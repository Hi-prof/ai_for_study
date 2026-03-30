<template>
  <div class="ai-knowledge-graph-generator">
    <!-- 页面标题 -->
    <div class="page-header">
      <button class="btn btn-secondary" @click="goBack">
        <i class="back-icon"></i>
        返回
      </button>
      <h2 class="page-title">AI生成知识图谱</h2>
    </div>

    <!-- 主要内容区域 -->
    <ResizableLayout>
      <template #left>
        <InputPanel
          v-model="graphRequirements"
          :is-generating="aiGenerationService?.isGenerating || false"
          @generate="handleGenerate"
          @stop="handleStop"
        />
      </template>

      <template #right>
        <ResultDisplay
          v-model="generatedResult"
          :original-value="originalResult"
          :readonly-result="true"
          :is-generating="aiGenerationService?.isGenerating || false"
          :generation-progress="generationProgress"
          :generation-progress-text="generationProgressText"
          :is-exporting="false"
          :export-progress="0"
          :export-progress-text="''"
          :export-label="latestGraphId ? '查看知识图谱' : '等待生成完成'"
          :text-node-parser-ref="null"
          :selected-parent-node-id="''"
          :available-parent-nodes="[]"
          :is-loading-nodes="false"
          @reset="handleReset"
          @export="handleExport"
        />
      </template>
    </ResizableLayout>

    <!-- 服务组件 -->
    <AiGenerationService
      ref="aiGenerationService"
      :course-id="courseId"
      :course-name="courseName"
      @generation-start="onGenerationStart"
      @generation-progress="onGenerationProgress"
      @generation-success="onGenerationSuccess"
      @generation-error="onGenerationError"
      @generation-complete="onGenerationComplete"
    />

    <KnowledgeGraphManager
      ref="knowledgeGraphManager"
      :course-id="courseId"
      @course-info-loaded="onCourseInfoLoaded"
      @operation-error="onOperationError"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import InputPanel from '@/teacher/features/course-detail/knowledgegraph/InputPanel.vue';
import ResultDisplay from '@/teacher/features/course-detail/knowledgegraph/ResultDisplay.vue';
import ResizableLayout from '@/teacher/features/course-detail/knowledgegraph/ResizableLayout.vue';
import AiGenerationService from '@/teacher/features/course-detail/knowledgegraph/refactored/AiGenerationService.vue';
import KnowledgeGraphManager from '@/teacher/features/course-detail/knowledgegraph/refactored/KnowledgeGraphManager.vue';
import '@/teacher/styles/ai-knowledge-graph-generator.css';

// 定义props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
});

// 定义事件
const emit = defineEmits(['knowledge-graph-updated']);

// 路由
const router = useRouter();

// 组件引用
const aiGenerationService = ref(null);
const knowledgeGraphManager = ref(null);

// 响应式数据
const graphRequirements = ref('');
const generatedResult = ref('');
const originalResult = ref('');
const isResultModified = ref(false);
const generationProgress = ref(0);
const generationProgressText = ref('');
const courseName = ref('');
const latestTaskId = ref('');
const latestGraphId = ref('');
const latestTaskResult = ref(null);

// 返回上一页
const goBack = () => {
  router.back();
};

// 获取节点数量
const getNodeCount = () => {
  if (!generatedResult.value.trim() || !aiGenerationService.value) {
    return 0;
  }
  return aiGenerationService.value.getNodeCount();
};

// 处理生成请求
const handleGenerate = (payload) => {
  if (aiGenerationService.value) {
    aiGenerationService.value.generateKnowledgeGraph(payload);
  }
};

// 处理停止生成
const handleStop = () => {
  if (aiGenerationService.value) {
    aiGenerationService.value.stopGeneration();
  }
};

// 处理重置
const handleReset = () => {
  if (aiGenerationService.value) {
    const resetResult = aiGenerationService.value.resetResult();
    if (resetResult) {
      generatedResult.value = resetResult;
      isResultModified.value = false;
    }
  }
};

// 处理导出
const handleExport = () => {
  if (!generatedResult.value.trim()) {
    alert('暂无可查看的知识图谱结果');
    return;
  }

  if (!latestGraphId.value) {
    alert('请先完成一次 AI 生成，后端会自动创建并更新知识图谱');
    return;
  }

  onNavigateToGraph();
};

// AI生成服务事件处理
const onGenerationStart = () => {
  latestTaskId.value = '';
  latestGraphId.value = '';
  latestTaskResult.value = null;
  generatedResult.value = '';
  originalResult.value = '';
  isResultModified.value = false;
  generationProgress.value = 0;
  generationProgressText.value = '已提交后端生成请求，后端正在完成 AI 生成和图谱更新...';
  console.log('开始调用后端知识图谱生成接口...');
};

const onGenerationProgress = (data) => {
  generationProgress.value = data.progress?.percent || 0;
  generationProgressText.value = data.accumulated;
  console.log('知识图谱生成进度:', data.accumulated);
};

const onGenerationSuccess = (data) => {
  generatedResult.value = data.result;
  originalResult.value = data.original;
  isResultModified.value = false;
  latestTaskId.value = data.taskId || '';
  latestGraphId.value = data.graphId || '';
  latestTaskResult.value = data.taskResult || null;
  generationProgress.value = 100;
  generationProgressText.value = '后端已完成知识图谱生成、解析并更新图谱内容';
  emit('knowledge-graph-updated', {
    graphId: latestGraphId.value,
    taskId: latestTaskId.value
  });
  console.log('知识图谱已由后端直接更新，节点数:', data.taskResult?.nodes?.length || 0);
};

const onGenerationError = (error) => {
  alert(error.message);
};

const onGenerationComplete = () => {
  if (!latestTaskResult.value) {
    generationProgress.value = 0;
  }
  console.log('知识图谱生成完成');
};

// 知识图谱管理器事件处理
const onCourseInfoLoaded = (name) => {
  courseName.value = name;
};

const onOperationError = (error) => {
  console.error('操作错误:', error);
  alert(error.message);
};

const onNavigateToGraph = () => {
  console.log('导航到知识图谱页面');
  // 跳转到课程详情页面，会自动显示知识图谱
  router.push(`/teacher/course/${props.courseId}`);
};

// 监听生成结果的变化，检测是否被修改
watch(generatedResult, (newValue) => {
  if (originalResult.value && newValue !== originalResult.value) {
    isResultModified.value = true;
  } else if (newValue === originalResult.value) {
    isResultModified.value = false;
  }
  
  // 同步更新AI生成服务的状态
  if (aiGenerationService.value) {
    aiGenerationService.value.updateResult(newValue);
  }
});
</script>
