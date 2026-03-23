import { handleApiResponse } from '@/utils/apiHandler';
import { checkAuthInResponse } from '@/utils/apiResponseHandler';
import request from './axios';

const assignableRoleKeys = ['teacher', 'student'];

const normalizeRole = (role = {}) => ({
  ...role,
  roleId: role.roleId,
  roleName: role.roleName || '',
  roleKey: role.roleKey || '',
  status: role.status ?? ''
});

const normalizeRoles = (roles) => {
  if (!Array.isArray(roles)) {
    return [];
  }

  return roles.map(normalizeRole);
};

const getAssignableRoles = (roles) => {
  return roles.filter(role => String(role.status) === '0' && assignableRoleKeys.includes(role.roleKey));
};

const normalizeUserRoleResponse = (response, apiName) => {
  const checkedResponse = checkAuthInResponse(response, apiName);

  if (checkedResponse.code === 401) {
    return {
      code: 401,
      message: checkedResponse.msg || 'Token已过期，请重新登录',
      data: null,
      roles: [],
      assignableRoles: []
    };
  }

  if (typeof checkedResponse?.code === 'number' && checkedResponse.code !== 200) {
    return {
      ...checkedResponse,
      message: checkedResponse.msg || checkedResponse.message || `${apiName}失败`,
      roles: normalizeRoles(checkedResponse.roles),
      assignableRoles: getAssignableRoles(normalizeRoles(checkedResponse.roles))
    };
  }

  const roles = normalizeRoles(checkedResponse.roles || checkedResponse.data?.roles);
  const assignableRoles = getAssignableRoles(roles);
  const normalizedData = checkedResponse.data && typeof checkedResponse.data === 'object'
    ? {
        ...checkedResponse.data,
        ...(roles.length > 0 ? { roles } : {})
      }
    : checkedResponse.data;

  return {
    ...checkedResponse,
    code: 200,
    message: checkedResponse.msg || checkedResponse.message || 'success',
    data: normalizedData,
    roles,
    assignableRoles
  };
};

/**
 * 用户管理相关API
 * 用于获取用户列表、学生列表等
 */

/**
 * 获取用户列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} 标准化响应
 */
export const getUserList = async (params = {}) => {
  console.log('获取用户列表:', params);

  const apiCall = request({
    url: '/system/user/list',
    method: 'get',
    params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return handleApiResponse(apiCall, '获取用户列表');
};

/**
 * 根据部门ID获取用户列表（学生列表）
 * @param {number} deptId - 部门ID（班级ID）
 * @param {Object} additionalParams - 额外的查询参数
 * @returns {Promise<Object>} 标准化响应
 */
export const getUserListByDept = async (deptId, additionalParams = {}) => {
  if (!deptId) {
    return {
      code: 400,
      message: '部门ID不能为空',
      data: null,
      error: 'Department ID is required'
    };
  }

  console.log('根据部门ID获取用户列表:', deptId, additionalParams);

  const params = {
    deptId,
    ...additionalParams
  };

  return getUserList(params);
};

/**
 * 根据课程ID获取学生列表
 * 注意：这个API可能需要根据实际后端接口调整
 * @param {number} courseId - 课程ID
 * @param {Object} additionalParams - 额外的查询参数
 * @returns {Promise<Object>} 学生列表响应数据
 */
export const getStudentListByCourse = async (courseId, additionalParams = {}) => {
  if (!courseId) {
    return {
      code: 400,
      message: '课程ID不能为空',
      data: null,
      error: 'Course ID is required'
    };
  }

  console.log('根据课程ID获取学生列表:', courseId, additionalParams);

  const params = {
    courseId,
    ...additionalParams
  };

  try {
    const apiCall = request({
      url: '/core/course/students',
      method: 'get',
      params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return await handleApiResponse(apiCall, '获取课程学生列表');
  } catch (error) {
    // 如果专门的课程学生接口不存在，回退到通用用户列表
    if (error.response?.status === 404) {
      console.log('课程学生接口不存在，回退到通用用户列表');
      return getUserList(params);
    }
    throw error;
  }
};

/**
 * 搜索用户
 * @param {Object} searchParams - 搜索参数
 * @param {string} searchParams.keyword - 搜索关键词
 * @param {number} searchParams.deptId - 部门ID
 * @param {number} searchParams.pageNum - 页码
 * @param {number} searchParams.pageSize - 每页大小
 * @returns {Promise<Object>} 搜索结果
 */
export const searchUsers = (searchParams) => {
  console.log('正在搜索用户...', searchParams);
  
  // 将关键词映射到具体的搜索字段
  const params = { ...searchParams };
  if (searchParams.keyword) {
    // 可以同时搜索用户名和昵称
    params.userName = searchParams.keyword;
    params.nickName = searchParams.keyword;
  }
  
  return getUserList(params);
};

/**
 * 获取用户详情
 * @param {number} userId - 用户ID
 * @returns {Promise<Object>} 标准化响应
 */
export const getUserDetail = async (userId) => {
  if (!userId) {
    return {
      code: 400,
      message: '用户ID不能为空',
      data: null,
      error: 'User ID is required'
    };
  }

  console.log('获取用户详情:', userId);

  try {
    const response = await request({
      url: `/system/user/${userId}`,
      method: 'get'
    });

    return normalizeUserRoleResponse(response, '获取用户详情');
  } catch (error) {
    console.error('获取用户详情失败:', error);
    return {
      code: error.response?.status || 500,
      message: error.response?.data?.message || error.message || '获取用户详情失败',
      data: null,
      roles: [],
      assignableRoles: [],
      error: error.response?.data || error.message
    };
  }
};

/**
 * 获取新增/编辑用户所需初始化数据
 * 说明：后端会返回可分配角色列表 roles
 * @returns {Promise<Object>} 标准化响应
 */
export const getUserFormOptions = async () => {
  console.log('获取用户表单初始化数据');

  try {
    const response = await request({
      url: '/system/user',
      method: 'get'
    });

    return normalizeUserRoleResponse(response, '获取用户表单初始化数据');
  } catch (error) {
    console.error('获取用户表单初始化数据失败:', error);
    return {
      code: error.response?.status || 500,
      message: error.response?.data?.message || error.message || '获取用户表单初始化数据失败',
      data: null,
      roles: [],
      assignableRoles: [],
      error: error.response?.data || error.message
    };
  }
};

/**
 * 获取用户授权角色信息
 * @param {number} userId - 用户ID
 * @returns {Promise<Object>} 标准化响应
 */
export const getUserAuthRole = async (userId) => {
  if (!userId) {
    return {
      code: 400,
      message: '用户ID不能为空',
      data: null,
      roles: [],
      assignableRoles: [],
      error: 'User ID is required'
    };
  }

  console.log('获取用户授权角色:', userId);

  try {
    const response = await request({
      url: `/system/user/authRole/${userId}`,
      method: 'get'
    });

    return normalizeUserRoleResponse(response, '获取用户授权角色');
  } catch (error) {
    console.error('获取用户授权角色失败:', error);
    return {
      code: error.response?.status || 500,
      message: error.response?.data?.message || error.message || '获取用户授权角色失败',
      data: null,
      roles: [],
      assignableRoles: [],
      error: error.response?.data || error.message
    };
  }
};
