import request from './axios';

/**
 * 消息管理相关API
 * 用于聊天讨论功能
 */

/**
 * 查询消息列表
 * @param {Object} queryParams - 查询参数
 * @param {string} queryParams.createBy - 创建者
 * @param {string} queryParams.createTime - 创建时间
 * @param {string} queryParams.updateBy - 更新者
 * @param {string} queryParams.updateTime - 更新时间
 * @param {string} queryParams.remark - 备注
 * @param {Object} queryParams.params - 其他参数
 * @param {number} queryParams.id - 消息ID
 * @param {number} queryParams.sessionId - 所在会话ID
 * @param {string} queryParams.content - 消息内容
 * @param {string} queryParams.contentType - 消息类型 ('text','image','video','other','audio')
 * @param {string} queryParams.fileId - 消息文件ID
 * @returns {Promise<Object>} 消息列表响应数据
 */
export const getMessageList = (queryParams = {}) => {
  console.log('正在获取消息列表...', queryParams);
  
  // 构建查询参数，过滤掉空值
  const cleanParams = {};
  Object.keys(queryParams).forEach(key => {
    const value = queryParams[key];
    if (value !== null && value !== undefined && value !== '') {
      cleanParams[key] = value;
    }
  });

  console.log('清理后的查询参数:', cleanParams);

  return request({
    url: '/core/message/list',
    method: 'get',
    params: cleanParams,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(response => {
    console.log('获取消息列表API原始响应:', response);
    return response;
  }).catch(error => {
    console.error('获取消息列表失败:', error);
    throw error;
  });
};

/**
 * 根据会话ID获取消息列表
 * @param {number|string} sessionId - 会话ID
 * @param {Object} additionalParams - 额外的查询参数
 * @returns {Promise<Object>} 消息列表响应数据
 */
export const getMessagesBySessionId = (sessionId, additionalParams = {}) => {
  console.log('正在根据会话ID获取消息列表...', sessionId, additionalParams);
  
  if (!sessionId) {
    console.error('会话ID不能为空');
    return Promise.reject(new Error('会话ID不能为空'));
  }
  
  const queryParams = {
    sessionId: sessionId,
    ...additionalParams
  };
  
  console.log('构建的查询参数:', queryParams);
  console.log('最终请求URL将是: /core/message/list?sessionId=' + sessionId);
  
  return request({
    url: '/core/message/list',
    method: 'get',
    params: queryParams,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(response => {
    console.log('获取会话消息列表成功:', response);
    return response;
  }).catch(error => {
    console.error('获取会话消息列表失败:', error);
    console.error('错误详情:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      params: error.config?.params
    });
    throw error;
  });
};

/**
 * 发送消息
 * @param {Object} messageData - 消息数据
 * @param {number} messageData.sessionId - 会话ID
 * @param {string} messageData.content - 消息内容
 * @param {string} messageData.contentType - 消息类型，默认为'text'
 * @param {string} messageData.fileId - 文件ID（可选）
 * @param {string} messageData.remark - 备注（可选）
 * @returns {Promise<Object>} 发送结果
 */
export const sendMessage = (messageData) => {
  console.log('正在发送消息...', messageData);

  if (!messageData.sessionId) {
    console.error('发送消息失败: 会话ID不能为空');
    return Promise.reject(new Error('会话ID不能为空'));
  }

  if (!messageData.content && !messageData.fileId) {
    console.error('发送消息失败: 消息内容和文件ID不能同时为空');
    return Promise.reject(new Error('消息内容和文件ID不能同时为空'));
  }

  // 构建符合API文档要求的ChatMessages对象
  const chatMessage = {
    sessionId: messageData.sessionId,
    content: messageData.content || '',
    contentType: messageData.contentType || 'text',
    fileId: messageData.fileId || '',
    remark: messageData.remark || '',
    // 其他字段由后端自动填充
    createBy: '',
    createTime: '',
    updateBy: '',
    updateTime: '',
    params: messageData.params || {},
    id: 0 // 新建消息时ID为0
  };

  console.log('发送到API的ChatMessage对象:', chatMessage);

  return request({
    url: '/core/message',
    method: 'post',
    data: chatMessage,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    console.log('发送消息成功:', response);
    return response;
  }).catch(error => {
    console.error('发送消息失败:', error);
    throw error;
  });
};

/**
 * 删除消息
 * @param {number|Array<number>} messageIds - 消息ID或ID数组
 * @returns {Promise<Object>} 删除结果
 */
export const deleteMessage = (messageIds) => {
  console.log('正在删除消息...', messageIds);
  
  // 处理单个ID或ID数组
  const ids = Array.isArray(messageIds) ? messageIds.join(',') : messageIds;
  
  return request({
    url: `/core/message/${ids}`,
    method: 'delete'
  }).then(response => {
    console.log('删除消息成功:', response);
    return response;
  }).catch(error => {
    console.error('删除消息失败:', error);
    throw error;
  });
};

/**
 * 获取消息详情
 * @param {number} messageId - 消息ID
 * @returns {Promise<Object>} 消息详情
 */
export const getMessageDetail = (messageId) => {
  console.log('正在获取消息详情...', messageId);

  if (!messageId) {
    console.error('获取消息详情失败: 消息ID不能为空');
    return Promise.reject(new Error('消息ID不能为空'));
  }

  return request({
    url: `/core/message/${messageId}`,
    method: 'get',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(response => {
    console.log('获取消息详情API原始响应:', response);

    // 根据API文档，响应格式为AjaxResult: {error, success, warn, empty}
    if (response && typeof response === 'object') {
      // 检查AjaxResult格式的响应
      if (response.hasOwnProperty('success')) {
        if (response.success === true && !response.error) {
          // 成功获取消息详情
          console.log('获取消息详情成功:', response);
          return response;
        } else if (response.error === true) {
          // 请求出错
          const errorMsg = response.msg || response.message || '获取消息详情失败';
          console.error('获取消息详情失败:', errorMsg);
          throw new Error(errorMsg);
        } else if (response.warn === true) {
          // 警告信息
          console.warn('获取消息详情警告:', response.msg || response.message);
          return response;
        } else if (response.empty === true) {
          // 空结果
          console.warn('消息详情为空');
          return response;
        }
      }

      // 如果不是标准的AjaxResult格式，但有数据，直接返回
      if (response.data || response.code === 200) {
        console.log('获取消息详情成功（非标准格式）:', response);
        return response;
      }
    }

    // 如果响应格式不符合预期
    console.warn('获取消息详情响应格式异常:', response);
    return response;

  }).catch(error => {
    console.error('获取消息详情失败:', error);
    console.error('错误详情:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      messageId: messageId
    });

    // 提供更友好的错误信息
    if (error.response?.status === 404) {
      throw new Error(`消息不存在 (ID: ${messageId})`);
    } else if (error.response?.status === 403) {
      throw new Error('没有权限查看此消息');
    } else if (error.response?.status === 400) {
      throw new Error('消息ID格式错误');
    } else {
      throw error;
    }
  });
};

/**
 * 更新消息
 * @param {Object} messageData - 消息数据
 * @param {number} messageData.id - 消息ID（必须）
 * @param {string} messageData.content - 消息内容
 * @param {string} messageData.contentType - 消息类型
 * @param {string} messageData.fileId - 文件ID
 * @param {string} messageData.remark - 备注
 * @returns {Promise<Object>} 更新结果
 */
export const updateMessage = (messageData) => {
  console.log('正在更新消息...', messageData);

  if (!messageData.id) {
    console.error('更新消息失败: 消息ID不能为空');
    return Promise.reject(new Error('消息ID不能为空'));
  }

  // 构建符合API文档要求的ChatMessage对象
  const chatMessage = {
    id: messageData.id,
    sessionId: messageData.sessionId || 0,
    content: messageData.content || '',
    contentType: messageData.contentType || 'text',
    fileId: messageData.fileId || '',
    remark: messageData.remark || '',
    // 其他字段由后端自动填充或保持原值
    createBy: messageData.createBy || '',
    createTime: messageData.createTime || '',
    updateBy: messageData.updateBy || '',
    updateTime: messageData.updateTime || '',
    params: messageData.params || {}
  };

  console.log('发送到API的ChatMessage对象:', chatMessage);

  return request({
    url: '/core/message',
    method: 'put',
    data: chatMessage,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    console.log('更新消息成功:', response);
    return response;
  }).catch(error => {
    console.error('更新消息失败:', error);
    throw error;
  });
};

/**
 * 搜索消息
 * @param {Object} searchParams - 搜索参数
 * @param {string} searchParams.keyword - 搜索关键词
 * @param {number} searchParams.sessionId - 会话ID
 * @param {string} searchParams.contentType - 消息类型
 * @param {number} searchParams.pageNum - 页码
 * @param {number} searchParams.pageSize - 每页大小
 * @returns {Promise<Object>} 搜索结果
 */
export const searchMessages = (searchParams) => {
  console.log('正在搜索消息...', searchParams);

  return getMessageList(searchParams);
};

/**
 * 批量标记消息为已读
 * @param {Array<number>} messageIds - 消息ID数组
 * @param {number} sessionId - 会话ID
 * @returns {Promise<Object>} 标记结果
 */
export const markMessagesAsRead = (messageIds, sessionId) => {
  console.log('正在标记消息为已读...', messageIds, sessionId);

  const data = {
    messageIds: messageIds,
    sessionId: sessionId
  };

  return request({
    url: '/core/message/markAsRead',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    console.log('标记消息为已读成功:', response);
    return response;
  }).catch(error => {
    console.error('标记消息为已读失败:', error);
    throw error;
  });
};
