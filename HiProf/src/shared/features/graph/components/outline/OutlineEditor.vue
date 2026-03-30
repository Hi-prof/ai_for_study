<template>
  <div class="outline-editor">
    <div class="editor-header">
      <input 
        type="text" 
        class="editor-title-input" 
        v-model="localNode.title" 
        placeholder="知识点标题"
        @input="handleTitleChange"
        @blur="updateNode"
      />
      
      <div class="editor-meta">
        <span class="node-id">ID: {{ node.id }}</span>
        <span class="node-path">路径: {{ nodePath }}</span>
      </div>
    </div>
    
    <div class="editor-toolbar">
      <button class="toolbar-btn" title="加粗" @click="applyFormat('bold')">
        <i class="icon-bold">B</i>
      </button>
      <button class="toolbar-btn" title="斜体" @click="applyFormat('italic')">
        <i class="icon-italic">I</i>
      </button>
      <button class="toolbar-btn" title="下划线" @click="applyFormat('underline')">
        <i class="icon-underline">U</i>
      </button>
      <button class="toolbar-btn" title="插入链接" @click="insertLink">
        <i class="icon-link">🔗</i>
      </button>
      <button class="toolbar-btn" title="插入图片" @click="insertImage">
        <i class="icon-image">🖼️</i>
      </button>
      <button class="toolbar-btn" title="插入代码块" @click="insertCodeBlock">
        <i class="icon-code">{ }</i>
      </button>
    </div>
    
    <div class="editor-content">
      <textarea 
        class="content-textarea"
        v-model="localNode.content"
        placeholder="在此输入知识点内容..."
        :style="fontStyle"
        @input="handleContentChange"
        @blur="updateNode"
      ></textarea>
    </div>
    
    <div class="editor-relations">
      <h3>关联知识点</h3>
      <div class="relations-list" v-if="localNode.relations && localNode.relations.length > 0">
        <div 
          v-for="(relation, index) in localNode.relations" 
          :key="index"
          class="relation-item"
        >
          <span class="relation-title">{{ relation.title }}</span>
          <span class="relation-type">{{ relation.type }}</span>
          <button class="remove-relation" @click="removeRelation(index)">×</button>
        </div>
      </div>
      <div v-else class="no-relations">
        暂无关联知识点
      </div>
      
      <button class="btn btn-outline btn-sm add-relation" @click="addRelation">
        添加关联
      </button>
    </div>
    
    <div class="editor-footer">
      <div class="editor-status">
        <span>{{ wordCount }}字</span>
      </div>
      <div class="editor-actions">
        <button class="btn btn-primary" @click="updateNode">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

// 属性定义
const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  fontStyle: {
    type: Object,
    default: () => ({
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#333333'
    })
  }
});

// 事件定义
const emit = defineEmits(['update:node']);

// 本地节点数据（用于编辑）
const localNode = ref({...props.node});

// 监听外部节点变化
watch(() => props.node, (newNode) => {
  localNode.value = {...newNode};
}, { deep: true });

// 计算节点路径
const nodePath = computed(() => {
  // 实际项目中应该从父组件传入完整路径或通过ID查找
  return props.node.id.split('.').join(' > ');
});

// 计算字数
const wordCount = computed(() => {
  if (!localNode.value.content) return 0;
  // 中文按字计算，英文按词计算
  return localNode.value.content.replace(/\s+/g, '').length;
});

// 标题变更处理
const handleTitleChange = () => {
  // 可以在这里添加实时验证逻辑
};

// 内容变更处理
const handleContentChange = () => {
  // 可以在这里添加实时保存逻辑
};

// 更新节点
const updateNode = () => {
  emit('update:node', localNode.value);
};

// 格式应用
const applyFormat = (format) => {
  const textarea = document.querySelector('.content-textarea');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = localNode.value.content.substring(start, end);
  
  let formattedText = '';
  switch (format) {
    case 'bold':
      formattedText = `**${selectedText}**`;
      break;
    case 'italic':
      formattedText = `*${selectedText}*`;
      break;
    case 'underline':
      formattedText = `<u>${selectedText}</u>`;
      break;
    default:
      formattedText = selectedText;
  }
  
  localNode.value.content = 
    localNode.value.content.substring(0, start) + 
    formattedText + 
    localNode.value.content.substring(end);
  
  // 重新聚焦并设置光标位置
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
  }, 0);
};

