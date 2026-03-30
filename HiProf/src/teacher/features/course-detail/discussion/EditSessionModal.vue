<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">编辑会话</h3>
        <button class="modal-close-btn" @click="handleClose" :disabled="loading">
          <i class="close-icon"></i>
        </button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit" class="edit-form">
          <!-- 讨论名称 -->
          <div class="form-group">
            <label for="sessionName" class="form-label">
              讨论名称 <span class="required">*</span>
            </label>
            <input
              id="sessionName"
              v-model="formData.name"
              type="text"
              class="form-input"
              placeholder="请输入讨论名称"
              :disabled="loading"
              required
              maxlength="50"
            />
            <div class="form-hint">讨论名称将显示在讨论列表中</div>
          </div>

          <!-- 错误信息显示 -->
          <div v-if="errorMessage" class="error-message">
            <i class="error-icon">❌</i>
            <span>{{ errorMessage }}</span>
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <button 
          type="button"
          class="btn btn-secondary" 
          @click="handleClose"
          :disabled="loading"
        >
          取消
        </button>
        <button 
          type="button"
          class="btn btn-primary" 
          @click="handleSubmit"
          :disabled="loading || !isFormValid"
        >
          <span v-if="loading" class="loading-spinner"></span>
          <i v-else class="save-icon"></i>
          {{ loading ? '保存中...' : '保存修改' }}
        </button>
      </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { updateSession } from '@/api/session';

// 定义props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  session: {
    type: Object,
    default: () => ({})
  }
});

// 定义emits
const emit = defineEmits(['close', 'success', 'error']);

// 响应式数据
const loading = ref(false);
const errorMessage = ref('');
const formData = ref({
  id: 0,
  name: '',
  remark: '',
  createBy: '',
  createTime: '',
  updateBy: '',
  updateTime: '',
  params: {}
});

// 计算属性
const isFormValid = computed(() => {
  return formData.value.name.trim().length > 0;
});

// 监听visible变化，重置表单
watch(() => props.visible, (newVisible) => {
  if (newVisible && props.session) {
    // 填充表单数据
    formData.value = {
      id: props.session.id || 0,
      name: props.session.name || '',
      remark: props.session.remark || '',
      createBy: props.session.createBy || '',
      createTime: props.session.createTime || '',
      updateBy: props.session.updateBy || '',
      updateTime: props.session.updateTime || '',
      params: props.session.params || {}
    };
    errorMessage.value = '';
    loading.value = false;
  }
});

// 处理关闭
const handleClose = () => {
  if (!loading.value) {
    emit('close');
  }
};

// 处理遮罩层点击
const handleOverlayClick = () => {
  handleClose();
};

// 处理表单提交
const handleSubmit = async () => {
  if (!isFormValid.value || loading.value) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    console.log('正在更新会话:', formData.value);
    
    // 调用更新API
    const response = await updateSession(formData.value);
    
    console.log('更新会话成功:', response);
    
    // 检查响应状态
    if (response && (response.success || response.code === 200 || response.code === 0)) {
      // 更新成功
      emit('success', {
        originalSession: props.session,
        updatedSession: formData.value,
        response
      });
    } else {
      // 更新失败
      const errorMsg = response?.msg || response?.message || '更新失败，请稍后重试';
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('更新会话时发生错误:', error);
    
    // 根据错误类型显示不同的提示
    let errorMsg = '更新失败，请稍后重试';
    
    if (error.response?.status === 404) {
      errorMsg = '会话不存在或已被删除';
    } else if (error.response?.status === 403) {
      errorMsg = '没有权限编辑此会话';
    } else if (error.response?.status === 400) {
      errorMsg = '请求参数错误，请检查输入内容';
    } else if (error.response?.status >= 500) {
      errorMsg = '服务器错误，请稍后重试';
    } else if (!navigator.onLine) {
      errorMsg = '网络连接失败，请检查网络';
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    errorMessage.value = errorMsg;
    emit('error', { error, message: errorMsg });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* 模态框样式 */
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
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.modal-close-btn:hover {
  background-color: #e5e7eb;
}

.modal-body {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

/* 表单样式 */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.required {
  color: #ef4444;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input:disabled {
  background-color: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
}

.form-hint {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 0.875rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

/* 按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.btn-primary {
  background-color: #6366f1;
  color: white;
  border-color: #6366f1;
}

.btn-primary:hover:not(:disabled) {
  background-color: #4f46e5;
  border-color: #4f46e5;
}

/* 图标样式 */
.close-icon, .save-icon, .error-icon {
  width: 1rem;
  height: 1rem;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.close-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.save-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath d='M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z' /%3E%3C/svg%3E");
}

/* 加载动画 */
.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 640px) {
  .modal-container {
    margin: 1rem;
    max-width: calc(100vw - 2rem);
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
