import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import deepseekApi, { type DeepSeekMessage } from '@/api/deepseek'

// 定义消息类型（保持与useChatNonStream相同的接口）
export interface Message {
  role: 'user' | 'ai'
  content: string
  timestamp?: number
  id?: string
}

/**
 * DeepSeek聊天处理的可组合函数
 * 保持与useChatNonStream相同的接口，便于无缝替换
 */
export function useDeepSeekChat() {
  const messages = ref<Message[]>([])
  const conversationId = ref<string>('')
  const lastChatId = ref<string>('')
  const lastFailedMessage = ref<string>('')
  const connectionStatus = ref<string>('就绪')
  const loading = ref(false)

  /**
   * 将内部消息格式转换为DeepSeek API格式
   * @param messages 内部消息列表
   * @returns DeepSeek API消息格式
   */
  const convertToDeepSeekMessages = (messages: Message[]): DeepSeekMessage[] => {
    return messages.map(msg => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.content
    }))
  }

  /**
   * 生成唯一的消息ID
   * @returns 消息ID
   */
  const generateMessageId = (): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 生成唯一的对话ID
   * @returns 对话ID
   */
  const generateConversationId = (): string => {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 发送消息
   * @param userMessage 用户消息
   */
  const sendMessage = async (userMessage: string): Promise<void> => {
    if (!userMessage.trim()) return

    // 如果没有对话ID，生成一个新的
    if (!conversationId.value) {
      conversationId.value = generateConversationId()
    }

    // 添加用户消息到列表
    const userMsgId = generateMessageId()
    messages.value.push({
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
      id: userMsgId
    })

    // 重置状态
    loading.value = true
    connectionStatus.value = '正在连接到DeepSeek AI...'
    lastFailedMessage.value = ''

    try {
      // 添加AI消息占位符
      const aiMsgId = generateMessageId()
      lastChatId.value = aiMsgId
      
      const aiMessageIndex = messages.value.length
      messages.value.push({
        role: 'ai',
        content: '正在思考中...',
        timestamp: Date.now(),
        id: aiMsgId
      })

      connectionStatus.value = '正在生成回复...'

      // 准备发送给DeepSeek的消息历史
      const deepseekMessages = convertToDeepSeekMessages(messages.value.slice(0, -1)) // 排除刚添加的AI占位符消息

      // 添加系统提示词
      const systemPrompt = "你是Hi Prof智能教育平台的AI助手，专门为教师和学生提供教学与学习支持。请用中文回答问题，提供准确、有用的信息。"
      const messagesWithSystem: DeepSeekMessage[] = [
        { role: 'system', content: systemPrompt },
        ...deepseekMessages
      ]

      // 调用DeepSeek API
      const response = await deepseekApi.chat(messagesWithSystem, {
        temperature: 0.7,
        max_tokens: 2048
      })

      // 提取AI回复内容
      const aiContent = response.choices[0]?.message?.content || '抱歉，我无法生成回复，请重试。'

      // 更新AI回复
      if (messages.value[aiMessageIndex]) {
        messages.value[aiMessageIndex].content = aiContent
      }

      connectionStatus.value = '回复完成'
      
    } catch (error) {
      console.error('DeepSeek API调用失败:', error)
      handleSendMessageError(userMessage)
      
      // 更新AI消息为错误状态
      const aiMessageIndex = messages.value.length - 1
      if (messages.value[aiMessageIndex] && messages.value[aiMessageIndex].role === 'ai') {
        messages.value[aiMessageIndex].content = '抱歉，服务暂时不可用，请稍后重试。'
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 处理发送消息错误
   * @param userMessage 用户消息
   */
  const handleSendMessageError = (userMessage: string): void => {
    ElMessage.error('发送消息失败，请稍后重试')
    lastFailedMessage.value = userMessage
    connectionStatus.value = '连接失败'
  }

  /**
   * 重试上一条失败的消息
   */
  const retryLastMessage = async (): Promise<void> => {
    if (lastFailedMessage.value) {
      const messageToRetry = lastFailedMessage.value
      lastFailedMessage.value = ''
      
      // 移除最后一条AI错误消息（如果存在）
      if (messages.value.length > 0 && messages.value[messages.value.length - 1].role === 'ai') {
        messages.value.pop()
      }
      
      await sendMessage(messageToRetry)
    }
  }

  /**
   * 清空对话历史
   */
  const clearMessages = (): void => {
    messages.value = []
    conversationId.value = ''
    lastChatId.value = ''
    lastFailedMessage.value = ''
    connectionStatus.value = '就绪'
  }

  /**
   * 获取对话历史的纯文本格式
   */
  const getConversationText = (): string => {
    return messages.value
      .map(msg => `${msg.role === 'user' ? '用户' : 'AI助手'}: ${msg.content}`)
      .join('\n\n')
  }

  return {
    messages,
    conversationId,
    lastChatId,
    lastFailedMessage,
    connectionStatus,
    loading,
    sendMessage,
    retryLastMessage,
    clearMessages,
    getConversationText
  }
}
