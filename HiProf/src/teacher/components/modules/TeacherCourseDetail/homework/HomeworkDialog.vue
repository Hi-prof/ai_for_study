<template>
  <Teleport to="body">
    <div v-if="visible" class="homework-dialog-overlay" @click="handleOverlayClick">
      <div class="homework-dialog" @click.stop>
      <div class="dialog-header">
        <h3 class="dialog-title">{{ isEdit ? '编辑作业' : '布置作业' }}</h3>
        <button type="button" class="close-btn" @click="closeDialog">
          <i class="close-icon">×</i>
        </button>
      </div>

      <div class="dialog-content">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="homework-title" class="form-label">作业标题 *</label>
            <input
              id="homework-title"
              v-model="formData.title"
              type="text"
              class="form-input"
              placeholder="请输入作业标题"
              required
            />
          </div>

          <div class="form-group">
            <label for="homework-content" class="form-label">作业内容</label>
            <textarea
              id="homework-content"
              v-model="formData.content"
              class="form-textarea"
              placeholder="请输入作业内容和要求"
              rows="4"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">教师上传文件</label>
            <div class="file-upload-container">
              <div v-if="!uploadedFile" class="file-select-area">
                <input
                  ref="fileInput"
                  type="file"
                  class="file-input"
                  @change="handleFileSelect"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                />
                <button type="button" class="file-select-button" @click="openFilePicker">
                  <span class="upload-icon" aria-hidden="true">
                    <WorkspaceIcon name="folder" :size="18" />
                  </span>
                  <span>选择文件</span>
                </button>
                <div class="file-hint">支持 PDF、Word、PPT、Excel、图片等格式，最大 50MB</div>
              </div>

              <div v-if="uploading" class="upload-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="`width: ${uploadProgress}%`"></div>
                </div>
                <div class="progress-text">上传中... {{ uploadProgress }}%</div>
              </div>

              <div v-if="uploadedFile" class="uploaded-file">
                <div class="file-info">
                  <span class="file-icon" aria-hidden="true">
                    <WorkspaceIcon name="homework" :size="18" />
                  </span>
                  <div class="file-details">
                    <div class="file-name">{{ uploadedFile.name }}</div>
                    <div class="file-size">{{ uploadedFile.size ? formatFileSize(uploadedFile.size) : '已上传文件' }}</div>
                  </div>
                </div>
                <button type="button" class="remove-file-btn" @click="removeFile" title="删除文件">
                  <i class="remove-icon">×</i>
                </button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="homework-overtime" class="form-label">截止时间 *</label>
            <input
              id="homework-overtime"
              v-model="formData.overTime"
              type="datetime-local"
              class="form-input"
              required
            />
          </div>
        </form>
      </div>
      
      <div class="dialog-footer">
        <button type="button" class="btn btn-secondary" @click="closeDialog">
          取消
        </button>
        <button
          type="button"
          class="btn btn-primary"
          @click="handleSubmit"
          :disabled="!formData.title || !formData.overTime || loading"
        >
          <span v-if="loading">{{ isEdit ? '更新中...' : '创建中...' }}</span>
          <span v-else>{{ isEdit ? '更新作业' : '创建作业' }}</span>
        </button>
      </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { uploadFile } from '@/api/files';
import WorkspaceIcon from '@/ui/workspace/WorkspaceIcon.vue';

// 导入样式文件
import '@/teacher/styles/homework-dialog.css';

// 定义props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  homework: {
    type: Object,
    default: null
  },
  courseId: {
    type: [String, Number],
    required: true
  }
});

// 定义emits
const emit = defineEmits(['close', 'submit']);

// 响应式数据
const loading = ref(false);
const formData = ref({
  title: '',
  content: '',
  fileIds: '',
  overTime: '',
  courseId: props.courseId
});

// 文件上传相关状态
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadedFile = ref(null);
const fileInput = ref(null);

// 计算属性
const isEdit = computed(() => !!props.homework);

// 将ISO时间格式转换为datetime-local格式
const formatDateTimeLocal = (isoString) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';

    // 转换为本地时间的YYYY-MM-DDTHH:mm格式
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    return '';
  }
};

