<template>
  <div class="ai-chapter-generator">
    <div class="page-header">
      <h2 class="page-title">AI智能生成章节</h2>
      <button class="btn btn-secondary" @click="goBack">
        <i class="close-icon"></i>
        返回
      </button>
    </div>

    <div class="content-container">
      <div class="left-panel" :style="{ width: leftPanelWidth + '%' }">
        <div class="input-section">
          <div class="form-group">
            <label class="form-label">章节信息</label>
            <textarea
              v-model="chapterRequirements"
              class="form-textarea large-textarea"
              rows="20"
              placeholder="请输入章节信息，后端会完成 AI 生成、结果解析与章节落库。"
            ></textarea>
          </div>
        </div>

        <div class="action-section">
          <button
            v-if="!isGenerating"
            class="btn btn-ai btn-large"
            @click="generateChapter"
            :disabled="!chapterRequirements.trim()"
          >
            <i class="ai-icon"></i>
            开始生成章节
          </button>
          <button
            v-else
            class="btn btn-danger btn-large"
            @click="stopGeneration"
          >
            <i class="stop-icon"></i>
            停止生成
          </button>
        </div>
      </div>

      <div
        class="resizer"
        @mousedown="startResize"
        :class="{ resizing: isResizing }"
      >
        <div class="resizer-line"></div>
        <div class="resizer-handle">
          <i class="drag-icon"></i>
        </div>
      </div>

      <div class="right-panel" :style="{ width: rightPanelWidth + '%' }">
        <div class="result-section">
          <div class="view-mode-header" v-if="generatedResult.trim()">
            <label class="form-label">
              生成结果
              <span class="editable-hint">（后端已自动完成章节更新，此处为只读预览）</span>
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
                  <span class="node-title">{{ node.title }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="viewMode === 'text' || !generatedResult.trim()" class="text-container">
            <div class="form-group">
              <label class="form-label" v-if="!generatedResult.trim()">
                生成结果
                <span class="editable-hint">后端智能体生成的章节预览将显示在这里</span>
              </label>
              <textarea
                v-model="generatedResult"
                class="form-textarea large-textarea editable-result"
                rows="20"
                readonly
                placeholder="后端生成并落库后的章节预览将显示在这里..."
              ></textarea>
            </div>
          </div>
        </div>

        <div class="action-section">
          <div class="button-group">
            <button
              class="btn btn-secondary"
              @click="resetResult"
              :disabled="!generatedResult.trim() || generatedResult === originalResult"
            >
              <i class="reset-icon"></i>
              重置
            </button>
            <button
              class="btn btn-primary btn-large"
              @click="goToChapters"
              :disabled="!chapterCount"
            >
              <i class="export-icon"></i>
              查看章节
            </button>
          </div>

          <div v-if="isGenerating" class="export-progress">
            <div class="progress-header">
              <span class="progress-text">{{ generationProgressText }}</span>
              <span class="progress-percent">{{ generationProgress }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${generationProgress}%` }"></div>
            </div>
          </div>

          <div v-else-if="chapterCount" class="edit-status">
            <span class="status-text">后端已更新 {{ chapterCount }} 个章节</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getCourseById } from '@/api/courses';
import { generateKnowledgeGraphAndPersist } from '@/api/graph';

const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
});

const router = useRouter();

const leftPanelWidth = ref(50);
const rightPanelWidth = computed(() => 100 - leftPanelWidth.value);
const isResizing = ref(false);

const chapterRequirements = ref('');
const generatedResult = ref('');
const originalResult = ref('');
const parsedNodes = ref([]);
const viewMode = ref('preview');
const isGenerating = ref(false);
const generationProgress = ref(0);
const generationProgressText = ref('');
const courseName = ref('');
const chapterCount = ref(0);

let requestAbortController = null;

const loadCourseInfo = async () => {
  try {
    if (!props.courseId) {
      return;
    }
    const courseResponse = await getCourseById(props.courseId);
    if (courseResponse?.courseData?.name) {
      courseName.value = courseResponse.courseData.name;
    } else if (courseResponse?.data?.name) {
      courseName.value = courseResponse.data.name;
    } else if (courseResponse?.name) {
      courseName.value = courseResponse.name;
    }
  } catch (error) {
    console.error('获取课程信息失败:', error);
    courseName.value = '';
  }
};

onMounted(() => {
  loadCourseInfo();
});

const startResize = (event) => {
  isResizing.value = true;
  document.addEventListener('mousemove', handleResize, { passive: false });
  document.addEventListener('mouseup', stopResize, { passive: true });
  event.preventDefault();
};

const handleResize = (event) => {
  if (!isResizing.value) {
    return;
  }

  const container = document.querySelector('.content-container');
  if (!container) {
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const newLeftWidth = ((event.clientX - containerRect.left) / containerRect.width) * 100;
  if (newLeftWidth >= 20 && newLeftWidth <= 80) {
    leftPanelWidth.value = newLeftWidth;
  }
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
};

const normalizeParentId = (parentId) => {
  if (parentId === null || parentId === undefined || parentId === '' || parentId === 0 || parentId === '0') {
    return 'root';
  }
  return String(parentId);
};

const buildPreviewText = (result) => {
  const nodes = Array.isArray(result?.nodes) ? result.nodes : [];
  if (!nodes.length) {
    return '';
  }

  const ordered = [...nodes].sort((a, b) => {
    if ((a.level || 0) !== (b.level || 0)) {
      return (a.level || 0) - (b.level || 0);
    }
    return String(a.id || '').localeCompare(String(b.id || ''));
  });

  const childrenMap = new Map();
  ordered.forEach((node) => {
    const key = normalizeParentId(node.parentId);
    if (!childrenMap.has(key)) {
      childrenMap.set(key, []);
    }
    childrenMap.get(key).push(node);
  });

  const lines = [];
  const visited = new Set();
  const walk = (parentId, prefix = '') => {
    const children = childrenMap.get(parentId) || [];
    children.forEach((node, index) => {
      const current = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
      const nodeId = String(node.id || `${parentId}-${index}`);
      const title = String(node.title || node.name || '').trim();
      if (!title || visited.has(nodeId)) {
        return;
      }
      visited.add(nodeId);
      lines.push(`${current}:${title}`);
      walk(nodeId, current);
    });
  };

  walk('root');
  return lines.join('\n');
};

const parseGeneratedText = () => {
  if (!generatedResult.value.trim()) {
    parsedNodes.value = [];
    return;
  }

  const lines = generatedResult.value.split('\n');
  let nodeId = 1;
  parsedNodes.value = lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+(?:\.\d+)*):(.+)$/);
      if (!match) {
        return null;
      }
      const [, number, title] = match;
      return {
        id: nodeId++,
        number: `${number}:`,
        title: title.trim(),
        level: number.split('.').length
      };
    })
    .filter(Boolean);
};

const generateChapter = async () => {
  if (!chapterRequirements.value.trim()) {
    alert('请输入章节信息');
    return;
  }

  isGenerating.value = true;
  generationProgress.value = 15;
  generationProgressText.value = '已提交后端章节生成请求，后端正在完成 AI 生成与章节落库...';
  chapterCount.value = 0;
  generatedResult.value = '';
  originalResult.value = '';
  parsedNodes.value = [];
  requestAbortController = new AbortController();

  try {
    const response = await generateKnowledgeGraphAndPersist({
      courseId: props.courseId,
      courseName: courseName.value || `课程-${props.courseId}`,
      teacherRequirements: chapterRequirements.value,
      sourceText: chapterRequirements.value,
      pdfPaths: [],
      graphType: '1'
    }, requestAbortController.signal);

    const data = response?.data || response || {};
    const previewText = buildPreviewText(data.result || data.task?.result || null);

    generatedResult.value = previewText;
    originalResult.value = previewText;
    chapterCount.value = Number(data.graphCount || (Array.isArray(data.graphIds) ? data.graphIds.length : 0));
    generationProgress.value = 100;
    generationProgressText.value = '后端已完成章节生成、解析并更新章节结构';
    parseGeneratedText();
  } catch (error) {
    console.error('生成章节失败:', error);
    if (error.name === 'CanceledError' || error.name === 'AbortError') {
      alert('章节生成已取消');
    } else {
      alert(error.message || '生成章节失败，请重试');
    }
    generationProgress.value = 0;
  } finally {
    requestAbortController = null;
    isGenerating.value = false;
  }
};

const stopGeneration = () => {
  if (isGenerating.value && requestAbortController) {
    requestAbortController.abort();
  }
};

const resetResult = () => {
  generatedResult.value = originalResult.value;
  parseGeneratedText();
};

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'preview' ? 'text' : 'preview';
};

const goBack = () => {
  router.back();
};

const goToChapters = () => {
  router.back();
};

watch(generatedResult, () => {
  parseGeneratedText();
});

onUnmounted(() => {
  if (requestAbortController) {
    requestAbortController.abort();
  }
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
});
</script>

<style scoped>
@import '@/teacher/styles/ai-chapter-generator.css';
</style>
