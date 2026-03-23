import request from './axios';

/**
 * 获取知识图谱大纲
 * @param {string} graphId 知识图谱ID
 * @returns {Promise<Object>} 大纲数据
 */
export const getOutline = (graphId) => {
  return request({
    url: `/api/graphs/${graphId}/outline`,
    method: 'get'
  });
};

/**
 * 保存知识图谱大纲
 * @param {string} graphId 知识图谱ID
 * @param {Object} data 大纲数据
 * @returns {Promise<Object>} 保存结果
 */
export const saveOutlineData = (graphId, data) => {
  return request({
    url: `/api/graphs/${graphId}/outline`,
    method: 'post',
    data
  });
};

/**
 * 导入知识图谱大纲
 * @param {string} graphId 知识图谱ID
 * @param {Object} importData 导入数据
 * @returns {Promise<Object>} 导入结果
 */
export const importOutline = (graphId, importData) => {
  return request({
    url: `/api/graphs/${graphId}/outline/import`,
    method: 'post',
    data: importData
  });
};

/**
 * 导出知识图谱大纲
 * @param {string} graphId 知识图谱ID
 * @param {string} format 导出格式，可选值：json, txt, md, docx
 * @returns {Promise<Blob>} 导出文件的Blob对象
 */
export const exportOutlineData = (graphId, format = 'json') => {
  return request({
    url: `/api/graphs/${graphId}/outline/export`,
    method: 'get',
    params: { format },
    responseType: 'blob'
  }).then(response => {
    // 创建下载链接
    const blob = new Blob([response], { type: getContentType(format) });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `知识图谱大纲_${graphId}_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return response;
  });
};

/**
 * 获取知识点详情
 * @param {string} graphId 知识图谱ID
 * @param {string} nodeId 知识点ID
 * @returns {Promise<Object>} 知识点详情
 */
export const getOutlineNode = (graphId, nodeId) => {
  return request({
    url: `/api/graphs/${graphId}/outline/nodes/${nodeId}`,
    method: 'get'
  });
};

/**
 * 更新知识点
 * @param {string} graphId 知识图谱ID
 * @param {string} nodeId 知识点ID
 * @param {Object} nodeData 知识点数据
 * @returns {Promise<Object>} 更新结果
 */
export const updateOutlineNode = (graphId, nodeId, nodeData) => {
  return request({
    url: `/api/graphs/${graphId}/outline/nodes/${nodeId}`,
    method: 'put',
    data: nodeData
  });
};

/**
 * 添加知识点
 * @param {string} graphId 知识图谱ID
 * @param {Object} nodeData 知识点数据
 * @returns {Promise<Object>} 添加结果
 */
export const addOutlineNode = (graphId, nodeData) => {
  return request({
    url: `/api/graphs/${graphId}/outline/nodes`,
    method: 'post',
    data: nodeData
  });
};

/**
 * 删除知识点
 * @param {string} graphId 知识图谱ID
 * @param {string} nodeId 知识点ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteOutlineNode = (graphId, nodeId) => {
  return request({
    url: `/api/graphs/${graphId}/outline/nodes/${nodeId}`,
    method: 'delete'
  });
};

/**
 * 移动知识点
 * @param {string} graphId 知识图谱ID
 * @param {string} nodeId 知识点ID
 * @param {string} targetParentId 目标父节点ID
 * @param {number} position 目标位置
 * @returns {Promise<Object>} 移动结果
 */
export const moveOutlineNode = (graphId, nodeId, targetParentId, position) => {
  return request({
    url: `/api/graphs/${graphId}/outline/nodes/${nodeId}/move`,
    method: 'post',
    data: {
      targetParentId,
      position
    }
  });
};

/**
 * 搜索知识点
 * @param {string} graphId 知识图谱ID
 * @param {string} keyword 搜索关键词
 * @returns {Promise<Array>} 搜索结果
 */
export const searchOutlineNodes = (graphId, keyword) => {
  return request({
    url: `/api/graphs/${graphId}/outline/search`,
    method: 'get',
    params: { keyword }
  });
};

/**
 * 获取内容类型
 * @param {string} format 文件格式
 * @returns {string} 内容类型
 */
const getContentType = (format) => {
  switch (format) {
    case 'json':
      return 'application/json';
    case 'txt':
      return 'text/plain';
    case 'md':
      return 'text/markdown';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'application/octet-stream';
  }
}; 