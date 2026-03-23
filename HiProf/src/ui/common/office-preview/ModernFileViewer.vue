<template>
  <div class="modern-file-viewer" ref="viewerContainer">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载文件预览...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>预览失败</h3>
      <p>{{ error }}</p>
      <div class="error-actions">
        <button class="btn btn-primary" @click="retry">重试</button>
        <button class="btn btn-secondary" @click="downloadFile">下载文件</button>
      </div>
    </div>

    <!-- 预览成功 -->
    <div v-else class="preview-container">
      <!-- PDF预览 -->
      <div v-if="fileType === 'pdf'" class="pdf-viewer">
        <iframe 
          :src="pdfUrl" 
          class="preview-frame"
          @load="onLoadSuccess"
          @error="onLoadError"
        ></iframe>
      </div>

      <!-- Office文档预览 (使用Microsoft 365) -->
      <div v-else-if="isOfficeFile" class="office-viewer">
        <iframe 
          :src="officeUrl" 
          class="preview-frame"
          @load="onLoadSuccess"
          @error="onLoadError"
        ></iframe>
      </div>

      <!-- 图片预览 -->
      <div v-else-if="isImageFile" class="image-viewer">
        <img 
          :src="fileUrl" 
          :alt="fileName"
          class="preview-image"
          @load="onLoadSuccess"
          @error="onLoadError"
        />
      </div>

      <!-- 文本文件预览 -->
      <div v-else-if="isTextFile" class="text-viewer">
        <pre class="text-content">{{ textContent }}</pre>
      </div>

      <!-- 视频预览 -->
      <div v-else-if="isVideoFile" class="video-viewer">
        <video 
          :src="fileUrl" 
          controls 
          class="preview-video"
          @loadeddata="onLoadSuccess"
          @error="onLoadError"
        >
          您的浏览器不支持视频播放
        </video>
      </div>

      <!-- 音频预览 -->
      <div v-else-if="isAudioFile" class="audio-viewer">
        <audio 
          :src="fileUrl" 
          controls 
          class="preview-audio"
          @loadeddata="onLoadSuccess"
          @error="onLoadError"
        >
          您的浏览器不支持音频播放
        </audio>
      </div>

      <!-- 不支持的文件类型 -->
      <div v-else class="unsupported-viewer">
        <div class="unsupported-icon">📄</div>
        <h3>{{ fileName }}</h3>
        <p>此文件类型不支持预览</p>
        <button class="btn btn-primary" @click="downloadFile">下载文件</button>
      </div>

      <!-- 工具栏 -->
      <div class="viewer-toolbar">
        <button class="btn btn-sm" @click="downloadFile" title="下载文件">
          📥 下载
        </button>
        <button v-if="canOpenInNew" class="btn btn-sm" @click="openInNew" title="新窗口打开">
          🔗 新窗口
        </button>
        <span class="file-info">{{ fileName }} ({{ fileSize }})</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

// Props
const props = defineProps({
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: String,
    default: ''
  }
});

// Emits
const emit = defineEmits(['loaded', 'error']);

// 响应式数据
const loading = ref(false);
const error = ref('');
const textContent = ref('');
const viewerContainer = ref(null);

// 文件类型检测
const fileType = computed(() => {
  const ext = props.fileName.split('.').pop()?.toLowerCase();
  return ext || '';
});

// 文件类型判断
const isOfficeFile = computed(() => {
  const officeTypes = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
  return officeTypes.includes(fileType.value);
});

const isImageFile = computed(() => {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  return imageTypes.includes(fileType.value);
});

const isTextFile = computed(() => {
  const textTypes = ['txt', 'md', 'json', 'xml', 'csv', 'js', 'ts', 'vue', 'html', 'css'];
  return textTypes.includes(fileType.value);
});

const isVideoFile = computed(() => {
  const videoTypes = ['mp4', 'webm', 'ogg', 'avi', 'mov'];
  return videoTypes.includes(fileType.value);
});

const isAudioFile = computed(() => {
  const audioTypes = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];
  return audioTypes.includes(fileType.value);
});

// 预览URL生成
const pdfUrl = computed(() => {
  if (fileType.value !== 'pdf') return '';
  return `${props.fileUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`;
});

const officeUrl = computed(() => {
  if (!isOfficeFile.value) return '';
  // 使用Microsoft Office Online Viewer
  const encodedUrl = encodeURIComponent(props.fileUrl);
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
});

const canOpenInNew = computed(() => {
  return fileType.value === 'pdf' || isOfficeFile.value || isImageFile.value;
});

// 方法
const loadPreview = async () => {
  loading.value = true;
  error.value = '';

  try {
    // 对于文本文件，需要获取内容
    if (isTextFile.value) {
      await loadTextContent();
    }
    
    loading.value = false;
  } catch (err) {
    console.error('预览加载失败:', err);
    error.value = err.message || '文件预览加载失败';
    loading.value = false;
    emit('error', err);
  }
};

const loadTextContent = async () => {
  try {
    const response = await fetch(props.fileUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    
    const content = await response.text();
    textContent.value = content;
  } catch (err) {
    throw new Error(`无法加载文本文件: ${err.message}`);
  }
};

const onLoadSuccess = () => {
  loading.value = false;
  error.value = '';
  emit('loaded');
};

const onLoadError = (e) => {
  loading.value = false;
  error.value = '文件预览加载失败，可能是文件不存在或格式不支持';
  emit('error', new Error(error.value));
};

const retry = () => {
  loadPreview();
};

const downloadFile = () => {
  const link = document.createElement('a');
  link.href = props.fileUrl;
  link.download = props.fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const openInNew = () => {
  if (canOpenInNew.value) {
    let url = props.fileUrl;
    if (fileType.value === 'pdf') {
      url = pdfUrl.value;
    } else if (isOfficeFile.value) {
      url = officeUrl.value;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

// 监听文件URL变化
watch(() => props.fileUrl, () => {
  if (props.fileUrl) {
    loadPreview();
  }
}, { immediate: true });

// 组件挂载
onMounted(() => {
  if (props.fileUrl) {
    loadPreview();
  }
});
</script>

<style scoped>
.modern-file-viewer {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e3e3e3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  padding: 20px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-state h3 {
  color: #dc3545;
  margin-bottom: 8px;
}

.error-state p {
  color: #666;
  margin-bottom: 20px;
  max-width: 400px;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.preview-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview-frame {
  flex: 1;
  width: 100%;
  border: none;
  min-height: 500px;
}

.image-viewer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.text-viewer {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.text-content {
  background: white;
  padding: 20px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.video-viewer, .audio-viewer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.preview-video {
  max-width: 100%;
  max-height: 100%;
  border-radius: 4px;
}

.preview-audio {
  width: 100%;
  max-width: 400px;
}

.unsupported-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.unsupported-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.viewer-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border-top: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  font-size: 12px;
  color: #666;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 按钮样式 */
.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  white-space: nowrap;
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

.btn-sm {
  padding: 4px 8px;
  font-size: 11px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .viewer-toolbar {
    flex-wrap: wrap;
    gap: 4px;
    padding: 6px 8px;
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .file-info {
    order: -1;
    text-align: left;
    width: 100%;
    margin-bottom: 4px;
  }

  .text-content {
    font-size: 12px;
    padding: 15px;
  }
}
</style>
