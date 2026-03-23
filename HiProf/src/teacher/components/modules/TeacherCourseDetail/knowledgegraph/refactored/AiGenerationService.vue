<template>
  <div class="ai-generation-service">
    <!-- 这个组件不渲染UI，只提供服务 -->
  </div>
</template>

<script setup>
import { ref, defineEmits, defineExpose } from 'vue';
import deepseekAPI from '@/api/ai.js';

// 定义事件
const emit = defineEmits([
  'generation-start',
  'generation-progress', // 新增：流式输出进度事件
  'generation-success', 
  'generation-error',
  'generation-complete'
]);

// 生成状态
const isGenerating = ref(false);
const generatedResult = ref('');
const originalResult = ref(''); // 保存AI原始生成的内容
const isResultModified = ref(false); // 标记结果是否被修改

// 生成知识图谱方法
const generateKnowledgeGraph = async (requirements) => {
  if (!requirements || !requirements.trim()) {
    const error = new Error('请输入知识图谱内容描述');
    emit('generation-error', error);
    return;
  }

  isGenerating.value = true;
  emit('generation-start');

  try {
    // 构建发送给AI的提示词
    const systemPrompt = `请根据以下文本或者描述生成知识图谱的层次结构。

【重要提醒】
1. 每个知识点的context必须包含完整的5个部分：定义、属性、示例、关联、参考，不能省略任何部分！
2. 可以使用联网搜索获取最新、最准确的信息，确保内容的权威性和时效性！
3. 在"来源与参考"部分，优先引用权威的标准、规范、教材或学术资料！

严格按照以下格式：

格式示例：
1:{name:JavaScript函数基础,context:||定义||函数是一段可重复使用的代码块，用于执行特定任务，是JavaScript编程的核心概念||属性||包含函数名、参数列表、函数体、返回值等要素||示例||常用于封装重复逻辑、模块化开发、事件处理等场景||关联||与变量作用域、闭包、原型链等概念密切相关||参考||基于ECMAScript标准规范}
1.1:{name:函数定义,context:||定义||使用function关键字或箭头函数语法来定义函数的过程||属性||函数名、参数列表、函数体是必要组成部分||示例||function add(a,b){return a+b}或const add=(a,b)=>a+b||关联||与函数调用、作用域、提升等概念相关||参考||JavaScript语言规范}
1.1.1:{name:普通函数,context:||定义||使用function关键字定义的传统函数形式||属性||具有函数提升、this绑定、arguments对象等特性||示例||function getName(){return this.name}适用于需要动态this的场景||关联||与箭头函数、方法调用、构造函数相对比||参考||ES5标准规范}
1.2:{name:函数调用,context:||定义||通过函数名加括号的方式执行函数代码||属性||函数名、参数传递、返回值接收||示例||result=add(1,2)将参数传入并获取返回值||关联||与函数定义、作用域链、执行上下文相关||参考||JavaScript执行机制}

2:{name:变量与数据类型,context:||定义||JavaScript中用于存储和操作数据的基本概念||属性||包括声明方式、数据类型、作用域、生命周期等||示例||let name='张三';const age=25;用于存储程序数据||关联||与函数、对象、内存管理等概念相关||参考||ECMAScript数据类型规范}

要求：
- 生成的知识图谱应该具有清晰的层次结构
- 知识点之间应该有逻辑关联
- 每个知识点名称要简洁明确
- 【重要】每个知识点的context部分必须使用特殊分隔符格式，包含以下5个部分，缺一不可：
  ||定义||[核心概念和基本定义]
  ||属性||[关键要素、特征或属性]
  ||示例||[具体例子和实际应用场景]
  ||关联||[与其他知识点的关联关系]
  ||参考||[理论依据或参考标准]
- 严格按照"编号:{name:名称,context:内容}"的格式
- name和context都不要加引号，直接写内容
- context部分必须使用||分隔符格式：||定义||...||属性||...||示例||...||关联||...||参考||...
- 分隔符必须是双竖线||，不要使用其他符号
- 不要省略任何部分，确保每个知识点都有完整的5个维度描述
- 参考上面的示例格式进行生成，确保格式完整

要处理的内容描述如下：`;

    // 组合完整的用户输入
    const userMessage = systemPrompt + requirements;

    // 重置结果状态
    generatedResult.value = '';
    originalResult.value = '';
    isResultModified.value = false;
    
    let accumulatedContent = ''; // 累积的完整内容
    
    console.log('开始流式生成知识图谱内容...');
    
    // 使用流式API调用DeepSeek
    await deepseekAPI.chatStream(
      {
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
        // 使用默认的教育场景配置，无需额外指定参数
      },
      // onMessage - 每次收到新内容时调用
      (chunk, rawResponse) => {
        if (!isGenerating.value) return; // 如果已停止生成，忽略后续内容

        accumulatedContent += chunk;
        generatedResult.value = accumulatedContent;
        
        console.log('收到流式内容块:', chunk);
        console.log('当前累积内容长度:', accumulatedContent.length);

        // 发送进度更新事件
        emit('generation-progress', {
          chunk: chunk,
          accumulated: accumulatedContent,
          length: accumulatedContent.length
        });
      },
      // onError - 发生错误时调用
      (error) => {
        console.error('流式生成过程中发生错误:', error);
        isGenerating.value = false;
        
        // 抛出错误，会被外层catch捕获
        throw error;
      },
      // onComplete - 生成完成时调用
      () => {
        console.log('流式生成完成');
        console.log('最终生成内容长度:', accumulatedContent.length);
        
        // 验证生成的内容
        if (!accumulatedContent || accumulatedContent.trim().length === 0) {
          const error = new Error('AI生成的内容为空，可能是网络问题或参数配置问题');
          isGenerating.value = false;
          throw error;
        }

        // 保存最终结果
        const finalContent = accumulatedContent.trim();
        generatedResult.value = finalContent;
        originalResult.value = finalContent; // 保存原始内容
        isResultModified.value = false; // 重置修改状态
        
        // 发送成功事件
        emit('generation-success', {
          result: finalContent,
          original: finalContent
        });
      }
    );

  } catch (error) {
    console.error('生成知识图谱失败:', error);

    // 根据错误类型提供更详细的错误信息
    let errorMessage = '生成知识图谱失败，请重试';
    if (error.message.includes('API key')) {
      errorMessage = 'API密钥配置错误，请检查配置';
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      errorMessage = '网络连接失败，请检查网络连接';
    } else if (error.response && error.response.status === 429) {
      errorMessage = 'API调用频率过高，请稍后重试';
    } else if (error.response && error.response.status === 401) {
      errorMessage = 'API认证失败，请检查API密钥';
    }

    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    emit('generation-error', enhancedError);
  } finally {
    isGenerating.value = false;
    emit('generation-complete');
  }
};

// 停止生成
const stopGeneration = () => {
  if (isGenerating.value) {
    console.log('用户手动停止知识图谱生成');
    isGenerating.value = false;
    emit('generation-complete');
  }
};

// 重置结果为AI原始生成内容
const resetResult = () => {
  if (originalResult.value) {
    generatedResult.value = originalResult.value;
    isResultModified.value = false;
    return originalResult.value;
  }
  return '';
};

// 更新生成结果
const updateResult = (newResult) => {
  generatedResult.value = newResult;
  if (originalResult.value && newResult !== originalResult.value) {
    isResultModified.value = true;
  } else if (newResult === originalResult.value) {
    isResultModified.value = false;
  }
};

// 获取当前状态
const getState = () => ({
  isGenerating: isGenerating.value,
  generatedResult: generatedResult.value,
  originalResult: originalResult.value,
  isResultModified: isResultModified.value
});

// 暴露方法给父组件
defineExpose({
  generateKnowledgeGraph,
  stopGeneration,
  resetResult,
  updateResult,
  getState,
  isGenerating,
  generatedResult,
  originalResult,
  isResultModified
});
</script>

<style scoped>
.ai-generation-service {
  display: none;
}
</style>
