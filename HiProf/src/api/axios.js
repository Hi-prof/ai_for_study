import axios from 'axios';
import { getToken, removeToken, removeUser } from '@/utils/auth';

const localApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090';

// 创建axios实例
const instance = axios.create({
  // 开发环境直连本机后端，生产环境走网关代理
  baseURL: import.meta.env.DEV ? localApiBaseUrl : '/api',
  timeout: 120000, // 请求超时时间增加到120秒
  headers: {
    'Content-Type': 'application/json'
  }
});



// 请求拦截器
instance.interceptors.request.use(
  config => {

    // 跳过不需要token的请求
    if (config.headers.isToken === false) {
      return config;
    }

    // 从Cookie获取token
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  response => {
    // 如果返回的状态码为200，说明接口请求成功，可以正常拿到数据
    if (response.status === 200) {
      return Promise.resolve(response.data);
    } else {
      console.error(`API响应错误: ${response.status}`, response.data);
      return Promise.reject(response);
    }
  },
  error => {
    console.error('API请求失败:', error);

    // 检查是否是网络错误
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('网络错误: 无法连接到服务器，可能是CORS问题或服务器不可达');
      // 在开发环境下提示使用代理
      if (import.meta.env.DEV) {
        console.warn('开发环境建议: 确保Vite代理配置正确，或检查后端服务是否启动');
      }
    }

    if (error.response && error.response.status) {
      switch (error.response.status) {
        case 401:
          // 使用统一的token过期处理逻辑
          console.error('401错误: Token过期或无效');

          // 检查是否是真正的认证失败（而不是临时网络问题）
          const isRealAuthFailure = error.response?.data?.msg?.includes('认证失败') ||
                                   error.response?.data?.message?.includes('认证失败') ||
                                   error.response?.data?.msg?.includes('Token过期') ||
                                   error.response?.data?.message?.includes('Token过期');

          if (isRealAuthFailure) {
            // 清除认证信息
            removeToken();
            removeUser();

            // 获取当前完整URL用于登录后重定向（包括查询参数）
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
            const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
            const fullCurrentUrl = currentPath + currentSearch;

            // 跳转到登录页
            if (typeof window !== 'undefined' && currentPath !== '/login') {
              window.location.href = `/login?redirect=${encodeURIComponent(fullCurrentUrl)}`;
            }
          }
          break;
        case 403:
          // 没有权限
          console.error('403错误: 没有访问权限');
          break;
        case 404:
          // 请求不存在
          console.error('404错误: 请求的资源不存在');
          break;
        case 500:
          // 服务器内部错误
          console.error('500错误: 服务器内部错误');
          break;
        default:
          // 其他错误
          console.error(`请求错误 ${error.response.status}: ${error.response.data?.message || '未知错误'}`);
      }
      return Promise.reject(error.response);
    } else {
      // 处理断网或请求超时
      if (!window.navigator.onLine) {
        // 断网处理
        console.error('网络连接已断开，请检查网络设置');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        // 请求超时
        console.error('请求超时，请稍后重试');
      } else {
        // 其他网络异常
        console.error('请求异常:', error.message);
      }
      return Promise.reject(error);
    }
  }
);

export default instance; 
