<template>
  <div class="materials-stats">
    <div class="stat-card">
      <div class="stat-number">{{ stats.totalFiles }}</div>
      <div class="stat-label">总文件数</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">{{ formatFileSize(stats.totalSize) }}</div>
      <div class="stat-label">总大小</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">{{ stats.totalDownloads }}</div>
      <div class="stat-label">下载次数</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">{{ stats.recentUploads }}</div>
      <div class="stat-label">本周上传</div>
    </div>
  </div>
</template>

<script setup>
// 定义props
const props = defineProps({
  stats: {
    type: Object,
    default: () => ({
      totalFiles: 0,
      totalSize: 0,
      totalDownloads: 0,
      recentUploads: 0
    })
  }
});

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<style scoped>
/* 资料统计样式 */
.materials-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  padding: 1.5rem;
  background-color: var(--background-color-secondary, #f9fafb);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.stat-card {
  text-align: center;
  padding: 1rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color, #6366f1);
  margin-bottom: 0.25rem;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary, #6b7280);
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .materials-stats {
    grid-template-columns: repeat(2, 1fr);
    padding: 1rem;
    gap: 0.75rem;
  }
  
  .stat-card {
    padding: 0.75rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .stat-label {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .materials-stats {
    grid-template-columns: 1fr;
  }
}
</style>
