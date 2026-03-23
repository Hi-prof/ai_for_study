import request from './axios';
import axios from 'axios';  // 直接导入axios用于验证码API
import { setToken, getToken, removeToken, setUser, removeUser } from '@/utils/auth';
// 移除重试工具，现在网络配置已修复
import Cookies from 'js-cookie';

const localApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090';
const captchaApiBaseUrl = import.meta.env.DEV ? localApiBaseUrl : '/api';

const teacherRoleKeywords = ['teacher', 'admin', '教师', '老师', '管理员'];
const studentRoleKeywords = ['student', '学生'];

const resolveRoleFromValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const resolvedRole = resolveRoleFromValue(item);
      if (resolvedRole) {
        return resolvedRole;
      }
    }
    return null;
  }

  if (typeof value === 'object') {
    const nestedCandidates = [
      value.roleKey,
      value.roleName,
      value.key,
      value.name,
      value.permission,
      value.label,
      value.value
    ];

    for (const candidate of nestedCandidates) {
      const resolvedRole = resolveRoleFromValue(candidate);
      if (resolvedRole) {
        return resolvedRole;
      }
    }

    return null;
  }

  const normalizedValue = String(value).trim().toLowerCase();
  if (!normalizedValue) {
    return null;
  }

  if (teacherRoleKeywords.some(keyword => normalizedValue.includes(keyword.toLowerCase()))) {
    return 'teacher';
  }

  if (studentRoleKeywords.some(keyword => normalizedValue.includes(keyword.toLowerCase()))) {
    return 'student';
  }

  return null;
};

const determineUserRole = (response, userData, options = {}) => {
  const { preferExistingRole = true } = options;
  const username = userData.userName || userData.username;
  const priorityCandidates = [
    response?.roleKey,
    response?.roleName,
    response?.roles,
    response?.roleList,
    response?.permissions,
    userData.roleKey,
    userData.roleName,
    userData.roles,
    userData.roleList,
    userData.permissions,
    userData.userType,
    userData.remark,
    username,
    userData.nickName
  ];
  const existingRoleCandidates = [response?.role, userData.role];
  const roleCandidates = preferExistingRole
    ? [...existingRoleCandidates, ...priorityCandidates]
    : [...priorityCandidates, ...existingRoleCandidates];

  for (const candidate of roleCandidates) {
    const resolvedRole = resolveRoleFromValue(candidate);
    if (resolvedRole) {
      return resolvedRole;
    }
  }

  return 'student';
};

/**
 * 获取验证码图片
 * @returns {Promise<Object>} 验证码图片数据和唯一标识
 */
export const getCodeImage = () => {
  return axios.get(`${captchaApiBaseUrl}/captchaImage`);
};

/**
 * 用户注册
 * @param {Object} userData 用户注册数据
 * @returns {Promise<Object>} 注册结果
 */
