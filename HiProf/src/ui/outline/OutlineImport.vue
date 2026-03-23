<template>
  <div class="outline-import-modal">
    <div class="modal-backdrop" @click="closeModal"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">导入大纲</h2>
        <button class="close-btn" @click="closeModal">×</button>
      </div>
      
      <div class="modal-body">
        <div class="import-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'text' }"
            @click="activeTab = 'text'"
          >
            文本导入
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'file' }"
            @click="activeTab = 'file'"
          >
            文件导入
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'url' }"
            @click="activeTab = 'url'"
          >
            URL导入
          </button>
        </div>
        
        <div class="tab-content">
          <!-- 文本导入 -->
          <div v-if="activeTab === 'text'" class="text-import">
            <p class="import-instructions">
              请输入大纲文本，每行一个知识点，使用缩进（Tab或空格）表示层级关系。
            </p>
            <textarea 
              v-model="importText" 
              class="import-textarea"
              placeholder="例如：
一级知识点
    二级知识点A
        三级知识点1
        三级知识点2
    二级知识点B
一级知识点2"
              rows="10"
            ></textarea>
            
            <div class="import-options">
              <div class="option-group">
                <label>缩进类型：</label>
                <select v-model="textOptions.indentType">
                  <option value="tab">Tab</option>
                  <option value="space">空格</option>
                </select>
              </div>
              
              <div class="option-group" v-if="textOptions.indentType === 'space'">
                <label>空格数量：</label>
                <select v-model="textOptions.spaceCount">
                  <option value="2">2</option>
                  <option value="4">4</option>
                  <option value="8">8</option>
                </select>
              </div>
              
              <div class="option-group">
                <label>
                  <input type="checkbox" v-model="textOptions.hasContent" />
                  包含内容（使用空行分隔标题和内容）
                </label>
              </div>
            </div>
          </div>
          
          <!-- 文件导入 -->
          <div v-if="activeTab === 'file'" class="file-import">
            <p class="import-instructions">
              支持上传 .txt, .md, .docx, .json 格式文件。
            </p>
            
            <div class="file-upload-area">
              <input 
                type="file" 
                id="file-upload" 
                class="file-input" 
                accept=".txt,.md,.docx,.json"
                @change="handleFileUpload"
              />
              <label for="file-upload" class="file-label">
                <div class="upload-icon">📁</div>
                <div class="upload-text">
                  <span v-if="!uploadedFile">点击或拖拽文件到此处</span>
                  <span v-else>已选择: {{ uploadedFile.name }}</span>
                </div>
              </label>
            </div>
            
            <div class="file-options">
              <div class="option-group">
                <label>文件类型：</label>
                <select v-model="fileOptions.fileType">
                  <option value="auto">自动检测</option>
                  <option value="txt">纯文本</option>
                  <option value="md">Markdown</option>
                  <option value="json">JSON</option>
                  <option value="docx">Word文档</option>
                </select>
              </div>
            </div>
          </div>
          
          <!-- URL导入 -->
          <div v-if="activeTab === 'url'" class="url-import">
            <p class="import-instructions">
              输入包含大纲数据的网页URL。
            </p>
            
            <div class="url-input-group">
              <input 
                type="text" 
                v-model="urlOptions.url" 
                class="url-input"
                placeholder="https://example.com/outline.json"
              />
              <button class="btn btn-outline" @click="fetchFromUrl">获取</button>
            </div>
            
            <div class="url-options">
              <div class="option-group">
                <label>数据格式：</label>
                <select v-model="urlOptions.dataType">
                  <option value="json">JSON</option>
                  <option value="text">纯文本</option>
                  <option value="html">HTML</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 预览区域 -->
        <div class="preview-section" v-if="previewData.length > 0">
          <h3>导入预览</h3>
          <div class="preview-container">
            <div 
              v-for="(item, index) in previewData" 
              :key="index"
              class="preview-item"
              :style="{ paddingLeft: `${item.level * 20}px` }"
            >
              <div class="preview-title">{{ item.title }}</div>
              <div v-if="item.content" class="preview-content">{{ item.content }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-outline" @click="closeModal">取消</button>
        <button 
          class="btn btn-primary" 
          @click="importData"
          :disabled="!canImport"
        >
          导入
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// 事件定义
const emit = defineEmits(['close', 'import']);

// 导入类型标签
const activeTab = ref('text');

// 文本导入选项
const importText = ref('');
const textOptions = ref({
  indentType: 'space',
  spaceCount: 4,
  hasContent: false
});

// 文件导入选项
const uploadedFile = ref(null);
const fileOptions = ref({
  fileType: 'auto'
});

// URL导入选项
const urlOptions = ref({
  url: '',
  dataType: 'json'
});

// 预览数据
const previewData = ref([]);

// 计算属性：是否可以导入
const canImport = computed(() => {
  return previewData.value.length > 0;
});

// 关闭模态框
const closeModal = () => {
  emit('close');
};

// 处理文本导入预览
const previewTextImport = () => {
  if (!importText.value.trim()) {
    previewData.value = [];
    return;
  }
  
  const lines = importText.value.split('\n');
  const result = [];
  let currentLevel = 0;
  let currentTitle = '';
  let currentContent = '';
  let isReadingContent = false;
  
  const getIndentLevel = (line) => {
    if (textOptions.value.indentType === 'tab') {
      return line.match(/^\t*/)[0].length;
    } else {
      const spaces = line.match(/^ */)[0].length;
      return Math.floor(spaces / textOptions.value.spaceCount);
    }
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (textOptions.value.hasContent) {
      // 空行表示标题和内容的分隔
      if (line.trim() === '') {
        if (currentTitle && !isReadingContent) {
          isReadingContent = true;
        } else if (isReadingContent && currentContent) {
          // 保存当前节点
          result.push({
            title: currentTitle,
            content: currentContent,
            level: currentLevel
          });
          
          // 重置状态
          currentTitle = '';
          currentContent = '';
          isReadingContent = false;
        }
        continue;
      }
      
      if (!isReadingContent) {
        // 读取标题
        currentLevel = getIndentLevel(line);
        currentTitle = line.trim();
      } else {
        // 读取内容
        currentContent += (currentContent ? '\n' : '') + line;
      }
    } else {
      // 简单模式：每行一个节点
      const level = getIndentLevel(line);
      const title = line.trim();
      
      if (title) {
        result.push({
          title,
          content: '',
          level
        });
      }
    }
  }
  
  // 处理最后一个节点
  if (textOptions.value.hasContent && currentTitle) {
    result.push({
      title: currentTitle,
      content: currentContent,
      level: currentLevel
    });
  }
  
  previewData.value = result;
};

// 监听文本变化
const handleTextChange = () => {
  previewTextImport();
};

// 处理文件上传
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  uploadedFile.value = file;
  
  // 读取文件内容
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    
    // 根据文件类型处理
    switch (fileOptions.value.fileType) {
      case 'json':
      case 'auto' && file.name.endsWith('.json'):
        try {
          const jsonData = JSON.parse(content);
          // 处理JSON格式的大纲数据
          previewData.value = convertJsonToPreview(jsonData);
        } catch (error) {
          console.error('JSON解析错误:', error);
          alert('JSON格式错误，请检查文件内容');
        }
        break;
      
      case 'txt':
      case 'md':
      case 'auto' && (file.name.endsWith('.txt') || file.name.endsWith('.md')):
        // 将文本内容填入文本导入区，并切换到文本导入标签
        importText.value = content;
        activeTab.value = 'text';
        previewTextImport();
        break;
      
      default:
        alert('不支持的文件格式');
        break;
    }
  };
  
  if (fileOptions.value.fileType === 'json' || file.name.endsWith('.json')) {
    reader.readAsText(file);
  } else {
    reader.readAsText(file);
  }
};

