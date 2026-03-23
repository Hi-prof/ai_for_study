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
          :is-exporting="exportController?.isExporting || false"
          :export-progress="exportController?.exportProgress || 0"
          :export-progress-text="exportController?.exportProgressText || ''"
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

    <ExportController
      ref="exportController"
      :course-name="courseName"
      :node-count="getNodeCount()"
      @export-start="onExportStart"
      @export-confirm="onExportConfirm"
      @export-cancel="onExportCancel"
      @export-success="onExportSuccess"
      @export-error="onExportError"
      @export-complete="onExportComplete"
      @navigate-to-graph="onNavigateToGraph"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import InputPanel from '../InputPanel.vue';
import ResultDisplay from '../ResultDisplay.vue';
import ResizableLayout from '../ResizableLayout.vue';
import AiGenerationService from './AiGenerationService.vue';
import KnowledgeGraphManager from './KnowledgeGraphManager.vue';
import ExportController from './ExportController.vue';
import { persistKnowledgeAgentTask } from '@/api/graph';

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
const exportController = ref(null);

// 响应式数据
const graphRequirements = ref('');
const generatedResult = ref('');
const originalResult = ref('');
const isResultModified = ref(false);
const courseName = ref('');
const latestTaskId = ref('');
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
    alert('没有可保存的知识图谱结果');
    return;
  }

  if (!latestTaskId.value) {
    alert('请先完成一次AI生成，再保存到知识图谱');
    return;
  }

  if (exportController.value) {
    exportController.value.startExport();
  }
};

// AI生成服务事件处理
const onGenerationStart = () => {
  latestTaskId.value = '';
  latestTaskResult.value = null;
  console.log('开始提交知识图谱智能体任务...');
};

const onGenerationProgress = (data) => {
  generatedResult.value = data.accumulated;
  console.log('知识图谱任务进度:', data.stage, data.accumulated);
};

const onGenerationSuccess = (data) => {
  generatedResult.value = data.result;
  originalResult.value = data.original;
  isResultModified.value = false;
  latestTaskId.value = data.taskId || '';
  latestTaskResult.value = data.taskResult || null;
  console.log('知识图谱任务完成，节点数:', data.taskResult?.nodes?.length || 0);
};

const onGenerationError = (error) => {
  alert(error.message);
};

const onGenerationComplete = () => {
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

// 导出控制器事件处理
const onExportStart = () => {
  console.log('开始导出流程...');
};

const onExportConfirm = async (options) => {
  try {
    if (!latestTaskId.value) {
      throw new Error('缺少任务ID，无法保存知识图谱');
    }

    exportController.value.updateProgress(30, '正在将智能体结果保存到后端知识图谱...');
    const persistResponse = await persistKnowledgeAgentTask(latestTaskId.value);
    exportController.value.updateProgress(100, '知识图谱保存完成');
    exportController.value.handleExportSuccess({
      success: [persistResponse?.data || latestTaskResult.value || {}],
      failed: []
    });

  } catch (error) {
    console.error('导出确认处理失败:', error);
    if (exportController.value) {
      exportController.value.handleExportError(error);
    }
  } finally {
    if (exportController.value) {
      exportController.value.completeExport();
    }
  }
};

const onExportCancel = () => {
  console.log('用户取消导出');
};

const onExportSuccess = (result) => {
  console.log('导出成功:', result);
  // 延迟一段时间后自动返回到课程详情页面，触发知识图谱刷新
  setTimeout(() => {
    router.push(`/teacher/course/${props.courseId}`);
  }, 2000); // 给用户2秒时间看到成功提示
};

const onExportError = (error) => {
  console.error('导出失败:', error);
};

const onExportComplete = () => {
  console.log('导出流程完成');
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

<style scoped>
@import '@/teacher/styles/ai-knowledge-graph-generator.css';
</style>