// 插入链接
const insertLink = () => {
  const url = prompt('请输入链接地址:', 'https://');
  if (!url) return;
  
  const text = prompt('请输入链接文字:', '链接文字');
  if (!text) return;
  
  const linkMarkdown = `[${text}](${url})`;
  
  const textarea = document.querySelector('.content-textarea');
  const start = textarea.selectionStart;
  
  localNode.value.content = 
    localNode.value.content.substring(0, start) + 
    linkMarkdown + 
    localNode.value.content.substring(start);
  
  // 重新聚焦并设置光标位置
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start + linkMarkdown.length, start + linkMarkdown.length);
  }, 0);
};

// 插入图片
const insertImage = () => {
  const url = prompt('请输入图片地址:', 'https://');
  if (!url) return;
  
  const alt = prompt('请输入图片描述:', '图片描述');
  
  const imageMarkdown = `![${alt || ''}](${url})`;
  
  const textarea = document.querySelector('.content-textarea');
  const start = textarea.selectionStart;
  
  localNode.value.content = 
    localNode.value.content.substring(0, start) + 
    imageMarkdown + 
    localNode.value.content.substring(start);
  
  // 重新聚焦并设置光标位置
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
  }, 0);
};

// 插入代码块
const insertCodeBlock = () => {
  const language = prompt('请输入代码语言:', 'javascript');
  
  const codeBlock = `\n\`\`\`${language || ''}\n\n\`\`\`\n`;
  
  const textarea = document.querySelector('.content-textarea');
  const start = textarea.selectionStart;
  
  localNode.value.content = 
    localNode.value.content.substring(0, start) + 
    codeBlock + 
    localNode.value.content.substring(start);
  
  // 重新聚焦并设置光标位置到代码块中间
  const cursorPosition = start + codeBlock.indexOf('\n\n') + 1;
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(cursorPosition, cursorPosition);
  }, 0);
};

// 添加关联
const addRelation = () => {
  // 实际项目中应该打开关联选择对话框
  const relationTitle = prompt('请输入关联知识点标题:', '');
  if (!relationTitle) return;
  
  const relationType = prompt('请输入关联类型 (如: 包含、前置、相关):', '相关');
  
  if (!localNode.value.relations) {
    localNode.value.relations = [];
  }
  
  localNode.value.relations.push({
    id: Date.now().toString(), // 临时ID，实际项目应使用真实ID
    title: relationTitle,
    type: relationType || '相关'
  });
  
  updateNode();
};

// 移除关联
const removeRelation = (index) => {
  localNode.value.relations.splice(index, 1);
  updateNode();
};
</script>

<style scoped>
.outline-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--background-color);
}

.editor-header {
  margin-bottom: var(--spacing-md);
}

.editor-title-input {
  width: 100%;
  padding: var(--spacing-sm);
  font-size: var(--font-size-large);
  font-weight: bold;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-xs);
}

.editor-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: var(--font-size-small);
  color: var(--text-light);
}

.editor-toolbar {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--border-color-light);
  margin-bottom: var(--spacing-md);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
}

.toolbar-btn:hover {
  background-color: var(--hover-color);
}

.editor-content {
  flex: 1;
  margin-bottom: var(--spacing-md);
}

.content-textarea {
  width: 100%;
  height: 100%;
  min-height: 200px;
  padding: var(--spacing-sm);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  resize: none;
  font-family: inherit;
}

.editor-relations {
  margin-bottom: var(--spacing-md);
}

.editor-relations h3 {
  font-size: var(--font-size-medium);
  margin-bottom: var(--spacing-sm);
}

.relations-list {
  margin-bottom: var(--spacing-sm);
}

.relation-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--background-color-light);
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--spacing-xs);
}

.relation-title {
  flex: 1;
  font-weight: bold;
}

.relation-type {
  color: var(--text-light);
  margin-right: var(--spacing-sm);
}

.remove-relation {
  border: none;
  background: transparent;
  color: var(--text-light);
  cursor: pointer;
  font-size: var(--font-size-medium);
}

.no-relations {
  color: var(--text-light);
  font-style: italic;
  margin-bottom: var(--spacing-sm);
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-color-light);
}

.editor-status {
  color: var(--text-light);
  font-size: var(--font-size-small);
}
</style> 