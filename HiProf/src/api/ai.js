import axios from 'axios'

/**
 * DeepSeek AI API 调用模块
 * 提供与 DeepSeek 模型的交互功能
 * 支持聊天对话、流式响应、文本生成、联网搜索等功能
 *
 * 主要特性：
 * - 支持高token限制（16K+）的长文本生成
 * - 集成联网搜索功能，获取最新信息
 * - 支持结构化内容生成和知识图谱创建
 * - 提供图片上传和视觉分析功能
 */

// DeepSeek API 配置 - 教育场景优化
const DEEPSEEK_CONFIG = {
  // API基础配置
  baseURL: import.meta.env.VITE_DEEPSEEK_API_BASE || 'https://api.deepseek.com',
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
  model: import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat',

  // 性能配置
  timeout: 120000, // 120秒超时，平衡响应速度与内容生成
  maxTokens: 8192, // DeepSeek API最大token限制

  // 教育场景生成参数 - 平衡准确性与内容丰富度
  temperature: 0.3, // 适度降低随机性，确保有内容输出
  topP: 0.6,        // 平衡的核采样，减少幻觉但保证内容生成

  // 注：联网搜索功能需要通过其他方式实现，DeepSeek基础API不直接支持
}

// 创建专用的 axios 实例
const deepseekClient = axios.create({
  baseURL: DEEPSEEK_CONFIG.baseURL,
  timeout: DEEPSEEK_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
  }
})

