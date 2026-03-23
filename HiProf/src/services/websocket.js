/**
 * WebSocket聊天服务
 * 通过代理支持headers认证
 */

import { getToken } from '@/utils/auth';

class SimpleWebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.userId = null;
    this.options = null;
    this.connectionTimeout = null;
    this.currentUrl = null;
  }

  /**
   * 连接到WebSocket服务器
   * @param {string|number} userId - 用户ID
   * @param {Object} options - 连接选项
   * @param {string} options.chatId - 聊天会话ID
   * @param {string} options.type - 消息类型（默认为'text'）
   */
  connect(userId, options = {}) {
    // 保存连接参数
    this.userId = userId;
    this.options = options;

    // 获取用户token进行认证
    const token = getToken();
    console.log('WebSocket连接 - 获取到的token:', token ? '存在' : '不存在');
    if (!token) {
      console.error('WebSocket连接失败 - token不存在');
      throw new Error('用户未登录或token已过期');
    }

    // 先关闭现有连接
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // 构建WebSocket URL
    const chatId = String(options.chatId);
    const type = options.type || 'text';
    const queryString = `chatId=${chatId}&type=${type}&fileid=null&token=${encodeURIComponent(token)}`;

    // 统一处理：开发和生产环境都通过代理
    const isDev = import.meta.env.DEV;
    let wsUrl;

    if (isDev) {
      // 开发环境：通过Vite代理连接
      wsUrl = `ws://localhost:5173/ws/channel/chat/${userId}?${queryString}`;
    } else {
      // 生产环境：通过nginx代理连接，修复路径问题
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      // 确保路径以/channel开头，与nginx配置匹配
      wsUrl = `${protocol}//${host}/channel/chat/${userId}?${queryString}`;
    }

    // 保存URL用于日志记录（移除token用于安全）
    this.currentUrl = wsUrl.replace(/[?&]token=[^&]*/, '');

    console.log('WebSocket连接URL:', this.currentUrl);
    console.log('WebSocket完整URL（含token）:', wsUrl.substring(0, wsUrl.indexOf('token=') + 6) + '***');

    try {
      
      // 当前方案：URL参数传递token
      this.ws = new WebSocket(wsUrl);

      // 添加连接超时检测
      this.connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
        }
      }, 10000);

    } catch (error) {
      this.isConnected = false;
      throw error;
    }

    // 设置事件监听器
    this.ws.onopen = () => {
      // 清除连接超时
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      console.log('WebSocket连接成功:', this.currentUrl);
      this.isConnected = true;
      // 触发自定义open事件
      if (this.onopen) this.onopen();
    };

    this.ws.onmessage = (event) => {
      console.log('WebSocket原始消息:', {
        data: event.data,
        type: typeof event.data,
        length: event.data?.length
      });

      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket解析后的JSON数据:', data);
        if (this.onmessage) this.onmessage(data);
      } catch (error) {
        console.warn('WebSocket消息JSON解析失败:', error, '原始数据:', event.data);
        // 处理非JSON消息
        if (this.onmessage) this.onmessage({ type: 'text', content: event.data });
      }
    };

    this.ws.onerror = (error) => {
      // 清除连接超时
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      console.error('WebSocket连接错误:', error);
      console.error('连接URL:', this.currentUrl);
      this.isConnected = false;
      // 触发自定义error事件
      if (this.onerror) this.onerror(error);
    };

    this.ws.onclose = (event) => {
      // 清除连接超时
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      console.log('WebSocket连接关闭:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        url: this.currentUrl
      });

      this.isConnected = false;
      // 触发自定义close事件
      if (this.onclose) this.onclose(event);
    };
  }

  /**
   * 发送文本消息
   * @param {string} content - 消息内容
   */
  sendTextMessage(content) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket未连接');
    }

    try {
      this.ws.send(content);
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    // 清除连接超时
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, '客户端主动断开');
      this.ws = null;
    }
    this.isConnected = false;
  }

  /**
   * 获取连接状态
   */
  getConnectionState() {
    return {
      isConnected: this.isConnected,
      chatId: this.userId,
      readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED
    };
  }

  // 事件处理器（可以被外部设置）
  onopen = null;
  onmessage = null;
  onerror = null;
  onclose = null;
}

// 创建单例实例
const chatWebSocket = new SimpleWebSocketService();

export default chatWebSocket;