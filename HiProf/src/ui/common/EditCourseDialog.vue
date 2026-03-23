<template>
  <!-- 编辑课程对话框 -->
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
        <!-- 编辑确认模式内容 -->
        <div v-if="mode === 'confirm'" class="confirm-content">
          <div class="form-group">
            <label class="form-label">课程名称 *</label>
            <input
              v-model="formData.name"
              type="text"
              class="form-input"
              placeholder="请输入课程名称"
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label class="form-label">课程描述</label>
            <textarea
              v-model="formData.description"
              class="form-textarea"
              placeholder="请输入课程描述"
              rows="3"
              :disabled="loading"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea
              v-model="formData.remark"
              class="form-textarea"
              placeholder="请输入备注信息"
              rows="2"
              :disabled="loading"
            ></textarea>
          </div>



          <!-- 编辑进度 -->
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
            <h4 class="success-title">{{ successTitle || '课程修改成功！' }}</h4>
            <p class="success-description">{{ successMessage }}</p>
          </div>
          <div v-if="successDetails" class="success-details">
            <p>{{ successDetails }}</p>
          </div>
        </div>
      </div>

      <!-- 对话框底部 -->
      <div class="dialog-footer">
        <!-- 编辑确认模式按钮 -->
        <template v-if="mode === 'confirm'">
          <button 
            class="btn btn-secondary" 
            @click="handleClose"
            :disabled="loading"
          >
            {{ loading ? '保存中...' : '取消' }}
          </button>
          <button 
            class="btn btn-primary" 
            @click="handleConfirm"
            :disabled="loading || !isFormValid"
          >
            <i v-if="loading" class="loading-icon"></i>
            {{ loading ? '保存中...' : '保存修改' }}
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
            <i class="navigate-icon">📚</i>
            {{ navigateButtonText || '查看课程' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue';

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
  progress: {
    type: Number,
    default: 0
  },
  progressText: {
    type: String,
    default: '正在保存修改...'
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
    default: '查看课程'
  }
});

// 定义组件事件
const emit = defineEmits(['update:visible', 'confirm', 'cancel', 'navigate']);

// 表单数据
const formData = ref({
  id: null,
  name: '',
  description: '',
  remark: '',
  majorId: null,
  className: '',
  teacherId: null,
  tpId: null
});

// 加载状态
const loading = ref(false);

// 计算属性
const dialogTitle = computed(() => {
  if (props.mode === 'success') {
    return props.successTitle || '修改成功';
  }
  return '修改课程';
});

const isFormValid = computed(() => {
  return formData.value.name.trim() && formData.value.id;
});

// 监听对话框显示状态和课程数据
watch(() => props.visible, (newVal) => {
  if (newVal && props.mode === 'confirm') {
    resetForm();
  }
});

watch(() => props.courseData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    formData.value = {
      id: newData.id || null,
      name: newData.name || newData.title || '',
      description: newData.description || '',
      remark: newData.remark || '',
      majorId: newData.majorId || null,
      className: newData.className || '',
      teacherId: newData.teacherId || null,
      tpId: newData.tpId || null
    };
  }
}, { immediate: true, deep: true });

// 重置表单
const resetForm = () => {
  if (props.courseData && Object.keys(props.courseData).length > 0) {
    formData.value = {
      id: props.courseData.id || null,
      name: props.courseData.name || props.courseData.title || '',
      description: props.courseData.description || '',
      remark: props.courseData.remark || '',
      majorId: props.courseData.majorId || null,
      className: props.courseData.className || '',
      teacherId: props.courseData.teacherId || null,
      tpId: props.courseData.tpId || null
    };
  }
};

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
  // 验证表单
  if (!isFormValid.value) {
    if (!formData.value.name.trim()) {
      alert('请输入课程名称');
      return;
    }
    if (!formData.value.id) {
      alert('课程ID无效');
      return;
    }
  }

  // 触发确认事件，将数据传递给父组件处理
  emit('confirm', { ...formData.value });
};
</script>

<style scoped>
@import '@/teacher/styles/create-course.css';

/* 编辑课程对话框特定样式 */
.confirm-content {
  padding: 0;
}

.success-content {
  text-align: center;
  padding: 2rem 1rem;
}

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
  background: linear-gradient(90deg, #f59e0b, #d97706);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* 表单样式 */
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.form-input:disabled,
.form-textarea:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}



/* 按钮图标样式 */
.loading-icon,
.edit-icon,
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
}
</style>
