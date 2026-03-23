<template>
  <div class="chapter-files-integration">
    <!-- 标题区域 -->
    <div class="integration-header">
      <h3>章节文件管理</h3>
      <p class="integration-description">
        在这里可以查看和管理所有章节的文件。文件会根据章节自动分类展示。
      </p>
    </div>

    <!-- 操作区域 -->
    <div class="integration-actions">
      <button 
        class="btn btn-primary"
        @click="refreshAllFiles"
        :disabled="loading"
      >
        🔄 刷新文件列表
      </button>
      <button
        class="btn btn-secondary"
        @click="openMaterialsUpload"
      >
        📁 上传文件
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>正在加载文件列表...</span>
    </div>

    <!-- 文件分组展示 -->
    <div v-else class="files-groups">
      <!-- 章节文件分组 -->
      <div 
        v-for="(files, groupKey) in groupedFiles" 
        :key="groupKey"
        class="file-group"
      >
        <div class="group-header">
          <h4 class="group-title">
            {{ getGroupTitle(groupKey) }}
            <span class="file-count">({{ files.length }})</span>
          </h4>
          <button 
            class="btn btn-sm btn-outline toggle-btn"
            @click="toggleGroup(groupKey)"
          >
            {{ expandedGroups.has(groupKey) ? '收起' : '展开' }}
          </button>
        </div>

        <!-- 文件列表 -->
        <div v-if="expandedGroups.has(groupKey)" class="group-files">
          <div 
            v-for="file in files" 
            :key="file.id"
            class="file-item"
          >
            <div class="file-icon">
              {{ getFileIcon(file.fileName) }}
            </div>
            
            <div class="file-info">
              <div class="file-name">
                {{ getDisplayFileName(file.fileName) }}
              </div>
              <div class="file-meta">
                <span class="file-size">{{ formatFileSize(file.fileSize) }}</span>
                <span class="file-time">{{ formatTime(file.createTime) }}</span>
              </div>
              <div v-if="file.parsedInfo" class="file-chapter-info">
                节点: {{ file.parsedInfo.nodeName }}
                <span v-if="file.parsedInfo.nodeId">(ID: {{ file.parsedInfo.nodeId }})</span>
                <span v-else>(根节点)</span>
              </div>
            </div>

            <div class="file-actions">
              <button
                class="btn btn-xs btn-success"
                @click="downloadFile(file)"
                title="下载文件"
              >
                下载
              </button>
              <button
                class="btn btn-xs btn-outline"
                @click="previewFile(file)"
                title="预览文件"
                v-if="canPreview(file.fileName)"
              >
                👁️
              </button>
              <button
                class="btn btn-xs btn-danger"
                @click="deleteFile(file)"
                title="删除文件"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="Object.keys(groupedFiles).length === 0" class="empty-state">
        <div class="empty-icon">📂</div>
        <p class="empty-text">暂无章节文件</p>
        <p class="empty-hint">
          请在章节管理页面上传文件，或使用课程资料功能上传文件
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useChapterFileUpload } from '@/composables/useChapterFileUpload';
import { parseChapterFileName } from '@/utils/chapterFileNaming';
import { deleteCourseFile } from '@/api/files';

// 定义props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
});

// 定义emits
const emit = defineEmits(['openMaterialsUpload']);

// 使用章节文件上传功能
const {
  isLoading: loading,
  courseFiles,
  loadCourseFiles,
  getGroupedFiles
} = useChapterFileUpload();

// 响应式数据
const expandedGroups = ref(new Set());

// 计算属性
const groupedFiles = computed(() => {
  return getGroupedFiles();
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
    pdf: '📕', doc: '📘', docx: '📘', ppt: '📙', pptx: '📙',
    xls: '📗', xlsx: '📗', txt: '📄', png: '🖼️', jpg: '🖼️',
    jpeg: '🖼️', gif: '🖼️', mp4: '🎬', avi: '🎬', mov: '🎬'
  };
  
  return iconMap[ext] || '📄';
};

