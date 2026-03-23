<template>
  <div class="chapters-section">
    <div class="section-header">
      <h4>章节列表</h4>
      <button class="btn btn-secondary btn-sm" @click="addNewChapter">
        <i class="plus-icon"></i>
        新增章节
      </button>
    </div>
    
    <div class="chapters-table">
      <!-- Table Header -->
      <div class="table-header">
        <div class="header-col header-number">编号</div>
        <div class="header-col header-name">名称</div>
        <div class="header-col header-content">内容</div>
        <div class="header-col header-expand">展开章节</div>
        <div class="header-col header-actions">删除</div>
      </div>

      <!-- Table Rows -->
      <template v-for="(chapter, index) in localChapters" :key="chapter.id || chapter.tempId">
        <div class="table-row">
          <div class="table-col col-number">
            <span class="chapter-number">第{{ index + 1 }}章</span>
          </div>
          <div class="table-col col-name">
            <input 
              type="text" 
              v-model="chapter.title" 
              placeholder="请输入章节名称" 
              class="form-input"
              @input="onChapterChange"
            />
          </div>
          <div class="table-col col-content">
            <textarea 
              v-model="chapter.description" 
              placeholder="请输入章节内容描述" 
              class="form-textarea"
              rows="2"
              @input="onChapterChange"
            ></textarea>
          </div>
          <div class="table-col col-expand">
            <button 
              class="btn btn-sm" 
              :class="chapter.showNodes ? 'btn-warning' : 'btn-outline'"
              @click="toggleChapterNodes(chapter)"
              :disabled="chapter.isNew"
              title="展开或收缩子章节管理"
            >
              {{ chapter.showNodes ? '🔽 收缩章节' : '▶️ 展开章节' }}
            </button>
          </div>
          <div class="table-col col-actions">
            <button 
              class="btn btn-sm btn-danger delete-btn" 
              @click="deleteChapter(chapter)"
              title="删除此章节"
            >
              删除
            </button>
          </div>
        </div>


        <!-- 子节点编辑区域 -->
        <div v-if="chapter.showNodes && !chapter.isNew" class="nodes-section">
          <!-- 章节文件列表 -->
          <div class="chapter-files-section">
            <ChapterFileList
              :course-id="courseId"
              :node-name="chapter.title || chapter.name"
              :node-id="getChapterRootNodeId(chapter)"
              :chapter-data="chapter"
              @upload-success="handleChapterFileUploadSuccess"
              @upload-error="handleChapterFileUploadError"
            />
          </div>

          <div class="nodes-header">
            <h5>子章节管理</h5>
            <button class="btn btn-sm btn-secondary" @click="addNewNode(chapter)">
              <i class="plus-icon"></i>
              新增节点
            </button>
          </div>
          
          <!-- 加载状态 -->
          <div v-if="loadingNodes.has(chapter.id || chapter.tempId)" class="nodes-loading">
            <div class="table-row">
              <div class="table-col" style="grid-column: 1 / -1; text-align: center; padding: 1rem;">
                <p>正在加载子节点数据...</p>
              </div>
            </div>
          </div>
          
          <!-- 节点表格 -->
          <div v-else class="nodes-table">
            <!-- 显示现有节点 -->
            <template v-if="chapter.nodes && chapter.nodes.length > 0">
              <template v-for="(node, nodeIndex) in chapter.nodes" :key="node.id || node.tempId">
                <div class="table-row node-row">
                  <div class="table-col col-number">
                    <span class="node-number">{{ nodeIndex + 1 }}</span>
                  </div>
                  <div class="table-col col-name">
                    <input 
                      type="text" 
                      v-model="node.name" 
                      placeholder="节点名称" 
                      class="form-input"
                      @input="onNodeChange"
                    />
                  </div>
                  <div class="table-col col-content">
                    <textarea 
                      v-model="node.content" 
                      placeholder="节点内容" 
                      class="form-textarea"
                      rows="2"
                      @input="onNodeChange"
                    ></textarea>
                  </div>
                  <div class="table-col col-expand">
                    <!-- 子节点没有展开功能，留空 -->
                  </div>
                  <div class="table-col col-actions">
                    <button 
                      class="btn btn-sm btn-danger delete-btn" 
                      @click="deleteNode(chapter, node)"
                      title="删除此节点"
                    >
                      删除
                    </button>
                  </div>
                </div>
                
                <!-- 节点文件列表 -->
                <div v-if="node.id" class="node-files-row">
                  <ChapterFileList
                    :course-id="courseId"
                    :node-name="node.name"
                    :node-id="node.id"
                    @upload-success="handleNodeFileUploadSuccess"
                    @upload-error="handleNodeFileUploadError"
                  />
                </div>
              </template>
            </template>
            
            <!-- 无节点时显示提示 -->
            <div v-else class="no-nodes">
              <div class="table-row">
                <div class="table-col" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                  <p class="text-muted">暂无子节点数据，点击"新增节点"按钮创建新节点</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';
