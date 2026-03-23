<template>
  <div class="ai-chapter-generator">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">AI智能生成章节</h2>
      <button class="btn btn-secondary" @click="goBack">
        <i class="close-icon"></i>
        返回
      </button>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-container">
      <!-- 左侧输入区域 -->
      <div class="left-panel" :style="{ width: leftPanelWidth + '%' }">
        <div class="input-section">
          <!-- 章节要求 -->
          <div class="form-group">
            <label class="form-label">章节信息</label>
            <textarea
              v-model="chapterRequirements"
              class="form-textarea large-textarea"
              rows="20"
              placeholder="请输入章节信息，AI将按照你提供的文本或者图片进行生成，例如：&#10;第一章 绪论&#10;&#10;第一章 绪论（上）&#10;&#10;第一章 绪论（中）&#10;&#10;第一章 绪论（下）&#10;&#10;第一章 绪论 （更新内容-01）&#10;&#10;第一章 绪论 （更新内容-02）&#10;&#10;绪论作业&#10;&#10;第二章 土木工程材料&#10;&#10;第二章 土木工程材料 ( 上 )&#10;&#10;第二章 土木工程材料 ( 下 )&#10;&#10;第三章 地基基础及地下工程&#10;&#10;第三章 地基基础及地下工程（上）&#10;&#10;第三章 地基基础及地下工程（下）&#10;&#10;无需很规范，ai生成后您可以进行更改。"
            ></textarea>
          </div>
        </div>

        <!-- 生成按钮 -->
        <div class="action-section">
          <button
            class="btn btn-ai btn-large"
            @click="generateChapter"
            :disabled="!chapterRequirements.trim() || isGenerating"
          >
            <i class="ai-icon" v-if="!isGenerating"></i>
            <i class="loading-icon" v-else></i>
            {{ isGenerating ? '正在生成中...' : '开始生成章节' }}
          </button>
        </div>
      </div>

      <!-- 可拖拽的分割线 -->
      <div 
        class="resizer" 
        @mousedown="startResize"
        :class="{ 'resizing': isResizing }"
      >
        <div class="resizer-line"></div>
        <div class="resizer-handle">
          <i class="drag-icon"></i>
        </div>
      </div>

      <!-- 右侧结果显示区域 -->
      <div class="right-panel" :style="{ width: rightPanelWidth + '%' }">
        <div class="result-section">
          <!-- 显示模式切换 -->
          <div class="view-mode-header" v-if="generatedResult.trim()">
            <label class="form-label">
              生成结果
              <span class="editable-hint">（章节编号不可编辑，标题可编辑）</span>
            </label>
            <div class="view-mode-toggle">
              <button
                class="btn btn-sm"
                :class="{ 'btn-primary': viewMode === 'preview', 'btn-secondary': viewMode !== 'preview' }"
                @click="toggleViewMode"
              >
                <i class="preview-icon"></i>
                预览模式
              </button>
              <button
                class="btn btn-sm"
                :class="{ 'btn-primary': viewMode === 'text', 'btn-secondary': viewMode !== 'text' }"
                @click="toggleViewMode"
              >
                <i class="text-icon"></i>
                文本模式
              </button>
            </div>
          </div>

          <!-- 预览模式 -->
          <div v-if="viewMode === 'preview' && generatedResult.trim()" class="preview-container">
            <div class="parsed-tree">
              <div
                v-for="node in parsedNodes"
                :key="node.id"
                class="tree-node"
                :class="`level-${node.level}`"
              >
                <div class="node-content">
                  <span class="node-number">{{ node.number }}</span>
                  <span
                    class="node-title editable-title"
                    :contenteditable="true"
                    @blur="editNodeTitle(node.id, $event.target.textContent)"
                    @keydown.enter.prevent="$event.target.blur()"
                  >{{ node.title }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 文本模式 -->
          <div v-if="viewMode === 'text' || !generatedResult.trim()" class="text-container">
            <div class="form-group">
              <label class="form-label" v-if="!generatedResult.trim()">
                生成结果
                <span class="editable-hint">AI生成的章节内容将显示在这里</span>
              </label>
              <textarea
                v-model="generatedResult"
                class="form-textarea large-textarea editable-result"
                rows="20"
                placeholder="AI生成的章节内容将显示在这里，生成后可直接编辑修改..."
                @input="parseGeneratedText"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- 操作按钮区域 -->
        <div class="action-section">
          <div class="button-group">
            <button
              class="btn btn-secondary"
              @click="resetResult"
              :disabled="!generatedResult.trim() || !isResultModified"
              title="重置为AI原始生成内容"
            >
              <i class="reset-icon"></i>
              重置
            </button>
            <button
              class="btn btn-primary btn-large"
              @click="exportAsOutline"
              :disabled="!generatedResult.trim() || isExporting"
            >
              <i class="export-icon" v-if="!isExporting"></i>
              <i class="loading-icon" v-else></i>
              {{ isExporting ? '正在导出...' : '导出为章节' }}
            </button>
          </div>
          <div class="edit-status" v-if="isResultModified">
            <span class="status-text">内容已修改</span>
          </div>

          <!-- 导出进度显示 -->
          <div v-if="isExporting" class="export-progress">
            <div class="progress-header">
              <span class="progress-text">{{ exportProgressText }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${exportProgress}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 隐藏的TextNodeParser组件引用 -->
    <TextNodeParser ref="textNodeParserRef" style="display: none;" />

    <!-- 导出确认对话框 -->
    <ExportConfirmDialog
      v-model="showExportDialog"
      mode="confirm"
      :node-count="parsedNodes.length"
      :course-name="courseName"
      :progress="exportProgress"
      :progress-text="exportProgressText"
      :is-loading="isExporting"
      @confirm="handleExportConfirm"
      @cancel="handleExportCancel"
    />

    <!-- 成功提示对话框 -->
    <ExportConfirmDialog
      v-model="showSuccessDialog"
      mode="success"
      :title="getDialogTitle()"
      :success-title="getDialogTitle()"
      :success-message="getSuccessMessage()"
      :success-details="getSuccessDetails()"
      :show-navigate-button="successResult.successCount > 0"
      @navigate="handleNavigateToChapters"
    />
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import deepseekAPI from '@/api/ai.js';
import TextNodeParser from '../textparser/TextNodeParser.vue';
import ExportConfirmDialog from './ExportConfirmDialog.vue';
import { getCourseChapterList, deleteChapter } from '@/api/chapters';
import { getCourseById } from '@/api/courses';

// 定义props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
});

