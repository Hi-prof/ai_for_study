<template>
  <div class="my-outline-list">
    <!-- 过滤和排序工具栏 -->
    <div class="toolbar">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索大纲..." 
          class="search-input"
          @input="filterOutlines"
        />
        <i class="fas fa-search search-icon"></i>
      </div>
      
      <button class="btn-create-outline" @click="showCreateDialog = true">
        <span class="btn-icon">+</span>
        <span>创建新知识图谱</span>
      </button>
      
      <div class="filter-sort">
        <div class="filter-group">
          <label class="filter-label">排序:</label>
          <select v-model="sortOption" class="filter-select" @change="filterOutlines">
            <option value="recent">最近更新</option>
            <option value="name">名称</option>
            <option value="nodes">节点数量</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- 创建新大纲按钮 (仅教师可见) -->
    <div v-if="isTeacher" class="create-outline">
      <button class="btn btn-primary create-btn" @click="showCreateDialog = true">
        <i class="fas fa-plus"></i> 创建新大纲
      </button>
    </div>
    
    <!-- 大纲列表 -->
    <div class="outline-grid">
      <div 
        v-for="outline in filteredOutlines" 
        :key="outline.id" 
        class="outline-card"
        @click="selectOutline(outline)"
      >
        <div class="outline-preview">
          <div class="preview-placeholder">
            <i class="fas fa-list-alt"></i>
          </div>
          <div class="outline-card-actions">
            <button 
              class="card-action-btn view-btn" 
              title="查看"
              @click.stop="viewOutline(outline)"
            >
              <i class="fas fa-eye"></i>
            </button>
            <button 
              v-if="isTeacher"
              class="card-action-btn edit-btn" 
              title="编辑"
              @click.stop="openEditDialog(outline)"
            >
              <i class="fas fa-edit"></i>
            </button>
            <button 
              v-if="isTeacher"
              class="card-action-btn delete-btn" 
              title="删除"
              @click.stop="confirmDelete(outline)"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        <div class="outline-content">
          <div class="outline-header">
            <div class="title-with-edit">
              <h3 class="outline-title">{{ outline.title }}</h3>
              <button 
                class="outline-action-btn edit-btn" 
                title="修改"
                @click.stop="openEditDialog(outline)"
              >
                <i class="fas fa-edit"></i>
              </button>
            </div>
            <div class="outline-actions">
              <button 
                class="outline-action-btn delete-btn" 
                title="删除"
                @click.stop="confirmDelete(outline)"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          
          <p class="outline-description">{{ outline.description || '无描述' }}</p>
          
          <div class="outline-meta">
                <span class="meta-item">
      <i class="fas fa-sitemap"></i>
      {{ outline.nodeCount ?? 0 }} 个知识点
    </span>
            <span class="meta-item">
              <i class="fas fa-calendar-alt"></i>
              {{ formatDate(outline.updatedAt) }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- 空状态提示 -->
      <div v-if="filteredOutlines.length === 0" class="empty-state">
        <i class="fas fa-list-alt empty-icon"></i>
        <h3 class="empty-title">暂无大纲</h3>
        <p class="empty-description">
          {{ isTeacher ? '点击"创建新大纲"按钮开始构建您的第一个大纲。' : '您目前没有任何学习中的大纲。' }}
        </p>
        <button 
          v-if="isTeacher" 
          class="btn btn-primary" 
          @click="showCreateDialog = true"
        >
          <i class="fas fa-plus"></i> 创建新大纲
        </button>
      </div>
    </div>
    
    <!-- 创建大纲对话框 -->
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
            <label class="form-label">知识图谱名称</label>
            <input type="text" v-model="newOutline.name" class="form-input" placeholder="输入知识图谱名称" />
          </div>
          
          <div class="form-group">
            <label class="form-label">知识图谱描述</label>
            <textarea 
              v-model="newOutline.content" 
              class="form-textarea" 
              placeholder="输入知识图谱描述"
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div class="dialog-footer">
          <button class="btn btn-cancel" @click="showCreateDialog = false">取消</button>
          <button type="button" class="btn-save" @click="createOutline()" :disabled="!isFormValid">保存</button>
        </div>
      </div>
    </div>
    
    <!-- 确认删除对话框 -->
    <div v-if="showDeleteDialog" class="dialog-overlay" @click="showDeleteDialog = false">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">确认删除</h3>
          <button class="dialog-close" @click="showDeleteDialog = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="dialog-body">
          <p>确定要删除大纲 "{{ outlineToDelete?.title }}" 吗？</p>
          <p class="warning-text">此操作不可逆，删除后数据无法恢复。</p>
        </div>
        
        <div class="dialog-footer">
          <button class="btn btn-cancel" @click="showDeleteDialog = false">取消</button>
          <button class="btn btn-danger" @click="deleteOutline">确认删除</button>
        </div>
      </div>
    </div>
    
    <!-- 编辑大纲对话框 -->
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
            <label class="form-label">知识图谱名称</label>
            <input type="text" v-model="newOutline.name" class="form-input" placeholder="输入知识图谱名称" />
          </div>
          
          <div class="form-group">
            <label class="form-label">知识图谱描述</label>
            <textarea 
              v-model="newOutline.content" 
              class="form-textarea" 
              placeholder="输入知识图谱描述"
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div class="dialog-footer">
          <button class="btn btn-cancel" @click="showEditDialog = false">取消</button>
          <button type="button" class="btn-save" @click="updateOutline()" :disabled="!isFormValid">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getKnowledgeGraphList, createKnowledgeGraph, updateKnowledgeGraph, deleteKnowledgeGraph } from '@/api/graph';
