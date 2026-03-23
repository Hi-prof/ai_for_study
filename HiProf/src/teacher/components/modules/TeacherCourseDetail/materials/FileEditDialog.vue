<template>
  <div v-if="visible" class="edit-dialog-overlay" @click="handleOverlayClick">
    <div class="edit-dialog" @click.stop>
      <!-- 对话框头部 -->
      <div class="dialog-header">
        <h3 class="dialog-title">编辑文件信息</h3>
        <button class="close-btn" @click="closeDialog">
          <i class="close-icon"></i>
        </button>
      </div>

      <!-- 对话框内容 -->
      <div class="dialog-content">
        <!-- 文件信息展示 -->
        <div v-if="fileData" class="file-preview">
          <div class="file-icon-large">
            <i :class="getFileIcon(fileData)"></i>
          </div>
          <div class="file-basic-info">
            <p class="original-name">原文件名: {{ getFileName(fileData.fileUrl) }}</p>
            <p class="file-size">文件大小: {{ formatFileSize(fileData.fileSize) }}</p>
            <p class="upload-date">上传时间: {{ formatDate(fileData.createTime) }}</p>
          </div>
        </div>

        <!-- 编辑表单 -->
        <form @submit.prevent="saveChanges">
          <div class="form-group">
            <label class="form-label">显示名称</label>
            <input
              v-model="editForm.displayName"
              type="text"
              class="form-input"
              placeholder="请输入文件显示名称"
              required
            >
            <p class="form-hint">这个名称将在文件列表中显示</p>
          </div>

          <div class="form-group">
            <label class="form-label">文件描述</label>
            <textarea
              v-model="editForm.description"
              class="form-textarea"
              placeholder="请输入文件描述（可选）"
              rows="4"
            ></textarea>
            <p class="form-hint">描述文件的内容、用途等信息</p>
          </div>

          <div class="form-group">
            <label class="form-label">文件标签</label>
            <div class="tags-input">
              <div class="tags-list">
                <span
                  v-for="(tag, index) in editForm.tags"
                  :key="index"
                  class="tag-item"
                >
                  {{ tag }}
                  <button type="button" class="tag-remove" @click="removeTag(index)">
                    <i class="close-icon"></i>
                  </button>
                </span>
              </div>
              <input
                v-model="newTag"
                type="text"
                class="tag-input"
                placeholder="输入标签后按回车添加"
                @keydown.enter.prevent="addTag"
                @keydown.comma.prevent="addTag"
              >
            </div>
            <p class="form-hint">用逗号或回车分隔多个标签</p>
          </div>

          <div class="form-group">
            <label class="form-label">访问权限</label>
            <div class="radio-group">
              <label class="radio-item">
                <input
                  v-model="editForm.accessLevel"
                  type="radio"
                  value="public"
                  class="radio-input"
                >
                <span class="radio-label">公开</span>
                <span class="radio-desc">所有学生都可以访问</span>
              </label>
              <label class="radio-item">
                <input
                  v-model="editForm.accessLevel"
                  type="radio"
                  value="restricted"
                  class="radio-input"
                >
                <span class="radio-label">限制访问</span>
                <span class="radio-desc">需要特定权限才能访问</span>
              </label>
              <label class="radio-item">
                <input
                  v-model="editForm.accessLevel"
                  type="radio"
                  value="private"
                  class="radio-input"
                >
                <span class="radio-label">私有</span>
                <span class="radio-desc">仅教师可见</span>
              </label>
            </div>
          </div>
        </form>
      </div>

      <!-- 对话框底部 -->
      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="closeDialog" :disabled="isSaving">
          取消
        </button>
        <button
          class="btn btn-primary"
          @click="saveChanges"
          :disabled="isSaving || !isFormValid"
        >
          {{ isSaving ? '保存中...' : '保存更改' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { updateCourseFile } from '@/api/files';

// 定义props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  fileData: {
    type: Object,
    default: null
  }
});

// 定义emits
const emit = defineEmits(['update:visible', 'save']);

// 响应式数据
const isSaving = ref(false);
const newTag = ref('');

// 编辑表单数据
const editForm = ref({
  displayName: '',
  description: '',
  tags: [],
  accessLevel: 'public'
});

// 表单验证
const isFormValid = computed(() => {
  return editForm.value.displayName.trim().length > 0;
});

// 获取文件名
const getFileName = (fileUrl) => {
  if (!fileUrl) return '未知文件';
  const parts = fileUrl.split('/');
  return parts[parts.length - 1] || fileUrl;
};

