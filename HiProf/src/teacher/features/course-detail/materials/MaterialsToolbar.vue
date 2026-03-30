<template>
  <div class="materials-toolbar">
    <!-- 视图控制 -->
    <div class="view-controls">
      <button
        :class="['view-btn', { active: viewMode === 'list' }]"
        @click="setViewMode('list')"
      >
        <i class="list-icon"></i>
        列表
      </button>
      <button
        :class="['view-btn', { active: viewMode === 'grid' }]"
        @click="setViewMode('grid')"
      >
        <i class="grid-icon"></i>
        网格
      </button>
    </div>

    <!-- 文件操作 -->
    <div class="file-actions">
      <select
        :value="sortBy"
        class="sort-select"
        @change="handleSortChange"
      >
        <option value="name">按名称排序</option>
        <option value="date">按日期排序</option>
        <option value="size">按大小排序</option>
        <option value="type">按类型排序</option>
      </select>

      <div class="search-box">
        <input
          :value="searchQuery"
          type="text"
          placeholder="搜索文件..."
          class="search-input"
          @input="handleSearchInput"
        >
        <i class="search-icon"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
// 定义props
const props = defineProps({
  viewMode: {
    type: String,
    default: 'list'
  },
  sortBy: {
    type: String,
    default: 'name'
  },
  searchQuery: {
    type: String,
    default: ''
  }
});

// 定义emits
const emit = defineEmits([
  'update:viewMode',
  'update:sortBy',
  'update:searchQuery',
  'sortChange',
  'search'
]);

// 设置视图模式
const setViewMode = (mode) => {
  emit('update:viewMode', mode);
};

// 处理排序变化
const handleSortChange = (event) => {
  emit('update:sortBy', event.target.value);
  emit('sortChange');
};

// 处理搜索输入
const handleSearchInput = (event) => {
  emit('update:searchQuery', event.target.value);
  emit('search');
};
</script>

<style scoped>
/* 工具栏样式 */
.materials-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  background-color: white;
}

.view-controls {
  display: flex;
  gap: 0.5rem;
}

.view-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 0.375rem;
  background-color: white;
  color: var(--text-color-secondary, #6b7280);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn:hover {
  background-color: var(--background-color-secondary, #f3f4f6);
}

.view-btn.active {
  background-color: var(--primary-color, #6366f1);
  color: white;
  border-color: var(--primary-color, #6366f1);
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sort-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background-color: white;
  color: var(--text-color, #374151);
  cursor: pointer;
  transition: border-color 0.2s;
}

.sort-select:focus {
  outline: none;
  border-color: var(--primary-color, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-box {
  position: relative;
  width: 250px;
}

.search-input {
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z' clip-rule='evenodd' /%3E%3C/svg%3E");
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

/* 图标样式 */
.list-icon, .grid-icon {
  width: 1rem;
  height: 1rem;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.list-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.grid-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath d='M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' /%3E%3C/svg%3E");
}

/* 响应式设计 */
@media (max-width: 768px) {
  .materials-toolbar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .file-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .search-box {
    width: 100%;
  }
}
</style>
