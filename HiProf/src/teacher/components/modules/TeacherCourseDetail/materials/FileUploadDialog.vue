<template>
  <div v-if="visible" class="upload-dialog-overlay" @click="handleOverlayClick">
    <div class="upload-dialog" @click.stop>
      <!-- 对话框头部 -->
      <div class="dialog-header">
        <h3 class="dialog-title">上传课程资料</h3>
        <button class="close-btn" @click="handleCloseClick">
          <i class="close-icon"></i>
        </button>
      </div>

      <!-- 对话框内容 -->
      <div class="dialog-content">
        <!-- 文件拖拽区域 -->
        <div
          :class="['upload-area', { 'drag-over': isDragOver, 'uploading': isUploading }]"
          @drop="handleDrop"
          @dragover.prevent="handleDragOver"
          @dragleave="handleDragLeave"
          @click="triggerFileInput"
        >
          <div v-if="!isUploading" class="upload-content">
            <div class="upload-icon">📁</div>
            <p class="upload-text">
              <span class="primary-text">点击上传</span>
              或拖拽文件到此区域
            </p>
            <p class="upload-hint">
              支持 PDF、Word(.doc/.docx)、PPT(.ppt/.pptx)、Excel(.xls/.xlsx)、图片(jpg/png/gif)、视频(mp4)、音频(mp3)等格式<br/>
              <strong>支持大文件上传：最大50MB</strong><br/>
              <small>超过10MB的文件会自动压缩以适配服务器要求</small>
            </p>
          </div>

          <!-- 上传进度 -->
          <div v-else class="upload-progress">
            <div class="progress-icon">
              <div class="loading-spinner"></div>
            </div>
            <p class="progress-text">
              {{ isCompressing ? '正在压缩文件...' : '正在上传文件...' }}
            </p>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (isCompressing ? compressionProgress : uploadProgress) + '%' }"></div>
            </div>
            <p class="progress-percent">{{ isCompressing ? compressionProgress : uploadProgress }}%</p>
          </div>
        </div>

        <!-- 文件输入框 -->
        <input
          ref="fileInput"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.mp3"
          style="display: none"
          @change="handleFileSelect"
        >

        <!-- 已选择的文件列表 -->
        <div v-if="selectedFiles.length > 0" class="selected-files">
          <h4 class="files-title">已选择的文件 ({{ selectedFiles.length }})</h4>
          <div class="files-list">
            <div
              v-for="(file, index) in selectedFiles"
              :key="index"
              class="file-item"
            >
              <div class="file-info">
                <i :class="getFileIcon(file)"></i>
                <div class="file-details">
                  <p class="file-name">{{ file.name }}</p>
                  <p class="file-size">
                    {{ formatFileSize(file.size) }}
                    <span v-if="getFileStatus(file).needsCompression" class="compression-badge">
                      📦 将压缩
                    </span>
                    <span v-else-if="getFileStatus(file).tooLarge" class="warning-badge">
                      ⚠️ 文件较大
                    </span>
                  </p>
                </div>
              </div>
              <button class="remove-btn" @click="removeFile(index)">
                <i class="delete-icon"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- 文件描述输入 -->
        <div v-if="selectedFiles.length > 0" class="file-description">
          <label class="description-label">文件描述（可选）</label>
          <textarea
            v-model="fileDescription"
            class="description-input"
            placeholder="请输入文件描述..."
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- 对话框底部 -->
      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="handleCancelClick" :disabled="isUploading">
          取消
        </button>
        <button
          class="btn btn-primary"
          @click="startUpload"
          :disabled="selectedFiles.length === 0 || isUploading"
        >
          {{ isUploading ? '上传中...' : `上传 ${selectedFiles.length} 个文件` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { createCourseFile, uploadFile, checkBackendConnection } from '@/api/files';
import { compressFiles } from './FileCompressionUtils.js';

// 定义props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  courseId: {
    type: [String, Number],
    required: true
  },
  currentPath: {
    type: String,
    default: '/'
  }
});

// 定义emits
const emit = defineEmits(['update:visible', 'uploadSuccess']);

// 响应式数据
const fileInput = ref(null);
const selectedFiles = ref([]);
const fileDescription = ref('');
const isDragOver = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);
const isCompressing = ref(false);
const compressionProgress = ref(0);

