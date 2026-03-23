/**
 * 网络状态检测工具
 */

// 检查网络连接状态
export const isOnline = () => {
  return navigator.onLine;
};

// 检查服务器连通性
export const checkServerConnection = async (url = '', timeout = 5000) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url || '/api/health', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache'
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('服务器连通性检查失败:', error.message);
    return false;
  }
};

// 网络状态监听器
export const createNetworkListener = (onOnline, onOffline) => {
  const handleOnline = () => {
    console.log('网络已连接');
    onOnline && onOnline();
  };
  
  const handleOffline = () => {
    console.log('网络已断开');
    onOffline && onOffline();
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // 返回清理函数
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// 重试机制
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries) {
        break;
      }
      
      // 指数退避延迟
      const retryDelay = delay * Math.pow(2, i);
      console.log(`请求失败，${retryDelay}ms后进行第${i + 1}次重试...`);
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw lastError;
};
