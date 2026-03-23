<template>
  <div class="my-graphs">
    <!-- 过滤和排序工具栏 -->
    <div class="toolbar">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索知识图谱..." 
          class="search-input"
          @input="filterGraphs"
        />
        <i class="fas fa-search search-icon"></i>
      </div>
      
      <div class="filter-sort">
        <div class="filter-group">
          <label class="filter-label">排序:</label>
          <select v-model="sortOption" class="filter-select" @change="filterGraphs">
            <option value="recent">最近更新</option>
            <option value="name">名称</option>
            <option value="nodes">知识点数量</option>
            <option value="progress">学习进度</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- 创建新知识图谱按钮 (仅教师可见) -->
    <div v-if="isTeacher" class="create-graph">
      <button class="btn btn-primary create-btn" @click="showCreateDialog = true">
        <i class="fas fa-plus"></i> 创建新知识图谱
      </button>
    </div>
    
    <!-- 知识图谱列表 -->
    <div class="graph-grid">
      <div 
        v-for="graph in filteredGraphs" 
        :key="graph.id" 
        class="graph-card"
        @click="selectGraph(graph)"
      >
        <div class="graph-preview">
          <div class="preview-placeholder">
            <i class="fas fa-project-diagram"></i>
          </div>
          <div v-if="!isTeacher && graph.progress !== undefined" class="progress-indicator">
            <div 
              class="progress-bar"
              :style="{ width: `${graph.progress}%` }"
            ></div>
            <span class="progress-text">{{ graph.progress }}% 已学习</span>
          </div>
          <div class="graph-card-actions">
            <button 
              class="card-action-btn view-btn" 
              title="查看"
              @click.stop="viewGraph(graph)"
            >
              <i class="fas fa-eye"></i>
            </button>
            <button 
              v-if="isTeacher"
              class="card-action-btn edit-btn" 
              title="编辑"
              @click.stop="openEditDialog(graph)"
            >
              <i class="fas fa-edit"></i>
            </button>
            <button 
              v-if="isTeacher"
              class="card-action-btn delete-btn" 
              title="删除"
              @click.stop="confirmDelete(graph)"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        <div class="graph-content">
          <div class="graph-header">
            <h3 class="graph-title">{{ graph.title }}</h3>
            <span class="graph-category">{{ getCategoryName(graph.category) }}</span>
          </div>
          
          <p class="graph-description">{{ graph.description || '无描述' }}</p>
          
          <div class="graph-meta">
            <span class="meta-item">
              <i class="fas fa-calendar-alt"></i>
              {{ formatDate(graph.updatedAt) }}
            </span>
            <span class="meta-item">
              <i class="fas fa-sitemap"></i>
              {{ graph.nodeCount || '未知' }} 个节点
            </span>
          </div>
          
          <div class="graph-actions">
            <button 
              class="btn btn-sm btn-icon btn-favorite" 
              :class="{ active: graph.favorite }"
              @click.stop="toggleFavorite(graph)"
              :title="graph.favorite ? '取消收藏' : '收藏'"
            >
              <i :class="graph.favorite ? 'fas fa-star' : 'far fa-star'"></i>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 空状态提示 -->
      <div v-if="filteredGraphs.length === 0" class="empty-state">
        <i class="fas fa-project-diagram empty-icon"></i>
        <h3 class="empty-title">暂无知识图谱</h3>
        <p class="empty-description">
          {{ isTeacher ? '点击"创建新知识图谱"按钮开始构建您的第一个知识图谱。' : '您目前没有任何学习中的知识图谱。' }}
        </p>
        <button 
          v-if="isTeacher" 
          class="btn btn-primary" 
          @click="showCreateDialog = true"
        >
          <i class="fas fa-plus"></i> 创建新知识图谱
        </button>
      </div>
    </div>
    
    <!-- 创建知识图谱对话框 -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click="showCreateDialog = false">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">创建新知识图谱</h3>
          <button class="dialog-close" @click="showCreateDialog = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">知识图谱标题</label>
            <input type="text" v-model="newGraph.title" class="form-input" placeholder="输入知识图谱标题" />
          </div>
          
          <div class="form-group">
            <label class="form-label">分类</label>
            <select v-model="newGraph.category" class="form-select">
              <option value="civil">土木工程</option>
              <option value="architecture">建筑学</option>
              <option value="mechanics">力学</option>
              <option value="materials">材料学</option>
              <option value="management">工程管理</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">知识图谱描述</label>
            <textarea 
              v-model="newGraph.description" 
              class="form-textarea" 
              placeholder="输入知识图谱描述"
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div class="dialog-footer">
          <button class="btn btn-cancel" @click="showCreateDialog = false">取消</button>
          <button class="btn-save" @click="clickCreateGraph" :disabled="!isFormValid">保存</button>
          <button id="refreshBtn" style="display: none;" onclick="window.location.reload()">刷新</button>
        </div>
      </div>
    </div>
    
    <!-- 编辑知识图谱对话框 -->
    <div v-if="showEditDialog" class="dialog-overlay" @click="showEditDialog = false">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">编辑知识图谱</h3>
          <button class="dialog-close" @click="showEditDialog = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">知识图谱标题</label>
            <input type="text" v-model="editGraph.title" class="form-input" placeholder="输入知识图谱标题" />
          </div>
          
          <div class="form-group">
            <label class="form-label">分类</label>
            <select v-model="editGraph.category" class="form-select">
              <option value="civil">土木工程</option>
              <option value="architecture">建筑学</option>
              <option value="mechanics">力学</option>
              <option value="materials">材料学</option>
              <option value="management">工程管理</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">知识图谱描述</label>
            <textarea 
              v-model="editGraph.description" 
              class="form-textarea" 
              placeholder="输入知识图谱描述"
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div class="dialog-footer">
          <button class="btn btn-cancel" @click="showEditDialog = false">取消</button>
          <button class="btn-save" @click="submitEditGraph" :disabled="!isEditFormValid">保存</button>
        </div>
      </div>
    </div>
    
    <!-- 删除确认对话框 -->
    <div v-if="showDeleteDialog" class="dialog-overlay" @click="showDeleteDialog = false">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">确认删除</h3>
          <button class="dialog-close" @click="showDeleteDialog = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="dialog-body">
          <p class="confirm-message">
            确定要删除知识图谱"{{ graphToDelete?.title }}"吗？此操作无法撤销。
          </p>
        </div>
        
        <div class="dialog-footer">
          <button class="btn btn-outline" @click="showDeleteDialog = false">取消</button>
          <button class="btn btn-danger" @click="deleteGraph">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';

