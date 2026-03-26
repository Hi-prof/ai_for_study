<template>
  <div class="materials-manager">
    <div class="section-header section-header--toolbar">
      <div class="section-actions">
        <button class="btn btn-primary" @click="showUploadDialog">
          <i class="btn-icon upload-icon"></i>
          上传资料
        </button>
        <button class="btn btn-secondary" @click="createFolder">
          <i class="btn-icon folder-icon"></i>
          新建文件夹
        </button>
      </div>
    </div>

    <!-- 资料统计 -->
    <MaterialsStats :stats="materialStats" />

    <!-- 文件操作栏 -->
    <MaterialsToolbar
      v-model:view-mode="viewMode"
      v-model:sort-by="sortBy"
      v-model:search-query="searchQuery"
      @sort-change="handleSortChange"
      @search="handleSearch"
    />

    <!-- 面包屑导航 -->
    <MaterialsBreadcrumb 
      :breadcrumbs="breadcrumbs"
      @navigate="navigateToFolder"
    />

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载资料列表...</p>
    </div>

    <!-- 资料列表 -->
    <MaterialsList
      v-else
      :materials="filteredMaterials"
      :view-mode="viewMode"
      :loading="loading"
      @item-click="handleMaterialClick"
      @download="handleDownload"
      @edit="handleEdit"
      @delete="handleDelete"
      @share="handleShare"
    />

    <!-- 文件上传对话框 -->
    <FileUploadDialog
      v-model:visible="uploadDialogVisible"
      :course-id="courseId"
      :current-path="currentPath"
      @upload-success="handleUploadSuccess"
    />

    <!-- 文件编辑对话框 -->
    <FileEditDialog
      v-model:visible="editDialogVisible"
      :file-data="editingFile"
      @save="handleEditSave"
    />

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
import { getCourseFilesList, deleteCourseFile } from '@/api/files';
import { useOfficePreview } from '@/composables/useOfficePreview';
import { isPreviewSupported as isOfficeFileSupported } from '@/utils/fileViewerUtils';
import MaterialsStats from './MaterialsStats.vue';
import MaterialsToolbar from './MaterialsToolbar.vue';
import MaterialsBreadcrumb from './MaterialsBreadcrumb.vue';
import MaterialsList from './MaterialsList.vue';
import FileUploadDialog from './FileUploadDialog.vue';
import FileEditDialog from './FileEditDialog.vue';
import FilePreviewDialog from '@/ui/common/office-preview/FilePreviewDialog.vue';

// 定义props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
});

// 定义emits
const emit = defineEmits(['refresh']);

// 使用office预览功能
const {
  previewVisible,
  currentFile,
  openPreview,
  closePreview
} = useOfficePreview();

// 响应式数据
const loading = ref(false);
const materials = ref([]);
const searchQuery = ref('');
const sortBy = ref('name');
const viewMode = ref('list');
const currentPath = ref('/');



// 对话框状态
const uploadDialogVisible = ref(false);
const editDialogVisible = ref(false);
const editingFile = ref(null);

// 资料统计
const materialStats = ref({
  totalFiles: 0,
  totalSize: 0,
  totalDownloads: 0,
  recentUploads: 0
});

// 面包屑导航
const breadcrumbs = ref([
  { name: '根目录', path: '/' }
]);

// 计算过滤后的资料
const filteredMaterials = computed(() => {
  let filtered = materials.value;

  // 按搜索关键词过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(material =>
      material.fileUrl.toLowerCase().includes(query) ||
      (material.remark && material.remark.toLowerCase().includes(query))
    );
  }

  // 排序
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.fileUrl.localeCompare(b.fileUrl);
      case 'date':
        return new Date(b.createTime) - new Date(a.createTime);
      case 'size':
        return b.fileSize - a.fileSize;
      case 'type':
        return a.fileType.localeCompare(b.fileType);
      default:
        return 0;
    }
  });

  return filtered;
});

// 加载资料列表
const loadMaterials = async () => {
  loading.value = true;
  try {
    const params = {
      courseId: props.courseId
    };

    console.log('正在加载课程资料，参数:', params);
    const response = await getCourseFilesList(params);
    console.log('API响应数据:', response);

    if (response && response.rows) {
      materials.value = response.rows;
      console.log('设置materials数据:', materials.value);

      // 计算统计数据
      materialStats.value = {
        totalFiles: materials.value.length,
        totalSize: materials.value.reduce((sum, m) => sum + (m.fileSize || 0), 0),
        totalDownloads: materials.value.reduce((sum, m) => sum + (m.downloadCount || 0), 0),
        recentUploads: materials.value.filter(m => {
          const createTime = new Date(m.createTime);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createTime >= weekAgo;
        }).length
      };
      console.log('统计数据:', materialStats.value);
    } else {
      console.log('API响应中没有rows数据或response为空:', response);
      materials.value = [];
    }
  } catch (error) {
    console.error('加载课程资料失败:', error);
    materials.value = [];
  } finally {
    loading.value = false;
  }
};

