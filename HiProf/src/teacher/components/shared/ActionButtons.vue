<template>
  <div class="action-buttons" :class="{ 'vertical': vertical, 'center': center }">
    <button
      v-for="button in buttons"
      :key="button.key || button.text"
      :class="['btn', button.type || 'btn-primary', { 'loading': button.loading }]"
      :disabled="button.disabled || button.loading"
      @click="handleClick(button)"
    >
      <!-- 加载状态 -->
      <div v-if="button.loading" class="btn-loading">
        <div class="loading-spinner"></div>
      </div>
      
      <!-- 图标 -->
      <i v-else-if="button.icon" class="btn-icon" :class="button.icon"></i>
      
      <!-- 文本 -->
      <span class="btn-text">
        {{ button.loading ? (button.loadingText || '处理中...') : button.text }}
      </span>
    </button>
  </div>
</template>

<script setup>
// 定义props
const props = defineProps({
  // 按钮配置数组
  buttons: {
    type: Array,
    required: true,
    validator: (buttons) => {
      return buttons.every(button => 
        typeof button === 'object' && 
        typeof button.text === 'string'
      );
    }
  },
  
  // 布局方向
  vertical: {
    type: Boolean,
    default: false
  },
  
  // 居中对齐
  center: {
    type: Boolean,
    default: false
  }
});

// 定义事件
const emit = defineEmits(['click']);

// 处理按钮点击
const handleClick = (button) => {
  if (button.disabled || button.loading) {
    return;
  }
  
  emit('click', button);
  
  // 如果按钮有自定义点击处理函数，也调用它
  if (typeof button.onClick === 'function') {
    button.onClick();
  }
};
</script>

<style scoped>
/* 操作按钮容器 */
.action-buttons {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.action-buttons.vertical {
  flex-direction: column;
  align-items: stretch;
}

.action-buttons.center {
  justify-content: center;
}

/* 按钮基础样式 */
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
  position: relative;
  min-height: 44px;
  min-width: 80px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn.loading {
  cursor: not-allowed;
}

/* 按钮类型样式 */
.btn-primary {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: #fff;
  box-shadow: 0 2px 4px rgba(66, 153, 225, 0.3);
}

.btn-primary:hover:not(:disabled):not(.loading) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(66, 153, 225, 0.4);
}

.btn-secondary {
  background-color: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover:not(:disabled):not(.loading) {
  background-color: #edf2f7;
  border-color: #cbd5e0;
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  border: 2px solid rgba(66, 153, 225, 0.5);
  color: #4299e1;
}

.btn-outline:hover:not(:disabled):not(.loading) {
  background: rgba(66, 153, 225, 0.1);
  border-color: #4299e1;
  transform: translateY(-1px);
}

.btn-success {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: #fff;
  box-shadow: 0 2px 4px rgba(72, 187, 120, 0.3);
}

.btn-success:hover:not(:disabled):not(.loading) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(72, 187, 120, 0.4);
}

.btn-warning {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
  color: #fff;
  box-shadow: 0 2px 4px rgba(237, 137, 54, 0.3);
}

.btn-warning:hover:not(:disabled):not(.loading) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(237, 137, 54, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  color: #fff;
  box-shadow: 0 2px 4px rgba(245, 101, 101, 0.3);
}

.btn-danger:hover:not(:disabled):not(.loading) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 101, 101, 0.4);
}

/* 按钮内容 */
.btn-loading {
  display: flex;
  align-items: center;
  margin-right: 0.5rem;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 0.5rem;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  vertical-align: middle;
  flex-shrink: 0;
}

.btn-text {
  flex: 1;
}

/* 常用图标样式 */
.btn-icon.plus-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'%3E%3Cpath d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'/%3E%3C/svg%3E");
}

.btn-secondary .btn-icon.plus-icon,
.btn-outline .btn-icon.plus-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234299e1'%3E%3Cpath d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'/%3E%3C/svg%3E");
}

.btn-icon.edit-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'%3E%3Cpath d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'/%3E%3C/svg%3E");
}

.btn-icon.delete-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'%3E%3Cpath d='M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z'/%3E%3C/svg%3E");
}

.btn-icon.save-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'%3E%3Cpath d='M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z'/%3E%3C/svg%3E");
}

.btn-icon.upload-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'%3E%3Cpath d='M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z'/%3E%3C/svg%3E");
}

.btn-icon.download-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'%3E%3Cpath d='M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z'/%3E%3C/svg%3E");
}

/* 响应式设计 */
@media (max-width: 768px) {
  .action-buttons {
    gap: 0.75rem;
  }
  
  .action-buttons:not(.vertical) {
    flex-wrap: wrap;
  }
  
  .btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.8125rem;
    min-width: 70px;
  }
}

@media (max-width: 480px) {
  .action-buttons:not(.vertical) {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
