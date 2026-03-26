import request from './axios';
import { handleApiResponse } from '@/utils/apiHandler';

/**
 * 检测后端服务连通性
 * @returns {Promise<boolean>} 是否连通
 */
export const checkBackendConnection = async () => {
  try {
    // 使用一个简单的文件列表查询来测试连接，而不是可能不存在的ping接口
    const response = await request({
      url: '/core/files/list',
      method: 'get',
      params: { pageNum: 1, pageSize: 1 },
      timeout: 10000 // 10秒超时
    });
    console.log('后端连接检测成功');
    return true; // 只要请求成功就认为连接正常
  } catch (error) {
    console.error('后端连接检测失败:', error);
    return false;
  }
};




/**
 * 上传文件
 * @param {File} file 要上传的文件对象
 * @param {Function} onUploadProgress 上传进度回调函数 (可选)
 * @returns {Promise<Object>} 标准化响应
 */
export const uploadFile = async (file, onUploadProgress = null, retryCount = 0) => {
  if (!file) {
    return {
      code: 400,
      message: '文件参数不能为空',
      data: null,
      error: 'File is required'
    };
  }

  console.log('上传文件:', file.name);

  const formData = new FormData();
  formData.append('file', file);
  // 添加文件名参数
  formData.append('fileName', file.name);

  // 为文件上传创建专门的请求配置，增加超时时间
  const uploadTimeout = Math.max(300000, file.size / 1024 * 100); // 根据文件大小动态设置超时时间，最少5分钟
  console.log(`文件 ${file.name} 大小: ${(file.size / 1024 / 1024).toFixed(2)}MB, 设置超时时间: ${uploadTimeout / 1000}秒`);

  try {
    const apiCall = request({
      url: '/common/upload',
      method: 'post',
      data: formData,
      timeout: uploadTimeout, // 动态超时时间
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && typeof onUploadProgress === 'function') {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted, progressEvent);
        }
      }
    });

    return await handleApiResponse(apiCall, '上传文件');
  } catch (error) {
    // 针对连接重置错误进行重试
    if ((error.code === 'ERR_NETWORK' || error.message === 'Network Error') && retryCount < 2) {
      console.log(`上传失败，尝试重试 (${retryCount + 1}/2):`, error.message);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒后重试
      return uploadFile(file, onUploadProgress, retryCount + 1);
    }
    
    // 如果是连接重置错误，提供更详细的错误信息
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return {
        code: 500,
        message: '文件上传失败：服务器连接中断。可能原因：1) 文件过大超出服务器限制 2) 网络不稳定 3) 服务器配置问题。建议尝试上传更小的文件或联系管理员。',
        data: null,
        error: error.message
      };
    }
    
    throw error;
  }
};

/**
 * 批量上传多个文件（使用专用的批量上传接口）
 * @param {Array<File>} files 要上传的文件数组
 * @param {Function} onUploadProgress 上传进度回调函数 (可选)
 * @returns {Promise<Object>} 标准化响应
 */
export const uploadMultipleFiles = async (files, onUploadProgress = null) => {
  if (!Array.isArray(files) || files.length === 0) {
    return {
      code: 400,
      message: '文件数组参数不能为空',
      data: null,
      error: 'Files array is required'
    };
  }

  console.log('批量上传文件:', files.map(f => f.name));

  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
    // 为每个文件添加对应的文件名
    formData.append('fileNames', file.name);
  });

  const apiCall = request({
    url: '/common/uploads',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && typeof onUploadProgress === 'function') {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted, progressEvent);
      }
    }
  });

  return handleApiResponse(apiCall, '批量上传文件');
};

/**
 * 批量上传文件（逐个上传方式，适用于需要单独处理每个文件的场景）
 * @param {Array<File>} files 要上传的文件数组
 * @param {Function} onUploadProgress 上传进度回调函数 (可选)
 * @param {Function} onFileComplete 单个文件完成回调函数 (可选)
 * @returns {Promise<Array<Object>>} 上传结果数组
 */
