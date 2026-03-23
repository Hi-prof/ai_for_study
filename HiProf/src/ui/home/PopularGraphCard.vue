<template>
  <div class="popular-graph-section glass-morphic-bg">
    <div class="container">
      <h2 class="section-title">热门课程知识图谱</h2>
      <p class="section-description">
        探索各专业领域的课程知识图谱，获取灵感并开始您的学习之旅。
      </p>
      
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="courses.length === 0" class="no-courses">
        暂无课程数据，请稍后再试。
      </div>
      
      <div v-else class="popular-graphs-grid">
        <div 
          v-for="course in courses" 
          :key="course.id" 
          class="graph-card glass-card"
        >
          <div class="graph-card-header">
            <div class="graph-preview">
              <img :src="getCourseImage(course.id)" :alt="course.name" class="preview-image" />
            </div>
            <div class="graph-stats glass-blur">
              <span class="stat-item"><span class="stat-icon">📊</span> {{ course.nodeCount || 0 }} 个知识点</span>
              <span class="stat-item"><span class="stat-icon">📅</span> {{ formatDate(course.updatedAt) }}</span>
            </div>
          </div>
          
          <div class="graph-card-content">
            <h3 class="graph-title">{{ course.name }}</h3>
            <p class="graph-description">{{ course.description }}</p>
            

            
            <div class="action-buttons">
              <router-link :to="`/graph/${course.id}`" class="glass-button">
                查看图谱
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
// 导入静态图片
import efficientReviewImg from '@/assets/images/efficient-review.svg';
import efficientLearningImg from '@/assets/images/efficient-learning.svg';
import energyManagementImg from '@/assets/images/energy-management.svg';

// 静态课程数据 - 推荐的3个知识图谱
const courses = ref([
  {
    id: 'efficient-review',
    name: '高效复盘知识图谱',
    description: '掌握复盘方法论，从经验中提取智慧，持续改进和成长。',
    nodeCount: 25,
    updatedAt: '2024-01-15',
    category: '个人成长'
  },
  {
    id: 'efficient-learning',
    name: '高效率学习知识图谱', 
    description: '科学的学习方法和技巧，提升学习效率，构建知识体系。',
    nodeCount: 32,
    updatedAt: '2024-01-10',
    category: '学习方法'
  },
  {
    id: 'energy-management',
    name: '精力管理知识图谱',
    description: '合理分配和管理个人精力，平衡工作与生活，保持最佳状态。',
    nodeCount: 28,
    updatedAt: '2024-01-08', 
    category: '时间管理'
  }
]);

const isLoading = ref(false);

// 课程图片映射
const courseImages = {
  'efficient-review': efficientReviewImg,
  'efficient-learning': efficientLearningImg,
  'energy-management': energyManagementImg,
  'default': 'https://placehold.co/300x180?text=知识图谱'
};

// 获取课程分类
const getCourseCategory = (course) => {
  return course.category || '综合';
};

// 获取课程图片
const getCourseImage = (courseId) => {
  return courseImages[courseId] || courseImages['default'];
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知日期';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  } catch (error) {
    return '未知日期';
  }
};
</script>

<style scoped>
@import '../../assets/styles/glassmorphism.css';

.popular-graph-section {
  padding: 0;
  position: relative;
  overflow: hidden;
  z-index: 5;
}

.section-title {
  font-size: var(--font-size-xxlarge);
  margin-bottom: var(--spacing-xs);
  text-align: center;
  color: rgba(0, 0, 0, 0.85);
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.5);
  position: relative;
  display: inline-block;
  left: 50%;
  transform: translateX(-50%);
}

.section-title::after {
  content: "";
  position: absolute;
  bottom: -10px;
  left: 25%;
  width: 50%;
  height: 3px;
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.2), transparent);
}

.section-description {
  font-size: var(--font-size-medium);
  color: rgba(0, 0, 0, 0.7);
  text-align: center;
  max-width: 800px;
  margin: 0 auto var(--spacing-sm);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) 0;
  color: rgba(0, 0, 0, 0.7);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(79, 70, 229, 0.1);
  border-radius: 50%;
  border-top-color: rgba(79, 70, 229, 0.6);
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-courses {
  text-align: center;
  padding: var(--spacing-xl) 0;
  color: rgba(0, 0, 0, 0.7);
}

.popular-graphs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.graph-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.graph-card-header {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.graph-preview {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.graph-card:hover .preview-image {
  transform: scale(1.05);
}

.graph-stats {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--spacing-xs) var(--spacing-sm);
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-small);
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-icon {
  margin-right: 4px;
}

.graph-card-content {
  padding: var(--spacing-sm) var(--spacing-md);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.graph-title {
  font-size: var(--font-size-large);
  margin-bottom: calc(var(--spacing-xs) / 2);
  color: rgba(0, 0, 0, 0.85);
}

.graph-description {
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-small);
  flex-grow: 1;
}

.graph-meta {
  margin-bottom: var(--spacing-xs);
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.graph-category {
  font-size: var(--font-size-small);
  padding: 4px 10px;
  border-radius: 20px;
  display: inline-block;
}

.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: auto;
}

.action-buttons .glass-button {
  font-size: var(--font-size-small);
  padding: 6px 14px;
}

.glass-button.outline {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.glass-button.outline:hover {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .popular-graphs-grid {
    grid-template-columns: 1fr;
  }
}
</style> 