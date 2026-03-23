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
          :is-exporting="exportController?.isExporting || false"
          :export-progress="exportController?.exportProgress || 0"
          :export-progress-text="exportController?.exportProgressText || ''"
          :text-node-parser-ref="nodeCreationService?.textNodeParserRef"
          :selected-parent-node-id="selectedParentNodeId"
          :available-parent-nodes="knowledgeGraphManager?.availableParentNodes || []"
          :is-loading-nodes="knowledgeGraphManager?.isLoadingNodes || false"
          @reset="handleReset"
          @export="handleExport"
          @update:selected-parent-node-id="selectedParentNodeId = $event"
        />
      </template>
    </ResizableLayout>

    <!-- 服务组件 -->
    <AiGenerationService
      ref="aiGenerationService"
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
      @parent-nodes-loaded="onParentNodesLoaded"
      @operation-error="onOperationError"
    />

    <NodeCreationService
      ref="nodeCreationService"
      @node-creation-progress="onNodeCreationProgress"
      @node-creation-result="onNodeCreationResult"
      @node-creation-complete="onNodeCreationComplete"
      @node-creation-error="onNodeCreationError"
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
import NodeCreationService from './NodeCreationService.vue';
import ExportController from './ExportController.vue';

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
const nodeCreationService = ref(null);
const exportController = ref(null);

// 响应式数据
const graphRequirements = ref('');
const generatedResult = ref('');
const originalResult = ref('');
const isResultModified = ref(false);
const selectedParentNodeId = ref('');
const courseName = ref('');

// 返回上一页
const goBack = () => {
  router.back();
};

// 获取节点数量
const getNodeCount = () => {
  if (!generatedResult.value.trim() || !nodeCreationService.value) {
    return 0;
  }
  return nodeCreationService.value.getNodeCount(generatedResult.value);
};

// 处理生成请求
const handleGenerate = () => {
  if (aiGenerationService.value) {
    aiGenerationService.value.generateKnowledgeGraph(graphRequirements.value);
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
    alert('没有可创建的内容');
    return;
  }

  if (!props.courseId) {
    alert('缺少课程ID，无法创建知识图谱节点');
    return;
  }

  if (exportController.value) {
    exportController.value.startExport();
  }
};

// AI生成服务事件处理
const onGenerationStart = () => {
  console.log('开始流式生成知识图谱...');
};

const onGenerationProgress = (data) => {
  // 实时更新显示的结果
  generatedResult.value = data.accumulated;
  console.log(`流式生成进度 - 长度: ${data.length}, 新内容: ${data.chunk.substring(0, 50)}...`);
  
  // 可以在这里添加更多的进度处理逻辑，比如：
  // - 更新进度条
  // - 滚动到最新内容
  // - 实时解析节点数量等
};

const onGenerationSuccess = (data) => {
  generatedResult.value = data.result;
  originalResult.value = data.original;
  isResultModified.value = false;
  console.log('知识图谱流式生成完成，最终内容长度:', data.result.length);
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

const onParentNodesLoaded = (nodes) => {
  console.log('父节点列表已加载:', nodes.length, '个节点');
};

const onOperationError = (error) => {
  console.error('操作错误:', error);
  alert(error.message);
};

// 节点创建服务事件处理
const onNodeCreationProgress = (data) => {
  if (exportController.value) {
    exportController.value.updateProgress(data.progress, data.message);
  }
};

const onNodeCreationResult = (result) => {
  console.log('节点创建结果:', result);
};

const onNodeCreationComplete = (results) => {
  if (exportController.value) {
    exportController.value.handleExportSuccess(results);
  }
};

const onNodeCreationError = (error) => {
  if (exportController.value) {
    exportController.value.handleExportError(error);
  }
};

// 导出控制器事件处理
const onExportStart = () => {
  console.log('开始导出流程...');
};

const onExportConfirm = async (options) => {
  try {
    // 确保知识图谱存在
    const graphId = await knowledgeGraphManager.value.ensureKnowledgeGraph(options);
    
    // 如果选择替换现有知识图谱，先删除所有现有节点
    if (options.replaceExisting) {
      exportController.value.updateProgress(0, '正在删除现有知识图谱节点...');
      await knowledgeGraphManager.value.deleteAllKnowledgeGraphNodes(
        graphId,
        (message) => exportController.value.updateProgress(0, message)
      );
    }

    // 创建知识图谱节点
    await nodeCreationService.value.createKnowledgeGraphNodes(
      generatedResult.value,
      graphId,
      {
        parentNodeId: selectedParentNodeId.value || null,
        onProgress: (message) => {
          exportController.value.updateProgress(0, message);
        }
      }
    );

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
