import { ref } from 'vue';
import { uploadAndCreateCourseFile } from '@/api/files';

/**
 * 文件上传管理 Composable
 * 处理章节和节点的文件选择、上传和进度管理
 */
export function useFileUpload() {
  // 响应式状态
  const uploading = ref(false);
  const uploadProgress = ref(0);
  const uploadProgressText = ref('');

  /**
   * 格式化文件大小
   * @param {number} bytes - 文件大小（字节）
   * @returns {string} 格式化后的文件大小
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * 生成创建时间
   * @returns {string} 格式化的创建时间
   */
  const generateCreateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // ========== 章节文件管理 ==========

  /**
   * 触发章节文件选择
   * @param {Object} chapter - 章节对象
   */
  const triggerFileSelect = (chapter) => {
    const fileInput = document.getElementById(`fileInput-${chapter.id || chapter.tempId}`);
    if (fileInput) {
      fileInput.click();
    }
  };

  /**
   * 处理章节文件选择
   * @param {Event} event - 文件选择事件
   * @param {Object} chapter - 章节对象
   */
  const handleFileSelect = (event, chapter) => {
    const files = Array.from(event.target.files);
    if (!chapter.selectedFiles) {
      chapter.selectedFiles = [];
    }
    chapter.selectedFiles.push(...files);
    event.target.value = '';
  };

  /**
   * 移除章节文件
   * @param {Object} chapter - 章节对象
   * @param {number} fileIndex - 文件索引
   */
  const removeFile = (chapter, fileIndex) => {
    chapter.selectedFiles.splice(fileIndex, 1);
  };

  /**
   * 上传章节文件
   * @param {Object} chapter - 章节对象
   * @param {string|number} courseId - 课程ID
   * @param {string} createTime - 创建时间
   * @returns {Promise<Array>} 上传成功的文件列表
   */
  const uploadChapterFiles = async (chapter, courseId, createTime) => {
    if (!chapter.selectedFiles || chapter.selectedFiles.length === 0) {
      return [];
    }

    const uploadedFiles = [];
    for (let i = 0; i < chapter.selectedFiles.length; i++) {
      const file = chapter.selectedFiles[i];
      
      uploadProgressText.value = `上传章节 "${chapter.title}" 的文件: ${file.name}`;
      
      const result = await uploadAndCreateCourseFile(
        file,
        courseId,
        `章节文件 - ${chapter.title}`,
        (progress) => {
          const totalProgress = (i + progress / 100) / chapter.selectedFiles.length;
          uploadProgress.value = Math.round(totalProgress * 100);
        }
      );

      if (result.code === 200) {
        uploadedFiles.push({
          ...result.data,
          fileName: file.name,
          fileSize: file.size,
          createTime: createTime
        });
      }
    }
    
    return uploadedFiles;
  };

  // ========== 节点文件管理 ==========

  /**
   * 触发节点文件选择
   * @param {Object} node - 节点对象
   */
  const triggerNodeFileSelect = (node) => {
    const fileInput = document.getElementById(`nodeFileInput-${node.id || node.tempId}`);
    if (fileInput) {
      fileInput.click();
    }
  };

  /**
   * 处理节点文件选择
   * @param {Event} event - 文件选择事件
   * @param {Object} node - 节点对象
   */
  const handleNodeFileSelect = (event, node) => {
    const files = Array.from(event.target.files);
    if (!node.selectedFiles) {
      node.selectedFiles = [];
    }
    node.selectedFiles.push(...files);
    event.target.value = '';
  };

  /**
   * 移除节点文件
   * @param {Object} node - 节点对象
   * @param {number} fileIndex - 文件索引
   */
  const removeNodeFile = (node, fileIndex) => {
    node.selectedFiles.splice(fileIndex, 1);
  };

  /**
   * 上传节点文件
   * @param {Object} node - 节点对象
   * @param {Object} chapter - 章节对象
   * @param {string|number} courseId - 课程ID
   * @param {string} createTime - 创建时间
   * @returns {Promise<Array>} 上传成功的文件列表
   */
  const uploadNodeFiles = async (node, chapter, courseId, createTime) => {
    if (!node.selectedFiles || node.selectedFiles.length === 0) {
      return [];
    }

    const uploadedFiles = [];
    for (const file of node.selectedFiles) {
      uploadProgressText.value = `上传节点 "${node.name}" 的文件: ${file.name}`;
      
      const result = await uploadAndCreateCourseFile(
        file,
        courseId,
        `节点文件 - ${node.name}`
      );

      if (result.code === 200) {
        uploadedFiles.push({
          ...result.data,
          fileName: file.name,
          fileSize: file.size,
          createTime: createTime
        });
      }
    }
    
    return uploadedFiles;
  };

  // ========== 上传状态管理 ==========

  /**
   * 设置上传状态
   * @param {boolean} isUploading - 是否正在上传
   */
  const setUploadingState = (isUploading) => {
    uploading.value = isUploading;
    if (!isUploading) {
      uploadProgress.value = 0;
      uploadProgressText.value = '';
    }
  };

  /**
   * 更新上传进度
   * @param {number} progress - 进度百分比
   * @param {string} text - 进度文本
   */
  const updateUploadProgress = (progress, text) => {
    uploadProgress.value = progress;
    uploadProgressText.value = text;
  };

  return {
    // 状态
    uploading,
    uploadProgress,
    uploadProgressText,
    
    // 工具函数
    formatFileSize,
    generateCreateTime,
    
    // 章节文件管理
    triggerFileSelect,
    handleFileSelect,
    removeFile,
    uploadChapterFiles,
    
    // 节点文件管理
    triggerNodeFileSelect,
    handleNodeFileSelect,
    removeNodeFile,
    uploadNodeFiles,
    
    // 状态管理
    setUploadingState,
    updateUploadProgress
  };
}