import { createGraph, updateGraph, deleteGraph as apiDeleteGraph, getGraphList } from '@/api/graph';

// 接收props
const props = defineProps({
  isTeacher: {
    type: Boolean,
    default: false
  }
});

// 知识图谱数据
const graphs = ref([]);
const filteredGraphs = ref([]);

// 搜索和过滤状态
const searchQuery = ref('');
const sortOption = ref('recent');

// 对话框状态
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const graphToDelete = ref(null);

// 新知识图谱表单
const newGraph = ref({
  title: '',
  category: 'civil',
  description: ''
});

// 编辑知识图谱表单
const editGraph = ref({
  id: null,
  title: '',
  category: 'civil',
  description: ''
});

// 表单验证
const isFormValid = computed(() => {
  return newGraph.value.title.trim() !== '';
});

// 编辑表单验证
const isEditFormValid = computed(() => {
  return editGraph.value.title.trim() !== '';
});

// 获取分类名称
const getCategoryName = (category) => {
  const categories = {
    'civil': '土木工程',
    'architecture': '建筑学',
    'mechanics': '力学',
    'materials': '材料学',
    'management': '工程管理'
  };
  return categories[category] || '其他';
};

// 格式化日期
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 过滤和排序知识图谱
const filterGraphs = () => {
  // 首先应用搜索过滤
  let result = graphs.value;
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(graph => {
      return graph.title.toLowerCase().includes(query) || 
             (graph.description && graph.description.toLowerCase().includes(query));
    });
  }
  
  // 然后应用排序
  result.sort((a, b) => {
    switch (sortOption.value) {
      case 'name':
        return a.title.localeCompare(b.title);
      case 'nodes':
        return (b.nodeCount || 0) - (a.nodeCount || 0);
      case 'progress':
        return (b.progress || 0) - (a.progress || 0);
      case 'recent':
      default:
        // 最近更新时间排序
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
    }
  });
  
  filteredGraphs.value = result;
};

// 切换收藏状态
const toggleFavorite = (graph) => {
  graph.favorite = !graph.favorite;
  // TODO: 调用API更新收藏状态
  console.log(`${graph.favorite ? '收藏' : '取消收藏'}知识图谱:`, graph.id);
};

// 确认删除
const confirmDelete = (graph) => {
  graphToDelete.value = graph;
  showDeleteDialog.value = true;
};

