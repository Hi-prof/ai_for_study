import { ref, computed } from 'vue';
import { uploadFile, createCourseFile, getCourseFilesList } from '@/api/files';
import { 
  generateChapterFileName, 
  createRenamedFile, 
  validateChapterFileParams,
  filterFilesByChapter,
  filterFilesByNode,
  groupFilesByChapter
} from '@/utils/chapterFileNaming';

/**
 * 章节文件上传管理 Composable
 * 专门处理章节文件的上传、重命名和分类展示
 */
export function useChapterFileUpload() {
  // 响应式状态
  const uploading = ref(false);
  const uploadProgress = ref(0);
  const uploadProgressText = ref('');
  const courseFiles = ref([]);
  const loading = ref(false);

  /**
   * 上传章节文件（使用现有的课程资料上传功能）
   * @param {File} file 原始文件
   * @param {string} nodeName 节点名称
   * @param {string|number} nodeId 节点ID，必须有有效值
   * @param {string|number} courseId 课程ID
   * @param {Function} onProgress 进度回调函数
   * @returns {Promise<Object>} 上传结果
   */
  const uploadChapterFile = async (file, nodeName, nodeId, courseId, onProgress = null) => {
    // 验证参数
    const validation = validateChapterFileParams(file, nodeName, nodeId);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    if (!courseId) {
      throw new Error('课程ID不能为空');
    }

    try {
      uploading.value = true;
      uploadProgress.value = 0;
      uploadProgressText.value = `正在上传 ${nodeName} 的文件: ${file.name}`;

      // 生成新文件名
      const newFileName = generateChapterFileName(nodeName, nodeId, file.name);
      console.log('生成章节文件名:', newFileName);

      // 创建重命名后的文件对象
      const renamedFile = createRenamedFile(file, newFileName);

      // 上传文件（复用现有的上传功能）
      const uploadResult = await uploadFile(renamedFile, (progress) => {
        uploadProgress.value = progress;
        if (onProgress) {
          onProgress(progress);
        }
      });

      if (uploadResult.code !== 200) {
        throw new Error(uploadResult.message || '文件上传失败');
      }

      // 创建课程文件记录（复用现有功能）
      const fileData = {
        courseId: courseId,
        fileUrl: uploadResult.data?.fileUrl || uploadResult.data?.url,
        fileType: renamedFile.type,
        fileSize: renamedFile.size,
        fileKey: uploadResult.data?.fileKey || uploadResult.data?.key,
        fileName: newFileName,
        remark: `章节文件 - ${nodeName}${nodeId ? ` (ID: ${nodeId})` : ' (章节级别)'}`
      };

      const createResult = await createCourseFile(fileData);

      if (createResult.code !== 200) {
        throw new Error(createResult.message || '创建文件记录失败');
      }

      uploadProgressText.value = '上传完成';
      
      return {
        success: true,
        data: {
          ...createResult.data,
          originalFileName: file.name,
          chapterFileName: newFileName,
          nodeName,
          nodeId
        }
      };

    } catch (error) {
      console.error('章节文件上传失败:', error);
      throw error;
    } finally {
      uploading.value = false;
    }
  };

  /**
   * 批量上传章节文件
   * @param {Array} files 文件数组 [{ file, nodeName, nodeId }]
   * @param {string|number} courseId 课程ID
   * @param {Function} onProgress 总体进度回调
   * @param {Function} onFileComplete 单个文件完成回调
   * @returns {Promise<Array>} 上传结果数组
   */
  const uploadChapterFiles = async (files, courseId, onProgress = null, onFileComplete = null) => {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('文件数组不能为空');
    }

    const results = [];
    const totalFiles = files.length;

    try {
      uploading.value = true;

      for (let i = 0; i < files.length; i++) {
        const { file, nodeName, nodeId } = files[i];

        try {
          const fileProgressCallback = onProgress ? (percent) => {
            const overallProgress = Math.round(((i + percent / 100) / totalFiles) * 100);
            uploadProgress.value = overallProgress;
            onProgress(overallProgress, i, totalFiles);
          } : null;

          const result = await uploadChapterFile(file, nodeName, nodeId, courseId, fileProgressCallback);
          
          results.push({
            file: file.name,
            success: true,
            result: result
          });

          if (onFileComplete) {
            onFileComplete(file, result, i, totalFiles);
          }

        } catch (error) {
          const errorResult = {
            file: file.name,
            success: false,
            error: error.message || '上传失败'
          };

          results.push(errorResult);

          if (onFileComplete) {
            onFileComplete(file, null, i, totalFiles, error);
          }
        }
      }

      return results;

    } finally {
      uploading.value = false;
    }
  };

  /**
   * 加载课程文件列表
   * @param {string|number} courseId 课程ID
   * @returns {Promise<Array>} 文件列表
   */
  const loadCourseFiles = async (courseId) => {
    if (!courseId) {
      throw new Error('课程ID不能为空');
    }

    try {
      loading.value = true;
      
      const response = await getCourseFilesList({ 
        courseId, 
        pageSize: 1000 // 获取所有文件
      });

      if (response.code === 200 && response.rows) {
        courseFiles.value = response.rows;
        return response.rows;
      } else {
        console.warn('获取课程文件列表失败:', response);
        courseFiles.value = [];
        return [];
      }

    } catch (error) {
      console.error('加载课程文件列表失败:', error);
      courseFiles.value = [];
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取指定章节的文件列表
   * @param {string} chapterName 章节名称
   * @param {string|number|null} chapterId 章节ID
   * @returns {Array} 章节文件列表
   */
  const getChapterFiles = (chapterName, chapterId) => {
    return filterFilesByChapter(courseFiles.value, chapterName, chapterId);
  };

  /**
   * 获取指定节点的文件列表
   * @param {string} nodeName 节点名称
   * @param {string|number} nodeId 节点ID
   * @returns {Array} 节点文件列表
   */
  const getNodeFiles = (nodeName, nodeId) => {
    return filterFilesByNode(courseFiles.value, nodeName, nodeId);
  };

  /**
   * 获取按章节分组的文件列表
   * @returns {Object} 分组后的文件对象
   */
  const getGroupedFiles = () => {
    return groupFilesByChapter(courseFiles.value);
  };

  // 计算属性
  const isUploading = computed(() => uploading.value);
  const currentProgress = computed(() => uploadProgress.value);
  const progressText = computed(() => uploadProgressText.value);
  const isLoading = computed(() => loading.value);
  const totalFiles = computed(() => courseFiles.value.length);

  return {
    // 状态
    isUploading,
    currentProgress,
    progressText,
    isLoading,
    courseFiles,
    totalFiles,

    // 方法
    uploadChapterFile,
    uploadChapterFiles,
    loadCourseFiles,
    getChapterFiles,
    getNodeFiles,
    getGroupedFiles
  };
}
