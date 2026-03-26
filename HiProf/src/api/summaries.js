import request from './axios';
import { handleApiResponse } from '@/utils/apiHandler';

/**
 * 获取分值统计表详细信息
 * @param {string|number} id 分值统计表ID
 * @returns {Promise<Object>} 标准化响应
 */
export const getSummaryById = async (id) => {


  console.log(`获取分值统计表详情: ${id}`);

  const apiCall = request({
    url: `/core/summaries/${id}`,
    method: 'get'
  });

  return handleApiResponse(apiCall, '获取分值统计表详情');
};

/**
 * 查询分值统计表列表
 * @param {Object} params 查询参数
 * @param {number} params.courseId 课程ID (必须)
 * @param {number} [params.studentId] 学生ID (可选)
 * @returns {Promise<Object>} 标准化响应
 */
export const getSummariesList = async (params = {}) => {


  console.log('获取分值统计表列表:', params);

  const apiCall = request({
    url: '/core/summaries/list',
    method: 'get',
    params
  });

  return handleApiResponse(apiCall, '获取分值统计表列表');
};

/**
 * 根据课程ID获取分值统计表列表（简化版本）
 * @param {number} courseId 课程ID
 * @param {number} [studentId] 学生ID (可选)
 * @returns {Promise<Object>} 标准化响应
 */
export const getSummariesByCourse = async (courseId, studentId = null) => {
  const params = { courseId };
  if (studentId) {
    params.studentId = studentId;
  }

  return getSummariesList(params);
};

/**
 * 根据学生ID和课程ID获取分值统计表列表
 * @param {number} courseId 课程ID
 * @param {number} studentId 学生ID
 * @returns {Promise<Object>} 标准化响应
 */
export const getSummariesByStudent = async (courseId, studentId) => {


  return getSummariesList({ courseId, studentId });
};

/**
 * 新增分值变更项目
 * @param {Object} itemData 分值变更项目数据
 * @param {number} itemData.courseId 所属课程ID
 * @param {string} itemData.itemName 项目名称(如:课堂表现、作业)
 * @param {string} itemData.itemType 变动类型(regular:常规（带小数点）,extra:额外(不带小数点),penalty:扣分（不带小数点）)
 * @param {number} itemData.itemWeight 权重系数
 * @param {number} itemData.maxScore 该项目最高分
 * @param {string} [itemData.remark] 备注
 * @returns {Promise<Object>} 标准化响应
 */
export const createScoreItem = async (itemData) => {
  console.log('新增分值变更项目:', itemData);

  const apiCall = request({
    url: '/core/items',
    method: 'post',
    data: itemData,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return handleApiResponse(apiCall, '新增分值变更项目');
};

/**
 * 查询分值变更项目列表
 * @param {Object} params 查询参数
 * @param {number} [params.courseId] 所属课程ID
 * @param {string} [params.itemName] 项目名称
 * @param {string} [params.itemType] 变动类型
 * @param {number} [params.itemWeight] 权重系数
 * @param {number} [params.maxScore] 该项目最高分
 * @returns {Promise<Object>} 标准化响应
 */
export const getScoreItemsList = async (params = {}) => {
  console.log('获取分值变更项目列表:', params);

  const apiCall = request({
    url: '/core/items/list',
    method: 'get',
    params
  });

  return handleApiResponse(apiCall, '获取分值变更项目列表');
};

/**
 * 根据课程ID获取分值变更项目列表
 * @param {number} courseId 课程ID
 * @returns {Promise<Object>} 标准化响应
 */
export const getScoreItemsByCourse = async (courseId) => {
  return getScoreItemsList({ courseId });
};

/**
 * 获取分值变更项目详情
 * @param {string|number} itemId 项目ID
 * @returns {Promise<Object>} 标准化响应
 */
export const getScoreItemById = async (itemId) => {
  console.log('获取分值变更项目详情:', itemId);

  const apiCall = request({
    url: `/core/items/${itemId}`,
    method: 'get'
  });

  return handleApiResponse(apiCall, '获取分值变更项目详情');
};


/**
 * 修改分值变更项目
 * @param {Object} itemData 分值变更项目数据
 * @param {number} itemData.id 项目ID (必须)
 * @returns {Promise<Object>} 标准化响应
 */
export const updateScoreItem = async (itemData) => {
  console.log('修改分值变更项目:', itemData);

  const apiCall = request({
    url: '/core/items',
    method: 'put',
    data: itemData,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return handleApiResponse(apiCall, '修改分值变更项目');
};

/**
 * 删除分值变更项目
 * @param {string|number} itemId 项目ID
 * @returns {Promise<Object>} 标准化响应
 */
export const deleteScoreItem = async (itemId) => {
  console.log('删除分值变更项目:', itemId);

  const apiCall = request({
    url: `/core/items/${itemId}`,
    method: 'delete'
  });

  return handleApiResponse(apiCall, '删除分值变更项目');
};

/**
 * 新增分值变更记录
 * @param {Object} recordData 分值变更记录数据
 * @param {number} recordData.itemId 所属分值变更项目ID
 * @param {number} recordData.studentId 所属学生ID
 * @param {number} recordData.courseId 所属课程ID
 * @param {number} recordData.score 得分值
 * @param {number} recordData.graderId 评分人
 * @param {string} [recordData.remark] 备注
 * @returns {Promise<Object>} 标准化响应
 */
export const createScoreRecord = async (recordData) => {
  console.log('新增分值变更记录:', recordData);

  const apiCall = request({
    url: '/core/records',
    method: 'post',
    data: recordData,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return handleApiResponse(apiCall, '新增分值变更记录');
};

/**
 * 查询分值变更记录列表
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 标准化响应
 */
export const getScoreRecordsList = async (params = {}) => {
  console.log('获取分值变更记录列表:', params);

  const apiCall = request({
    url: '/core/records/list',
    method: 'get',
    params
  });

  return handleApiResponse(apiCall, '获取分值变更记录列表');
};

/**
 * 获取分值变更记录详情
 * @param {string|number} recordId 记录ID
 * @returns {Promise<Object>} 标准化响应
 */
export const getScoreRecordById = async (recordId) => {
  console.log('获取分值变更记录详情:', recordId);

  const apiCall = request({
    url: `/core/records/${recordId}`,
    method: 'get'
  });

  return handleApiResponse(apiCall, '获取分值变更记录详情');
};

/**
 * 修改分值变更记录
 * @param {Object} recordData 分值变更记录数据
 * @returns {Promise<Object>} 标准化响应
 */
export const updateScoreRecord = async (recordData) => {
  console.log('修改分值变更记录:', recordData);

  const apiCall = request({
    url: '/core/records',
    method: 'put',
    data: recordData,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return handleApiResponse(apiCall, '修改分值变更记录');
};

/**
 * 删除分值变更记录
 * @param {string|number} recordId 记录ID
 * @returns {Promise<Object>} 标准化响应
 */
export const deleteScoreRecord = async (recordId) => {
  console.log('删除分值变更记录:', recordId);

  const apiCall = request({
    url: `/core/records/${recordId}`,
    method: 'delete'
  });

  return handleApiResponse(apiCall, '删除分值变更记录');
};

// 导出所有API方法
export default {
  getSummaryById,
  getSummariesList,
  getSummariesByCourse,
  getSummariesByStudent,
  createScoreItem,
  getScoreItemsList,
  getScoreItemsByCourse,
  getScoreItemById,
  updateScoreItem,
  deleteScoreItem,
  createScoreRecord,
  getScoreRecordsList,
  getScoreRecordById,
  updateScoreRecord,
  deleteScoreRecord
};
