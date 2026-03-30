<template>
  <div class="outline-toolbar">
    <!-- 搜索框 -->
    <div class="search-container">
      <i class="search-icon">🔍</i>
      <input 
        type="text" 
        class="search-input" 
        v-model="searchQuery" 
        placeholder="搜索知识点..." 
        @input="handleSearch"
      />
      <button 
        v-if="searchQuery" 
        class="clear-search-btn" 
        @click="clearSearch"
      >
        <i class="icon-close">×</i>
      </button>
    </div>
    
    <!-- 字体样式工具 -->
    <div class="style-tools">
      <div class="style-tool font-family-selector">
        <select v-model="selectedFont" @change="handleFontChange">
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
          <option value="宋体">宋体</option>
          <option value="黑体">黑体</option>
          <option value="微软雅黑">微软雅黑</option>
        </select>
      </div>
      
      <div class="style-tool font-size-selector">
        <select v-model="selectedFontSize" @change="handleFontSizeChange">
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="20px">20px</option>
          <option value="24px">24px</option>
        </select>
      </div>
      
      <div class="style-tool color-picker">
        <input 
          type="color" 
          v-model="selectedColor" 
          @change="handleColorChange"
          title="文字颜色"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 事件定义
const emit = defineEmits([
  'search', 
  'font-change', 
  'font-size-change', 
  'color-change'
]);

// 搜索状态
const searchQuery = ref('');

// 字体样式状态
const selectedFont = ref('Arial');
const selectedFontSize = ref('14px');
const selectedColor = ref('#333333');

// 搜索处理
const handleSearch = () => {
  emit('search', searchQuery.value);
};

const clearSearch = () => {
  searchQuery.value = '';
  emit('search', '');
};

// 字体样式处理
const handleFontChange = () => {
  emit('font-change', selectedFont.value);
};

const handleFontSizeChange = () => {
  emit('font-size-change', selectedFontSize.value);
};

const handleColorChange = () => {
  emit('color-change', selectedColor.value);
};
</script>

<style scoped>
.outline-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 5px 0;
  width: 100%;
}

/* 搜索框样式 */
.search-container {
  position: relative;
  flex: 1;
  min-width: 180px;
  max-width: 300px;
}

.search-input {
  width: 100%;
  padding: 4px 28px 4px 30px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  font-size: 13px;
  background-color: rgba(0, 0, 0, 0.02);
  transition: all 0.2s ease;
  height: 28px;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color, #4a89dc);
  box-shadow: 0 0 0 2px rgba(74, 137, 220, 0.2);
  background-color: white;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-light, #666);
  font-size: 13px;
}

.clear-search-btn {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: white;
  font-size: 10px;
  transition: background-color 0.2s;
}

.clear-search-btn:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* 字体样式工具 */
.style-tools {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
  padding: 3px 6px;
}

.style-tool {
  position: relative;
}

.style-tool select {
  padding: 3px 20px 3px 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-size: 13px;
  background-color: white;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 5px center;
  background-size: 10px;
  height: 28px;
}

.style-tool select:focus {
  outline: none;
  border-color: var(--primary-color, #4a89dc);
  box-shadow: 0 0 0 2px rgba(74, 137, 220, 0.1);
}

.color-picker input {
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  cursor: pointer;
}

/* 视图工具 */
.view-tools {
  display: flex;
  align-items: center;
  gap: 4px;
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid transparent;
  border-radius: 4px;
  background-color: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.view-btn.active {
  border-color: var(--primary-color, #4a89dc);
  background-color: rgba(74, 137, 220, 0.1);
}

.icon-tree, .icon-mind, .icon-list {
  font-size: 16px;
  font-style: normal;
}

@media (max-width: 768px) {
  .outline-toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .search-container {
    width: 100%;
    max-width: none;
  }
  
  .style-tools {
    width: 100%;
    justify-content: space-between;
  }
}
</style> 