<template>
  <div class="node-detail-panel">
    <div class="panel-header">
      <input type="text" v-model="title" class="title-editor" placeholder="知识点标题" />
      <div class="panel-actions">
        <button class="action-button" @click="saveChanges">保存</button>
        <button class="close-button" @click="close">×</button>
      </div>
    </div>
    <div class="panel-content">
      <div v-if="isStructuredContent" class="agent-card-section">
        <div class="content-header knowledge-card-header">
          <div class="card-title-group">
            <h4>知识卡片</h4>
            <p class="card-helper-text">一个节点只保留一张卡片，AI 优化会直接补充到当前卡片里。</p>
          </div>
          <div class="header-right">
            <span v-if="structuredNode.isFocus" class="focus-badge">重点节点</span>
            <button
              class="generate-deep-card-button"
              @click="optimizeKnowledgeCard"
              :disabled="isOptimizingCard"
            >
              {{ isOptimizingCard ? '优化中...' : hasOptimizedCard ? '重新AI优化' : 'AI优化卡片' }}
            </button>
          </div>
        </div>
        <div v-if="knowledgeCardItems.length > 0" class="card-block unified-card-block">
          <div v-for="item in knowledgeCardItems" :key="item.label" class="card-item">
            <div class="card-item-label">{{ item.label }}</div>
            <div class="card-item-value">{{ item.value }}</div>
          </div>
        </div>
        <div v-else class="empty-card-state">当前节点暂无可展示的知识卡片内容。</div>
      </div>

      <div v-else class="node-content">
        <div class="content-header">
          <h4>知识卡片</h4>
          <div class="header-right">
            <span class="char-count" :class="{ 'over-limit': contentLength > 400 }">
              {{ contentLength }}/400字
            </span>
            <button v-if="!isStructuredContent" class="search-button" @click="searchContent">
              AI搜索
            </button>
          </div>
        </div>
        <textarea 
          v-model="content" 
          class="content-editor"
          :readonly="isStructuredContent"
          :placeholder="isStructuredContent ? '该节点内容由智能体结构化生成，请在上方查看卡片详情。' : '请输入知识点内容...'"
        ></textarea>
        <div v-if="isSearching" class="search-loading">
          <div class="loading-spinner search-spinner"></div>
          <span>正在搜索相关内容...</span>
        </div>
      </div>

      <!-- 文件上传区域 -->
      <div class="node-files">
        <div class="content-header">
          <h4>知识资料</h4>
          <div class="header-right">
            <button
              class="upload-button"
              @click="triggerFileInput"
              :disabled="isUploading"
            >
              📁 上传文件
            </button>
          </div>
        </div>

        <!-- 隐藏的文件输入 -->
        <input
          ref="fileInput"
          type="file"
          @change="handleFileSelect"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif,.mp4,.avi,.mov"
          style="display: none;"
        />

        <!-- 上传进度 -->
        <div v-if="isUploading" class="upload-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
          </div>
          <p class="progress-text">{{ uploadProgressText }}</p>
        </div>

        <!-- 文件列表 -->
        <div v-if="nodeFiles.length > 0" class="files-list">
          <div
            v-for="file in nodeFiles"
            :key="file.id"
            class="file-item"
          >
            <div class="file-info">
              <span class="file-name">{{ file.originalFileName || file.fileName }}</span>
              <span class="file-size">{{ formatFileSize(file.fileSize) }}</span>
            </div>
            <div class="file-actions">
              <a
                :href="file.fileUrl"
                target="_blank"
                class="file-link"
                title="查看文件"
              >
                📄
              </a>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!isUploading" class="empty-files">
          <p class="empty-text">暂无上传文件</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed, onMounted } from 'vue';
import { useChapterFileUpload } from '@/composables/useChapterFileUpload';
import { generateKnowledgeAgentDeepCard } from '@/api/graph';

// Define interfaces for props
interface Node {
  id: string | number;
  text: string;
  content?: string;
  resources?: any[];
  [key: string]: any;
}

interface RelatedNode {
  id: string | number;
  text: string;
  relationType?: string;
  content?: string;
}

// Define props
const props = defineProps<{
  node: Node,
  relatedNodes: RelatedNode[],
  courseId?: string | number,
  courseName?: string
}>();

// Define emits
const emit = defineEmits(['save', 'cancel', 'close', 'select-related']);

// 使用章节文件上传功能
const {
  isUploading,
  currentProgress: uploadProgress,
  progressText: uploadProgressText,
  uploadChapterFile,
  loadCourseFiles,
  getNodeFiles
} = useChapterFileUpload();

// Component state
const title = ref('');
const content = ref('');
const rawContent = ref('');
const isSearching = ref(false);
const imageResult = ref<string | null>(null);
const resources = ref<any[]>([]);
const contentLength = ref(0);
const fileInput = ref<HTMLInputElement | null>(null);
const isOptimizingCard = ref(false);

