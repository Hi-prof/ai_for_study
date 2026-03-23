<template>
  <div class="knowledge-graph-panel">
    <!-- 知识大纲内容 -->
    <div class="outline-content">
      <div v-if="selectedOutline" class="selected-outline-container">
        <div class="outline-header">
          <button class="back-button" @click="selectedOutline = null">
            <i class="back-icon"></i>
            <span>返回大纲列表</span>
          </button>
          <h3 class="outline-title">{{ selectedOutline.title }}</h3>
        </div>
        <iframe :src="`/outline?embedded=true&onlyOutline=true&courseId=${selectedOutline.id}`" class="embedded-view"></iframe>
      </div>
      <MyOutlineList v-else @select-outline="handleOutlineSelect" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import MyOutlineList from '@/ui/my/MyOutlineList.vue';

// 选中的大纲
const selectedOutline = ref(null);

// 处理大纲选择
const handleOutlineSelect = (outline) => {
  selectedOutline.value = outline;
};
</script>

<style scoped>
/* 知识图谱面板样式 */
.knowledge-graph-panel {
  flex: 1;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 内容区域样式 */
.outline-content {
  flex: 1;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(150, 150, 150, 0.3) transparent;
}

.outline-content::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.outline-content::-webkit-scrollbar-track {
  background: transparent;
}

.outline-content::-webkit-scrollbar-thumb {
  background: rgba(150, 150, 150, 0.3);
  border-radius: 4px;
}

.outline-content::-webkit-scrollbar-thumb:hover {
  background: rgba(150, 150, 150, 0.5);
}

/* 嵌入式视图 */
.embedded-view {
  width: 100%;
  height: 95vh;
  min-height: 500px;
  border: none;
  border-radius: var(--border-radius-md);
}

/* 返回按钮样式 */
.back-button {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.back-button:hover {
  background-color: rgba(66, 153, 225, 0.1);
}

.back-button .back-icon {
  margin-right: 0.5rem;
  display: inline-block;
  width: 16px;
  height: 16px;
  position: relative;
}

.back-icon::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 12px;
  height: 12px;
  border-left: 2px solid var(--primary-color);
  border-bottom: 2px solid var(--primary-color);
  transform: translateY(-50%) rotate(45deg);
}

.outline-title, .graph-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}
</style>
