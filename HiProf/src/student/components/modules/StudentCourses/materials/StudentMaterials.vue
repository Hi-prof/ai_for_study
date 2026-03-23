<template>
  <div class="student-materials">
    <!-- 页面标题和统计 -->
    <div class="materials-header">
      <h2 class="materials-title">课程资料</h2>
      <div class="materials-stats">
        <span class="stat-item">
          <i class="stat-icon files-icon"></i>
          共 {{ totalCount }} 个文件
        </span>
        <span class="stat-item">
          <i class="stat-icon size-icon"></i>
          总大小 {{ formatFileSize(totalSize) }}
        </span>
      </div>
    </div>

    <!-- 搜索和筛选工具栏 -->
    <div class="materials-toolbar">
      <div class="search-section">
        <div class="search-input-wrapper">
          <i class="search-icon"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索资料名称..."
            class="search-input"
            @input="handleSearch"
          />
          <button v-if="searchQuery" class="clear-search" @click="clearSearch">
            <i class="clear-icon"></i>
          </button>
        </div>
      </div>
      
      <div class="filter-section">
        <select v-model="selectedFileType" class="file-type-filter" @change="handleFilterChange">
          <option value="">全部类型</option>
          <option value="course">课程文件</option>
          <option value="shared">共享资料</option>
          <option value="video">视频资料</option>
        </select>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载资料列表...</p>
    </div>

    <!-- 资料列表 -->
    <div v-else-if="filteredMaterials.length > 0" class="materials-list">
      <div
        v-for="material in filteredMaterials"
        :key="material.id"
        class="material-item"
        @click="handleMaterialClick(material)"
      >
        <div class="material-icon">
          <i :class="getFileIcon(material.fileType, material.fileName)"></i>
        </div>
        
        <div class="material-info">
          <h3 class="material-name">{{ material.fileName || material.displayName }}</h3>
          <div class="material-meta">
            <span class="material-size">{{ formatFileSize(material.fileSize) }}</span>
            <span class="material-date">{{ formatDate(material.createTime) }}</span>
            <span v-if="material.tags" class="material-tags">
              <span v-for="tag in material.tags.split(',')" :key="tag" class="tag">{{ tag }}</span>
            </span>
          </div>
          <p v-if="material.remark" class="material-description">{{ material.remark }}</p>
        </div>

        <div class="material-actions">
          <button class="action-btn download-btn" @click.stop="handleDownload(material)" title="下载">
            <i class="download-icon"></i>
          </button>
          <button v-if="canPreview(material)" class="action-btn preview-btn" @click.stop="handlePreview(material)" title="预览">
            <i class="preview-icon"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📁</div>
      <h3 class="empty-title">{{ searchQuery ? '未找到相关资料' : '暂无课程资料' }}</h3>
      <p class="empty-description">
        {{ searchQuery ? '请尝试其他关键词搜索' : '老师还没有分享任何资料' }}
      </p>
      <button v-if="searchQuery" class="clear-search-btn" @click="clearSearch">
        清除搜索条件
      </button>
    </div>

    <!-- 文件预览对话框 -->
    <div v-if="previewDialogVisible" class="preview-dialog-overlay" @click="closePreview">
      <div class="preview-dialog" @click.stop>
        <div class="preview-header">
          <h3 class="preview-title">{{ previewFile?.fileName || previewFile?.displayName }}</h3>
          <button class="close-preview" @click="closePreview">×</button>
        </div>
        <div class="preview-content">
          <iframe v-if="previewFile" :src="previewFile.fileUrl" class="preview-iframe"></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { getCourseFilesList } from '@/api/files';
import '@/student/styles/student-materials.css';

// 定义props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
});

// 响应式数据
const loading = ref(false);
const materials = ref([]); // 确保初始值是空数组
const searchQuery = ref('');
const selectedFileType = ref('');
const previewDialogVisible = ref(false);
const previewFile = ref(null);

// 计算属性
const filteredMaterials = computed(() => {
  // 确保 materials.value 是数组
  if (!Array.isArray(materials.value)) {
    return [];
  }

  let filtered = materials.value;

  // 按文件类型筛选
  if (selectedFileType.value) {
    filtered = filtered.filter(material => material.fileType === selectedFileType.value);
  }

  // 按搜索关键词筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(material => {
      const name = (material.fileName || material.displayName || '').toLowerCase();
      const remark = (material.remark || '').toLowerCase();
      const tags = (material.tags || '').toLowerCase();
      return name.includes(query) || remark.includes(query) || tags.includes(query);
    });
  }

  return filtered;
});

const totalCount = computed(() => {
  return Array.isArray(materials.value) ? materials.value.length : 0;
});

