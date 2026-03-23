import { ref, computed } from 'vue';
import { 
  isPreviewSupported, 
  getFileType, 
  getFileIcon,
  formatFileSize,
  generatePreviewConfig
} from '@/utils/fileViewerUtils';

/**
 * 现代文件预览管理 Composable
 * 基于新的 ModernFileViewer 组件，简化预览逻辑
 */
export function useOfficePreview() {
  // 响应式状态
  const previewVisible = ref(false);
  const currentFile = ref(null);
  const loading = ref(false);
  const error = ref('');

  // 计算属性
  const isCurrentFileSupported = computed(() => {
    if (!currentFile.value) return false;
    return isPreviewSupported(currentFile.value.fileName);
  });

  const currentFileTypeInfo = computed(() => {
    if (!currentFile.value) return null;
    const fileType = getFileType(currentFile.value.fileName);
    const icon = getFileIcon(currentFile.value.fileName);
    return {
      type: fileType,
      name: fileType,
      icon: icon
    };
  });

  const canPreview = computed(() => {
    if (!currentFile.value) return false;
    return isPreviewSupported(currentFile.value.fileName);
  });

  // 打开预览
  const openPreview = async (fileInfo) => {
    try {
      // 验证文件信息
      if (!fileInfo || !fileInfo.fileUrl || !fileInfo.fileName) {
        throw new Error('文件信息不完整');
      }

      // 检查文件是否支持预览
      if (!isPreviewSupported(fileInfo.fileName)) {
        console.log('文件不支持预览，在新窗口打开:', fileInfo.fileUrl);
        window.open(fileInfo.fileUrl, '_blank');
        return;
      }

      loading.value = true;
      error.value = '';

      // 设置当前文件
      currentFile.value = {
        fileUrl: fileInfo.fileUrl,
        fileName: fileInfo.fileName,
        fileType: fileInfo.fileType || getFileType(fileInfo.fileName),
        fileSize: fileInfo.fileSize || 0,
        ...fileInfo
      };

      // 显示预览对话框
      previewVisible.value = true;

    } catch (err) {
      console.error('打开预览失败:', err);
      error.value = err.message || '预览失败';

      // 自动回退：在新窗口打开文件
      if (fileInfo.fileUrl) {
        console.log('预览失败，自动在新窗口打开文件:', fileInfo.fileUrl);
        window.open(fileInfo.fileUrl, '_blank');
      }
      
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 关闭预览
  const closePreview = () => {
    previewVisible.value = false;
    currentFile.value = null;
    error.value = '';
    loading.value = false;
  };

  // 检查文件是否支持预览
  const checkFileSupport = (fileName, fileType = '') => {
    return isPreviewSupported(fileName);
  };

  // 获取文件类型信息
  const getFileInfo = (fileName, fileType = '') => {
    const type = getFileType(fileName);
    const icon = getFileIcon(fileName);
    return {
      type,
      name: type,
      icon
    };
  };

  // 批量检查文件支持情况
  const checkMultipleFiles = (files) => {
    return files.map(file => ({
      ...file,
      isSupported: isPreviewSupported(file.fileName || file.name),
      typeInfo: getFileInfo(file.fileName || file.name)
    }));
  };

  // 处理预览错误
  const handleError = (err, context = '') => {
    const errorMessage = err.message || '未知错误';
    error.value = `${context}${context ? ': ' : ''}${errorMessage}`;
    return error.value;
  };

  // 重置状态
  const reset = () => {
    previewVisible.value = false;
    currentFile.value = null;
    loading.value = false;
    error.value = '';
  };

  return {
    // 状态
    previewVisible,
    currentFile,
    loading,
    error,

    // 计算属性
    isCurrentFileSupported,
    currentFileTypeInfo,
    canPreview,

    // 方法
    openPreview,
    closePreview,
    checkFileSupport,
    getFileInfo,
    checkMultipleFiles,
    handleError,
    reset
  };
}

/**
 * 文件列表预览增强 Composable
 * 为文件列表添加预览功能
 */
export function useFileListPreview(files) {
  const { 
    openPreview, 
    closePreview, 
    previewVisible, 
    currentFile, 
    loading, 
    error,
    checkFileSupport,
    getFileInfo
  } = useOfficePreview();

  // 增强的文件列表
  const enhancedFiles = computed(() => {
    if (!files.value || !Array.isArray(files.value)) return [];
    
    return files.value.map(file => ({
      ...file,
      canPreview: checkFileSupport(file.fileName || file.name),
      typeInfo: getFileInfo(file.fileName || file.name)
    }));
  });

  // 支持预览的文件数量
  const previewableCount = computed(() => {
    return enhancedFiles.value.filter(file => file.canPreview).length;
  });

  // 预览文件
  const previewFile = async (file) => {
    const fileInfo = {
      fileUrl: file.fileUrl || file.url,
      fileName: file.fileName || file.name,
      fileType: file.fileType || file.type,
      fileSize: file.fileSize || file.size,
      ...file
    };

    await openPreview(fileInfo);
  };

  return {
    // 状态
    previewVisible,
    currentFile,
    loading,
    error,

    // 计算属性
    enhancedFiles,
    previewableCount,

    // 方法
    previewFile,
    closePreview
  };
}

/**
 * 预览快捷操作 Composable
 * 提供快捷的预览操作方法
 */
export function useQuickPreview() {
  const { openPreview, closePreview, previewVisible, currentFile } = useOfficePreview();

  // 快速预览（最少参数）
  const quickPreview = async (fileUrl, fileName) => {
    await openPreview({
      fileUrl,
      fileName
    });
  };

  // 从文件对象预览
  const previewFromFile = async (file) => {
    const fileInfo = {
      fileUrl: file.url || file.fileUrl,
      fileName: file.name || file.fileName,
      fileType: file.type || file.fileType,
      fileSize: file.size || file.fileSize
    };

    await openPreview(fileInfo);
  };

  // 从API响应预览
  const previewFromApiResponse = async (response) => {
    const fileInfo = {
      fileUrl: response.data?.fileUrl || response.fileUrl,
      fileName: response.data?.fileName || response.fileName,
      fileType: response.data?.fileType || response.fileType,
      fileSize: response.data?.fileSize || response.fileSize
    };

    await openPreview(fileInfo);
  };

  return {
    previewVisible,
    currentFile,
    quickPreview,
    previewFromFile,
    previewFromApiResponse,
    closePreview
  };
}

// 为了向后兼容，保留这个函数
export function isOfficeFileSupported(fileName, fileType = '') {
  return isPreviewSupported(fileName);
}