// 从URL获取数据
const fetchFromUrl = async () => {
  if (!urlOptions.value.url) {
    alert('请输入有效的URL');
    return;
  }
  
  try {
    // 实际项目中应通过后端代理请求，避免跨域问题
    const response = await fetch(urlOptions.value.url);
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }
    
    switch (urlOptions.value.dataType) {
      case 'json':
        const jsonData = await response.json();
        previewData.value = convertJsonToPreview(jsonData);
        break;
      
      case 'text':
        const textData = await response.text();
        importText.value = textData;
        activeTab.value = 'text';
        previewTextImport();
        break;
      
      case 'html':
        // 处理HTML内容，实际项目中可能需要更复杂的解析
        const htmlData = await response.text();
        alert('HTML解析功能尚未实现');
        break;
    }
  } catch (error) {
    console.error('获取URL数据失败:', error);
    alert(`获取数据失败: ${error.message}`);
  }
};

// 将JSON格式转换为预览格式
const convertJsonToPreview = (jsonData) => {
  // 这里的实现取决于实际的JSON结构
  // 假设JSON格式是扁平的节点数组，每个节点有title、content和level属性
  if (Array.isArray(jsonData)) {
    return jsonData.map(item => ({
      title: item.title || '',
      content: item.content || '',
      level: item.level || 0
    }));
  } else if (jsonData.nodes && Array.isArray(jsonData.nodes)) {
    // 或者是包含nodes数组的对象
    return jsonData.nodes.map(item => ({
      title: item.title || '',
      content: item.content || '',
      level: item.level || 0
    }));
  }
  
  // 如果是嵌套结构，需要递归处理
  return [];
};

