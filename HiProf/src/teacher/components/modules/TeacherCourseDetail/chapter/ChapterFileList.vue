<template>
  <!-- 当有文件或正在加载时，显示完整的文件管理界面 -->
  <div v-if="loading || files.length > 0" class="chapter-file-list">
    <!-- 文件列表标题 -->
    <div class="file-list-header">
      <h4 class="file-list-title">
        {{ nodeName }} 的文件
        <span v-if="nodeId" class="node-id">(ID: {{ nodeId }})</span>
        <span v-else class="node-id">(根节点)</span>
        <span class="file-count">({{ files.length }})</span>
      </h4>
      
      <div class="file-actions">
        <input
          ref="fileInput"
          type="file"
          @change="handleFileSelect"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif,.mp4,.avi,.mov"
          style="display: none;"
        />
        <button
          class="btn btn-sm btn-primary upload-btn"
          @click="triggerFileSelect"
          :disabled="loading"
        >
          📁 上传文件
        </button>
        <button
          class="btn btn-sm btn-secondary refresh-btn"
          @click="refreshFiles"
          :disabled="loading"
        >
          🔄 刷新
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>正在加载文件列表...</span>
    </div>

    <!-- 文件列表 -->
    <div v-else class="file-list">
      <div 
        v-for="file in files" 
        :key="file.id" 
        class="file-item"
      >
        <div class="file-icon">
          {{ getFileIcon(file.fileName) }}
        </div>
        
        <div class="file-info">
          <div class="file-name" :title="file.fileName">
            {{ getDisplayFileName(file.fileName) }}
          </div>
          <div class="file-meta">
            <span class="file-size">{{ formatFileSize(file.fileSize) }}</span>
            <span class="file-time">{{ formatTime(file.createTime) }}</span>
          </div>
          <div v-if="file.remark" class="file-remark">
            {{ file.remark }}
          </div>
        </div>

        <div class="file-actions">
          <button
            class="btn btn-xs btn-outline preview-btn"
            @click="previewFile(file)"
            title="预览文件"
            v-if="canPreview(file.fileName)"
          >
            👁️
          </button>
          <button
            class="btn btn-xs btn-danger delete-btn"
            @click="deleteFile(file)"
            title="删除文件"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 文件上传对话框 -->
    <ChapterFileUploadDialog
      v-model:visible="uploadDialogVisible"
      :course-id="courseId"
      :node-name="nodeName"
      :node-id="actualNodeId"
      :pre-selected-files="selectedFiles"
      @upload-success="handleUploadSuccess"
      @upload-error="handleUploadError"
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

  <!-- 当没有文件时，只显示简单的上传区域 -->
  <div v-else class="simple-upload-area">
    <input
      ref="fileInput"
      type="file"
      @change="handleFileSelect"
      multiple
      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif,.mp4,.avi,.mov"
      style="display: none;"
    />
    <button
      class="btn btn-sm btn-primary upload-btn"
      @click="triggerFileSelect"
      :disabled="loading"
    >
      📁 为 {{ nodeName }} 上传文件
    </button>

    <!-- 文件上传对话框 -->
    <ChapterFileUploadDialog
      v-model:visible="uploadDialogVisible"
      :course-id="courseId"
      :node-name="nodeName"
      :node-id="nodeId"
      :pre-selected-files="selectedFiles"
      @upload-success="handleUploadSuccess"
      @upload-error="handleUploadError"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useChapterFileUpload } from '@/composables/useChapterFileUpload';
import { parseChapterFileName } from '@/utils/chapterFileNaming';
import { deleteCourseFile } from '@/api/files';
import { useOfficePreview } from '@/composables/useOfficePreview';
import { isPreviewSupported as isOfficeFileSupported } from '@/utils/fileViewerUtils';
import { getChapterNodes } from '@/api/node';
import FilePreviewDialog from '@/ui/common/office-preview/FilePreviewDialog.vue';
import ChapterFileUploadDialog from './ChapterFileUploadDialog.vue';
import '@/teacher/styles/chapter-file-list.css';

// 定义props
const props = defineProps({
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
    default: null
  },
  chapterData: {
    type: Object,
    default: null
  },
  autoLoad: {
    type: Boolean,
    default: true
  }
});

// 定义emits
const emit = defineEmits(['fileChange', 'uploadSuccess', 'uploadError']);

