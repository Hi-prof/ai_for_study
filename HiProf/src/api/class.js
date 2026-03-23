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
    console.log(`${apiName}成功:`, response);

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

    // 标准化成功响应
    return {
      code: 200,
      message: checkedResponse.msg || 'success',
      data: checkedResponse.data || checkedResponse,
      // 保持列表API的兼容性
      ...(checkedResponse.rows && {
        total: checkedResponse.total || 0,
        rows: checkedResponse.rows
      }),
      // 处理直接返回数组的情况
      ...(Array.isArray(checkedResponse) && {
        total: checkedResponse.length,
        rows: checkedResponse
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
 * 获取学院列表
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 标准化响应
 */
export const getDepartmentsList = async (params = {}) => {
  console.log('获取学院列表:', params);

  const apiCall = request({
    url: '/system/dept/list/second',
    method: 'get',
    params
  });

  return handleApiResponse(apiCall, '获取学院列表');
};

/**
 * 获取专业列表（根据学院ID获取）
 * @param {number} departmentId 学院ID
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 标准化响应
 */
export const getClassesList = async (departmentId, params = {}) => {
  if (!departmentId) {
    return {
      code: 400,
      message: '学院ID不能为空',
      data: null,
      error: 'Department ID is required'
    };
  }

  console.log('获取专业列表:', { departmentId, params });

  const apiCall = request({
    url: `/system/dept/list/include/${departmentId}`,
    method: 'get',
    params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return handleApiResponse(apiCall, '获取专业列表');
};

export const getMajorsList = getClassesList;


/**
 * 创建新班级（使用部门接口）
 * @param {Object} classData 班级数据
 * @param {string} classData.name 班级名称
 * @param {number} classData.parentId 父部门ID，默认101
 * @param {number} classData.orderNum 排序号，默认0
 * @returns {Promise<Object>} 标准化响应
 */
export const createClass = async (classData) => {
  if (!classData.name?.trim()) {
    return {
      code: 400,
      message: '班级名称不能为空',
      data: null,
      error: 'Class name is required'
    };
  }

  console.log('创建班级:', classData);

  const requestData = {
    parentId: classData.parentId || 101,
    deptName: classData.name.trim(),
    orderNum: classData.orderNum || 0
  };

  const apiCall = request({
    url: '/system/dept',
    method: 'post',
    data: requestData,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return handleApiResponse(apiCall, '创建班级');
};

/**
 * 根据ID获取班级详情（使用部门接口）
 * @param {string|number} classId 班级ID
 * @returns {Promise<Object>} 标准化响应
 */
export const getClassById = async (classId) => {
  if (!classId) {
    return {
      code: 400,
      message: '班级ID不能为空',
      data: null,
      error: 'Class ID is required'
    };
  }

  console.log(`获取班级详情: ${classId}`);

  const apiCall = request({
    url: `/system/dept/${classId}`,
    method: 'get',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return handleApiResponse(apiCall, '获取班级详情');
};

/**
 * 更新班级信息
 * @param {Object} classData 班级数据
 * @param {number} classData.id 班级ID
 * @param {string} classData.name 班级名称
 * @param {string} classData.remark 备注
 * @returns {Promise<Object>} 标准化响应
 */
export const updateClass = async (classData) => {
  if (!classData.id) {
    return {
      code: 400,
      message: '班级ID不能为空',
      data: null,
      error: 'Class ID is required for update'
    };
  }

  if (!classData.name?.trim()) {
    return {
      code: 400,
      message: '班级名称不能为空',
      data: null,
      error: 'Class name is required'
    };
  }

  console.log('更新班级:', classData);

  const apiCall = request({
    url: '/system/dept',
    method: 'put',
    data: classData,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return handleApiResponse(apiCall, '更新班级');
};

/**
 * 删除班级
 * @param {Array<number>|number} ids 要删除的班级ID数组或单个ID
 * @returns {Promise<Object>} 标准化响应
 */
export const deleteClasses = async (ids) => {
  // 处理单个ID和ID数组
  const idsArray = Array.isArray(ids) ? ids : [ids];

  if (idsArray.length === 0 || idsArray.some(id => !id)) {
    return {
      code: 400,
      message: '班级ID不能为空',
      data: null,
      error: 'Class IDs are required for deletion'
    };
  }

  console.log('删除班级:', idsArray);

  const idsString = idsArray.join(',');
  const apiCall = request({
    url: `/system/dept/${idsString}`,
    method: 'delete',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return handleApiResponse(apiCall, '删除班级');
};
  
