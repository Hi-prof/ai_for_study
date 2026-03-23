<template>
  <div class="student-chat-discussion">
    <!-- 聊天头部 -->
    <div class="chat-header">
      <div class="chat-title">
        <h3>课程讨论</h3>
        <div class="connection-status">
          <span v-if="wsConnected" class="status-connected">● 已连接</span>
          <span v-else-if="wsConnecting" class="status-connecting">● 连接中...</span>
          <span v-else-if="wsError" class="status-error" :title="wsError">● 连接失败</span>
          <span v-else class="status-disconnected">● 未连接</span>
          <span class="online-count">{{ onlineCount }} 人在线</span>
        </div>
      </div>
      <div class="chat-actions">
        <button class="btn-icon" @click="refreshMessages" title="刷新">
          <i class="refresh-icon"></i>
        </button>
        <button v-if="!wsConnected && !wsConnecting" class="btn-icon" @click="reconnectWebSocket" title="重新连接">
          <i class="refresh-icon"></i>
        </button>
      </div>
    </div>

    <!-- 聊天消息区域 -->
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载消息中...</p>
      </div>

      <div v-else-if="messages.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <h3 class="empty-title">暂无讨论消息</h3>
        <p class="empty-description">成为第一个发言的人吧！</p>
      </div>

      <div v-else class="messages-list">
        <template v-for="(message, index) in messages" :key="message.id">
          <!-- 时间分隔线 -->
          <div v-if="message.showTime" class="time-divider">
            <span class="time-text">{{ formatMessageTime(message.createTime) }}</span>
          </div>

          <!-- 消息项 -->
          <div :class="['message-item', { 'own-message': message.isOwn }]">
            <div class="message-avatar">
              <img v-if="message.avatar" :src="message.avatar" :alt="message.senderName" />
              <div v-else class="avatar-placeholder">
                {{ message.senderName?.charAt(0) || '?' }}
              </div>
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="sender-name">{{ message.senderName }}</span>
                <span class="message-time">{{ formatTime(message.createTime) }}</span>
              </div>
              <div class="message-body">
                <div v-if="message.contentType === 'text'" class="text-content">
                  {{ message.content }}
                </div>
                <div v-else-if="message.contentType === 'file'" class="file-content">
                  <a :href="message.fileId" target="_blank" class="file-link">
                    📎 {{ message.content }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 消息输入区域 -->
    <div class="chat-input">
      <div class="input-container">
        <textarea
          ref="messageInput"
          v-model="newMessage"
          placeholder="输入消息..."
          class="message-textarea"
          rows="1"
          @keydown="handleKeyDown"
          @input="adjustTextareaHeight"
          :disabled="sending"
        ></textarea>
        <button
          class="send-button"
          @click="sendMessage"
          :disabled="!newMessage.trim() || sending"
          :title="sending ? '发送中...' : '发送消息'"
        >
          <span v-if="sending" class="sending-spinner"></span>
          <i v-else class="send-icon">➤</i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { getMessagesBySessionId, sendMessage as sendMessageAPI } from '@/api/message';
import { getSessionMembers } from '@/api/session';
import chatWebSocket from '@/services/websocket';
import { getUser, getToken } from '@/utils/auth';

// 定义props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  },
  sessionId: {
    type: [String, Number],
    default: null
  }
});

// 定义emits
const emit = defineEmits(['message-sent']);

// 响应式数据
const messages = ref([]);
const newMessage = ref('');
const loading = ref(false);
const sending = ref(false);
const onlineCount = ref(1);
const messagesContainer = ref(null);
const messageInput = ref(null);

// WebSocket连接状态
const wsConnected = ref(false);
const wsConnecting = ref(false);
const wsError = ref(null);

// 会话成员映射
const memberMap = ref(new Map()); // 用户ID -> 用户信息映射

