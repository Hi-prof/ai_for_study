<template>
  <div class="node-detail-panel" :class="{ readonly: props.readonly }">
    <div class="panel-header">
      <div class="title-input-shell">
        <textarea
          ref="titleEditorRef"
          v-model="title"
          class="title-editor"
          :class="{
            readonly: props.readonly,
            'has-focus-badge': isStructuredContent && structuredNode?.isFocus
          }"
          :readonly="props.readonly"
          placeholder="知识点标题"
          rows="1"
        ></textarea>
        <span v-if="isStructuredContent && structuredNode?.isFocus" class="focus-badge title-focus-badge">重点</span>
      </div>
      <div class="panel-actions">
        <button class="close-button" @click="close">×</button>
      </div>
    </div>
    <div class="panel-content">
      <div v-if="isStructuredContent" class="agent-card-section">
        <div
          class="knowledge-card-frame"
          :class="{ 'is-editing': isKnowledgeCardEditing }"
        >
          <div v-if="!props.readonly" class="knowledge-card-header">
            <button
              class="generate-deep-card-button knowledge-card-ai-button"
              @click="optimizeKnowledgeCard"
              :disabled="isOptimizingCard"
            >
              {{ isOptimizingCard ? '优化中...' : hasOptimizedCard ? '重新AI优化' : 'AI优化卡片' }}
            </button>
            <div class="knowledge-card-actions">
              <span class="save-status compact" :class="saveStatusClass">{{ saveStatusText }}</span>
              <button
                class="knowledge-card-edit-button"
                type="button"
                @click="toggleKnowledgeCardEditing"
              >
                {{ isKnowledgeCardEditing ? '完成' : '编辑' }}
              </button>
            </div>
          </div>
          <div class="knowledge-card-body">
            <textarea
              v-if="!props.readonly && isKnowledgeCardEditing"
              id="knowledge-card-markdown"
              class="knowledge-card-editor"
              :value="knowledgeCardMarkdown"
              placeholder="可直接编辑整张知识卡片，例如：&#10;**定义**&#10;这里写定义内容&#10;&#10;**示例**&#10;这里写示例内容"
              @input="updateKnowledgeCardMarkdown(($event.target as HTMLTextAreaElement).value)"
            ></textarea>
            <div
              v-else
              class="knowledge-card-markdown"
              :class="{ empty: !knowledgeCardMarkdown.trim() }"
              v-html="renderedKnowledgeCardMarkdown"
            ></div>
          </div>
        </div>
      </div>

      <div v-else class="node-content">
        <div v-if="!props.readonly" class="content-header plain-content-toolbar">
          <div class="header-right">
            <span class="save-status compact" :class="saveStatusClass">{{ saveStatusText }}</span>
            <span class="char-count" :class="{ 'over-limit': contentLength > 400 }">
              {{ contentLength }}/400字
            </span>
            <button v-if="!isStructuredContent" class="search-button" @click="searchContent">
              AI搜索
            </button>
          </div>
        </div>
        <textarea
          v-if="!props.readonly"
          v-model="content"
          class="content-editor"
          placeholder="请输入知识点内容..."
        ></textarea>
        <div v-else class="content-readonly">
          {{ content || '暂无内容' }}
        </div>
        <div v-if="isSearching" class="search-loading">
          <div class="loading-spinner search-spinner"></div>
          <span>正在搜索相关内容...</span>
        </div>
      </div>

      <!-- 文件上传区域 -->
      <div v-if="!props.readonly || nodeFiles.length > 0" class="node-files" :class="{ collapsed: !isFilesSectionExpanded }">
        <div class="content-header files-header">
          <div class="files-title-wrap">
            <h4>知识资料</h4>
            <span class="files-summary">{{ filesSummaryText }}</span>
          </div>
          <div class="header-right">
            <button
              v-if="!props.readonly"
              class="upload-button"
              @click="triggerFileInput"
              :disabled="isUploading"
            >
              📁 上传文件
            </button>
            <button
              class="files-toggle-button"
              type="button"
              @click="toggleFilesSection"
            >
              {{ isFilesSectionExpanded ? '收起' : '展开' }}
            </button>
          </div>
        </div>

        <!-- 隐藏的文件输入 -->
        <input
          v-if="!props.readonly"
          ref="fileInput"
          type="file"
          @change="handleFileSelect"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif,.mp4,.avi,.mov"
          style="display: none;"
        />

        <div v-show="isFilesSectionExpanded" class="files-body">
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
          <div v-else-if="!isUploading" class="empty-files compact-empty-files">
            <p class="empty-text">暂无上传文件</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useChapterFileUpload } from '@/shared/composables/useChapterFileUpload';
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