export const uploadFiles = async (files, onUploadProgress = null, onFileComplete = null) => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('文件数组参数不能为空');
  }

  console.log('逐个上传文件:', files.map(f => f.name));

  const results = [];
  const totalFiles = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      const fileProgressCallback = onUploadProgress ? (percent, progressEvent) => {
        const overallProgress = Math.round(((i + percent / 100) / totalFiles) * 100);
        onUploadProgress(overallProgress, progressEvent, i, totalFiles);
      } : null;

      const result = await uploadFile(file, fileProgressCallback);
      const fileResult = {
        file: file.name,
        success: result.code === 200,
        result: result
      };

      results.push(fileResult);
      onFileComplete?.(file, result, i, totalFiles);

    } catch (error) {
      const fileResult = {
        file: file.name,
        success: false,
        error: error.message || '上传失败'
      };

      results.push(fileResult);
      onFileComplete?.(file, null, i, totalFiles, error);
    }
  }

  return results;
};

/**
 * 新增课程文件
 * @param {Object} clFiles 课程文件对象
 * @param {number} clFiles.courseId 所属课程
 * @param {string} clFiles.fileUrl 文件地址
 * @param {string} clFiles.fileType 文件mime类型
 * @param {number} clFiles.fileSize 文件大小,单位字节
 * @param {string} clFiles.fileKey 文件在阿里云Oss上对应的Key
 * @param {string} clFiles.remark 备注
 * @returns {Promise<Object>} 标准化响应
 */
