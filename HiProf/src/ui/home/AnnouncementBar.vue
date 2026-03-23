<template>
  <div class="announcement-bar">
    <div class="container">
      <div class="announcements-wrapper">
        <div 
          v-for="(announcement, index) in announcements" 
          :key="index" 
          class="announcement-item"
        >
          <span class="announcement-tag">{{ announcement.tag }}</span>
          <span class="announcement-content">{{ announcement.content }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 模拟公告数据，实际应从API获取
const announcements = ref([
  { tag: '系统更新', content: '知识图谱系统已更新到最新版本。' },
  { tag: '维护信息', content: '目前系统bug已经修复了，欢迎体验并提供反馈。' },
  { tag: '重要通知', content: '知识图谱和大纲功能已上线，欢迎体验并提供反馈。' }
]);

// 移除轮播逻辑，改为静态展示
</script>

<style scoped>
@import '../../assets/styles/glassmorphism.css';

.announcement-bar {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: rgba(0, 0, 0, 0.8);
  padding: var(--spacing-xs); /* 减小padding */
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.announcements-wrapper {
  display: flex;
  flex-direction: row;
  gap: var(--spacing-sm);
  height: 100%;
  align-items: center;
  overflow-x: hidden;
}

.announcement-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 6px 10px; /* 减小padding让项目更紧凑 */
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px; /* 稍微减小圆角 */
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  gap: 6px; /* 减小间距 */
  flex-shrink: 0;
  white-space: nowrap;
  min-width: fit-content;
}

.announcement-tag {
  background-color: rgba(79, 70, 229, 0.2);
  padding: 1px 6px; /* 减小标签的padding */
  border-radius: 10px; /* 稍微减小圆角 */
  font-size: 0.75rem; /* 使用更小的字体 */
  font-weight: bold;
  color: rgba(79, 70, 229, 0.9);
  border: 1px solid rgba(79, 70, 229, 0.3);
  flex-shrink: 0;
}

.announcement-content {
  font-size: 0.8rem; /* 使用更小的字体 */
  line-height: 1.3; /* 稍微减小行高 */
  color: rgba(0, 0, 0, 0.8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style> 