// 支持的文件类型
const allowedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'video/mp4',
  'audio/mp3'
];

// 服务器上传限制 (10MB)
const serverLimit = 10 * 1024 * 1024;

// 前端允许的最大文件大小 (50MB - 允许上传大文件，通过压缩适配服务器)
const maxFileSize = 50 * 1024 * 1024;

// 自动压缩阈值 (10MB - 超过此大小自动压缩)
const compressionThreshold = 10 * 1024 * 1024;

// 关闭对话框
const closeDialog = () => {
  emit('update:visible', false);
  resetDialog();
};

// 处理关闭按钮点击
const handleCloseClick = () => {
  if (!isUploading.value) {
    closeDialog();
  }
};

// 处理取消按钮点击
const handleCancelClick = () => {
  if (!isUploading.value) {
    closeDialog();
  }
};

// 重置对话框状态
const resetDialog = () => {
  selectedFiles.value = [];
  fileDescription.value = '';
  isDragOver.value = false;
  isUploading.value = false;
  uploadProgress.value = 0;
  isCompressing.value = false;
  compressionProgress.value = 0;
};

// 处理覆盖层点击
const handleOverlayClick = () => {
  if (!isUploading.value) {
    closeDialog();
  }
};

// 触发文件输入框
const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInput.value?.click();
  }
};

// 处理文件选择
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  addFiles(files);
  // 清空input值，允许重复选择同一文件
  event.target.value = '';
};

// 处理拖拽
const handleDragOver = (event) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = () => {
  isDragOver.value = false;
};

const handleDrop = (event) => {
  event.preventDefault();
  isDragOver.value = false;
  
  if (!isUploading.value) {
    const files = Array.from(event.dataTransfer.files);
    addFiles(files);
  }
};

// 添加文件
const addFiles = (files) => {
  const validFiles = files.filter(file => {
    // 检查文件类型
    if (!allowedTypes.includes(file.type)) {
      alert(`不支持的文件类型: ${file.name}`);
      return false;
    }
    
    // 检查文件大小
    if (file.size > maxFileSize) {
      alert(`文件过大: ${file.name} (最大支持${(maxFileSize / 1024 / 1024).toFixed(0)}MB)\n\n请尝试：\n1. 分割文件后分别上传\n2. 手动压缩文件\n3. 联系管理员增加限制`);
      return false;
    }
    
    // 大文件自动压缩提示
    if (file.size > compressionThreshold) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
      const willCompress = file.type.includes('presentation') || file.type.includes('powerpoint');
      
      if (willCompress) {
        // PPT文件，会被压缩
        const confirmed = confirm(`检测到大文件: ${file.name} (${fileSizeMB}MB)\n\n系统将自动压缩PPT文件以适应服务器要求。\n压缩过程可能需要一些时间，请耐心等待。\n\n是否继续上传？`);
        if (!confirmed) {
          return false;
        }
      } else {
        // 非PPT文件，无法压缩，警告用户
        const confirmed = confirm(`大文件警告: ${file.name} (${fileSizeMB}MB)\n\n此文件类型无法自动压缩，如果超过服务器限制(10MB)，上传可能会失败。\n\n建议：\n• 手动压缩文件后重新上传\n• 或选择更小的文件\n\n是否仍要尝试上传？`);
        if (!confirmed) {
          return false;
        }
      }
    }
    
    // 检查是否已存在
    if (selectedFiles.value.some(f => f.name === file.name && f.size === file.size)) {
      alert(`文件已存在: ${file.name}`);
      return false;
    }
    
    return true;
  });
  
  selectedFiles.value.push(...validFiles);
};

// 移除文件
const removeFile = (index) => {
  selectedFiles.value.splice(index, 1);
};

