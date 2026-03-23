<template>
  <div class="content-container">
    <!-- 左侧面板 -->
    <div class="left-panel-container" :style="{ width: leftPanelWidth + '%' }">
      <slot name="left"></slot>
    </div>

    <!-- 可拖拽的分割线 -->
    <div 
      class="resizer" 
      @mousedown="startResize"
      :class="{ 'resizing': isResizing }"
    >
      <div class="resizer-line"></div>
      <div class="resizer-handle">
        <i class="drag-icon"></i>
      </div>
    </div>

    <!-- 右侧面板 -->
    <div class="right-panel-container" :style="{ width: rightPanelWidth + '%' }">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';

// 响应式数据
const leftPanelWidth = ref(50); // 左侧面板宽度百分比
const rightPanelWidth = computed(() => 100 - leftPanelWidth.value); // 右侧面板宽度百分比
const isResizing = ref(false); // 是否正在调整大小

// 拖拽调整大小相关方法
const startResize = (e) => {
  isResizing.value = true;
  document.addEventListener('mousemove', handleResize, { passive: false });
  document.addEventListener('mouseup', stopResize, { passive: true });
  e.preventDefault();
};

const handleResize = (e) => {
  if (!isResizing.value) return;

  const container = document.querySelector('.content-container');
  const containerRect = container.getBoundingClientRect();
  const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

  // 限制最小和最大宽度
  if (newLeftWidth >= 20 && newLeftWidth <= 80) {
    leftPanelWidth.value = newLeftWidth;
  }
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
};

// 组件卸载时清理事件监听器
onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
});
</script>

<style scoped>
/* 确保布局容器有正确的高度 */
.content-container {
  height: 100%;
  display: flex;
}

.left-panel-container,
.right-panel-container {
  height: 100%;
  overflow: hidden;
}
</style>

<style scoped>
@import '@/teacher/styles/ai-knowledge-graph-generator.css';
</style>

