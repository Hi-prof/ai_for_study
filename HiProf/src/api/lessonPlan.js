import request from './axios';

/**
 * 获取教案列表
 * @param {Object} params 查询参数
 * @param {Object} params.tpPlan TpPlan对象，包含查询条件
 * @param {number} params.pageNum 页码，默认1
 * @param {number} params.pageSize 每页大小，默认10
 * @returns {Promise<Object>} 教案列表响应数据
 */
export const getLessonPlanList = (params = {}) => {
  console.log('正在获取教案列表...', params);
  
  // 构建tpPlan查询对象
  const tpPlan = {
    // 基础字段
    createBy: params.createBy || undefined,
    createTime: params.createTime || undefined,
    updateBy: params.updateBy || undefined,
    updateTime: params.updateTime || undefined,
    remark: params.remark || undefined,
    params: params.params || undefined,
    id: params.id || undefined,
    title: params.title || undefined,
    createUser: params.createUser || undefined,
    // 嵌套的模块列表
    tpModuleList: params.tpModuleList || undefined,
    ...params.tpPlan // 允许直接传入tpPlan对象覆盖默认值
  };

  // 移除undefined值，只保留有效的查询条件
  const cleanTpPlan = Object.fromEntries(
    Object.entries(tpPlan).filter(([_, value]) => value !== undefined)
  );

  return request({
    url: '/tp/plan/list',
    method: 'get',
    params: {
      tpPlan: cleanTpPlan,
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 10
    },
    // 确保使用正确的Content-Type
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(response => {
    console.log('获取教案列表成功:', response);
    
    // 处理TableDataInfo响应结构
    if (response && typeof response === 'object') {
      // 标准的TableDataInfo格式
      if (response.rows && Array.isArray(response.rows)) {
        console.log('返回标准TableDataInfo格式');
        return {
          total: response.total || 0,
          rows: response.rows,
          code: response.code || 0,
          msg: response.msg || 'success'
        };
      }
      // 如果直接返回数组格式
      else if (Array.isArray(response)) {
        console.log('返回数组格式，转换为TableDataInfo');
        return {
          total: response.length,
          rows: response,
          code: 0,
          msg: 'success'
        };
      }
      // 如果数据嵌套在data字段中
      else if (response.data && Array.isArray(response.data)) {
        console.log('从嵌套响应中提取教案列表数据');
        return {
          total: response.total || response.data.length,
          rows: response.data,
          code: response.code || 0,
          msg: response.msg || 'success'
        };
      }
    }
    
    console.warn('响应格式不符合预期，返回空结果');
    return {
      total: 0,
      rows: [],
      code: -1,
      msg: '响应格式不符合预期'
    };
  }).catch(error => {
    console.error('获取教案列表失败:', error);
    // 返回错误格式，保持与TableDataInfo一致
    return {
      total: 0,
      rows: [],
      code: -1,
      msg: error.message || '获取教案列表失败'
    };
  });
};

/**
 * 根据ID获取教案详情
 * @param {string|number} planId 教案ID
 * @returns {Promise<Object>} 教案详情数据
 */
export const getLessonPlanById = (planId) => {
  console.log(`正在获取教案详情: ${planId}`);
  return request({
    url: `/tp/plan/${planId}`,
    method: 'get'
  }).then(response => {
    console.log(`获取教案${planId}详情成功:`, response);
    return response;
  }).catch(error => {
    console.error(`获取教案 ${planId} 详情失败:`, error);
    return Promise.reject(error);
  });
};

/**
 * 创建新教案
 * @param {Object} planData 教案数据
 * @returns {Promise<Object>} 创建结果
 */
export const createLessonPlan = (planData) => {
  console.log('创建新教案:', planData);
  return request({
    url: '/tp/plan',
    method: 'post',
    data: planData
  }).then(response => {
    console.log('创建教案成功:', response);
    return response;
  }).catch(error => {
    console.error('创建教案失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 更新教案
 * @param {Object} planData 教案数据（必须包含id字段）
 * @returns {Promise<Object>} 更新结果
 */
export const updateLessonPlan = (planData) => {
  console.log('更新教案:', planData);
  return request({
    url: '/tp/plan',
    method: 'put',
    data: planData
  }).then(response => {
    console.log('更新教案成功:', response);
    return response;
  }).catch(error => {
    console.error('更新教案失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 删除教案（支持单个或批量删除）
 * @param {string|number|Array<string|number>} ids 教案ID或ID数组
 * @returns {Promise<Object>} 删除结果
 */
export const deleteLessonPlan = (ids) => {
  // 处理单个ID或ID数组
  const idsArray = Array.isArray(ids) ? ids : [ids];
  const idsString = idsArray.join(',');

  console.log(`删除教案: ${idsString}`);
  return request({
    url: `/tp/plan/${idsString}`,
    method: 'delete',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(response => {
    console.log(`删除教案${idsString}成功:`, response);
    return response;
  }).catch(error => {
    console.error(`删除教案 ${idsString} 失败:`, error);
    return Promise.reject(error);
  });
};

/**
 * 获取模块内容详细信息
 * @param {string|number} contentId 内容ID
 * @returns {Promise<Object>} 模块内容详情数据
 */
export const getModuleContentById = (contentId) => {
  console.log(`正在获取模块内容详情: ${contentId}`);
  return request({
    url: `/tp/content/${contentId}`,
    method: 'get'
  }).then(response => {
    console.log(`获取模块内容${contentId}详情成功:`, response);
    return response;
  }).catch(error => {
    console.error(`获取模块内容 ${contentId} 详情失败:`, error);
    return Promise.reject(error);
  });
};

/**
 * 新增模块内容
 * @param {Object} contentData 模块内容数据
 * @param {string} contentData.createBy 创建者
 * @param {string} contentData.createTime 创建时间
 * @param {string} contentData.updateBy 更新者
 * @param {string} contentData.updateTime 更新时间
 * @param {string} contentData.remark 备注
 * @param {Object} contentData.params 其他参数
 * @param {number} contentData.id 内容ID（新建时为0）
 * @param {number} contentData.moduleId 模块ID
 * @param {string} contentData.content 内容
 * @param {string} contentData.fileUrl 文件URL
 * @returns {Promise<Object>} 创建结果
 */
export const createModuleContent = (contentData) => {
  console.log('正在创建模块内容:', contentData);

  // 构建请求数据，过滤掉空值
  const cleanData = {};
  Object.keys(contentData).forEach(key => {
    if (contentData[key] !== null && contentData[key] !== undefined && contentData[key] !== '') {
      cleanData[key] = contentData[key];
    }
  });

  return request({
    url: '/tp/content',
    method: 'post',
    data: cleanData,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    console.log('创建模块内容成功:', response);
    return response;
  }).catch(error => {
    console.error('创建模块内容失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 搜索教案
 * @param {Object} searchParams 搜索参数
 * @param {string} searchParams.keyword 关键词
 * @param {string} searchParams.subject 学科
 * @param {string} searchParams.grade 年级
 * @param {number} searchParams.pageNum 页码
 * @param {number} searchParams.pageSize 每页大小
 * @returns {Promise<Object>} 搜索结果
 */
export const searchLessonPlans = (searchParams) => {
  console.log('搜索教案:', searchParams);

  // 构建搜索的tpPlan对象
  const tpPlan = {};
  if (searchParams.keyword) {
    tpPlan.title = searchParams.keyword; // 假设按标题搜索
  }

  return getLessonPlanList({
    tpPlan,
    pageNum: searchParams.pageNum || 1,
    pageSize: searchParams.pageSize || 10
  });
};