// 路由
const router = useRouter();

// 响应式数据
const leftPanelWidth = ref(50); // 左侧面板宽度百分比
const rightPanelWidth = computed(() => 100 - leftPanelWidth.value); // 右侧面板宽度百分比
const isResizing = ref(false); // 是否正在调整大小

// 表单数据
const chapterRequirements = ref('');

// 生成状态
const isGenerating = ref(false);
const generatedResult = ref('');
const originalResult = ref(''); // 保存AI原始生成的内容
const isResultModified = ref(false); // 标记结果是否被修改

// 预览相关数据
const viewMode = ref('preview'); // 'preview' 或 'text'
const parsedNodes = ref([]); // 解析后的节点数据

// 导出状态
const isExporting = ref(false);
const exportProgress = ref(0);
const exportProgressText = ref('');
const showExportDialog = ref(false);
const courseName = ref(''); // 课程名称，可以从props或API获取

// 成功对话框状态
const showSuccessDialog = ref(false);
const successResult = ref({
  successCount: 0,
  failCount: 0,
  total: 0
});

// TextNodeParser组件引用
const textNodeParserRef = ref(null);

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

// 生成章节方法
const generateChapter = async () => {
  if (!chapterRequirements.value.trim()) {
    alert('请输入章节信息');
    return;
  }

  isGenerating.value = true;

  try {
    // 构建发送给AI的提示词
    const systemPrompt = `将以下的章节文本格式化，严格按照我提供的格式，格式为：
1:(章节标题)
1.1:(章节下的子章节)
1.1.1:(子章节的子章节)
1.2(章节下的子章节)

2:(章节标题)
2.1:(章节下的子章节)
2.1.1:(子章节的子章节)
2.2(章节下的子章节)
回答按照以上格式，不要回答多余的语句，要处理的文本如下：`;

    // 组合完整的用户输入
    const userMessage = systemPrompt + chapterRequirements.value;

    // 调用DeepSeek API
    const response = await deepseekAPI.chat({
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    // 获取AI生成的内容
    if (response && response.choices && response.choices.length > 0) {
      const aiContent = response.choices[0].message.content;
      generatedResult.value = aiContent;
      originalResult.value = aiContent; // 保存原始内容
      isResultModified.value = false; // 重置修改状态
      parseGeneratedText(); // 解析生成的文本
    } else {
      throw new Error('AI响应格式异常');
    }

  } catch (error) {
    console.error('生成章节失败:', error);

    // 根据错误类型提供更详细的错误信息
    let errorMessage = '生成章节失败，请重试';
    if (error.message.includes('API key')) {
      errorMessage = 'API密钥配置错误，请检查配置';
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      errorMessage = '网络连接失败，请检查网络连接';
    } else if (error.response && error.response.status === 429) {
      errorMessage = 'API调用频率过高，请稍后重试';
    } else if (error.response && error.response.status === 401) {
      errorMessage = 'API认证失败，请检查API密钥';
    }

    alert(errorMessage);
  } finally {
    isGenerating.value = false;
  }
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 重置结果为AI原始生成内容
const resetResult = () => {
  if (originalResult.value) {
    generatedResult.value = originalResult.value;
    isResultModified.value = false;
    parseGeneratedText(); // 重新解析文本
  }
};

// 解析生成的文本为节点结构
const parseGeneratedText = () => {
  if (!generatedResult.value.trim()) {
    parsedNodes.value = [];
    return;
  }

  const lines = generatedResult.value.split('\n');
  const nodes = [];
  let nodeId = 1;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // 匹配格式：数字编号:标题
    const match = trimmedLine.match(/^(\d+(?:\.\d+)*):(.+)$/);
    if (match) {
      const [, number, title] = match;
      const level = number.split('.').length; // 计算层级

      nodes.push({
        id: nodeId++,
        number: number + ':',
        title: title.trim(),
        level: level,
        originalLine: trimmedLine
      });
    }
  }

  parsedNodes.value = nodes;
};

// 切换显示模式
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'preview' ? 'text' : 'preview';
};

// 编辑节点标题
const editNodeTitle = (nodeId, newTitle) => {
  const node = parsedNodes.value.find(n => n.id === nodeId);
  if (node) {
    node.title = newTitle.trim();
    // 同步更新到生成结果文本
    updateGeneratedResultFromNodes();
  }
};

// 从节点数据重新构建文本
const updateGeneratedResultFromNodes = () => {
  const lines = parsedNodes.value.map(node => `${node.number}${node.title}`);
  generatedResult.value = lines.join('\n');
};

// 导出为大纲 - 显示确认对话框
const exportAsOutline = () => {
  if (!generatedResult.value.trim()) {
    alert('没有可导出的内容');
    return;
  }

  if (!props.courseId) {
    alert('缺少课程ID，无法导出');
    return;
  }

  // 防止重复点击
  if (isExporting.value) {
    console.warn('导出正在进行中，请勿重复点击');
    return;
  }

  // 显示导出确认对话框
  showExportDialog.value = true;
};

// 删除课程的所有章节
const deleteAllChapters = async (courseId) => {
  try {
    // 获取课程的所有章节
    const chaptersResponse = await getCourseChapterList(courseId);
    const chapters = chaptersResponse.rows || [];

    if (chapters.length === 0) {
      console.log('课程没有现有章节，跳过删除');
      return;
    }

    console.log(`找到 ${chapters.length} 个章节，开始删除...`);

    // 逐个删除章节
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      exportProgressText.value = `正在删除旧章节 ${i + 1}/${chapters.length}: ${chapter.name || '未命名章节'}`;

      try {
        await deleteChapter(chapter.id);
        console.log(`删除章节成功: ${chapter.name}`);
      } catch (error) {
        console.error(`删除章节失败: ${chapter.name}`, error);
        // 继续删除其他章节，不中断整个流程
      }
    }

    console.log('所有旧章节删除完成');
  } catch (error) {
    console.error('删除旧章节过程中发生错误:', error);
    throw new Error('删除旧章节失败: ' + error.message);
  }
};

