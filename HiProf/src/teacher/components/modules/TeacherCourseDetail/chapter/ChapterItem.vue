<template>
  <div class="chapter-item" :class="{ expanded: chapter.expanded }">
    <!-- 章节头部 -->
    <div class="chapter-header" @click="$emit('toggle', chapter.id)">
      <div class="chapter-info">
        <span class="chapter-number">第{{ index + 1 }}章</span>
        <h3 class="chapter-title">{{ chapter.title }}</h3>
      </div>
      <div class="chapter-actions">
        <i class="expand-icon" :class="{ rotated: chapter.expanded }"></i>
      </div>
    </div>

    <!-- 章节内容（展开时显示） -->
    <div v-if="chapter.expanded" class="chapter-content">
      <!-- 子章节加载状态 -->
      <div v-if="chapter.loading" class="sections-loading">
        <div class="loading-spinner"></div>
        <p class="loading-text">正在加载子章节内容...</p>
      </div>

      <!-- 子章节列表 -->
      <div v-else-if="chapter.sectionsLoaded && chapter.sections && chapter.sections.length > 0" class="sections-list">
        <SectionNode
          v-for="(section, sectionIndex) in chapter.sections"
          :key="section.id"
          :section="section"
          :level="0"
          :index="sectionIndex"
          :expanded-nodes="expandedSections"
          @toggle="toggleSection"
        />
      </div>

      <!-- 空状态提示 -->
      <div v-else-if="chapter.sectionsLoaded && (!chapter.sections || chapter.sections.length === 0)" class="sections-empty">
        <span class="empty-text">暂无子章节</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SectionNode from './SectionNode.vue';

// Props
defineProps({
  chapter: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
});

// Emits
defineEmits(['toggle']);

// 子节点展开状态
const expandedSections = ref(new Set());

// 切换子节点展开状态
const toggleSection = (sectionId) => {
  if (expandedSections.value.has(sectionId)) {
    expandedSections.value.delete(sectionId);
  } else {
    expandedSections.value.add(sectionId);
  }
};
</script>

<style scoped>
.chapter-item {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  overflow: hidden;
  transition: all 0.2s;
}

.chapter-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  background-color: #ffffff;
}

.chapter-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.chapter-number {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  background-color: #6366f1;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.chapter-title {
  font-size: 1rem;
  font-weight: 500;
  color: #1f2937;
  margin: 0;
}

.chapter-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.25rem;
  background-color: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.action-btn.small {
  width: 1.5rem;
  height: 1.5rem;
}

.expand-icon {
  width: 1rem;
  height: 1rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E");
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  transition: transform 0.2s;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.chapter-content {
  padding: 1rem;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.sections-loading {
  margin-top: 1rem;
  padding: 2rem;
  text-align: center;
  background-color: #f8fafc;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.sections-list {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.section-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0.75rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
}

.section-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-number {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6366f1;
  min-width: 3rem;
}

.section-title {
  flex: 1;
  font-size: 0.875rem;
  color: #1f2937;
  text-align: left;
}

.section-actions {
  display: flex;
  gap: 0.25rem;
}

.sections-empty {
  margin-top: 1rem;
  padding: 1rem;
  text-align: center;
  background-color: #f8fafc;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-outline {
  background-color: transparent;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline:hover {
  background-color: #f3f4f6;
}

.btn-small {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

/* 图标样式 */
.edit-icon, .delete-icon, .plus-icon {
  width: 1rem;
  height: 1rem;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.edit-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath d='M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z' /%3E%3C/svg%3E");
}

.delete-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.plus-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.sections-empty {
  padding: 12px 16px;
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
}

.empty-text {
  color: #9ca3af;
}
</style>
