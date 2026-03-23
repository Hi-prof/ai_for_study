/**
 * API响应处理工具
 * 用于统一处理API响应中的认证错误
 */
import { removeToken, removeUser } from '@/utils/auth';

/**
 * 处理401认证失败的统一逻辑
 * @param {Object} response - API响应对象
 * @param {string} apiName - API名称，用于日志记录
 */
const handle401Error = (response, apiName) => {
  console.error(`🚨 ${apiName}检测到401认证失败，token已过期`);
  console.error('错误信息:', response.msg);

  // 清除本地认证信息
  removeToken();
  removeUser();
  console.log('已清除本地认证信息');

  // 跳转到登录页
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    console.log('准备跳转到登录页，当前路径:', currentPath);
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
  }
};

/**
 * 检查API响应中的认证状态
 * @param {Object} response - API响应对象
 * @param {string} apiName - API名称，用于日志记录
 * @returns {Object} 处理后的响应对象
 */
export const checkAuthInResponse = (response, apiName = 'API') => {
  // 检查401认证失败
  if (response && response.code === 401) {
    handle401Error(response, apiName);

    // 返回错误状态，阻止后续处理
    return {
      total: 0,
      rows: [],
      code: 401,
      msg: response.msg || 'Token已过期，请重新登录'
    };
  }

  return response;
};

/**
 * 包装API调用，自动检查认证状态
 * @param {Promise} apiCall - API调用Promise
 * @param {string} apiName - API名称
 * @returns {Promise} 处理后的Promise
 */
export const wrapApiCall = (apiCall, apiName = 'API') => {
  return apiCall.then(response => checkAuthInResponse(response, apiName));
};
