import request from './axios';

/**
 * 节点API模块
 *
 * 重要说明：后端 /core/node/list 接口已启用分页功能
 * - 默认返回 pageSize=10 条数据
 * - 需要传递 pageNum 和 pageSize 参数控制分页
 *
 * 为保持向后兼容性，本模块的处理策略：
 * 1. getNodeList, getNodeListWithFilter, getChapterNodes 自动处理分页，获取所有数据
 * 2. 新增 getNodeListPaginated 函数，支持真正的分页查询
 * 3. 所有现有调用代码无需修改，继续正常工作
 */

/**
 * 获取节点详细信息
 * @param {string|number} nodeId 节点ID
 * @returns {Promise<Object>} 节点详细信息
 */
export const getNodeDetail = (nodeId) => {
  console.log(`正在获取节点详细信息: ${nodeId}`);
  return request({
    url: `core/node/${nodeId}`,
    method: 'get'
  }).then(response => {
    console.log(`获取节点详细信息成功:`, response);
    return response;
  }).catch(error => {
    console.error(`获取节点详细信息失败: ${nodeId}`, error);
    return Promise.reject(error);
  });
};

/**
 * 获取知识图谱节点列表（自动处理分页，获取所有数据）
 * @param {string} graphId 图谱ID
 * @returns {Promise<Object>} 节点列表
 */
export const getNodeList = async (graphId) => {
  try {
    let allRows = [];
    let pageNum = 1;
    const pageSize = 100; // 使用较大的页面大小减少请求次数
    let hasMoreData = true;

    while (hasMoreData) {
      const response = await request({
        url: `core/node/list`,
        method: 'get',
        params: {
          graphId: graphId,
          pageNum: pageNum,
          pageSize: pageSize
        }
      });

      // 处理响应数据
      let currentRows = [];
      if (response && response.rows && Array.isArray(response.rows)) {
        currentRows = response.rows;
      } else if (Array.isArray(response)) {
        currentRows = response;
      }

      // 添加到总结果中
      allRows = allRows.concat(currentRows);

      // 判断是否还有更多数据
      if (currentRows.length < pageSize) {
        // 当前页数据少于页面大小，说明已经是最后一页
        hasMoreData = false;
      } else {
        // 继续获取下一页
        pageNum++;
      }

      // 安全检查：防止无限循环
      if (pageNum > 100) {
        console.warn(`获取节点列表时页数超过100页，可能存在问题，图谱ID: ${graphId}`);
        break;
      }
    }

    console.log(`获取节点列表完成，图谱ID: ${graphId}，总数据量: ${allRows.length}`);

    return {
      rows: allRows,
      total: allRows.length
    };
  } catch (error) {
    console.error(`获取节点列表失败: ${graphId}`, error);
    return Promise.reject(error);
  }
};

/**
 * 获取节点表列表（完整参数支持，自动处理分页）
 * 根据API文档 /core/node/list 接口实现
 * @param {Object} zstpNode 节点实体查询参数
 * @param {string} [zstpNode.createBy] 创建者
 * @param {string} [zstpNode.createTime] 创建时间
 * @param {string} [zstpNode.updateBy] 更新者
 * @param {string} [zstpNode.updateTime] 更新时间
 * @param {string} [zstpNode.remark] 备注
 * @param {Object} [zstpNode.params] 参数对象
 * @param {number} [zstpNode.id] 节点ID
 * @param {number} [zstpNode.parentId] 该节点所属的父节点，为null则为根节点
 * @param {number} [zstpNode.graphId] 该节点所属的图谱
 * @param {string} [zstpNode.name] 节点名称
 * @param {string} [zstpNode.content] 节点内容
 * @param {boolean} [zstpNode._getAllPages] 内部参数：是否获取所有页面数据
 * @returns {Promise<Object>} 返回TableDataInfo格式的节点列表数据
 */
