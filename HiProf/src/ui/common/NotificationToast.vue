<template>
  <Teleport to="body">
    <div class="notification-container">
      <TransitionGroup name="notification" tag="div">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="getNotificationClasses(notification)"
          @click="removeNotification(notification.id)"
        >
          <div class="notification-icon">
            <svg v-if="notification.type === 'success'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4905 2.02168 11.3363C2.16356 9.18203 2.99721 7.13214 4.39828 5.49883C5.79935 3.86553 7.69279 2.72636 9.79619 2.24223C11.8996 1.75809 14.1003 1.95185 16.07 2.79999" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            
            <svg v-else-if="notification.type === 'error'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M15 9L9 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            
            <svg v-else-if="notification.type === 'warning'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.29 3.86L1.82 18C1.64486 18.3024 1.55625 18.6453 1.56518 18.9928C1.57412 19.3402 1.68043 19.6781 1.87086 19.9715C2.06129 20.2649 2.32676 20.5034 2.64257 20.6602C2.95838 20.817 3.31082 20.8871 3.66 20.86H20.5C20.8492 20.8871 21.2016 20.817 21.5174 20.6602C21.8332 20.5034 22.0987 20.2649 22.2891 19.9715C22.4796 19.6781 22.5859 19.3402 22.5948 18.9928C22.6037 18.6453 22.5151 18.3024 22.34 18L13.87 3.86C13.6803 3.56611 13.4132 3.32312 13.0946 3.15448C12.7759 2.98585 12.4158 2.89725 12.05 2.89725C11.6842 2.89725 11.3241 2.98585 11.0054 3.15448C10.6868 3.32312 10.4197 3.56611 10.23 3.86H10.29Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 9V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            
            <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 16V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div v-if="notification.message" class="notification-message">{{ notification.message }}</div>
          </div>
          
          <button class="notification-close" @click.stop="removeNotification(notification.id)">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script>
import { ref, reactive } from 'vue'

// 全局通知状态
const notifications = ref([])
let notificationId = 0

// 通知管理器
export const notificationManager = {
  show(options) {
    const notification = {
      id: ++notificationId,
      type: options.type || 'info',
      title: options.title || '',
      message: options.message || '',
      duration: options.duration !== undefined ? options.duration : 4000,
      persistent: options.persistent || false
    }

    notifications.value.push(notification)

    // 自动移除（除非是持久通知）
    if (!notification.persistent && notification.duration > 0) {
      setTimeout(() => {
        this.remove(notification.id)
      }, notification.duration)
    }

    return notification.id
  },

  success(title, message, options = {}) {
    return this.show({
      type: 'success',
      title,
      message,
      ...options
    })
  },

  error(title, message, options = {}) {
    return this.show({
      type: 'error',
      title,
      message,
      persistent: true, // 错误通知默认持久显示
      ...options
    })
  },

  warning(title, message, options = {}) {
    return this.show({
      type: 'warning',
      title,
      message,
      ...options
    })
  },

  info(title, message, options = {}) {
    return this.show({
      type: 'info',
      title,
      message,
      ...options
    })
  },

  remove(id) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  },

  clear() {
    notifications.value.splice(0)
  }
}

export default {
  name: 'NotificationToast',
  setup() {
    const getNotificationClasses = (notification) => [
      'notification',
      `notification-${notification.type}`
    ]

    const removeNotification = (id) => {
      notificationManager.remove(id)
    }

    return {
      notifications,
      getNotificationClasses,
      removeNotification
    }
  }
}
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  z-index: var(--z-tooltip);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-width: 400px;
  pointer-events: none;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  pointer-events: auto;
  transition: all var(--transition-normal);
  min-width: 300px;
}

.notification:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

/* 通知类型样式 */
.notification-success {
  border-left: 4px solid var(--success-color);
}

.notification-success .notification-icon {
  color: var(--success-color);
}

.notification-error {
  border-left: 4px solid var(--error-color);
}

.notification-error .notification-icon {
  color: var(--error-color);
}

.notification-warning {
  border-left: 4px solid var(--warning-color);
}

.notification-warning .notification-icon {
  color: var(--warning-color);
}

.notification-info {
  border-left: 4px solid var(--info-color);
}

.notification-info .notification-icon {
  color: var(--info-color);
}

.notification-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  line-height: 1.4;
  margin-bottom: var(--spacing-xs);
}

.notification-message {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-close:hover {
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
}

.notification-close svg {
  width: 14px;
  height: 14px;
}

/* 动画 */
.notification-enter-active,
.notification-leave-active {
  transition: all var(--transition-normal);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform var(--transition-normal);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notification-container {
    top: var(--spacing-md);
    right: var(--spacing-md);
    left: var(--spacing-md);
    max-width: none;
  }
  
  .notification {
    min-width: auto;
  }
}

/* 深色主题适配 */
[data-theme="dark"] .notification {
  background-color: var(--bg-secondary);
  border-color: var(--border-dark);
}
</style>
