import request from './axios';
import { checkAuthInResponse } from '@/utils/apiResponseHandler';

/**
 * 标准API响应处理器
 * @param {Promise} apiCall - API调用Promise
 * @param {string} apiName - API名称
 * @returns {Promise<Object>} 标准化响应
 */
const handleApiResponse = async (apiCall, apiName) => {
  try {
    const response = await apiCall;

    // 检查认证状态
    const checkedResponse = await checkAuthInResponse(response, apiName);

    // 401错误直接返回
    if (checkedResponse.code === 401) {
      return {
        code: 401,
        message: checkedResponse.msg || 'Token已过期，请重新登录',
        data: null
      };
    }

    // 检查权限错误 - 识别包装在成功响应中的权限错误
    const message = checkedResponse.msg || checkedResponse.message || '';
    if (message.includes('没有权限') || message.includes('权限不足') || message.includes('无权限') || message.includes('联系管理员授权')) {
      console.warn(`${apiName}权限错误:`, message);
      return {
        code: 403,
        message: message,
        data: null
      };
    }

    // 标准化成功响应
    return {
      code: 200,
      message: checkedResponse.msg || 'success',
      data: checkedResponse.data || checkedResponse,
      // 保持列表API的兼容性
      ...(checkedResponse.rows && {
        total: checkedResponse.total || 0,
        rows: checkedResponse.rows
      })
    };
  } catch (error) {
    console.error(`${apiName}失败:`, error);

    // 标准化错误响应
    const statusCode = error.response?.status || 500;
    return {
      code: statusCode,
      message: error.response?.data?.message || error.message || `${apiName}失败`,
      data: null,
      error: error.response?.data || error.message
    };
  }
};

/**
 * 获取课程列表
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 标准化响应
 */
export const getCoursesList = async (params = {}) => {

  const apiCall = request({
    url: '/core/courses/list',
    method: 'get',
    params
  });

  return handleApiResponse(apiCall, '获取课程列表');
};

/**
 * 新增课程
 * @param {Object} courseData 课程数据
 * @param {string} courseData.name 课程名称
 * @param {string} courseData.description 课程描述
 * @param {number} courseData.majorId 所属专业ID
 * @param {string} courseData.className 班级名称
 * @param {number} courseData.teacherId 教师ID
 * @param {number} courseData.tpId 模板ID
 * @returns {Promise<Object>} 标准化响应
 */
export const createCourse = async (courseData) => {

  const apiCall = request({
    url: '/core/courses',
    method: 'post',
    data: courseData,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return handleApiResponse(apiCall, '创建课程');
};

/**
 * 根据ID获取课程详情
 * @param {string|number} courseId 课程ID
 * @returns {Promise<Object>} 标准化响应
 */
export const getCourseById = async (courseId) => {
  if (!courseId) {
    return {
      code: 400,
      message: '课程ID不能为空',
      data: null,
      error: 'Invalid course ID'
    };
  }


  const apiCall = request({
    url: `/core/courses/${courseId}`,
    method: 'get'
  });

  return handleApiResponse(apiCall, '获取课程详情');
};

/**
 * 修改课程
 * @param {Object} courseData 课程数据
 * @param {number} courseData.id 课程ID
 * @param {string} courseData.name 课程名称
 * @param {string} courseData.description 课程描述
 * @param {number} courseData.majorId 所属专业ID
 * @param {string} courseData.className 班级名称
 * @param {number} courseData.teacherId 教师ID
 * @param {number} courseData.tpId 模板ID
 * @returns {Promise<Object>} 标准化响应
 */
export const updateCourse = async (courseData) => {
  if (!courseData.id) {
    return {
      code: 400,
      message: '课程ID不能为空',
      data: null,
      error: 'Course ID is required for update'
    };
  }


  const apiCall = request({
    url: '/core/courses',
    method: 'put',
    data: courseData,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return handleApiResponse(apiCall, '修改课程');
};

/**
 * 删除课程
 * @param {string|number} courseId 课程ID
 * @returns {Promise<Object>} 标准化响应
 */
export const deleteCourse = async (courseId) => {
  if (!courseId) {
    return {
      code: 400,
      message: '课程ID不能为空',
      data: null,
      error: 'Course ID is required for deletion'
    };
  }


  const apiCall = request({
    url: `/core/courses/${courseId}`,
    method: 'delete'
  });

  return handleApiResponse(apiCall, '删除课程');
};

/**
 * 获取学生的课程列表（学生端专用）
 * @param {Object} params 查询参数
 * @param {string} params.status 课程状态过滤 ('ongoing', 'completed', 'all')
 * @returns {Promise<Object>} 标准化响应
 */
export const getStudentCourses = async (params = {}) => {

  try {
    // 尝试使用学生专用API
    const apiCall = request({
      url: '/core/courses/student/list',
      method: 'get',
      params
    });

    return await handleApiResponse(apiCall, '获取学生课程列表');
  } catch (error) {
    // 如果学生专用API不存在，回退到通用API
    if (error.response?.status === 404) {
      return getCoursesList(params);
    }
    throw error;
  }
};