// 获取文件图标
const getFileIcon = (file) => {
  const type = file.type;
  if (type.includes('pdf')) return 'pdf-icon';
  if (type.includes('word') || type.includes('document')) return 'word-icon';
  if (type.includes('presentation') || type.includes('powerpoint')) return 'ppt-icon';
  if (type.includes('spreadsheet') || type.includes('excel')) return 'excel-icon';
  if (type.includes('image')) return 'image-icon';
  if (type.includes('video')) return 'video-icon';
  if (type.includes('audio')) return 'audio-icon';
  return 'file-icon';
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 获取文件处理状态
const getFileStatus = (file) => {
  const fileSizeMB = file.size / 1024 / 1024;
  const isPPT = file.type.includes('presentation') || file.type.includes('powerpoint');
  
  if (fileSizeMB > compressionThreshold / 1024 / 1024) {
    if (isPPT) {
      return { needsCompression: true, tooLarge: false };
    } else {
      return { needsCompression: false, tooLarge: true };
    }
  }
  
  return { needsCompression: false, tooLarge: false };
};



// 开始上传
const startUpload = async () => {
  if (selectedFiles.value.length === 0) return;

  isUploading.value = true;
  uploadProgress.value = 0;
  isCompressing.value = true;
  compressionProgress.value = 0;

  try {
    // 先检查后端连接
    const isConnected = await checkBackendConnection();
    if (!isConnected) {
      throw new Error('无法连接到服务器，请检查网络连接或联系管理员');
    }

    // 文件压缩阶段
    const compressedFiles = await compressFiles(selectedFiles.value, {
      targetSizeMB: 9, // 目标大小9MB，确保不超过10MB服务器限制
      onProgress: (percent, message) => {
        compressionProgress.value = percent;
      }
    });
    
    isCompressing.value = false;

    const totalFiles = compressedFiles.length;
    let completedFiles = 0;

    for (let i = 0; i < compressedFiles.length; i++) {
      const file = compressedFiles[i];
      const originalFile = selectedFiles.value[i];

      try {
        // 创建单个文件的进度回调
        const fileProgressCallback = (percent) => {
          const overallProgress = Math.round(((completedFiles + percent / 100) / totalFiles) * 100);
          uploadProgress.value = overallProgress;
        };

        // 上传文件到服务器
        const uploadResponse = await uploadFile(file, fileProgressCallback);

        // 检查上传是否成功
        if (uploadResponse.error || uploadResponse.code !== 200) {
          let errorMsg = '文件上传失败';
          errorMsg = uploadResponse.msg || uploadResponse.message || uploadResponse.error || '文件上传失败，请重试';
          throw new Error(errorMsg);
        }

        // 从上传响应中获取文件信息
        const fileUrl = uploadResponse.data?.fileUrl || uploadResponse.fileUrl || uploadResponse.url || uploadResponse.fileName;
        const fileKey = uploadResponse.data?.fileKey || uploadResponse.fileKey || uploadResponse.key || uploadResponse.fileName;

        if (!fileUrl) {
          throw new Error('上传响应中缺少文件URL信息');
        }

        // 创建课程文件记录
        const fileData = {
          courseId: props.courseId,
          fileUrl: fileUrl,
          fileType: file.type,
          fileSize: file.size,
          fileKey: fileKey || fileUrl,
          fileName: file.name,
          remark: fileDescription.value || `上传的文件: ${file.name}`,
          params: {}
        };

        await createCourseFile(fileData);

        completedFiles++;
        uploadProgress.value = Math.round((completedFiles / totalFiles) * 100);

      } catch (fileError) {
        alert(`文件 ${file.name} 上传失败: ${fileError.message}`);
        // 继续上传其他文件，但记录错误
        completedFiles++;
        uploadProgress.value = Math.round((completedFiles / totalFiles) * 100);
      }
    }

    // 只有在有文件成功上传时才触发成功事件
    const hasSuccessfulUploads = completedFiles > 0;
    if (hasSuccessfulUploads) {
      emit('uploadSuccess');
    }

  } catch (error) {
    console.error('文件上传失败:', error);
    let errorMessage = error.message || '文件上传失败，请重试';
    
    // 特殊错误处理
    if (error.message && error.message.includes('压缩后仍然过大')) {
      errorMessage = '文件压缩后仍然过大，无法上传。\n\n解决方案：\n1. 手动删除PPT中不必要的图片或动画\n2. 降低PPT中图片的分辨率\n3. 分割为多个较小的文件分别上传\n4. 联系管理员调整服务器限制';
    } else if (error.message && error.message.includes('Maximum upload size exceeded')) {
      errorMessage = '文件超出服务器10MB限制。\n\n如果是PPT文件，系统已尝试自动压缩但仍然过大。\n请尝试手动压缩文件或联系管理员。';
    }
    
    alert(`上传失败:\n${errorMessage}`);
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;
    // 确保无论成功还是失败都关闭对话框
    closeDialog();
  }
};

// 监听visible变化，重置状态
watch(() => props.visible, (newVisible) => {
  if (!newVisible) {
    resetDialog();
  }
});
</script>

<style scoped>
/* 对话框覆盖层 */
.upload-dialog-overlay {
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
}

/* 对话框主体 */
.upload-dialog {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 对话框头部 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color, #1f2937);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.25rem;
  background-color: transparent;
  color: var(--text-color-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: var(--background-color-secondary, #f3f4f6);
}

/* 对话框内容 */
.dialog-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

/* 上传区域 */
.upload-area {
  border: 2px dashed var(--border-color, #d1d5db);
  border-radius: 0.5rem;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1.5rem;
}

.upload-area:hover {
  border-color: var(--primary-color, #6366f1);
  background-color: var(--background-color-secondary, #f9fafb);
}

.upload-area.drag-over {
  border-color: var(--primary-color, #6366f1);
  background-color: rgba(99, 102, 241, 0.05);
}

.upload-area.uploading {
  cursor: not-allowed;
  opacity: 0.7;
}

.upload-content .upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-text {
  font-size: 1rem;
  color: var(--text-color, #374151);
  margin: 0 0 0.5rem 0;
}

.primary-text {
  color: var(--primary-color, #6366f1);
  font-weight: 500;
}

.upload-hint {
  font-size: 0.875rem;
  color: var(--text-color-secondary, #6b7280);
  margin: 0;
}

/* 上传进度 */
.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.progress-icon .loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid var(--border-color, #e5e7eb);
  border-top: 3px solid var(--primary-color, #6366f1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-text {
  font-size: 1rem;
  color: var(--text-color, #374151);
  margin: 0;
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background-color: var(--background-color-secondary, #f3f4f6);
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color, #6366f1);
  transition: width 0.3s ease;
}

.progress-percent {
  font-size: 0.875rem;
  color: var(--text-color-secondary, #6b7280);
  margin: 0;
}

/* 已选择文件列表 */
.selected-files {
  margin-bottom: 1.5rem;
}

.files-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color, #1f2937);
  margin: 0 0 1rem 0;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.375rem;
  background-color: var(--background-color-secondary, #f9fafb);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color, #1f2937);
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 0.75rem;
  color: var(--text-color-secondary, #6b7280);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.compression-badge {
  font-size: 0.7rem;
  background-color: #dbeafe;
  color: #1d4ed8;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  white-space: nowrap;
}

.warning-badge {
  font-size: 0.7rem;
  background-color: #fef3c7;
  color: #d97706;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  white-space: nowrap;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  border-radius: 0.25rem;
  background-color: transparent;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-btn:hover {
  background-color: #fef2f2;
}

/* 文件描述 */
.file-description {
  margin-bottom: 1.5rem;
}

.description-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color, #374151);
  margin-bottom: 0.5rem;
}

.description-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  resize: vertical;
  transition: border-color 0.2s;
}

.description-input:focus {
  outline: none;
  border-color: var(--primary-color, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

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
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--primary-color, #6366f1);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-color-dark, #4f46e5);
}

.btn-secondary {
  background-color: var(--background-color-secondary, #f3f4f6);
  color: var(--text-color, #374151);
  border-color: var(--border-color, #d1d5db);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--background-color-tertiary, #e5e7eb);
}

/* 图标样式 */
.close-icon, .delete-icon, .pdf-icon, .word-icon, .ppt-icon, .excel-icon, 
.image-icon, .video-icon, .audio-icon, .file-icon {
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

.pdf-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23dc2626'%3E%3Cpath fill-rule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.word-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%232563eb'%3E%3Cpath fill-rule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.ppt-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23ea580c'%3E%3Cpath fill-rule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.excel-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2316a34a'%3E%3Cpath fill-rule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.file-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-dialog {
    width: 95%;
    margin: 1rem;
  }
  
  .dialog-header,
  .dialog-content,
  .dialog-footer {
    padding: 1rem;
  }
  
  .upload-area {
    padding: 2rem 1rem;
  }
  
  .dialog-footer {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