// 计算属性 - 完全参考教师端逻辑
const currentUserId = computed(() => {
  // 从认证信息获取当前用户ID
  const user = getUser();
  return user?.id || user?.userId || 'current_user_001';
});

const currentUserName = computed(() => {
  // 从认证信息获取当前用户名
  const user = getUser();
  return user?.username || user?.name || user?.nickName || user?.userName || '未知用户';
});

// 获取会话成员信息并建立映射
const loadSessionMembers = async () => {
  if (!props.sessionId) return;

  try {
    console.log('开始获取会话成员信息...', props.sessionId);
    const response = await getSessionMembers(props.sessionId);
    if (response && response.code === 200 && response.rows) {
      // 建立用户ID到用户名的映射
      const map = new Map();
      response.rows.forEach(member => {
        map.set(String(member.userId), {
          name: member.memberName,
          avatar: member.memberAvatar,
          sex: member.memberSex
        });
      });
      memberMap.value = map;
      console.log('会话成员映射建立完成:', map);
    }
  } catch (error) {
    console.error('获取会话成员失败:', error);
  }
};

// 获取用户名的纯函数
const getUserName = (userId, isOwn) => {
  if (isOwn) {
    return currentUserName.value;
  }

  const member = memberMap.value.get(String(userId));
  console.log('getUserName调试:', {
    userId,
    userIdString: String(userId),
    member,
    memberMapSize: memberMap.value.size,
    memberMapKeys: Array.from(memberMap.value.keys())
  });
  return member ? member.name : '未知用户';
};

// 加载历史消息
const loadMessages = async () => {
  if (!props.sessionId) {
    messages.value = [];
    return;
  }

  loading.value = true;
  try {
    const response = await getMessagesBySessionId(props.sessionId);

    if (response && response.code === 200 && response.rows) {
      messages.value = response.rows.map((msg, index) => {
        const isOwn = String(msg.senderId) === String(currentUserId.value);
        const senderId = msg.senderId || msg.createBy || 'unknown';

        return {
          id: msg.id,
          content: msg.content || '',
          senderName: getUserName(senderId, isOwn),
          senderId: senderId,
          createTime: msg.createTime,
          isOwn: isOwn,
          avatar: isOwn ? null : memberMap.value.get(String(senderId))?.avatar,
          showTime: shouldShowTime(msg.createTime, index > 0 ? response.rows[index - 1].createTime : null),
          contentType: msg.contentType || 'text',
          fileId: msg.fileId || null
        };
      });

      await nextTick();
      scrollToBottom();
    }
  } catch (error) {
    console.error('加载消息失败:', error);
  } finally {
    loading.value = false;
  }
};

// 初始化WebSocket连接（优化版本，避免快速断开重连）
const initWebSocket = () => {
  const userId = currentUserId.value;
  if (!userId || userId === 'current_user_001') {
    return;
  }

  // 检查必要的参数
  if (!props.sessionId) {
    wsError.value = '会话ID不存在，无法建立WebSocket连接';
    return;
  }

  // 检查用户token
  const token = getToken();
  if (!token) {
    wsError.value = '用户未登录或token已过期，无法建立WebSocket连接';
    return;
  }

  // 防止重复连接：如果已经在连接中或已连接，直接返回
  if (wsConnecting.value || wsConnected.value) {
    console.log('WebSocket已连接或正在连接中，跳过重复初始化');
    return;
  }

  // 智能连接管理：检查是否已有相同会话的连接
  const currentState = chatWebSocket.getConnectionState();
  if (currentState.isConnected && currentState.chatId === String(props.sessionId)) {
    console.log('WebSocket已连接到相同会话，复用现有连接');
    wsConnected.value = true;
    wsConnecting.value = false;
    wsError.value = null;

    // 重新设置事件处理器（因为可能被其他组件覆盖）
    chatWebSocket.onopen = handleWebSocketOpen;
    chatWebSocket.onmessage = handleWebSocketMessage;
    chatWebSocket.onclose = handleWebSocketClose;
    chatWebSocket.onerror = handleWebSocketError;
    return;
  }

  // 如果有不同会话的连接，需要断开
  if (currentState.isConnected) {
    console.log('断开不同会话的WebSocket连接');
    chatWebSocket.disconnect();
    // 给一点时间让连接完全断开
    setTimeout(() => {
      startNewConnection(userId);
    }, 500);
  } else {
    startNewConnection(userId);
  }
};