// 处理导出确认
const handleExportConfirm = async (options) => {
  isExporting.value = true;
  exportProgress.value = 0;
  exportProgressText.value = '开始导出...';

  console.log('=== 开始导出为大纲 ===');
  console.log('生成的内容:', generatedResult.value);
  console.log('课程ID:', props.courseId);
  console.log('导出选项:', options);

  try {
    if (!textNodeParserRef.value) {
      throw new Error('TextNodeParser组件未加载');
    }

    // 如果选择删除旧章节，先删除所有现有章节
    if (options.deleteOldChapters) {
      exportProgressText.value = '正在删除旧章节...';
      await deleteAllChapters(props.courseId);
    }

    const result = await textNodeParserRef.value.parseAndCreateNodes(
      generatedResult.value,
      props.courseId,
      {
        onProgress: (message) => {
          exportProgressText.value = message;
          console.log('导出进度:', message);
        },
        onResult: (result) => {
          console.log('节点创建结果:', result);
        }
      }
    );

    exportProgress.value = 100;
    exportProgressText.value = '导出完成！';

    console.log('导出最终结果:', result);

    // 显示完成消息并关闭对话框
    const successCount = result.success.length;
    const failCount = result.failed.length;

    setTimeout(() => {
      showExportDialog.value = false;
      
      // 设置成功结果数据
      successResult.value = {
        successCount,
        failCount,
        total: successCount + failCount
      };
      
      // 显示成功对话框
      showSuccessDialog.value = true;
    }, 1000);

  } catch (error) {
    console.error('导出失败:', error);
    showExportDialog.value = false;
    
    // 设置错误结果数据，显示错误对话框
    successResult.value = {
      successCount: 0,
      failCount: 1,
      total: 1
    };
    
    showSuccessDialog.value = true;
  } finally {
    isExporting.value = false;
  }
};