export const register = (userData) => {
  return request({
    url: '/api/auth/register',
    method: 'post',
    data: userData
  }).then(response => {
    return response;
  }).catch(error => {
    console.error('用户注册失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 用户登录
 * @param {string} username 用户名
 * @param {string} password 密码
 * @param {boolean} rememberMe 记住密码
 * @param {string} code 验证码
 * @param {string} uuid 验证码唯一标识
 * @returns {Promise<Object>} 登录结果及token
 */
export const login = (username, password, rememberMe = false, code = '', uuid = '') => {
  return request({
    url: '/login',
    method: 'post',
    headers: {
      isToken: false,
      repeatSubmit: false
    },
    data: {
      username,
      password,
      code,
      uuid
    }
  }).then(async response => {
    // 检查登录是否成功
    if (response && response.code !== 200 && response.msg) {
      // 登录失败，抛出错误
      const error = new Error(response.msg);
      error.response = { data: { message: response.msg } };
      throw error;
    }

    if (response && response.token) {
      // 存储登录信息
      setToken(response.token);

      let userProfile = null;
      try {
        // 获取用户详细信息和角色
        userProfile = await getUserProfile();
        console.log('获取到用户profile:', userProfile);
      } catch (error) {
        console.warn('获取用户profile失败，使用默认用户信息:', error);
        // 如果获取profile失败，使用登录返回的基本用户信息
        setUser(response.user || {});
      }

      // 如果选择了"记住我"，保存用户名和密码到Cookie
      if (rememberMe) {
        Cookies.set('username', username, { expires: 30 });
        Cookies.set('password', password, { expires: 30 });
        Cookies.set('rememberMe', true, { expires: 30 });
      } else {
        Cookies.remove('username');
        Cookies.remove('password');
        Cookies.remove('rememberMe');
      }

      // 在响应中添加用户信息，方便登录页面使用
      response.userProfile = userProfile;
    }
    return response;
  }).catch(error => {
    console.error('用户登录失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 退出登录
 * @returns {Promise<Object>} 退出结果
 */
export const logout = () => {
  // 首先清除Cookie中的认证信息
  removeToken();
  removeUser();
  Cookies.remove('username');
  Cookies.remove('password');
  Cookies.remove('rememberMe');
  
  // 设置超时，确保即使API请求失败也能继续
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: '已退出登录' });
    }, 1000); // 1秒超时
  });
  
  // 尝试调用API，但不等待它完成
  const apiPromise = request({
    url: '/logout',
    method: 'post'
  }).then(response => {
    return response;
  }).catch(error => {
    console.error('退出登录API调用失败:', error);
    return { success: true, message: '已退出登录' }; // 返回成功，因为本地存储已清除
  });
  
  // 使用Promise.race确保不会卡住
  return Promise.race([apiPromise, timeoutPromise]);
};

/**
 * 刷新访问令牌（暂不使用，直接让用户重新登录）
 * @returns {Promise<Object>} 新的token
 */
export const refreshToken = () => {
  // 简化处理：直接返回失败，让用户重新登录
  return Promise.reject(new Error('Token已过期，请重新登录'));
};

/**
 * 忘记密码
 * @param {string} email 用户邮箱
 * @returns {Promise<Object>} 处理结果
 */
export const forgotPassword = (email) => {
  return request({
    url: '/api/auth/forgot-password',
    method: 'post',
    data: { email }
  }).catch(error => {
    console.error('忘记密码请求失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 重置密码
 * @param {string} token 重置令牌
 * @param {string} password 新密码
 * @returns {Promise<Object>} 处理结果
 */
export const resetPassword = (token, password) => {
  return request({
    url: '/api/auth/reset-password',
    method: 'post',
    data: { token, password }
  }).catch(error => {
    console.error('重置密码失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 获取用户profile信息（从服务器）
 * @returns {Promise<Object>} 用户profile信息
 */
export const getUserProfile = () => {
  return request({
    url: '/system/user/profile',
    method: 'get'
  }).then(response => {
    if (response && response.data) {
      const userData = response.data;
      const role = determineUserRole(response, userData);

      console.log('用户角色判断:', {
        nickName: userData.nickName,
        userName: userData.userName,
        username: userData.username,
        remark: userData.remark,
        responseRoles: response.roles,
        createBy: userData.createBy,
        determinedRole: role
      });

      // 构建完整的用户信息对象
      const userInfo = {
        id: userData.userId,
        username: userData.userName,
        name: userData.nickName,
        email: userData.email,
        phone: userData.phonenumber,
        sex: userData.sex,
        avatar: userData.avatar,
        role: role,
        createBy: userData.createBy,
        createTime: userData.createTime,
        updateTime: userData.updateTime,
        remark: userData.remark,
        params: userData.params
      };

      // 更新本地存储的用户信息
      setUser(userInfo);

      return userInfo;
    }
    return null;
  }).catch(error => {
    console.error('获取用户profile失败:', error);
    return Promise.reject(error);
  });
};

/**
 * 获取当前登录用户信息
 * @param {boolean} forceRefresh 是否强制从服务器刷新
 * @returns {Object|null} 用户信息或null
 */
export const getCurrentUser = (forceRefresh = false) => {
  // 如果强制刷新，直接从服务器获取
  if (forceRefresh) {
    return getUserProfile();
  }

  try {
    const userStr = Cookies.get('User-information');
    const localUser = userStr ? JSON.parse(userStr) : null;

    if (localUser) {
      const repairedRole = determineUserRole({}, localUser, { preferExistingRole: false });

      if (repairedRole && repairedRole !== localUser.role) {
        const repairedUser = { ...localUser, role: repairedRole };
        setUser(repairedUser);
        return repairedUser;
      }
    }

    // 如果本地有用户信息且包含角色，直接返回
    if (localUser && localUser.role) {
      return localUser;
    }

    // 如果本地用户信息不完整，尝试从服务器获取
    if (isAuthenticated()) {
      getUserProfile().catch(error => {
        console.warn('后台刷新用户信息失败:', error);
      });
    }

    return localUser;
  } catch (e) {
    console.error('解析用户信息失败:', e);
    return null;
  }
};

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
export const isAuthenticated = () => {
  return !!getToken();
}; 
