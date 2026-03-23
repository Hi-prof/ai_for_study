import { handleApiResponse, validateRequired } from '@/utils/apiHandler';
import request from './axios';
import { createScoreRecord, updateScoreRecord } from './summaries';

// ==================== 标准化工具函数 ====================

/**
 * 扁平化嵌套对象，用于处理API参数
 * @param {Object} obj 要扁平化的对象
 * @param {string} prefix 前缀
 * @returns {Object} 扁平化后的对象
 */
const flattenObject = (obj, prefix = '') => {
  const flattened = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value != null && value !== '') {
      flattened[prefix ? `${prefix}.${key}` : key] = value;
    }
  });
  return flattened;
};

/**
 * 标准化日期时间格式 - 转换为后端期望的格式 yyyy-MM-dd HH:mm:ss
 * @param {string|Date} dateValue 日期值
 * @returns {string} 标准化的日期字符串
 */
const normalizeDateTime = (dateValue) => {
  if (!dateValue) return '';

  try {
    let processedValue = dateValue;
    // 处理缺少秒数的时间格式
    if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      processedValue = dateValue + ':00';
    }

    const date = new Date(processedValue);
    if (isNaN(date.getTime())) return '';

    // 转换为 yyyy-MM-dd HH:mm:ss 格式
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.warn('日期格式化失败:', dateValue, error);
    return '';
  }
};

/**
 * 处理作业记录数据，标准化格式
 * @param {Object} data 原始作业记录数据
 * @returns {Object} 处理后的作业记录数据
 */
const processWorkRecordData = (data) => ({
  ...data,
  createTime: data.createTime ? normalizeDateTime(data.createTime) : undefined,
  updateTime: data.updateTime ? normalizeDateTime(data.updateTime) : undefined
});

/**
 * 处理查询参数，扁平化clHomeworkRecords嵌套结构
 * @param {Object} params 原始参数
 * @returns {Object} 处理后的参数
 */
const processQueryParams = (params = {}) => {
  if (!params.clHomeworkRecords) return params;

  const { clHomeworkRecords, ...rest } = params;
  const flattenedClHomeworkRecords = flattenObject(clHomeworkRecords, 'clHomeworkRecords');
  return { ...rest, ...flattenedClHomeworkRecords };
};

// ==================== 标准REST API抽象 ====================

/**
 * 创建标准化的作业记录REST API
 */