interface SaveOptions {
  refreshGraph?: boolean;
  showError?: boolean;
}

interface StructuredCardField {
  defaultLabel: string;
  section: 'lightweightCard' | 'deepCard';
  property: string;
  isList?: boolean;
}

// Define props
const props = defineProps<{
  node: Node,
  relatedNodes: RelatedNode[],
  courseId?: string | number,
  courseName?: string,
  readonly?: boolean
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
const titleEditorRef = ref<HTMLTextAreaElement | null>(null);
const isSearching = ref(false);
const imageResult = ref<string | null>(null);
const resources = ref<any[]>([]);
const contentLength = ref(0);
const fileInput = ref<HTMLInputElement | null>(null);
const isOptimizingCard = ref(false);
const isKnowledgeCardEditing = ref(false);
const isFilesSectionExpanded = ref(false);
const isSaving = ref(false);
const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('saved');
const saveErrorMessage = ref('');
const hasPersistedChanges = ref(false);
const isHydratingNode = ref(false);
const lastSavedSnapshot = ref('');
const initialSnapshot = ref('');
const currentNodeKey = ref('');
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
let activeSavePromise: Promise<boolean> | null = null;

const AUTO_SAVE_DELAY = 800;

const resizeTitleEditor = () => {
  const editor = titleEditorRef.value;
  if (!editor) {
    return;
  }

  editor.style.height = 'auto';
  editor.style.height = `${editor.scrollHeight}px`;
};

const queueTitleEditorResize = () => {
  void nextTick(resizeTitleEditor);
};

// 计算属性 - 当前节点的文件列表
const nodeFiles = computed(() => {
  if (!props.node?.id || !props.courseId) {
    return [];
  }
  return getNodeFiles('节点文件', props.node.id);
});
const filesSummaryText = computed(() => {
  if (isUploading.value) {
    return '上传中';
  }
  if (nodeFiles.value.length > 0) {
    return `${nodeFiles.value.length} 个文件`;
  }
  return '暂无文件';
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

const structuredCardFieldDefinitions: StructuredCardField[] = [
  { defaultLabel: '定义', section: 'lightweightCard', property: 'definition' },
  { defaultLabel: '关键词', section: 'lightweightCard', property: 'keywords', isList: true },
  { defaultLabel: '示例', section: 'lightweightCard', property: 'example' },
  { defaultLabel: '关联知识', section: 'lightweightCard', property: 'relatedKnowledge', isList: true },
  { defaultLabel: '深入解析', section: 'deepCard', property: 'detailedDefinition' },
  { defaultLabel: '核心特征', section: 'deepCard', property: 'coreFeatures', isList: true },
  { defaultLabel: '应用场景', section: 'deepCard', property: 'applicationScenarios', isList: true },
  { defaultLabel: '常见问题', section: 'deepCard', property: 'commonQuestions', isList: true },
  { defaultLabel: '关联说明', section: 'deepCard', property: 'relatedExplanation' },
  { defaultLabel: '参考内容', section: 'deepCard', property: 'references', isList: true }
];

const hasOptimizedCard = computed(() => !!structuredNode.value?.deepCard);
const getStructuredFieldLabel = (property: string, fallbackLabel: string) => {
  const customLabel = structuredNode.value?.fieldLabels?.[property];
  return typeof customLabel === 'string' && customLabel.trim() ? customLabel.trim() : fallbackLabel;
};

const structuredCardFields = computed(() => {
  const currentStructuredNode = structuredNode.value;
  if (!currentStructuredNode) {
    return [];
  }

  const hasDeepSection = !!currentStructuredNode.deepCard;

  return structuredCardFieldDefinitions
    .filter(field => field.section === 'lightweightCard' || hasDeepSection)
    .map(field => {
      const sectionValue = currentStructuredNode[field.section] || {};
      const rawValue = sectionValue[field.property];
      return {
        ...field,
        label: getStructuredFieldLabel(field.property, field.defaultLabel),
        value: field.isList ? joinList(rawValue) : String(rawValue || '')
      };
    });
});

const buildDefaultKnowledgeCardMarkdown = () => {
  return structuredCardFields.value
    .map(field => `**${field.label}**\n${field.value || '暂无内容'}`)
    .join('\n\n');
};

const knowledgeCardMarkdown = computed(() => {
  const customCardMarkdown = structuredNode.value?.customCardMarkdown;
  if (typeof customCardMarkdown === 'string') {
    return customCardMarkdown;
  }

  return buildDefaultKnowledgeCardMarkdown();
});

const htmlEscapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => htmlEscapeMap[char] || char);
const renderedKnowledgeCardMarkdown = computed(() => {
  const source = knowledgeCardMarkdown.value.trim() || '暂无卡片内容';
  return escapeHtml(source)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
});

const stripMarkdownBold = (value: string) => value.replace(/\*\*(.+?)\*\*/g, '$1');

const normalizedStructuredContent = computed(() => {
  if (!isStructuredContent.value || !structuredNode.value) {
    return rawContent.value;
  }

  return JSON.stringify({
    ...structuredNode.value,
    title: title.value || structuredNode.value.title || props.node.text || props.node.name || '',
  });
});
const currentSaveData = computed(() => ({
  id: props.node.id,
  text: title.value,
  content: isStructuredContent.value ? normalizedStructuredContent.value : content.value,
}));
const currentSnapshot = computed(() => JSON.stringify(currentSaveData.value));
const saveStatusText = computed(() => {
  if (saveState.value === 'saving') {
    return '自动保存中...';
  }
  if (saveState.value === 'error') {
    return saveErrorMessage.value || '自动保存失败';
  }
  if (saveState.value === 'idle') {
    return '等待自动保存...';
  }
  return '已自动保存';
});
const saveStatusClass = computed(() => ({
  idle: saveState.value === 'idle',
  saving: saveState.value === 'saving',
  error: saveState.value === 'error',
  saved: saveState.value === 'saved',
}));

const updateKnowledgeCardMarkdown = (nextValue: string) => {
  const currentStructuredNode = structuredNode.value;
  if (!currentStructuredNode) {
    return;
  }

  const nextStructuredNode = {
    ...currentStructuredNode,
    customCardMarkdown: nextValue,
  };

  rawContent.value = JSON.stringify(nextStructuredNode);
};

const clearAutoSaveTimer = () => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
};

const resetSaveState = () => {
  clearAutoSaveTimer();
  saveErrorMessage.value = '';
  saveState.value = 'saved';
  hasPersistedChanges.value = false;
  lastSavedSnapshot.value = currentSnapshot.value;
  initialSnapshot.value = currentSnapshot.value;
};

const emitSaveRequest = (saveData: { id: string | number; text: string; content: string }, options: SaveOptions = {}) => {
  return new Promise<void>((resolve, reject) => {
    emit('save', saveData, resolve, reject, options);
  });
};

const runSave = async (options: SaveOptions = {}) => {
  if (props.readonly) {
    return false;
  }

  const snapshot = currentSnapshot.value;
  if (snapshot === lastSavedSnapshot.value) {
    saveState.value = 'saved';
    saveErrorMessage.value = '';
    return false;
  }

  isSaving.value = true;
  saveState.value = 'saving';
  saveErrorMessage.value = '';

  try {
    await emitSaveRequest(currentSaveData.value, options);
    lastSavedSnapshot.value = snapshot;
    hasPersistedChanges.value = snapshot !== initialSnapshot.value;
    saveState.value = 'saved';
    return true;
  } catch (error: any) {
    saveState.value = 'error';
    saveErrorMessage.value = error?.message || '自动保存失败';
    throw error;
  } finally {
    isSaving.value = false;
  }
};

const flushPendingSave = async (options: SaveOptions = {}) => {
  clearAutoSaveTimer();
  let didSave = false;

  while (true) {
    if (activeSavePromise) {
      didSave = (await activeSavePromise) || didSave;
      continue;
    }

    if (currentSnapshot.value === lastSavedSnapshot.value) {
      return didSave;
    }

    activeSavePromise = runSave(options).finally(() => {
      activeSavePromise = null;
    });
    didSave = (await activeSavePromise) || didSave;
  }
};

const toggleKnowledgeCardEditing = async () => {
  if (props.readonly) {
    return;
  }

  if (!isKnowledgeCardEditing.value) {
    isKnowledgeCardEditing.value = true;
    return;
  }

  try {
    await flushPendingSave({ refreshGraph: false, showError: false });
    isKnowledgeCardEditing.value = false;
  } catch (error: any) {
    alert(error?.message || '自动保存失败，请稍后重试');
  }
};

const scheduleAutoSave = () => {
  if (isHydratingNode.value || currentSnapshot.value === lastSavedSnapshot.value) {
    return;
  }

  clearAutoSaveTimer();
  autoSaveTimer = setTimeout(() => {
    flushPendingSave({ refreshGraph: false, showError: false }).catch(() => {
      // 自动保存失败时通过状态提示，不重复弹窗轰炸用户
    });
  }, AUTO_SAVE_DELAY);
};

// Watch for changes in the node prop
watch(() => props.node, (newNode) => {
  if (newNode) {
    const nextNodeKey = `${newNode.id ?? ''}-${newNode.content ?? ''}-${newNode.name ?? newNode.text ?? ''}`;
    if (nextNodeKey === currentNodeKey.value) {
      return;
    }

    isHydratingNode.value = true;
    currentNodeKey.value = nextNodeKey;
    title.value = newNode.name || '';
    rawContent.value = newNode.content || '';
    content.value = isStructuredContent.value ? '' : rawContent.value;
    resources.value = newNode.resources || [];
    imageResult.value = null; // Reset image result on node change
    isKnowledgeCardEditing.value = false;
    isFilesSectionExpanded.value = false;
    resetSaveState();
    isHydratingNode.value = false;

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

watch(title, queueTitleEditorResize, { immediate: true });

watch(currentSnapshot, (newSnapshot, oldSnapshot) => {
  if (props.readonly || isHydratingNode.value || !props.node?.id || newSnapshot === oldSnapshot) {
    return;
  }

  if (newSnapshot === lastSavedSnapshot.value) {
    clearAutoSaveTimer();
    saveState.value = 'saved';
    saveErrorMessage.value = '';
    return;
  }

  if (saveState.value !== 'saving') {
    saveState.value = 'idle';
  }
  scheduleAutoSave();
});

const buildOptimizationSourceText = () => {
  const structured = structuredNode.value;
  if (!structured) {
    return title.value || '';
  }

  if (typeof structured.customCardMarkdown === 'string' && structured.customCardMarkdown.trim()) {
    return [
      `节点标题: ${title.value || structured.title || ''}`,
      stripMarkdownBold(structured.customCardMarkdown)
    ].filter(Boolean).join('\n');
  }

  const definitionLabel = getStructuredFieldLabel('definition', '定义');
  const keywordsLabel = getStructuredFieldLabel('keywords', '关键词');
  const exampleLabel = getStructuredFieldLabel('example', '示例');
  const relatedKnowledgeLabel = getStructuredFieldLabel('relatedKnowledge', '关联知识');

  const parts = [
    `节点标题: ${title.value || structured.title || ''}`,
    structured.lightweightCard?.definition ? `${definitionLabel}: ${structured.lightweightCard.definition}` : '',
    Array.isArray(structured.lightweightCard?.keywords) && structured.lightweightCard.keywords.length
      ? `${keywordsLabel}: ${structured.lightweightCard.keywords.join('、')}`
      : '',
    structured.lightweightCard?.example ? `${exampleLabel}: ${structured.lightweightCard.example}` : '',
    Array.isArray(structured.lightweightCard?.relatedKnowledge) && structured.lightweightCard.relatedKnowledge.length
      ? `${relatedKnowledgeLabel}: ${structured.lightweightCard.relatedKnowledge.join('、')}`
      : ''
  ];

  return parts.filter(Boolean).join('\n');
};

const optimizeKnowledgeCard = async () => {
  if (props.readonly) {
    return;
  }

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
    await flushPendingSave({ refreshGraph: false, showError: false });
  } catch (error: any) {
    alert(error?.message || 'AI 优化卡片失败');
  } finally {
    isOptimizingCard.value = false;
  }
};

const close = async () => {
  if (props.readonly) {
    emit('close', { refreshGraph: false });
    return;
  }

  try {
    await flushPendingSave({ refreshGraph: false, showError: false });
    emit('close', { refreshGraph: hasPersistedChanges.value });
  } catch (error: any) {
    alert(error?.message || '自动保存失败，请稍后重试');
  }
};

const toggleFilesSection = () => {
  isFilesSectionExpanded.value = !isFilesSectionExpanded.value;
};


// 注释：文件重命名逻辑已移至 useChapterFileUpload.js 中统一处理

const searchContent = async () => {
  if (props.readonly) {
    return;
  }

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
  if (props.readonly) {
    return;
  }

  isFilesSectionExpanded.value = true;
  if (fileInput.value) {
    fileInput.value.click();
  }
};

// 处理文件选择
const handleFileSelect = async (event: Event) => {
  if (props.readonly) {
    return;
  }

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

  isFilesSectionExpanded.value = true;

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
  queueTitleEditorResize();

  if (props.courseId && props.node?.id) {
    loadCourseFiles(props.courseId);
  }
});

onBeforeUnmount(() => {
  clearAutoSaveTimer();
});
</script>

<style scoped>
@import '@/styles/node-detail-panel.css';

.agent-card-section {
  margin-bottom: 16px;
  padding: 0;
}

.save-status {
  min-width: 96px;
  font-size: 12px;
  font-weight: 600;
  text-align: right;
  color: #64748b;
}

.save-status.compact {
  min-width: auto;
  text-align: left;
}

.save-status.idle,
.save-status.saving {
  color: #2563eb;
}

.save-status.saved {
  color: #16a34a;
}

.save-status.error {
  color: #dc2626;
}

.panel-header {
  align-items: flex-start;
  gap: 12px;
}

.panel-actions {
  padding-top: 8px;
}

.title-input-shell {
  position: relative;
  flex: 1;
  min-width: 0;
}

.title-editor {
  width: 100%;
  min-height: 46px;
  box-sizing: border-box;
  margin-right: 0 !important;
  padding: 12px 16px !important;
  border: 1px solid rgba(203, 213, 225, 0.4);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.45;
  font-family: inherit;
  resize: none;
  overflow: hidden;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.title-editor.has-focus-badge {
  padding-right: 84px !important;
}

.title-editor:focus {
  border-color: #3b82f6;
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15), 0 4px 12px rgba(59, 130, 246, 0.1);
  background: rgba(255, 255, 255, 0.95);
}

.title-editor.readonly {
  cursor: default;
  background: #f8fafc;
}

.plain-content-toolbar {
  justify-content: flex-end;
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

.title-focus-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  padding: 3px 8px;
  background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid rgba(147, 197, 253, 0.9);
  color: #1e40af;
  font-size: 11px;
  letter-spacing: 0.04em;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.12);
  pointer-events: none;
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

.knowledge-card-ai-button {
  flex-shrink: 0;
  white-space: nowrap;
}

.knowledge-card-frame {
  border: 1px solid #d8e3f2;
  border-radius: 10px;
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.06);
}

.knowledge-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #e6edf6;
  background: #fbfdff;
}

