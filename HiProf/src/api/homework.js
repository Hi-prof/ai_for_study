import { handleApiResponse } from '@/utils/apiHandler';
import request from './axios';

// ==================== 标准化工具函数 ====================




/**
 * 处理查询参数，按照API规范处理clHomework参数
 * @param {Object} params 原始参数
 * @returns {Object} 处理后的参数
 */
const processQueryParams = (params = {}) => {
  // 如果直接传入了clHomework对象，则直接使用
  if (params.clHomework) {
    return params;
  }

  // 使用平铺参数格式，避免嵌套结构导致的400错误
  const { pageNum, pageSize, ...homeworkParams } = params;
  const result = {};

  if (pageNum !== undefined) result.pageNum = pageNum;
  if (pageSize !== undefined) result.pageSize = pageSize;

  // 直接将作业参数平铺到结果中，而不是嵌套在clHomework下
  Object.assign(result, homeworkParams);

  return result;
};

// ==================== 标准REST API抽象 ====================

/**
 * 创建标准化的作业REST API
 */
const createHomeworkRestApi = () => {
  const baseUrl = '/core/homework';

  return {
    // GET /core/homework/list
    getList: async (params = {}) => {
      const processedParams = processQueryParams(params);
      console.log('处理后的查询参数:', processedParams);

      const apiCall = request({
        url: `${baseUrl}/list`,
        method: 'get',
        params: processedParams,
        // 移除Content-Type头，让axios自动处理GET请求的参数序列化
        paramsSerializer: {
          // 使用简单的参数序列化，避免嵌套结构
          serialize: (params) => {
            const searchParams = new URLSearchParams();
            Object.keys(params).forEach(key => {
              if (params[key] !== undefined && params[key] !== null) {
                searchParams.append(key, params[key]);
              }
            });
            return searchParams.toString();
          }
        }
      });
      return handleApiResponse(apiCall, '获取作业列表');
    },

    // GET /core/homework/:id
    getById: async (id) => {
      const apiCall = request({
        url: `${baseUrl}/${id}`,
        method: 'get'
      });
      return handleApiResponse(apiCall, '获取作业详情');
    },

    // POST /core/homework
    create: async (data) => {
      // 根据新API规范，数据应该直接发送，不需要包装在clHomework中
      // API接受的字段：createBy, createTime, updateBy, updateTime, remark, params, id, courseId, title, content, fileIds, overTime
      const requestData = {
        courseId: data.courseId,
        title: data.title,
        content: data.content,
        fileIds: data.fileIds || '',
        overTime: data.overTime,
        // 系统字段通常由后端自动填充，但如果需要可以传递
        remark: data.remark || '',
        params: data.params || {}
      };

      const apiCall = request({
        url: baseUrl,
        method: 'post',
        data: requestData,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return handleApiResponse(apiCall, '创建作业');
    },

    // PUT /core/homework
    update: async (data) => {
      // 更新时需要包含ID
      const requestData = {
        id: data.id,
        courseId: data.courseId,
        title: data.title,
        content: data.content,
        fileIds: data.fileIds || '',
        overTime: data.overTime,
        remark: data.remark || '',
        params: data.params || {}
      };

      const apiCall = request({
        url: baseUrl,
        method: 'put',
        data: requestData,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return handleApiResponse(apiCall, '更新作业');
    },

    // DELETE /core/homework/:ids
    delete: async (ids) => {
      const idsArray = Array.isArray(ids) ? ids : [ids];
      const idsParam = idsArray.join(',');

      const apiCall = request({
        url: `${baseUrl}/${idsParam}`,
        method: 'delete'
      });
      return handleApiResponse(apiCall, '删除作业');
    }
  };
};

// 创建作业API实例
const homeworkRestApi = createHomeworkRestApi();

// ==================== 作业记录API抽象 ====================

const createHomeworkRecordsRestApi = () => {
  const baseUrl = '/core/workrecords';

  return {
    getList: async (params = {}) => {
      return handleApiResponse(request({
        url: `${baseUrl}/list`,
        method: 'get',
        params
      }), '获取作业记录列表');
    },
    create: async (data) => {
      return handleApiResponse(request({
        url: baseUrl,
        method: 'post',
        data
      }), '创建作业记录');
    },
    update: async (data) => {
      return handleApiResponse(request({
        url: baseUrl,
        method: 'put',
        data
      }), '更新作业记录');
    }
  };
};

const homeworkRecordsApi = createHomeworkRecordsRestApi();



// ==================== 标准化API函数 ====================

/**
 * 获取作业管理列表
 * @param {Object} params 查询参数
 * @param {Object} params.clHomework 作业对象
 * @param {string} params.clHomework.createBy 创建者
 * @param {string} params.clHomework.createTime 创建时间
 * @param {string} params.clHomework.updateBy 更新者
 * @param {string} params.clHomework.updateTime 更新时间
 * @param {string} params.clHomework.remark 备注
 * @param {Object} params.clHomework.params 其他参数
 * @param {number} params.clHomework.id 作业ID
 * @param {string} params.clHomework.title 作业标题
 * @param {string} params.clHomework.gettFile 教师上传文件
 * @param {string} params.clHomework.gettContent 教师上传内容
 * @param {string} params.clHomework.getsFile 学生上传文件
 * @param {string} params.clHomework.getsContent 学生上传内容
 * @param {number} params.clHomework.courseId 所属课程ID
 * @param {string} params.clHomework.overTime 作业截止时间
 * @returns {Promise<Object>} 作业列表响应数据，格式为TableDataInfo: { total, rows, code, msg }
 */
export const getHomeworkList = async (params = {}) => {
  console.log('获取作业列表:', params);
  return homeworkRestApi.getList(params);
};

/**
 * 根据课程ID获取作业列表
 * @param {number} courseId 课程ID
 * @param {Object} additionalParams 额外的查询参数
 * @returns {Promise<Object>} 标准化响应
 */
export const getHomeworkListByCourse = async (courseId, additionalParams = {}) => {
  // 使用平铺参数格式，避免嵌套的clHomework[courseId]格式
  const params = {
    courseId,
    ...additionalParams
  };

  return getHomeworkList(params);
};

/**
 * 创建新作业
 * @param {Object} homeworkData 作业数据
 * @param {string} homeworkData.title 作业标题
 * @param {number} homeworkData.courseId 所属课程ID
 * @param {string} homeworkData.content 作业内容
 * @param {string} homeworkData.fileIds 教师上传文件ID列表
 * @param {string} homeworkData.overTime 作业截止时间
 * @param {string} [homeworkData.remark] 备注
 * @param {Object} [homeworkData.params] 其他参数
 * @returns {Promise<Object>} 标准化响应
 */
export const createHomework = async (homeworkData) => {
  console.log('创建作业:', homeworkData);
  return homeworkRestApi.create(homeworkData);
};

/**
 * 更新作业
 * @param {Object} homeworkData 作业数据
 * @param {number} homeworkData.id 作业ID
 * @returns {Promise<Object>} 标准化响应
 */
export const updateHomework = async (homeworkData) => {
  console.log('更新作业:', homeworkData);
  return homeworkRestApi.update(homeworkData);
};

/**
 * 删除作业
 * @param {number|Array<number>} ids 作业ID或ID数组
 * @returns {Promise<Object>} 标准化响应
 */
export const deleteHomework = async (ids) => {
  return homeworkRestApi.delete(ids);
};

/**
 * 根据ID获取作业详情
 * @param {number} id 作业ID
 * @returns {Promise<Object>} 标准化响应
 */
export const getHomeworkById = async (id) => {
  return homeworkRestApi.getById(id);
};

/**
 * 获取指定作业的提交记录列表
 * @param {number} homeworkId 作业ID
 * @returns {Promise<Object>} 标准化响应
 */
export const getHomeworkSubmissions = async (homeworkId) => {
  console.log('获取作业提交记录:', homeworkId);
  return homeworkRecordsApi.getList({ homeworkId });
};

/**
 * 获取学生的作业列表（学生端专用）
 * @param {Object} params 查询参数
 * @param {string} params.status 作业状态过滤
 * @param {number} params.courseId 课程ID过滤
 * @returns {Promise<Object>} 标准化响应
 */
export const getStudentHomework = async (params = {}) => {
  console.log('获取学生作业列表:', params);

  const { courseId, ...otherParams } = params;

  // 学生端直接使用和教师端相同的API
  return getHomeworkListByCourse(courseId, otherParams);
};

/**
 * 学生提交作业（创建或更新作业记录）
 * @param {Object} recordData 作业记录数据
 * @param {number} recordData.id 作业记录ID（用于更新）
 * @param {number} recordData.homeworkId 所属作业ID
 * @param {number} recordData.courseId 所属课程ID
 * @param {number} recordData.userId 用户ID
 * @param {string} recordData.content 完成内容
 * @param {string} recordData.fileIds 完成作业文件列表
 * @returns {Promise<Object>} 标准化响应
 */
export const submitHomework = async (recordData) => {
  console.log('提交作业记录:', recordData);

  // 如果有ID，则为更新；否则为创建
  if (recordData.id) {
    return homeworkRecordsApi.update(recordData);
  }
  return homeworkRecordsApi.create(recordData);
};

/**
 * 教师批改作业（更新作业记录）
 * @param {Object} gradeData 批改数据
 * @param {number} gradeData.id 作业记录ID
 * @param {number} gradeData.score 分数
 * @param {string} gradeData.remark 教师评语
 * @returns {Promise<Object>} 标准化响应
 */
export const gradeHomework = async (gradeData) => {
  console.log('批改作业:', gradeData);
  return homeworkRecordsApi.update(gradeData);
};
