<template>
  <button
    v-if="isSupported"
    :class="buttonClass"
    @click="openPreview"
    :disabled="disabled || loading"
    :title="buttonTitle"
  >
    <span v-if="loading" class="loading-icon">⏳</span>
    <span v-else class="preview-icon">👁️</span>
    <span v-if="showText" class="button-text">{{ buttonText }}</span>
  </button>
</template>

<script setup>
import { ref, computed } from 'vue';
import { isPreviewSupported, getFileType, getFileIcon } from '@/utils/fileViewerUtils';

// Props
const props = defineProps({
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    default: ''
  },
  fileSize: {
    type: Number,
    default: 0
  },
  buttonClass: {
    type: String,
    default: 'preview-btn'
  },
  showText: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'normal', // small, normal, large
    validator: (value) => ['small', 'normal', 'large'].includes(value)
  }
});

// Emits
const emit = defineEmits(['preview', 'error']);

// 响应式数据
const loading = ref(false);

// 计算属性
const isSupported = computed(() => {
  return isPreviewSupported(props.fileName);
});

const fileTypeInfo = computed(() => {
  const fileType = getFileType(props.fileName);
  const icon = getFileIcon(props.fileName);
  return {
    type: fileType,
    name: fileType,
    icon: icon
  };
});

const buttonText = computed(() => {
  if (loading.value) return '加载中...';
  return '预览';
});

const buttonTitle = computed(() => {
  if (!isSupported.value) return '不支持预览此文件类型';
  if (props.disabled) return '预览功能暂不可用';
  if (loading.value) return '正在加载预览...';
  return `预览 ${fileTypeInfo.value?.name || '文件'}`;
});

// 打开预览
const openPreview = async () => {
  if (!isSupported.value || props.disabled || loading.value) return;

  try {
    loading.value = true;
    
    // 触发预览事件
    emit('preview', {
      fileUrl: props.fileUrl,
      fileName: props.fileName,
      fileType: props.fileType,
      fileSize: props.fileSize
    });
  } catch (error) {
    console.error('预览失败:', error);
    emit('error', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.preview-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  white-space: nowrap;
}

.preview-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #007bff;
  color: #007bff;
}

.preview-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.preview-icon,
.loading-icon {
  font-size: 14px;
  line-height: 1;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.button-text {
  font-size: inherit;
}

/* 尺寸变体 */
.preview-btn.small {
  padding: 4px 8px;
  font-size: 11px;
  gap: 4px;
}

.preview-btn.small .preview-icon,
.preview-btn.small .loading-icon {
  font-size: 12px;
}

.preview-btn.large {
  padding: 8px 16px;
  font-size: 14px;
  gap: 8px;
}

.preview-btn.large .preview-icon,
.preview-btn.large .loading-icon {
  font-size: 16px;
}

/* 动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 主题变体 */
.preview-btn.primary {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.preview-btn.primary:hover:not(:disabled) {
  background: #0056b3;
  border-color: #0056b3;
}

.preview-btn.secondary {
  background: #6c757d;
  color: white;
  border-color: #6c757d;
}

.preview-btn.secondary:hover:not(:disabled) {
  background: #545b62;
  border-color: #545b62;
}

.preview-btn.success {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.preview-btn.success:hover:not(:disabled) {
  background: #1e7e34;
  border-color: #1e7e34;
}

/* 图标按钮（无文字） */
.preview-btn.icon-only {
  padding: 6px;
  min-width: 32px;
  justify-content: center;
}

.preview-btn.icon-only.small {
  padding: 4px;
  min-width: 24px;
}

.preview-btn.icon-only.large {
  padding: 8px;
  min-width: 40px;
}
</style>
