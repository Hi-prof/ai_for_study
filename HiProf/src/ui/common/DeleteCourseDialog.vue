<template>
  <!-- 删除课程对话框 -->
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <!-- 对话框头部 -->
      <div class="dialog-header">
        <h3 class="dialog-title">{{ dialogTitle }}</h3>
        <button class="close-btn" @click="handleClose" :disabled="loading">
          <i class="close-icon">×</i>
        </button>
      </div>

      <!-- 对话框内容 -->
      <div class="dialog-content">
        <!-- 删除确认模式内容 -->
        <div v-if="mode === 'confirm'" class="confirm-content">
          <div class="warning-section">
            <div class="warning-icon-container">
              <i class="warning-icon">⚠️</i>
            </div>
            <div class="warning-message">
              <h4 class="warning-title">确认删除课程</h4>
              <p class="warning-description">
                您即将删除课程 <strong>"{{ courseData.name || courseData.title || '未命名课程' }}"</strong>
              </p>
            </div>
          </div>

          <!-- 课程信息显示 -->
          <div class="course-info-section">
            <div class="info-item">
              <i class="info-icon">📚</i>
              <span class="info-text">课程名称：{{ courseData.name || courseData.title || '未命名课程' }}</span>
            </div>
            <div v-if="courseData.description" class="info-item">
              <i class="info-icon">📝</i>
              <span class="info-text">课程描述：{{ courseData.description }}</span>
            </div>
          </div>

          <!-- 警告提示 -->
          <div class="danger-warning">
            <div class="danger-icon">🚨</div>
            <div class="danger-content">
              <p class="danger-text">
                <strong>此操作不可撤销！</strong>删除后将无法恢复课程数据，请谨慎操作。
              </p>
              <p class="danger-subtext">
                删除课程将同时删除相关的章节、作业、讨论等所有数据。
              </p>
            </div>
          </div>

          <!-- 删除进度 -->
          <div v-if="loading" class="progress-section">
            <div class="progress-header">
              <span class="progress-text">{{ progressText }}</span>
              <span class="progress-percentage">{{ Math.round(progress) }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
            </div>
          </div>
        </div>

        <!-- 成功提示模式内容 -->
        <div v-else-if="mode === 'success'" class="success-content">
          <div class="success-icon-container">
            <i class="success-icon">✅</i>
          </div>
          <div class="success-message">
            <h4 class="success-title">{{ successTitle || '课程删除成功！' }}</h4>
            <p class="success-description">{{ successMessage }}</p>
          </div>
          <div v-if="successDetails" class="success-details">
            <p>{{ successDetails }}</p>
          </div>
        </div>
      </div>

      <!-- 对话框底部 -->
      <div class="dialog-footer">
        <!-- 删除确认模式按钮 -->
        <template v-if="mode === 'confirm'">
          <button 
            class="btn btn-secondary" 
            @click="handleClose"
            :disabled="loading"
          >
            {{ loading ? '删除中...' : '取消' }}
          </button>
          <button 
            class="btn btn-danger" 
            @click="handleConfirm"
            :disabled="loading"
          >
            <i v-if="loading" class="loading-icon"></i>
            {{ loading ? '删除中...' : '确认删除' }}
          </button>
        </template>

        <!-- 成功提示模式按钮 -->
        <template v-else-if="mode === 'success'">
          <button 
            class="btn btn-secondary" 
            @click="handleClose"
          >
            确定
          </button>
          <button 
            v-if="showNavigateButton"
            class="btn btn-primary" 
            @click="handleNavigate"
          >
            <i class="navigate-icon">📋</i>
            {{ navigateButtonText || '返回课程列表' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';

// 定义组件属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'confirm', // 'confirm' | 'success'
    validator: (value) => ['confirm', 'success'].includes(value)
  },
  // 课程数据
  courseData: {
    type: Object,
    default: () => ({})
  },
  // 进度相关属性
  loading: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0
  },
  progressText: {
    type: String,
    default: '正在删除课程...'
  },
  // 成功模式相关属性
  successTitle: {
    type: String,
    default: ''
  },
  successMessage: {
    type: String,
    default: ''
  },
  successDetails: {
    type: String,
    default: ''
  },
  showNavigateButton: {
    type: Boolean,
    default: true
  },
  navigateButtonText: {
    type: String,
    default: '返回课程列表'
  }
});

// 定义组件事件
const emit = defineEmits(['update:visible', 'confirm', 'cancel', 'navigate']);

const loading = computed(() => props.loading);

// 计算属性
const dialogTitle = computed(() => {
  if (props.mode === 'success') {
    return props.successTitle || '删除成功';
  }
  return '删除课程确认';
});

// 处理遮罩层点击
const handleOverlayClick = () => {
  if (!loading.value) {
    handleClose();
  }
};

// 处理关闭
const handleClose = () => {
  if (!loading.value) {
    emit('update:visible', false);
    emit('cancel');
  }
};

// 处理导航
const handleNavigate = () => {
  emit('navigate');
  handleClose();
};

// 处理确认
const handleConfirm = () => {
  // 触发确认事件，将课程数据传递给父组件处理
  emit('confirm', props.courseData);
};
</script>

<style scoped>
@import '@/teacher/styles/create-course.css';

/* 删除课程对话框特定样式 */
.confirm-content {
  padding: 0;
}

.success-content {
  text-align: center;
  padding: 2rem 1rem;
}

/* 警告区域样式 */
.warning-section {
  display: flex;
  align-items: flex-start;
  padding: 1.5rem;
  background-color: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.warning-icon-container {
  margin-right: 1rem;
  flex-shrink: 0;
}

.warning-icon {
  font-size: 2rem;
  display: block;
}

.warning-message {
  flex: 1;
}

.warning-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 0.5rem 0;
}

.warning-description {
  color: #92400e;
  margin: 0;
  line-height: 1.5;
}

/* 课程信息区域样式 */
.course-info-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-icon {
  margin-right: 0.75rem;
  font-size: 1rem;
  flex-shrink: 0;
}

.info-text {
  color: #374151;
  font-size: 0.875rem;
  line-height: 1.5;
}

/* 危险警告样式 */
.danger-warning {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  background-color: #fef2f2;
  border: 1px solid #ef4444;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.danger-icon {
  margin-right: 0.75rem;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.danger-content {
  flex: 1;
}

.danger-text {
  color: #dc2626;
  font-size: 0.875rem;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.danger-subtext {
  color: #dc2626;
  font-size: 0.8rem;
  margin: 0;
  opacity: 0.8;
}

/* 成功提示样式 */
.success-icon-container {
  margin-bottom: 1.5rem;
}

.success-icon {
  font-size: 3rem;
  display: block;
}

.success-message {
  margin-bottom: 1rem;
}

.success-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.success-description {
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.success-details {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.success-details p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

/* 进度条样式 */
.progress-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-text {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.progress-percentage {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444, #dc2626);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* 按钮样式扩展 */
.btn-danger {
  background-color: #ef4444;
  color: white;
  border: none;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
}

.btn-danger:disabled {
  background-color: #f87171;
  opacity: 0.6;
}

/* 按钮图标样式 */
.loading-icon,
.delete-icon,
.navigate-icon {
  margin-right: 0.5rem;
  font-size: 1rem;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dialog-container {
    width: 95%;
    margin: 1rem;
  }

  .warning-section,
  .danger-warning {
    flex-direction: column;
    text-align: center;
  }

  .warning-icon-container,
  .danger-icon {
    margin-right: 0;
    margin-bottom: 0.5rem;
  }
}
</style>