import { getCurrentUser } from '@/api/auth';

const router = useRouter();
const emit = defineEmits(['select-outline']);

// 用户角色判断
const currentUser = ref(getCurrentUser() || {});
const isTeacher = computed(() => currentUser.value.role === 'teacher');

// 大纲列表数据
const outlines = ref([]);
const searchQuery = ref('');
const sortOption = ref('recent');
const isLoading = ref(true);

// 对话框状态
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const outlineToDelete = ref(null);

// 新大纲表单
const newOutline = ref({
  name: '',
  content: '',
  nodeCount: 0
});

// 表单验证
const isFormValid = computed(() => {
  return newOutline.value.name.trim() !== '';
});

// 过滤和排序后的大纲列表
const filteredOutlines = computed(() => {
  // 先根据搜索词过滤
  let filtered = outlines.value.filter(outline => {
    const matchesSearch = searchQuery.value === '' || 
      outline.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (outline.description && outline.description.toLowerCase().includes(searchQuery.value.toLowerCase()));
    
    return matchesSearch;
  });
  
  // 然后排序
  return filtered.sort((a, b) => {
    if (sortOption.value === 'name') {
      return a.title.localeCompare(b.title);
    } else if (sortOption.value === 'nodes') {
      const aCount = a.nodeCount || 0;
      const bCount = b.nodeCount || 0;
      return bCount - aCount;
    } else {
      // 默认按最近更新排序
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    }
  });
});

