<template>
  <div v-if="visible" class="file-preview-dialog-overlay" @click="handleOverlayClick">
    <div class="file-preview-dialog" @click.stop>
      <!-- 对话框头部 -->
      <div class="dialog-header">
        <div class="file-info">
          <span class="file-icon">{{ fileTypeInfo?.icon || '📄' }}</span>
          <div class="file-details">
            <h3 class="file-name" :title="fileName">{{ fileName }}</h3>
            <p class="file-meta">
              {{ fileTypeInfo?.name || '未知类型' }}
              <span v-if="fileSize" class="file-size">• {{ formattedFileSize }}</span>
            </p>
          </div>
        </div>
        
        <div class="dialog-actions">
          <!-- 全屏切换 -->
          <button 
            class="action-btn" 
            @click="toggleFullscreen" 
            :title="isFullscreen ? '退出全屏' : '全屏预览'"
          >
            <span v-if="isFullscreen">🗗</span>
            <span v-else>🗖</span>
          </button>
          
          <!-- 下载按钮 -->
          <button 
            class="action-btn" 
            @click="downloadFile" 
            title="下载文件"
          >
            📥
          </button>
          
          <!-- 关闭按钮 -->
          <button 
            class="action-btn close-btn" 
            @click="closeDialog" 
            title="关闭"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- 预览内容区域 -->
      <div class="dialog-content" :class="{ 'fullscreen': isFullscreen }">
        <ModernFileViewer
          :file-url="fileUrl"
          :file-name="fileName"
          :file-size="formattedFileSize"
          @error="handlePreviewError"
          @loaded="handlePreviewLoaded"
        />
      </div>

      <!-- 底部工具栏（可选） -->
      <div v-if="showToolbar" class="dialog-footer">
        <div class="toolbar-left">
          <span class="status-text">
            {{ statusText }}
            <span v-if="autoOpenCountdown > 0" class="countdown-text">
              （{{ autoOpenCountdown }}秒后自动在新窗口打开）
            </span>
          </span>
        </div>
        
        <div class="toolbar-right">
          <button class="btn btn-secondary" @click="closeDialog">
            关闭
          </button>
          <button class="btn btn-primary" @click="downloadFile">
            下载
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import ModernFileViewer from './ModernFileViewer.vue';
import { 
  getFileType, 
  getFileIcon,
  formatFileSize, 
  downloadFile as downloadFileUtil,
  isPreviewSupported 
} from '@/utils/fileViewerUtils';

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    default: ''
  },
  fileSize: {
    type: Number,
    default: 0
  },
  showToolbar: {
    type: Boolean,
    default: true
  },
  allowFullscreen: {
    type: Boolean,
    default: true
  }
});

// Emits
const emit = defineEmits(['update:visible', 'close', 'download', 'error', 'loaded']);

// 响应式数据
const isFullscreen = ref(false);
const statusText = ref('准备预览...');
const autoOpenCountdown = ref(0);
const countdownTimer = ref(null);

// 计算属性
const fileTypeInfo = computed(() => {
  const fileType = getFileType(props.fileName);
  const icon = getFileIcon(props.fileName);
  return {
    name: fileType,
    icon: icon
  };
});

const formattedFileSize = computed(() => {
  return formatFileSize(props.fileSize);
});

const isSupported = computed(() => {
  return isPreviewSupported(props.fileName);
});

// 监听visible变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden';
    statusText.value = '正在加载预览...';
  } else {
    document.body.style.overflow = '';
    isFullscreen.value = false;
  }
});

// 关闭对话框
const closeDialog = () => {
  // 清理倒计时定时器
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value);
    countdownTimer.value = null;
  }
  autoOpenCountdown.value = 0;

  emit('update:visible', false);
  emit('close');
};

// 处理遮罩层点击
const handleOverlayClick = () => {
  closeDialog();
};

// 切换全屏
const toggleFullscreen = () => {
  if (!props.allowFullscreen) return;
  
  isFullscreen.value = !isFullscreen.value;
  
  if (isFullscreen.value) {
    // 进入全屏模式
    document.documentElement.classList.add('preview-fullscreen');
  } else {
    // 退出全屏模式
    document.documentElement.classList.remove('preview-fullscreen');
  }
};

// 下载文件
const downloadFile = () => {
  downloadFileUtil(props.fileUrl, props.fileName);
  emit('download', {
    url: props.fileUrl,
    fileName: props.fileName
  });
};

// 处理预览错误
const handlePreviewError = (error) => {
  statusText.value = '预览失败';
  emit('error', error);

  // 检查是否是CORS或网络错误，自动回退到新窗口打开
  const errorMessage = error?.message || '';
  const isCorsError = errorMessage.includes('Failed to fetch') ||
                     errorMessage.includes('CORS') ||
                     errorMessage.includes('Access-Control-Allow-Origin');

  if (isCorsError && props.fileUrl) {
    console.log('检测到CORS/网络错误，3秒后自动在新窗口打开文件:', props.fileUrl);

    // 开始倒计时
    autoOpenCountdown.value = 3;
    countdownTimer.value = setInterval(() => {
      autoOpenCountdown.value--;
      if (autoOpenCountdown.value <= 0) {
        clearInterval(countdownTimer.value);
        window.open(props.fileUrl, '_blank');
        // 关闭预览对话框
        emit('update:visible', false);
      }
    }, 1000);
  }
};

// 处理预览加载完成
const handlePreviewLoaded = () => {
  statusText.value = '预览就绪';
  emit('loaded');
};

// 键盘事件处理
const handleKeydown = (event) => {
  if (!props.visible) return;
  
  switch (event.key) {
    case 'Escape':
      if (isFullscreen.value) {
        toggleFullscreen();
      } else {
        closeDialog();
      }
      break;
    case 'F11':
      event.preventDefault();
      toggleFullscreen();
      break;
  }
};

// 组件挂载和卸载
onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
  document.documentElement.classList.remove('preview-fullscreen');
});
</script>

<style scoped>
.file-preview-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.file-preview-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90vw;
  height: 85vh;
  max-width: 1200px;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
  flex-shrink: 0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.file-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.file-details {
  min-width: 0;
  flex: 1;
}

.file-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-size {
  color: #999;
}

.dialog-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s;
  color: #666;
}

.action-btn:hover {
  background: #e9ecef;
  color: #333;
}

.close-btn:hover {
  background: #dc3545;
  color: white;
}

.dialog-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.dialog-content.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  background: white;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
  flex-shrink: 0;
}

.toolbar-left {
  flex: 1;
}

.status-text {
  font-size: 12px;
  color: #666;
}

.countdown-text {
  color: #e74c3c;
  font-weight: 500;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

/* 全屏模式样式 */
:global(.preview-fullscreen) {
  overflow: hidden;
}

:global(.preview-fullscreen .file-preview-dialog) {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  max-width: none;
  max-height: none;
  border-radius: 0;
  z-index: 10000;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-preview-dialog-overlay {
    padding: 10px;
  }
  
  .file-preview-dialog {
    width: 100vw;
    height: 90vh;
    border-radius: 8px;
  }
  
  .dialog-header {
    padding: 12px 16px;
  }
  
  .file-name {
    font-size: 14px;
  }
  
  .file-meta {
    font-size: 11px;
  }
  
  .action-btn {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
  
  .dialog-footer {
    padding: 10px 16px;
  }
  
  .btn {
    padding: 6px 12px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .file-info {
    gap: 8px;
  }
  
  .file-icon {
    font-size: 20px;
  }
  
  .dialog-actions {
    gap: 4px;
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
}
</style>