// 显示上传对话框
const showUploadDialog = () => {
  uploadDialogVisible.value = true;
};

// 创建文件夹
const createFolder = () => {
  // TODO: 实现创建文件夹功能
};

// 处理排序变化
const handleSortChange = () => {
  // 排序逻辑已在计算属性中处理
};

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
};

// 导航到文件夹
const navigateToFolder = (path) => {
  currentPath.value = path;
  // TODO: 重新加载该路径下的文件
};

// 处理资料点击
const handleMaterialClick = (material) => {
  // 点击文件时尝试预览，如果不支持预览则下载
  if (canPreview(material.fileName)) {
    handleShare(material);
  } else {
    handleDownload(material);
  }
};

// 处理下载
const handleDownload = async (material) => {
  if (!material.fileUrl) {
    alert('文件地址不存在，无法下载');
    return;
  }

  const fileName = getDisplayFileName(material);

  try {
    // 方法1：尝试使用fetch下载（适用于同域或支持CORS的文件）
    try {
      const response = await fetch(material.fileUrl);
      if (response.ok) {
        const blob = await response.blob();

        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 清理URL对象
        window.URL.revokeObjectURL(url);

        console.log(`下载完成: ${fileName}`);
        return;
      }
    } catch (fetchError) {
      console.log('Fetch下载失败，尝试直接链接下载:', fetchError.message);
    }

    // 方法2：直接使用链接下载（适用于跨域文件）
    const link = document.createElement('a');
    link.href = material.fileUrl;
    link.download = fileName;
    link.target = '_blank';

    // 添加rel属性以提高安全性
    link.rel = 'noopener noreferrer';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`开始下载文件: ${fileName}`);

  } catch (error) {
    console.error('下载文件失败:', error);
    alert(`下载文件失败: ${error.message || '请重试'}`);
  }
};

// 处理编辑
const handleEdit = (material) => {
  editingFile.value = material;
  editDialogVisible.value = true;
};

// 处理删除
const handleDelete = async (material) => {
  if (!confirm(`确定要删除文件 "${getDisplayFileName(material)}" 吗？`)) {
    return;
  }

  try {
    await deleteCourseFile(material.id);

    // 重新加载列表
    await loadMaterials();

    // 发出刷新事件
    emit('refresh');
  } catch (error) {
    const errorMessage = error.message || '删除文件失败，请重试';
    alert(`删除文件失败：${errorMessage}`);
  }
};

// 获取文件名（从URL中提取）
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

// 处理预览（原来的分享功能改为预览）
const handleShare = async (material) => {
  if (!material.fileUrl) {
    console.warn('文件URL不存在:', material);
    return;
  }

  // 检查是否支持office预览
  if (isOfficeFileSupported(material.fileName)) {
    try {
      await openPreview({
        fileUrl: material.fileUrl,
        fileName: material.fileName,
        fileType: material.fileType,
        fileSize: material.fileSize
      });
    } catch (error) {
      console.error('Office预览失败:', error);
      // 如果office预览失败，回退到在新窗口打开
      console.log('回退到新窗口打开文件:', material.fileUrl);
      window.open(material.fileUrl, '_blank');
    }
  } else {
    // 其他文件类型在新窗口打开
    console.log('直接在新窗口打开文件:', material.fileUrl);
    window.open(material.fileUrl, '_blank');
  }
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

// 处理上传成功
const handleUploadSuccess = () => {
  loadMaterials();
  emit('refresh');
};

// 处理编辑保存
const handleEditSave = () => {
  loadMaterials();
  emit('refresh');
};

// 监听课程ID变化
watch(() => props.courseId, (newCourseId) => {
  if (newCourseId) {
    loadMaterials();
  }
}, { immediate: true });

// 组件挂载时加载数据
onMounted(() => {
  if (props.courseId) {
    loadMaterials();
  }
});
</script>

<style scoped>
/* 课程资料管理器样式 */
.materials-manager {
  background-color: var(--background-color, #ffffff);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  background-color: var(--background-color, #ffffff);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color, #1f2937);
  margin: 0;
}

.section-actions {
  display: flex;
  gap: 0.75rem;
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

.btn-primary {
  background-color: var(--primary-color, #6366f1);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-color-dark, #4f46e5);
}

.btn-secondary {
  background-color: var(--background-color-secondary, #f3f4f6);
  color: var(--text-color, #374151);
  border-color: var(--border-color, #d1d5db);
}

.btn-secondary:hover {
  background-color: var(--background-color-tertiary, #e5e7eb);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-color-secondary, #6b7280);
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--border-color, #e5e7eb);
  border-top: 2px solid var(--primary-color, #6366f1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 图标样式 */
.btn-icon, .upload-icon, .folder-icon {
  width: 1rem;
  height: 1rem;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.upload-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.folder-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23f59e0b'%3E%3Cpath d='M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z' /%3E%3C/svg%3E");
}
</style>