// 计算属性 - 当前节点的文件列表
const nodeFiles = computed(() => {
  if (!props.node?.id || !props.courseId) {
    return [];
  }
  return getNodeFiles('节点文件', props.node.id);
});

const parseStructuredNode = (value: string) => {
  if (!value || typeof value !== 'string') {
    return null;
  }
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && (parsed.lightweightCard || parsed.deepCard || parsed.isFocus !== undefined)) {
      return parsed;
    }
  } catch (error) {
    return null;
  }
  return null;
};

const structuredNode = computed(() => parseStructuredNode(rawContent.value));
const isStructuredContent = computed(() => !!structuredNode.value);

const joinList = (value: unknown) => {
  if (!Array.isArray(value)) {
    return '';
  }
  return value.map(item => String(item)).filter(Boolean).join('、');
};

const buildDisplayItems = (items: Array<[string, string]>) => {
  return items
    .filter(([, value]) => value && String(value).trim())
    .map(([label, value]) => ({ label, value }));
};

const knowledgeCardItems = computed(() => {
  const lightCard = structuredNode.value?.lightweightCard || null;
  const deepCard = structuredNode.value?.deepCard || null;

  if (!lightCard && !deepCard) {
    return [];
  }

  return buildDisplayItems([
    ['定义', lightCard?.definition || ''],
    ['关键词', joinList(lightCard?.keywords)],
    ['示例', lightCard?.example || ''],
    ['关联知识', joinList(lightCard?.relatedKnowledge)],
    ['深入解析', deepCard?.detailedDefinition || ''],
    ['核心特征', joinList(deepCard?.coreFeatures)],
    ['应用场景', joinList(deepCard?.applicationScenarios)],
    ['常见问题', joinList(deepCard?.commonQuestions)],
    ['关联说明', deepCard?.relatedExplanation || ''],
    ['参考内容', joinList(deepCard?.references)]
  ]);
});

const hasOptimizedCard = computed(() => !!structuredNode.value?.deepCard);

// Watch for changes in the node prop
watch(() => props.node, (newNode) => {
  if (newNode) {
    title.value = newNode.name || '';
    rawContent.value = newNode.content || '';
    content.value = isStructuredContent.value ? '' : rawContent.value;
    resources.value = newNode.resources || [];
    imageResult.value = null; // Reset image result on node change

    // 加载节点文件
    if (props.courseId) {
      loadCourseFiles(props.courseId);
    }
  }
}, { immediate: true, deep: true });

// Watch for changes in courseId
watch(() => props.courseId, (newCourseId) => {
  if (newCourseId && props.node?.id) {
    loadCourseFiles(newCourseId);
  }
}, { immediate: true });

// Watch content changes to update character count
watch(() => content.value, (newContent) => {
  contentLength.value = newContent.length;
}, { immediate: true });

// Methods
const saveChanges = () => {
  console.log('NodeDetailPanel saveChanges 被调用');
  console.log('当前节点数据:', props.node);
  console.log('标题:', title.value);
  console.log('内容:', content.value);

  const saveData = {
    id: props.node.id,
    text: title.value,
    content: isStructuredContent.value ? rawContent.value : content.value,
  };

  console.log('准备发送的保存数据:', saveData);
  emit('save', saveData);
};

const buildOptimizationSourceText = () => {
  const structured = structuredNode.value;
  if (!structured) {
    return title.value || '';
  }

  const parts = [
    `节点标题: ${title.value || structured.title || ''}`,
    structured.lightweightCard?.definition ? `定义: ${structured.lightweightCard.definition}` : '',
    Array.isArray(structured.lightweightCard?.keywords) && structured.lightweightCard.keywords.length
      ? `关键词: ${structured.lightweightCard.keywords.join('、')}`
      : '',
    structured.lightweightCard?.example ? `示例: ${structured.lightweightCard.example}` : '',
    Array.isArray(structured.lightweightCard?.relatedKnowledge) && structured.lightweightCard.relatedKnowledge.length
      ? `关联知识: ${structured.lightweightCard.relatedKnowledge.join('、')}`
      : ''
  ];

  return parts.filter(Boolean).join('\n');
};

const optimizeKnowledgeCard = async () => {
  if (!structuredNode.value?.lightweightCard) {
    alert('当前节点没有基础知识卡片，暂时无法进行 AI 优化');
    return;
  }

  isOptimizingCard.value = true;
  try {
    const payload = {
      courseName: props.courseName || '课程知识图谱',
      sourceText: buildOptimizationSourceText(),
      node: {
        id: props.node.id,
        title: title.value || structuredNode.value.title || props.node.text || props.node.name || '',
        lightweightCard: structuredNode.value.lightweightCard,
        isFocus: true
      }
    };

    const response = await generateKnowledgeAgentDeepCard(payload);
    const result = response?.data || response;
    const updatedNode = {
      ...structuredNode.value,
      ...result?.node,
      title: title.value || structuredNode.value.title || props.node.text || props.node.name || '',
      isFocus: true,
      deepCard: result?.deepCard || result?.node?.deepCard || null
    };

    rawContent.value = JSON.stringify(updatedNode);
    content.value = '';
  } catch (error: any) {
    alert(error?.message || 'AI 优化卡片失败');
  } finally {
    isOptimizingCard.value = false;
  }
};

