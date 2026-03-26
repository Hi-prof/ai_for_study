import request from './axios';
import { checkAuthInResponse } from '@/utils/apiResponseHandler';

/**
 * 会话管理相关API
 * 用于教师端课程详细页面的讨论模块
 */

const buildStandardSessionResponse = (checkedResponse) => {
  const standardResponse = {
    code: 200,
    message: checkedResponse.msg || checkedResponse.message || 'success',
    data: checkedResponse.data ?? checkedResponse
  };

  if (Array.isArray(checkedResponse.rows)) {
    standardResponse.total = checkedResponse.total ?? checkedResponse.rows.length;
    standardResponse.rows = checkedResponse.rows;
  } else if (Array.isArray(checkedResponse.data?.rows)) {
    standardResponse.total = checkedResponse.data.total ?? checkedResponse.total ?? checkedResponse.data.rows.length;
    standardResponse.rows = checkedResponse.data.rows;
  } else if (Array.isArray(checkedResponse.data)) {
    standardResponse.total = checkedResponse.total ?? checkedResponse.data.length;
    standardResponse.rows = checkedResponse.data;
  } else if (Array.isArray(checkedResponse)) {
    standardResponse.total = checkedResponse.length;
    standardResponse.rows = checkedResponse;
    standardResponse.data = checkedResponse;
  }

  return standardResponse;
};

const handleSessionApiResponse = async (apiCall, apiName) => {
  try {
    const response = await apiCall;
    console.log(`${apiName}成功:`, response);

    const checkedResponse = checkAuthInResponse(response, apiName);

    if (checkedResponse.code === 401) {
      return {
        code: 401,
        message: checkedResponse.msg || 'Token已过期，请重新登录',
        data: null
      };
    }

    const hasCode = Object.prototype.hasOwnProperty.call(checkedResponse || {}, 'code');
    const normalizedCode = hasCode ? Number(checkedResponse.code) : null;
    const isSuccessCode = !hasCode || normalizedCode === 200 || normalizedCode === 0;
    const isSuccess = checkedResponse?.success === true ||
      (checkedResponse?.success !== false && isSuccessCode);

    if (!isSuccess) {
      const errorResponse = {
        code: hasCode && Number.isFinite(normalizedCode) ? normalizedCode : 500,
        message: checkedResponse?.msg || checkedResponse?.message || `${apiName}失败`,
        data: checkedResponse?.data ?? null,
        error: checkedResponse
      };

      if (Array.isArray(checkedResponse?.rows)) {
        errorResponse.total = checkedResponse.total ?? checkedResponse.rows.length;
        errorResponse.rows = checkedResponse.rows;
      } else if (Array.isArray(checkedResponse?.data?.rows)) {
        errorResponse.total = checkedResponse.data.total ?? checkedResponse.total ?? checkedResponse.data.rows.length;
        errorResponse.rows = checkedResponse.data.rows;
      }

      return errorResponse;
    }

    return buildStandardSessionResponse(checkedResponse);
  } catch (error) {
    console.error(`${apiName}失败:`, error);
    return {
      code: error.response?.status || 500,
      message: error.response?.data?.message || error.message || `${apiName}失败`,
      data: null,
      error: error.response?.data || error.message
    };
  }
};

/**
 * 查询会话列表
 * @param {Object} queryParams - 查询参数
 * @param {string} queryParams.createBy - 创建者
 * @param {string} queryParams.createTime - 创建时间
 * @param {string} queryParams.updateBy - 更新者
 * @param {string} queryParams.updateTime - 更新时间
 * @param {string} queryParams.remark - 备注
 * @param {number} queryParams.id - 会话ID
 * @param {string} queryParams.name - 会话名，私聊无需名字
 * @param {number} queryParams.courseId - 课程ID
 * @returns {Promise<Object>} 会话列表响应数据
 */