export const getNodeListWithFilter = async (zstpNode = {}) => {
  console.log('正在获取节点表列表，查询参数:', zstpNode);

  try {
    // 构建查询参数，过滤掉undefined和null值
    const baseParams = {};
    Object.keys(zstpNode).forEach(key => {
      if (key !== '_getAllPages' && zstpNode[key] !== undefined && zstpNode[key] !== null) {
        baseParams[key] = zstpNode[key];
      }
    });

    // 检查是否需要获取所有页面数据（默认为true，保持向后兼容）
    const getAllPages = zstpNode._getAllPages !== false;

    if (!getAllPages) {
      // 如果不需要获取所有页面，使用原有逻辑（单页查询）
      const params = {
        ...baseParams,
        pageNum: baseParams.pageNum || 1,
        pageSize: baseParams.pageSize || 10
      };

      const response = await request({
        url: 'core/node/list',
        method: 'get',
        params: params
      });

      console.log('获取节点表列表成功（单页）:', response);

      if (response && typeof response === 'object') {
        return {
          total: response.total || 0,
          rows: response.rows || [],
          code: response.code || 200,
          msg: response.msg || 'success'
        };
      }

      return {
        total: 0,
        rows: [],
        code: 500,
        msg: '响应格式异常'
      };
    }

    // 获取所有页面数据
    let allRows = [];
    let pageNum = 1;
    const pageSize = 100;
    let totalCount = 0;
    let hasMoreData = true;

    while (hasMoreData) {
      const params = {
        ...baseParams,
        pageNum: pageNum,
        pageSize: pageSize
      };

      const response = await request({
        url: 'core/node/list',
        method: 'get',
        params: params
      });

      // 处理响应数据
      let currentRows = [];
      if (response && response.rows && Array.isArray(response.rows)) {
        currentRows = response.rows;
        totalCount = response.total || totalCount;
      }

      // 添加到总结果中
      allRows = allRows.concat(currentRows);

      // 判断是否还有更多数据
      if (currentRows.length < pageSize) {
        hasMoreData = false;
      } else {
        pageNum++;
      }

      // 安全检查：防止无限循环
      if (pageNum > 100) {
        console.warn('获取节点表列表时页数超过100页，可能存在问题');
        break;
      }
    }

    console.log(`获取节点表列表完成（全部页面），总数据量: ${allRows.length}`);

    return {
      total: totalCount || allRows.length,
      rows: allRows,
      code: 200,
      msg: 'success'
    };

  } catch (error) {
    console.error('获取节点表列表失败:', error);
    return Promise.reject(error);
  }
};

/**
 * 获取章节的子节点列表（自动处理分页，获取所有数据）
 * @param {string|number} parentId 父节点ID（章节ID），如果为null则获取所有节点
 * @param {string|number} graphId 图谱ID
 * @returns {Promise<Object>} 子节点列表
 */
export const getChapterNodes = async (parentId, graphId) => {
  console.log(`正在获取节点，父节点ID: ${parentId}，图谱ID: ${graphId}`);

  try {
    const baseParams = {
      graphId: graphId
    };

    // 如果指定了父节点ID，则只获取该父节点的直接子节点
    if (parentId !== null && parentId !== undefined) {
      baseParams.parentId = parentId;
    }

    let allRows = [];
    let pageNum = 1;
    const pageSize = 100;
    let hasMoreData = true;

    while (hasMoreData) {
      const params = {
        ...baseParams,
        pageNum: pageNum,
        pageSize: pageSize
      };

      const response = await request({
        url: 'core/node/list',
        method: 'get',
        params: params
      });

      // 处理响应数据
      let currentRows = [];
      if (response && response.rows && Array.isArray(response.rows)) {
        currentRows = response.rows;
      } else if (Array.isArray(response)) {
        currentRows = response;
      }

      // 添加到总结果中
      allRows = allRows.concat(currentRows);

      // 判断是否还有更多数据
      if (currentRows.length < pageSize) {
        hasMoreData = false;
      } else {
        pageNum++;
      }

      // 安全检查：防止无限循环
      if (pageNum > 100) {
        console.warn(`获取章节节点时页数超过100页，可能存在问题，父节点ID: ${parentId}, 图谱ID: ${graphId}`);
        break;
      }
    }

    console.log(`获取章节节点完成，父节点ID: ${parentId}，图谱ID: ${graphId}，总数据量: ${allRows.length}`);

    return {
      rows: allRows,
      total: allRows.length
    };

  } catch (error) {
    console.error(`获取节点失败:`, error);
    return Promise.reject(error);
  }
};