const close = () => {
  emit('close');
};


// 注释：文件重命名逻辑已移至 useChapterFileUpload.js 中统一处理

const searchContent = async () => {
  if (!title.value.trim()) {
    alert('请先输入知识点标题');
    return;
  }

  isSearching.value = true;
  content.value = ''; // 清空内容准备流式输出
  let totalChars = 0; // 字数统计
  const MAX_CHARS = 400; // 最大字数限制

  try {
    const apiKey = 'sk-X7ppAJyerjTVBoTSC5B99261502f494bB534675301A04e4d';
    const apiUrl = 'https://free.v36.cm/v1/chat/completions';
    const prompt = `请按照以下严格格式生成关于"${title.value}"的详细知识点内容：

1.定义：[提供准确的定义，说明该概念的核心含义和技术手段]
2.属性：[描述该概念包含的主要组成部分、特征或环节]
3.示例与应用：[提供具体的应用场景、实际案例或技术实现]
4.相关联系：[说明与其他概念、技术、学科的关联关系]
5.来源与参考：[列出相关的标准、规范、文献或权威资料]

要求：
- 每个部分内容要简洁精准
- 保持专业性和准确性
- 总字数严格限制在400字以内
- 严格按照1-5的编号格式输出
- 每个部分控制在80字左右`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '你是一个专业的知识图谱工具，擅长生成结构化的知识点内容。请严格按照用户要求的格式输出，不要添加额外的解释或修饰。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 600, // 降低token限制以配合400字限制
        stream: true  // 启用流式输出
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    // 处理流式响应
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done || totalChars >= MAX_CHARS) break; // 字数达到限制时也停止

        const chunk = decoder.decode(value, { stream: true });
        const lines = (buffer + chunk).split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                // 检查字数限制
                if (totalChars + delta.length <= MAX_CHARS) {
                  content.value += delta;
                  totalChars += delta.length;
                } else {
                  // 超出限制时只添加剩余可用字符
                  const remainingChars = MAX_CHARS - totalChars;
                  if (remainingChars > 0) {
                    content.value += delta.substring(0, remainingChars) + '...';
                    totalChars = MAX_CHARS;
                  }
                  break; // 达到字数限制，停止处理
                }
              }
            } catch (e) {
              // 忽略解析错误的数据块
            }
          }
        }
      }
    }

    if (!content.value.trim()) {
      alert('AI未生成相关内容');
    }

  } catch (error) {
    console.error('AI搜索失败:', error);
    alert('AI搜索失败，请稍后重试');
  } finally {
    isSearching.value = false;
  }
};

// 触发文件选择
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

// 处理文件选择
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files || files.length === 0) {
    return;
  }

  if (!props.courseId) {
    alert('缺少课程ID，无法上传文件');
    return;
  }

  if (!props.node?.id) {
    alert('缺少节点ID，无法上传文件');
    return;
  }

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // 直接上传原始文件，重命名逻辑在 useChapterFileUpload.js 中处理
      const result: any = await uploadChapterFile(
        file, // 直接传递原始文件
        '节点文件', // 使用固定的节点文件标识
        props.node.id,
        props.courseId,
        (progress: number) => {
          console.log(`文件上传进度: ${progress}%`);
        }
      );

      if (result.success) {
        console.log('文件上传成功:', result.data);

        // 刷新文件列表
        if (props.courseId) {
          await loadCourseFiles(props.courseId);
        }
      }
    }

    // 清空文件输入
    if (target) {
    target.value = '';
    }

  } catch (error: any) {
    console.error('文件上传失败:', error);
    alert('文件上传失败: ' + error.message);
  }
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 组件挂载时加载文件
onMounted(() => {
  if (props.courseId && props.node?.id) {
    loadCourseFiles(props.courseId);
  }
});
</script>

<style scoped>
@import '@/styles/node-detail-panel.css';

.agent-card-section {
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fbff;
}

.knowledge-card-header {
  align-items: flex-start;
  gap: 12px;
}

.card-title-group {
  min-width: 0;
}

.card-helper-text {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.focus-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 600;
}

.card-block + .card-block {
  margin-top: 16px;
}

.unified-card-block {
  padding-top: 12px;
}

.generate-deep-card-button {
  padding: 6px 12px;
  border: 1px solid #93c5fd;
  border-radius: 8px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.generate-deep-card-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-item + .card-item {
  margin-top: 10px;
}

.card-item-label {
  margin-bottom: 4px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
}

.card-item-value {
  color: #1e293b;
  line-height: 1.7;
  white-space: pre-wrap;
}

.empty-card-state {
  padding: 16px;
  border: 1px dashed #bfdbfe;
  border-radius: 10px;
  color: #64748b;
  background: rgba(255, 255, 255, 0.72);
}
</style> 
