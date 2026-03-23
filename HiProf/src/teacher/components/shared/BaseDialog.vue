<template>
  <div v-if="modelValue" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-content" @click.stop :style="{ width: width, maxWidth: maxWidth }">
      <!-- 对话框头部 -->
      <div class="dialog-header">
        <h3 class="dialog-title">{{ title }}</h3>
        <button class="dialog-close" @click="closeDialog" :disabled="loading">×</button>
      </div>

      <!-- 对话框主体 -->
      <div class="dialog-body">
        <slot></slot>
      </div>

      <!-- 对话框底部 -->
      <div v-if="showFooter" class="dialog-footer">
        <slot name="footer">
          <button
            class="btn btn-secondary"
            @click="closeDialog"
            :disabled="loading"
          >
            {{ cancelText }}
          </button>
          <button
            v-if="showConfirm"
            class="btn btn-primary"
            @click="confirmDialog"
            :disabled="loading || confirmDisabled"
          >
            <span v-if="loading">{{ loadingText }}</span>
            <span v-else>{{ confirmText }}</span>
          </button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// 定义props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '对话框'
  },
  width: {
    type: String,
    default: '90%'
  },
  maxWidth: {
    type: String,
    default: '500px'
  },
  showFooter: {
    type: Boolean,
    default: true
  },
  showConfirm: {
    type: Boolean,
    default: true
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  confirmText: {
    type: String,
    default: '确认'
  },
  loadingText: {
    type: String,
    default: '处理中...'
  },
  loading: {
    type: Boolean,
    default: false
  },
  confirmDisabled: {
    type: Boolean,
    default: false
  },
  closeOnOverlay: {
    type: Boolean,
    default: true
  }
});

// 定义事件
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel', 'close']);

// 关闭对话框
const closeDialog = () => {
  emit('update:modelValue', false);
  emit('close');
  emit('cancel');
};

// 确认对话框
const confirmDialog = () => {
  emit('confirm');
};

// 处理遮罩层点击
const handleOverlayClick = () => {
  if (props.closeOnOverlay && !props.loading) {
    closeDialog();
  }
};
</script>

<style scoped>
/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.dialog-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;
  animation: dialogSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 12px 12px 0 0;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.dialog-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.dialog-close:hover:not(:disabled) {
  color: #374151;
  background-color: #f3f4f6;
}

.dialog-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dialog-body {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
}

/* 按钮样式 */
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  white-space: nowrap;
  text-transform: none;
  letter-spacing: 0.025em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: #fff;
  box-shadow: 0 2px 4px rgba(66, 153, 225, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(66, 153, 225, 0.4);
}

.btn-secondary {
  background-color: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #edf2f7;
  border-color: #cbd5e0;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .dialog-content {
    width: 95% !important;
    margin: 1rem;
    max-width: none !important;
  }

  .dialog-header,
  .dialog-body,
  .dialog-footer {
    padding: 1rem;
  }

  .dialog-footer {
    flex-direction: column;
  }

  .dialog-footer .btn {
    width: 100%;
  }
}

/* 滚动条样式 */
.dialog-content::-webkit-scrollbar,
.dialog-body::-webkit-scrollbar {
  width: 6px;
}

.dialog-content::-webkit-scrollbar-track,
.dialog-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb,
.dialog-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb:hover,
.dialog-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
