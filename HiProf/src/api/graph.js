import request from './axios';

// 导入节点相关的接口函数
import {
  getNodeList,
  getChapterNodes,
  getNodeStyle,
  getNodeLines,
  createNode,
  createChapterNode,
  updateNode,
  updateChapterNode,
  deleteNode,
  saveNode,
  saveNodeStyle,
  getKnowledgeNodesForOutlineNode,
  getOutlineNodesForKnowledgeNode,
  getKnowledgeGraphNodes
} from './node';

/**
 * 通用数据提取函数 - 从各种可能的响应格式中提取数组数据
 * @param {*} response 响应数据
 * @param {string} context 上下文信息，用于日志
 * @returns {Array} 提取的数组数据
 */
const extractArrayFromResponse = (response, context = '数据') => {
  console.log(`开始提取${context}:`, response);

  if (!response) {
    console.warn(`${context}为空`);
    return [];
  }

  // 如果直接是数组
  if (Array.isArray(response)) {
    console.log(`${context}直接是数组格式，长度:`, response.length);
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
        console.log(`从${field}字段提取到${context}，长度:`, response[field].length);
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
 * 校验业务响应是否成功
 * 后端有些接口即使业务失败也会返回 HTTP 200，这里统一兜底
 * @param {*} response 响应数据
 * @param {string} fallbackMessage 默认错误信息
 * @returns {*} 原始响应
 */
const ensureSuccessfulResponse = (response, fallbackMessage = '接口请求失败') => {
  if (!response || typeof response !== 'object') {
    return response;
  }

  const hasCode = response.code !== undefined && response.code !== null && response.code !== '';
  const isSuccessCode = response.code === 200 || response.code === '200';
  const isBusinessFailed = response.error === true || response.success === false || (hasCode && !isSuccessCode);

  if (isBusinessFailed) {
    const error = new Error(response.msg || response.message || fallbackMessage);
    error.response = { data: response };
    error.businessResponse = response;
    throw error;
  }

  return response;
};

/**
 * 获取知识图谱列表
 * @returns {Promise<Array>} 图谱列表
 */
export const getGraphList = () => {
  return request({
    url: '/core/zstp/list',
    method: 'get',
    params: {
      pageNum: 1,
      pageSize: 100 // 增加默认获取数量到100个
    }
  }).then(response => {
    ensureSuccessfulResponse(response, '获取知识图谱列表失败');

    if (Array.isArray(response?.rows)) {
      return {
        rows: response.rows,
        total: response.total ?? response.rows.length,
        originalResponse: response
      };
    }

    // 使用通用提取函数获取数组数据
    const extractedData = extractArrayFromResponse(response, '知识图谱列表');

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
    console.error('获取知识图谱列表失败:', error);
    throw error;
  });
};

/**
 * 获取知识图谱详细信息
 * @param {string|number} id 知识图谱ID
 * @returns {Promise<Object>} 知识图谱详细信息
 * @description 根据API文档 GET /core/zstp/{id} 获取指定ID的知识图谱详细信息
 */
export const getGraph = (id) => {
  console.log(`正在获取知识图谱详细信息: ${id}`);

  if (!id) {
    console.error('获取知识图谱详细信息失败: ID不能为空');
    return Promise.reject(new Error('知识图谱ID不能为空'));
  }

  return request({
    url: `/core/zstp/${id}`,
    method: 'get'
  }).then(response => {
    console.log(`获取知识图谱${id}详细信息成功:`, response);

    // 根据API文档，响应包含 error, success, warn, empty 字段
    if (response && typeof response === 'object') {
      if (response.error === true) {
        console.error('API返回错误状态:', response);
        throw new Error('获取知识图谱详细信息失败');
      }

      if (response.success === true) {
        console.log('API返回成功状态');
        return response;
      }
    }

    // 如果响应格式不符合预期，仍然返回原始响应
    console.warn('响应格式不符合API文档预期:', response);
    return response;
  }).catch(error => {
    console.error(`获取知识图谱${id}详细信息失败:`, error);
    return Promise.reject(error);
  });
};



/**
 * 创建新的知识图谱
 * @param {Object} graphData 图谱数据
 * @returns {Promise<Object>} 创建结果
 */
export const createGraph = (graphData) => {
  console.log('创建新知识图谱:', graphData);
  return request({
    url: '/core/zstp',
    method: 'post',
    data: graphData
  }).then(response => {
    console.log('创建知识图谱成功:', response);
    return response;
  }).catch(error => {
    console.error('创建知识图谱失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 更新知识图谱
 * @param {Object} graphData 图谱数据
 * @returns {Promise<Object>} 更新结果
 */
export const updateGraph = (graphData) => {
  console.log('更新知识图谱信息:', graphData);
  return request({
    url: `/core/zstp`,
    method: 'put',
    data: graphData
  }).then(response => {
    console.log('更新知识图谱成功:', response);
    return response;
  }).catch(error => {
    console.error('更新知识图谱失败:', error);
    return Promise.reject(error);
  });
};


/**
 * 删除知识图谱
 * @param {string} graphId 图谱ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteGraph = (graphId) => {
  console.log(`删除知识图谱: ${graphId}`);
  return request({
    url: `/core/zstp/${graphId}`,
    method: 'delete'
  }).then(response => {
    console.log(`删除知识图谱 ${graphId} 成功:`, response);
    return response;
  }).catch(error => {
    console.error(`删除知识图谱 ${graphId} 失败:`, error);
    return Promise.reject(error);
  });
};

/**
 * 获取知识图谱大纲
 * @param {string} courseId 知识图谱ID
 * @returns {Promise<Object>} 知识图谱大纲数据
 */
export const getCourseOutline = (courseId) => {
  console.log(`正在获取知识图谱大纲: ${courseId}`);
  return request({
    url: `/api/courses/${courseId}/outline`,
    method: 'get'
  }).then(response => {
    console.log(`获取知识图谱${courseId}大纲成功:`, response);
    // 处理嵌套的响应结构
    if (response && typeof response === 'object') {
      if (response.success && response.data) {
        console.log('从嵌套响应中提取大纲数据');
        return response.data;
      } else if (response.nodes || response.title) {
        return response;
      }
    }
    console.warn('响应格式不符合预期');
    return null;
  }).catch(error => {
    console.error(`获取知识图谱 ${courseId} 大纲失败:`, error);
    throw error;
  });
};





/**
 * 保存连线数据
 * @param {Object} lineData 连线数据
 * @returns {Promise<Object>} 保存结果
 */
export const saveLine = (lineData) => {
  return request({
    url: '/core/line',
    method: 'post',
    data: lineData
  }).then(response => {
    console.log('保存连线成功:', response);
    return response;
  }).catch(error => {
    console.error('保存连线失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 删除连线
 * @param {string} lineId 连线ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteLine = (lineId) => {
  return request({
    url: `/core/line/${lineId}`,
    method: 'delete'
  }).then(response => {
    console.log(`删除连线 ${lineId} 成功:`, response);
    return response;
  }).catch(error => {
    console.error(`删除连线 ${lineId} 失败:`, error);
    return Promise.reject(error);
  });
};



/**
 * 保存知识图谱数据
 * @param {string} courseId 知识图谱ID
 * @param {Object} data 知识图谱数据
 * @returns {Promise<Object>} 保存结果
 */
export const saveCourseGraph = (courseId, data) => {
  // 将前端格式转换为后端所需的数据结构
  const requestData = {
    graph: {
      id: data.graphId || courseId,
      name: data.name || '未命名图谱',
      content: data.content || ''
    },
    nodes: data.nodes.map(node => ({
      id: node.id && !node.id.includes('node') ? Number(node.id) : null, // 如果是新节点(id格式如'node1')则不发送id
      graph_id: data.graphId || courseId,
      parent_id: node.parentId ? Number(node.parentId) : null,
      name: node.text || '',
      content: node.content || ''
    })),
    lines: data.links.map(link => ({
      id: link.id && !link.id.includes('line') ? Number(link.id) : null,
      node_id: Number(link.from),
      target_id: Number(link.to),
      content: link.text || ''
    })),
    nodeStyles: data.nodes.map(node => ({
      node_id: Number(node.id),
      type: node.type || '',
      color: node.color || '',
      fontColor: node.fontColor || '',
      node_shape: node.nodeShape || 0,
      width: node.width || null,
      height: node.height || null,
      border_width: node.borderWidth || null,
      border_height: node.borderHeight || null,
      fixed: node.fixed || '',
      x: node.x || null,
      y: node.y || null
    }))
  };

  return request({
    url: `/api/graph/${courseId}`,
    method: 'post',
    data: requestData
  }).catch(error => {
    console.error(`保存知识图谱 ${courseId} 数据失败:`, error);
    return Promise.reject(error);
  });
};

/**
 * 保存知识图谱大纲
 * @param {string} courseId 知识图谱ID
 * @param {Object} data 大纲数据
 * @returns {Promise<Object>} 保存结果
 */
export const saveCourseOutline = (courseId, data) => {
  return request({
    url: `/api/courses/${courseId}/outline`,
    method: 'post',
    data
  }).catch(error => {
    console.error(`保存知识图谱 ${courseId} 大纲失败:`, error);
    return Promise.reject(error);
  });
};

/**
 * 从大纲创建知识图谱
 * @param {string} courseId 知识图谱ID
 * @returns {Promise<Object>} 知识图谱数据
 */
export const createGraphFromOutline = (courseId) => {
  console.log(`从大纲创建知识图谱: ${courseId}`);
  return request({
    url: `/api/outline/courses/${courseId}/outline-to-graph`,
    method: 'post'
  }).catch(error => {
    console.error(`从大纲创建知识图谱失败: ${courseId}`, error);
    return Promise.reject(error);
  });
};

/**
 * 从知识图谱更新大纲
 * @param {string} graphId 图谱ID
 * @returns {Promise<Object>} 更新结果
 */
export const updateOutlineFromGraph = (graphId) => {
  console.log(`从知识图谱更新大纲: ${graphId}`);
  return request({
    url: `/api/graph/graphs/${graphId}/graph-to-outline`,
    method: 'post'
  }).catch(error => {
    console.error(`从知识图谱更新大纲失败: ${graphId}`, error);
    return Promise.reject(error);
  });
};

/**
 * 同步节点映射关系
 * @param {string} courseId 知识图谱ID
 * @param {string} graphId 图谱ID
 * @returns {Promise<Object>} 同步结果
 */
export const syncNodeMappings = (courseId, graphId) => {
  console.log(`同步节点映射关系: 知识图谱${courseId}, 图谱${graphId}`);
  return request({
    url: `/api/graph/courses/${courseId}/graphs/${graphId}/sync-mappings`,
    method: 'post'
  }).catch(error => {
    console.error(`同步节点映射关系失败: 知识图谱${courseId}, 图谱${graphId}`, error);
    return Promise.reject(error);
  });
};



/**
 * 获取课程知识图谱列表
 * @param {string|number} courseId 课程ID
 * @returns {Promise<Object>} 知识图谱列表
 */
export const getCourseKnowledgeGraphList = (courseId) => {
  const params = {
    pageNum: 1,
    pageSize: 100,
    courseId: courseId,
    graphType: "0" // 知识图谱类型
  };

  return request({
    url: '/core/zstp/list',
    method: 'get',
    params
  }).then(response => {
    ensureSuccessfulResponse(response, `获取课程${courseId}知识图谱列表失败`);

    if (Array.isArray(response?.rows)) {
      return {
        rows: response.rows,
        total: response.total ?? response.rows.length,
        originalResponse: response
      };
    }

    // 使用通用提取函数获取数组数据
    const extractedData = extractArrayFromResponse(response, `课程${courseId}的知识图谱列表`);

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
    console.error(`获取课程${courseId}知识图谱列表失败:`, error);
    throw error;
  });
};

/**
 * 创建新的知识图谱
 * @param {Object} graphData 图谱数据
 * @param {string|number} graphData.courseId 课程ID
 * @param {string} graphData.name 图谱名称
 * @param {string} graphData.content 图谱内容（可选）
 * @param {string} graphData.remark 备注（可选）
 * @returns {Promise<Object>} 创建结果
 */
export const createKnowledgeGraph = (graphData) => {
  console.log('创建新知识图谱:', graphData);

  // 验证必填字段
  if (!graphData.courseId) {
    throw new Error('课程ID不能为空');
  }
  if (!graphData.name) {
    throw new Error('图谱名称不能为空');
  }

  // 构建请求数据
  const requestData = {
    ...graphData,
    graphType: "0" // 知识图谱类型
  };

  return request({
    url: '/core/zstp',
    method: 'post',
    data: requestData
  }).then(response => {
    ensureSuccessfulResponse(response, '创建知识图谱失败');
    console.log('创建知识图谱成功:', response);
    return response;
  }).catch(error => {
    console.error('创建知识图谱失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 更新知识图谱信息
 * @param {Object} graphData 图谱数据（必须包含id字段）
 * @returns {Promise<Object>} 更新结果
 */
export const updateKnowledgeGraph = (graphData) => {
  console.log('更新知识图谱信息:', graphData);

  if (!graphData.id) {
    throw new Error('更新时知识图谱ID不能为空');
  }

  return request({
    url: '/core/zstp',
    method: 'put',
    data: graphData
  }).then(response => {
    console.log('更新知识图谱成功:', response);
    return response;
  }).catch(error => {
    console.error('更新知识图谱失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 删除知识图谱
 * @param {string|number} graphId 知识图谱ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteKnowledgeGraph = (graphId) => {
  console.log('删除知识图谱:', graphId);

  if (!graphId) {
    throw new Error('删除时知识图谱ID不能为空');
  }

  return request({
    url: `/core/zstp/${graphId}`,
    method: 'delete'
  }).then(response => {
    console.log('删除知识图谱成功:', response);
    return response;
  }).catch(error => {
    console.error('删除知识图谱失败:', error);
    return Promise.reject(error);
  });
};

// 知识图谱相关的函数别名 - 更明确的命名
export const getKnowledgeGraphList = getGraphList;

// 重新导出节点相关的函数，保持向后兼容性
export {
  getNodeList,
  getChapterNodes,
  getNodeStyle,
  getNodeLines,
  createNode,
  createChapterNode,
  updateNode,
  updateChapterNode,
  deleteNode,
  saveNode,
  saveNodeStyle,
  getKnowledgeNodesForOutlineNode,
  getOutlineNodesForKnowledgeNode,
  getKnowledgeGraphNodes
};

export const generateKnowledgeGraphAndPersist = (payload, signal) => {
  return request({
    url: '/core/zstp/agent/generate',
    method: 'post',
    data: payload,
    signal,
    timeout: 600000
  }).then(response => {
    ensureSuccessfulResponse(response, '生成并保存知识图谱失败');
    return response;
  }).catch(error => {
    console.error('生成并保存知识图谱失败:', error);
    return Promise.reject(error);
  });
};

export const generateKnowledgeAgentDeepCard = (payload) => {
  return request({
    url: '/core/zstp/agent/deep-card',
    method: 'post',
    data: payload
  }).then(response => {
    ensureSuccessfulResponse(response, '生成知识点深卡片失败');
    return response;
  }).catch(error => {
    console.error('生成知识点深卡片失败:', error);
    return Promise.reject(error);
  });
};
