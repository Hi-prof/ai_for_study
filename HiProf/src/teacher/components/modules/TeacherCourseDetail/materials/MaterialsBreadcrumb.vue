<template>
  <div class="materials-breadcrumb">
    <span
      v-for="(crumb, index) in breadcrumbs"
      :key="index"
      class="breadcrumb-item"
      @click="handleNavigate(crumb.path)"
    >
      {{ crumb.name }}
      <i v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator"></i>
    </span>
  </div>
</template>

<script setup>
// 定义props
const props = defineProps({
  breadcrumbs: {
    type: Array,
    default: () => [{ name: '根目录', path: '/' }]
  }
});

// 定义emits
const emit = defineEmits(['navigate']);

// 处理导航
const handleNavigate = (path) => {
  emit('navigate', path);
};
</script>

<style scoped>
/* 面包屑导航样式 */
.materials-breadcrumb {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background-color: var(--background-color-secondary, #f9fafb);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  font-size: 0.875rem;
  overflow-x: auto;
  white-space: nowrap;
}

.breadcrumb-item {
  color: var(--text-color-secondary, #6b7280);
  cursor: pointer;
  transition: color 0.2s;
  flex-shrink: 0;
}

.breadcrumb-item:hover {
  color: var(--primary-color, #6366f1);
}

.breadcrumb-item:last-child {
  color: var(--text-color, #1f2937);
  font-weight: 500;
  cursor: default;
}

.breadcrumb-item:last-child:hover {
  color: var(--text-color, #1f2937);
}

.breadcrumb-separator {
  width: 0.75rem;
  height: 0.75rem;
  margin: 0 0.5rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z' clip-rule='evenodd' /%3E%3C/svg%3E");
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .materials-breadcrumb {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
  }
  
  .breadcrumb-separator {
    width: 0.5rem;
    height: 0.5rem;
    margin: 0 0.25rem;
  }
}
</style>
