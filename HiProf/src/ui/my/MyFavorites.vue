<template>
  <div class="my-favorites">
    <!-- 过滤和排序工具栏 -->
    <div class="toolbar">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索收藏..." 
          class="search-input"
          @input="filterFavorites"
        />
        <i class="fas fa-search search-icon"></i>
      </div>
      
      <div class="filter-sort">
        <div class="filter-group">
          <label class="filter-label">排序:</label>
          <select v-model="sortOption" class="filter-select" @change="filterFavorites">
            <option value="recent">最近添加</option>
            <option value="name">名称</option>
            <option value="type">类型</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- 收藏列表 -->
    <div v-if="filteredFavorites.length > 0" class="favorites-list">
      <div v-for="favorite in filteredFavorites" :key="favorite.id" class="favorite-item">
        <div class="favorite-card">
          <div class="favorite-preview">
            <img v-if="favorite.image" :src="favorite.image" :alt="favorite.title" class="preview-image" />
            <div v-else class="preview-placeholder">
              <i class="fas fa-project-diagram"></i>
            </div>
          </div>
          
          <div class="favorite-content">
            <div class="favorite-header">
              <h3 class="favorite-title">{{ favorite.title }}</h3>
              <div class="favorite-category">{{ getCategoryName(favorite.category) }}</div>
            </div>
            
            <p class="favorite-description">{{ favorite.description }}</p>
            
            <div class="favorite-meta">
              <div class="meta-item">
                <i class="fas fa-user"></i>
                <span>{{ favorite.author }}</span>
              </div>
              <div class="meta-item">
                <i class="fas fa-sitemap"></i>
                <span>{{ favorite.nodeCount }}个知识点</span>
              </div>
              <div class="meta-item">
                <i class="fas fa-clock"></i>
                <span>收藏于 {{ formatDate(favorite.favoriteDate) }}</span>
              </div>
            </div>
            
            <div class="favorite-actions">
              <router-link :to="`/graph/${favorite.id}`" class="btn btn-primary btn-sm">
                查看
              </router-link>
              <router-link :to="`/outline/${favorite.id}`" class="btn btn-outline btn-sm">
                大纲
              </router-link>
              <button 
                class="btn btn-icon btn-sm btn-danger" 
                @click="confirmRemove(favorite)"
              >
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-star"></i>
      </div>
      <h3 class="empty-title">暂无收藏的知识图谱</h3>
      <p class="empty-description">
        您可以在浏览知识图谱时点击收藏按钮，将感兴趣的知识图谱添加到收藏夹
      </p>
      <div class="empty-actions">
        <router-link to="/" class="btn btn-primary">
          浏览知识图谱
        </router-link>
      </div>
    </div>
    
    <!-- 删除确认对话框 -->
    <div v-if="showRemoveDialog" class="modal-overlay" @click="showRemoveDialog = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">确认取消收藏</h3>
          <button class="modal-close" @click="showRemoveDialog = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <p class="confirm-message">
            确定要取消收藏"{{ favoriteToRemove?.title }}"吗？
          </p>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showRemoveDialog = false">取消</button>
          <button class="btn btn-danger" @click="removeFavorite">确认取消收藏</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 收藏数据
const favorites = ref([]);
const filteredFavorites = ref([]);

// 搜索和过滤状态
const searchQuery = ref('');
const sortOption = ref('recent');

// 对话框状态
const showRemoveDialog = ref(false);
const favoriteToRemove = ref(null);

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

// 过滤收藏列表
const filterFavorites = () => {
  // 应用搜索和排序
  let result = [...favorites.value];
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(favorite => 
      favorite.title.toLowerCase().includes(query) || 
      favorite.description.toLowerCase().includes(query)
    );
  }
  
  // 排序
  result.sort((a, b) => {
    switch (sortOption.value) {
      case 'name':
        return a.title.localeCompare(b.title);
      case 'type':
        return a.type.localeCompare(b.type);
      case 'recent':
      default:
        return new Date(b.addedAt) - new Date(a.addedAt);
    }
  });
  
  filteredFavorites.value = result;
};

