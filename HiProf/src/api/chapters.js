import request from './axios';

/**
 * 通用数据提取函数 - 从各种可能的响应格式中提取数组数据
 * @param {*} response 响应数据
 * @param {string} context 上下文信息，用于日志
 * @returns {Array} 提取的数组数据
 */
const extractArrayFromResponse = (response, context = '数据') => {
  
  if (!response) {
    console.warn(`${context}为空`);
    return [];
  }
  
  // 如果直接是数组
  if (Array.isArray(response)) {
    return response;
  }
  
  if (typeof response !== 'object') {
    console.warn(`${context}不是对象类型:`, typeof response);
    return [];
  }
  
  // 尝试从各种可能的字段中提取数组数据
  const possibleFields = [
    'rows',      // 标准分页响应
    'data',      // 通用数据字段
    'result',    // 结果字段
    'list',      // 列表字段
    'records',   // 记录字段
    'items',     // 项目字段
    'content',   // 内容字段
    'body',      // 主体字段
    'payload'    // 载荷字段
  ];
  
  for (const field of possibleFields) {
    if (response[field]) {
      if (Array.isArray(response[field])) {
        return response[field];
      } else if (response[field] && typeof response[field] === 'object') {
        // 递归检查嵌套对象
        const nested = extractArrayFromResponse(response[field], `${context}.${field}`);
        if (nested.length > 0) {
          return nested;
        }
      }
    }
  }
  
  console.warn(`无法从${context}中提取数组数据，响应结构:`, Object.keys(response));
  return [];
};

/**
 * 查询课程的章节列表
 * @param {string|number} courseId 课程ID
 * @returns {Promise<Object>} 章节列表
 */
export const getCourseChapterList = (courseId) => {

  const params = {
    pageNum: 1,
    pageSize: 100,
    courseId: courseId,
    graphType: "1" // 章节类型
  };
  
  // 添加排序参数 - 按创建时间升序排列
  params.orderBy = 'createTime';
  params.sortOrder = 'asc';

  return request({
    url: '/core/zstp/list',
    method: 'get',
    params
  }).then(response => {
    
    // 使用通用提取函数获取数组数据
    const extractedData = extractArrayFromResponse(response, `课程${courseId}的章节列表`);
    
    // 如果成功提取到数据，返回标准格式
    if (extractedData.length > 0) {
      return { 
        rows: extractedData,
        total: extractedData.length,
        originalResponse: response
      };
    }
    
    // 如果没有提取到数据，但响应存在，保留原始响应用于调试
    if (response) {
      console.warn('未能从响应中提取到有效数据，但响应存在');
      return { 
        rows: [], 
        total: 0,
        originalResponse: response,
        extractionFailed: true
      };
    }
    
    // 完全没有响应数据
    console.warn('响应数据为空');
    return { rows: [], total: 0 };
  }).catch(error => {
    console.error(`获取课程${courseId}章节列表失败:`, error);
    throw error;
  });
};

/**
 * 获取章节详细信息
 * @param {string|number} chapterId 章节ID
 * @returns {Promise<Object>} 章节详细信息
 */
export const getChapterDetail = (chapterId) => {

  if (!chapterId) {
    console.error('获取章节详细信息失败: ID不能为空');
    return Promise.reject(new Error('章节ID不能为空'));
  }

  return request({
    url: `/core/zstp/${chapterId}`,
    method: 'get'
  }).then(response => {

    // 根据API文档，响应包含 error, success, warn, empty 字段
    if (response && typeof response === 'object') {
      if (response.error === true) {
        console.error('API返回错误状态:', response);
        throw new Error('获取章节详细信息失败');
      }

      if (response.success === true) {
        return response;
      }
    }

    // 如果响应格式不符合预期，仍然返回原始响应
    console.warn('响应格式不符合API文档预期:', response);
    return response;
  }).catch(error => {
    console.error(`获取章节${chapterId}详细信息失败:`, error);
    return Promise.reject(error);
  });
};

/**
 * 创建新章节
 * @param {Object} chapterData 章节数据
 * @param {string|number} chapterData.courseId 课程ID
 * @param {string} chapterData.name 章节名称
 * @param {string} chapterData.content 章节内容（可选）
 * @param {string} chapterData.remark 备注（可选）
 * @returns {Promise<Object>} 创建结果
 */
export const createChapter = (chapterData) => {

  // 验证必填字段
  if (!chapterData.courseId) {
    throw new Error('课程ID不能为空');
  }
  if (!chapterData.name) {
    throw new Error('章节名称不能为空');
  }

  // 构建请求数据
  const requestData = {
    ...chapterData,
    graphType: "1" // 章节类型
  };

  return request({
    url: '/core/zstp',
    method: 'post',
    data: requestData
  }).then(response => {
    return response;
  }).catch(error => {
    console.error('创建章节失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 更新章节信息
 * @param {Object} chapterData 章节数据（必须包含id字段）
 * @returns {Promise<Object>} 更新结果
 */
export const updateChapter = (chapterData) => {

  if (!chapterData.id) {
    throw new Error('更新时章节ID不能为空');
  }

  return request({
    url: '/core/zstp',
    method: 'put',
    data: chapterData
  }).then(response => {
    return response;
  }).catch(error => {
    console.error('更新章节失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 删除章节
 * @param {string|number} chapterId 章节ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteChapter = (chapterId) => {

  if (!chapterId) {
    throw new Error('删除时章节ID不能为空');
  }

  return request({
    url: `/core/zstp/${chapterId}`,
    method: 'delete'
  }).then(response => {
    return response;
  }).catch(error => {
    console.error('删除章节失败:', error);
    return Promise.reject(error);
  });
};

// 为了保持向后兼容，导出原有的函数名
export const getCourseZstpList = getCourseChapterList;
export const getZstpDetail = getChapterDetail;
export const createZstp = createChapter;
export const updateZstp = updateChapter;
export const deleteZstp = deleteChapter;

// 添加学生端使用的函数名别名
export const getChaptersByCourseId = getCourseChapterList;
