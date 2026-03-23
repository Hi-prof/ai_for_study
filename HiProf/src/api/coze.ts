import { CozeAPI } from '@coze/api'

// 从环境变量获取配置，提高安全性
const COZE_TOKEN = import.meta.env.VITE_COZE_TOKEN 
const COZE_BASE_URL = import.meta.env.VITE_COZE_BASE_URL 
const BOT_ID = import.meta.env.VITE_COZE_BOT_ID 

// Coze API 配置 - 正确设置鉴权头
const apiClient = new CozeAPI({
  token: COZE_TOKEN,
  baseURL: COZE_BASE_URL,
  allowPersonalAccessTokenInBrowser: true
})

interface ChatMessage {
  role: 'user' | 'assistant'
  type: 'question' | 'answer'
  content_type: 'text'
  content: string
}

interface ChatStreamParams {
  message: string
  userId?: string
  conversationId?: string
  additionalMessages?: ChatMessage[]
  stream?: boolean
  auto_save_history?: boolean
  botId?: string  // 新增：可选的自定义BOT_ID
}

interface CozeApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

interface CozeError {
  code: number
  message: string
  details?: any
}

// 对话状态接口
interface ChatStatus {
  status: 'completed' | 'processing' | 'failed'
  conversation_id: string
  chat_id: string
}

// 错误处理函数
const handleApiError = (error: any): never => {
  console.error('Coze API 错误:', error)
  const errorMessage = error?.response?.data?.msg || error?.message || '未知错误'
  throw new Error(`Coze API 调用失败: ${errorMessage}`)
}

const cozeApi = {
  /**
   * 获取CozeAPI客户端实例
   * @returns CozeAPI实例
   */
  getClient() {
    return apiClient
  },
  
  /**
   * 发起流式对话
   * @param params 对话参数
   */
  async chatStream(params: ChatStreamParams) {
    try {
      const { message, userId = '123', conversationId, additionalMessages = [], botId } = params

      const messages: ChatMessage[] = [
        ...additionalMessages,
        {
          role: 'user',
          type: 'question',
          content_type: 'text',
          content: message
        }
      ]

      const requestParams: any = {
        bot_id: botId || BOT_ID,  // 使用传入的botId，如果没有则使用默认的BOT_ID
        user_id: userId,
        additional_messages: messages
      }

      if (conversationId) {
        requestParams.conversation_id = conversationId
      }

      return await apiClient.chat.stream(requestParams)
    } catch (error) {
      handleApiError(error)
    }
  },

  /**
   * 发起非流式对话
   * @param params 对话参数
   */
  async chat(params: ChatStreamParams) {
    try {
      const { message, userId = '123', conversationId, additionalMessages = [], stream = false, auto_save_history = true, botId } = params
      
      // 如果提供了additionalMessages，则使用它，否则创建一个包含当前消息的数组
      const additional_messages = additionalMessages.length > 0 ? additionalMessages : [
        {
          role: 'user',
          type: 'question',
          content_type: 'text',
          content: message
        }
      ]

      const requestParams: any = {
        bot_id: botId || BOT_ID,  // 使用传入的botId，如果没有则使用默认的BOT_ID
        user_id: userId,
        additional_messages,
        stream,
        auto_save_history,
        parameters: {}  // 添加空的parameters字段
      }

      if (conversationId) {
        requestParams.conversation_id = conversationId
      }

      // 直接使用fetch发送请求，以确保完全符合API格式
      const response = await fetch(`${COZE_BASE_URL}/v3/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COZE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestParams)
      })

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('chat response:', data)
      return data
    } catch (error) {
      handleApiError(error)
    }
  },

  /**
   * 获取对话消息列表 - 使用v3 API获取对话中的所有消息
   * @param conversationId 对话ID
   * @param chatId 消息ID（可选）
   * @returns 消息列表
   */
  async getChatMessageList(conversationId: string, chatId?: string) {
    try {
      // 使用原始请求方式来访问v3 API
      const queryParams = new URLSearchParams()
      queryParams.append('conversation_id', conversationId)
      if (chatId) {
        queryParams.append('chat_id', chatId)
      }

      // 使用fetch API直接调用，确保使用正确的Authorization头
      const response = await fetch(`${COZE_BASE_URL}/v3/chat/message/list?${queryParams}`, {
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
      return data
    } catch (error) {
      handleApiError(error)
    }
  },

  /**
   * 获取对话状态
   * @param conversationId 对话ID
   * @param chatId 消息ID
   * @returns 对话状态信息
   */
  async getChatStatus(conversationId: string, chatId: string) {
    try {
      // 使用消息列表API获取状态
      const response = await this.getChatMessageList(conversationId, chatId)
      // 从响应中提取状态信息
      return {
        conversation_id: conversationId,
        chat_id: chatId,
        status: response?.data?.status || 'unknown'
      } as ChatStatus
    } catch (error) {
      handleApiError(error)
    }
  },

  /**
   * 获取对话历史
   * @param conversationId 对话ID
   */
  async getChatHistory(conversationId: string) {
    try {
      return await this.getChatMessageList(conversationId)
    } catch (error) {
      handleApiError(error)
    }
  },

  /**
   * 获取对话列表
   * @param userId 用户ID
   */
  async getChatList(userId: string = '123') {
    try {
      // 使用v3 API直接调用，确保正确的Authorization头
      const response = await fetch(`${COZE_BASE_URL}/v3/conversations?user_id=${userId}`, {
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
      return data
    } catch (error) {
      handleApiError(error)
    }
  },

  /**
   * 创建新对话
   * @param userId 用户ID
   */
  async createConversation(userId: string = '123') {
    try {
      // 使用v3 API直接调用，确保正确的Authorization头
      const response = await fetch(`${COZE_BASE_URL}/v3/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COZE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId })
      })

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      handleApiError(error)
    }
  },

  /**
   * 删除对话
   * @param conversationId 对话ID
   */
  async deleteConversation(conversationId: string) {
    try {
      // 使用v3 API直接调用，确保正确的Authorization头
      const response = await fetch(`${COZE_BASE_URL}/v3/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${COZE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      handleApiError(error)
    }
  },

  /**
   * 获取消息详情
   * @param conversationId 对话ID
   * @param messageId 消息ID
   * @returns 消息详情，包括AI的回答和中间过程
   */
  async getMessage(conversationId: string, messageId: string) {
    try {
      return await this.getChatMessageList(conversationId, messageId)
    } catch (error) {
      handleApiError(error)
    }
  },

  /**
   * 轮询检查对话是否完成并获取结果
   * @param conversationId 对话ID
   * @param chatId 对话消息ID
   * @param maxAttempts 最大尝试次数
   * @param interval 轮询间隔(毫秒)
   * @returns 完成的对话消息详情
   */
  async pollChatCompletion(conversationId: string, chatId: string, maxAttempts = 10, interval = 1000) {
    try {
      let attempts = 0

      while (attempts < maxAttempts) {
        const response = await this.getChatMessageList(conversationId, chatId)
        const status = response?.data?.status || 'unknown'

        if (status === 'completed') {
          // 对话完成，返回消息详情
          return response
        } else if (status === 'failed') {
          throw new Error('对话处理失败')
        }

        // 等待一段时间后再次检查
        await new Promise(resolve => setTimeout(resolve, interval))
        attempts++
      }

      throw new Error('对话处理超时')
    } catch (error) {
      handleApiError(error)
    }
  }
}

export default cozeApi
export type { ChatMessage, ChatStreamParams, CozeApiResponse, CozeError, ChatStatus }
