<template>
  <div class="loading-state" :class="{ 'compact': compact, 'inline': inline }">
    <!-- 加载动画 -->
    <div class="loading-spinner" :class="spinnerType" :style="{ width: spinnerSize, height: spinnerSize }">
      <div v-if="spinnerType === 'dots'" class="dots-spinner">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <div v-else-if="spinnerType === 'pulse'" class="pulse-spinner"></div>
      <div v-else-if="spinnerType === 'bars'" class="bars-spinner">
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
      </div>
      <!-- 默认圆形加载器 -->
    </div>
    
    <!-- 加载文本 -->
    <p v-if="text" class="loading-text">{{ text }}</p>
    
    <!-- 进度条（可选） -->
    <div v-if="showProgress && progress !== null" class="loading-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <div class="progress-text">{{ progress }}%</div>
    </div>
    
    <!-- 额外内容插槽 -->
    <div v-if="$slots.extra" class="loading-extra">
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<script setup>
// 定义props
const props = defineProps({
  // 加载文本
  text: {
    type: String,
    default: '正在加载...'
  },
  
  // 加载器类型
  spinnerType: {
    type: String,
    default: 'circle', // circle, dots, pulse, bars
    validator: (value) => ['circle', 'dots', 'pulse', 'bars'].includes(value)
  },
  
  // 加载器大小
  spinnerSize: {
    type: String,
    default: '40px'
  },
  
  // 进度相关
  showProgress: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: null,
    validator: (value) => value === null || (value >= 0 && value <= 100)
  },
  
  // 样式控制
  compact: {
    type: Boolean,
    default: false
  },
  inline: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped>
/* 加载状态样式 */
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.loading-state.compact {
  padding: 2rem 1rem;
  min-height: 120px;
}

.loading-state.inline {
  padding: 1rem;
  min-height: auto;
  flex-direction: row;
  gap: 0.75rem;
}

/* 加载动画容器 */
.loading-spinner {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-state.inline .loading-spinner {
  margin-bottom: 0;
}

/* 圆形加载器（默认） */
.loading-spinner:not(.dots):not(.pulse):not(.bars) {
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 点状加载器 */
.dots-spinner {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.dots-spinner .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #3b82f6;
  animation: dotPulse 1.4s ease-in-out infinite both;
}

.dots-spinner .dot:nth-child(1) { animation-delay: -0.32s; }
.dots-spinner .dot:nth-child(2) { animation-delay: -0.16s; }
.dots-spinner .dot:nth-child(3) { animation-delay: 0s; }

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
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: #3b82f6;
  animation: pulse 1.5s ease-in-out infinite;
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

/* 条状加载器 */
.bars-spinner {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.bars-spinner .bar {
  width: 4px;
  height: 100%;
  background-color: #3b82f6;
  animation: barStretch 1.2s ease-in-out infinite;
}

.bars-spinner .bar:nth-child(1) { animation-delay: -1.1s; }
.bars-spinner .bar:nth-child(2) { animation-delay: -1.0s; }
.bars-spinner .bar:nth-child(3) { animation-delay: -0.9s; }
.bars-spinner .bar:nth-child(4) { animation-delay: -0.8s; }

@keyframes barStretch {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
}

/* 加载文本 */
.loading-text {
  color: var(--text-color-secondary, #6b7280);
  font-size: 1rem;
  margin: 0;
  font-weight: 500;
}

.loading-state.compact .loading-text {
  font-size: 0.875rem;
}

.loading-state.inline .loading-text {
  font-size: 0.875rem;
  margin: 0;
}

/* 进度条 */
.loading-progress {
  margin-top: 1.5rem;
  width: 100%;
  max-width: 300px;
}

.loading-state.compact .loading-progress {
  margin-top: 1rem;
  max-width: 200px;
}

.loading-state.inline .loading-progress {
  margin-top: 0;
  margin-left: 1rem;
  max-width: 150px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
  animation: progressShimmer 2s ease-in-out infinite;
}

@keyframes progressShimmer {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-color-secondary, #6b7280);
  text-align: center;
  font-weight: 600;
}

/* 额外内容 */
.loading-extra {
  margin-top: 1rem;
  width: 100%;
  max-width: 400px;
}

.loading-state.compact .loading-extra {
  margin-top: 0.75rem;
  max-width: 300px;
}

.loading-state.inline .loading-extra {
  margin-top: 0;
  margin-left: 1rem;
  max-width: 200px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-state {
    padding: 3rem 1.5rem;
    min-height: 150px;
  }
  
  .loading-state.compact {
    padding: 1.5rem 1rem;
    min-height: 100px;
  }
  
  .loading-spinner {
    width: 32px !important;
    height: 32px !important;
    margin-bottom: 0.75rem;
  }
  
  .loading-state.inline .loading-spinner {
    width: 24px !important;
    height: 24px !important;
    margin-bottom: 0;
  }
  
  .loading-text {
    font-size: 0.875rem;
  }
  
  .loading-state.compact .loading-text,
  .loading-state.inline .loading-text {
    font-size: 0.8125rem;
  }
  
  .loading-progress {
    max-width: 250px;
  }
  
  .loading-state.compact .loading-progress {
    max-width: 180px;
  }
  
  .loading-state.inline .loading-progress {
    max-width: 120px;
  }
}

@media (max-width: 480px) {
  .loading-state.inline {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .loading-state.inline .loading-progress {
    margin-left: 0;
    margin-top: 0.5rem;
  }
  
  .loading-state.inline .loading-extra {
    margin-left: 0;
    margin-top: 0.5rem;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .loading-spinner:not(.dots):not(.pulse):not(.bars) {
    border-color: #374151;
    border-top-color: #60a5fa;
  }
  
  .dots-spinner .dot,
  .pulse-spinner,
  .bars-spinner .bar {
    background-color: #60a5fa;
  }
  
  .loading-text {
    color: #d1d5db;
  }
  
  .progress-bar {
    background-color: #374151;
  }
  
  .progress-fill {
    background: linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%);
  }
  
  .progress-text {
    color: #d1d5db;
  }
}
</style>