/**
 * 获取节点样式
 * @param {string} nodeId 节点ID
 * @returns {Promise<Object>} 节点样式
 */
export const getNodeStyle = (nodeId) => {
  return request({
    url: `core/style/${nodeId}`,
    method: 'get'
  }).then(response => {
    console.log(`获取节点样式:`, response);
    // 如果响应中有data字段，返回data，否则返回整个响应
    return response.data || response;
  }).catch(error => {
    console.error(`获取节点样式失败: ${nodeId}`, error);
    // 返回默认样式而不是抛出错误，避免影响整个图谱加载
    return {
      type: 'default',
      nodeShape: 0,
      nodeWidth: 120,
      nodeHeight: 40,
      borderWidth: 2,
      borderHeight: 2,
      color: '#4299e1',
      fontColor: '#333333'
    };
  });
};

/**
 * 获取节点连线
 * @param {string} nodeId 节点ID
 * @returns {Promise<Object>} 连线列表
 */
export const getNodeLines = (nodeId) => {
  return request({
    url: `core/line/list`,
    method: 'get',
    params: {
      nodeId: nodeId
    }
  }).then(response => {
    console.log(`获取节点线条:`, response);
    // 确保返回数组格式
    if (response && response.rows) {
      return response.rows;
    } else if (Array.isArray(response)) {
      return response;
    } else {
      return [];
    }
  }).catch(error => {
    console.error(`获取节点线条失败: ${nodeId}`, error);
    // 返回空数组而不是抛出错误，避免影响整个图谱加载
    return [];
  });
};

/**
 * 创建节点
 * @param {Object} node 节点数据
 * @returns {Promise<Object>} 创建结果，response.data 包含新创建节点的ID
 */
