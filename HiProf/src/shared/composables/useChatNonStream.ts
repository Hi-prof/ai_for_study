import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CozeAPI } from '@coze/api'
import cozeApi from '@/api/coze'

// 定义消息类型
export interface Message {
  role: 'user' | 'ai'
  content: string
  timestamp?: number
  id?: string
}

// 定义Coze API返回类型
interface CozeResponse {
  code?: number
  msg?: string
  message?: string
  data?: any
  conversation_id?: string
  id?: string // 消息ID
  answer?: string
  content?: string
  chat?: {
    content?: string
  }
  messages?: Array<{
    content?: string
    role?: string
    type?: string
    id?: string
  }>
  [key: string]: any
}

/**
 * 非流式聊天处理的可组合函数
 * @param customBotId 可选的自定义BOT_ID，如果不提供则使用默认的VITE_COZE_BOT_ID
 */
export function useChatNonStream(customBotId?: string) {
  const messages = ref<Message[]>([])
  const conversationId = ref<string>('')
  const lastChatId = ref<string>('')
  const lastFailedMessage = ref<string>('')
  const connectionStatus = ref<string>('正在连接...')
  const loading = ref(false)
  
  // 从环境变量获取配置
  const COZE_TOKEN = import.meta.env.VITE_COZE_TOKEN
  const COZE_BASE_URL = import.meta.env.VITE_COZE_BASE_URL
  const BOT_ID = customBotId || import.meta.env.VITE_COZE_BOT_ID  // 使用自定义BOT_ID或默认BOT_ID

  /**
   * 清理内容，移除所有前置JSON对象
   * @param content - 可能包含前置JSON的内容
   * @returns 清理后的内容
   */
  const cleanContentFromJson = (content: string): string => {
    if (!content) return ''
    
    // 移除所有前置的JSON对象
    let processedContent = content.trim()
    
    // 尝试移除所有以 { 开头的JSON对象
    while (processedContent.startsWith('{')) {
      try {
        // 找出第一个完整的JSON对象的结束位置
        let jsonEndIndex = -1
        let braceCount = 0
        let inString = false
        let escaping = false
        
        for (let i = 0; i < processedContent.length; i++) {
          const char = processedContent[i]
          
          if (escaping) {
            escaping = false
            continue
          }
          
          if (char === '\\' && inString) {
            escaping = true
            continue
          }
          
          if (char === '"' && !escaping) {
            inString = !inString
            continue
          }
          
          if (!inString) {
            if (char === '{') braceCount++
            else if (char === '}') {
              braceCount--
              if (braceCount === 0) {
                jsonEndIndex = i
                break
              }
            }
          }
        }
        
        if (jsonEndIndex > 0) {
          // 提取并尝试解析JSON，确认是有效的JSON对象
          const jsonStr = processedContent.substring(0, jsonEndIndex + 1)
          JSON.parse(jsonStr) // 如果不是有效的JSON，这里会抛出异常
          
          // 移除这个JSON对象，获取剩余的内容
          processedContent = processedContent.substring(jsonEndIndex + 1).trim()
        } else {
          // 没找到完整的JSON对象，退出循环
          break
        }
      } catch (e) {
        // 解析JSON失败，说明不是完整的JSON对象，退出循环
        break
      }
    }
    
    // 处理可能包含的msg_type标记
    const msgTypeIndex = processedContent.indexOf('{"msg_type":')
    if (msgTypeIndex > 0) {
      processedContent = processedContent.substring(0, msgTypeIndex).trim()
    }
    
    return processedContent
  }

  /**
   * 处理消息内容
   * @param content - 消息内容
   */
  const processMessageContent = (content: string): string => {
    if (!content) return '回复内容为空'
    
    const cleanedContent = cleanContentFromJson(content)
    return cleanedContent || '回复内容为空'
  }

  /**
   * 解析可能是JSON字符串的内容
   * @param content - 可能是JSON字符串的内容
   */
  const parseJsonContent = (content: string): string => {
    if (!content) return ''
    
    // 首先清理可能的前置JSON和msg_type标记
    const cleanedContent = cleanContentFromJson(content)
    if (cleanedContent) return cleanedContent
    
    try {
      // 尝试解析JSON
      const parsed = JSON.parse(content)

      // 处理knowledge_recall类型的消息
      if (parsed.msg_type === 'knowledge_recall' && parsed.data) {
        try {
          let knowledgeData: any

          // data字段可能是字符串或已解析的对象
          if (typeof parsed.data === 'string') {
            knowledgeData = JSON.parse(parsed.data)
          } else {
            knowledgeData = parsed.data
          }

          if (knowledgeData.chunks && knowledgeData.chunks.length > 0) {
            // 格式化知识召回内容
            const formattedChunks = knowledgeData.chunks.map((chunk: any, index: number) => {
              const title = chunk.meta?.document?.name || `文档 ${index + 1}`
              const content = chunk.slice || ''
              return `**${title}**\n\n${content}`
            })

            return `## 相关知识内容\n\n${formattedChunks.join('\n\n---\n\n')}`
          }
        } catch (dataParseError) {
          console.error('解析knowledge_recall数据失败:', dataParseError)
          // 如果解析失败，返回原始数据的格式化版本
          return `## 知识召回响应\n\n${JSON.stringify(parsed, null, 2)}`
        }
      }

      // 如果解析成功，检查是否有内容字段
      if (parsed.content) {
        return cleanContentFromJson(parsed.content)
      }

      if (parsed.msg_type && parsed.content) {
        return cleanContentFromJson(parsed.content)
      }

      if (parsed.text) {
        return cleanContentFromJson(parsed.text)
      }

      // 如果没有找到内容字段，返回整个对象的字符串表示
      if (typeof parsed === 'object') {
        return JSON.stringify(parsed, null, 2)
      }

      return content
    } catch (e) {
      // 如果解析失败，说明不是JSON格式，直接返回原内容
      return content
    }
  }

  /**
   * 从API响应中提取AI回复内容
   * @param response - Coze API响应
   */
  const extractAIContent = (response: CozeResponse): string => {
    // 如果响应是字符串，可能是JSON字符串，尝试解析
    if (typeof response === 'string') {
      return parseJsonContent(response)
    }
    
    // 检查是否是错误响应
    if (response.code !== undefined && response.code !== 0) {
      return `错误: ${response.msg || response.message || JSON.stringify(response)}`
    }

    // 优先从data.context中提取内容
    if (response.data?.context) {
      return response.data.context
    }
    
    // 如果响应是v3 API格式
    if (response.data) {
      // 检查是否有消息列表
      if (Array.isArray(response.data)) {
        // 查找类型为answer的消息
        const answerMsg = response.data.find(msg => msg.type === 'answer')
        if (answerMsg && answerMsg.content) {
          return parseJsonContent(answerMsg.content)
        }
        
        // 如果没有answer类型消息，查找assistant角色的最后一条消息
        const assistantMsg = [...response.data]
          .filter(msg => msg.role === 'assistant' || msg.role === 'bot')
          .pop()
          
        if (assistantMsg && assistantMsg.content) {
          // 尝试解析内容，可能是JSON字符串
          return parseJsonContent(assistantMsg.content)
        }
      }
      
      // 如果没有消息但有其他内容
      if (response.data.content) {
        return parseJsonContent(response.data.content)
      }
      
      return extractAIContent(response.data)
    }
    
    return '无法获取AI回复内容'
  }

  /**
   * 从响应中提取消息ID
   * @param response - Coze API响应
   */
  const extractChatId = (response: any): string | undefined => {
    if (!response) return undefined

    // 直接从响应中提取
    if (response.id) return response.id

    // 从data中提取
    if (response.data?.id) return response.data.id

    // 从chat_id中提取（旧格式）
    if (response.chat_id) return response.chat_id

    // 从data.messages中提取第一条消息的ID
    if (response.data?.messages && Array.isArray(response.data.messages) && response.data.messages.length > 0) {
      return response.data.messages[0].id
    }

    return undefined
  }

  /**
   * 查询对话状态
   * @param chatId - 消息ID
   * @param conversationId - 对话ID
   * @returns 对话状态
   */
  const retrieveChatStatus = async (conversationId: string, chatId: string): Promise<string> => {
    try {
      // 使用原始请求方式来访问v3 API - 将参数放在URL中，而不是请求体中
      const response = await fetch(`${COZE_BASE_URL}/v3/chat/retrieve?chat_id=${chatId}&conversation_id=${conversationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${COZE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Chat retrieve response:', data)

      // 检查API错误码
      if (data.code !== 0) {
        console.error(`API错误: 代码 ${data.code}, 消息: ${data.msg}`)
        return 'error'
      }

      // 检查/v3/chat的错误码
      if (data.last_error && data.last_error.code !== 0) {
        console.error(`Chat错误: 代码 ${data.last_error.code}, 消息: ${data.last_error.msg}`)
        return 'error'
      }

      // 从响应中提取状态
      return data?.data?.status || 'unknown'
    } catch (error) {
      console.error('查询对话状态失败:', error)
      return 'error'
    }
  }

  /**
   * 获取对话消息列表
   * @param conversationId 对话ID
   * @param chatId 消息ID
   * @returns 消息列表响应
   */
  const getChatMessageList = async (conversationId: string, chatId: string) => {
    try {
      // 使用原始请求方式来访问v3 API
      const response = await fetch(`${COZE_BASE_URL}/v3/chat/message/list?chat_id=${chatId}&conversation_id=${conversationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${COZE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Message list response:', data)

      // 检查API错误码
      if (data.code !== 0) {
        throw new Error(`API错误: 代码 ${data.code}, 消息: ${data.msg}`)
      }

      // 确保返回的数据包含正确的结构
      if (!data.data || !data.data.messages) {
        console.warn('API响应格式不符合预期:', data)
        // 尝试适配不同的响应格式
        if (data.data && Array.isArray(data.data)) {
          // 如果data直接是数组，将其包装为预期格式
          return {
            code: 0,
            data: {
              messages: data.data
            }
          }
        }
      }

      return data
    } catch (error) {
      console.error('获取对话消息列表失败:', error)
      throw error
    }
  }

  /**
   * 从消息列表中提取AI回复内容
   * @param messageList 消息列表响应
   * @returns AI回复内容
   */
  const extractContentFromMessageList = (messageList: any): string => {
    // 检查数据结构
    if (!messageList) {
      return ''
    }

    // 查找AI回复文本
    let aiResponse = ''

    // 1. 直接检查data.context字段
    if (messageList.data?.context) {
      aiResponse = messageList.data.context
      return cleanContentFromJson(aiResponse)
    }

    // 2. 尝试从消息数组中提取
    let messages: any[] = []

    // 方式1: data.messages (标准格式)
    if (messageList.data?.messages && Array.isArray(messageList.data.messages)) {
      messages = messageList.data.messages
    }
    // 方式2: data (直接是数组)
    else if (messageList.data && Array.isArray(messageList.data)) {
      messages = messageList.data
    }
    // 方式3: messages (顶层字段)
    else if (messageList.messages && Array.isArray(messageList.messages)) {
      messages = messageList.messages
    }
    // 方式4: 整个响应就是一个数组
    else if (Array.isArray(messageList)) {
      messages = messageList
    }

    if (messages.length === 0) {
      return ''
    }

    // 查找assistant/bot角色的消息
    const assistantMessages = messages.filter(
      (msg: any) => (msg.role === 'assistant' || msg.role === 'bot') && msg.content
    )

    if (assistantMessages.length > 0) {
      // 如果有多条assistant消息，合并它们
      if (assistantMessages.length > 1) {
        aiResponse = assistantMessages
          .map((msg: any) => cleanContentFromJson(msg.content || ''))
          .filter((content: string) => content.trim() !== '')
          .join('\n\n')
      } else {
        // 只有一条消息
        aiResponse = cleanContentFromJson(assistantMessages[0].content || '')
      }

      return aiResponse
    }

    // 如果没有找到按角色标识的消息，尝试按类型查找
    const typedMessages = messages.filter(
      (msg: any) => ['answer', 'verbose', 'tool_response'].includes(msg.type || '') && msg.content
    )

    if (typedMessages.length > 0) {
      if (typedMessages.length > 1) {
        aiResponse = typedMessages
          .map((msg: any) => cleanContentFromJson(msg.content || ''))
          .filter((content: string) => content.trim() !== '')
          .join('\n\n')
      } else {
        aiResponse = cleanContentFromJson(typedMessages[0].content || '')
      }

      return aiResponse
    }

    // 如果以上都没找到，尝试返回任何有内容的消息
    const anyContentMessage = messages.find((msg: any) => msg.content)
    if (anyContentMessage) {
      return cleanContentFromJson(anyContentMessage.content)
    }

    return ''
  }

  /**
   * 发送消息
   * @param userMessage - 用户消息
   */
  const sendMessage = async (userMessage: string): Promise<void> => {
    if (!userMessage.trim()) return

    // 添加用户消息到列表
    messages.value.push({
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    })

    // 重置状态
    loading.value = true
    connectionStatus.value = '正在连接到AI服务...'
    lastFailedMessage.value = ''

    try {
      // 如果没有对话ID，先创建一个新的对话
      if (!conversationId.value) {
        try {
          connectionStatus.value = '正在创建新对话...'
          const newConversation = await cozeApi.createConversation('user_123')
          if (newConversation && newConversation.data && newConversation.data.conversation_id) {
            conversationId.value = newConversation.data.conversation_id
            console.log('创建新对话成功, ID:', conversationId.value)
          } else {
            console.warn('创建新对话返回异常格式:', newConversation)
          }
        } catch (createError) {
          console.error('创建新对话失败:', createError)
          // 即使创建失败，也尝试发送消息，可能API会自动创建对话
        }
      }

      // 准备聊天参数
      connectionStatus.value = '正在发送请求...'

      // 步骤1: 发起对话 - 使用/v3/chat接口（stream=false表示非流式返回）
      const response = await cozeApi.chat({
        message: userMessage, // 只发送用户的原始输入，不添加任何额外的提示词
        userId: 'user_123',
        conversationId: conversationId.value,
        stream: false,
        auto_save_history: true,
        additionalMessages: [], // 确保不添加任何额外消息
        botId: BOT_ID  // 传入当前使用的BOT_ID
      })

      console.log('Coze API 非流式响应:', response)

      // 处理响应
      if (response) {
        // 保存对话ID - 新API返回格式
        if (response.conversation_id && !conversationId.value) {
          conversationId.value = response.conversation_id
          console.log('保存对话ID:', conversationId.value)
        } else if (response.data?.conversation_id && !conversationId.value) {
          // 从data中提取
          conversationId.value = response.data.conversation_id
          console.log('从data中保存对话ID:', conversationId.value)
        }

        // 如果对话ID还是为空，尝试从headers或其他地方获取
        if (!conversationId.value && response.headers) {
          // 尝试从headers中获取
          const headerConvId = response.headers.get('X-Conversation-Id')
          if (headerConvId) {
            conversationId.value = headerConvId
            console.log('从headers中保存对话ID:', conversationId.value)
          }
        }

        // 提取消息ID
        const chatId = response.id || extractChatId(response)
        if (chatId) {
          lastChatId.value = chatId
          console.log('保存消息ID:', lastChatId.value)
        }

        // 添加AI消息占位符
        const aiMessageIndex = messages.value.length
        messages.value.push({
          role: 'ai',
          content: '正在生成回复...',
          timestamp: Date.now(),
          id: lastChatId.value
        })

        // 尝试直接从响应中提取内容（如果可能）
        let directContent = ''
        try {
          // 优先从data.context中提取内容
          if (response.data?.context) {
            directContent = cleanContentFromJson(response.data.context)
          }
          // 以下是备用提取路径
          else if (response.data?.messages) {
            const botMessages = response.data.messages.filter(
              (msg: any) => msg.role === 'assistant' || msg.role === 'bot'
            )
            if (botMessages.length > 0) {
              directContent = cleanContentFromJson(botMessages[0].content || '')
            }
          } else if (response.answer) {
            directContent = cleanContentFromJson(response.answer)
          } else if (response.content) {
            directContent = cleanContentFromJson(response.content)
          } else if (response.data?.content) {
            directContent = cleanContentFromJson(response.data.content)
          }

          if (directContent) {
            console.log('直接从响应中提取到回复内容')
          }
        } catch (directError) {
          console.error('直接提取内容失败:', directError)
        }

        // 步骤2-3: 查看对话详情并确认状态
        if (conversationId.value && lastChatId.value) {
          connectionStatus.value = '正在等待回复生成...'

          // 开始轮询
          let attempts = 0
          const maxAttempts = 60 // 增加最大尝试次数到60次
          const initialPollInterval = 1000 // 初始轮询间隔1秒
          const maxPollInterval = 3000 // 最大轮询间隔3秒

          let currentPollInterval = initialPollInterval
          let chatStatus = 'in_progress'

          const pollChatStatus = async () => {
            try {
              while (attempts < maxAttempts && (chatStatus === 'in_progress' || chatStatus === 'created')) {
                // 等待一段时间后再次检查
                await new Promise(resolve => setTimeout(resolve, currentPollInterval))

                try {
                  // 步骤2: 查看对话详情 - 通过/v3/chat/retrieve接口
                  chatStatus = await retrieveChatStatus(conversationId.value, lastChatId.value)

                  connectionStatus.value = `正在等待回复生成... (状态: ${chatStatus})`
                  console.log(`轮询状态 [${attempts + 1}/${maxAttempts}]:`, chatStatus)

                  // 增加轮询间隔，但不超过最大间隔
                  if (attempts > 10) { // 前10次保持初始间隔
                    currentPollInterval = Math.min(currentPollInterval * 1.2, maxPollInterval)
                  }

                  attempts++
                } catch (pollError) {
                  console.error('轮询状态出错:', pollError)
                  // 如果错误，稍微降低轮询间隔并继续
                  currentPollInterval = Math.max(initialPollInterval, currentPollInterval * 0.8)
                  attempts++
                }
              }

              // 步骤3-4: 确认对话状态并获取消息详情
              if (chatStatus === 'completed') {
                connectionStatus.value = '获取最终回复...'

                try {
                  // 步骤4: 查看对话消息详情 - 调用/v3/chat/message/list接口
                  const messageDetails = await getChatMessageList(conversationId.value, lastChatId.value)

                  // 使用专用函数从消息列表中提取内容
                  const aiContent = extractContentFromMessageList(messageDetails)

                  // 更新AI回复
                  if (messages.value[aiMessageIndex]) {
                    messages.value[aiMessageIndex].content = processMessageContent(aiContent)
                  }

                  connectionStatus.value = '回复完成'
                } catch (detailError) {
                  console.error('获取消息详情失败:', detailError)
                  ElMessage.error('获取回复详情失败')

                  // 尝试直接从响应中提取内容（作为备用）
                  try {
                    // 使用通用提取方法处理响应对象
                    const backupContent = extractAIContent(response)
                    if (messages.value[aiMessageIndex] && backupContent) {
                      messages.value[aiMessageIndex].content = processMessageContent(backupContent)
                      connectionStatus.value = '使用备用数据回复完成'
                      console.log('使用备用数据回复')
                    } else {
                      messages.value[aiMessageIndex].content = '获取回复详情失败，请重试'
                    }
                  } catch (backupError) {
                    console.error('备用数据提取失败:', backupError)
                    messages.value[aiMessageIndex].content = '获取回复详情失败，请重试'
                  }
                }
              } else if (chatStatus === 'failed') {
                // 对话失败
                connectionStatus.value = '回复生成失败'
                if (messages.value[aiMessageIndex]) {
                  messages.value[aiMessageIndex].content = '回复生成失败，请重试'
                }
                ElMessage.error('回复生成失败')
              } else {
                // 对话超时但可能已经有部分回复
                connectionStatus.value = '回复生成超时'

                // 尝试获取已有的部分回复
                try {
                  const messageDetails = await getChatMessageList(conversationId.value, lastChatId.value)
                  const aiContent = extractContentFromMessageList(messageDetails)

                  if (aiContent && aiContent !== '无法解析消息列表' && !aiContent.includes('{"')) {
                    // 如果成功获取了内容
                    if (messages.value[aiMessageIndex]) {
                      messages.value[aiMessageIndex].content = processMessageContent(aiContent) +
                        '\n\n*注：此回复可能不完整，因为生成过程被中断。*'
                    }
                    connectionStatus.value = '回复可能不完整'
                    ElMessage.warning('回复生成超时，结果可能不完整')
                  } else {
                    // 无法获取有效内容
                    if (messages.value[aiMessageIndex]) {
                      messages.value[aiMessageIndex].content = '回复生成超时，请重试'
                    }
                    ElMessage.warning('回复生成超时，请重试')
                  }
                } catch (timeoutError) {
                  console.error('超时后获取消息失败:', timeoutError)
                  if (messages.value[aiMessageIndex]) {
                    messages.value[aiMessageIndex].content = '回复生成超时，请重试'
                  }
                  ElMessage.warning('回复生成超时，请重试')
                }
              }
            } catch (error) {
              console.error('轮询过程出错:', error)
              connectionStatus.value = '轮询过程出错'
              if (messages.value[aiMessageIndex]) {
                messages.value[aiMessageIndex].content = '获取回复过程中出错，请重试'
              }
              ElMessage.error('获取回复过程中出错')
            } finally {
              loading.value = false
            }
          }

          // 启动轮询
          pollChatStatus().catch(error => {
            console.error('轮询启动失败:', error)
            loading.value = false
            ElMessage.error('轮询启动失败')
          })
        } else {
          // 如果无法获取对话ID或消息ID，但有直接提取的内容，则使用
          if (directContent) {
            console.log('使用直接提取的内容作为回复')
            if (messages.value[aiMessageIndex]) {
              messages.value[aiMessageIndex].content = processMessageContent(directContent)
              connectionStatus.value = '回复完成（直接模式）'
            }
            loading.value = false
          } else {
            // 如果完全无法处理，则报错
            throw new Error('无法获取对话ID或消息ID')
          }
        }
      } else {
        throw new Error('无效的API响应')
      }

    } catch (error) {
      console.error('发送消息失败:', error)
      handleSendMessageError(userMessage)
      loading.value = false
    }
  }

  /**
   * 处理发送消息错误
   * @param userMessage - 用户消息
   */
  const handleSendMessageError = (userMessage: string): void => {
    ElMessage.error('发送消息失败，请稍后重试')
    lastFailedMessage.value = userMessage
  }

  /**
   * 重试上一条失败的消息
   */
  const retryLastMessage = async (): Promise<void> => {
    if (lastFailedMessage.value) {
      const messageToRetry = lastFailedMessage.value
      lastFailedMessage.value = ''
      await sendMessage(messageToRetry)
    }
  }

  return {
    messages,
    conversationId,
    lastChatId,
    lastFailedMessage,
    connectionStatus,
    loading,
    sendMessage,
    retryLastMessage
  }
}