// 获取文件图标
const getFileIcon = (file) => {
  const fileType = file.fileType || '';
  if (fileType.includes('pdf')) return 'pdf-icon';
  if (fileType.includes('word') || fileType.includes('document')) return 'word-icon';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'ppt-icon';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'excel-icon';
  if (fileType.includes('image')) return 'image-icon';
  if (fileType.includes('video')) return 'video-icon';
  if (fileType.includes('audio')) return 'audio-icon';
  return 'file-icon';
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知日期';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

// 添加标签
const addTag = () => {
  const tag = newTag.value.trim();
  if (tag && !editForm.value.tags.includes(tag)) {
    editForm.value.tags.push(tag);
    newTag.value = '';
  }
};

// 移除标签
const removeTag = (index) => {
  editForm.value.tags.splice(index, 1);
};

// 关闭对话框
const closeDialog = () => {
  if (!isSaving.value) {
    emit('update:visible', false);
  }
};

// 处理覆盖层点击
const handleOverlayClick = () => {
  closeDialog();
};

// 保存更改
const saveChanges = async () => {
  if (!isFormValid.value || !props.fileData) return;

  isSaving.value = true;

  try {
    // 构建更新数据
    const updateData = {
      id: props.fileData.id,
      courseId: props.fileData.courseId,
      fileUrl: props.fileData.fileUrl,
      fileType: props.fileData.fileType,
      fileSize: props.fileData.fileSize,
      fileKey: props.fileData.fileKey,
      remark: editForm.value.description || editForm.value.displayName,
      displayName: editForm.value.displayName,
      tags: editForm.value.tags.join(','),
      accessLevel: editForm.value.accessLevel
    };

    await updateCourseFile(updateData);

    emit('save');
    closeDialog();

  } catch (error) {
    alert('保存失败，请重试');
  } finally {
    isSaving.value = false;
  }
};

// 初始化表单数据
const initializeForm = () => {
  if (props.fileData) {
    editForm.value = {
      displayName: props.fileData.displayName || getFileName(props.fileData.fileUrl),
      description: props.fileData.remark || '',
      tags: props.fileData.tags ? props.fileData.tags.split(',').filter(tag => tag.trim()) : [],
      accessLevel: props.fileData.accessLevel || 'public'
    };
  }
};

// 监听文件数据变化
watch(() => props.fileData, () => {
  if (props.visible && props.fileData) {
    initializeForm();
  }
}, { immediate: true });

// 监听对话框显示状态
watch(() => props.visible, (newVisible) => {
  if (newVisible && props.fileData) {
    initializeForm();
  }
});
</script>

<style scoped>
/* 对话框覆盖层 */
.edit-dialog-overlay {
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
.edit-dialog {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 500px;
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

/* 文件预览 */
.file-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--background-color-secondary, #f9fafb);
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.file-icon-large {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-icon-large i {
  width: 100%;
  height: 100%;
}

.file-basic-info {
  flex: 1;
  min-width: 0;
}

.file-basic-info p {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary, #6b7280);
}

.original-name {
  font-weight: 500;
  color: var(--text-color, #1f2937) !important;
}

/* 表单样式 */
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color, #374151);
  margin-bottom: 0.5rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-hint {
  margin: 0.5rem 0 0 0;
  font-size: 0.75rem;
  color: var(--text-color-secondary, #6b7280);
}

/* 标签输入 */
.tags-input {
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 0.375rem;
  padding: 0.5rem;
  min-height: 2.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.tags-input:focus-within {
  border-color: var(--primary-color, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background-color: var(--primary-color, #6366f1);
  color: white;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border: none;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.tag-remove:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.tag-input {
  flex: 1;
  min-width: 100px;
  border: none;
  outline: none;
  font-size: 0.875rem;
}

/* 单选按钮组 */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
}

.radio-input {
  margin-top: 0.125rem;
}

.radio-label {
  font-weight: 500;
  color: var(--text-color, #1f2937);
}

.radio-desc {
  font-size: 0.75rem;
  color: var(--text-color-secondary, #6b7280);
  margin-left: 0.5rem;
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
.close-icon, .pdf-icon, .word-icon, .ppt-icon, .excel-icon, 
.image-icon, .video-icon, .audio-icon, .file-icon {
  width: 1rem;
  height: 1rem;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.file-icon-large .close-icon,
.file-icon-large .pdf-icon, 
.file-icon-large .word-icon, 
.file-icon-large .ppt-icon,
.file-icon-large .excel-icon, 
.file-icon-large .file-icon {
  width: 100%;
  height: 100%;
}

.close-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E");
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
  .edit-dialog {
    width: 95%;
    margin: 1rem;
  }
  
  .dialog-header,
  .dialog-content,
  .dialog-footer {
    padding: 1rem;
  }
  
  .file-preview {
    flex-direction: column;
    text-align: center;
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
