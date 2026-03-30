<template>
  <div class="graph-list">
    <div class="search-container">
      <div class="search-box">
        <input
          type="text"
          placeholder="搜索..."
          v-model="searchQuery"
          @input="filterGraphs"
        />
        <i class="search-icon"></i>
      </div>
      
      <button class="btn-create" @click="openCreateGraphDialog">
        <span class="btn-icon">+</span>
        <span>创建新知识图谱</span>
      </button>
    </div>
    
    <div class="graph-grid">
      <div 
        v-for="graph in filteredGraphs" 
        :key="graph.id" 
        class="graph-card"
      >
        <div class="graph-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 16l-4-4V8.82C14.16 8.4 15 7.3 15 6c0-1.66-1.34-3-3-3S9 4.34 9 6c0 1.3.84 2.4 2 2.82V12l-4 4H3v5h5v-3.05l4-4.2 4 4.2V21h5v-5h-4z" fill="currentColor"/>
          </svg>
        </div>
        <div class="graph-info" @click="navigateToGraphView(graph)">
          <h3 class="graph-title">{{ graph.title }}</h3>
          <p class="graph-details">{{ graph.description || '暂无描述' }}</p>
          <div class="graph-meta">
            <span class="graph-date">{{ formatDate(graph.updatedAt) }}</span>
            <span class="graph-nodes">{{ graph.nodeCount || '未知' }} 个节点</span>
          </div>
        </div>
        <div class="graph-actions-bar">
          <button class="action-btn edit-btn" @click.stop="editGraph(graph)" title="编辑">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
            </svg>
          </button>
          <button class="action-btn delete-btn" @click.stop="confirmDeleteGraph(graph)" title="删除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div v-if="filteredGraphs.length === 0 && !isLoading" class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1.6 16H6.6c-.9 0-1.3-1.1-.7-1.7l3.1-3.1c.2-.2.5-.2.7 0l1.6 1.6 3.8-3.8c.2-.2.5-.2.7 0l3.6 3.6c.6.6.2 1.7-.7 1.7l.3 2.7z" fill="currentColor"/>
          </svg>
        </div>
        <h3>没有找到知识图谱</h3>
        <p>尝试调整搜索条件或者创建一个新的知识图谱</p>
      </div>
      
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>正在加载知识图谱...</p>
      </div>
    </div>
    

    
    <!-- 创建/编辑知识图谱对话框 -->
    <div v-if="showGraphDialog" class="dialog-overlay" @click="closeGraphDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>{{ isEditing ? '编辑知识图谱' : '创建新知识图谱' }}</h3>
          <button class="close-btn" @click="closeGraphDialog">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label for="graph-title">知识图谱标题</label>
            <input 
              id="graph-title" 
              v-model="editingGraph.title" 
              type="text" 
              placeholder="输入知识图谱标题"
              required
              :class="{ 'has-error': validation.title }"
            />
            <p v-if="validation.title" class="error-message">{{ validation.title }}</p>
          </div>
          <div class="form-group">
            <label for="graph-description">知识图谱描述</label>
            <textarea 
              id="graph-description" 
              v-model="editingGraph.description" 
              placeholder="输入知识图谱描述"
              rows="4"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="closeGraphDialog">取消</button>
          <button class="btn-save" @click="saveGraph" :disabled="isSaving">
            <span v-if="isSaving" class="spinner-sm"></span>
            <span>{{ isSaving ? '保存中...' : '保存' }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="dialog-overlay" @click="cancelDelete">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>确认删除</h3>
          <button class="close-btn" @click="cancelDelete">×</button>
        </div>
        <div class="dialog-body">
          <p>确定要删除知识图谱 "{{ graphToDelete?.title }}" 吗？</p>
          <p class="warning-text">此操作不可逆，删除后数据无法恢复。</p>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="cancelDelete">取消</button>
          <button class="btn-delete" @click="deleteGraphConfirmed" :disabled="isDeleting">
            <span v-if="isDeleting" class="spinner-sm"></span>
            <span>{{ isDeleting ? '删除中...' : '确认删除' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineEmits } from 'vue';
import { getKnowledgeGraphList, createKnowledgeGraph, updateKnowledgeGraph, deleteKnowledgeGraph } from '@/api/graph';
import { useRouter } from 'vue-router';

const graphs = ref([]);
const searchQuery = ref('');
const isLoading = ref(true);
const router = useRouter();

const emit = defineEmits(['select-graph']);

// 对话框状态
const showGraphDialog = ref(false);
const isEditing = ref(false);
const editingGraph = ref({
  title: '',
  description: ''
});
const validation = ref({});
const isSaving = ref(false);

// 删除确认状态
const showDeleteConfirm = ref(false);
const graphToDelete = ref(null);
const isDeleting = ref(false);

// 过滤后的图谱列表
const filteredGraphs = computed(() => {
  if (!searchQuery.value.trim()) return graphs.value;
  
  const query = searchQuery.value.toLowerCase();
  return graphs.value.filter(graph => 
    graph.title.toLowerCase().includes(query) || 
    (graph.description && graph.description.toLowerCase().includes(query))
  );
});

// 获取图谱列表
const fetchGraphs = async () => {
  isLoading.value = true;
  try {
    const data = await getKnowledgeGraphList();
    
    // 添加数据结构检查
    if (data && data.rows && Array.isArray(data.rows)) {
      graphs.value = data.rows.map(course => ({
        id: course.id,
        title: course.name,
        description: course.content,
        updatedAt: course.updateTime || new Date().toISOString(),
        nodeCount: course.nodeCount || 0
      }));
    } else if (data && Array.isArray(data)) {
      // 如果直接返回数组
      graphs.value = data.map(course => ({
        id: course.id,
        title: course.name || course.title,
        description: course.content || course.description,
        updatedAt: course.updateTime || course.updatedAt || new Date().toISOString(),
        nodeCount: course.nodeCount || 0
      }));
    } else {
      console.warn('API返回的数据格式不符合预期:', data);
      graphs.value = [];
    }
  } catch (error) {
    console.error('获取图谱列表失败:', error);
    graphs.value = [];
  } finally {
    isLoading.value = false;
  }
};

// 选择图谱
const selectGraph = (graph) => {
  if (graph && graph.id) {
    emit('select-graph', graph);
  }
};

// 导航到图谱视图
const navigateToGraphView = (graph) => {
  if (graph && graph.id) {
    router.push({ name: 'course-graph', params: { id: graph.id } });
  }
};

// 打开创建图谱对话框
const openCreateGraphDialog = () => {
  isEditing.value = false;
  editingGraph.value = {
    title: '',
    description: ''
  };
  validation.value = {};
  showGraphDialog.value = true;
};

// 打开编辑图谱对话框
const editGraph = (graph) => {
  isEditing.value = true;
  editingGraph.value = {
    id: graph.id,
    title: graph.title || '',
    description: graph.description || ''
  };
  validation.value = {};
  showGraphDialog.value = true;
};

// 关闭对话框
const closeGraphDialog = () => {
  showGraphDialog.value = false;
};

// 验证表单
const validateForm = () => {
  const errors = {};
  
  if (!editingGraph.value.title.trim()) {
    errors.title = '知识图谱标题不能为空';
  }
  
  validation.value = errors;
  return Object.keys(errors).length === 0;
};

// 保存图谱
const saveGraph = async () => {
  if (!validateForm()) {
    return;
  }
  
  isSaving.value = true;
  
  try {
    let response;
    
    if (isEditing.value) {
      // 更新现有图谱
              response = await updateKnowledgeGraph({
        name: editingGraph.value.title,
        content: editingGraph.value.description,
        id: editingGraph.value.id
      });
      
      // 更新本地数据
      const index = graphs.value.findIndex(g => g.id === editingGraph.value.id);
      if (index !== -1) {
        graphs.value[index] = {
          ...graphs.value[index],
          title: editingGraph.value.title,
          description: editingGraph.value.description,
          updatedAt: new Date().toISOString()
        };
      }
    } else {
      // 关闭对话框先（让用户看到响应）
      closeGraphDialog();
      
      // 创建新图谱
              response = await createKnowledgeGraph({
        name: editingGraph.value.title,
        content: editingGraph.value.description
      });
      
      console.log('创建图谱成功:', response);
      
      // 直接刷新整个列表而不是手动添加
      await fetchGraphs();
    }
    
    // 编辑模式下才在这里关闭对话框
    if (isEditing.value) {
      closeGraphDialog();
    }
  } catch (error) {
    console.error('保存知识图谱失败:', error);
    alert('保存知识图谱时出错，请重试');
  } finally {
    isSaving.value = false;
  }
};

// 确认删除图谱
const confirmDeleteGraph = (graph) => {
  graphToDelete.value = graph;
  showDeleteConfirm.value = true;
};

// 取消删除
const cancelDelete = () => {
  showDeleteConfirm.value = false;
  graphToDelete.value = null;
};

// 确认删除
const deleteGraphConfirmed = async () => {
  if (!graphToDelete.value || !graphToDelete.value.id) {
    return;
  }
  
  isDeleting.value = true;
  
  try {
          await deleteKnowledgeGraph(graphToDelete.value.id);
    
    // 从本地数据中移除
    graphs.value = graphs.value.filter(g => g.id !== graphToDelete.value.id);
    
    showDeleteConfirm.value = false;
    graphToDelete.value = null;
  } catch (error) {
    console.error('删除知识图谱失败:', error);
    alert('删除知识图谱时出错，请重试');
  } finally {
    isDeleting.value = false;
  }
};

// 搜索过滤
const filterGraphs = () => {
  console.log('过滤图谱，关键词:', searchQuery.value);
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知时间';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (e) {
    return '未知时间';
  }
};

onMounted(() => {
  fetchGraphs();
});
</script>

<style scoped>
.graph-list {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.search-container {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.search-box {
  position: relative;
  max-width: 400px;
  flex: 1;
}

.search-box input {
  width: 100%;
  padding: 10px 15px 10px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236b7280'%3E%3Cpath d='M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  opacity: 0.5;
}

.graph-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.graph-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: pointer;
}

.graph-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
}

.graph-icon {
  background: linear-gradient(135deg, #4f46e5, #3b82f6);
  color: white;
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.graph-info {
  padding: 16px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.graph-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.3;
}

.graph-details {
  margin: 0 0 16px;
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.graph-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
}

.graph-actions-bar {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.graph-card:hover .graph-actions-bar {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  background-color: rgba(255, 255, 255, 0.9);
  color: #64748b;
}

.action-btn:hover {
  background-color: #fff;
}

.edit-btn:hover {
  color: #3b82f6;
}

.delete-btn:hover {
  color: #ef4444;
}

.graph-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.btn-create {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  background-color: var(--primary-color, #007AFF);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-create:hover {
  background-color: var(--primary-color-dark, #0062CC);
}

.btn-icon {
  font-size: 20px;
  margin-right: 8px;
  font-weight: 700;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  width: 100%;
  max-width: 500px;
  background-color: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.dialog-body {
  padding: 20px;
}

.dialog-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-color);
}

.form-group input, .form-group textarea {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background-color: white;
  color: var(--text-color);
}

.form-group input:focus, .form-group textarea:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}

.form-group input.has-error, .form-group textarea.has-error {
  border-color: var(--error-color, #FF3B30);
}

.error-message {
  color: var(--error-color, #FF3B30);
  font-size: 14px;
  margin: 4px 0 0;
}

.btn-cancel, .btn-save, .btn-delete {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background-color: transparent;
  color: var(--text-color);
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.btn-cancel:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.btn-save {
  background-color: var(--primary-color, #007AFF);
  color: white;
  border: none;
  display: flex;
  align-items: center;
}

.btn-save:hover {
  background-color: var(--primary-color-dark, #0062CC);
}

.btn-save:disabled {
  background-color: var(--primary-color, #007AFF);
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-delete {
  background-color: var(--error-color, #FF3B30);
  color: white;
  border: none;
  display: flex;
  align-items: center;
}

.btn-delete:hover {
  background-color: #E0352B;
}

.btn-delete:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.warning-text {
  color: var(--error-color, #FF3B30);
  font-size: 14px;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .graph-card {
    background-color: #1C1C1E;
    border-color: rgba(255, 255, 255, 0.08);
  }
  
  .dialog-content {
    background-color: #1C1C1E;
  }
  
  .dialog-header, .dialog-footer {
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .form-group input, .form-group textarea {
    background-color: #2C2C2E;
    border-color: rgba(255, 255, 255, 0.15);
    color: white;
  }
  
  .btn-cancel {
    border-color: rgba(255, 255, 255, 0.15);
    color: white;
  }
  
  .btn-cancel:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .close-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .graph-grid {
    grid-template-columns: 1fr;
  }
  
  .graph-list {
    padding: 1rem;
  }
}
</style> 