// 处理导出取消
const handleExportCancel = () => {
  showExportDialog.value = false;
};

// 获取对话框标题
const getDialogTitle = () => {
  const { successCount, failCount } = successResult.value;
  if (successCount === 0 && failCount > 0) {
    return '导出失败';
  } else if (failCount === 0) {
    return '导出成功！';
  } else {
    return '导出完成';
  }
};

// 获取成功消息
const getSuccessMessage = () => {
  const { successCount, failCount } = successResult.value;
  if (successCount === 0 && failCount > 0) {
    return '导出过程中发生错误，未能成功创建章节。';
  } else if (failCount === 0) {
    return `共创建 ${successCount} 个节点。您可以在章节管理页面查看创建的章节。`;
  } else {
    return `成功 ${successCount} 个，失败 ${failCount} 个。请在章节管理页面查看结果。`;
  }
};

// 获取成功详情
const getSuccessDetails = () => {
  const { successCount, failCount, total } = successResult.value;
  if (failCount === 0) {
    return `所有 ${total} 个章节都已成功创建并添加到课程中。`;
  } else {
    return `${total} 个章节中有 ${failCount} 个创建失败，请检查具体原因。`;
  }
};

// 处理导航到章节管理页面
const handleNavigateToChapters = () => {
  router.back();
};

// 监听生成结果的变化，检测是否被修改
watch(generatedResult, (newValue) => {
  if (originalResult.value && newValue !== originalResult.value) {
    isResultModified.value = true;
  } else if (newValue === originalResult.value) {
    isResultModified.value = false;
  }
});

// 监听生成结果变化，自动解析文本（仅在文本模式下手动编辑时）
watch(generatedResult, () => {
  if (viewMode.value === 'text') {
    parseGeneratedText();
  }
});

// 组件卸载时清理事件监听器
onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
});
</script>

<style scoped>
@import '@/teacher/styles/ai-chapter-generator.css';
</style>
