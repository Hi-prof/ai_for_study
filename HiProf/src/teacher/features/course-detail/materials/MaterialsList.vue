<template>
  <div v-if="materials.length > 0" :class="['materials-container', viewMode]">
    <div
      v-for="material in materials"
      :key="material.id"
      :class="['material-item', getFileTypeClass(material)]"
      @click="handleItemClick(material)"
      @contextmenu.prevent="showContextMenu(material, $event)"
    >
      <div class="material-icon">
        <i :class="getFileIcon(material)"></i>
      </div>

      <div class="material-info">
        <h3 class="material-name">{{ getDisplayFileName(material) }}</h3>
        <div class="material-meta">
          <span class="meta-item">
            <i class="size-icon"></i>
            {{ formatFileSize(material.fileSize) }}
          </span>
          <span class="meta-item">
            <i class="date-icon"></i>
            {{ formatDate(material.createTime) }}
          </span>
          <span v-if="material.downloadCount" class="meta-item">
            <i class="download-icon"></i>
            {{ material.downloadCount }}次下载
          </span>
        </div>
        <p v-if="material.remark" class="material-description">
          {{ material.remark }}
        </p>
      </div>

      <div class="material-actions">
        <button class="action-btn" @click.stop="handleShare(material)">
          <i class="share-icon"></i>
          预览
        </button>
        <button class="action-btn" @click.stop="handleEdit(material)">
          <i class="edit-icon"></i>
          编辑
        </button>
        <button class="action-btn danger" @click.stop="handleDelete(material)">
          <i class="delete-icon"></i>
          删除
        </button>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click="hideContextMenu"
    >
      <div class="context-menu-item" @click="handleShare(contextMenu.material)">
        <i class="share-icon"></i>
        预览
      </div>
      <div class="context-menu-item" @click="handleEdit(contextMenu.material)">
        <i class="edit-icon"></i>
        编辑
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item danger" @click="handleDelete(contextMenu.material)">
        <i class="delete-icon"></i>
        删除
      </div>
    </div>
  </div>

  <!-- 空状态 -->
  <div v-else class="empty-state">
    <div class="empty-icon">📁</div>
    <h3 class="empty-title">暂无资料</h3>
    <p class="empty-description">开始上传您的第一个课程资料吧</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// 定义props
const props = defineProps({
  materials: {
    type: Array,
    default: () => []
  },
  viewMode: {
    type: String,
    default: 'list'
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// 定义emits
const emit = defineEmits(['itemClick', 'download', 'edit', 'delete', 'share']);

// 右键菜单
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  material: null
});

// 获取文件名
const getFileName = (fileUrl) => {
  if (!fileUrl) return '未知文件';
  const parts = fileUrl.split('/');
  return parts[parts.length - 1] || fileUrl;
};

// 获取显示用的文件名
const getDisplayFileName = (material) => {
  // 只使用服务器返回的 fileName 字段
  return material.fileName || '未知文件';
};

// 获取文件类型类名
const getFileTypeClass = (material) => {
  const fileType = material.fileType || '';
  if (fileType.includes('pdf')) return 'pdf';
  if (fileType.includes('word') || fileType.includes('document')) return 'docx';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'pptx';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'xlsx';
  if (fileType.includes('image')) return 'image';
  if (fileType.includes('video')) return 'video';
  if (fileType.includes('audio')) return 'audio';
  return 'file';
};

// 获取文件图标
const getFileIcon = (material) => {
  const fileType = getFileTypeClass(material);
  const iconMap = {
    'pdf': 'pdf-icon',
    'docx': 'word-icon',
    'pptx': 'ppt-icon',
    'xlsx': 'excel-icon',
    'image': 'image-icon',
    'video': 'video-icon',
    'audio': 'audio-icon',
    'file': 'file-icon'
  };
  return iconMap[fileType] || 'file-icon';
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
  return date.toLocaleDateString('zh-CN');
};

// 处理项目点击
const handleItemClick = (material) => {
  emit('itemClick', material);
};

// 处理下载
const handleDownload = (material) => {
  emit('download', material);
  hideContextMenu();
};

// 处理编辑
const handleEdit = (material) => {
  emit('edit', material);
  hideContextMenu();
};

// 处理删除
const handleDelete = (material) => {
  emit('delete', material);
  hideContextMenu();
};

// 处理分享
const handleShare = (material) => {
  emit('share', material);
  hideContextMenu();
};

// 显示右键菜单
const showContextMenu = (material, event) => {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    material: material
  };
};

