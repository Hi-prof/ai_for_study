<template>
  <div class="ai-lesson-plan-generator">
    <!-- 页面标题 -->
    <div class="page-header">
      <button class="btn btn-secondary" @click="goBack">
        <i class="close-icon"></i>
        返回
      </button>
      <h2 class="page-title">AI智能生成教案</h2>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-container">
      <!-- 左侧输入区域 -->
      <div class="left-panel" :style="{ width: leftPanelWidth + '%' }">
        <div class="input-section">
          <!-- API配置状态 -->
          <div class="api-status-section" v-if="!isApiConfigured">
            <div class="api-warning">
              ⚠️ DeepSeek API未配置
              <p class="api-help">
                请在项目根目录创建 .env 文件并添加：<br>
                <code>VITE_DEEPSEEK_API_KEY=你的API密钥</code><br>
                <a href="https://platform.deepseek.com/api_keys" target="_blank">获取API密钥</a>
              </p>
            </div>
          </div>

      <!-- 文件上传区域 -->
      <div class="form-group">
        <label class="form-label">上传文档文件（可选）</label>
        <div class="file-upload-area">
          <input
            type="file"
            ref="fileInput"
            class="file-input"
            accept=".txt,.pdf,.docx,.doc,.pptx,.ppt"
            @change="handleFileUpload"
            :disabled="isUploading"
          />
          <div class="file-upload-button" @click="triggerFileUpload" :class="{ 'uploading': isUploading }">
            <i class="upload-icon" v-if="!isUploading"></i>
            <i class="loading-icon" v-else></i>
            <span>{{ isUploading ? '正在读取文件...' : '选择文档文件' }}</span>
          </div>
          <div class="file-upload-hint">
            支持 .txt、.pdf、.docx、.doc、.pptx、.ppt 格式，最大 50MB
          </div>
        </div>
        <!-- 已上传文件显示 -->
        <div v-if="uploadedFileName" class="uploaded-file-info">
          <div class="file-item">
            <i class="file-icon"></i>
            <span class="file-name">{{ uploadedFileName }}</span>
            <button class="btn-remove" @click="removeUploadedFile" title="移除文件">
              <i class="close-icon"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 教案要求 -->
      <div class="form-group">
        <label class="form-label">
          教案信息
          <span class="input-mode-hint" v-if="uploadedFileName">（已从文件加载内容，可继续编辑）</span>
        </label>
        <textarea
          v-model="lessonPlanRequirements"
          class="form-textarea large-textarea"
          rows="15"
          placeholder="请输入教案信息，AI将根据您提供的内容生成完整的教案，例如：&#10;&#10;课程名称：高等数学基础&#10;课程类型：必修课&#10;学时：2学时&#10;教学目标：&#10;1. 掌握函数的基本概念和性质&#10;2. 理解极限的定义和计算方法&#10;3. 能够运用所学知识解决实际问题&#10;&#10;教学重点：函数概念、极限计算&#10;教学难点：极限概念的理解&#10;&#10;教学内容：&#10;1. 函数的定义和性质&#10;2. 极限的概念&#10;3. 极限的计算方法&#10;4. 实际应用举例&#10;&#10;请生成包含教学目标、教学内容、教学方法、教学过程等完整模块的教案。&#10;&#10;或者点击上方选择文档文件按钮上传现有的课程文档。"
        ></textarea>
      </div>
        </div>

        <!-- 生成按钮 -->
        <div class="action-section">
          <button
            class="btn btn-ai btn-large"
            @click="generateLessonPlan"
            :disabled="!lessonPlanRequirements.trim() || isGenerating"
          >
            <i class="ai-icon" v-if="!isGenerating"></i>
            <i class="loading-icon" v-else></i>
            {{ generatingText }}
          </button>
        </div>
      </div>

      <!-- 可拖拽的分割线 -->
      <div 
        class="resizer" 
        @mousedown="startResize"
        :class="{ 'resizing': isResizing }"
      ></div>

      <!-- 右侧结果区域 -->
      <div class="right-panel" :style="{ width: rightPanelWidth + '%' }">
        <div class="result-section">
          <div class="result-header">
            <h3 class="result-title">生成结果</h3>
            <div class="result-controls" v-if="generatedResult">
              <div class="view-mode-toggle">
                <button 
                  :class="['toggle-btn', { active: viewMode === 'preview' }]"
                  @click="viewMode = 'preview'"
                >
                  预览模式
                </button>
                <button 
                  :class="['toggle-btn', { active: viewMode === 'text' }]"
                  @click="viewMode = 'text'"
                >
                  文本模式
                </button>
              </div>
              <div class="action-buttons">
                <button class="btn btn-secondary btn-sm" @click="resetResult" v-if="isResultModified">
                  <i class="reset-icon"></i>
                  恢复原始
                </button>
                <button class="btn btn-primary btn-sm" @click="saveLessonPlan" :disabled="!generatedResult.trim()">
                  <i class="save-icon"></i>
                  保存教案
                </button>
                <button class="btn btn-success btn-sm" @click="downloadLessonPlan" :disabled="!generatedResult.trim()">
                  <i class="download-icon"></i>
                  导出Word
                </button>
              </div>
            </div>
          </div>

          <div class="result-content">
            <!-- 预览模式 -->
            <div v-if="viewMode === 'preview' && parsedLessonPlan" class="preview-content">
              <div class="lesson-plan-preview">
                <h2 class="lesson-title">{{ parsedLessonPlan.title }}</h2>
                
                <div class="lesson-modules">
                  <div 
                    v-for="(module, index) in parsedLessonPlan.modules" 
                    :key="index" 
                    class="lesson-module"
                  >
                    <h3 class="module-title">{{ module.title }}</h3>
                    <div class="module-content" v-html="formatModuleContent(module.content)"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 文本模式 -->
            <div v-else-if="viewMode === 'text'" class="text-content">
              <textarea
                v-model="generatedResult"
                class="result-textarea"
                placeholder="AI生成的教案内容将显示在这里..."
                @input="onResultEdit"
              ></textarea>
            </div>

            <!-- 正在生成状态 -->
            <div v-else-if="isGenerating && !generatedResult" class="generating-result">
              <div class="generating-icon">✨</div>
              <p class="generating-text">{{ generatingText }}</p>
              <div class="generating-hint">内容将在这里实时显示...</div>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-result">
              <div class="empty-icon">📄</div>
              <p class="empty-text">请在左侧输入教案要求，然后点击"开始生成教案"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { DeepSeekAPI } from '@/api/ai';
