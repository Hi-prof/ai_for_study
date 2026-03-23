<template>
  <div class="right-panel">
    <!-- 父节点选择器 -->
    <div v-if="availableParentNodes.length > 0 || isLoadingNodes" class="parent-node-selector">
      <div class="selector-header">
        <label class="selector-label">选择父节点（可选）：</label>
        <div class="selector-hint">选择现有节点作为父节点，AI生成的内容将作为其子节点</div>
      </div>
      <div class="selector-content">
        <select
          :value="selectedParentNodeId"
          @input="$emit('update:selected-parent-node-id', $event.target.value)"
          class="parent-node-select"
          :disabled="isLoadingNodes"
        >
          <option value="">作为根节点创建</option>
          <option
            v-for="node in availableParentNodes"
            :key="node.id"
            :value="node.id"
          >
            {{ getNodeDisplayName(node) }}
          </option>
        </select>
        <div v-if="isLoadingNodes" class="loading-hint">
          <i class="loading-icon"></i>
          正在加载节点列表...
        </div>
        <div v-else-if="availableParentNodes.length === 0" class="empty-hint">
          暂无可选的父节点，将作为根节点创建
        </div>
      </div>
    </div>

    <div class="result-section">
      <!-- 显示模式切换 -->
      <div class="view-mode-header" v-if="modelValue.trim()">
        <label class="form-label">
          生成结果
          <span class="editable-hint">{{ readonlyResult ? '（后端智能体生成结果预览）' : '（节点名称可编辑）' }}</span>
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
      <div v-if="viewMode === 'preview' && modelValue.trim()" class="preview-container">
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
                :contenteditable="!readonlyResult"
                @blur="!readonlyResult && editNodeTitle(node.id, $event.target.textContent)"
                @keydown.enter.prevent="!readonlyResult && $event.target.blur()"
              >{{ node.title }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 文本模式 -->
      <div v-if="viewMode === 'text' || !modelValue.trim()" class="text-container">
        <div class="form-group">
          <label class="form-label" v-if="!modelValue.trim()">
            生成结果
            <span class="editable-hint">{{ readonlyResult ? '后端智能体生成结果将显示在这里' : 'AI生成的知识图谱结构将显示在这里' }}</span>
          </label>
          <textarea
            :value="modelValue"
            @input="handleTextInput"
            class="form-textarea large-textarea editable-result"
            :readonly="readonlyResult"
            :placeholder="readonlyResult ? '后端智能体生成的知识图谱预览将显示在这里...' : 'AI生成的知识图谱结构将显示在这里，生成后可直接编辑修改...'"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- 操作按钮区域 -->
    <div class="action-section">
      <div class="button-group">
        <button
          class="btn btn-secondary"
          @click="handleReset"
          :disabled="readonlyResult || !modelValue.trim() || !isModified"
          title="重置为AI原始生成内容"
        >
          <i class="reset-icon"></i>
          重置
        </button>
        <button
          class="btn btn-primary btn-large"
          @click="handleExport"
          :disabled="!modelValue.trim() || isExporting || isGenerating"
        >
          <i class="export-icon" v-if="!isExporting"></i>
          <i class="loading-icon" v-else></i>
          {{ isExporting ? '正在保存知识图谱...' : '保存到知识图谱' }}
        </button>
      </div>
      <div class="edit-status" v-if="isModified">
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
</template>

<script setup>
import { ref, computed, watch } from 'vue';

// 定义props和emits
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  originalValue: {
    type: String,
    default: ''
  },
  isExporting: {
    type: Boolean,
    default: false
  },
  exportProgress: {
    type: Number,
    default: 0
  },
  exportProgressText: {
    type: String,
    default: ''
  },
  textNodeParserRef: {
    type: Object,
    default: null
  },
  selectedParentNodeId: {
    type: String,
    default: ''
  },
  availableParentNodes: {
    type: Array,
    default: () => []
  },
  isLoadingNodes: {
    type: Boolean,
    default: false
  },
  isGenerating: {
    type: Boolean,
    default: false
  },
  readonlyResult: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'reset', 'export', 'update:selected-parent-node-id']);

// 响应式数据
const viewMode = ref('preview'); // 'preview' 或 'text'
const parsedNodes = ref([]); // 解析后的节点数据

// 计算属性
const isModified = computed(() => {
  return props.originalValue && props.modelValue !== props.originalValue;
});

// 解析生成的文本为节点结构（用于预览显示）
const parseGeneratedText = () => {
  if (!props.modelValue.trim()) {
    parsedNodes.value = [];
    return;
  }

  // 使用TextNodeParser进行解析，如果组件已加载
  if (props.textNodeParserRef) {
    try {
      const nodes = props.textNodeParserRef.parseText(props.modelValue);
      // 转换为预览格式
      const flattenNodes = (nodeList, result = []) => {
        nodeList.forEach(node => {
          result.push({
            id: node.id,
            number: node.number + ':',
            title: node.title,
            level: node.level,
            originalLine: `${node.number}:${node.title}`
          });
          if (node.children) {
            flattenNodes(node.children, result);
          }
        });
        return result;
      };
      parsedNodes.value = flattenNodes(nodes);
    } catch (error) {
      // 如果解析失败，使用简单解析
      parseSimple();
    }
  } else {
    parseSimple();
  }
};

// 简单解析（备用方案）
const parseSimple = () => {
  const lines = props.modelValue.split('\n');
  const nodes = [];
  let nodeId = 1;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const match = trimmedLine.match(/^(\d+(?:\.\d+)*):(.+)$/);
    if (match) {
      const [, number, title] = match;
      const level = number.split('.').length;

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
  emit('update:modelValue', lines.join('\n'));
};

// 处理文本输入
const handleTextInput = (event) => {
  if (props.readonlyResult) {
    return;
  }
  emit('update:modelValue', event.target.value);
};

// 处理重置
const handleReset = () => {
  emit('reset');
};

// 处理导出
const handleExport = () => {
  emit('export');
};

// 获取节点显示名称（包含层级信息）
const getNodeDisplayName = (node) => {
  if (!node) return '未知节点';

  // 如果节点有父节点，尝试显示层级信息
  if (node.parentId) {
    // 简单显示：子节点名称
    return `└─ ${node.name || '未命名节点'}`;
  } else {
    // 根节点
    return `${node.name || '未命名节点'}`;
  }
};

// 监听modelValue变化，自动解析文本
watch(() => props.modelValue, () => {
  parseGeneratedText();
}, { immediate: true });

// 监听textNodeParserRef变化，重新解析
watch(() => props.textNodeParserRef, () => {
  if (props.textNodeParserRef) {
    parseGeneratedText();
  }
});
</script>

<style scoped>
/* 确保组件高度和布局正确 */
.right-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 父节点选择器样式 */
.parent-node-selector {
  flex-shrink: 0; /* 不允许收缩 */
  padding: 1rem 1.5rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.result-section {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 重要：允许flex子项收缩 */
}

/* 文本模式下的表单组需要占满剩余空间 */
.text-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.text-container .form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.text-container .form-textarea {
  flex: 1;
  min-height: 400px;
  resize: vertical;
}

/* 预览模式下的容器需要占满剩余空间 */
.preview-container {
  flex: 1;
  overflow-y: auto;
}

/* 操作按钮区域 */
.action-section {
  flex-shrink: 0; /* 不允许收缩，确保按钮始终可见 */
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background-color: #f8fafc;
}
</style>

<style scoped>
@import '@/teacher/styles/ai-knowledge-graph-generator.css';
</style>
