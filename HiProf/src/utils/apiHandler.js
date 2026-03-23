import { checkAuthInResponse } from '@/utils/apiResponseHandler';
import request from '@/api/axios';

/**
 * 标准API响应处理器
 * 统一处理所有API调用的响应格式
 * @param {Promise} apiCall - API调用Promise
 * @param {string} apiName - API名称
 * @returns {Promise<Object>} 标准化响应
 */
export const handleApiResponse = async (apiCall, apiName) => {
  try {
    const response = await apiCall;
    console.log(`${apiName}成功:`, response);

    // 检查认证状态
    const checkedResponse = checkAuthInResponse(response, apiName);

    // 401错误直接返回
    if (checkedResponse.code === 401) {
      return {
        code: 401,
        message: checkedResponse.msg || 'Token已过期，请重新登录',
        data: null
      };
    }

    if (typeof checkedResponse?.code === 'number' && checkedResponse.code !== 200) {
      return {
        code: checkedResponse.code,
        message: checkedResponse.msg || checkedResponse.message || `${apiName}失败`,
        data: checkedResponse.data || null,
        error: checkedResponse
      };
    }

    // 标准化成功响应
    const standardResponse = {
      code: 200,
      message: checkedResponse.msg || 'success',
      data: checkedResponse.data || checkedResponse
    };

    // 保持列表API的兼容性
    if (checkedResponse.rows && Array.isArray(checkedResponse.rows)) {
      // 如果原响应有rows字段，保持原格式
      standardResponse.total = checkedResponse.total || 0;
      standardResponse.rows = checkedResponse.rows;
    } else if (Array.isArray(checkedResponse.data)) {
      // 如果data是数组，添加rows字段以保持兼容性
      standardResponse.total = checkedResponse.data.length;
      standardResponse.rows = checkedResponse.data;
    } else if (Array.isArray(checkedResponse)) {
      // 如果直接返回数组，添加rows字段
      standardResponse.total = checkedResponse.length;
      standardResponse.rows = checkedResponse;
      standardResponse.data = checkedResponse;
    }

    return standardResponse;
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
 * 创建标准化的API函数
 * @param {string} url - API URL
 * @param {string} method - HTTP方法
 * @param {string} apiName - API名称
 * @returns {Function} 标准化的API函数
 */
export const createApiFunction = (url, method, apiName) => {
  return async (data = {}, config = {}) => {
    // 使用静态导入的request，避免动态导入混乱
    const apiCall = request({
      url,
      method: method.toLowerCase(),
      ...(method.toLowerCase() === 'get' ? { params: data } : { data }),
      ...config
    });

    return handleApiResponse(apiCall, apiName);
  };
};

/**
 * 验证必需参数
 * @param {Object} data - 数据对象
 * @param {Array<string>} requiredFields - 必需字段数组
 * @returns {Object|null} 如果验证失败返回错误对象，否则返回null
 */
export const validateRequired = (data, requiredFields) => {
  for (const field of requiredFields) {
    if (!data[field]) {
      return {
        code: 400,
        message: `${field}不能为空`,
        data: null,
        error: `${field} is required`
      };
    }
  }
  return null;
};

/**
 * 创建CRUD API函数集合
 * @param {string} baseUrl - 基础URL
 * @param {string} entityName - 实体名称
 * @param {Array<string>} createRequiredFields - 创建时必需的字段
 * @param {Array<string>} updateRequiredFields - 更新时必需的字段
 * @returns {Object} CRUD函数集合
 */
export const createCrudApi = (baseUrl, entityName, createRequiredFields = [], updateRequiredFields = ['id']) => {
  return {
    // 获取列表
    getList: async (params = {}) => {
      const apiCall = request({
        url: `${baseUrl}/list`,
        method: 'get',
        params
      });
      return handleApiResponse(apiCall, `获取${entityName}列表`);
    },

    // 根据ID获取详情
    getById: async (id) => {
      const validation = validateRequired({ id }, ['id']);
      if (validation) return validation;

      const apiCall = request({
        url: `${baseUrl}/${id}`,
        method: 'get'
      });
      return handleApiResponse(apiCall, `获取${entityName}详情`);
    },

    // 创建
    create: async (data) => {
      const validation = validateRequired(data, createRequiredFields);
      if (validation) return validation;

      const apiCall = request({
        url: baseUrl,
        method: 'post',
        data,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return handleApiResponse(apiCall, `创建${entityName}`);
    },

    // 更新
    update: async (data) => {
      const validation = validateRequired(data, updateRequiredFields);
      if (validation) return validation;

      const apiCall = request({
        url: baseUrl,
        method: 'put',
        data,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return handleApiResponse(apiCall, `更新${entityName}`);
    },

    // 删除
    delete: async (ids) => {
      const idsArray = Array.isArray(ids) ? ids : [ids];
      const validIds = idsArray.filter(id => id);

      if (validIds.length === 0) {
        return {
          code: 400,
          message: `${entityName}ID不能为空`,
          data: null,
          error: 'IDs are required for deletion'
        };
      }

      const idsParam = validIds.join(',');
      const apiCall = request({
        url: `${baseUrl}/${idsParam}`,
        method: 'delete'
      });
      return handleApiResponse(apiCall, `删除${entityName}`);
    }
  };
};