// 确认移除收藏
const confirmRemove = (favorite) => {
  favoriteToRemove.value = favorite;
  showRemoveDialog.value = true;
};

// 移除收藏
const removeFavorite = async () => {
  if (!favoriteToRemove.value) return;
  
  try {
    // TODO: 调用API移除收藏
    console.log('移除收藏:', favoriteToRemove.value.id);
    
    // 从列表中移除
    favorites.value = favorites.value.filter(f => f.id !== favoriteToRemove.value.id);
    filterFavorites(); // 重新过滤
    
    showRemoveDialog.value = false;
    favoriteToRemove.value = null;
  } catch (error) {
    console.error('移除收藏失败:', error);
  }
};

// 加载收藏数据
const loadFavorites = async () => {
  try {
    // TODO: 从API获取数据
    // 模拟数据
    const currentDate = new Date();
    
    favorites.value = [
      {
        id: 1,
        title: '土木工程概论知识图谱',
        description: '涵盖土木工程的基本概念、历史发展和主要分支',
        category: 'civil',
        nodeCount: 45,
        author: '张教授',
        favoriteDate: new Date(currentDate - 2 * 24 * 60 * 60 * 1000).toISOString(),
        image: null
      },
      {
        id: 3,
        title: '结构力学基础知识图谱',
        description: '结构力学的基本原理和计算方法',
        category: 'mechanics',
        nodeCount: 52,
        author: '王教授',
        favoriteDate: new Date(currentDate - 5 * 24 * 60 * 60 * 1000).toISOString(),
        image: null
      },
      {
        id: 5,
        title: '混凝土结构设计原理',
        description: '涵盖混凝土结构的基本原理、设计方法和实践应用',
        category: 'civil',
        nodeCount: 42,
        author: '李教授',
        favoriteDate: new Date(currentDate - 10 * 24 * 60 * 60 * 1000).toISOString(),
        image: null
      },
      {
        id: 8,
        title: '建筑设计基础',
        description: '建筑设计的基本原则、方法和流程',
        category: 'architecture',
        nodeCount: 38,
        author: '赵教授',
        favoriteDate: new Date(currentDate - 15 * 24 * 60 * 60 * 1000).toISOString(),
        image: null
      },
      {
        id: 10,
        title: '工程项目管理',
        description: '工程项目的计划、组织、控制和协调的系统方法',
        category: 'management',
        nodeCount: 35,
        author: '刘教授',
        favoriteDate: new Date(currentDate - 20 * 24 * 60 * 60 * 1000).toISOString(),
        image: null
      }
    ];
    
    filterFavorites(); // 初始过滤
  } catch (error) {
    console.error('加载收藏失败:', error);
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadFavorites();
});
</script>

<style scoped>
.my-favorites {
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

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.favorite-card {
  background-color: var(--background-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
  display: flex;
}

.favorite-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.favorite-preview {
  width: 160px;
  flex-shrink: 0;
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

.favorite-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.favorite-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.favorite-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
  flex: 1;
}

.favorite-category {
  font-size: 0.75rem;
  background-color: var(--primary-color-light);
  color: var(--primary-color);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-full);
  white-space: nowrap;
  margin-left: 0.5rem;
}

.favorite-description {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.favorite-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.75rem;
  color: var(--text-color-tertiary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.favorite-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}

.btn-sm {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
}

.btn-icon {
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
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

.empty-actions {
  display: flex;
  justify-content: center;
}

/* 模态对话框样式 */
.modal-overlay {
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

.modal-content {
  background-color: var(--background-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 0.25rem;
  transition: color var(--transition-normal);
}

.modal-close:hover {
  color: var(--text-color);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
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
  
  .favorite-card {
    flex-direction: column;
  }
  
  .favorite-preview {
    width: 100%;
    height: 160px;
  }
}
</style>