// 隐藏右键菜单
const hideContextMenu = () => {
  contextMenu.value.visible = false;
};

// 点击外部隐藏右键菜单
const handleClickOutside = (event) => {
  if (contextMenu.value.visible && !event.target.closest('.context-menu')) {
    hideContextMenu();
  }
};

// 组件挂载时添加事件监听
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* 资料容器样式 */
.materials-container {
  padding: 1rem;
}

.materials-container.list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.materials-container.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

/* 资料项目样式 */
.material-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.material-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color, #6366f1);
}

.materials-container.grid .material-item {
  flex-direction: column;
  text-align: center;
  aspect-ratio: 1;
}

.material-icon {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  margin-right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.materials-container.grid .material-icon {
  margin-right: 0;
  margin-bottom: 1rem;
  width: 4rem;
  height: 4rem;
}

.material-info {
  flex: 1;
  min-width: 0;
}

.materials-container.grid .material-info {
  text-align: center;
}

.material-name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color, #1f2937);
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.materials-container.grid .material-name {
  white-space: normal;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.material-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.materials-container.grid .material-meta {
  flex-direction: column;
  gap: 0.25rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary, #6b7280);
}

.material-description {
  font-size: 0.875rem;
  color: var(--text-color-secondary, #6b7280);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.material-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
  flex-shrink: 0;
}

.materials-container.grid .material-actions {
  margin-left: 0;
  margin-top: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 0.25rem;
  background-color: white;
  color: var(--text-color, #374151);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: var(--background-color-secondary, #f3f4f6);
}

.action-btn.danger {
  color: #dc2626;
  border-color: #fecaca;
}

.action-btn.danger:hover {
  background-color: #fef2f2;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color, #1f2937);
  margin: 0 0 0.5rem 0;
}

.empty-description {
  color: var(--text-color-secondary, #6b7280);
  margin: 0;
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background-color: white;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.375rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 150px;
  overflow: hidden;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--text-color, #374151);
  cursor: pointer;
  transition: background-color 0.2s;
}

.context-menu-item:hover {
  background-color: var(--background-color-secondary, #f3f4f6);
}

.context-menu-item.danger {
  color: #dc2626;
}

.context-menu-item.danger:hover {
  background-color: #fef2f2;
}

.context-menu-divider {
  height: 1px;
  background-color: var(--border-color, #e5e7eb);
  margin: 0.25rem 0;
}

/* 文件图标样式 */
.size-icon, .date-icon, .download-icon, .share-icon, .edit-icon, .delete-icon,
.pdf-icon, .word-icon, .ppt-icon, .excel-icon, .image-icon, .video-icon, .audio-icon, .file-icon {
  width: 1rem;
  height: 1rem;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.material-icon .pdf-icon, .material-icon .word-icon, .material-icon .ppt-icon,
.material-icon .excel-icon, .material-icon .file-icon {
  width: 100%;
  height: 100%;
}

/* 具体图标定义 */
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

.size-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.date-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.download-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.share-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath d='M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z' /%3E%3C/svg%3E");
}

.edit-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath d='M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z' /%3E%3C/svg%3E");
}

.delete-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

/* 响应式设计 */
@media (max-width: 768px) {
  .materials-container.grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }

  .material-item {
    flex-direction: column;
    text-align: center;
  }

  .material-icon {
    margin-right: 0;
    margin-bottom: 1rem;
  }

  .material-actions {
    margin-left: 0;
    margin-top: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>
