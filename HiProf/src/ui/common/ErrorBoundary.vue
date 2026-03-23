<template>
  <div class="error-boundary">
    <div v-if="hasError" class="error-content">
      <div class="error-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M15 9L9 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      
      <div class="error-message">
        <h3>{{ errorTitle }}</h3>
        <p>{{ errorMessage }}</p>
        
        <div v-if="showDetails && errorDetails" class="error-details">
          <details>
            <summary>错误详情</summary>
            <pre>{{ errorDetails }}</pre>
          </details>
        </div>
      </div>
      
      <div class="error-actions">
        <BaseButton
          variant="primary"
          @click="retry"
          v-if="retryable"
        >
          重试
        </BaseButton>
      </div>
    </div>
    
    <slot v-else />
  </div>
</template>

<script>
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from './BaseButton.vue'

export default {
  name: 'ErrorBoundary',
  components: {
    BaseButton
  },
  props: {
    fallbackTitle: {
      type: String,
      default: '出现了一些问题'
    },
    fallbackMessage: {
      type: String,
      default: '抱歉，页面遇到了错误。请稍后重试或联系技术支持。'
    },
    showDetails: {
      type: Boolean,
      default: false
    },
    retryable: {
      type: Boolean,
      default: true
    }
  },
  emits: ['error', 'retry'],
  setup(props, { emit }) {
    const router = useRouter()
    const hasError = ref(false)
    const errorTitle = ref('')
    const errorMessage = ref('')
    const errorDetails = ref('')

    const handleError = (error, instance, info) => {
      hasError.value = true
      
      // 设置错误信息
      if (error.name === 'ChunkLoadError') {
        errorTitle.value = '资源加载失败'
        errorMessage.value = '页面资源加载失败，请刷新页面重试。'
      } else if (error.name === 'NetworkError') {
        errorTitle.value = '网络连接错误'
        errorMessage.value = '网络连接出现问题，请检查网络连接后重试。'
      } else if (error.message?.includes('timeout')) {
        errorTitle.value = '请求超时'
        errorMessage.value = '请求处理时间过长，请稍后重试。'
      } else {
        errorTitle.value = props.fallbackTitle
        errorMessage.value = props.fallbackMessage
      }
      
      // 开发环境显示详细错误信息
      if (import.meta.env.DEV) {
        errorDetails.value = `${error.stack || error.message}\n\nComponent: ${info}`
      }
      
      // 发送错误事件
      emit('error', { error, instance, info })
      
      // 错误上报（生产环境）
      if (import.meta.env.PROD) {
        reportError(error, info)
      }
      
      console.error('ErrorBoundary caught an error:', error, info)
    }

    const reportError = (error, info) => {
      // 这里可以集成错误监控服务，如 Sentry
      try {
        // 示例：发送错误到监控服务
        // errorReportingService.captureException(error, {
        //   extra: { componentInfo: info }
        // })
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError)
      }
    }

    const retry = () => {
      hasError.value = false
      errorTitle.value = ''
      errorMessage.value = ''
      errorDetails.value = ''
      emit('retry')
    }



    // 捕获子组件错误
    onErrorCaptured((error, instance, info) => {
      handleError(error, instance, info)
      return false // 阻止错误继续传播
    })

    // 监听全局未捕获的错误
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        handleError(event.error, null, 'Global error')
      })

      window.addEventListener('unhandledrejection', (event) => {
        handleError(event.reason, null, 'Unhandled promise rejection')
      })
    }

    return {
      hasError,
      errorTitle,
      errorMessage,
      errorDetails,
      retry
    }
  }
}
</script>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: var(--spacing-2xl);
  text-align: center;
}

.error-icon {
  width: 80px;
  height: 80px;
  color: var(--error-color);
  margin-bottom: var(--spacing-xl);
}

.error-message {
  max-width: 500px;
  margin-bottom: var(--spacing-xl);
}

.error-message h3 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.error-message p {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.error-details {
  margin-top: var(--spacing-lg);
  text-align: left;
  width: 100%;
}

.error-details summary {
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.error-details pre {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  font-size: var(--text-xs);
  color: var(--text-primary);
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.error-actions {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-content {
    padding: var(--spacing-xl);
    min-height: 300px;
  }
  
  .error-icon {
    width: 64px;
    height: 64px;
  }
  
  .error-message h3 {
    font-size: var(--text-xl);
  }
  
  .error-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .error-actions > * {
    width: 100%;
  }
}

/* 深色主题适配 */
[data-theme="dark"] .error-details pre {
  background-color: var(--bg-tertiary);
  border-color: var(--border-dark);
}
</style>