// 使用章节文件上传功能
const {
  isLoading: loading,
  courseFiles,
  loadCourseFiles,
  getChapterFiles,
  getNodeFiles
} = useChapterFileUpload();

// 使用office预览功能
const {
  previewVisible,
  currentFile,
  openPreview,
  closePreview
} = useOfficePreview();

// 响应式数据
const uploadDialogVisible = ref(false);
const fileInput = ref(null);
const selectedFiles = ref([]);
const actualNodeId = ref(props.nodeId);

// 计算属性 - 当前节点的文件列表
const files = computed(() => {
  if (actualNodeId.value) {
    // 有实际nodeId，获取节点文件
    return getNodeFiles(props.nodeName, actualNodeId.value);
  } else {
    // 没有nodeId，返回空数组
    // 注意：章节级别文件现在应该使用根节点ID，而不是null
    // 如果actualNodeId为null，说明还没有获取到根节点ID，或者确实没有根节点
    return [];
  }
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
      year: 'numeric',
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
    pdf: '📕',
    doc: '📘',
    docx: '📘',
    ppt: '📙',
    pptx: '📙',
    xls: '📗',
    xlsx: '📗',
    txt: '📄',
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🖼️',
    mp4: '🎬',
    avi: '🎬',
    mov: '🎬',
    mp3: '🎵',
    wav: '🎵'
  };
  
  return iconMap[ext] || '📄';
};

// 获取显示文件名（显示原始文件名）
const getDisplayFileName = (fileName) => {
  if (!fileName) return '';
  
  const parsed = parseChapterFileName(fileName);
  if (parsed) {
    return parsed.originalFileName;
  }
  
  return fileName;
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

// 触发文件选择
const triggerFileSelect = () => {
  fileInput.value?.click();
};

// 处理文件选择
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  // 保存选择的文件
  selectedFiles.value = files;

  // 打开上传对话框
  uploadDialogVisible.value = true;

  // 清空input值，允许重复选择同一文件
  event.target.value = '';
};

// 打开上传对话框
const openUploadDialog = () => {
  uploadDialogVisible.value = true;
};

// 刷新文件列表
const refreshFiles = async () => {
  try {
    await loadCourseFiles(props.courseId);
    emit('fileChange');
  } catch (error) {
    console.error('刷新文件列表失败:', error);
  }
};

// 下载文件
const downloadFile = (file) => {
  if (file.fileUrl) {
    window.open(file.fileUrl, '_blank');
  } else {
    console.warn('文件URL不存在:', file);
  }
};

// 预览文件
const previewFile = async (file) => {
  if (!file.fileUrl) {
    console.warn('文件URL不存在:', file);
    return;
  }

  // 检查是否支持office预览
  if (isOfficeFileSupported(file.fileName)) {
    try {
      await openPreview({
        fileUrl: file.fileUrl,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize
      });
    } catch (error) {
      console.error('Office预览失败:', error);
      // 如果office预览失败，回退到在新窗口打开
      window.open(file.fileUrl, '_blank');
    }
  } else {
    // 其他文件类型在新窗口打开
    window.open(file.fileUrl, '_blank');
  }
};

// 删除文件
const deleteFile = async (file) => {
  if (!confirm(`确定要删除文件 "${getDisplayFileName(file.fileName)}" 吗？`)) {
    return;
  }

  try {
    const result = await deleteCourseFile(file.id);
    
    if (result.code === 200) {
      // 刷新文件列表
      await refreshFiles();
      console.log('文件删除成功');
    } else {
      throw new Error(result.message || '删除失败');
    }
  } catch (error) {
    console.error('删除文件失败:', error);
    alert('删除文件失败: ' + error.message);
  }
};

// 处理上传成功
const handleUploadSuccess = (result) => {
  console.log('文件上传成功:', result);

  // 清理选择的文件
  selectedFiles.value = [];

  // 刷新文件列表
  refreshFiles();

  // 向上传递事件
  emit('uploadSuccess', result);
};

// 处理上传错误
const handleUploadError = (error) => {
  console.error('文件上传失败:', error);

  // 向上传递事件
  emit('uploadError', error);
};

// 获取章节的图谱ID
const getChapterGraphId = (chapter) => {
  if (!chapter) return null;
  return chapter._zstpData?.id ||
         chapter.graphId ||
         chapter.id ||
         props.courseId;
};

