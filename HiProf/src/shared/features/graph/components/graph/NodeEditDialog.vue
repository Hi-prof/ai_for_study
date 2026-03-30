<template>
  <div v-if="visible" class="dialog-overlay">
    <div class="dialog-container">
      <div class="dialog-header">
        <h3 class="dialog-title">{{ isNewNode ? '添加节点' : '编辑节点' }}</h3>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <div class="dialog-body">
        <div class="form-group">
          <label for="node-text">节点名称</label>
          <input
            type="text"
            id="node-text"
            v-model="formData.text"
            class="form-control"
            placeholder="请输入节点名称"
          />
        </div>

        <div class="form-group">
          <label for="node-content">节点内容</label>
          <textarea
            id="node-content"
            v-model="formData.content"
            class="form-control"
            placeholder="请输入节点内容"
            rows="6"
          ></textarea>
        </div>

        <!-- 文件上传区域 - 只在编辑现有节点时显示 -->
        <div v-if="!isNewNode && props.node?.id && props.courseId" class="form-group">
          <label>节点文件</label>
          <div class="file-upload-section">
            <!-- 文件上传按钮 -->
            <div class="upload-controls">
              <button
                type="button"
                class="btn btn-outline btn-sm"
                @click="triggerFileInput"
                :disabled="isUploading"
              >
                📁 上传文件
              </button>
            </div>

            <!-- 隐藏的文件输入 -->
            <input
              ref="fileInput"
              type="file"
              @change="handleFileSelect"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif,.mp4,.avi,.mov"
              style="display: none;"
            />

            <!-- 上传进度 -->
            <div v-if="isUploading" class="upload-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
              </div>
              <p class="progress-text">{{ uploadProgressText }}</p>
            </div>

            <!-- 文件列表 -->
            <div v-if="nodeFiles.length > 0" class="files-list">
              <div
                v-for="file in nodeFiles"
                :key="file.id"
                class="file-item"
              >
                <div class="file-info">
                  <span class="file-name">{{ file.originalFileName || file.fileName }}</span>
                  <span class="file-size">{{ formatFileSize(file.fileSize) }}</span>
                </div>
                <div class="file-actions">
                  <a
                    :href="file.fileUrl"
                    target="_blank"
                    class="file-link"
                    title="查看文件"
                  >
                    📄
                  </a>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else-if="!isUploading" class="empty-files">
              <p class="empty-text">暂无上传文件</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button class="btn btn-outline" @click="close">取消</button>
        <button class="btn btn-primary" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch } from 'vue';
import { useChapterFileUpload } from '@/shared/composables/useChapterFileUpload';
import '@/styles/components/graph-node-edit-dialog.css';

const props = defineProps({
  visible: Boolean,
  node: Object,
  isNewNode: {
    type: Boolean,
    default: false
  },
  parentNode: Object,
  courseId: {
    type: [String, Number],
    required: true
  }
});

const emit = defineEmits(['close', 'save']);

// 使用章节文件上传功能
const {
  isUploading,
  currentProgress: uploadProgress,
  progressText: uploadProgressText,
  uploadChapterFile,
  loadCourseFiles,
  getNodeFiles
} = useChapterFileUpload();

const formData = ref({
  id: '',
  text: '',
  content: ''
});

// 文件输入引用
const fileInput = ref(null);

// 计算属性 - 当前节点的文件列表
const nodeFiles = computed(() => {
  if (!props.node?.id || !props.courseId) {
    return [];
  }
  return getNodeFiles('节点文件', props.node.id);
});

// 重置表单函数 - 需要在watch之前定义
const resetForm = () => {
  formData.value = {
    id: '',
    text: '',
    content: ''
  };
};

// 监听node属性变化，更新表单数据
watch(() => props.node, (newNode) => {
  if (newNode) {
    formData.value = {
      id: newNode.id || '',
      text: newNode.text || '',
      content: newNode.data?.content || ''
    };
  } else {
    // 如果是新节点，重置表单
    resetForm();
  }
}, { immediate: true });

const close = () => {
  emit('close');
};

const save = () => {
  // 构建节点数据
  const nodeData = {
    id: formData.value.id || generateId(),
    text: formData.value.text,
    data: {
      content: formData.value.content
    }
  };

  emit('save', nodeData, props.parentNode);
  close();
};

const generateId = () => {
  return 'node_' + Date.now();
};

// 触发文件选择
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

// 处理文件选择
const handleFileSelect = async (event) => {
  const target = event.target;
  const files = target.files;

  if (!files || files.length === 0) {
    return;
  }

  if (!props.courseId) {
    alert('缺少课程ID，无法上传文件');
    return;
  }

  if (!props.node?.id) {
    alert('缺少节点ID，无法上传文件');
    return;
  }

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // 直接上传原始文件，重命名逻辑在 useChapterFileUpload.js 中处理
      const result = await uploadChapterFile(
        file, // 直接传递原始文件
        '节点文件', // 使用固定的节点文件标识
        props.node.id,
        props.courseId,
        (progress) => {
          console.log(`文件上传进度: ${progress}%`);
        }
      );

      if (result.success) {
        console.log('文件上传成功:', result.data);

        // 刷新文件列表
        if (props.courseId) {
          await loadCourseFiles(props.courseId);
        }
      }
    }

    // 清空文件输入
    if (target) {
      target.value = '';
    }

  } catch (error) {
    console.error('文件上传失败:', error);
    alert('文件上传失败: ' + error.message);
  }
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


</script> 