// 删除知识图谱
const deleteGraph = async () => {
  if (!graphToDelete.value) return;
  
  try {
    // 调用API删除知识图谱
    console.log('删除知识图谱:', graphToDelete.value.id);
    await apiDeleteGraph(graphToDelete.value.id);
    
    // 从列表中移除
    graphs.value = graphs.value.filter(g => g.id !== graphToDelete.value.id);
    filterGraphs(); // 重新过滤
    
    showDeleteDialog.value = false;
    graphToDelete.value = null;
  } catch (error) {
    console.error('删除知识图谱失败:', error);
  }
};

// 创建知识图谱
const clickCreateGraph = async () => {
  if (!isFormValid.value) return;
  
  console.log('开始创建知识图谱，表单数据:', newGraph.value);
  
  try {
    // 调用API创建知识图谱
    var graphData = {
      name: newGraph.value.title,
      content: newGraph.value.description,
      category: newGraph.value.category
    }
    
    // 创建图谱，假设API成功后返回新创建的图谱对象
    const createdGraph = await createGraph(graphData);
    console.log('创建图谱响应:', createdGraph);
    
    // 将返回的新图谱数据转换为本地格式
    const newGraphForList = {
      id: createdGraph.id,
      title: createdGraph.name || '',
      description: createdGraph.content || '',
      category: createdGraph.category || 'civil',
      nodeCount: createdGraph.nodeCount || 0,
      updatedAt: createdGraph.updateTime || new Date().toISOString(),
      favorite: createdGraph.favorite || false,
      author: createdGraph.author || '当前用户',
      progress: props.isTeacher ? undefined : (createdGraph.progress || 0)
    };

    // 将新图谱添加到列表顶部
    graphs.value.unshift(newGraphForList);
    filterGraphs(); // 重新应用过滤和排序
    
    // 先关闭对话框
    showCreateDialog.value = false;
    
    // 重置表单
    newGraph.value = {
      title: '',
      category: 'civil',
      description: ''
    };
  } catch (error) {
    console.error('创建知识图谱失败:', error);
    // 发生错误时也需要显示提示
    alert("创建知识图谱失败，请重试");
  }
};

// 加载知识图谱数据
const loadGraphs = async () => {
  try {
    // 从API获取数据
    const response = await getGraphList();
    console.log('获取知识图谱列表:', response);
    
    if (response && response.rows && Array.isArray(response.rows)) {
      // 转换API数据格式
      graphs.value = response.rows.map(graph => ({
        id: graph.id,
        title: graph.name || graph.title,
        description: graph.content || graph.description,
        category: graph.category || 'civil',
        nodeCount: graph.nodeCount || 0,
        updatedAt: graph.updateTime || graph.updatedAt || new Date().toISOString(),
        favorite: graph.favorite || false,
        author: graph.author || '当前用户',
        // 学生可能有的学习进度
        progress: props.isTeacher ? undefined : (graph.progress || 0)
      }));
    } else {
      // 如果API数据不可用，使用模拟数据
      console.warn('使用模拟数据');
      const currentDate = new Date();
      
      if (props.isTeacher) {
        // 教师创建的知识图谱
        graphs.value = [
          {
            id: 1,
            title: '土木工程概论知识图谱',
            description: '涵盖土木工程的基本概念、历史发展和主要分支',
            category: 'civil',
            nodeCount: 45,
            updatedAt: new Date(currentDate - 2 * 24 * 60 * 60 * 1000).toISOString(),
            favorite: true,
            author: '当前用户'
          },
          // 其他模拟数据...
        ];
      } else {
        // 学生学习的知识图谱
        graphs.value = [
          {
            id: 1,
            title: '土木工程概论知识图谱',
            description: '涵盖土木工程的基本概念、历史发展和主要分支',
            category: 'civil',
            nodeCount: 45,
            updatedAt: new Date(currentDate - 1 * 24 * 60 * 60 * 1000).toISOString(),
            progress: 75,
            favorite: true,
            author: '张教授'
          },
          // 其他模拟数据...
        ];
      }
    }
    
    // 应用过滤
    filterGraphs();
  } catch (error) {
    console.error('加载知识图谱失败:', error);
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadGraphs();
});

// 添加emit定义
const emit = defineEmits(['select-graph', 'view-outline']);

// 选择图谱
const selectGraph = (graph) => {
  emit('select-graph', graph);
};

// 查看图谱
const viewGraph = (graph) => {
  emit('select-graph', { ...graph, mode: 'view' });
};

// 查看大纲
const viewOutline = (graph) => {
  emit('view-outline', graph);
};

// 打开编辑对话框
const openEditDialog = (graph) => {
  editGraph.value = {
    id: graph.id,
    title: graph.title || '',
    category: graph.category || 'civil',
    description: graph.description || ''
  };
  console.log('编辑图谱数据:', editGraph.value);
  showEditDialog.value = true;
};