import { parseLessonPlan, isLessonPlanContent } from '@/utils/lessonParser';
import { createLessonPlan } from '@/api/lessonPlan';
import { downloadLessonPlanAsWord } from '@/utils/wordGenerator';
import { getCourseById } from '@/api/courses';
import { parseFileContent, validateFile, getFileTypeName, formatFileSize } from '@/utils/fileParser.js';

// 导入样式文件
import '@/teacher/styles/ai-lesson-plan-generator.css';

// 定义props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
});

// 路由
const router = useRouter();

// DeepSeek API实例
const deepseekAPI = new DeepSeekAPI();

// 响应式数据
const leftPanelWidth = ref(50); // 左侧面板宽度百分比
const rightPanelWidth = computed(() => 100 - leftPanelWidth.value); // 右侧面板宽度百分比
const isResizing = ref(false); // 是否正在调整大小

// 表单数据
const lessonPlanRequirements = ref('');

// 文件上传相关
const fileInput = ref(null);
const isUploading = ref(false);
const uploadedFileName = ref('');

// 生成状态
const isGenerating = ref(false);
const generatingText = ref('开始生成教案');
const generatedResult = ref('');
const originalResult = ref(''); // 保存AI原始生成的内容
const isResultModified = ref(false); // 标记结果是否被修改

// 预览相关数据
const viewMode = ref('preview'); // 'preview' 或 'text'
const parsedLessonPlan = ref(null); // 解析后的教案数据

// 课程信息
const courseName = ref(''); // 课程名称

// API配置检查
const isApiConfigured = computed(() => {
  return import.meta.env.VITE_DEEPSEEK_API_KEY && import.meta.env.VITE_DEEPSEEK_API_KEY.trim() !== '';
});

// 节流解析函数，避免频繁解析影响性能
let parseThrottleTimeout = null;
const throttledParseGeneratedLessonPlan = () => {
  if (parseThrottleTimeout) {
    clearTimeout(parseThrottleTimeout);
  }
  parseThrottleTimeout = setTimeout(() => {
    parseGeneratedLessonPlan();
  }, 200); // 200ms节流
};

// 获取课程信息
const loadCourseInfo = async () => {
  try {
    if (props.courseId) {
      const courseResponse = await getCourseById(props.courseId);
      if (courseResponse && courseResponse.courseData) {
        courseName.value = courseResponse.courseData.name || '未命名课程';
      }
    }
  } catch (error) {
    console.error('获取课程信息失败:', error);
    courseName.value = '未知课程';
  }
};

// 组件挂载时加载课程信息
onMounted(() => {
  loadCourseInfo();
});