.knowledge-card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-left: auto;
}

.knowledge-card-edit-button {
  min-width: 54px;
  padding: 6px 12px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

.knowledge-card-edit-button:hover {
  border-color: #93c5fd;
  background: #dbeafe;
  color: #1e40af;
}

.knowledge-card-frame.is-editing .knowledge-card-edit-button {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
}

.knowledge-card-body {
  padding: 16px;
}

.knowledge-card-markdown {
  min-height: 320px;
  padding: 4px 2px;
  color: #1f2937;
  font-size: 14px;
  line-height: 1.8;
  white-space: normal;
  word-break: break-word;
}

.knowledge-card-markdown :deep(strong) {
  color: #17365d;
  font-weight: 800;
}

.knowledge-card-markdown.empty {
  color: #94a3b8;
}

.knowledge-card-editor {
  width: 100%;
  min-height: 420px;
  box-sizing: border-box;
  padding: 14px 16px;
  border: 1px solid #cfe0f4;
  border-radius: 8px;
  background: #f8fbff;
  color: #1e293b;
  font-size: 14px;
  line-height: 1.75;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.knowledge-card-editor:focus {
  outline: none;
  border-color: #93c5fd;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.2);
}

.content-readonly {
  min-height: 220px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #1e293b;
  font-size: 14px;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

.node-files {
  margin-top: 14px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(6px);
}

.node-files.collapsed {
  padding-bottom: 14px;
}

.files-header {
  margin-bottom: 0;
  gap: 12px;
}

.files-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.files-title-wrap h4 {
  margin: 0;
  color: #334155;
  font-size: 14px;
  font-weight: 700;
}

.files-summary {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.node-files .header-right {
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.node-files .upload-button,
.files-toggle-button {
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.files-toggle-button {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
}

.files-toggle-button:hover {
  border-color: #93c5fd;
  color: #1d4ed8;
  background: #f8fbff;
}

.files-body {
  margin-top: 12px;
}

.compact-empty-files {
  margin-top: 10px;
  padding: 18px 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: rgba(248, 250, 252, 0.9);
}

.empty-card-state {
  padding: 16px;
  border: 1px dashed #bfdbfe;
  border-radius: 10px;
  color: #64748b;
  background: rgba(255, 255, 255, 0.72);
}
</style> 
