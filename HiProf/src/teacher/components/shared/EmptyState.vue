<template>
  <div class="empty-state" :class="{ 'compact': compact }">
    <!-- 空状态图标 -->
    <div class="empty-icon" :style="{ fontSize: iconSize }">
      {{ icon }}
    </div>
    
    <!-- 空状态标题 -->
    <h3 class="empty-title">{{ title }}</h3>
    
    <!-- 空状态描述 -->
    <p v-if="description" class="empty-description">{{ description }}</p>
    
    <!-- 操作按钮 -->
    <div v-if="showAction" class="empty-actions">
      <slot name="actions">
        <button 
          class="btn btn-primary" 
          @click="handleAction"
          :disabled="actionLoading"
        >
          <i v-if="actionIcon" class="btn-icon" :class="actionIcon"></i>
          <span v-if="actionLoading">{{ actionLoadingText }}</span>
          <span v-else>{{ actionText }}</span>
        </button>
      </slot>
    </div>
    
    <!-- 额外内容插槽 -->
    <div v-if="$slots.extra" class="empty-extra">
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<script setup>
// 定义props
const props = defineProps({
  // 图标
  icon: {
    type: String,
    default: '📄'
  },
  iconSize: {
    type: String,
    default: '4rem'
  },
  
  // 文本内容
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  
  // 操作按钮
  showAction: {
    type: Boolean,
    default: false
  },
  actionText: {
    type: String,
    default: '开始操作'
  },
  actionIcon: {
    type: String,
    default: ''
  },
  actionLoading: {
    type: Boolean,
    default: false
  },
  actionLoadingText: {
    type: String,
    default: '处理中...'
  },
  
  // 样式控制
  compact: {
    type: Boolean,
    default: false
  }
});

// 定义事件
const emit = defineEmits(['action']);

// 处理操作按钮点击
const handleAction = () => {
  emit('action');
};
</script>

<style scoped>
/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.empty-state.compact {
  padding: 2rem 1rem;
  min-height: 200px;
}

.empty-icon {
  margin-bottom: 1.5rem;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.empty-state:hover .empty-icon {
  opacity: 0.8;
  transform: scale(1.05);
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color, #1f2937);
  margin: 0 0 1rem 0;
  line-height: 1.3;
}

.empty-state.compact .empty-title {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
}

.empty-description {
  font-size: 1rem;
  color: var(--text-color-secondary, #6b7280);
  margin: 0 0 2rem 0;
  max-width: 400px;
  line-height: 1.5;
}

.empty-state.compact .empty-description {
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  max-width: 300px;
}

.empty-actions {
  margin-top: 1rem;
}

.empty-extra {
  margin-top: 1.5rem;
  width: 100%;
  max-width: 400px;
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
  min-width: 120px;
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

.btn-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 0.5rem;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  vertical-align: middle;
}

/* 常用图标样式 */
.btn-icon.plus-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'%3E%3Cpath d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'/%3E%3C/svg%3E");
}

.btn-icon.refresh-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'%3E%3Cpath d='M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z'/%3E%3C/svg%3E");
}

.btn-icon.upload-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'%3E%3Cpath d='M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z'/%3E%3C/svg%3E");
}

/* 响应式设计 */
@media (max-width: 768px) {
  .empty-state {
    padding: 3rem 1.5rem;
    min-height: 250px;
  }
  
  .empty-state.compact {
    padding: 1.5rem 1rem;
    min-height: 150px;
  }
  
  .empty-icon {
    font-size: 3rem !important;
    margin-bottom: 1rem;
  }
  
  .empty-title {
    font-size: 1.25rem;
  }
  
  .empty-state.compact .empty-title {
    font-size: 1.125rem;
  }
  
  .empty-description {
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
  }
  
  .empty-state.compact .empty-description {
    font-size: 0.8125rem;
    margin-bottom: 1rem;
  }
  
  .btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.8125rem;
    min-width: 100px;
  }
}

@media (max-width: 480px) {
  .empty-state {
    padding: 2rem 1rem;
  }
  
  .empty-description {
    max-width: 280px;
  }
  
  .empty-state.compact .empty-description {
    max-width: 240px;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .empty-title {
    color: #f9fafb;
  }
  
  .empty-description {
    color: #d1d5db;
  }
}
</style>
