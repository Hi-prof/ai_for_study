<template>
  <div class="node-tree-view">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>正在加载知识图谱节点...</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="$emit('retry')" class="retry-btn">重试</button>
    </div>
    
    <!-- 节点树容器 -->
    <div v-else class="node-container">
      <div class="outline-header">
        <h2 v-if="isLoading && !currentGraph">加载大纲信息...</h2>
        <h2 v-else>{{ currentGraph ? currentGraph.name : `知识图谱大纲 #${courseId}` }}</h2>
        <div class="header-actions-right">
          <button v-if="isEditMode" class="create-node-btn" @click="$emit('addRootNode')">
            <span class="create-icon">+</span> 创建根节点
          </button>
          <div class="search-box">
            <input 
              type="text" 
              v-model="localSearchQuery" 
              placeholder="搜索知识点..." 
              @input="handleSearch"
            />
            <button v-if="localSearchQuery" class="clear-search" @click="clearSearch">×</button>
            <button class="search-button" @click="handleSearch">搜索</button>
          </div>
        </div>
      </div>

      <!-- 有节点时显示表格形式的节点列表 -->
      <div v-if="hierarchicalNodes.length > 0" class="nodes-table-container">
        <!-- 表格头部 -->
        <div class="table-header">
          <div class="header-col header-level">层级</div>
          <div class="header-col header-name">节点名称</div>
          <div class="header-col header-content">节点内容</div>
          <div class="header-col header-expand" v-if="isEditMode">展开</div>
          <div class="header-col header-actions" v-if="isEditMode">操作</div>
        </div>

        <!-- 表格内容 -->
        <div class="nodes-table">
          <template v-for="node in hierarchicalNodes" :key="node.id">
            <NodeTableRow
              :node="node"
              :level="1"
              :editable="isEditMode"
              @toggle="$emit('toggleNode', $event)"
              @edit="$emit('editNode', $event)"
              @add-child="$emit('addChildNode', $event)"
              @delete="$emit('deleteNode', $event)"
            />
          </template>
        </div>
      </div>

      <!-- 无节点时显示空状态 -->
      <div v-else class="empty-state">
        <p>此知识图谱暂无节点</p>
        <button v-if="isEditMode" class="add-root-node-btn" @click="$emit('addRootNode')">
          添加根节点
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import NodeTableRow from '@/ui/outline/NodeTableRow.vue';

// Props
const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  hierarchicalNodes: {
    type: Array,
    default: () => []
  },
  currentGraph: {
    type: Object,
    default: null
  },
  courseId: {
    type: [String, Number],
    default: null
  },
  isEditMode: {
    type: Boolean,
    default: false
  },
  searchQuery: {
    type: String,
    default: ''
  }
});

// Emits
const emit = defineEmits([
  'toggleNode',
  'editNode', 
  'addChildNode',
  'deleteNode',
  'addRootNode',
  'search',
  'clearSearch',
  'retry'
]);

// 本地搜索查询，避免直接修改props
const localSearchQuery = ref('');

// 监听外部搜索查询变化
watch(() => props.searchQuery, (newQuery) => {
  localSearchQuery.value = newQuery;
}, { immediate: true });

// 处理搜索
const handleSearch = () => {
  emit('search', localSearchQuery.value);
};

// 清除搜索
const clearSearch = () => {
  localSearchQuery.value = '';
  emit('clearSearch');
};
</script>

<style scoped>
.node-tree-view {
  width: 100%;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #ef4444;
}

.error-state p {
  margin-bottom: 1rem;
  text-align: center;
}

.retry-btn {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background-color: #2563eb;
}

.node-container {
  width: 100%;
}

.outline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.outline-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.header-actions-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.create-node-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.create-node-btn:hover {
  background-color: #059669;
}

.create-icon {
  font-size: 1rem;
  font-weight: bold;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.search-box input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  width: 200px;
  transition: border-color 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-search {
  position: absolute;
  right: 60px;
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-search:hover {
  color: #374151;
}

.search-button {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.search-button:hover {
  background-color: #2563eb;
}

/* 表格样式 */
.nodes-table-container {
  margin-top: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: white;
}

.table-header {
  display: grid;
  grid-template-columns: 120px 250px 1fr 120px 200px;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background-color: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  position: sticky;
  top: 0;
  z-index: 10;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .table-header {
    grid-template-columns: 100px 200px 1fr 100px 180px;
    gap: 0.5rem;
    padding: 0.5rem;
    font-size: 0.75rem;
  }
}

@media (max-width: 768px) {
  .table-header {
    grid-template-columns: 80px 150px 1fr 80px 120px;
    gap: 0.25rem;
    padding: 0.5rem;
    font-size: 0.75rem;
  }
}

.header-col {
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-level {
  justify-content: center;
}

.header-name {
  justify-content: center;
}

.header-content {
  justify-content: center;
}

.header-expand {
  justify-content: center;
}

.header-actions {
  justify-content: center;
}

.nodes-table {
  max-height: calc(100vh - 400px);
  overflow-y: auto;
}

.node-tree {
  margin-top: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
  text-align: center;
}

.empty-state p {
  margin-bottom: 1rem;
  font-size: 1rem;
}

.add-root-node-btn {
  padding: 0.75rem 1.5rem;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.add-root-node-btn:hover {
  background-color: #059669;
}
</style>