import { getChapterNodes } from '@/api/node';
import ChapterFileList from './ChapterFileList.vue';

const props = defineProps({
  chapters: {
    type: Array,
    default: () => []
  },
  courseId: {
    type: [String, Number],
    required: true
  }
});

const emit = defineEmits(['chapters-change']);

// 本地章节数据
const localChapters = ref([]);
const loadingNodes = ref(new Set());







// 处理章节文件上传成功
const handleChapterFileUploadSuccess = (result) => {
  console.log('章节文件上传成功:', result);
  // 可以在这里添加成功提示
};

// 处理章节文件上传错误
const handleChapterFileUploadError = (error) => {
  console.error('章节文件上传失败:', error);
  // 可以在这里添加错误提示
};

// 处理节点文件上传成功
const handleNodeFileUploadSuccess = (result) => {
  console.log('节点文件上传成功:', result);
  // 可以在这里添加成功提示
};

// 处理节点文件上传错误
const handleNodeFileUploadError = (error) => {
  console.error('节点文件上传失败:', error);
  // 可以在这里添加错误提示
};



// 深拷贝函数
const deepClone = (obj) => {
  if (!obj) return [];
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error('深拷贝失败:', error);
    return [];
  }
};

// 监听章节数据变化
watch(() => props.chapters, (newChapters) => {
  if (newChapters && Array.isArray(newChapters)) {
    // 避免循环更新：只有当数据真正不同时才更新
    const newLength = newChapters.length;
    const oldLength = localChapters.value.length;

    if (newLength !== oldLength || JSON.stringify(newChapters) !== JSON.stringify(localChapters.value)) {
      localChapters.value = deepClone(newChapters);
    }
  }
}, { deep: true, immediate: true });

// 通知父组件数据变化
const onChapterChange = () => {
  emit('chapters-change', localChapters.value);
};

const onNodeChange = () => {
  emit('chapters-change', localChapters.value);
};

// 添加新章节
const addNewChapter = () => {
  const newChapter = {
    tempId: `new-${Date.now()}`,
    title: '',
    description: '',
    isNew: true,
    selectedFiles: [],
    nodes: [],
    showNodes: false
  };
  localChapters.value.push(newChapter);
  onChapterChange();
};

// 删除章节
const deleteChapter = (chapterToDelete) => {
  try {
    localChapters.value = localChapters.value.filter(
      chapter => {
        // 如果要删除的章节有 id，则比较 id
        if (chapterToDelete.id) {
          return chapter.id !== chapterToDelete.id;
        }
        // 如果要删除的章节有 tempId，则比较 tempId
        else if (chapterToDelete.tempId) {
          return chapter.tempId !== chapterToDelete.tempId;
        }
        // 如果都没有，保留章节
        else {
          return true;
        }
      }
    );

    onChapterChange();
  } catch (error) {
    console.error('删除章节时出错:', error);
  }
};