// 启动新连接的辅助函数
const startNewConnection = (userId) => {
  wsConnecting.value = true;
  wsError.value = null;
  wsConnected.value = false;

  // 设置WebSocket事件处理器
  chatWebSocket.onopen = handleWebSocketOpen;
  chatWebSocket.onmessage = handleWebSocketMessage;
  chatWebSocket.onclose = handleWebSocketClose;
  chatWebSocket.onerror = handleWebSocketError;

  // 建立WebSocket连接
  try {
    const connectOptions = {
      // 会话ID
      chatId: String(props.sessionId),
      // 消息类型
      type: 'text'
    };

    console.log('开始建立WebSocket连接...');
    chatWebSocket.connect(userId, connectOptions);
  } catch (error) {
    wsConnecting.value = false;
    wsError.value = error.message || 'WebSocket连接初始化失败';
  }
};

// WebSocket事件处理函数
const handleWebSocketOpen = () => {
  console.log('WebSocket连接已建立，会话ID:', props.sessionId);
  wsConnected.value = true;
  wsConnecting.value = false;
  wsError.value = null;

  // 启动连接监控
  startConnectionMonitor();
};

const handleWebSocketMessage = (data) => {
  console.log('学生端收到WebSocket消息:', {
    data,
    dataType: typeof data,
    isObject: typeof data === 'object',
    hasContent: data?.content,
    hasSenderId: data?.senderId
  });

  // 处理数字类型的消息（可能是在线人数或状态码）
  if (typeof data === 'number') {
    console.log('收到数字消息，可能是在线人数:', data);
    onlineCount.value = data;

    // 当收到数字消息时，可能表示有新消息，刷新消息列表
    console.log('检测到可能的新消息通知，刷新消息列表');
    loadMessages();
    return;
  }

  // 检查数据格式是否正确
  if (!data || typeof data !== 'object') {
    console.warn('WebSocket消息格式异常，忽略:', data);
    return;
  }

  if (data.type === 'ping' || data.type === 'pong') {
    // 忽略心跳消息
    return;
  }

  // 检查是否是有效的聊天消息
  if (!data.content && !data.id) {
    console.warn('WebSocket消息缺少必要字段，忽略:', data);
    return;
  }

  // 将WebSocket消息转换为前端消息格式
  const isOwn = String(data.senderId) === String(currentUserId.value) || String(data.createBy) === String(currentUserId.value);
  const senderId = data.senderId || data.createBy || 'unknown';

  console.log('WebSocket聊天消息调试:', {
    原始数据: data,
    senderId,
    isOwn,
    currentUserId: currentUserId.value,
    content: data.content
  });

  const newMessage = {
    id: data.id || Date.now(),
    content: data.content || '',
    senderName: getUserName(senderId, isOwn),
    senderId: senderId,
    createTime: data.timestamp || data.createTime || new Date().toISOString(),
    isOwn: isOwn,
    avatar: isOwn ? null : memberMap.value.get(String(senderId))?.avatar,
    showTime: shouldShowTime(data.timestamp || data.createTime, messages.value[messages.value.length - 1]?.createTime),
    contentType: data.type || 'text',
    fileId: data.fileid || data.fileId || null
  };

  // 添加到消息列表
  messages.value.push(newMessage);

  // 滚动到底部
  nextTick(() => {
    scrollToBottom();
  });
};

