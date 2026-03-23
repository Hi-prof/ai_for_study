<template>
  <div class="loading-spinner" :class="spinnerClasses">
    <div class="spinner-container">
      <div v-if="type === 'dots'" class="dots-spinner">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>

      <div v-else-if="type === 'pulse'" class="pulse-spinner">
        <div class="pulse-circle"></div>
      </div>

      <div v-else class="default-spinner">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2"/>
          <path d="M12 3C16.9706 3 21 7.02944 21 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
    </div>

    <p v-if="text" class="loading-text">{{ text }}</p>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'LoadingSpinner',
  props: {
    type: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'dots', 'pulse'].includes(value)
    },
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg'].includes(value)
    },
    text: {
      type: String,
      default: ''
    },
    overlay: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const spinnerClasses = computed(() => [
      `spinner-${props.size}`,
      {
        'spinner-overlay': props.overlay
      }
    ])

    return {
      spinnerClasses
    }
  }
}
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  color: var(--primary-color);
}

.spinner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: var(--z-modal);
}

.spinner-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 尺寸变体 */
.spinner-sm .spinner-container {
  width: 24px;
  height: 24px;
}

.spinner-md .spinner-container {
  width: 40px;
  height: 40px;
}

.spinner-lg .spinner-container {
  width: 56px;
  height: 56px;
}

/* 默认旋转动画 */
.default-spinner svg {
  width: 100%;
  height: 100%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 点状加载器 */
.dots-spinner {
  display: flex;
  gap: 4px;
  align-items: center;
}

.dots-spinner .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
  animation: dotPulse 1.4s infinite ease-in-out;
}

.dots-spinner .dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dots-spinner .dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes dotPulse {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 脉冲加载器 */
.pulse-spinner {
  position: relative;
  width: 100%;
  height: 100%;
}

.pulse-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: currentColor;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* 加载文本 */
.loading-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.4;
  margin: 0;
}

.spinner-sm .loading-text {
  font-size: var(--text-xs);
}

.spinner-lg .loading-text {
  font-size: var(--text-base);
}

/* 深色主题适配 */
[data-theme="dark"] .spinner-overlay {
  background-color: rgba(31, 41, 55, 0.9);
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  .default-spinner svg,
  .dots-spinner .dot,
  .pulse-circle {
    animation: none;
  }
}
</style>