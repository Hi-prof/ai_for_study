/**
 * DeepSeek API 使用示例
 * 展示如何在项目中使用 DeepSeek AI 功能
 */

import deepseekAPI from '@/api/ai.js'

/**
 * 示例1: 基础聊天对话
 */
export async function basicChatExample() {
  try {
    const messages = [
      {
        role: 'system',
        content: '你是一个专业的教学助手，帮助老师进行备课和教学设计。'
      },
      {
        role: 'user',
        content: '请帮我设计一个关于"函数"概念的数学课程大纲。'
      }
    ]

    const response = await deepseekAPI.chat({
      messages,
      temperature: 0.7,
      max_tokens: 2000
    })

    console.log('DeepSeek 回复:', response.choices[0].message.content)
    return response.choices[0].message.content
  } catch (error) {
    console.error('基础聊天示例失败:', error)
    throw error
  }
}

/**
 * 示例2: 流式对话
 */
export async function streamChatExample() {
  try {
    const messages = [
      {
        role: 'user',
        content: '请详细解释什么是机器学习，并给出一些实际应用例子。'
      }
    ]

    let fullResponse = ''

    await deepseekAPI.chatStream(
      { messages },
      // 消息回调 - 每次收到新内容时调用
      (content, data) => {
        console.log('收到内容片段:', content)
        fullResponse += content
        // 这里可以实时更新UI显示
      },
      // 错误回调
      (error) => {
        console.error('流式对话出错:', error)
      },
      // 完成回调
      () => {
        console.log('流式对话完成，完整回复:', fullResponse)
      }
    )

    return fullResponse
  } catch (error) {
    console.error('流式聊天示例失败:', error)
    throw error
  }
}

/**
 * 示例3: 简单文本生成
 */
export async function textGenerationExample() {
  try {
    const prompt = '请写一篇关于人工智能在教育领域应用的短文，大约300字。'
    
    const result = await deepseekAPI.generateText(prompt, {
      temperature: 0.8,
      max_tokens: 500
    })

    console.log('生成的文本:', result)
    return result
  } catch (error) {
    console.error('文本生成示例失败:', error)
    throw error
  }
}

/**
 * 示例4: 问答功能
 */
export async function questionAnswerExample() {
  try {
    const context = `
    人工智能（AI）是计算机科学的一个分支，致力于创建能够执行通常需要人类智能的任务的系统。
    这些任务包括学习、推理、问题解决、感知和语言理解。
    AI的主要技术包括机器学习、深度学习、自然语言处理和计算机视觉。
    `
    
    const question = '人工智能的主要技术有哪些？'
    
    const answer = await deepseekAPI.askQuestion(question, context, {
      temperature: 0.3 // 较低的温度以获得更准确的答案
    })

    console.log('问题:', question)
    console.log('答案:', answer)
    return answer
  } catch (error) {
    console.error('问答示例失败:', error)
    throw error
  }
}

/**
 * 示例6: 教学内容生成
 */
export async function teachingContentExample() {
  try {
    const subject = '高中数学'
    const topic = '二次函数'
    const grade = '高一'
    
    const prompt = `
    请为${grade}学生设计一个关于"${topic}"的${subject}教学方案，包括：
    1. 学习目标
    2. 重点难点
    3. 教学过程（导入、新课、练习、总结）
    4. 课后作业建议
    
    要求内容详细、结构清晰、适合学生理解。
    `

    const teachingPlan = await deepseekAPI.generateText(prompt, {
      temperature: 0.6,
      max_tokens: 3000
    })

    console.log('教学方案:', teachingPlan)
    return teachingPlan
  } catch (error) {
    console.error('教学内容生成示例失败:', error)
    throw error
  }
}

/**
 * 示例7: 多轮对话
 */
export async function multiTurnConversationExample() {
  try {
    const conversationHistory = [
      {
        role: 'system',
        content: '你是一个专业的数学老师，正在帮助学生理解数学概念。'
      },
      {
        role: 'user',
        content: '什么是函数？'
      },
      {
        role: 'assistant',
        content: '函数是数学中的一个基本概念。简单来说，函数就是一种特殊的对应关系，它将一个集合（定义域）中的每个元素，都对应到另一个集合（值域）中的唯一元素。'
      },
      {
        role: 'user',
        content: '能给我举个具体的例子吗？'
      }
    ]

    const response = await deepseekAPI.chat({
      messages: conversationHistory,
      temperature: 0.7
    })

    console.log('多轮对话回复:', response.choices[0].message.content)
    return response.choices[0].message.content
  } catch (error) {
    console.error('多轮对话示例失败:', error)
    throw error
  }
}

/**
 * 示例8: 配置管理
 */
export function configManagementExample() {
  try {
    // 获取当前配置
    const currentConfig = deepseekAPI.getConfig()
    console.log('当前配置:', currentConfig)

    // 更新配置
    deepseekAPI.updateConfig({
      temperature: 0.5,
      maxTokens: 2048,
      model: 'deepseek-coder' // 切换到代码模型
    })

    const updatedConfig = deepseekAPI.getConfig()
    console.log('更新后配置:', updatedConfig)

    return { currentConfig, updatedConfig }
  } catch (error) {
    console.error('配置管理示例失败:', error)
    throw error
  }
}

/**
 * 在Vue组件中使用的示例
 */
export const vueComponentExample = {
  data() {
    return {
      userInput: '',
      aiResponse: '',
      isLoading: false,
      conversationHistory: []
    }
  },
  
  methods: {
    async sendMessage() {
      if (!this.userInput.trim()) return
      
      this.isLoading = true
      
      try {
        // 添加用户消息到历史记录
        this.conversationHistory.push({
          role: 'user',
          content: this.userInput
        })

        // 调用DeepSeek API
        const response = await deepseekAPI.chat({
          messages: this.conversationHistory,
          temperature: 0.7
        })

        const aiMessage = response.choices[0].message.content
        
        // 添加AI回复到历史记录
        this.conversationHistory.push({
          role: 'assistant',
          content: aiMessage
        })

        this.aiResponse = aiMessage
        this.userInput = ''
      } catch (error) {
        console.error('发送消息失败:', error)
        this.$message.error('发送消息失败: ' + error.message)
      } finally {
        this.isLoading = false
      }
    },

    async sendStreamMessage() {
      if (!this.userInput.trim()) return
      
      this.isLoading = true
      this.aiResponse = ''
      
      try {
        const messages = [
          ...this.conversationHistory,
          {
            role: 'user',
            content: this.userInput
          }
        ]

        await deepseekAPI.chatStream(
          { messages },
          (content) => {
            // 实时更新AI回复
            this.aiResponse += content
          },
          (error) => {
            console.error('流式对话出错:', error)
            this.$message.error('对话出错: ' + error.message)
          },
          () => {
            // 对话完成
            this.conversationHistory.push(
              { role: 'user', content: this.userInput },
              { role: 'assistant', content: this.aiResponse }
            )
            this.userInput = ''
            this.isLoading = false
          }
        )
      } catch (error) {
        console.error('流式对话失败:', error)
        this.$message.error('对话失败: ' + error.message)
        this.isLoading = false
      }
    }
  }
}

// 导出所有示例函数
export default {
  basicChatExample,
  streamChatExample,
  textGenerationExample,
  questionAnswerExample,
  codeAssistantExample,
  teachingContentExample,
  multiTurnConversationExample,
  configManagementExample,
  vueComponentExample
}
