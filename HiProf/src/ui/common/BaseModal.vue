<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div v-if="modelValue" class="modal-overlay" @click="handleOverlayClick">
        <div 
          :class="modalClasses" 
          @click.stop
          role="dialog"
          :aria-labelledby="titleId"
          :aria-describedby="contentId"
          aria-modal="true"
        >
          <!-- 模态框头部 -->
          <header v-if="$slots.header || title" class="modal-header">
            <slot name="header">
              <h2 :id="titleId" class="modal-title">{{ title }}</h2>
              <button
                v-if="closable"
                class="modal-close"
                @click="closeModal"
                :aria-label="closeAriaLabel"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </slot>
          </header>

          <!-- 模态框内容 -->
          <div :id="contentId" class="modal-body" :class="bodyClasses">
            <slot />
          </div>

          <!-- 模态框底部 -->
          <footer v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

let modalIdCounter = 0

export default {
  name: 'BaseModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl', 'full'].includes(value)
    },
    closable: {
      type: Boolean,
      default: true
    },
    closeOnOverlay: {
      type: Boolean,
      default: true
    },
    closeOnEscape: {
      type: Boolean,
      default: true
    },
    persistent: {
      type: Boolean,
      default: false
    },
    centered: {
      type: Boolean,
      default: true
    },
    scrollable: {
      type: Boolean,
      default: false
    },
    fullscreen: {
      type: Boolean,
      default: false
    },
    closeAriaLabel: {
      type: String,
      default: '关闭'
    }
  },
  emits: ['update:modelValue', 'close', 'open'],
  setup(props, { emit }) {
    const modalId = `modal-${++modalIdCounter}`
    const titleId = `${modalId}-title`
    const contentId = `${modalId}-content`

    const modalClasses = computed(() => [
      'modal-dialog',
      `modal-${props.size}`,
      {
        'modal-centered': props.centered,
        'modal-scrollable': props.scrollable,
        'modal-fullscreen': props.fullscreen
      }
    ])

    const bodyClasses = computed(() => ({
      'modal-body-scrollable': props.scrollable
    }))

    const closeModal = () => {
      if (!props.persistent) {
        emit('update:modelValue', false)
        emit('close')
      }
    }

    const handleOverlayClick = () => {
      if (props.closeOnOverlay) {
        closeModal()
      }
    }

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && props.closeOnEscape && props.modelValue) {
        closeModal()
      }
    }

    // 监听模态框打开/关闭
    watch(() => props.modelValue, async (newValue) => {
      if (newValue) {
        emit('open')
        await nextTick()
        // 聚焦到模态框
        const modalElement = document.querySelector(`[aria-labelledby="${titleId}"]`)
        if (modalElement) {
          modalElement.focus()
        }
        // 禁用页面滚动
        document.body.style.overflow = 'hidden'
      } else {
        // 恢复页面滚动
        document.body.style.overflow = ''
      }
    })

    onMounted(() => {
      document.addEventListener('keydown', handleEscapeKey)
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleEscapeKey)
      // 确保恢复页面滚动
      document.body.style.overflow = ''
    })

    return {
      modalClasses,
      bodyClasses,
      titleId,
      contentId,
      closeModal,
      handleOverlayClick
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
  z-index: var(--z-modal);
  overflow-y: auto;
}

.modal-dialog {
  background-color: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  width: 100%;
  position: relative;
  outline: none;
}

/* 尺寸变体 */
.modal-xs {
  max-width: 320px;
}

.modal-sm {
  max-width: 480px;
}

.modal-md {
  max-width: 640px;
}

.modal-lg {
  max-width: 800px;
}

.modal-xl {
  max-width: 1024px;
}

.modal-full {
  max-width: 95vw;
  max-height: 95vh;
}

.modal-fullscreen {
  max-width: 100vw;
  max-height: 100vh;
  border-radius: 0;
  margin: 0;
}

.modal-centered {
  margin: auto;
}

.modal-scrollable {
  max-height: 90vh;
}

/* 模态框头部 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.modal-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
}

.modal-close {
  background: none;
  border: none;
  padding: var(--spacing-xs);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.modal-close:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-close svg {
  width: 18px;
  height: 18px;
}

/* 模态框内容 */
.modal-body {
  padding: var(--spacing-lg);
  flex: 1;
  overflow-y: auto;
  color: var(--text-primary);
  line-height: 1.6;
}

.modal-body-scrollable {
  overflow-y: auto;
}

/* 模态框底部 */
.modal-footer {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--transition-normal);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-dialog,
.modal-leave-active .modal-dialog {
  transition: transform var(--transition-normal);
}

.modal-enter-from .modal-dialog,
.modal-leave-to .modal-dialog {
  transform: scale(0.95) translateY(-20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--spacing-sm);
    align-items: flex-end;
  }
  
  .modal-dialog {
    max-height: 95vh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
  
  .modal-xs,
  .modal-sm,
  .modal-md,
  .modal-lg,
  .modal-xl {
    max-width: 100%;
  }
  
  .modal-header {
    padding: var(--spacing-md);
  }
  
  .modal-body {
    padding: var(--spacing-md);
  }
  
  .modal-footer {
    padding: var(--spacing-md);
    flex-direction: column-reverse;
    gap: var(--spacing-xs);
  }
  
  .modal-footer > * {
    width: 100%;
  }
  
  /* 移动端动画调整 */
  .modal-enter-from .modal-dialog,
  .modal-leave-to .modal-dialog {
    transform: translateY(100%);
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 0;
  }
  
  .modal-dialog {
    border-radius: 0;
    max-height: 100vh;
  }
  
  .modal-fullscreen {
    border-radius: 0;
  }
}

/* 深色主题适配 */
[data-theme="dark"] .modal-overlay {
  background-color: rgba(0, 0, 0, 0.7);
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .modal-dialog,
  .modal-leave-active .modal-dialog {
    transition: none;
  }
}
</style>
