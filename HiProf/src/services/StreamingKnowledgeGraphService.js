/**
 * 流式知识图谱生成服务
 * 基于 DeepSeek 流式 API，实现实时知识图谱内容生成
 * 
 * 特性：
 * - 实时文本流式输出
 * - 进度回调和错误处理
 * - 可中断的生成过程
 * - 教育场景优化配置
 */

import deepseekAPI from '@/api/ai.js'

/**
 * 流式知识图谱生成器类
 */
export class StreamingKnowledgeGraphService {
  constructor() {
    this.isGenerating = false
    this.controller = null // 用于中断生成
  }

  /**
   * 流式生成知识图谱
   * @param {Object} params - 生成参数
   * @param {string} params.topic - 主题
   * @param {string} params.description - 描述
   * @param {Array} params.parentNodes - 父节点列表
   * @param {Object} callbacks - 回调函数
   * @param {Function} callbacks.onStart - 开始生成回调
   * @param {Function} callbacks.onProgress - 进度回调 (chunk, fullContent) => void
   * @param {Function} callbacks.onComplete - 完成回调 (finalContent) => void
   * @param {Function} callbacks.onError - 错误回调 (error) => void
   * @param {Function} callbacks.onCancel - 取消回调
   */
  async generateStream({
    topic,
    description = '',
    parentNodes = [],
    callbacks = {}
  }) {
    const {
      onStart = () => {},
      onProgress = () => {},
      onComplete = () => {},
      onError = () => {},
      onCancel = () => {}
    } = callbacks

    // 防止重复调用
    if (this.isGenerating) {
      throw new Error('正在生成中，请等待完成或先取消当前任务')
    }

    this.isGenerating = true
    let accumulatedContent = '' // 累积的完整内容

    try {
      // 开始生成
      onStart()

      // 构建提示词
      const prompt = this.buildPrompt(topic, description, parentNodes)
      
      console.log('开始流式生成知识图谱...')
      console.log('主题:', topic)
      console.log('父节点数量:', parentNodes.length)

      // 调用流式API
      await deepseekAPI.chatStream(
        {
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
          // 使用默认的教育场景配置 (temperature: 0.3, topP: 0.6)
        },
        // onMessage - 每次收到新内容时调用
        (chunk, rawResponse) => {
          if (!this.isGenerating) return // 如果已取消，忽略后续内容

          accumulatedContent += chunk
          console.log('收到新内容块:', chunk)
          console.log('累积内容长度:', accumulatedContent.length)

          // 调用进度回调
          onProgress(chunk, accumulatedContent, rawResponse)
        },
        // onError - 发生错误时调用
        (error) => {
          console.error('流式生成过程中发生错误:', error)
          this.isGenerating = false
          onError(error)
        },
        // onComplete - 生成完成时调用
        () => {
          console.log('流式生成完成')
          console.log('最终内容长度:', accumulatedContent.length)
          
          this.isGenerating = false

          // 验证生成的内容
          if (!accumulatedContent || accumulatedContent.trim().length === 0) {
            const error = new Error('生成的内容为空，可能是网络问题或参数配置问题')
            onError(error)
            return
          }

          // 调用完成回调
          onComplete(accumulatedContent.trim())
        }
      )

    } catch (error) {
      console.error('启动流式生成失败:', error)
      this.isGenerating = false
      onError(error)
    }
  }

  /**
   * 取消当前生成任务
   */
  cancel() {
    if (this.isGenerating) {
      console.log('取消流式生成任务')
      this.isGenerating = false
      
      // 这里可以添加更复杂的中断逻辑
      // 比如调用 AbortController 等
    }
  }

  /**
   * 检查是否正在生成
   */
  get isActive() {
    return this.isGenerating
  }

  /**
   * 构建知识图谱生成提示词
   * @private
   */
  buildPrompt(topic, description, parentNodes) {
    let prompt = `请为以下主题生成详细的知识图谱内容：

**主题**: ${topic}`

    if (description) {
      prompt += `\n**描述**: ${description}`
    }

    if (parentNodes && parentNodes.length > 0) {
      prompt += `\n\n**现有知识节点**:\n`
      parentNodes.forEach((node, index) => {
        prompt += `${index + 1}. ${node.label || node.name || node.title}\n`
      })
      prompt += `\n请基于现有节点扩展和补充相关知识点。`
    }

    prompt += `

**要求**:
1. 生成结构化的知识图谱内容
2. 包含核心概念、关键要点、相关知识点
3. 确保内容准确、权威，适合教育场景
4. 使用清晰的层次结构组织内容
5. 提供具体的知识点和概念解释

请开始生成知识图谱内容：`

    return prompt
  }

  /**
   * 生成简化版本（用于快速预览）
   */
  async generateQuickPreview({ topic, description = '' }) {
    const quickPrompt = `请为"${topic}"生成简短的知识图谱预览，包含3-5个核心知识点：${description ? '\n描述：' + description : ''}`
    
    try {
      const response = await deepseekAPI.generateText(quickPrompt, {
        max_tokens: 1000,
        temperature: 0.3
      })
      
      return response
    } catch (error) {
      console.error('生成快速预览失败:', error)
      throw error
    }
  }
}

// 创建单例实例
const streamingKnowledgeGraphService = new StreamingKnowledgeGraphService()

// 导出实例和类
export default streamingKnowledgeGraphService
export { StreamingKnowledgeGraphService }

// 导出便捷方法
export const {
  generateStream,
  cancel: cancelGeneration,
  isActive: isGenerating,
  generateQuickPreview
} = streamingKnowledgeGraphService
