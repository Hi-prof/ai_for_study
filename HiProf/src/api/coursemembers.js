import { handleApiResponse } from '@/utils/apiHandler';
import request from './axios';

/**
 * 获取课程成员列表
 * @param {Object} params - 查询参数
 * @param {number} params.courseId - 课程ID
 * @param {number} [params.userId] - 用户ID
 * @param {string} [params.memberRole] - 成员角色：0:教师,1:学生
 * @returns {Promise<Object>} 标准化响应
 */
export async function getCourseMembers(params) {
  console.log('获取课程成员列表:', params);

  const apiCall = request({
    url: '/core/coursemembers/list',
    method: 'get',
    params
  });

  return handleApiResponse(apiCall, '获取课程成员列表');
}

/**
 * 根据课程ID获取课程成员列表
 * @param {number} courseId - 课程ID
 * @returns {Promise<Object>} 标准化响应
 */
export function getCourseMembersByCourseId(courseId) {
  return getCourseMembers({ courseId });
}

/**
 * 根据课程ID获取学生列表
 * @param {number} courseId - 课程ID
 * @returns {Promise<Object>} 标准化响应
 */
export function getStudentsByCourseId(courseId) {
  return getCourseMembers({
    courseId,
    memberRole: '1' // 1表示学生
  });
}

/**
 * 根据课程ID获取教师列表
 * @param {number} courseId - 课程ID
 * @returns {Promise<Object>} 标准化响应
 */
export function getTeachersByCourseId(courseId) {
  return getCourseMembers({
    courseId,
    memberRole: '0' // 0表示教师
  });
}

/**
 * 新增课程成员
 * @param {Object} data - 课程成员数据
 * @param {number} data.courseId - 课程ID
 * @param {number} data.userId - 用户ID
 * @param {string} data.memberRole - 成员角色：0:教师,1:学生
 * @param {string} [data.remark] - 备注
 * @returns {Promise<Object>} 标准化响应
 */
export async function addCourseMember(data) {
  console.log('新增课程成员:', data);

  const apiCall = request({
    url: '/core/coursemembers',
    method: 'post',
    data
  });

  return handleApiResponse(apiCall, '新增课程成员');
}

/**
 * 修改课程成员
 * @param {Object} data - 课程成员数据
 * @param {number} data.id - 成员ID
 * @returns {Promise<Object>} 标准化响应
 */
export async function updateCourseMember(data) {
  console.log('修改课程成员:', data);

  const apiCall = request({
    url: '/core/coursemembers',
    method: 'put',
    data
  });

  return handleApiResponse(apiCall, '修改课程成员');
}

/**
 * 删除课程成员
 * @param {number|string} ids - 成员ID，多个ID用逗号分隔
 * @returns {Promise<Object>} 标准化响应
 */
export async function deleteCourseMember(ids) {
  console.log('删除课程成员:', ids);

  const apiCall = request({
    url: `/core/coursemembers/${ids}`,
    method: 'delete'
  });

  return handleApiResponse(apiCall, '删除课程成员');
}

/**
 * 获取课程成员详情
 * @param {number} id - 成员ID
 * @returns {Promise<Object>} 标准化响应
 */
export async function getCourseMemberDetail(id) {
  console.log('获取课程成员详情:', id);

  const apiCall = request({
    url: `/core/coursemembers/${id}`,
    method: 'get'
  });

  return handleApiResponse(apiCall, '获取课程成员详情');
}

/**
 * 获取用户所加入的课程列表
 * @param {number} userId - 用户ID
 * @returns {Promise<Object>} 标准化响应
 */
export async function getCoursesByUserId(userId) {
  console.log('获取用户课程列表:', userId);

  const apiCall = request({
    url: '/core/coursemembers/list',
    method: 'get',
    params: {
      userId,
      memberRole: '1'
    }
  });

  return handleApiResponse(apiCall, '获取用户课程列表');
}

/**
 * 根据班级ID，绑定其下所有学生到课程
 * @param {number} courseId - 课程ID
 * @param {number} deptId - 班级ID
 * @returns {Promise<Object>} 标准化响应
 */
export async function bindClassToCourse(courseId, deptId) {
  if (!courseId || !deptId) {
    return {
      code: 400,
      message: '课程ID和班级ID不能为空',
      data: null,
      error: 'Course ID and Class ID are required'
    };
  }

  console.log('绑定班级学生到课程:', { courseId, deptId });

  const apiCall = request({
    url: '/core/coursemembers/bindClass',
    method: 'post',
    params: {
      courseId: parseInt(courseId),
      deptId: parseInt(deptId)
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return handleApiResponse(apiCall, '绑定班级学生到课程');
}