// 导入数据
const importData = () => {
  // 将预览数据转换为应用所需的节点树结构
  const nodes = convertPreviewToNodes(previewData.value);
  emit('import', { nodes });
};

// 将预览数据转换为节点树结构
const convertPreviewToNodes = (previewItems) => {
  // 这个函数将扁平的预览数据转换为嵌套的树结构
  // 实际实现取决于应用所需的数据结构
  
  const rootNodes = [];
  const nodeStack = [];
  
  previewItems.forEach((item) => {
    const node = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      title: item.title,
      content: item.content,
      children: []
    };
    
    // 根节点
    if (item.level === 0) {
      rootNodes.push(node);
      nodeStack[0] = node;
      return;
    }
    
    // 找到父节点
    const parentNode = nodeStack[item.level - 1];
    if (parentNode) {
      parentNode.children.push(node);
      nodeStack[item.level] = node;
      
      // 清除更深层级的节点引用
      for (let i = item.level + 1; i < nodeStack.length; i++) {
        nodeStack[i] = null;
      }
    }
  });
  
  return rootNodes;
};

// 监听文本变化以更新预览
watch(importText, previewTextImport);
</script>

<style scoped>
.outline-import-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  background-color: var(--background-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: var(--font-size-large);
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-light);
}

.modal-body {
  padding: var(--spacing-md);
  overflow-y: auto;
  flex: 1;
}

.import-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing-md);
}

.tab-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}

.tab-btn.active {
  border-bottom-color: var(--primary-color);
  color: var(--primary-color);
}

.import-instructions {
  margin-bottom: var(--spacing-md);
  color: var(--text-light);
}

.import-textarea {
  width: 100%;
  min-height: 200px;
  padding: var(--spacing-sm);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
  font-family: monospace;
}

.import-options,
.file-options,
.url-options {
  margin-bottom: var(--spacing-md);
}

.option-group {
  margin-bottom: var(--spacing-sm);
}

.option-group label {
  margin-right: var(--spacing-sm);
}

.file-upload-area {
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  text-align: center;
  margin-bottom: var(--spacing-md);
  cursor: pointer;
}

.file-input {
  display: none;
}

.file-label {
  display: block;
  cursor: pointer;
}

.upload-icon {
  font-size: 32px;
  margin-bottom: var(--spacing-sm);
}

.url-input-group {
  display: flex;
  margin-bottom: var(--spacing-md);
}

.url-input {
  flex: 1;
  padding: var(--spacing-sm);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md) 0 0 var(--border-radius-md);
}

.url-input-group .btn {
  border-radius: 0 var(--border-radius-md) var(--border-radius-md) 0;
}

.preview-section {
  margin-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  padding-top: var(--spacing-md);
}

.preview-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm);
}

.preview-item {
  margin-bottom: var(--spacing-sm);
}

.preview-title {
  font-weight: bold;
}

.preview-content {
  color: var(--text-light);
  font-size: var(--font-size-small);
  margin-top: var(--spacing-xs);
  white-space: pre-line;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-color);
}
</style> 