<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
  >
    <span v-if="loading" class="loading-spinner">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2"/>
        <path d="M12 3C16.9706 3 21 7.02944 21 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </span>
    
    <span v-if="icon && !loading" class="button-icon" :class="{ 'icon-right': iconPosition === 'right' }">
      <component :is="icon" />
    </span>
    
    <span v-if="$slots.default" class="button-text">
      <slot />
    </span>
  </button>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'BaseButton',
  props: {
    variant: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'warning'].includes(value)
    },
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'button',
      validator: (value) => ['button', 'submit', 'reset'].includes(value)
    },
    icon: {
      type: [String, Object],
      default: null
    },
    iconPosition: {
      type: String,
      default: 'left',
      validator: (value) => ['left', 'right'].includes(value)
    },
    fullWidth: {
      type: Boolean,
      default: false
    },
    rounded: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click'],
  setup(props, { emit }) {
    const buttonClasses = computed(() => {
      return [
        'base-button',
        `button-${props.variant}`,
        `button-${props.size}`,
        {
          'button-disabled': props.disabled,
          'button-loading': props.loading,
          'button-full-width': props.fullWidth,
          'button-rounded': props.rounded,
          'button-icon-only': props.icon && !props.$slots?.default
        }
      ]
    })

    const handleClick = (event) => {
      if (!props.disabled && !props.loading) {
        emit('click', event)
      }
    }

    return {
      buttonClasses,
      handleClick
    }
  }
}
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  font-family: inherit;
  font-weight: var(--font-medium);
  text-decoration: none;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  white-space: nowrap;
  user-select: none;
}

.base-button:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* 变体样式 */
.button-primary {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.button-primary:hover:not(.button-disabled):not(.button-loading) {
  background-color: var(--primary-dark);
  border-color: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.button-secondary {
  background-color: var(--secondary-color);
  color: white;
  border-color: var(--secondary-color);
}

.button-secondary:hover:not(.button-disabled):not(.button-loading) {
  background-color: var(--secondary-dark);
  border-color: var(--secondary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.button-outline {
  background-color: transparent;
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.button-outline:hover:not(.button-disabled):not(.button-loading) {
  background-color: var(--primary-color);
  color: white;
}

.button-ghost {
  background-color: transparent;
  color: var(--text-primary);
  border-color: transparent;
}

.button-ghost:hover:not(.button-disabled):not(.button-loading) {
  background-color: var(--bg-secondary);
}

.button-danger {
  background-color: var(--error-color);
  color: white;
  border-color: var(--error-color);
}

.button-danger:hover:not(.button-disabled):not(.button-loading) {
  background-color: #dc2626;
  border-color: #dc2626;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.button-success {
  background-color: var(--success-color);
  color: white;
  border-color: var(--success-color);
}

.button-success:hover:not(.button-disabled):not(.button-loading) {
  background-color: var(--secondary-dark);
  border-color: var(--secondary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.button-warning {
  background-color: var(--warning-color);
  color: white;
  border-color: var(--warning-color);
}

.button-warning:hover:not(.button-disabled):not(.button-loading) {
  background-color: #d97706;
  border-color: #d97706;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* 尺寸样式 */
.button-xs {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--text-xs);
  border-radius: var(--radius-sm);
  min-height: 24px;
}

.button-sm {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--text-sm);
  border-radius: var(--radius-md);
  min-height: 32px;
}

.button-md {
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--text-base);
  border-radius: var(--radius-md);
  min-height: 40px;
}

.button-lg {
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: var(--text-lg);
  border-radius: var(--radius-lg);
  min-height: 48px;
}

.button-xl {
  padding: var(--spacing-lg) var(--spacing-2xl);
  font-size: var(--text-xl);
  border-radius: var(--radius-lg);
  min-height: 56px;
}

/* 状态样式 */
.button-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.button-loading {
  cursor: wait;
  pointer-events: none;
}

.button-full-width {
  width: 100%;
}

.button-rounded {
  border-radius: 9999px;
}

.button-icon-only {
  padding: var(--spacing-sm);
  aspect-ratio: 1;
}

.button-icon-only.button-xs {
  padding: var(--spacing-xs);
}

.button-icon-only.button-sm {
  padding: var(--spacing-xs);
}

.button-icon-only.button-lg {
  padding: var(--spacing-md);
}

.button-icon-only.button-xl {
  padding: var(--spacing-lg);
}

/* 图标样式 */
.button-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-icon svg {
  width: 1em;
  height: 1em;
}

.icon-right {
  order: 1;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner svg {
  width: 1em;
  height: 1em;
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

.button-text {
  line-height: 1;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .button-lg {
    padding: var(--spacing-sm) var(--spacing-lg);
    font-size: var(--text-base);
    min-height: 44px;
  }
  
  .button-xl {
    padding: var(--spacing-md) var(--spacing-xl);
    font-size: var(--text-lg);
    min-height: 48px;
  }
}
</style>