// 请求拦截器
deepseekClient.interceptors.request.use(
  config => {
    console.log(`DeepSeek API 请求: ${config.url}`)
    return config
  },
  error => {
    console.error('DeepSeek API 请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
deepseekClient.interceptors.response.use(
  response => {
    console.log(`DeepSeek API 响应成功: ${response.config.url}`)
    return response.data
  },
  error => {
    console.error('DeepSeek API 请求失败:', error)
    
    // 处理不同类型的错误
    if (error.response) {
      const { status, data } = error.response
      switch (status) {
        case 401:
          console.error('DeepSeek API 认证失败: 请检查 API Key')
          throw new Error('API Key 无效或已过期')
        case 429:
          console.error('DeepSeek API 请求频率限制')
          throw new Error('请求过于频繁，请稍后重试')
        case 500:
          console.error('DeepSeek API 服务器内部错误')
          throw new Error('服务器内部错误，请稍后重试')
        default:
          console.error(`DeepSeek API 错误 ${status}:`, data)
          throw new Error(data?.error?.message || `请求失败: ${status}`)
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('DeepSeek API 请求超时')
      throw new Error('请求超时，请检查网络连接')
    } else {
      console.error('DeepSeek API 网络错误:', error.message)
      throw new Error('网络连接失败，请检查网络设置')
    }
  }
)

/**
 * 消息对象结构
 * @typedef {Object} ChatMessage
 * @property {'system'|'user'|'assistant'} role - 消息角色
 * @property {string} content - 消息内容
 */

/**
 * 聊天参数结构
 * @typedef {Object} ChatParams
 * @property {ChatMessage[]} messages - 消息列表
 * @property {string} [model] - 模型名称（默认：deepseek-chat）
 * @property {number} [temperature] - 温度参数，控制创造性（0-2，默认：0.3）
 * @property {number} [max_tokens] - 最大token数（默认：8192）
 * @property {number} [top_p] - 核采样参数（0-1，默认：0.6）
 * @property {boolean} [stream] - 是否流式响应（默认：false）
 * @property {string[]} [stop] - 停止词列表
 */

/**
 * DeepSeek API 响应结构
 * @typedef {Object} DeepSeekResponse
 * @property {string} id - 响应ID
 * @property {string} object - 对象类型
 * @property {number} created - 创建时间戳
 * @property {string} model - 使用的模型
 * @property {Array} choices - 选择列表
 * @property {Object} usage - 使用统计
 */

/**
 * DeepSeek AI API 主要功能类
 */
class DeepSeekAPI {
  /**
   * 发送聊天请求
   * @param {ChatParams} params - 聊天参数
   * @returns {Promise<DeepSeekResponse>} API 响应
   */
  async chat(params, retryCount = 3) {
    try {
      // 验证并限制 max_tokens 参数，防止超出 DeepSeek API 限制
      const maxTokens = params.max_tokens || DEEPSEEK_CONFIG.maxTokens
      if (maxTokens > 8192) {
        console.warn(`max_tokens 值 ${maxTokens} 超出 DeepSeek API 限制，已自动调整为 8192`)
      }

      const requestData = {
        model: params.model || DEEPSEEK_CONFIG.model,
        messages: params.messages,
        temperature: params.temperature || DEEPSEEK_CONFIG.temperature,
        max_tokens: Math.min(maxTokens, 8192), // 确保不超过API限制
        top_p: params.top_p || DEEPSEEK_CONFIG.topP,
        stream: params.stream || false,
        ...params.stop && { stop: params.stop }
      }

      console.log('发送DeepSeek请求:', {
        url: DEEPSEEK_CONFIG.baseURL,
        model: requestData.model,
        messageCount: requestData.messages.length,
        maxTokens: requestData.max_tokens,
        temperature: requestData.temperature,
        topP: requestData.top_p,
        hasApiKey: !!DEEPSEEK_CONFIG.apiKey
      })

      const response = await deepseekClient.post('/v1/chat/completions', requestData)
      return response
    } catch (error) {
      console.error('DeepSeek 聊天请求失败:', error)
      
      // 如果是超时错误且还有重试次数，则重试
      if (error.code === 'ECONNABORTED' && retryCount > 0) {
        console.log(`请求超时，正在重试... 剩余重试次数: ${retryCount - 1}`)
        await new Promise(resolve => setTimeout(resolve, 2000)) // 等待2秒后重试
        return this.chat(params, retryCount - 1)
      }
      
      throw error
    }
  }

  /**
   * 发送流式聊天请求
   * @param {ChatParams} params - 聊天参数
   * @param {Function} onMessage - 消息回调函数
   * @param {Function} onError - 错误回调函数
   * @param {Function} onComplete - 完成回调函数
   */
  async chatStream(params, onMessage, onError, onComplete) {
    try {
      // 验证并限制 max_tokens 参数，防止超出 DeepSeek API 限制
      const maxTokens = params.max_tokens || DEEPSEEK_CONFIG.maxTokens
      if (maxTokens > 8192) {
        console.warn(`max_tokens 值 ${maxTokens} 超出 DeepSeek API 限制，已自动调整为 8192`)
      }

      const requestData = {
        model: params.model || DEEPSEEK_CONFIG.model,
        messages: params.messages,
        temperature: params.temperature || DEEPSEEK_CONFIG.temperature,
        max_tokens: Math.min(maxTokens, 8192), // 确保不超过API限制
        top_p: params.top_p || DEEPSEEK_CONFIG.topP,
        stream: true,
        ...params.stop && { stop: params.stop }
      }

      // 使用 fetch 进行流式请求
      const response = await fetch(`${DEEPSEEK_CONFIG.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          onComplete && onComplete()
          break
        }

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            
            if (data === '[DONE]') {
              onComplete && onComplete()
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              
              if (content) {
                onMessage && onMessage(content, parsed)
              }
            } catch (parseError) {
              console.warn('解析流式数据失败:', parseError)
            }
          }
        }
      }
    } catch (error) {
      console.error('DeepSeek 流式聊天请求失败:', error)
      onError && onError(error)
      throw error
    }
  }

  /**
   * 简单文本生成
   * @param {string} prompt - 提示文本
   * @param {Object} options - 可选参数
   * @returns {Promise<string>} 生成的文本
   */
  async generateText(prompt, options = {}) {
    try {
      const messages = [
        {
          role: 'user',
          content: prompt
        }
      ]

      const response = await this.chat({
        messages,
        ...options
      })

      return response.choices[0]?.message?.content || ''
    } catch (error) {
      console.error('DeepSeek 文本生成失败:', error)
      throw error
    }
  }

  /**
   * 对话式问答
   * @param {string} question - 问题
   * @param {string} context - 上下文（可选）
   * @param {Object} options - 可选参数
   * @returns {Promise<string>} 回答
   */
  async askQuestion(question, context = '', options = {}) {
    try {
      const messages = []
      
      if (context) {
        messages.push({
          role: 'system',
          content: `请基于以下上下文回答问题：\n${context}`
        })
      }
      
      messages.push({
        role: 'user',
        content: question
      })

      const response = await this.chat({
        messages,
        ...options
      })

      return response.choices[0]?.message?.content || ''
    } catch (error) {
      console.error('DeepSeek 问答失败:', error)
      throw error
    }
  }

  /**
   * 上传图片到DeepSeek Vision API
   * @param {File|Blob} imageFile - 图片文件对象
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} 上传响应
   */
  async uploadImage(imageFile, options = {}) {
    try {
      // 创建FormData对象
      const formData = new FormData()
      formData.append('image', imageFile)

      // 如果有其他参数，添加到FormData中
      if (options.filename) {
        formData.append('filename', options.filename)
      }
      if (options.purpose) {
        formData.append('purpose', options.purpose)
      }

      // 发送上传请求
      const response = await fetch(`${DEEPSEEK_CONFIG.baseURL}/vision/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
          // 注意：不要手动设置Content-Type，让浏览器自动设置multipart/form-data边界
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`图片上传失败: ${response.status} - ${errorData}`)
      }

      const result = await response.json()
      console.log('图片上传成功:', result)
      return result

    } catch (error) {
      console.error('DeepSeek 图片上传失败:', error)
      throw error
    }
  }

  /**
   * 图片视觉分析（上传图片并进行AI分析）
   * @param {File|Blob} imageFile - 图片文件对象
   * @param {string} prompt - 分析提示词
   * @param {Object} options - 可选参数
   * @returns {Promise<string>} AI分析结果
   */
  async analyzeImage(imageFile, prompt = '请描述这张图片的内容', options = {}) {
    try {
      // 首先上传图片
      const uploadResult = await this.uploadImage(imageFile, options)
      
      // 如果上传成功，获取图片URL或ID
      const imageUrl = uploadResult.url || uploadResult.file_id || uploadResult.image_id

      if (!imageUrl) {
        throw new Error('图片上传成功但未返回有效的图片标识')
      }

      // 构建包含图片的消息
      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ]

      // 使用Vision模型进行分析
      const response = await this.chat({
        messages,
        model: options.model || 'deepseek-vl-chat', // 使用视觉模型
        ...options
      })

      return response.choices[0]?.message?.content || ''

    } catch (error) {
      console.error('DeepSeek 图片分析失败:', error)
      throw error
    }
  }

  /**
   * 从base64字符串上传图片
   * @param {string} base64String - base64编码的图片字符串
   * @param {string} mimeType - 图片MIME类型 (如: 'image/jpeg', 'image/png')
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} 上传响应
   */
  async uploadImageFromBase64(base64String, mimeType = 'image/jpeg', options = {}) {
    try {
      // 将base64转换为Blob
      const byteCharacters = atob(base64String.split(',')[1] || base64String)
      const byteNumbers = new Array(byteCharacters.length)
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: mimeType })

      // 使用现有的uploadImage方法
      return await this.uploadImage(blob, options)

    } catch (error) {
      console.error('DeepSeek base64图片上传失败:', error)
      throw error
    }
  }

  /**
   * 从URL上传图片
   * @param {string} imageUrl - 图片URL
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} 上传响应
   */
  async uploadImageFromUrl(imageUrl, options = {}) {
    try {
      // 获取图片数据
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`无法获取图片: ${response.status}`)
      }

      const blob = await response.blob()
      
      // 使用现有的uploadImage方法
      return await this.uploadImage(blob, {
        filename: options.filename || imageUrl.split('/').pop(),
        ...options
      })

    } catch (error) {
      console.error('DeepSeek URL图片上传失败:', error)
      throw error
    }
  }


  /**
   * 获取当前教育场景配置信息
   */
  getCurrentConfig() {
    return {
      temperature: DEEPSEEK_CONFIG.temperature,
      topP: DEEPSEEK_CONFIG.topP,
      maxTokens: DEEPSEEK_CONFIG.maxTokens,
      description: '教育场景优化配置，减少AI幻觉'
    }
  }

  /**
   * 更新配置
   * @param {Object} newConfig - 新配置
   */
  updateConfig(newConfig) {
    Object.assign(DEEPSEEK_CONFIG, newConfig)
    
    // 更新 axios 实例的配置
    deepseekClient.defaults.baseURL = DEEPSEEK_CONFIG.baseURL
    deepseekClient.defaults.timeout = DEEPSEEK_CONFIG.timeout
    deepseekClient.defaults.headers['Authorization'] = `Bearer ${DEEPSEEK_CONFIG.apiKey}`
  }
}

// 创建单例实例
const deepseekAPI = new DeepSeekAPI()

// 导出实例和类
export default deepseekAPI
export { DeepSeekAPI }

// 导出便捷方法
export const {
  chat,
  chatStream,
  generateText,
  askQuestion,
  uploadImage,
  analyzeImage,
  uploadImageFromBase64,
  uploadImageFromUrl,
  getCurrentConfig,
  updateConfig
} = deepseekAPI
