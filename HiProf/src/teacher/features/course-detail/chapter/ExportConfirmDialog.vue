<template>
  <div v-if="isVisible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <!-- 对话框头部 -->
      <div class="dialog-header">
        <h3 class="dialog-title">{{ title }}</h3>
        <button class="close-btn" @click="closeDialog" :disabled="isLoading">
          <i class="close-icon">×</i>
        </button>
      </div>

      <!-- 对话框内容 -->
      <div class="dialog-content">
        <!-- 导出确认模式内容 -->
        <div v-if="mode === 'confirm'" class="confirm-content">
          <div class="export-info">
            <div class="info-item">
              <i class="info-icon">📄</i>
              <span class="info-text">即将导出 {{ nodeCount }} 个章节节点</span>
            </div>
            <div class="info-item">
              <i class="info-icon">📚</i>
              <span class="info-text">目标课程：{{ courseName || '当前课程' }}</span>
            </div>
          </div>

          <!-- 删除旧章节选项 -->
          <div class="option-section">
            <div class="option-item">
              <label class="checkbox-container">
                <input 
                  type="checkbox" 
                  v-model="deleteOldChapters" 
                  :disabled="isLoading"
                  class="checkbox-input"
                >
                <span class="checkbox-mark"></span>
                <span class="checkbox-label">删除旧章节</span>
              </label>
              <p class="option-description">
                勾选此项将在导入新章节前删除课程中的所有现有章节。
                <span class="warning-text">此操作不可撤销，请谨慎选择。</span>
              </p>
            </div>
          </div>
        </div>

        <!-- 成功提示模式内容 -->
        <div v-else-if="mode === 'success'" class="success-content">
          <div class="success-icon-container">
            <i class="success-icon">✅</i>
          </div>
          <div class="success-message">
            <h4 class="success-title">{{ successTitle || '导出成功！' }}</h4>
            <p class="success-description">{{ successMessage }}</p>
          </div>
          <div v-if="successDetails" class="success-details">
            <p>{{ successDetails }}</p>
          </div>
        </div>

        <!-- 导出进度 -->
        <div v-if="isLoading && mode === 'confirm'" class="progress-section">
          <div class="progress-header">
            <span class="progress-text">{{ progressText }}</span>
            <span class="progress-percentage">{{ Math.round(progress) }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>
      </div>

      <!-- 对话框底部 -->
      <div class="dialog-footer">
        <!-- 导出确认模式按钮 -->
        <template v-if="mode === 'confirm'">
          <button 
            class="btn btn-secondary" 
            @click="closeDialog"
            :disabled="isLoading"
          >
            {{ isLoading ? '导出中...' : '取消' }}
          </button>
          <button 
            class="btn btn-primary" 
            @click="confirmExport"
            :disabled="isLoading"
          >
            <i v-if="isLoading" class="loading-icon"></i>
            <i v-else class="export-icon">📤</i>
            {{ isLoading ? '导出中...' : '确认导出' }}
          </button>
        </template>

        <!-- 成功提示模式按钮 -->
        <template v-else-if="mode === 'success'">
          <button 
            class="btn btn-secondary" 
            @click="closeDialog"
          >
            {{ cancelButtonText || '确定' }}
          </button>
          <button 
            v-if="showNavigateButton"
            class="btn btn-primary" 
            @click="handleNavigate"
          >
            <i class="navigate-icon">🔙</i>
            {{ navigateButtonText || '返回章节管理' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// 定义props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'confirm', // 'confirm' | 'success'
    validator: (value) => ['confirm', 'success'].includes(value)
  },
  title: {
    type: String,
    default: '导出章节确认'
  },
  // 确认模式相关props
  nodeCount: {
    type: Number,
    default: 0
  },
  courseName: {
    type: String,
    default: ''
  },
  progress: {
    type: Number,
    default: 0
  },
  progressText: {
    type: String,
    default: ''
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  // 成功模式相关props
  successTitle: {
    type: String,
    default: ''
  },
  successMessage: {
    type: String,
    default: ''
  },
  successDetails: {
    type: String,
    default: ''
  },
  showNavigateButton: {
    type: Boolean,
    default: true
  },
  navigateButtonText: {
    type: String,
    default: '返回章节管理'
  },
  cancelButtonText: {
    type: String,
    default: '确定'
  }
});

// 定义事件
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel', 'navigate']);

// 响应式数据
const deleteOldChapters = ref(false);

// 计算属性
const isVisible = computed(() => props.modelValue);

// 关闭对话框
const closeDialog = () => {
  if (!props.isLoading) {
    emit('update:modelValue', false);
    emit('cancel');
    // 重置状态
    deleteOldChapters.value = false;
  }
};

// 确认导出
const confirmExport = () => {
  emit('confirm', {
    deleteOldChapters: deleteOldChapters.value
  });
};

// 处理导航
const handleNavigate = () => {
  emit('navigate');
  closeDialog();
};

// 处理遮罩层点击
const handleOverlayClick = () => {
  if (!props.isLoading) {
    closeDialog();
  }
};
</script>

<style scoped>
@import '@/teacher/styles/export-confirm-dialog.css';
</style>