export const getSessionList = (queryParams = {}) => {
  console.log('正在获取会话列表...', queryParams);

  // 构建查询参数，过滤掉空值
  const cleanParams = {};
  Object.keys(queryParams).forEach(key => {
    const value = queryParams[key];
    if (value !== null && value !== undefined && value !== '') {
      cleanParams[key] = value;
    }
  });

  console.log('清理后的查询参数:', cleanParams);

  const apiCall = request({
    url: '/core/session/list',
    method: 'get',
    params: cleanParams,
    // 使用表单编码格式，与接口文档保持一致
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return handleSessionApiResponse(apiCall, '获取会话列表');
};

/**
 * 创建新讨论
 * @param {Object} sessionData - 会话数据
 * @param {string} sessionData.name - 讨论名称
 * @param {string} sessionData.remark - 备注
 * @param {Array<number>} sessionData.memberIds - 会话成员ID列表
 * @param {number} sessionData.courseId - 课程ID（必须，用于课程相关会话）
 * @returns {Promise<Object>} 创建结果
 */
export const createSession = (sessionData) => {
  console.log('正在创建讨论...', sessionData);

  // 构建符合API文档要求的ChatSessionVo对象
  const chatSessionVo = {
    name: sessionData.name || '',
    remark: sessionData.remark || '',
    memberIds: sessionData.memberIds || [],
    courseId: sessionData.courseId || 0, // courseId 作为直接属性
    // 其他字段由后端自动填充
    createBy: '',
    createTime: '',
    updateBy: '',
    updateTime: '',
    params: sessionData.params || {},
    id: 0 // 新建讨论时ID为0
  };

  console.log('发送到API的ChatSessionVo对象:', chatSessionVo);

  const apiCall = request({
    url: '/core/session',
    method: 'post',
    data: chatSessionVo,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return handleSessionApiResponse(apiCall, '创建讨论');
};

/**
 * 更新会话信息
 * @param {Object} sessionData - 会话数据
 * @param {number} sessionData.id - 会话ID（必须）
 * @param {string} sessionData.name - 讨论名称
 * @param {string} sessionData.remark - 备注
 * @returns {Promise<Object>} 更新结果
 */
export const updateSession = (sessionData) => {
  console.log('正在更新会话...', sessionData);

  if (!sessionData.id) {
    console.error('更新会话失败: 会话ID不能为空');
    return Promise.reject(new Error('会话ID不能为空'));
  }

  // 构建符合API文档要求的ChatSession对象
  const chatSession = {
    id: sessionData.id,
    name: sessionData.name || '',
    remark: sessionData.remark || '',
    // 其他字段由后端自动填充或保持原值
    createBy: sessionData.createBy || '',
    createTime: sessionData.createTime || '',
    updateBy: sessionData.updateBy || '',
    updateTime: sessionData.updateTime || '',
    params: sessionData.params || {}
  };

  console.log('发送到API的ChatSession对象:', chatSession);

  const apiCall = request({
    url: '/core/session',
    method: 'put',
    data: chatSession,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return handleSessionApiResponse(apiCall, '更新会话');
};

/**
 * 删除会话
 * @param {number|Array<number>} sessionIds - 会话ID或ID数组
 * @returns {Promise<Object>} 删除结果
 */
export const deleteSession = (sessionIds) => {
  console.log('正在删除会话...', sessionIds);
  
  // 处理单个ID或ID数组
  const ids = Array.isArray(sessionIds) ? sessionIds.join(',') : sessionIds;
  
  const apiCall = request({
    url: `/core/session/${ids}`,
    method: 'delete'
  });

  return handleSessionApiResponse(apiCall, '删除会话');
};

/**
 * 获取会话详情
 * @param {number} sessionId - 会话ID
 * @returns {Promise<Object>} 会话详情
 */
export const getSessionDetail = (sessionId) => {
  console.log('正在获取会话详情...', sessionId);
  
  const apiCall = request({
    url: `/core/session/${sessionId}`,
    method: 'get'
  });

  return handleSessionApiResponse(apiCall, '获取会话详情');
};

/**
 * 根据课程ID获取会话列表
 * @param {number|string} courseId - 课程ID
 * @param {Object} additionalParams - 额外的查询参数
 * @returns {Promise<Object>} 会话列表响应数据
 */
export const getSessionListByCourse = (courseId, additionalParams = {}) => {
  console.log('正在根据课程ID获取会话列表...', courseId, additionalParams);

  // 尝试不同的参数格式，看看后端期望什么格式
  // 方案1: 直接传递courseId
  const queryParams = {
    courseId: courseId,
    ...additionalParams
  };

  console.log('构建的查询参数:', queryParams);
  console.log('最终请求URL将是: /core/session/list?courseId=' + courseId);

  const apiCall = request({
    url: '/core/session/list',
    method: 'get',
    params: queryParams,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return handleSessionApiResponse(apiCall, '获取课程会话列表');
};

/**
 * 搜索会话
 * @param {Object} searchParams - 搜索参数
 * @param {string} searchParams.keyword - 搜索关键词
 * @param {number} searchParams.courseId - 课程ID
 * @param {number} searchParams.pageNum - 页码
 * @param {number} searchParams.pageSize - 每页大小
 * @returns {Promise<Object>} 搜索结果
 */
export const searchSessions = (searchParams) => {
  console.log('正在搜索会话...', searchParams);

  return getSessionList(searchParams);
};

/**
 * 获取会话消息列表
 * @param {number} sessionId - 会话ID
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页大小
 * @returns {Promise<Object>} 消息列表响应数据
 */
export const getSessionMessages = (sessionId, params = {}) => {
  console.log('正在获取会话消息列表...', sessionId, params);

  const queryParams = {
    pageNum: params.pageNum || 1,
    pageSize: params.pageSize || 50,
    ...params
  };

  const apiCall = request({
    url: `/core/session/${sessionId}/messages`,
    method: 'get',
    params: queryParams
  });

  return handleSessionApiResponse(apiCall, '获取会话消息列表');
};

/**
 * 发送消息到会话
 * @param {number} sessionId - 会话ID
 * @param {Object} messageData - 消息数据
 * @param {string} messageData.content - 消息内容
 * @param {string} messageData.messageType - 消息类型 (text, image, file等)
 * @returns {Promise<Object>} 发送结果
 */
export const sendMessage = (sessionId, messageData) => {
  console.log('正在发送消息...', sessionId, messageData);

  const message = {
    content: messageData.content || '',
    messageType: messageData.messageType || 'text',
    sessionId: sessionId
  };

  const apiCall = request({
    url: `/core/session/${sessionId}/messages`,
    method: 'post',
    data: message,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return handleSessionApiResponse(apiCall, '发送消息');
};

/**
 * 删除消息
 * @param {number} sessionId - 会话ID
 * @param {number} messageId - 消息ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteMessage = (sessionId, messageId) => {
  console.log('正在删除消息...', sessionId, messageId);

  const apiCall = request({
    url: `/core/session/${sessionId}/messages/${messageId}`,
    method: 'delete'
  });

  return handleSessionApiResponse(apiCall, '删除消息');
};

/**
 * 获取会话参与者列表
 * @param {number} sessionId - 会话ID
 * @returns {Promise<Object>} 参与者列表
 */
export const getSessionParticipants = (sessionId) => {
  console.log('正在获取会话参与者列表...', sessionId);

  const apiCall = request({
    url: `/core/session/${sessionId}/participants`,
    method: 'get'
  });

  return handleSessionApiResponse(apiCall, '获取会话参与者列表');
};

/**
 * 根据会话ID获取会话成员信息
 * @param {number} sessionId - 会话ID
 * @param {string} [role] - 可选的角色过滤参数
 * @returns {Promise<Object>} 会话成员列表响应数据
 */
export const getSessionMembers = (sessionId, role = null) => {
  console.log('正在获取会话成员信息...', sessionId, role);

  const params = {};
  if (role) {
    params.role = role;
  }

  const apiCall = request({
    url: `/core/member/${sessionId}`,
    method: 'get',
    params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return handleSessionApiResponse(apiCall, '获取会话成员信息');
};