// 获取大纲列表
const fetchOutlines = async () => {
  isLoading.value = true;
  try {
    // 从API获取数据
    const response = await getKnowledgeGraphList();
    console.log('获取大纲列表:', response);
    
    if (response && response.rows && Array.isArray(response.rows)) {
      // 转换API数据格式，确保与知识图谱格式一致
      outlines.value = response.rows.map(outline => ({
        id: outline.id,
        title: outline.name || outline.title || '未命名大纲',
        description: outline.content || outline.description || '无描述',
        category: outline.category || 'civil',
        nodeCount: outline.nodeCount || 0,
        updatedAt: outline.updateTime || outline.updatedAt || new Date().toISOString(),
        favorite: outline.favorite || false,
        author: outline.author || '当前用户'
      }));
    } else {
      // 如果API数据不可用，使用模拟数据
      console.warn('使用模拟数据');
      const currentDate = new Date();
      
      outlines.value = [
        {
          id: 1,
          title: '土木工程概论大纲',
          description: '涵盖土木工程的基本概念、历史发展和主要分支',
          category: 'civil',
          nodeCount: 45,
          updatedAt: new Date(currentDate - 2 * 24 * 60 * 60 * 1000).toISOString(),
          favorite: true,
          author: '当前用户'
        },
        {
          id: 2,
          title: '建筑结构设计大纲',
          description: '建筑结构设计的基本原理和方法',
          category: 'architecture',
          nodeCount: 32,
          updatedAt: new Date(currentDate - 4 * 24 * 60 * 60 * 1000).toISOString(),
          favorite: false,
          author: '当前用户'
        }
      ];
    }
    
    // 应用过滤
    filterOutlines();
  } catch (error) {
    console.error('加载大纲列表失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 选择大纲
const selectOutline = (outline) => {
  emit('select-outline', outline);
  router.push(`/outline-edit/${outline.id}`);
};

// 查看大纲
const viewOutline = (outline) => {
  router.push(`/outline/${outline.id}`);
};

// 打开编辑对话框
const openEditDialog = (outline) => {
  newOutline.value = { 
    id: outline.id,
    name: outline.title || outline.name,
    content: outline.description || outline.content,
  };
  showEditDialog.value = true;
};

// 确认删除
const confirmDelete = (outline) => {
  outlineToDelete.value = outline;
  showDeleteDialog.value = true;
};

// 创建大纲
const createOutline = async () => {
  if (!isFormValid.value) return;
  
  try {
    console.log('提交创建知识图谱请求:', newOutline.value);
    
    // 强制关闭弹窗并重置表单
    showCreateDialog.value = false;
    
    // 调用API创建知识图谱
            createKnowledgeGraph({
      name: newOutline.value.name,
      content: newOutline.value.content,
      nodeCount: 0
    }).then(result => {
      console.log('创建成功:', result);
      
      // 刷新列表
      fetchOutlines();
      
      // 重置表单
      newOutline.value = {
        name: '',
        content: '',
        nodeCount: 0
      };
    }).catch(error => {
      console.error('API错误:', error);
    });
  } catch (error) {
    console.error('创建知识图谱失败:', error);
  }
};

// 删除大纲
const deleteOutline = async () => {
  if (!outlineToDelete.value) return;
  
  try {
          await deleteKnowledgeGraph(outlineToDelete.value.id);
    outlines.value = outlines.value.filter(o => o.id !== outlineToDelete.value.id);
    showDeleteDialog.value = false;
    outlineToDelete.value = null;
  } catch (error) {
    console.error('删除大纲失败:', error);
  }
};

// 切换收藏状态
const toggleFavorite = (outline) => {
  outline.favorite = !outline.favorite;
  // TODO: 调用API保存收藏状态
};

// Category functionality has been removed

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

// 过滤大纲
const filterOutlines = () => {
  // 过滤逻辑已经在计算属性中实现
  console.log('过滤大纲, 搜索词:', searchQuery.value, '排序:', sortOption.value);
};

// 更新大纲
const updateOutline = async () => {
  if (!isFormValid.value) return;
  
  try {
    console.log('提交更新知识图谱请求:', newOutline.value);
    
    // 强制关闭弹窗
    showEditDialog.value = false;
    
    // 调用API更新知识图谱
          await updateKnowledgeGraph({
      id: newOutline.value.id,
      name: newOutline.value.name,
      content: newOutline.value.content,
    });
    
    // 刷新列表
    fetchOutlines();
    
  } catch (error) {
    console.error('更新知识图谱失败:', error);
  }
};

onMounted(() => {
  fetchOutlines();
});
</script>

<style scoped>
.my-outline-list {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow-y: auto;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 300px;
}

.search-input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid var(--border-color, #e0e0e0);
  font-size: 0.875rem;
  background-color: var(--background-color, #f8f9fa);
  outline: none;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: var(--primary-color, #4a89dc);
  box-shadow: 0 0 0 2px rgba(74, 137, 220, 0.2);
}

.search-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary, #999);
  font-size: 0.875rem;
}

.filter-sort {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  color: var(--text-secondary, #666);
}

.filter-select {
  padding: 0.375rem 0.75rem;
  border-radius: 4px;
  border: 1px solid var(--border-color, #e0e0e0);
  font-size: 0.875rem;
  background-color: var(--background-color, #f8f9fa);
  outline: none;
  transition: all 0.2s ease;
}

.filter-select:focus {
  border-color: var(--primary-color, #4a89dc);
}

.btn-create-outline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background-color: #1a73e8; /* Google blue */
  color: white;
  border: none;
  padding: 0.625rem 1.5rem;
  border-radius: 24px; /* More rounded like Google buttons */
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15); /* Google's elevation */
  letter-spacing: 0.25px;
  text-transform: none;
}

.btn-create-outline:hover {
  background-color: #1765cc; /* Darker blue on hover */
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
}

.btn-create-outline:active {
  background-color: #185abc;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
}

.btn-icon {
  font-size: 1.125rem;
  font-weight: normal;
}

.create-outline {
  margin-bottom: 1rem;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--primary-color, #4a89dc);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-btn:hover {
  background-color: var(--primary-dark, #3a79cc);
}

.outline-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.outline-card {
  background-color: var(--card-bg, white);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  border: 1px solid var(--border-color-light, #f0f0f0);
  height: auto;
  min-height: 100px;
}

.outline-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.outline-preview {
  position: relative;
  width: 80px;
  min-width: 80px;
  height: auto;
  background-color: var(--primary-color-light, #eef5ff);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-placeholder {
  font-size: 2rem;
  color: var(--primary-color, #4a89dc);
  opacity: 0.7;
}

.outline-card-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: none;
}

.outline-card:hover .outline-card-actions {
  display: flex;
  gap: 0.25rem;
}

.outline-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  overflow: visible;
}

.outline-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.title-with-edit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.outline-actions {
  display: flex;
  gap: 6px;
}

.outline-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  background: transparent;
  border: none;
  color: var(--text-tertiary, #999);
  cursor: pointer;
  transition: all 0.2s ease;
}

.outline-action-btn:hover {
  background-color: var(--hover-color, #f5f7fa);
}

.outline-action-btn.edit-btn:hover {
  color: var(--primary-color, #4a89dc);
}

.outline-action-btn.delete-btn:hover {
  color: var(--danger-color, #e74c3c);
}

.outline-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color, #333);
  word-break: break-word;
  width: 100%;
}

.outline-description {
  font-size: 0.875rem;
  color: var(--text-secondary, #666);
  margin: 0 0 0.75rem;
  flex: 1;
  word-break: break-word;
  white-space: normal;
  overflow: visible;
}

.outline-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-tertiary, #999);
  margin-bottom: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  background-color: var(--card-bg, white);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 4rem;
  color: var(--text-light, #ccc);
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--text-color, #333);
}

.empty-description {
  font-size: 1rem;
  color: var(--text-secondary, #666);
  margin: 0 0 1.5rem;
  max-width: 500px;
}

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
  width: 100%;
  max-width: 500px;
  background-color: var(--card-bg, white);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color-light, #f0f0f0);
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color, #333);
}

.dialog-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--text-tertiary, #999);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dialog-close:hover {
  color: var(--text-color, #333);
}

.dialog-body {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--text-color, #333);
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  border: 1px solid var(--border-color, #e0e0e0);
  font-size: 0.875rem;
  background-color: var(--background-color, #f8f9fa);
  outline: none;
  transition: all 0.2s ease;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: var(--primary-color, #4a89dc);
  box-shadow: 0 0 0 2px rgba(74, 137, 220, 0.2);
}

.form-textarea {
  resize: vertical;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid var(--border-color-light, #f0f0f0);
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background-color: var(--button-secondary-bg, #f8f9fa);
  color: var(--text-color, #333);
  border: 1px solid var(--border-color, #e0e0e0);
}

.btn-cancel:hover {
  background-color: var(--button-secondary-hover, #e9ecef);
}

.btn-save {
  background-color: var(--primary-color, #4a89dc);
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
}

.btn-save:hover:not(:disabled) {
  background-color: var(--primary-dark, #3a79cc);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  background-color: var(--danger-color, #dc3545);
  color: white;
  border: none;
}

.btn-danger:hover {
  background-color: var(--danger-dark, #c82333);
}

.btn-primary {
  background-color: var(--primary-color, #4a89dc);
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: var(--primary-dark, #3a79cc);
}

.warning-text {
  color: var(--danger-color, #dc3545);
  font-size: 0.875rem;
  font-weight: 500;
}

.card-action-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--text-color, #333);
  transition: all 0.2s ease;
}

.card-action-btn:hover {
  background-color: white;
  transform: scale(1.1);
}

.edit-btn:hover {
  color: var(--primary-color, #4a89dc);
}

.delete-btn:hover {
  color: var(--danger-color, #dc3545);
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
  
  .outline-grid {
    grid-template-columns: 1fr;
  }

  .outline-card {
    flex-direction: column;
  }

  .outline-preview {
    width: 100%;
    min-width: 100%;
    height: 80px;
  }

  .outline-card-actions {
    display: flex;
    top: 0.5rem;
    right: 0.5rem;
  }
}
</style> 