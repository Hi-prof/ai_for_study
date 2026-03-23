<template>
  <div class="ai-assistant-page">
    <div class="assistant-container">
      <!-- 页面头部 -->
      <div class="assistant-header">
        <button class="back-button" @click="goToHome">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          返回首页
        </button>
        <h2 class="page-title">Hi Prof</h2>
        <div class="header-spacer"></div>
      </div>

      <!-- 对话历史区域 -->
      <div class="chat-history" ref="chatHistoryRef">
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C13.1046 2 14 2.89543 14 4V8C14 9.10457 13.1046 10 12 10C10.8954 10 10 9.10457 10 8V4C10 2.89543 10.8954 2 12 2Z" stroke="currentColor" stroke-width="2"/>
              <path d="M12 14C13.1046 14 14 14.8954 14 16V20C14 21.1046 13.1046 22 12 22C10.8954 22 10 21.1046 10 20V16C10 14.8954 10.8954 14 12 14Z" stroke="currentColor" stroke-width="2"/>
              <path d="M4 12C4 10.8954 4.89543 10 6 10H10C11.1046 10 12 10.8954 12 12C12 13.1046 11.1046 14 10 14H6C4.89543 14 4 13.1046 4 12Z" stroke="currentColor" stroke-width="2"/>
              <path d="M14 12C14 10.8954 14.8954 10 16 10H20C21.1046 10 22 10.8954 22 12C22 13.1046 21.1046 14 20 14H16C14.8954 14 14 13.1046 14 12Z" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <h3>AI智能助手 </h3>
          <p>我是基于DeepSeek的专属AI助手，可以帮助您解答问题、提供建议、协助学习和工作</p>
          <div class="example-topics">
            <h4>试试问我：</h4>
            <div class="topic-tags">
              <span class="topic-tag" @click="selectTopic('帮我解释一下量子物理的基本概念')">量子物理基本概念</span>
              <span class="topic-tag" @click="selectTopic('写一篇关于环保的演讲稿')">环保演讲稿写作</span>
              <span class="topic-tag" @click="selectTopic('Python中如何处理JSON数据？')">Python编程问题</span>
              <span class="topic-tag" @click="selectTopic('推荐一些提高学习效率的方法')">学习效率提升</span>
              <span class="topic-tag" @click="selectTopic('帮我翻译这段英文')">翻译服务</span>
            </div>
          </div>
        </div>

        <div v-else class="messages">
          <div 
            v-for="(message, index) in messages" 
            :key="index" 
            class="message"
            :class="{ 'message-user': message.role === 'user', 'message-ai': message.role === 'ai' }"
          >
            <div class="message-avatar">
              <svg v-if="message.role === 'user'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C13.1046 2 14 2.89543 14 4V8C14 9.10457 13.1046 10 12 10C10.8954 10 10 9.10457 10 8V4C10 2.89543 10.8954 2 12 2Z" stroke="currentColor" stroke-width="2"/>
                <path d="M12 14C13.1046 14 14 14.8954 14 16V20C14 21.1046 13.1046 22 12 22C10.8954 22 10 21.1046 10 20V16C10 14.8954 10.8954 14 12 14Z" stroke="currentColor" stroke-width="2"/>
                <path d="M4 12C4 10.8954 4.89543 10 6 10H10C11.1046 10 12 10.8954 12 12C12 13.1046 11.1046 14 10 14H6C4.89543 14 4 13.1046 4 12Z" stroke="currentColor" stroke-width="2"/>
                <path d="M14 12C14 10.8954 14.8954 10 16 10H20C21.1046 10 22 10.8954 22 12C22 13.1046 21.1046 14 20 14H16C14.8954 14 14 13.1046 14 12Z" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <div class="message-content">
              <div class="message-text" v-html="formatMessage(message.content)"></div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-if="loading" class="message message-ai">
            <div class="message-avatar">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C13.1046 2 14 2.89543 14 4V8C14 9.10457 13.1046 10 12 10C10.8954 10 10 9.10457 10 8V4C10 2.89543 10.8954 2 12 2Z" stroke="currentColor" stroke-width="2"/>
                <path d="M12 14C13.1046 14 14 14.8954 14 16V20C14 21.1046 13.1046 22 12 22C10.8954 22 10 21.1046 10 20V16C10 14.8954 10.8954 14 12 14Z" stroke="currentColor" stroke-width="2"/>
                <path d="M4 12C4 10.8954 4.89543 10 6 10H10C11.1046 10 12 10.8954 12 12C12 13.1046 11.1046 14 10 14H6C4.89543 14 4 13.1046 4 12Z" stroke="currentColor" stroke-width="2"/>
                <path d="M14 12C14 10.8954 14.8954 10 16 10H20C21.1046 10 22 10.8954 22 12C22 13.1046 21.1046 14 20 14H16C14.8954 14 14 13.1046 14 12Z" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <div class="input-container">
          <textarea
            v-model="inputMessage"
            placeholder="请输入您的问题或需要帮助的内容..."
            class="message-input"
            rows="3"
            @keydown.enter.exact.prevent="sendMessage"
            @keydown.enter.shift.exact="addNewLine"
            :disabled="loading"
          ></textarea>
          <button 
            class="send-button"
            @click="sendMessage"
            :disabled="!inputMessage.trim() || loading"
          >
            <svg v-if="!loading" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else class="loading-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2"/>
              <path d="M12 3C16.9706 3 21 7.02944 21 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="input-tips">
          <span class="tip">按 Enter 发送，Shift + Enter 换行</span>
          <span v-if="loading" class="status">{{ connectionStatus }}</span>
          <button v-if="lastFailedMessage" @click="retryLastMessage" class="retry-button">
            重试上一条消息
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDeepSeekChat } from '@/composables/useDeepSeekChat'

export default {
  name: 'AIAssistantPage',
  setup() {
    const router = useRouter()
    const inputMessage = ref('')
    const chatHistoryRef = ref(null)

    // 使用DeepSeek聊天处理
    const {
      messages,
      conversationId,
      lastFailedMessage,
      connectionStatus,
      loading,
      sendMessage: sendChatMessage,
      retryLastMessage
    } = useDeepSeekChat()

    const goToHome = () => {
      router.push('/')
    }

    const selectTopic = (topic) => {
      inputMessage.value = topic
    }

    const sendMessage = async () => {
      if (!inputMessage.value.trim() || loading.value) return

      const messageToSend = inputMessage.value.trim()
      inputMessage.value = ''

      await sendChatMessage(messageToSend)
      await scrollToBottom()
    }

    const formatMessage = (content) => {
      if (!content) return '';
      
      // Process markdown images first
      let processed = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
        return `<img src="${url}" alt="${alt}" class="message-image">`;
      });
      
      // Handle markdown bold text (**text**)
      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Handle markdown italic text (*text*)
      processed = processed.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
      
      // Then handle line breaks
      return processed.replace(/\n/g, '<br>');
    }

    const formatTime = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const scrollToBottom = async () => {
      await nextTick()
      if (chatHistoryRef.value) {
        chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight
      }
    }

    const addNewLine = () => {
      inputMessage.value += '\n'
    }

    // 监听消息变化，自动滚动到底部
    watch(messages, async () => {
      await scrollToBottom()
    }, { deep: true })

    return {
      messages,
      inputMessage,
      loading,
      chatHistoryRef,
      connectionStatus,
      goToHome,
      selectTopic,
      sendMessage,
      formatMessage,
      formatTime,
      addNewLine,
      retryLastMessage,
      lastFailedMessage
    }
  }
}
</script>

<style scoped>
@import '@/styles/pages/AIAssistantPage.css';
</style>
