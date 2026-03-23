<template>
  <!-- 节点编辑对话框 -->
  <div v-if="showEditDialog" class="node-dialog-overlay" @click.self="$emit('cancel')">
    <div class="node-dialog">
      <h3>{{ editingNode.id ? '修改节点' : '添加节点' }}</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="nodeName">节点名称</label>
          <input 
            type="text" 
            id="nodeName" 
            v-model="localNode.name" 
            required
            :disabled="isLoading"
          >
        </div>
        <div class="form-group">
          <label for="nodeContent">节点内容</label>
          <textarea
            id="nodeContent"
            v-model="localNode.content"
            rows="4"
            :disabled="isLoading"
          ></textarea>
        </div>

        <!-- 文件上传区域 - 只在编辑现有节点时显示 -->
        <div v-if="editingNode.id && courseId" class="form-group">
          <label>节点文件</label>
          <div class="file-upload-section">
            <!-- 文件上传按钮 -->
            <div class="upload-controls">
              <button
                type="button"
                class="upload-btn"
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
        <div class="dialog-actions">
          <button 
            type="button" 
            class="cancel-btn" 
            @click="$emit('cancel')"
            :disabled="isLoading"
          >
            取消
          </button>
          <button 
            type="submit" 
            class="save-btn"
            :disabled="isLoading || !localNode.name.trim()"
          >
            {{ isLoading ? '保存中...' : '保存' }}
          </button>
        </div>
      </form>
    </div>
  </div>
  
  <!-- 确认删除对话框 -->
  <div v-if="showDeleteDialog" class="node-dialog-overlay" @click.self="$emit('cancelDelete')">
    <div class="node-dialog delete-dialog">
      <div class="delete-header">
        <div class="delete-icon">⚠️</div>
        <h3>确认删除节点</h3>
      </div>

      <div class="delete-content">
        <div class="node-info">
          <p class="node-name">
            <strong>{{ deletingNode.name || '未命名节点' }}</strong>
          </p>
          <p v-if="deletingNode.content" class="node-description">
            {{ deletingNode.content }}
          </p>
        </div>

        <div v-if="childNodeInfo" class="child-info">
          <div class="warning-box">
            <p v-if="childNodeInfo.directChildren > 0">
              <strong>⚠️ 此节点包含 {{ childNodeInfo.directChildren }} 个直接子节点</strong>
            </p>
            <p v-if="childNodeInfo.totalDescendants > childNodeInfo.directChildren">
              <strong>⚠️ 总共将删除 {{ childNodeInfo.totalDescendants + 1 }} 个节点（包括所有后代节点）</strong>
            </p>
            <p v-else-if="childNodeInfo.totalDescendants > 0">
              <strong>⚠️ 总共将删除 {{ childNodeInfo.totalDescendants + 1 }} 个节点</strong>
            </p>
          </div>
        </div>

        <div class="warning-message">
          <p><strong>此操作不可撤销！</strong></p>
          <p>删除后，该节点及其所有子节点将永久丢失。</p>
        </div>
      </div>

      <div class="dialog-actions">
        <button
          type="button"
          class="cancel-btn"
          @click="$emit('cancelDelete')"
          :disabled="isLoading"
        >
          取消
        </button>
        <button
          type="button"
          class="delete-confirm-btn"
          @click="$emit('confirmDelete')"
          :disabled="isLoading"
        >
          {{ isLoading ? '删除中...' : '确认删除' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useChapterFileUpload } from '@/composables/useChapterFileUpload';
import '@/styles/components/node-edit-dialog.css';

// Props
const props = defineProps({
  showEditDialog: {
    type: Boolean,
    default: false
  },
  showDeleteDialog: {
    type: Boolean,
    default: false
  },
  editingNode: {
    type: Object,
    default: () => ({})
  },
  deletingNode: {
    type: Object,
    default: () => ({})
  },
  childNodeInfo: {
    type: Object,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  courseId: {
    type: [String, Number],
    default: null
  }
});

// Emits
const emit = defineEmits([
  'save',
  'cancel',
  'confirmDelete',
  'cancelDelete'
]);

// 使用章节文件上传功能
const {
  isUploading,
  currentProgress: uploadProgress,
  progressText: uploadProgressText,
  uploadChapterFile,
  loadCourseFiles,
  getNodeFiles
} = useChapterFileUpload();

// 本地节点数据，避免直接修改props
const localNode = ref({
  name: '',
  content: '',
  id: null,
  parentId: null,
  graphId: null
});

// 文件输入引用
const fileInput = ref(null);

// 计算属性 - 当前节点的文件列表
const nodeFiles = computed(() => {
  if (!props.editingNode?.id || !props.courseId) {
    return [];
  }
  return getNodeFiles('节点文件', props.editingNode.id);
});

// 监听editingNode变化，同步到本地数据
watch(() => props.editingNode, (newNode) => {
  if (newNode) {
    localNode.value = {
      name: newNode.name || '',
      content: newNode.content || '',
      id: newNode.id || null,
      parentId: newNode.parentId || null,
      graphId: newNode.graphId || null
    };
  }
}, { immediate: true, deep: true });

// 表单提交处理
const handleSubmit = () => {
  if (!localNode.value.name.trim()) {
    alert('节点名称不能为空');
    return;
  }
  
  // 发送保存事件，传递本地节点数据
  emit('save', { ...localNode.value });
};

// 重置表单数据
const resetForm = () => {
  localNode.value = {
    name: '',
    content: '',
    id: null,
    parentId: null,
    graphId: null
  };
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

  if (!props.editingNode?.id) {
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
        props.editingNode.id,
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

// 暴露重置方法给父组件
defineExpose({
  resetForm
});
</script>
