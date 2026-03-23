// DeepSeek API 封装
// 使用标准的OpenAI兼容接口

// 从环境变量获取配置
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY
const DEEPSEEK_API_BASE = import.meta.env.VITE_DEEPSEEK_API_BASE
const DEEPSEEK_MODEL = import.meta.env.VITE_DEEPSEEK_MODEL

// 消息接口定义
interface DeepSeekMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// 聊天请求参数接口
interface ChatCompletionRequest {
  model: string
  messages: DeepSeekMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

// 聊天响应接口
interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// 错误处理函数
const handleApiError = (error: any): never => {
  console.error('DeepSeek API 错误:', error)
  const errorMessage = error?.response?.data?.error?.message || error?.message || '未知错误'
  throw new Error(`DeepSeek API 调用失败: ${errorMessage}`)
}

const deepseekApi = {
  /**
   * 发起聊天对话
   * @param messages 消息历史
   * @param options 可选参数
   */
  async chat(messages: DeepSeekMessage[], options: {
    temperature?: number
    max_tokens?: number
    stream?: boolean
  } = {}): Promise<ChatCompletionResponse> {
    try {
      const requestBody: ChatCompletionRequest = {
        model: DEEPSEEK_MODEL,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2048,
        stream: options.stream || false
      }

      const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`)
      }

      const data = await response.json()
      console.log('DeepSeek API 响应:', data)
      return data
    } catch (error) {
      handleApiError(error)
    }
  },

  /**
   * 发起流式聊天对话
   * @param messages 消息历史
   * @param onChunk 处理流式数据的回调函数
   * @param options 可选参数
   */
  async chatStream(
    messages: DeepSeekMessage[], 
    onChunk: (chunk: string) => void,
    options: {
      temperature?: number
      max_tokens?: number
    } = {}
  ): Promise<void> {
    try {
      const requestBody: ChatCompletionRequest = {
        model: DEEPSEEK_MODEL,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2048,
        stream: true
      }

      const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') {
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                onChunk(content)
              }
            } catch (e) {
              console.warn('解析流式数据失败:', e)
            }
          }
        }
      }
    } catch (error) {
      handleApiError(error)
    }
  },

  /**
   * 简单的单轮对话
   * @param userMessage 用户消息
   * @param systemPrompt 系统提示词（可选）
   */
  async simpleChat(userMessage: string, systemPrompt?: string): Promise<string> {
    const messages: DeepSeekMessage[] = []
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      })
    }
    
    messages.push({
      role: 'user',
      content: userMessage
    })

    const response = await this.chat(messages)
    return response.choices[0]?.message?.content || '抱歉，我无法生成回复。'
  }
}

export default deepseekApi
export type { DeepSeekMessage, ChatCompletionRequest, ChatCompletionResponse }