export const createNode = (node) => {
  console.log('创建节点，请求数据:', node);

  return request({
    url: '/core/node',
    method: 'post',
    data: node,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    console.log('创建节点成功，新节点ID:', response.data, '完整响应:', response);
    return response;
  }).catch(error => {
    console.error('创建节点失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 创建章节子节点
 * @param {Object} nodeData 节点数据
 * @param {string|number} nodeData.parentId 父节点ID（章节ID）
 * @param {string|number} nodeData.graphId 图谱ID
 * @param {string} nodeData.name 节点名称
 * @param {string} nodeData.content 节点内容
 * @returns {Promise<Object>} 创建结果，response.data 包含新创建节点的ID
 */
export const createChapterNode = (nodeData) => {
  // 构建符合接口要求的请求数据
  const requestData = {
    parentId: nodeData.parentId,
    graphId: nodeData.graphId,
    name: nodeData.name,
    content: nodeData.content || '',
    remark: nodeData.remark || '章节子节点'
  };

  // 如果传递了courseId，也包含在请求数据中
  if (nodeData.courseId) {
    requestData.courseId = nodeData.courseId;
  }

  console.log('创建章节子节点，请求数据:', requestData);

  return request({
    url: '/core/node',
    method: 'post',
    data: requestData,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    console.log('创建章节子节点成功，新节点ID:', response.data, '完整响应:', response);
    return response;
  }).catch(error => {
    console.error('创建章节子节点失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 更新节点
 * @param {Object} node 节点数据
 * @returns {Promise<Object>} 更新结果
 */
export const updateNode = (node) => {
  console.log('更新节点，请求数据:', node);

  return request({
    url: '/core/node',
    method: 'put',
    data: node,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    console.log('更新节点成功:', response);
    return response;
  }).catch(error => {
    console.error('更新节点失败:', error);
    console.error('请求数据:', node);
    console.error('错误详情:', error.response?.data || error.message);
    return Promise.reject(error);
  });
};

/**
 * 更新章节子节点
 * @param {Object} nodeData 节点数据
 * @returns {Promise<Object>} 更新结果
 */
export const updateChapterNode = (nodeData) => {
  console.log('更新章节子节点:', nodeData);

  if (!nodeData.id) {
    throw new Error('更新节点时ID不能为空');
  }

  return request({
    url: '/core/node',
    method: 'put',
    data: nodeData,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    console.log('更新章节子节点成功:', response);
    return response;
  }).catch(error => {
    console.error('更新章节子节点失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 删除节点
 * @param {string} nodeId 节点ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteNode = (nodeId) => {
  if (!nodeId) {
    throw new Error('删除节点时ID不能为空');
  }

  return request({
    url: `/core/node/${nodeId}`,
    method: 'delete'
  }).then(response => {
    return response;
  }).catch(error => {
    console.error(`删除节点 ${nodeId} 失败:`, error);
    return Promise.reject(error);
  });
};

/**
 * 保存节点数据
 * @param {Object} nodeData 节点数据
 * @returns {Promise<Object>} 保存结果，response.data 包含新创建节点的ID（如果是新建节点）
 */
export const saveNode = (nodeData) => {
  return request({
    url: '/core/node',
    method: 'post',
    data: nodeData
  }).then(response => {
    console.log('保存节点成功，节点ID:', response.data, '完整响应:', response);
    return response;
  }).catch(error => {
    console.error('保存节点失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 保存节点样式
 * @param {Object} styleData 样式数据
 * @returns {Promise<Object>} 保存结果
 */
export const saveNodeStyle = (styleData) => {
  return request({
    url: '/core/style',
    method: 'post',
    data: styleData
  }).then(response => {
    console.log('保存样式成功:', response);
    return response;
  }).catch(error => {
    console.error('保存样式失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 获取大纲节点关联的知识点
 * @param {string} courseId 知识图谱ID
 * @param {string} nodeId 大纲节点ID
 * @returns {Promise<Array>} 关联的知识点列表
 */
export const getKnowledgeNodesForOutlineNode = (courseId, nodeId) => {
  console.log(`获取大纲节点关联的知识点: 知识图谱${courseId}, 节点${nodeId}`);
  return request({
    url: `/api/outline/courses/${courseId}/outline-nodes/${nodeId}/knowledge-nodes`,
    method: 'get'
  }).then(response => {
    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    }
    return response || [];
  }).catch(error => {
    console.error(`获取大纲节点关联的知识点失败: 知识图谱${courseId}, 节点${nodeId}`, error);
    return [];
  });
};

/**
 * 获取知识点关联的大纲节点
 * @param {string} nodeId 知识点ID
 * @returns {Promise<Array>} 关联的大纲节点列表
 */
export const getOutlineNodesForKnowledgeNode = (nodeId) => {
  console.log(`获取知识点关联的大纲节点: 知识点${nodeId}`);
  return request({
    url: `/api/graph/knowledge-nodes/${nodeId}/outline-nodes`,
    method: 'get'
  }).then(response => {
    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    }
    return response || [];
  }).catch(error => {
    console.error(`获取知识点关联的大纲节点失败: 知识点${nodeId}`, error);
    return [];
  });
};

/**
 * 获取节点列表（支持分页）
 * @param {Object} params 查询参数
 * @param {string} [params.graphId] 图谱ID
 * @param {number} [params.parentId] 父节点ID
 * @param {number} [params.pageNum] 页码，默认1
 * @param {number} [params.pageSize] 页面大小，默认10
 * @returns {Promise<Object>} 分页的节点列表数据
 */
export const getNodeListPaginated = async (params = {}) => {
  console.log('正在获取节点列表（分页）:', params);

  const queryParams = {
    pageNum: 1,
    pageSize: 10,
    ...params
  };

  try {
    const response = await request({
      url: 'core/node/list',
      method: 'get',
      params: queryParams
    });

    console.log('获取节点列表（分页）成功:', response);

    if (response && typeof response === 'object') {
      return {
        total: response.total || 0,
        rows: response.rows || [],
        code: response.code || 200,
        msg: response.msg || 'success',
        pageNum: queryParams.pageNum,
        pageSize: queryParams.pageSize
      };
    }

    return {
      total: 0,
      rows: [],
      code: 500,
      msg: '响应格式异常',
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize
    };

  } catch (error) {
    console.error('获取节点列表（分页）失败:', error);
    return Promise.reject(error);
  }
};

// 知识图谱相关的函数别名 - 更明确的命名
export const getKnowledgeGraphNodes = getNodeList;
