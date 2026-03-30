<template>
  <Teleport to="body">
    <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
      <div class="dialog-container" @click.stop>
      <!-- 对话框头部 -->
      <div class="dialog-header">
        <h3 class="dialog-title">{{ title }}</h3>
        <button class="close-btn" @click="closeDialog">
          <i class="close-icon">×</i>
        </button>
      </div>

      <!-- 对话框内容 -->
      <div class="dialog-content">
        <div class="success-content">
          <div class="success-icon-container">
            <div class="success-icon-wrapper">
              <i class="success-icon">✅</i>
              <div class="success-animation"></div>
            </div>
          </div>
          <div class="success-message">
            <h4 class="success-title">{{ title }}</h4>
            <p class="success-description">{{ message }}</p>
          </div>
          <div v-if="details" class="success-details">
            <p>{{ details }}</p>
          </div>
        </div>
      </div>

      <!-- 对话框底部 -->
      <div class="dialog-footer">
        <button 
          class="btn btn-primary" 
          @click="closeDialog"
        >
          <i class="check-icon">✓</i>
          确定
        </button>
        <button 
          v-if="showNavigateButton"
          class="btn btn-secondary" 
          @click="handleNavigate"
        >
          <i class="navigate-icon">🔙</i>
          {{ navigateButtonText || '返回' }}
        </button>
      </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, watch } from 'vue';

// 定义props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '操作成功！'
  },
  message: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    default: ''
  },
  showNavigateButton: {
    type: Boolean,
    default: false
  },
  navigateButtonText: {
    type: String,
    default: '返回'
  },
  autoClose: {
    type: Boolean,
    default: false
  },
  autoCloseDelay: {
    type: Number,
    default: 3000
  }
});

// 定义事件
const emit = defineEmits(['close', 'navigate']);

// 自动关闭定时器
let autoCloseTimer = null;

// 关闭对话框
const closeDialog = () => {
  emit('close');
  clearAutoCloseTimer();
};

// 处理导航
const handleNavigate = () => {
  emit('navigate');
  closeDialog();
};

// 处理遮罩层点击
const handleOverlayClick = () => {
  closeDialog();
};

// 清除自动关闭定时器
const clearAutoCloseTimer = () => {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }
};

// 设置自动关闭
const setAutoClose = () => {
  if (props.autoClose && props.visible) {
    clearAutoCloseTimer();
    autoCloseTimer = setTimeout(() => {
      closeDialog();
    }, props.autoCloseDelay);
  }
};

// 监听visible变化
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    setAutoClose();
  } else {
    clearAutoCloseTimer();
  }
});

// 组件挂载时设置自动关闭
onMounted(() => {
  if (props.visible) {
    setAutoClose();
  }
});
</script>

<style scoped>
/* 对话框遮罩层 */
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
  padding: 1rem;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 对话框容器 */
.dialog-container {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 480px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 对话框头部 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0 1.5rem;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
  color: #6b7280;
  font-size: 1.5rem;
  line-height: 1;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

/* 对话框内容 */
.dialog-content {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.success-content {
  text-align: center;
}

.success-icon-container {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}

.success-icon-wrapper {
  position: relative;
  display: inline-block;
}

.success-icon {
  font-size: 4rem;
  animation: bounceIn 0.6s ease-out;
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.success-animation {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  border: 3px solid #10b981;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: ripple 1.5s ease-out infinite;
  opacity: 0.3;
}

@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.6;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

.success-message {
  margin-bottom: 1rem;
}

.success-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #059669;
  margin: 0 0 0.75rem 0;
}

.success-description {
  color: #374151;
  font-size: 1rem;
  line-height: 1.5;
  margin: 0;
}

.success-details {
  background-color: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
}

.success-details p {
  color: #0369a1;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

/* 按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  text-decoration: none;
}

.btn-primary {
  background-color: #059669;
  color: white;
  border-color: #059669;
}

.btn-primary:hover {
  background-color: #047857;
  border-color: #047857;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

/* 图标样式 */
.check-icon, .navigate-icon {
  font-size: 1rem;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .dialog-container {
    margin: 1rem;
    max-width: calc(100vw - 2rem);
  }
  
  .dialog-header,
  .dialog-content,
  .dialog-footer {
    padding: 1rem;
  }
  
  .dialog-footer {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .success-icon {
    font-size: 3rem;
  }
  
  .success-animation {
    width: 60px;
    height: 60px;
  }
}
</style>
