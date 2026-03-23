<template>
  <div :class="cardClasses" @click="handleClick">
    <!-- 卡片头部 -->
    <header v-if="$slots.header || title || subtitle" class="card-header">
      <slot name="header">
        <div class="card-header-content">
          <div class="card-title-section">
            <h3 v-if="title" class="card-title">{{ title }}</h3>
            <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
          </div>
          <div v-if="$slots.actions" class="card-actions">
            <slot name="actions" />
          </div>
        </div>
      </slot>
    </header>

    <!-- 卡片图片 -->
    <div v-if="image || $slots.image" class="card-image">
      <slot name="image">
        <img v-if="image" :src="image" :alt="imageAlt" class="card-img" />
      </slot>
    </div>

    <!-- 卡片内容 -->
    <div v-if="$slots.default" class="card-body" :class="bodyClasses">
      <slot />
    </div>

    <!-- 卡片底部 -->
    <footer v-if="$slots.footer" class="card-footer" :class="footerClasses">
      <slot name="footer" />
    </footer>

    <!-- 加载遮罩 -->
    <div v-if="loading" class="card-loading">
      <div class="loading-spinner">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2"/>
          <path d="M12 3C16.9706 3 21 7.02944 21 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'BaseCard',
  props: {
    title: {
      type: String,
      default: ''
    },
    subtitle: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    imageAlt: {
      type: String,
      default: ''
    },
    variant: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'outlined', 'elevated', 'flat'].includes(value)
    },
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg'].includes(value)
    },
    padding: {
      type: String,
      default: 'md',
      validator: (value) => ['none', 'sm', 'md', 'lg'].includes(value)
    },
    hoverable: {
      type: Boolean,
      default: false
    },
    clickable: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    rounded: {
      type: Boolean,
      default: true
    },
    shadow: {
      type: String,
      default: 'md',
      validator: (value) => ['none', 'sm', 'md', 'lg', 'xl'].includes(value)
    }
  },
  emits: ['click'],
  setup(props, { emit }) {
    const cardClasses = computed(() => [
      'base-card',
      `card-${props.variant}`,
      `card-${props.size}`,
      `card-shadow-${props.shadow}`,
      {
        'card-hoverable': props.hoverable,
        'card-clickable': props.clickable,
        'card-disabled': props.disabled,
        'card-loading': props.loading,
        'card-rounded': props.rounded
      }
    ])

    const bodyClasses = computed(() => [
      `card-body-padding-${props.padding}`
    ])

    const footerClasses = computed(() => [
      `card-footer-padding-${props.padding}`
    ])

    const handleClick = (event) => {
      if (!props.disabled && !props.loading && props.clickable) {
        emit('click', event)
      }
    }

    return {
      cardClasses,
      bodyClasses,
      footerClasses,
      handleClick
    }
  }
}
</script>

<style scoped>
.base-card {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
  transition: all var(--transition-normal);
  display: flex;
  flex-direction: column;
}

/* 变体样式 */
.card-default {
  background-color: var(--bg-primary);
  border-color: var(--border-color);
}

.card-outlined {
  background-color: transparent;
  border-color: var(--border-dark);
  border-width: 2px;
}

.card-elevated {
  background-color: var(--bg-primary);
  border: none;
}

.card-flat {
  background-color: var(--bg-secondary);
  border: none;
  box-shadow: none !important;
}

/* 尺寸样式 */
.card-sm {
  border-radius: var(--radius-md);
}

.card-md {
  border-radius: var(--radius-lg);
}

.card-lg {
  border-radius: var(--radius-xl);
}

.card-rounded {
  border-radius: var(--radius-lg);
}

/* 阴影样式 */
.card-shadow-none {
  box-shadow: none;
}

.card-shadow-sm {
  box-shadow: var(--shadow-sm);
}

.card-shadow-md {
  box-shadow: var(--shadow-md);
}

.card-shadow-lg {
  box-shadow: var(--shadow-lg);
}

.card-shadow-xl {
  box-shadow: var(--shadow-xl);
}

/* 交互状态 */
.card-hoverable:hover:not(.card-disabled):not(.card-loading) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.card-clickable {
  cursor: pointer;
}

.card-clickable:hover:not(.card-disabled):not(.card-loading) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.card-clickable:active:not(.card-disabled):not(.card-loading) {
  transform: translateY(0);
}

.card-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.card-loading {
  pointer-events: none;
}

/* 卡片头部 */
.card-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
}

.card-header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.card-title-section {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
}

.card-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: var(--spacing-xs) 0 0 0;
  line-height: 1.4;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

/* 卡片图片 */
.card-image {
  position: relative;
  overflow: hidden;
}

.card-img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

/* 卡片内容 */
.card-body {
  flex: 1;
  color: var(--text-primary);
  line-height: 1.6;
}

.card-body-padding-none {
  padding: 0;
}

.card-body-padding-sm {
  padding: var(--spacing-md);
}

.card-body-padding-md {
  padding: var(--spacing-lg);
}

.card-body-padding-lg {
  padding: var(--spacing-xl);
}

/* 卡片底部 */
.card-footer {
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.card-footer-padding-none {
  padding: 0;
}

.card-footer-padding-sm {
  padding: var(--spacing-md);
}

.card-footer-padding-md {
  padding: var(--spacing-lg);
}

.card-footer-padding-lg {
  padding: var(--spacing-xl);
}

/* 加载状态 */
.card-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-spinner svg {
  width: 32px;
  height: 32px;
  color: var(--primary-color);
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

/* 深色主题适配 */
[data-theme="dark"] .card-loading {
  background-color: rgba(31, 41, 55, 0.8);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .card-header {
    padding: var(--spacing-md);
  }
  
  .card-body-padding-md {
    padding: var(--spacing-md);
  }
  
  .card-body-padding-lg {
    padding: var(--spacing-lg);
  }
  
  .card-footer-padding-md {
    padding: var(--spacing-md);
  }
  
  .card-footer-padding-lg {
    padding: var(--spacing-lg);
  }
  
  .card-header-content {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }
  
  .card-actions {
    justify-content: flex-end;
  }
}
</style>