// 拖拽调整大小相关方法
const startResize = (e) => {
  isResizing.value = true;
  document.addEventListener('mousemove', handleResize, { passive: false });
  document.addEventListener('mouseup', stopResize, { passive: true });
  e.preventDefault();
};

const handleResize = (e) => {
  if (!isResizing.value) return;
  
  const container = document.querySelector('.content-container');
  const containerRect = container.getBoundingClientRect();
  const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
  
  // 限制最小和最大宽度
  if (newLeftWidth >= 20 && newLeftWidth <= 80) {
    leftPanelWidth.value = newLeftWidth;
  }
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
};

// 生成教案方法（流式输出）
const generateLessonPlan = async () => {
  if (!lessonPlanRequirements.value.trim()) {
    alert('请输入教案信息');
    return;
  }

  if (!isApiConfigured.value) {
    alert('请先配置DeepSeek API密钥\n\n在项目根目录创建 .env 文件并添加：\nVITE_DEEPSEEK_API_KEY=你的API密钥\n\n获取API密钥：https://platform.deepseek.com/api_keys');
    return;
  }

  isGenerating.value = true;
  generatingText.value = '正在连接AI服务...';
  
  // 清空之前的结果，准备接收流式输出
  generatedResult.value = '';
  originalResult.value = '';
  isResultModified.value = false;
  parsedLessonPlan.value = null;

  try {
    // 构建发送给AI的提示词
    const systemPrompt = `请根据以下要求生成一份完整的教案，严格按照以下格式：

[教案标题]

### 教学目标 ###
（详细列出知识目标、能力目标、情感目标）

### 教学重点 ###
（明确指出本课的重点内容）

### 教学难点 ###
（明确指出本课的难点内容）

### 教学方法 ###
（选择合适的教学方法，如讲授法、讨论法、实验法等）

### 教学过程 ###
（详细描述教学的各个环节，包括导入、新课讲授、练习巩固、总结等）

### 板书设计 ###
（设计清晰的板书布局）

### 作业布置 ###
（安排课后作业和练习）

### 教学反思 ###
（预设可能的问题和改进方向）

要求：
1. 内容要详实具体，符合教学实际
2. 语言要规范、准确、简洁
3. 结构要清晰，层次分明
4. 严格按照格式要求，用###包围模块标题
5. 用[]包围教案总标题

要生成教案的课程信息如下：`;

    // 组合完整的用户输入
    const userMessage = systemPrompt + lessonPlanRequirements.value;

    generatingText.value = '正在生成教案内容...';

    // 使用流式输出API
    await deepseekAPI.chatStream(
      {
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      },
      // 流式内容回调 - 每次收到新内容时执行
      (content) => {
        generatedResult.value += content;
        generatingText.value = `正在生成... (${Math.floor(generatedResult.value.length / 10)}0+ 字符)`;
        
        // 实时解析教案（节流处理，避免频繁解析）
        throttledParseGeneratedLessonPlan();
      },
      // 错误回调
      (error) => {
        throw error;
      },
      // 完成回调
      () => {
        originalResult.value = generatedResult.value; // 保存原始内容
        isResultModified.value = false; // 重置修改状态
        generatingText.value = '生成完成';
        console.log('教案生成完成，总字符数:', generatedResult.value.length);
      }
    );

  } catch (error) {
    console.error('生成教案失败:', error);

    // 根据错误类型提供更详细的错误信息
    let errorMessage = '生成教案失败，请重试';
    let suggestion = '';
    
    if (error.message.includes('API key') || error.message.includes('API Key')) {
      errorMessage = 'API密钥配置错误';
      suggestion = '请检查环境变量中的VITE_DEEPSEEK_API_KEY是否正确配置';
    } else if (error.message.includes('请求超时') || error.message.includes('timeout')) {
      errorMessage = '请求超时';
      suggestion = '教案生成需要较长时间，请稍后重试。如果问题持续存在，请检查网络连接或尝试简化教案要求';
    } else if (error.message.includes('请求过于频繁')) {
      errorMessage = 'API调用频率过高';
      suggestion = '请等待1-2分钟后再次尝试';
    } else if (error.message.includes('网络连接失败')) {
      errorMessage = '网络连接失败';
      suggestion = '请检查网络连接是否正常，确保可以访问DeepSeek API服务';
    } else if (error.response && error.response.status === 401) {
      errorMessage = 'API认证失败';
      suggestion = '请检查API密钥是否有效且未过期';
    }

    // 显示详细的错误信息
    const fullMessage = suggestion ? `${errorMessage}\n\n建议：${suggestion}` : errorMessage;
    alert(fullMessage);
    
    generatingText.value = '生成失败，请重试';
  } finally {
    setTimeout(() => {
      isGenerating.value = false;
      generatingText.value = '开始生成教案';
    }, 1000);
  }
};