export const createCourseFile = async (clFiles) => {
  if (!clFiles.courseId) {
    return {
      code: 400,
      message: '课程ID不能为空',
      data: null,
      error: 'Course ID is required'
    };
  }

  if (!clFiles.fileUrl) {
    return {
      code: 400,
      message: '文件地址不能为空',
      data: null,
      error: 'File URL is required'
    };
  }

  console.log('创建课程文件:', clFiles);

  const apiCall = request({
    url: '/core/files',
    method: 'post',
    data: clFiles,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return handleApiResponse(apiCall, '创建课程文件');
};

/**
 * 查询课程文件列表
 * @param {Object} params 查询参数
 * @param {number} params.courseId 所属课程
 * @param {string} params.fileType 文件类型
 * @returns {Promise<Object>} 标准化响应
 */
export const getCourseFilesList = async (params = {}) => {
  console.log('获取课程文件列表:', params);

  const apiCall = request({
    url: '/core/files/list',
    method: 'get',
    params
  });

  return handleApiResponse(apiCall, '获取课程文件列表');
};

/**
 * 根据ID获取课程文件详情
 * @param {string|number} fileId 文件ID
 * @returns {Promise<Object>} 标准化响应
 */
export const getCourseFileById = async (fileId) => {
  if (!fileId) {
    return {
      code: 400,
      message: '文件ID不能为空',
      data: null,
      error: 'File ID is required'
    };
  }

  console.log(`获取课程文件详情: ${fileId}`);

  const apiCall = request({
    url: `/core/files/${fileId}`,
    method: 'get'
  });

  return handleApiResponse(apiCall, '获取课程文件详情');
};

/**
 * 修改课程文件
 * @param {Object} clFiles 课程文件对象
 * @param {number} clFiles.id 文件ID
 * @param {number} clFiles.courseId 所属课程
 * @param {string} clFiles.fileUrl 文件地址
 * @param {string} clFiles.remark 备注
 * @returns {Promise<Object>} 标准化响应
 */
export const updateCourseFile = async (clFiles) => {
  if (!clFiles.id) {
    return {
      code: 400,
      message: '文件ID不能为空',
      data: null,
      error: 'File ID is required for update'
    };
  }

  console.log('修改课程文件:', clFiles);

  const apiCall = request({
    url: '/core/files',
    method: 'put',
    data: clFiles,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return handleApiResponse(apiCall, '修改课程文件');
};

/**
 * 删除课程文件（支持单个或批量删除）
 * @param {string|number|Array<string|number>} fileIds 文件ID或文件ID数组
 * @returns {Promise<Object>} 标准化响应
 */
export const deleteCourseFile = async (fileIds) => {
  const idsArray = Array.isArray(fileIds) ? fileIds : [fileIds];
  const validIds = idsArray.filter(id => id);

  if (validIds.length === 0) {
    return {
      code: 400,
      message: '文件ID不能为空',
      data: null,
      error: 'File IDs are required for deletion'
    };
  }

  console.log('删除课程文件:', validIds);

  const idsParam = validIds.join(',');
  const apiCall = request({
    url: `/core/files/${idsParam}`,
    method: 'delete',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return handleApiResponse(apiCall, '删除课程文件');
};

/**
 * 批量删除课程文件（专门用于批量操作的函数）
 * @param {Array<string|number>} fileIds 文件ID数组
 * @returns {Promise<Object>} 标准化响应
 */
export const deleteCourseFiles = async (fileIds) => {
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return {
      code: 400,
      message: '批量删除需要提供文件ID数组',
      data: null,
      error: 'File IDs array is required for batch deletion'
    };
  }

  return deleteCourseFile(fileIds);
};

/**
 * 上传文件并创建课程文件记录（完整工作流程）
 * @param {File} file 要上传的文件对象
 * @param {number} courseId 所属课程ID
 * @param {string} remark 备注信息（可选）
 * @param {Function} onUploadProgress 上传进度回调函数（可选）
 * @returns {Promise<Object>} 标准化响应
 */
export const uploadAndCreateCourseFile = async (file, courseId, remark = '', onUploadProgress = null) => {
  if (!file) {
    return {
      code: 400,
      message: '文件参数不能为空',
      data: null,
      error: 'File is required'
    };
  }

  if (!courseId) {
    return {
      code: 400,
      message: '课程ID不能为空',
      data: null,
      error: 'Course ID is required'
    };
  }

  console.log('上传文件并创建课程文件记录:', file.name, courseId);

  try {
    // 第一步：上传文件
    const uploadResult = await uploadFile(file, onUploadProgress);

    if (uploadResult.code !== 200) {
      return uploadResult;
    }

    // 第二步：创建课程文件记录
    const courseFileData = {
      courseId,
      fileUrl: uploadResult.data?.fileUrl || uploadResult.data?.url,
      fileKey: uploadResult.data?.fileKey || uploadResult.data?.key,
      fileSize: uploadResult.data?.fileSize || file.size,
      fileType: uploadResult.data?.fileType || file.type,
      fileName: file.name,
      remark
    };

    const createResult = await createCourseFile(courseFileData);

    if (createResult.code !== 200) {
      return createResult;
    }

    return {
      code: 200,
      message: '文件上传并创建课程文件记录成功',
      data: {
        uploadResult: uploadResult.data,
        createResult: createResult.data,
        fileInfo: courseFileData
      }
    };

  } catch (error) {
    return {
      code: 500,
      message: error.message || '上传文件并创建课程文件记录失败',
      data: null,
      error: error.message
    };
  }
};

/**
 * 获取学生的学习资料（学生端专用）
 * @param {Object} params 查询参数
 * @param {number} params.courseId 课程ID过滤
 * @param {string} params.fileType 文件类型过滤 ('course', 'shared', 'video')
 * @returns {Promise<Object>} 标准化响应
 */
export const getStudentMaterials = async (params = {}) => {
  console.log('获取学生学习资料:', params);

  const apiCall = request({
    url: '/core/files/student/materials',
    method: 'get',
    params
  });

  return handleApiResponse(apiCall, '获取学生学习资料');
};

/**
 * 根据创建时间查询章节关联的文件列表
 * @param {number} courseId 课程ID
 * @param {string} createTime 创建时间
 * @returns {Promise<Array>} 文件列表
 */
export const getChapterFilesByCreateTime = async (courseId, createTime) => {
  if (!courseId || !createTime) return [];

  try {
    const result = await getCourseFilesList({ courseId, pageSize: 1000 });
    if (result.code !== 200 || !result.rows) return [];

    const targetTime = new Date(createTime).getTime();
    
    return result.rows
      .filter(file => {
        if (!file.createTime) return false;
        const fileTime = new Date(file.createTime).getTime();
        return Math.abs(fileTime - targetTime) <= 60000; // 60秒内
      })
      .sort((a, b) => {
        const aDiff = Math.abs(new Date(a.createTime).getTime() - targetTime);
        const bDiff = Math.abs(new Date(b.createTime).getTime() - targetTime);
        return aDiff - bDiff;
      });
  } catch (error) {
    console.error('查询章节文件失败:', error);
    return [];
  }
};
