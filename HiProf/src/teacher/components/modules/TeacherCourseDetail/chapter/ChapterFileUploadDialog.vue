<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <!-- 对话框标题 -->
      <div class="dialog-header">
        <h3 class="dialog-title">
          上传章节文件 - {{ nodeName }}
          <span v-if="nodeId" class="node-id">(ID: {{ nodeId }})</span>
          <span v-else class="node-id">(根节点)</span>
        </h3>
        <button class="close-btn" @click="closeDialog">×</button>
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
              文件将自动重命名为：<br/>
              <code>{{ previewFileName }}</code>
            </p>
          </div>

          <!-- 上传进度 -->
          <div v-else class="upload-progress">
            <div class="progress-circle">
              <div class="progress-text">{{ currentProgress }}%</div>
            </div>
            <p class="progress-message">{{ progressText }}</p>
          </div>
        </div>

        <!-- 已选择的文件列表 -->
        <div v-if="selectedFiles.length > 0 && !isUploading" class="selected-files">
          <h4>已选择的文件 ({{ selectedFiles.length }})</h4>
          <div class="file-list">
            <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
              </div>
              <div class="file-preview-name">
                <span class="preview-label">重命名为：</span>
                <code>{{ generatePreviewName(file.name) }}</code>
              </div>
              <button class="remove-btn" @click="removeFile(index)">删除</button>
            </div>
          </div>
        </div>

      </div>

      <!-- 对话框底部 -->
      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="closeDialog" :disabled="isUploading">
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

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif,.mp4,.avi,.mov"
      style="display: none;"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useChapterFileUpload } from '@/composables/useChapterFileUpload';
import { generateChapterFileName } from '@/utils/chapterFileNaming';

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
  nodeName: {
    type: String,
    required: true
  },
  nodeId: {
    type: [String, Number],
    default: null // 允许为null，因为可能需要异步获取
  },
  preSelectedFiles: {
    type: Array,
    default: () => []
  }
});

// 定义emits
const emit = defineEmits(['update:visible', 'uploadSuccess', 'uploadError']);

// 使用章节文件上传功能
const {
  isUploading,
  currentProgress,
  progressText,
  uploadChapterFiles
} = useChapterFileUpload();

// 响应式数据
const fileInput = ref(null);
const selectedFiles = ref([]);
const isDragOver = ref(false);
const actualNodeId = ref(props.nodeId);

// 计算属性
const previewFileName = computed(() => {
  const nodeId = actualNodeId.value;
  // 防御性编程：如果nodeId为空，返回占位符而不是抛出错误
  if (nodeId === null || nodeId === undefined || nodeId === '') {
    return `章节文件-[等待节点ID]-${props.nodeName}-文件名.扩展名`;
  }
  try {
    return generateChapterFileName(props.nodeName, nodeId, '文件名.扩展名');
  } catch (error) {
    console.error('生成预览文件名失败:', error);
    return `章节文件-${nodeId}-${props.nodeName}-文件名.扩展名`;
  }
});

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 生成预览文件名
const generatePreviewName = (originalName) => {
  const nodeId = actualNodeId.value;

  // 防御性编程：如果nodeId为空，返回占位符而不是抛出错误
  if (nodeId === null || nodeId === undefined || nodeId === '') {
    return `章节文件-[等待节点ID]-${props.nodeName}-${originalName}`;
  }

  try {
    return generateChapterFileName(props.nodeName, nodeId, originalName);
  } catch (error) {
    console.error('生成预览文件名失败:', error);
    return `章节文件-${nodeId}-${props.nodeName}-${originalName}`;
  }
};

// 触发文件选择
const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInput.value?.click();
  }
};

// 处理文件选择
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  addFiles(files);
  event.target.value = '';
};

// 添加文件
const addFiles = (files) => {
  files.forEach(file => {
    // 检查是否已存在同名文件
    const exists = selectedFiles.value.some(f => f.name === file.name);
    if (!exists) {
      selectedFiles.value.push(file);
    }
  });
};