// 解析生成的教案
const parseGeneratedLessonPlan = () => {
  if (!generatedResult.value.trim()) {
    parsedLessonPlan.value = null;
    return;
  }

  try {
    // 检查是否为教案格式
    if (isLessonPlanContent(generatedResult.value)) {
      parsedLessonPlan.value = parseLessonPlan(generatedResult.value);
    } else {
      // 如果不是标准格式，创建一个简单的结构
      parsedLessonPlan.value = {
        title: '生成的教案',
        modules: [
          {
            title: '教案内容',
            content: generatedResult.value
          }
        ]
      };
    }
  } catch (error) {
    console.error('解析教案失败:', error);
    // 即使解析失败，也创建一个基础结构
    parsedLessonPlan.value = {
      title: '生成的教案',
      modules: [
        {
          title: '教案内容',
          content: generatedResult.value
        }
      ]
    };
  }
};

// 格式化模块内容（将换行转换为HTML）
const formatModuleContent = (content) => {
  if (!content) return '';
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
};

// 监听生成结果变化，自动解析
watch(generatedResult, () => {
  parseGeneratedLessonPlan();
});

// 返回上一页
const goBack = () => {
  router.back();
};

// 重置结果为AI原始生成内容
const resetResult = () => {
  if (originalResult.value) {
    generatedResult.value = originalResult.value;
    isResultModified.value = false;
    parseGeneratedLessonPlan(); // 重新解析
  }
};

// 结果编辑处理
const onResultEdit = () => {
  isResultModified.value = generatedResult.value !== originalResult.value;
};

// 保存教案
const saveLessonPlan = async () => {
  if (!parsedLessonPlan.value) {
    alert('请先生成教案内容');
    return;
  }

  try {
    // 准备教案数据
    const lessonPlanData = {
      title: parsedLessonPlan.value.title,
      createUser: '当前用户', // 这里应该从用户状态中获取
      tpModuleList: parsedLessonPlan.value.modules.map((module, index) => ({
        id: 0, // 新建时为0
        title: module.title,
        orderIndex: index + 1,
        content: module.content
      }))
    };

    // 调用API保存教案
    const response = await createLessonPlan(lessonPlanData);
    
    if (response) {
      alert('教案保存成功！');
    } else {
      throw new Error('保存失败');
    }
  } catch (error) {
    console.error('保存教案失败:', error);
    alert('保存教案失败，请重试');
  }
};

// 下载教案为Word文档
const downloadLessonPlan = async () => {
  if (!generatedResult.value.trim()) {
    alert('请先生成教案内容');
    return;
  }

  try {
    const filename = `${parsedLessonPlan.value?.title || '教案'}_${new Date().toLocaleDateString()}.docx`;
    await downloadLessonPlanAsWord(generatedResult.value, filename);
    alert('教案导出成功！');
  } catch (error) {
    console.error('导出教案失败:', error);
    alert('导出教案失败，请重试');
  }
};

// 文件上传相关方法
const triggerFileUpload = () => {
  if (!isUploading.value && fileInput.value) {
    fileInput.value.click();
  }
};

const handleFileUpload = async (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const file = files[0];

  try {
    isUploading.value = true;

    // 使用文件解析模块读取文件内容
    const content = await parseFileContent(file);

    // 将内容填充到文本框
    if (content.trim()) {
      // 如果已有内容，询问用户是否替换
      if (lessonPlanRequirements.value.trim()) {
        const shouldReplace = confirm('检测到已有内容，是否要替换为文件内容？\n点击"确定"替换，点击"取消"追加到末尾。');
        if (shouldReplace) {
          lessonPlanRequirements.value = content;
        } else {
          lessonPlanRequirements.value = lessonPlanRequirements.value + '\n\n' + content;
        }
      } else {
        lessonPlanRequirements.value = content;
      }

      uploadedFileName.value = file.name;
      console.log(`文件上传成功: ${file.name} (${getFileTypeName(file.name)}, ${formatFileSize(file.size)})`);
    } else {
      throw new Error('文件内容为空或无法读取');
    }

  } catch (error) {
    console.error('文件上传失败:', error);
    alert(`文件上传失败: ${error.message}`);
    uploadedFileName.value = '';
  } finally {
    isUploading.value = false;
    // 清空文件输入，允许重新选择同一文件
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

const removeUploadedFile = () => {
  uploadedFileName.value = '';
  // 可选：清空文本框内容
  const shouldClearContent = confirm('是否同时清空文本框中的内容？');
  if (shouldClearContent) {
    lessonPlanRequirements.value = '';
  }
};
</script>