const createWorkRecordsRestApi = () => {
  const baseUrl = '/core/workrecords';

  return {
    // GET /core/workrecords/list
    getList: async (params = {}) => {
      const processedParams = processQueryParams(params);
      const apiCall = request({
        url: `${baseUrl}/list`,
        method: 'get',
        params: processedParams,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      return handleApiResponse(apiCall, '获取作业记录列表');
    },

    // GET /core/workrecords/:id
    getById: async (id) => {
      const validation = validateRequired({ id }, ['id']);
      if (validation) return validation;

      const apiCall = request({
        url: `${baseUrl}/${id}`,
        method: 'get'
      });
      return handleApiResponse(apiCall, '获取作业记录详情');
    },

    // POST /core/workrecords
    create: async (data) => {
      const validation = validateRequired(data, ['homeworkId', 'userId', 'courseId']);
      if (validation) return validation;

      const processedData = processWorkRecordData(data);
      const apiCall = request({
        url: baseUrl,
        method: 'post',
                data: processedData,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return handleApiResponse(apiCall, '新增作业记录');
    },

    // PUT /core/workrecords
    update: async (data) => {
      const validation = validateRequired(data, ['id']);
      if (validation) return validation;

      const processedData = processWorkRecordData(data);
      const apiCall = request({
        url: baseUrl,
        method: 'put',
        data: processedData,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return handleApiResponse(apiCall, '修改作业记录');
    },

    // DELETE /core/workrecords/:ids
    delete: async (ids) => {
      const idsArray = Array.isArray(ids) ? ids : [ids];
      const idsParam = idsArray.join(',');

      const apiCall = request({
        url: `${baseUrl}/${idsParam}`,
        method: 'delete'
      });
      return handleApiResponse(apiCall, '删除作业记录');
    }
  };
};

// 创建作业记录API实例
const workRecordsRestApi = createWorkRecordsRestApi();

// ==================== 标准化API函数 ====================

/**
 * 查询作业记录列表
 * @param {Object} params 查询参数
 * @param {Object} params.clHomeworkRecords 作业记录对象
 * @param {string} params.clHomeworkRecords.createBy 创建者
 * @param {string} params.clHomeworkRecords.createTime 创建时间
 * @param {string} params.clHomeworkRecords.updateBy 更新者
 * @param {string} params.clHomeworkRecords.updateTime 更新时间
 * @param {string} params.clHomeworkRecords.remark 备注
 * @param {Object} params.clHomeworkRecords.params 其他参数
 * @param {number} params.clHomeworkRecords.id 记录ID
 * @param {number} params.clHomeworkRecords.homeworkId 作业ID
 * @param {number} params.clHomeworkRecords.scoreId 评分ID
 * @param {number} params.clHomeworkRecords.courseId 课程ID
 * @param {number} params.clHomeworkRecords.userId 用户ID
 * @param {string} params.clHomeworkRecords.content 内容
 * @param {string} params.clHomeworkRecords.fileIds 文件ID列表
 * @returns {Promise<Object>} 作业记录列表响应数据，格式为TableDataInfo: { total, rows, code, msg }
 */
export const getWorkRecordsList = async (params = {}) => {
  console.log('获取作业记录列表:', params);
  // 直接处理homeworkId，确保过滤生效
  const queryParams = {
    ...(params.clHomeworkRecords || {}),
    ...(params.otherParams || {})
  };

  return workRecordsRestApi.getList(queryParams);
};

/**
 * 新增作业记录
 * @param {Object} recordData 作业记录数据
 * @param {string} recordData.createBy 创建者
 * @param {string} recordData.createTime 创建时间
 * @param {string} recordData.updateBy 更新者
 * @param {string} recordData.updateTime 更新时间
 * @param {string} recordData.remark 备注
 * @param {Object} recordData.params 其他参数
 * @param {number} recordData.id 记录ID
 * @param {number} recordData.homeworkId 作业ID（必填）
 * @param {number} recordData.scoreId 评分ID
 * @param {number} recordData.courseId 课程ID（必填）
 * @param {number} recordData.userId 用户ID（必填）
 * @param {string} recordData.content 内容
 * @param {string} recordData.fileIds 文件ID列表
 * @returns {Promise<Object>} 标准化响应，格式为AjaxResult: { error, success, warn, empty }
 */
export const createWorkRecord = async (recordData) => {
  console.log('新增作业记录:', recordData);
  return workRecordsRestApi.create(recordData);
};

/**
 * 修改作业记录
 * @param {Object} recordData 作业记录数据
 * @param {number} recordData.id 记录ID（必填）
 * @param {string} recordData.createBy 创建者
 * @param {string} recordData.createTime 创建时间
 * @param {string} recordData.updateBy 更新者
 * @param {string} recordData.updateTime 更新时间
 * @param {string} recordData.remark 备注
 * @param {Object} recordData.params 其他参数
 * @param {number} recordData.homeworkId 作业ID
 * @param {number} recordData.scoreId 评分ID
 * @param {number} recordData.courseId 课程ID
 * @param {number} recordData.userId 用户ID
 * @param {string} recordData.content 内容
 * @param {string} recordData.fileIds 文件ID列表
 * @returns {Promise<Object>} 标准化响应，格式为AjaxResult: { error, success, warn, empty }
 */
export const updateWorkRecord = async (recordData) => {
  console.log('修改作业记录:', recordData);
  return workRecordsRestApi.update(recordData);
};

/**
 * 获取作业记录详细信息
 * @param {number} id 作业记录ID
 * @returns {Promise<Object>} 标准化响应，格式为AjaxResult: { error, success, warn, empty }
 */
export const getWorkRecordById = async (id) => {
  console.log('获取作业记录详情:', id);
  return workRecordsRestApi.getById(id);
};

/**
 * 删除作业记录
 * @param {number|Array<number>} ids 作业记录ID或ID数组
 * @returns {Promise<Object>} 标准化响应，格式为AjaxResult: { error, success, warn, empty }
 */
export const deleteWorkRecord = async (ids) => {
  console.log('删除作业记录:', ids);
  return workRecordsRestApi.delete(ids);
};

/**
 * 根据作业ID获取作业记录列表
 * @param {number} homeworkId 作业ID
 * @param {Object} additionalParams 额外的查询参数
 * @returns {Promise<Object>} 标准化响应
 */
export const getWorkRecordsByHomework = async (homeworkId, additionalParams = {}) => {
  const params = {
    homeworkId,
    ...additionalParams
  };

  return getWorkRecordsList({ clHomeworkRecords: params });
};

/**
 * 根据用户ID获取作业记录列表
 * @param {number} userId 用户ID
 * @param {Object} additionalParams 额外的查询参数
 * @returns {Promise<Object>} 标准化响应
 */
export const getWorkRecordsByUser = async (userId, additionalParams = {}) => {
  const params = {
    clHomeworkRecords: {
      userId,
      ...additionalParams
    }
  };

  return getWorkRecordsList(params);
};

/**
 * 根据课程ID获取作业记录列表
 * @param {number} courseId 课程ID
 * @param {Object} additionalParams 额外的查询参数
 * @returns {Promise<Object>} 标准化响应
 */
export const getWorkRecordsByCourse = async (courseId, additionalParams = {}) => {
  const params = {
    clHomeworkRecords: {
      courseId,
      ...additionalParams
    }
  };

  return getWorkRecordsList(params);
};

/**
 * 根据提交状态获取作业记录列表（基于updateTime判断）
 * @param {boolean} isSubmitted 是否已提交（true=已提交，false=未提交）
 * @param {Object} additionalParams 额外的查询参数
 * @returns {Promise<Object>} 标准化响应
 */
export const getWorkRecordsBySubmissionStatus = async (isSubmitted, additionalParams = {}) => {
  // 注意：这里的逻辑需要在前端过滤，因为后端API可能不支持基于updateTime的直接过滤
  const params = {
    clHomeworkRecords: {
      ...additionalParams
    }
  };

  const response = await getWorkRecordsList(params);

  // 前端过滤：根据updateTime判断提交状态
  if (response && response.rows) {
    response.rows = response.rows.filter(record => {
      const hasUpdateTime = record.updateTime && record.updateTime.trim() !== '';
      return isSubmitted ? hasUpdateTime : !hasUpdateTime;
    });
  }

  return response;
};

/**
 * 学生提交作业记录
 * @param {Object} submissionData 提交数据
 * @param {number} submissionData.homeworkId 作业ID
 * @param {number} submissionData.courseId 课程ID
 * @param {number} submissionData.userId 用户ID
 * @param {string} submissionData.content 提交内容
 * @param {string} submissionData.fileIds 文件ID列表（逗号分隔）
 * @param {string} submissionData.remark 备注
 * @returns {Promise<Object>} 标准化响应
 */
export const submitWorkRecord = async (submissionData) => {
  // 提交时不再设置state字段，提交状态通过updateTime来判断
  const recordData = {
    ...submissionData
  };

  return createWorkRecord(recordData);
};

/**
 * 教师批改作业记录
 * @param {Object} gradeData 批改数据
 * @param {number} gradeData.homeworkId 作业ID
 * @param {number} gradeData.courseId 课程ID
 * @param {number} gradeData.userId 学生用户ID
 * @param {number} gradeData.scoreId 评分ID
 * @param {string} gradeData.content 批改意见
 * @param {string} gradeData.remark 备注
 * @returns {Promise<Object>} 标准化响应
 */
export const gradeWorkRecord = async (gradeData) => {
  // 批改时不再设置state字段，批改状态通过updateTime和scoreId来判断
  const recordData = {
    ...gradeData
  };

  return createWorkRecord(recordData);
};

/**
 * 教师批改作业时处理scoreId逻辑
 * 如果作业记录的scoreId为null，则创建分值变更记录并更新作业记录
 * @param {Object} workRecord 作业记录对象
 * @param {number} workRecord.id 作业记录ID（必填）
 * @param {number} workRecord.scoreId 评分ID（如果为null则创建新的）
 * @param {Object} scoreRecordData 分值变更记录数据（当scoreId为null时使用）
 * @param {number} scoreRecordData.itemId 所属分值变更项目ID
 * @param {number} scoreRecordData.studentId 所属学生ID
 * @param {number} scoreRecordData.courseId 所属课程ID
 * @param {number} scoreRecordData.score 得分值
 * @param {number} scoreRecordData.graderId 评分人
 * @param {string} [scoreRecordData.remark] 备注
 * @returns {Promise<Object>} 标准化响应
 */
export const processWorkRecordScoring = async (workRecord, scoreRecordData) => {
  try {
    console.log('处理作业记录评分:', { workRecord, scoreRecordData });

    const validation = validateRequired(workRecord, ['id']);
    if (validation) return validation;

    // 验证评分数据的基础字段
    const scoreValidation = validateRequired(scoreRecordData, ['score', 'graderId']);
    if (scoreValidation) return scoreValidation;



    // 场景一：修改已有的批改
    if (workRecord.scoreId !== null && workRecord.scoreId !== undefined) {
      console.log('scoreId存在，更新分值变更记录:', workRecord.scoreId);

      const scoreUpdateData = {
        ...scoreRecordData,
        id: workRecord.scoreId, // 关键：使用已有的scoreId进行更新
      };

      const scoreUpdateResponse = await updateScoreRecord(scoreUpdateData);
      if (scoreUpdateResponse.code !== 200) {
        return {
          code: scoreUpdateResponse.code,
          message: '修改评分失败: ' + scoreUpdateResponse.message,
        };
      }
      return {
        code: 200,
        message: '修改评分成功',
        data: scoreUpdateResponse.data
      };
    }

    // 场景二：首次批改，scoreId为null
    else {
      console.log('scoreId为null，创建新的分值变更记录');

      const createScoreValidation = validateRequired(scoreRecordData, ['itemId', 'studentId', 'courseId']);
      if (createScoreValidation) return createScoreValidation;

      const scoreResponse = await createScoreRecord(scoreRecordData);
      if (scoreResponse.code !== 200) {
        return {
          code: scoreResponse.code,
          message: '创建分值变更记录失败: ' + scoreResponse.message,
        };
      }

      const newScoreId = scoreResponse.data;
      console.log('创建分值变更记录成功，获得scoreId:', newScoreId);

      const updatedWorkRecord = { id: workRecord.id, scoreId: newScoreId };
      const updateResponse = await updateWorkRecord(updatedWorkRecord);
      if (updateResponse.code !== 200) {
        return {
          code: updateResponse.code,
          message: '关联作业记录与评分失败: ' + updateResponse.message,
        };
      }

      return {
        code: 200,
        message: '首次批改成功',
        data: { newScoreId }
      };
    }

  } catch (error) {
    console.error('处理作业记录评分失败:', error);
    return {
      code: 500,
      message: '处理作业记录评分失败: ' + error.message,
    };
  }
};