// 获取章节的节点ID（修复：直接使用章节ID，不查找parentId为null的节点）
const getChapterRootNodeIdSync = (chapter) => {
  if (!chapter) return null;

  // 优先直接使用章节本身的ID作为节点ID（这才是正确的逻辑）
  if (chapter.id) {
    console.log('使用章节本身ID作为节点ID:', chapter.id);
    return chapter.id;
  }

  // 如果章节没有ID，尝试从子节点中查找根节点（备选方案）
  if (chapter.nodes && chapter.nodes.length > 0) {
    const rootNode = chapter.nodes.find(node => node.parentId === null);
    if (rootNode && rootNode.id) {
      console.log('使用根节点ID作为备选:', rootNode.id);
      return rootNode.id;
    }
  }

  // 如果章节有sections数据，也查找根节点（备选方案）
  if (chapter.sections && chapter.sections.length > 0) {
    const rootNode = chapter.sections.find(node => node.parentId === null);
    if (rootNode && rootNode.id) {
      console.log('使用sections根节点ID作为备选:', rootNode.id);
      return rootNode.id;
    }
  }

  console.warn('无法获取有效的章节节点ID');
  return null;
};

// 异步获取根节点ID
const fetchRootNodeId = async () => {
  console.log('fetchRootNodeId 开始执行');
  console.log('props.nodeId:', props.nodeId);
  console.log('props.chapterData:', props.chapterData);
  console.log('props.courseId:', props.courseId);

  if (props.nodeId) {
    // 如果已经有nodeId，直接使用
    console.log('使用传入的nodeId:', props.nodeId);
    actualNodeId.value = props.nodeId;
    return;
  }

  // 优先尝试同步获取节点ID
  if (props.chapterData) {
    const syncNodeId = getChapterRootNodeIdSync(props.chapterData);
    if (syncNodeId) {
      console.log('同步获取到节点ID:', syncNodeId);
      actualNodeId.value = syncNodeId;
      return;
    }
  }

  if (!props.chapterData) {
    // 如果没有章节数据，尝试使用课程ID作为图谱ID
    console.warn('没有章节数据，尝试使用课程ID获取根节点');
    if (props.courseId) {
      try {
        const response = await getChapterNodes(null, props.courseId);
        if (response && response.rows) {
          console.log('通过课程ID获取到节点数据:', response.rows);
          const rootNode = response.rows.find(node => node.parentId === null);
          if (rootNode && rootNode.id) {
            console.log('通过课程ID找到根节点:', rootNode);
            actualNodeId.value = rootNode.id;
            return;
          }
        }
      } catch (error) {
        console.error('通过课程ID获取根节点失败:', error);
      }
    }

    console.warn('无法获取根节点ID，使用课程ID作为节点ID:', props.courseId);
    actualNodeId.value = props.courseId || 'fallback-node-id';
    return;
  }

  try {
    // 首先尝试直接使用章节ID作为节点ID（最简单的方案）
    if (props.chapterData.id) {
      console.log('直接使用章节ID作为节点ID:', props.chapterData.id);
      actualNodeId.value = props.chapterData.id;
      return;
    }

    // 如果章节已经加载了子节点，直接查找根节点
    if (props.chapterData.nodes && props.chapterData.nodes.length > 0) {
      console.log('从chapterData.nodes查找根节点:', props.chapterData.nodes);
      const rootNode = props.chapterData.nodes.find(node => node.parentId === null);
      if (rootNode && rootNode.id) {
        console.log('从nodes找到根节点:', rootNode);
        actualNodeId.value = rootNode.id;
        return;
      }
    }

    // 检查章节的sections数据
    if (props.chapterData.sections && props.chapterData.sections.length > 0) {
      console.log('从chapterData.sections查找根节点:', props.chapterData.sections);
      const rootNode = props.chapterData.sections.find(node => node.parentId === null);
      if (rootNode && rootNode.id) {
        console.log('从sections找到根节点:', rootNode);
        actualNodeId.value = rootNode.id;
        return;
      }
    }

    // 如果子节点还没有加载，先加载节点数据
    const graphId = getChapterGraphId(props.chapterData);
    console.log('获取到图谱ID:', graphId);
    if (graphId) {
      console.log('正在通过API获取根节点ID，图谱ID:', graphId);

      // 尝试两种方式获取节点数据
      // 方式1：获取所有节点（传null作为parentId）
      let response = await getChapterNodes(null, graphId);
      console.log('方式1 - 获取所有节点，响应:', response);

      if (!response || !response.rows || response.rows.length === 0) {
        // 方式2：使用章节ID作为parentId获取子节点
        console.log('方式1失败，尝试方式2 - 使用章节ID作为parentId:', props.chapterData.id);
        response = await getChapterNodes(props.chapterData.id, graphId);
        console.log('方式2 - 使用章节ID，响应:', response);
      }

      if (response && response.rows && response.rows.length > 0) {
        console.log('API返回的节点数据:', response.rows);

        // 查找根节点（parentId为null的节点）
        let rootNode = response.rows.find(node => node.parentId === null);

        if (!rootNode) {
          // 如果没有找到parentId为null的节点，尝试查找parentId等于章节ID的节点
          console.log('没有找到parentId为null的节点，查找parentId等于章节ID的节点');
          rootNode = response.rows.find(node =>
            node.parentId === props.chapterData.id ||
            String(node.parentId) === String(props.chapterData.id)
          );
        }

        if (!rootNode && response.rows.length > 0) {
          // 如果还是没有找到，使用第一个节点作为根节点
          console.log('仍然没有找到合适的根节点，使用第一个节点');
          rootNode = response.rows[0];
        }

        if (rootNode && rootNode.id) {
          console.log('API查找到根节点:', rootNode);
          actualNodeId.value = rootNode.id;
          return;
        } else {
          console.warn('API返回的数据中没有找到有效的根节点');
        }
      } else {
        console.warn('API没有返回有效的节点数据');
      }
    } else {
      console.warn('无法获取图谱ID');
    }

    // 如果没有找到根节点，使用章节ID作为节点ID
    console.warn('所有方法都无法找到根节点，使用章节ID作为节点ID:', props.chapterData.id);
    actualNodeId.value = props.chapterData.id || props.courseId;
  } catch (error) {
    console.error('获取根节点ID失败:', error);
    // 即使出错，也使用章节ID作为备选
    if (props.chapterData && props.chapterData.id) {
      console.warn('使用章节ID作为备选节点ID:', props.chapterData.id);
      actualNodeId.value = props.chapterData.id;
    } else if (props.courseId) {
      console.warn('使用课程ID作为备选节点ID:', props.courseId);
      actualNodeId.value = props.courseId;
    } else {
      console.error('无法获取任何有效的节点ID，这不应该发生！使用课程ID作为fallback');
      // nodeId不应该为null，如果到这里说明有bug，使用课程ID作为fallback
      actualNodeId.value = props.courseId || 'unknown';
    }
  }
};