// 提交编辑
const submitEditGraph = async () => {
  if (!isEditFormValid.value) return;
  
  try {
    // 调用API更新知识图谱
    const graphData = {
      name: editGraph.value.title,
      content: editGraph.value.description,
      id: editGraph.value.id
    };
    
    const updatedGraph = await updateGraph(graphData);
    
    // 更新本地数据
    const index = graphs.value.findIndex(g => g.id === editGraph.value.id);
    if (index !== -1) {
      graphs.value[index] = {
        ...graphs.value[index],
        title: editGraph.value.title,
        description: editGraph.value.description,
        category: editGraph.value.category,
        updatedAt: new Date().toISOString()
      };
      filterGraphs(); // 重新过滤
    }
    
    // 关闭对话框
    showEditDialog.value = false;
  } catch (error) {
    console.error('更新知识图谱失败:', error);
    alert('更新知识图谱失败，请重试');
  }
};

// 编辑图谱 - 修改方法，重定向到知识图谱编辑页面
const navigateToGraph = (graph) => {
  emit('select-graph', graph);
};
</script>

<style scoped>
.my-graphs {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-full);
  font-size: 0.875rem;
  background-color: var(--background-color);
  color: var(--text-color);
  transition: all var(--transition-normal);
}

.search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-light);
  outline: none;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-color-secondary);
  pointer-events: none;
}

.filter-sort {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 0.875rem;
  background-color: var(--background-color);
  color: var(--text-color);
}

.create-graph {
  display: flex;
  justify-content: flex-end;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.graph-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.graph-card {
  background-color: var(--background-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.graph-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.graph-preview {
  height: 100px;
  background-color: var(--background-color-secondary);
  overflow: hidden;
  position: relative;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  background-color: var(--background-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: var(--text-color-secondary);
}

.preview-placeholder i {
  font-size: 2.5rem;
  color: var(--text-color-secondary);
}

/* 修改卡片操作按钮，移除router-link */
.graph-card-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity var(--transition-normal);
  z-index: 5;
}

.graph-card:hover .graph-card-actions {
  opacity: 1;
}

.card-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  color: white;
  font-size: 0.875rem;
  transition: transform var(--transition-normal), background-color var(--transition-normal);
}

.card-action-btn:hover {
  transform: scale(1.1);
}

.edit-btn {
  background-color: var(--primary-color);
}

.edit-btn:hover {
  background-color: var(--primary-color-dark);
}

.view-btn {
  background-color: var(--info-color, #3498db);
}

.view-btn:hover {
  background-color: var(--info-color-dark, #2980b9);
}

.delete-btn {
  background-color: var(--danger-color);
}

.delete-btn:hover {
  background-color: var(--danger-color-dark);
}

.progress-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 24px;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
}

.progress-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background-color: var(--primary-color);
  opacity: 0.7;
  z-index: 1;
}

.progress-text {
  position: relative;
  z-index: 2;
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
}

.graph-content {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.graph-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
  flex: 1;
}

.graph-category {
  font-size: 0.75rem;
  background-color: var(--primary-color-light);
  color: var(--primary-color);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-full);
  white-space: nowrap;
  margin-left: 0.5rem;
}

.graph-description {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin: 0 0 0.75rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.graph-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.75rem;
  color: var(--text-color-tertiary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.graph-actions {
  display: flex;
  gap: 0.375rem;
  margin-top: auto;
}

.btn-sm {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
}

.btn-icon {
  width: 24px;
  height: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-favorite {
  color: #f59e0b;
}

.btn-danger {
  background-color: var(--danger-color);
  color: white;
}

.btn-danger:hover {
  background-color: var(--danger-color-dark);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.empty-description {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin: 0 0 1.5rem 0;
  max-width: 400px;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background-color: var(--background-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}

.dialog-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 0.25rem;
  transition: color var(--transition-normal);
}

.dialog-close:hover {
  color: var(--text-color);
}

.dialog-body {
  padding: 1.5rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
}

/* 表单样式 */
.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 0.875rem;
  background-color: var(--background-color);
  color: var(--text-color);
  transition: all var(--transition-normal);
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-light);
  outline: none;
}

.confirm-message {
  font-size: 1rem;
  color: var(--text-color);
  margin: 0;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
  
  .filter-sort {
    justify-content: space-between;
  }
  
  .graph-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}

/* 保存按钮样式 */
.btn-save {
  background-color: var(--primary-color, #4caf50);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-save:hover {
  background-color: var(--primary-color-dark, #388e3c);
}

.btn-save:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-cancel {
  background-color: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-cancel:hover {
  background-color: var(--background-color-secondary);
}
</style>