// 切换章节节点显示
const toggleChapterNodes = async (chapter) => {
  chapter.showNodes = !chapter.showNodes;

  // 如果是首次显示节点或者节点数据为空，加载节点数据
  if (chapter.showNodes && (!chapter.nodes || chapter.nodes.length === 0)) {
    const chapterKey = chapter.id || chapter.tempId;

    try {
      // 设置加载状态
      loadingNodes.value.add(chapterKey);

      // 从API加载章节的子节点数据
      const graphId = getChapterGraphId(chapter);
      const parentId = chapter.id;

      if (graphId && parentId) {
        console.log(`正在加载章节 ${chapter.title} 的子节点，父节点ID: ${parentId}, 图谱ID: ${graphId}`);
        const response = await getChapterNodes(parentId, graphId);

        if (response && response.rows) {
          // 将API返回的节点数据映射到本地数据结构
          chapter.nodes = response.rows.map(node => ({
            ...node,
            selectedFiles: [] // 初始化文件数组
          }));
          console.log(`成功加载 ${chapter.nodes.length} 个子节点`);
        } else {
          chapter.nodes = [];
        }
      } else {
        // 如果没有必要的ID，使用现有的sections数据或初始化为空数组
        chapter.nodes = chapter.sections || [];
      }
    } catch (error) {
      console.error('加载章节子节点失败:', error);
      // 加载失败时，尝试使用现有的sections数据
      chapter.nodes = chapter.sections || [];
    } finally {
      // 清除加载状态
      loadingNodes.value.delete(chapterKey);
    }
  }

  onChapterChange();
};

// 添加新节点
const addNewNode = (chapter) => {
  if (!chapter.nodes) {
    chapter.nodes = [];
  }
  const newNode = {
    tempId: `node-new-${Date.now()}`,
    name: '',
    content: '',
    isNew: true,
    selectedFiles: []
  };
  chapter.nodes.push(newNode);
  onNodeChange();
};

// 删除节点
const deleteNode = (chapter, nodeToDelete) => {
  chapter.nodes = chapter.nodes.filter(
    node => node.id !== nodeToDelete.id && node.tempId !== nodeToDelete.tempId
  );
  onNodeChange();
};

// 获取章节的图谱ID
const getChapterGraphId = (chapter) => {
  // 尝试多种可能的图谱ID来源
  return chapter._zstpData?.id ||
         chapter.graphId ||
         chapter.id ||
         props.courseId;
};

// 获取章节的节点ID（修复：直接使用章节ID）
const getChapterRootNodeId = (chapter) => {
  // 优先直接使用章节本身的ID作为节点ID
  if (chapter.id) {
    console.log('ChapterList: 使用章节本身ID作为节点ID:', chapter.id);
    return chapter.id;
  }

  // 如果章节已经加载了子节点，查找根节点作为备选
  if (chapter.nodes && chapter.nodes.length > 0) {
    const rootNode = chapter.nodes.find(node => node.parentId === null);
    if (rootNode && rootNode.id) {
      console.log('ChapterList: 使用根节点ID作为备选:', rootNode.id);
      return rootNode.id;
    }
  }

  // 如果章节有sections数据，也查找根节点作为备选
  if (chapter.sections && chapter.sections.length > 0) {
    const rootNode = chapter.sections.find(node => node.parentId === null);
    if (rootNode && rootNode.id) {
      console.log('ChapterList: 使用sections根节点ID作为备选:', rootNode.id);
      return rootNode.id;
    }
  }

  console.warn('ChapterList: 无法获取有效的章节节点ID');
  return null;
};
</script>

<style scoped>
@import '@/teacher/styles/chapter-editor.css';

/* 章节文件区域样式 */
.chapter-files-section {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

/* 节点文件区域样式 */
.node-files-row {
  grid-column: 1 / -1;
  margin-top: 12px;
  padding: 12px;
  background-color: #f1f5f9;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

/* 文件上传按钮样式增强 */
.file-upload-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.file-upload-btn:hover:not(:disabled) {
  background-color: #3b82f6;
  color: white;
  transform: translateY(-1px);
}

.file-upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 节点区域布局优化 */
.nodes-section {
  margin-top: 16px;
  padding: 16px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.nodes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.nodes-header h5 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}
</style>