const totalSize = computed(() => {
  if (!Array.isArray(materials.value)) return 0;
  return materials.value.reduce((total, material) => total + (material.fileSize || 0), 0);
});

// 加载资料列表
const loadMaterials = async () => {
  loading.value = true;
  try {
    const params = {
      courseId: props.courseId
    };

    console.log('正在加载学生资料，参数:', params);
    const response = await getCourseFilesList(params);
    console.log('学生资料API响应:', response);
    console.log('响应数据类型:', typeof response?.data);
    console.log('响应数据内容:', response?.data);

    if (response && response.code === 200) {
      // 根据接口文档，响应格式为 { total, rows, code, msg }
      if (response.rows && Array.isArray(response.rows)) {
        materials.value = response.rows;
        console.log('学生资料加载成功，数量:', materials.value.length);
      } else if (response.data && Array.isArray(response.data.rows)) {
        // 兼容嵌套在data中的情况
        materials.value = response.data.rows;
        console.log('学生资料加载成功，数量:', materials.value.length);
      } else {
        console.warn('API返回的数据格式异常:', response);
        materials.value = [];
      }
    } else {
      console.warn('学生资料响应异常:', response);
      materials.value = [];
    }
  } catch (error) {
    console.error('加载学生资料失败:', error);
    // 如果API失败，可以提供一些测试数据用于开发调试
    if (process.env.NODE_ENV === 'development') {
      console.log('开发模式：使用测试数据');
      materials.value = [
        {
          id: 1,
          fileName: '课程大纲.pdf',
          fileSize: 1024000,
          fileType: 'application/pdf',
          createTime: '2024-01-15T10:30:00Z',
          remark: '本课程的详细教学大纲',
          courseId: props.courseId,
          fileUrl: '#'
        },
        {
          id: 2,
          fileName: '参考资料.docx',
          fileSize: 512000,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          createTime: '2024-01-10T14:20:00Z',
          remark: '课程参考资料文档',
          courseId: props.courseId,
          fileUrl: '#'
        }
      ];
    } else {
      materials.value = [];
    }
  } finally {
    loading.value = false;
  }
};

// 搜索处理
const handleSearch = () => {
  console.log('搜索资料:', searchQuery.value);
};

// 清除搜索
const clearSearch = () => {
  searchQuery.value = '';
};

// 筛选处理
const handleFilterChange = () => {
  console.log('筛选文件类型:', selectedFileType.value);
};

// 资料点击处理
const handleMaterialClick = (material) => {
  console.log('点击资料:', material);
  // 默认行为：下载文件
  handleDownload(material);
};

// 下载文件
const handleDownload = (material) => {
  console.log('下载文件:', material);
  if (material.fileUrl) {
    // 创建下载链接
    const link = document.createElement('a');
    link.href = material.fileUrl;
    link.download = material.fileName || material.displayName || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// 预览文件
const handlePreview = (material) => {
  console.log('预览文件:', material);
  previewFile.value = material;
  previewDialogVisible.value = true;
};

// 关闭预览
const closePreview = () => {
  previewDialogVisible.value = false;
  previewFile.value = null;
};

// 判断是否可以预览
const canPreview = (material) => {
  if (!material.fileUrl) return false;
  const fileName = (material.fileName || material.displayName || '').toLowerCase();
  return fileName.endsWith('.pdf') || 
         fileName.endsWith('.jpg') || 
         fileName.endsWith('.jpeg') || 
         fileName.endsWith('.png') || 
         fileName.endsWith('.gif');
};

// 获取文件图标
const getFileIcon = (fileType, fileName) => {
  const name = (fileName || '').toLowerCase();
  
  if (name.endsWith('.pdf')) return 'file-pdf-icon';
  if (name.endsWith('.doc') || name.endsWith('.docx')) return 'file-word-icon';
  if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'file-excel-icon';
  if (name.endsWith('.ppt') || name.endsWith('.pptx')) return 'file-ppt-icon';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.gif')) return 'file-image-icon';
  if (name.endsWith('.mp4') || name.endsWith('.avi') || name.endsWith('.mov')) return 'file-video-icon';
  if (name.endsWith('.mp3') || name.endsWith('.wav')) return 'file-audio-icon';
  if (name.endsWith('.zip') || name.endsWith('.rar')) return 'file-archive-icon';
  
  return 'file-default-icon';
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;
  
  return date.toLocaleDateString('zh-CN');
};

// 监听课程ID变化
watch(() => props.courseId, (newCourseId) => {
  if (newCourseId) {
    loadMaterials();
  }
}, { immediate: true });

// 组件挂载时加载数据
onMounted(() => {
  console.log('学生资料组件已挂载，课程ID:', props.courseId);
});
</script>