// 获取显示文件名
const getDisplayFileName = (fileName) => {
  if (!fileName) return '';
  
  const parsed = parseChapterFileName(fileName);
  return parsed ? parsed.originalFileName : fileName;
};

// 获取分组标题
const getGroupTitle = (groupKey) => {
  if (groupKey === 'other') {
    return '其他文件';
  }

  // 处理新格式：章节文件-{nodeId} 和旧格式：{nodeName}-{nodeId}
  if (groupKey.startsWith('章节文件-')) {
    const nodeId = groupKey.replace('章节文件-', '');
    return `章节文件${nodeId === 'null' ? ' (根节点)' : ` (ID: ${nodeId})`}`;
  } else {
    // 向后兼容旧格式
    const [nodeName, nodeId] = groupKey.split('-');
    return `${nodeName}${nodeId === 'null' ? ' (根节点)' : ` (ID: ${nodeId})`}`;
  }
};

// 检查是否可以预览
const canPreview = (fileName) => {
  if (!fileName) return false;
  const ext = fileName.toLowerCase().split('.').pop();
  return ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'txt'].includes(ext);
};

// 切换分组展开状态
const toggleGroup = (groupKey) => {
  if (expandedGroups.value.has(groupKey)) {
    expandedGroups.value.delete(groupKey);
  } else {
    expandedGroups.value.add(groupKey);
  }
};

// 刷新所有文件
const refreshAllFiles = async () => {
  try {
    await loadCourseFiles(props.courseId);
  } catch (error) {
    console.error('刷新文件列表失败:', error);
  }
};

// 打开课程资料上传
const openMaterialsUpload = () => {
  emit('openMaterialsUpload');
};

// 下载文件
const downloadFile = (file) => {
  if (file.fileUrl) {
    window.open(file.fileUrl, '_blank');
  }
};

// 预览文件
const previewFile = (file) => {
  if (file.fileUrl) {
    window.open(file.fileUrl, '_blank');
  }
};

// 删除文件
const deleteFile = async (file) => {
  const displayName = getDisplayFileName(file.fileName);
  if (!confirm(`确定要删除文件 "${displayName}" 吗？`)) {
    return;
  }

  try {
    const result = await deleteCourseFile(file.id);
    
    if (result.code === 200) {
      await refreshAllFiles();
      console.log('文件删除成功');
    } else {
      throw new Error(result.message || '删除失败');
    }
  } catch (error) {
    console.error('删除文件失败:', error);
    alert('删除文件失败: ' + error.message);
  }
};

// 组件挂载时加载文件
onMounted(() => {
  if (props.courseId) {
    loadCourseFiles(props.courseId);
    // 默认展开第一个分组
    setTimeout(() => {
      const firstGroup = Object.keys(groupedFiles.value)[0];
      if (firstGroup) {
        expandedGroups.value.add(firstGroup);
      }
    }, 100);
  }
});
</script>

<style scoped>
.chapter-files-integration {
  padding: 20px;
}

.integration-header {
  margin-bottom: 24px;
}

.integration-header h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.integration-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.integration-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #6b7280;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.file-group {
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.group-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.file-count {
  font-size: 14px;
  color: #3b82f6;
  font-weight: normal;
}

.group-files {
  background-color: white;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s ease;
}

.file-item:hover {
  background-color: #f9fafb;
}

.file-item:last-child {
  border-bottom: none;
}

.file-icon {
  font-size: 24px;
  margin-right: 12px;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
}

.file-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 2px;
}

.file-chapter-info {
  font-size: 11px;
  color: #3b82f6;
  font-style: italic;
}

.file-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 500;
}

.empty-hint {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.btn {
  padding: 6px 12px;
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

.btn-xs {
  padding: 2px 6px;
  font-size: 11px;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.btn-outline {
  background-color: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-outline:hover:not(:disabled) {
  background-color: #f9fafb;
  color: #374151;
}

.btn-success {
  background-color: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #059669;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
}

.toggle-btn {
  font-size: 12px;
  padding: 4px 8px;
}
</style>
