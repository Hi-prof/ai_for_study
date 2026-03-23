<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" :class="{ 'teacher-icon': isTeacher }">
          <i class="fas fa-project-diagram"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ isTeacher ? createdGraphsCount : studiedGraphsCount }}</h3>
          <p class="stat-label">{{ isTeacher ? '创建的知识图谱' : '学习的知识图谱' }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-star"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ favoriteGraphsCount }}</h3>
          <p class="stat-label">收藏的知识图谱</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ totalStudyHours }}</h3>
          <p class="stat-label">总学习时长(小时)</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ completionRate }}%</h3>
          <p class="stat-label">平均完成率</p>
        </div>
      </div>
    </div>
    
    <!-- 最近活动 -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">{{ isTeacher ? '最近编辑' : '最近学习' }}</h2>
        <router-link to="/my/history" class="view-all-link">查看全部</router-link>
      </div>
      
      <div class="activity-list">
        <div v-if="recentActivities.length === 0" class="empty-state">
          <p>暂无{{ isTeacher ? '编辑' : '学习' }}记录</p>
        </div>
        
        <div v-else v-for="activity in recentActivities" :key="activity.id" class="activity-item">
          <div class="activity-icon">
            <i class="fas" :class="getActivityIcon(activity.type)"></i>
          </div>
          <div class="activity-content">
            <div class="activity-title">
              <router-link :to="getActivityLink(activity)" class="activity-link">
                {{ activity.title }}
              </router-link>
            </div>
            <div class="activity-meta">
              <span class="activity-time">{{ formatTime(activity.time) }}</span>
              <span v-if="activity.progress" class="activity-progress">
                完成度: {{ activity.progress }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 接收props
const props = defineProps({
  isTeacher: {
    type: Boolean,
    default: false
  }
});

// 统计数据
const createdGraphsCount = ref(0);
const studiedGraphsCount = ref(0);
const favoriteGraphsCount = ref(0);
const totalStudyHours = ref(0);
const completionRate = ref(0);

// 活动记录
const recentActivities = ref([]);

// 获取活动图标
const getActivityIcon = (type) => {
  const icons = {
    'edit': 'fa-edit',
    'study': 'fa-book-reader',
    'create': 'fa-plus-circle',
    'share': 'fa-share-alt'
  };
  return icons[type] || 'fa-circle';
};

// 获取活动链接
const getActivityLink = (activity) => {
  if (activity.type === 'edit' || activity.type === 'study') {
    return `/graph/${activity.graphId}`;
  }
  return '/my/history';
};

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 0) {
    return `${diffDay}天前`;
  }
  if (diffHour > 0) {
    return `${diffHour}小时前`;
  }
  if (diffMin > 0) {
    return `${diffMin}分钟前`;
  }
  return '刚刚';
};

// 加载数据
const loadData = async () => {
  try {
    // TODO: 从API获取数据
    // 模拟数据
    if (props.isTeacher) {
      createdGraphsCount.value = 12;
    } else {
      studiedGraphsCount.value = 8;
    }
    
    favoriteGraphsCount.value = 5;
    totalStudyHours.value = 24;
    completionRate.value = 68;
    
    // 模拟活动数据
    recentActivities.value = props.isTeacher ? [
      { id: 1, type: 'edit', title: '土木工程概论知识图谱', time: Date.now() - 3600000, graphId: 1 },
      { id: 2, type: 'create', title: '建筑材料学知识图谱', time: Date.now() - 86400000, graphId: 2 },
      { id: 3, type: 'edit', title: '结构力学基础知识图谱', time: Date.now() - 172800000, graphId: 3 },
      { id: 4, type: 'share', title: '工程测量学知识图谱', time: Date.now() - 259200000, graphId: 4 }
    ] : [
      { id: 1, type: 'study', title: '土木工程概论知识图谱', time: Date.now() - 1800000, progress: 75, graphId: 1 },
      { id: 2, type: 'study', title: '建筑材料学知识图谱', time: Date.now() - 43200000, progress: 30, graphId: 2 },
      { id: 3, type: 'study', title: '结构力学基础知识图谱', time: Date.now() - 129600000, progress: 45, graphId: 3 },
      { id: 4, type: 'study', title: '工程测量学知识图谱', time: Date.now() - 345600000, progress: 20, graphId: 4 }
    ];
  } catch (error) {
    console.error('加载数据失败:', error);
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-card {
  background-color: var(--background-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--primary-color-light);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-right: 1rem;
}

.stat-icon.teacher-icon {
  background-color: var(--accent-color-light);
  color: var(--accent-color);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin: 0.25rem 0 0 0;
}

.section {
  background-color: var(--background-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  padding: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}

.view-all-link {
  font-size: 0.875rem;
  color: var(--primary-color);
  text-decoration: none;
  transition: color var(--transition-normal);
}

.view-all-link:hover {
  color: var(--primary-color-dark);
  text-decoration: underline;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-normal);
}

.activity-item:hover {
  background-color: var(--background-color-hover);
}

.activity-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--primary-color-light);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-link {
  color: var(--text-color);
  text-decoration: none;
  transition: color var(--transition-normal);
}

.activity-link:hover {
  color: var(--primary-color);
}

.activity-meta {
  display: flex;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.activity-time {
  margin-right: 1rem;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--text-color-secondary);
}

.graph-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.graph-card {
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.graph-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.graph-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.graph-image, .graph-image-placeholder {
  height: 140px;
  background-color: var(--background-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.graph-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.graph-image-placeholder {
  color: var(--text-color-secondary);
  font-size: 2rem;
}

.graph-info {
  padding: 1rem;
}

.graph-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.graph-description {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin: 0 0 0.75rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.graph-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-color-tertiary);
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .graph-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .graph-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style> 