<template>
  <div class="export-controller">
    <!-- 创建知识图谱确认对话框 -->
    <KnowledgeGraphExportDialog
      v-model="showExportDialog"
      mode="confirm"
      :node-count="nodeCount"
      :course-name="courseName"
      :progress="exportProgress"
      :progress-text="exportProgressText"
      :is-loading="isExporting"
      @confirm="handleExportConfirm"
      @cancel="handleExportCancel"
    />

    <!-- 成功提示对话框 -->
    <KnowledgeGraphExportDialog
      v-model="showSuccessDialog"
      mode="success"
      :success-title="getDialogTitle()"
      :success-message="getSuccessMessage()"
      :success-details="getSuccessDetails()"
      :show-navigate-button="successResult.successCount > 0"
      @navigate="handleNavigateToKnowledgeGraph"
    />
  </div>
</template>

<script setup>
import { ref, defineEmits, defineExpose } from 'vue';
import { useRouter } from 'vue-router';
import KnowledgeGraphExportDialog from '../KnowledgeGraphExportDialog.vue';

// 定义props
const props = defineProps({
  courseName: {
    type: String,
    default: ''
  },
  nodeCount: {
    type: Number,
    default: 0
  }
});

// 定义事件
const emit = defineEmits([
  'export-start',
  'export-confirm',
  'export-cancel',
  'export-success',
  'export-error',
  'export-complete',
  'navigate-to-graph'
]);

// 路由
const router = useRouter();

// 导出状态
const isExporting = ref(false);
const exportProgress = ref(0);
const exportProgressText = ref('');
const showExportDialog = ref(false);

// 成功对话框状态
const showSuccessDialog = ref(false);
const successResult = ref({
  successCount: 0,
  failCount: 0,
  total: 0
});

// 开始导出流程
const startExport = () => {
  if (isExporting.value) {
    return;
  }
  
  showExportDialog.value = true;
  emit('export-start');
};

// 处理导出确认
const handleExportConfirm = async (options) => {
  isExporting.value = true;
  exportProgress.value = 0;
  exportProgressText.value = '开始创建知识图谱节点...';
  
  emit('export-confirm', options);
};

// 处理导出取消
const handleExportCancel = () => {
  showExportDialog.value = false;
  emit('export-cancel');
};

// 更新导出进度
const updateProgress = (progress, text) => {
  exportProgress.value = progress;
  exportProgressText.value = text;
};

// 处理导出成功
const handleExportSuccess = (result) => {
  exportProgress.value = 100;
  exportProgressText.value = '知识图谱节点创建完成！';

  const successCount = result.success ? result.success.length : 0;
  const failCount = result.failed ? result.failed.length : 0;

  setTimeout(() => {
    showExportDialog.value = false;

    // 设置成功结果数据
    successResult.value = {
      successCount,
      failCount,
      total: successCount + failCount
    };

    // 显示成功对话框
    showSuccessDialog.value = true;
    emit('export-success', result);
  }, 1000);
};

// 处理导出错误
const handleExportError = (error) => {
  console.error('导出失败:', error);
  showExportDialog.value = false;

  // 设置错误结果数据，显示错误对话框
  successResult.value = {
    successCount: 0,
    failCount: 1,
    total: 1
  };

  showSuccessDialog.value = true;
  emit('export-error', error);
};

// 完成导出
const completeExport = () => {
  isExporting.value = false;
  emit('export-complete');
};

// 获取对话框标题
const getDialogTitle = () => {
  const { successCount, failCount } = successResult.value;
  if (successCount === 0 && failCount > 0) {
    return '创建失败';
  } else if (failCount === 0) {
    return '创建成功！';
  } else {
    return '创建完成';
  }
};

// 获取成功消息
const getSuccessMessage = () => {
  const { successCount, failCount } = successResult.value;
  if (successCount === 0 && failCount > 0) {
    return '创建知识图谱节点过程中发生错误，请重试。';
  } else if (failCount === 0) {
    return `共创建 ${successCount} 个知识图谱节点。您可以在知识图谱页面查看创建的节点。`;
  } else {
    return `成功 ${successCount} 个，失败 ${failCount} 个。请在知识图谱页面查看结果。`;
  }
};

// 获取成功详情
const getSuccessDetails = () => {
  const { failCount, total } = successResult.value;
  if (failCount === 0) {
    return `所有 ${total} 个知识图谱节点都已成功创建并添加到课程中。`;
  } else {
    return `${total} 个节点中有 ${failCount} 个创建失败，请检查具体原因。`;
  }
};

// 处理导航到知识图谱页面
const handleNavigateToKnowledgeGraph = () => {
  router.back();
  emit('navigate-to-graph');
};

// 重置状态
const reset = () => {
  isExporting.value = false;
  exportProgress.value = 0;
  exportProgressText.value = '';
  showExportDialog.value = false;
  showSuccessDialog.value = false;
  successResult.value = {
    successCount: 0,
    failCount: 0,
    total: 0
  };
};

// 暴露方法给父组件
defineExpose({
  startExport,
  updateProgress,
  handleExportSuccess,
  handleExportError,
  completeExport,
  reset,
  isExporting,
  exportProgress,
  exportProgressText,
  showExportDialog,
  showSuccessDialog
});
</script>

<style scoped>
.export-controller {
  /* 这个组件主要管理对话框，不需要特殊样式 */
}
</style>
