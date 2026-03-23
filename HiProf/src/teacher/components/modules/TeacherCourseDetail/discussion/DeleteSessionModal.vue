<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          {{ isBatchMode ? '批量删除会话' : '删除会话' }}
        </h3>
        <button class="modal-close-btn" @click="handleClose">
          <i class="close-icon"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="warning-icon">⚠️</div>
        
        <div class="warning-message">
          <p v-if="isBatchMode">
            确定要删除以下 <strong>{{ sessionList.length }}</strong> 个会话吗？
          </p>
          <p v-else>
            确定要删除会话 <strong>"{{ sessionDisplayName }}"</strong> 吗？
          </p>
          
          <p class="warning-note">
            此操作不可撤销，会话中的所有消息都将被删除。
          </p>
        </div>

        <!-- 批量删除时显示会话列表 -->
        <div v-if="isBatchMode && sessionList.length > 0" class="session-list-preview">
          <div class="session-list-header">将要删除的会话：</div>
          <div class="session-list-items">
            <div 
              v-for="session in sessionList" 
              :key="session.id"
              class="session-item-preview"
            >
              <span class="session-name">{{ session.name || `会话 #${session.id}` }}</span>
              <span v-if="session.remark" class="session-remark">{{ session.remark }}</span>
            </div>
          </div>
        </div>

        <!-- 错误信息显示 -->
        <div v-if="errorMessage" class="error-message">
          <i class="error-icon">❌</i>
          <span>{{ errorMessage }}</span>
        </div>
      </div>

      <div class="modal-footer">
        <button 
          class="btn btn-secondary" 
          @click="handleClose"
          :disabled="loading"
        >
          取消
        </button>
        <button 
          class="btn btn-danger" 
          @click="handleConfirmDelete"
          :disabled="loading"
        >
          <span v-if="loading" class="loading-spinner"></span>
          <i v-else class="delete-icon"></i>
          {{ loading ? '删除中...' : '确认删除' }}
        </button>
      </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { deleteSession } from '@/api/session';

// 定义props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  sessions: {
    type: [Object, Array],
    default: () => []
  },
  mode: {
    type: String,
    default: 'single', // 'single' | 'batch'
    validator: (value) => ['single', 'batch'].includes(value)
  }
});

// 定义emits
const emit = defineEmits(['close', 'success', 'error']);

// 响应式数据
const loading = ref(false);
const errorMessage = ref('');

// 计算属性
const isBatchMode = computed(() => props.mode === 'batch');

const sessionList = computed(() => {
  if (isBatchMode.value) {
    return Array.isArray(props.sessions) ? props.sessions : [props.sessions];
  }
  return [];
});

const singleSession = computed(() => {
  if (!isBatchMode.value) {
    return Array.isArray(props.sessions) ? props.sessions[0] : props.sessions;
  }
  return null;
});

const sessionDisplayName = computed(() => {
  if (singleSession.value) {
    return singleSession.value.name || `会话 #${singleSession.value.id}`;
  }
  return '';
});

// 监听visible变化，重置状态
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
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

// 处理确认删除
const handleConfirmDelete = async () => {
  if (loading.value) return;
  
  loading.value = true;
  errorMessage.value = '';

  try {
    let sessionIds;
    let sessionNames;

    if (isBatchMode.value) {
      // 批量删除
      sessionIds = sessionList.value.map(session => session.id);
      sessionNames = sessionList.value.map(session => 
        session.name || `会话 #${session.id}`
      );
    } else {
      // 单个删除
      sessionIds = singleSession.value.id;
      sessionNames = [sessionDisplayName.value];
    }

    console.log('正在删除会话:', sessionIds);
    
    // 调用删除API
    const response = await deleteSession(sessionIds);
    
    console.log('删除会话成功:', response);
    
    // 检查响应状态
    if (response && (response.success || response.code === 200 || response.code === 0)) {
      // 删除成功
      emit('success', {
        sessionIds: Array.isArray(sessionIds) ? sessionIds : [sessionIds],
        sessionNames,
        mode: props.mode
      });
    } else {
      // 删除失败
      const errorMsg = response?.msg || response?.message || '删除失败，请稍后重试';
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('删除会话时发生错误:', error);
    
    // 根据错误类型显示不同的提示
    let errorMsg = '删除失败，请稍后重试';
    
    if (error.response?.status === 404) {
      errorMsg = isBatchMode.value ? '部分会话不存在或已被删除' : '会话不存在或已被删除';
    } else if (error.response?.status === 403) {
      errorMsg = isBatchMode.value ? '没有权限删除这些会话' : '没有权限删除此会话';
    } else if (error.response?.status === 400) {
      errorMsg = '请求参数错误';
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

.warning-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1rem;
}

.warning-message {
  text-align: center;
  margin-bottom: 1.5rem;
}

.warning-message p {
  margin: 0 0 0.75rem 0;
  color: #374151;
  font-size: 1rem;
  line-height: 1.5;
}

.warning-note {
  color: #ef4444 !important;
  font-size: 0.875rem !important;
  font-weight: 500;
}

.session-list-preview {
  background-color: #f9fafb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
}

.session-list-header {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.session-list-items {
  max-height: 200px;
  overflow-y: auto;
}

.session-item-preview {
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: white;
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
}

.session-item-preview:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.session-name {
  font-weight: 500;
  color: #1f2937;
  font-size: 0.875rem;
}

.session-remark {
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 0.25rem;
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
  margin-top: 1rem;
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

.btn-danger {
  background-color: #ef4444;
  color: white;
  border-color: #ef4444;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
  border-color: #dc2626;
}

/* 图标样式 */
.close-icon, .delete-icon, .error-icon {
  width: 1rem;
  height: 1rem;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.close-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.delete-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z' clip-rule='evenodd' /%3E%3C/svg%3E");
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