const handleWebSocketClose = (event) => {
  console.log('WebSocket连接关闭:', {
    code: event?.code,
    reason: event?.reason,
    wasClean: event?.wasClean,
    sessionId: props.sessionId
  });

  wsConnected.value = false;
  wsConnecting.value = false;

  // 停止连接监控
  stopConnectionMonitor();

  // 如果是异常关闭，尝试重连
  if (event && event.code !== 1000 && event.code !== 1001) {
    console.log('检测到异常关闭，准备重连...');
    setTimeout(() => {
      if (!wsConnected.value && !wsConnecting.value) {
        reconnectWebSocket();
      }
    }, 3000);
  }
};

const handleWebSocketError = (error) => {
  wsConnected.value = false;
  wsConnecting.value = false;

  let errorMessage = 'WebSocket连接失败';

  if (error && typeof error === 'object') {
    if (error.message) {
      errorMessage = error.message;
    }
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  if (errorMessage === 'WebSocket连接失败' || errorMessage.includes('无法连接')) {
    errorMessage = '无法连接到聊天服务器，请检查网络连接或刷新页面重试';
  }

  wsError.value = errorMessage;
};

// 连接监控相关
let connectionMonitorTimer = null;

// 启动连接监控
const startConnectionMonitor = () => {
  stopConnectionMonitor(); // 先停止现有监控

  connectionMonitorTimer = setInterval(() => {
    const state = chatWebSocket.getConnectionState();
    if (!state.isConnected || state.readyState !== WebSocket.OPEN) {
      console.log('连接监控：检测到连接异常', state);
      wsConnected.value = false;
      wsConnecting.value = false;
      stopConnectionMonitor();
    }
  }, 5000); // 每5秒检查一次
};

// 停止连接监控
const stopConnectionMonitor = () => {
  if (connectionMonitorTimer) {
    clearInterval(connectionMonitorTimer);
    connectionMonitorTimer = null;
  }
};

// 重新连接WebSocket
const reconnectWebSocket = () => {
  const userId = currentUserId.value;
  if (userId && userId !== 'current_user_001') {
    console.log('重新连接WebSocket...');
    initWebSocket();
  }
};

// 监听消息变化，自动滚动到底部
watch(() => messages.value.length, async () => {
  await nextTick();
  scrollToBottom();
});

// 刷新消息
const refreshMessages = () => {
  loadMessages();
};

// 判断是否显示时间分隔线
const shouldShowTime = (currentTime, previousTime) => {
  if (!previousTime) return true;
  
  const current = new Date(currentTime);
  const previous = new Date(previousTime);
  const diffMinutes = (current - previous) / (1000 * 60);
  
  return diffMinutes > 5;
};

// 发送消息
const sendMessage = async () => {
  if (!newMessage.value.trim() || sending.value || !props.sessionId) return;

  const messageContent = newMessage.value.trim();
  sending.value = true;

  try {
    if (wsConnected.value) {
      // 使用WebSocket发送
      const success = chatWebSocket.sendTextMessage(messageContent);
      if (success) {
        newMessage.value = '';
        resetTextareaHeight();
      } else {
        throw new Error('WebSocket发送失败');
      }
    } else {
      // 降级到HTTP API
      const messageData = {
        sessionId: props.sessionId,
        content: messageContent,
        contentType: 'text',
        remark: 'WebSocket不可用，使用HTTP发送'
      };

      const response = await sendMessageAPI(messageData);

      // 手动添加消息到界面
      const newMsg = {
        id: response.data?.id || Date.now(),
        content: messageContent,
        senderName: currentUserName.value,
        senderId: currentUserId.value,
        createTime: new Date().toISOString(),
        isOwn: true,
        avatar: null,
        showTime: shouldShowTime(new Date().toISOString(), messages.value[messages.value.length - 1]?.createTime),
        contentType: 'text',
        fileUrl: null
      };

      messages.value.push(newMsg);
      newMessage.value = '';
      resetTextareaHeight();

      await nextTick();
      scrollToBottom();
    }

    emit('message-sent');
  } catch (error) {
    console.error('发送消息失败:', error);
  } finally {
    sending.value = false;
  }
};

// 处理键盘事件
const handleKeyDown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};