// 监听课程ID变化，重新加载文件
watch(() => props.courseId, (newCourseId) => {
  if (newCourseId && props.autoLoad) {
    loadCourseFiles(newCourseId);
  }
}, { immediate: true });

// 监听章节数据变化，重新获取根节点ID
watch(() => props.chapterData, () => {
  fetchRootNodeId();
}, { immediate: true, deep: true });

// 监听nodeId变化 - 只有当nodeId不为null时才直接使用
watch(() => props.nodeId, (newNodeId) => {
  console.log('props.nodeId 变化:', newNodeId);
  if (newNodeId !== null) {
    console.log('直接使用传入的nodeId:', newNodeId);
    actualNodeId.value = newNodeId;
  } else {
    // 如果nodeId为null，尝试获取根节点ID
    console.log('nodeId为null，尝试获取根节点ID');
    fetchRootNodeId();
  }
}, { immediate: true });

// 监听actualNodeId变化，用于调试
watch(() => actualNodeId.value, (newValue, oldValue) => {
  console.log('actualNodeId 变化:', { from: oldValue, to: newValue });
}, { immediate: true });

// 监听对话框关闭，清理选择的文件
watch(() => uploadDialogVisible.value, (isVisible) => {
  if (!isVisible) {
    selectedFiles.value = [];
  }
});

// 组件挂载时加载文件
onMounted(async () => {
  // 先获取实际的节点ID
  await fetchRootNodeId();

  // 然后加载文件
  if (props.courseId && props.autoLoad) {
    loadCourseFiles(props.courseId);
  }
});
</script>
