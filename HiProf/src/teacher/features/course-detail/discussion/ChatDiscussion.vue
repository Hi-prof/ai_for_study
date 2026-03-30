<template>
  <div class="chat-discussion">
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

    <!-- 连接状态提示 -->
    <div v-if="wsError && !wsConnected" class="connection-warning">
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <div class="warning-text">
          <strong>实时聊天功能暂不可用</strong>
          <p>{{ wsError }}。您仍可以查看历史消息和发送消息，但可能无法实时接收新消息。</p>
        </div>
        <button class="btn-retry" @click="reconnectWebSocket">重试连接</button>
      </div>
    </div>

    <!-- 消息显示区域 -->
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <span>加载消息中...</span>
      </div>
      
      <div v-else-if="messages.length === 0" class="empty-messages">
        <div class="empty-icon">💬</div>
        <p>暂无消息，开始聊天吧！</p>
      </div>

      <div v-else class="messages-list">
        <div 
          v-for="message in messages" 
          :key="message.id"
          :class="['message-item', { 'own-message': message.isOwn }]"
        >
          <!-- 消息时间分隔线 -->
          <div v-if="message.showTime" class="time-divider">
            <span>{{ formatMessageTime(message.createTime) }}</span>
          </div>

          <!-- 消息内容 -->
          <div class="message-content">
            <!-- 头像 -->
            <div class="message-avatar">
              <img :src="message.avatar || defaultAvatar" :alt="message.senderName" />
            </div>

            <!-- 消息主体 -->
            <div class="message-body">
              <!-- 发送者姓名 -->
              <div class="sender-name">
                {{ message.senderName }}
              </div>

              <!-- 消息气泡 -->
              <div class="message-bubble" @click="showMessageDetail(message)" :title="message.isOwn ? '' : '点击查看消息详情'">
                <div class="message-text">{{ message.content }}</div>
                <div class="message-time">{{ formatTime(message.createTime) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input">
      <div class="input-container">
        <textarea
          v-model="newMessage"
          ref="messageInput"
          class="message-textarea"
          placeholder="输入消息..."
          rows="1"
          @keydown="handleKeyDown"
          @input="adjustTextareaHeight"
          maxlength="500"
        ></textarea>
        
        <button 
          class="send-button"
          :disabled="!newMessage.trim() || sending"
          @click="sendMessage"
        >
          <span v-if="sending">发送中</span>
          <span v-else>发送</span>
        </button>
      </div>
      
      <div class="input-footer">
        <span class="char-count">{{ newMessage.length }}/500</span>
      </div>
    </div>

    <!-- 消息详情模态框 -->
    <div v-if="showMessageDetailModal" class="modal-overlay" @click="closeMessageDetailModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">消息详情</h3>
          <button class="modal-close" @click="closeMessageDetailModal">×</button>
        </div>

        <div class="modal-body">
          <div v-if="messageDetailLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <span>加载消息详情中...</span>
          </div>

          <div v-else-if="selectedMessageDetail" class="message-detail-info">
            <div class="detail-item">
              <label>消息ID：</label>
              <span>{{ selectedMessageDetail.id }}</span>
            </div>
            <div class="detail-item">
              <label>发送者：</label>
              <span>{{ selectedMessageDetail.senderName || selectedMessageDetail.createBy || '未知' }}</span>
            </div>
            <div class="detail-item">
              <label>发送时间：</label>
              <span>{{ formatDetailTime(selectedMessageDetail.createTime) }}</span>
            </div>
            <div class="detail-item">
              <label>消息类型：</label>
              <span>{{ getContentTypeText(selectedMessageDetail.contentType) }}</span>
            </div>
            <div class="detail-item">
              <label>消息内容：</label>
              <div class="message-content-detail">{{ selectedMessageDetail.content }}</div>
            </div>
            <div v-if="selectedMessageDetail.fileId" class="detail-item">
              <label>附件：</label>
              <a :href="selectedMessageDetail.fileId" target="_blank" class="file-link">
                查看附件
              </a>
            </div>
            <div v-if="selectedMessageDetail.remark" class="detail-item">
              <label>备注：</label>
              <span>{{ selectedMessageDetail.remark }}</span>
            </div>
            <div v-if="selectedMessageDetail.updateTime && selectedMessageDetail.updateTime !== selectedMessageDetail.createTime" class="detail-item">
              <label>最后修改：</label>
              <span>{{ formatDetailTime(selectedMessageDetail.updateTime) }}</span>
            </div>
          </div>

          <div v-else class="error-message">
            <p>无法加载消息详情</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-primary" @click="closeMessageDetailModal">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { getMessagesBySessionId, sendMessage as sendMessageAPI, getMessageDetail } from '@/api/message';
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

// 消息详情相关数据
const showMessageDetailModal = ref(false);
const messageDetailLoading = ref(false);
const selectedMessageDetail = ref(null);

// WebSocket连接状态
const wsConnected = ref(false);
const wsConnecting = ref(false);
const wsError = ref(null);

// 会话成员映射
const memberMap = ref(new Map()); // 用户ID -> 用户信息映射

// 默认头像
const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMzAgMzJDMzAgMjYuNDc3MSAyNS41MjI5IDIyIDIwIDIyQzE0LjQ3NzEgMjIgMTAgMjYuNDc3MSAxMCAzMkgzMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';



// 计算属性
const currentUserId = computed(() => {
  // 从认证信息获取当前用户ID
  const user = getUser();
  return user?.id || user?.userId || 'current_user_001';
});

const currentUserName = computed(() => {
  // 从认证信息获取当前用户名
  const user = getUser();
  return user?.username || user?.name || '未知用户';
});

// 获取会话成员信息并建立映射
const loadSessionMembers = async () => {
  if (!props.sessionId) {
    console.warn('sessionId为空，无法获取会话成员');
    return;
  }

  try {
    console.log('开始获取会话成员信息...', props.sessionId);
    const response = await getSessionMembers(props.sessionId);
    console.log('会话成员API响应:', response);

    if (response && response.code === 200 && response.rows) {
      // 建立用户ID到用户名的映射
      const map = new Map();
      response.rows.forEach(member => {
        const userId = String(member.userId);
        const memberInfo = {
          name: member.memberName,
          avatar: member.memberAvatar,
          sex: member.memberSex
        };
        map.set(userId, memberInfo);
        console.log(`添加成员映射: ${userId} -> ${member.memberName}`);
      });
      memberMap.value = map;
      console.log('会话成员映射建立完成:', {
        mapSize: map.size,
        keys: Array.from(map.keys()),
        values: Array.from(map.values())
      });
    } else {
      console.warn('会话成员API响应格式异常:', response);
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
  if (!member) {
    console.warn('未找到用户映射:', {
      userId,
      memberMapSize: memberMap.value.size,
      availableKeys: Array.from(memberMap.value.keys())
    });
  }
  return member ? member.name : '未知用户';
};

// 初始化WebSocket连接（防重复连接）
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

  // 先断开现有连接
  if (chatWebSocket.getConnectionState().isConnected) {
    console.log('断开现有WebSocket连接');
    chatWebSocket.disconnect();
  }

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
  wsConnected.value = true;
  wsConnecting.value = false;
  wsError.value = null;
};

const handleWebSocketClose = () => {
  wsConnected.value = false;
  wsConnecting.value = false;
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

// 处理WebSocket消息
const handleWebSocketMessage = (data) => {
  console.log('收到WebSocket消息:', {
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

// 方法
const loadMessages = async () => {
  if (!props.sessionId) {
    messages.value = [];
    return;
  }

  loading.value = true;
  try {
    // 加载历史消息（通过HTTP API）
    const response = await getMessagesBySessionId(props.sessionId);

    // 处理API响应
    if (response && typeof response === 'object') {
      let messageData = [];

      // 检查不同的响应格式
      if (response.hasOwnProperty('rows') && response.hasOwnProperty('code')) {
        // TableDataInfo格式
        if (response.code === 0 || response.code === 200) {
          messageData = response.rows || [];
        } else {
          throw new Error(response.msg || '获取消息列表失败');
        }
      } else if (Array.isArray(response)) {
        // 直接数组格式
        messageData = response;
      } else if (response.data) {
        // 嵌套格式
        messageData = Array.isArray(response.data) ? response.data : (response.data.rows || []);
      } else {
        messageData = [];
      }

      // 处理消息数据，转换为前端需要的格式
      const processedMessages = messageData.map((msg, index) => {
        // 修复类型不匹配问题：将两边都转换为字符串进行比较
        const isOwn = String(msg.createBy) === String(currentUserId.value) || String(msg.senderId) === String(currentUserId.value);
        const senderId = msg.senderId || msg.createBy || 'unknown';

        // 使用映射表获取用户名
        const senderName = getUserName(senderId, isOwn);

        return {
          id: msg.id || index + 1,
          content: msg.content || '',
          senderName: senderName,
          senderId: senderId,
          createTime: msg.createTime || new Date().toISOString(),
          isOwn: isOwn,
          avatar: msg.avatar || null,
          showTime: index === 0 || shouldShowTime(msg.createTime, messageData[index - 1]?.createTime),
          contentType: msg.contentType || 'text',
          fileUrl: msg.fileUrl || null
        };
      });

      messages.value = processedMessages;

    } else {
      messages.value = [];
    }

    // 滚动到底部
    await nextTick();
    scrollToBottom();

  } catch (error) {
    // 如果API调用失败，显示空消息列表
    messages.value = [];
  } finally {
    loading.value = false;
  }
};

// 判断是否应该显示时间分隔线
const shouldShowTime = (currentTime, previousTime) => {
  if (!previousTime) return true;

  const current = new Date(currentTime);
  const previous = new Date(previousTime);
  const diffMinutes = (current - previous) / (1000 * 60);

  // 如果两条消息间隔超过5分钟，显示时间
  return diffMinutes > 5;
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || sending.value) return;

  if (!props.sessionId) {
    console.error('发送消息失败: 会话ID不存在');
    return;
  }

  const messageContent = newMessage.value.trim();

  if (!wsConnected.value) {

    // 降级到HTTP API发送消息
    try {
      const messageData = {
        sessionId: props.sessionId,
        content: messageContent,
        contentType: 'text',
        remark: 'WebSocket不可用，使用HTTP发送'
      };

      const response = await sendMessageAPI(messageData);

      // 手动添加消息到界面（因为没有WebSocket实时更新）
      const newMsg = {
        id: response.data?.id || Date.now(),
        content: messageContent,
        senderName: getUserName(currentUserId.value, true),
        senderId: currentUserId.value,
        createTime: new Date().toISOString(),
        isOwn: true,
        avatar: null,
        showTime: shouldShowTime(new Date().toISOString(), messages.value[messages.value.length - 1]?.createTime),
        contentType: 'text',
        fileId: null
      };

      messages.value.push(newMsg);

      // 清空输入框
      newMessage.value = '';
      resetTextareaHeight();

      // 滚动到底部
      await nextTick();
      scrollToBottom();

      return;
    } catch (error) {
      console.error('发送消息失败: 无法连接到服务器，请检查网络连接', error);
      return;
    }
  }
  sending.value = true;

  try {
    // 使用WebSocket发送消息
    const success = chatWebSocket.sendTextMessage(messageContent);

    if (success) {
      // 清空输入框
      newMessage.value = '';
      // 重置输入框高度
      resetTextareaHeight();
    } else {
      throw new Error('WebSocket发送失败');
    }

  } catch (error) {
    // 显示用户友好的错误信息
    let errorMessage = '发送消息失败';
    if (error.message.includes('WebSocket未连接')) {
      errorMessage = '连接已断开，请刷新页面重试';
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('发送消息失败:', errorMessage);
  } finally {
    sending.value = false;
  }
};

const refreshMessages = async () => {
  await loadMessages();
};

// 重新连接WebSocket
const reconnectWebSocket = () => {
  const userId = currentUserId.value;
  if (userId && userId !== 'current_user_001') {
    initWebSocket();
  }
};



const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const handleKeyDown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};

const adjustTextareaHeight = () => {
  const textarea = messageInput.value;
  if (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }
};

const resetTextareaHeight = () => {
  const textarea = messageInput.value;
  if (textarea) {
    textarea.style.height = 'auto';
  }
};

const formatTime = (timeString) => {
  const date = new Date(timeString);
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatMessageTime = (timeString) => {
  const date = new Date(timeString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 24) {
    return date.toLocaleTimeString('zh-CN', { 
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

// 显示消息详情
const showMessageDetail = async (message) => {
  if (message.isOwn) {
    // 自己的消息不需要查看详情
    return;
  }

  showMessageDetailModal.value = true;
  messageDetailLoading.value = true;
  selectedMessageDetail.value = null;

  try {
    // 调用API获取消息详情
    const response = await getMessageDetail(message.id);

    // 处理API响应
    if (response && typeof response === 'object') {
      if (response.success === true && !response.error) {
        // AjaxResult格式成功响应
        selectedMessageDetail.value = {
          ...message, // 使用本地消息数据作为基础
          ...response.data, // 覆盖API返回的详细数据
          senderName: message.senderName,
          createTime: message.createTime
        };
      } else if (response.data || response.code === 200) {
        // 其他格式的成功响应
        selectedMessageDetail.value = {
          ...message,
          ...response.data,
          senderName: message.senderName,
          createTime: message.createTime
        };
      } else {
        // 使用本地消息数据
        selectedMessageDetail.value = message;
      }
    } else {
      // 使用本地消息数据
      selectedMessageDetail.value = message;
    }

  } catch (error) {
    // 即使API失败，也显示本地的消息数据
    selectedMessageDetail.value = message;
  } finally {
    messageDetailLoading.value = false;
  }
};

// 关闭消息详情模态框
const closeMessageDetailModal = () => {
  showMessageDetailModal.value = false;
  selectedMessageDetail.value = null;
  messageDetailLoading.value = false;
};

// 格式化详细时间
const formatDetailTime = (timeString) => {
  if (!timeString) return '未知时间';

  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) {
      return timeString;
    }

    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return timeString;
  }
};

// 获取消息类型文本
const getContentTypeText = (contentType) => {
  const typeMap = {
    'text': '文本消息',
    'image': '图片消息',
    'video': '视频消息',
    'audio': '语音消息',
    'other': '其他类型'
  };

  return typeMap[contentType] || '未知类型';
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
  // 断开WebSocket连接
  if (chatWebSocket.getConnectionState().isConnected) {
    chatWebSocket.disconnect();
  }

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

  // 关闭可能打开的模态框
  showMessageDetailModal.value = false;
  selectedMessageDetail.value = null;
});

// 监听消息变化，自动滚动到底部
watch(() => messages.value.length, async () => {
  await nextTick();
  scrollToBottom();
});
</script>

<style src="@/teacher/styles/chat-discussion.css" scoped></style>


