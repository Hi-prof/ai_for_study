<template>
  <div class="student-chapter-file-list">
    <!-- 文件列表标题 -->
    <div class="file-list-header">
      <h4 class="file-list-title">
        📁 {{ nodeName }} 的文件
        <span class="file-count">({{ files.length }})</span>
      </h4>
      
      <div class="file-actions">
        <button
          class="btn btn-sm btn-secondary refresh-btn"
          @click="refreshFiles"
          :disabled="loading"
        >
          🔄 刷新
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>正在加载文件列表...</span>
    </div>

    <!-- 文件列表 -->
    <div v-else-if="files.length > 0" class="file-list">
      <div 
        v-for="file in files" 
        :key="file.id" 
        class="file-item"
      >
        <div class="file-icon">
          {{ getFileIcon(file.fileName) }}
        </div>
        
        <div class="file-info">
          <div class="file-name" :title="file.fileName">
            {{ getDisplayFileName(file.fileName) }}
          </div>
          <div class="file-meta">
            <span class="file-size">{{ formatFileSize(file.fileSize) }}</span>
            <span class="file-time">{{ formatTime(file.createTime) }}</span>
          </div>
          <div v-if="file.remark" class="file-remark">
            {{ file.remark }}
          </div>
        </div>

        <div class="file-actions">
          <button
            class="btn btn-xs btn-success download-btn"
            @click="downloadFile(file)"
            title="下载文件"
          >
            📥 下载
          </button>
          <button
            class="btn btn-xs btn-outline preview-btn"
            @click="previewFile(file)"
            title="预览文件"
            v-if="canPreview(file.fileName)"
          >
            👁️ 预览
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📂</div>
      <p class="empty-text">暂无文件</p>
    </div>

    <!-- Office文件预览对话框 -->
    <FilePreviewDialog
      v-model:visible="previewVisible"
      :file-url="currentFile?.fileUrl || ''"
      :file-name="currentFile?.fileName || ''"
      :file-type="currentFile?.fileType || ''"
      :file-size="currentFile?.fileSize || 0"
      @close="closePreview"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useChapterFileUpload } from '@/shared/composables/useChapterFileUpload';
import { parseChapterFileName } from '@/utils/chapterFileNaming';
import { useOfficePreview } from '@/shared/composables/useOfficePreview';
import { isPreviewSupported as isOfficeFileSupported } from '@/utils/fileViewerUtils';
import FilePreviewDialog from '@/ui/common/office-preview/FilePreviewDialog.vue';

// 定义props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  },
  nodeName: {
    type: String,
    required: true
  },
  nodeId: {
    type: [String, Number],
    default: null
  },
  autoLoad: {
    type: Boolean,
    default: true
  }
});

// 定义emits
const emit = defineEmits(['fileChange']);

// 使用章节文件上传功能
const {
  isLoading: loading,
  courseFiles,
  loadCourseFiles,
  getChapterFiles,
  getNodeFiles
} = useChapterFileUpload();

// 使用office预览功能
const {
  previewVisible,
  currentFile,
  openPreview,
  closePreview
} = useOfficePreview();

// 计算属性 - 当前节点的文件列表
const files = computed(() => {
  if (props.nodeId) {
    // 有nodeId，获取节点文件
    return getNodeFiles(props.nodeName, props.nodeId);
  } else {
    // 没有nodeId，获取章节级别文件
    return getChapterFiles(props.nodeName, null);
  }
});

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return timeStr;
  }
};

// 获取文件图标
const getFileIcon = (fileName) => {
  if (!fileName) return '📄';
  
  const ext = fileName.toLowerCase().split('.').pop();
  const iconMap = {
    pdf: '📕',
    doc: '📘',
    docx: '📘',
    ppt: '📙',
    pptx: '📙',
    xls: '📗',
    xlsx: '📗',
    txt: '📄',
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🖼️',
    mp4: '🎬',
    avi: '🎬',
    mov: '🎬',
    mp3: '🎵',
    wav: '🎵'
  };
  
  return iconMap[ext] || '📄';
};

// 获取显示文件名（显示原始文件名）
const getDisplayFileName = (fileName) => {
  if (!fileName) return '';
  
  const parsed = parseChapterFileName(fileName);
  if (parsed) {
    return parsed.originalFileName;
  }
  
  return fileName;
};

// 检查是否可以预览
const canPreview = (fileName) => {
  if (!fileName) return false;

  // 检查是否支持office预览
  if (isOfficeFileSupported(fileName)) {
    return true;
  }

  // 检查其他可预览类型
  const ext = fileName.toLowerCase().split('.').pop();
  const previewableTypes = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'txt'];

  return previewableTypes.includes(ext);
};

// 刷新文件列表
const refreshFiles = async () => {
  try {
    await loadCourseFiles(props.courseId);
    emit('fileChange');
  } catch (error) {
    console.error('刷新文件列表失败:', error);
  }
};

// 下载文件
const downloadFile = (file) => {
  if (file.fileUrl) {
    window.open(file.fileUrl, '_blank');
  } else {
    console.warn('文件URL不存在:', file);
  }
};

// 预览文件
const previewFile = async (file) => {
  if (!file.fileUrl) {
    console.warn('文件URL不存在:', file);
    return;
  }

  // 检查是否支持office预览
  if (isOfficeFileSupported(file.fileName)) {
    try {
      await openPreview({
        fileUrl: file.fileUrl,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize
      });
    } catch (error) {
      console.error('Office预览失败:', error);
      // 如果office预览失败，回退到在新窗口打开
      window.open(file.fileUrl, '_blank');
    }
  } else {
    // 其他文件类型在新窗口打开
    window.open(file.fileUrl, '_blank');
  }
};

// 监听课程ID变化，重新加载文件
watch(() => props.courseId, (newCourseId) => {
  if (newCourseId && props.autoLoad) {
    loadCourseFiles(newCourseId);
  }
}, { immediate: true });

// 组件挂载时加载文件
onMounted(() => {
  if (props.courseId && props.autoLoad) {
    loadCourseFiles(props.courseId);
  }
});
</script>

<style scoped>
.student-chapter-file-list {
  margin-top: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background-color: #ffffff;
  overflow: hidden;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.file-list-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.file-count {
  font-size: 0.875rem;
  color: #3b82f6;
  font-weight: normal;
}

.file-actions {
  display: flex;
  gap: 0.5rem;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #64748b;
}

.loading-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.file-list {
  max-height: 24rem;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s ease;
}

.file-item:hover {
  background-color: #f8fafc;
}

.file-item:last-child {
  border-bottom: none;
}

.file-icon {
  font-size: 1.5rem;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.125rem;
}

.file-remark {
  font-size: 0.75rem;
  color: #94a3b8;
  font-style: italic;
}

.file-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.25rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-text {
  margin: 0;
  color: #64748b;
  font-size: 1rem;
}

/* 按钮样式 */
.btn {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-xs {
  padding: 0.125rem 0.375rem;
  font-size: 0.6875rem;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.btn-secondary {
  background-color: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e2e8f0;
}

.btn-outline {
  background-color: transparent;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.btn-outline:hover:not(:disabled) {
  background-color: #f8fafc;
  color: #475569;
}

.btn-success {
  background-color: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #059669;
}
</style>