// 调整输入框高度
const adjustTextareaHeight = () => {
  const textarea = messageInput.value;
  if (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }
};

// 重置输入框高度
const resetTextareaHeight = () => {
  const textarea = messageInput.value;
  if (textarea) {
    textarea.style.height = 'auto';
  }
};

// 滚动到底部
const scrollToBottom = () => {
  const container = messagesContainer.value;
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
};

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatMessageTime = (timeStr) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (messageDate.getTime() === today.getTime()) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else {
    return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
};

// 生命周期
onMounted(async () => {
  // 先加载会话成员信息，再加载消息，最后初始化WebSocket
  await loadSessionMembers();
  await loadMessages();
  initWebSocket();
});

// 组件销毁时清理资源
onUnmounted(() => {
  console.log('StudentChatDiscussion组件卸载，清理资源...');

  // 停止连接监控
  stopConnectionMonitor();

  // 延迟断开WebSocket连接，避免快速挂载/卸载导致的连接中断
  setTimeout(() => {
    // 只有在没有其他组件使用相同会话时才断开连接
    const currentState = chatWebSocket.getConnectionState();
    if (currentState.isConnected && currentState.chatId === String(props.sessionId)) {
      console.log('组件卸载，延迟断开WebSocket连接');
      chatWebSocket.disconnect();
    }
  }, 2000); // 延迟2秒断开

  // 清除事件处理器
  chatWebSocket.onopen = null;
  chatWebSocket.onmessage = null;
  chatWebSocket.onclose = null;
  chatWebSocket.onerror = null;

  // 重置连接状态
  wsConnected.value = false;
  wsConnecting.value = false;
  wsError.value = null;

  // 清理消息数据
  messages.value = [];
  newMessage.value = '';
});
</script>

<style scoped>
.student-chat-discussion {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.chat-title h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}

.status-connected { color: #10b981; }
.status-connecting { color: #f59e0b; }
.status-error { color: #ef4444; }
.status-disconnected { color: #6b7280; }

.online-count {
  color: #6b7280;
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.btn-icon:hover {
  background: #e5e7eb;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #6b7280;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.empty-description {
  margin: 0;
  font-size: 14px;
}

.time-divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
}

.time-divider::before,
.time-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.time-text {
  padding: 0 16px;
  font-size: 12px;
  color: #6b7280;
  background: #fff;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-start;
}

.message-item.own-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  margin: 0 12px;
  flex-shrink: 0;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #6b7280;
  font-size: 14px;
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.own-message .message-content {
  text-align: right;
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  gap: 8px;
}

.own-message .message-header {
  justify-content: flex-end;
}

.sender-name {
  font-weight: 600;
  font-size: 14px;
  color: #374151;
}

.message-time {
  font-size: 12px;
  color: #9ca3af;
}

.message-body {
  background: #f3f4f6;
  padding: 12px 16px;
  border-radius: 12px;
  display: inline-block;
  max-width: 100%;
  word-wrap: break-word;
}

.own-message .message-body {
  background: #3b82f6;
  color: white;
}

.text-content {
  line-height: 1.5;
}

.file-link {
  color: inherit;
  text-decoration: none;
}

.file-link:hover {
  text-decoration: underline;
}

.chat-input {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.message-textarea {
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 20px;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  transition: border-color 0.2s;
}

.message-textarea:focus {
  border-color: #3b82f6;
}

.send-button {
  width: 40px;
  height: 40px;
  border: none;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  background: #2563eb;
}

.send-button:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.sending-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.send-icon {
  font-size: 16px;
  font-style: normal;
}
</style>