// 移除文件
const removeFile = (index) => {
  selectedFiles.value.splice(index, 1);
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

// 开始上传
const startUpload = async () => {
  if (selectedFiles.value.length === 0) return;

  // 参考知识卡片的做法：上传前检查节点ID
  if (actualNodeId.value === null || actualNodeId.value === undefined || actualNodeId.value === '') {
    alert('节点ID不能为空，无法上传文件。请等待系统获取节点ID或刷新页面重试。');
    return;
  }

  try {
    // 准备上传数据
    const uploadData = selectedFiles.value.map(file => ({
      file,
      nodeName: props.nodeName,
      nodeId: actualNodeId.value
    }));

    // 执行上传
    const results = await uploadChapterFiles(
      uploadData,
      props.courseId,
      (progress, current, total) => {
        console.log(`上传进度: ${progress}% (${current + 1}/${total})`);
      },
      (file, result, index, total, error) => {
        if (error) {
          console.error(`文件 ${file.name} 上传失败:`, error);
        } else {
          console.log(`文件 ${file.name} 上传成功`);
        }
      }
    );

    // 检查上传结果
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    if (successCount > 0) {
      emit('uploadSuccess', {
        successCount,
        failCount,
        results,
        nodeName: props.nodeName,
        nodeId: actualNodeId.value
      });
    }

    if (failCount > 0) {
      const failedFiles = results.filter(r => !r.success);
      emit('uploadError', {
        message: `${failCount} 个文件上传失败`,
        failedFiles
      });
    }

    // 清理状态
    selectedFiles.value = [];
    
    // 如果全部成功，关闭对话框
    if (failCount === 0) {
      closeDialog();
    }

  } catch (error) {
    console.error('批量上传失败:', error);
    emit('uploadError', {
      message: error.message || '上传失败',
      error
    });
  }
};

// 关闭对话框
const closeDialog = () => {
  if (!isUploading.value) {
    selectedFiles.value = [];
    emit('update:visible', false);
  }
};

// 处理遮罩点击
const handleOverlayClick = () => {
  closeDialog();
};

// 监听visible变化，重置状态
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    // 对话框打开时，加载预选的文件
    if (props.preSelectedFiles && props.preSelectedFiles.length > 0) {
      selectedFiles.value = [...props.preSelectedFiles];
    }
  } else {
    // 对话框关闭时，重置状态
    selectedFiles.value = [];
    isDragOver.value = false;
  }
});

// 监听预选文件变化
watch(() => props.preSelectedFiles, (newFiles) => {
  if (props.visible && newFiles && newFiles.length > 0) {
    selectedFiles.value = [...newFiles];
  }
}, { deep: true });

// 监听nodeId变化，同步到actualNodeId
watch(() => props.nodeId, (newNodeId) => {
  actualNodeId.value = newNodeId;
  console.log('ChapterFileUploadDialog: nodeId变化为:', newNodeId);
}, { immediate: true });
</script>

<style scoped>
/* 对话框样式 */
.dialog-overlay {
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

.dialog-container {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.node-id {
  font-size: 14px;
  color: #6b7280;
  font-weight: normal;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #374151;
}

.dialog-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.upload-area:hover {
  border-color: #3b82f6;
  background-color: #f8fafc;
}

.upload-area.drag-over {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.upload-area.uploading {
  cursor: not-allowed;
  opacity: 0.7;
}

.upload-content .upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-text {
  margin: 0 0 12px 0;
  font-size: 16px;
}

.primary-text {
  color: #3b82f6;
  font-weight: 600;
}

.upload-hint {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

.upload-hint code {
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(#3b82f6 0deg, #e5e7eb 0deg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.progress-text {
  font-weight: 600;
  color: #1f2937;
}

.progress-message {
  margin: 0;
  color: #6b7280;
}

.selected-files {
  margin-bottom: 20px;
}

.selected-files h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #1f2937;
}

.file-list {
  space-y: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 6px;
  margin-bottom: 8px;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 500;
  color: #1f2937;
}

.file-size {
  font-size: 12px;
  color: #6b7280;
}

.file-preview-name {
  flex: 2;
  margin: 0 12px;
  font-size: 12px;
}

.preview-label {
  color: #6b7280;
}

.file-preview-name code {
  background-color: #e5e7eb;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

.remove-btn {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.remove-btn:hover {
  background-color: #dc2626;
}


.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}
</style>