// 文件大小格式化函数
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const openFilePicker = () => {
  fileInput.value?.click();
};

// 文件选择处理
const handleFileSelect = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // 文件大小限制 (50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('文件大小不能超过 50MB');
    return;
  }

  try {
    uploading.value = true;
    uploadProgress.value = 0;

    // 上传文件
    const result = await uploadFile(file, (progress) => {
      uploadProgress.value = progress;
    });

    if (result.error) {
      throw new Error(result.msg || '文件上传失败');
    }

    // 保存上传结果
    uploadedFile.value = {
      name: file.name,
      size: file.size,
      url: result.data?.fileUrl || result.fileUrl || result.url || '',
      key: result.data?.fileKey || result.fileKey || result.key || ''
    };

    // 更新表单数据
    formData.value.fileIds = uploadedFile.value.url;

  } catch (error) {
    alert('文件上传失败：' + error.message);
    uploadedFile.value = null;
    formData.value.fileIds = '';
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
    // 清空文件输入框
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

// 删除文件
const removeFile = () => {
  uploadedFile.value = null;
  formData.value.fileIds = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// 重置表单
const resetForm = () => {
  formData.value = {
    title: '',
    content: '',
    fileIds: '',
    overTime: '',
    courseId: props.courseId
  };
  uploadedFile.value = null;
  uploading.value = false;
  uploadProgress.value = 0;
};

// 监听homework变化，初始化表单数据
watch(() => props.homework, (newHomework) => {
  if (newHomework) {
    // 编辑模式，填充现有数据
    const overTimeValue = newHomework.originalData?.overTime || newHomework.overTime || '';
    const fileUrl = newHomework.originalData?.fileIds || newHomework.originalData?.tFile || '';

    formData.value = {
      id: newHomework.originalData?.id || newHomework.id,
      title: newHomework.originalData?.title || newHomework.title || '',
      content: newHomework.originalData?.content || newHomework.description || '',
      fileIds: fileUrl,
      overTime: formatDateTimeLocal(overTimeValue),
      courseId: props.courseId
    };

    // 如果有文件URL，设置已上传文件状态
    if (fileUrl) {
      // 从URL中提取文件名
      const getFilenameFromUrl = (url) => {
        if (!url) return '未知文件';
        try {
          const path = new URL(url).pathname;
          const filename = path.substring(path.lastIndexOf('/') + 1);
          return decodeURIComponent(filename);
        } catch (e) {
          const parts = url.split('/');
          return parts.length > 0 ? parts[parts.length - 1] : '未知文件';
        }
      };

      uploadedFile.value = {
        name: getFilenameFromUrl(fileUrl),
        size: 0, // 文件大小仍然未知
        url: fileUrl,
        key: ''
      };
    } else {
      uploadedFile.value = null;
    }
  } else {
    // 新建模式，重置表单
    resetForm();
  }
}, { immediate: true });

// 监听courseId变化
watch(() => props.courseId, (newCourseId) => {
  formData.value.courseId = newCourseId;
});

// 关闭对话框
const closeDialog = () => {
  resetForm();
  emit('close');
};

// 处理遮罩层点击
const handleOverlayClick = () => {
  closeDialog();
};

// 提交表单
const handleSubmit = async () => {
  if (!formData.value.title) {
    alert('请输入作业标题');
    return;
  }

  if (!formData.value.overTime) {
    alert('请选择作业截止时间');
    return;
  }

  // 验证截止时间不能早于当前时间
  const now = new Date();
  const deadline = new Date(formData.value.overTime);
  if (deadline <= now) {
    alert('作业截止时间不能早于当前时间');
    return;
  }

  loading.value = true;
  try {
    // 发出提交事件，由父组件处理具体的API调用
    const submissionData = { ...formData.value };
    if (uploadedFile.value) {
      submissionData.fileName = uploadedFile.value.name;
    }
    emit('submit', submissionData);
  } finally {
    loading.value = false;
  }
};
</script>
