<template>
  <div class="my-history">
    <!-- 过滤和排序工具栏 -->
    <div class="toolbar">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索历史记录..." 
          class="search-input"
          @input="filterHistory"
        />
        <i class="fas fa-search search-icon"></i>
      </div>
      
      <div class="filter-sort">
        <div class="filter-group">
          <label class="filter-label">时间范围:</label>
          <select v-model="timeRangeFilter" class="filter-select" @change="filterHistory">
            <option value="all">全部时间</option>
            <option value="week">最近一周</option>
            <option value="month">最近一个月</option>
            <option value="quarter">最近三个月</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">排序:</label>
          <select v-model="sortOption" class="filter-select" @change="filterHistory">
            <option value="recent">最近</option>
            <option value="duration">时长</option>
            <option value="progress">进度</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- 历史记录统计 -->
    <div class="history-stats">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ totalHours }}</h3>
          <p class="stat-label">总{{ isTeacher ? '编辑' : '学习' }}时长(小时)</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-project-diagram"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ totalGraphs }}</h3>
          <p class="stat-label">{{ isTeacher ? '编辑' : '学习' }}的知识图谱</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-calendar-check"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ activeStreak }}</h3>
          <p class="stat-label">连续{{ isTeacher ? '编辑' : '学习' }}天数</p>
        </div>
      </div>
      
      <div v-if="!isTeacher" class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ averageProgress }}%</h3>
          <p class="stat-label">平均完成率</p>
        </div>
      </div>
    </div>
    
    <!-- 历史记录列表 -->
    <div v-if="filteredHistory.length > 0" class="history-list">
      <!-- 教师端历史记录 -->
      <div v-if="isTeacher" v-for="(group, date) in groupedHistory" :key="date" class="history-group">
        <div class="history-date">{{ formatGroupDate(date) }}</div>
        
        <div v-for="item in group" :key="item.id" class="history-item">
          <div class="history-time">{{ formatTime(item.timestamp) }}</div>
          
          <div class="history-content">
            <div class="history-icon">
              <i class="fas" :class="getActivityIcon(item.type)"></i>
            </div>
            
            <div class="history-details">
              <div class="history-title">
                <router-link :to="`/graph/${item.graphId}`" class="history-link">
                  {{ item.title }}
                </router-link>
              </div>
              
              <div class="history-action">
                {{ getActionText(item) }}
              </div>
              
              <div class="history-meta">
                <span class="meta-item">
                  <i class="fas fa-clock"></i>
                  <span>{{ formatDuration(item.duration) }}</span>
                </span>
                
                <span v-if="item.nodesEdited" class="meta-item">
                  <i class="fas fa-edit"></i>
                  <span>编辑了{{ item.nodesEdited }}个知识点</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 学生端历史记录 -->
      <div v-if="!isTeacher" v-for="(group, date) in groupedHistory" :key="date" class="history-group">
        <div class="history-date">{{ formatGroupDate(date) }}</div>
        
        <div v-for="item in group" :key="item.id" class="history-item">
          <div class="history-time">{{ formatTime(item.timestamp) }}</div>
          
          <div class="history-content">
            <div class="history-icon">
              <i class="fas fa-book-reader"></i>
            </div>
            
            <div class="history-details">
              <div class="history-title">
                <router-link :to="`/graph/${item.graphId}`" class="history-link">
                  {{ item.title }}
                </router-link>
              </div>
              
              <div class="history-action">
                学习了 {{ formatDuration(item.duration) }}
              </div>
              
              <div class="history-meta">
                <div class="progress-wrapper">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: `${item.progress}%` }"></div>
                  </div>
                  <span class="progress-text">完成度: {{ item.progress }}%</span>
                </div>
                
                <span v-if="item.nodesLearned" class="meta-item">
                  <i class="fas fa-check-circle"></i>
                  <span>学习了{{ item.nodesLearned }}个知识点</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 加载更多按钮 -->
      <div v-if="hasMoreHistory" class="load-more">
        <button class="btn btn-outline" @click="loadMoreHistory">
          <span v-if="isLoading">加载中...</span>
          <span v-else>加载更多</span>
        </button>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-history"></i>
      </div>
      <h3 class="empty-title">暂无{{ isTeacher ? '编辑' : '学习' }}记录</h3>
      <p class="empty-description">
        {{ isTeacher ? '开始创建和编辑您的知识图谱，记录将显示在这里' : '开始学习知识图谱，您的学习记录将显示在这里' }}
      </p>
      <div class="empty-actions">
        <router-link :to="isTeacher ? '/my?tab=graphs' : '/'" class="btn btn-primary">
          {{ isTeacher ? '我的知识图谱' : '浏览知识图谱' }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// 接收props
const props = defineProps({
  isTeacher: {
    type: Boolean,
    default: false
  }
});

// 历史记录数据
const historyItems = ref([]);
const filteredHistory = ref([]);

// 统计数据
const totalHours = ref(0);
const totalGraphs = ref(0);
const activeStreak = ref(0);
const averageProgress = ref(0);

// 搜索和过滤状态
const searchQuery = ref('');
const timeRangeFilter = ref('all');
const sortOption = ref('recent');

// 分页状态
const page = ref(1);
const hasMoreHistory = ref(false);
const isLoading = ref(false);

// 按日期分组的历史记录
const groupedHistory = computed(() => {
  const groups = {};
  
  filteredHistory.value.forEach(item => {
    const date = new Date(item.timestamp).toISOString().split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
  });
  
  return groups;
});

// 获取活动图标
const getActivityIcon = (type) => {
  const icons = {
    'edit': 'fa-edit',
    'create': 'fa-plus-circle',
    'share': 'fa-share-alt',
    'delete': 'fa-trash-alt'
  };
  return icons[type] || 'fa-circle';
};

// 获取操作文本
const getActionText = (item) => {
  switch (item.type) {
    case 'create':
      return `创建了知识图谱`;
    case 'edit':
      return `编辑了知识图谱`;
    case 'share':
      return `分享了知识图谱`;
    case 'delete':
      return `删除了知识图谱`;
    default:
      return `操作了知识图谱`;
  }
};

// 格式化日期组标题
const formatGroupDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toISOString().split('T')[0] === today.toISOString().split('T')[0]) {
    return '今天';
  } else if (date.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
    return '昨天';
  } else {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }
};

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// 格式化持续时间
const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes}分钟`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  }
};

// 过滤和排序历史记录
const filterHistory = () => {
  let result = [...historyItems.value];
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(item => 
      item.title.toLowerCase().includes(query)
    );
  }
  
  // 时间范围过滤
  if (timeRangeFilter.value !== 'all') {
    const now = new Date();
    let startDate;
    
    switch (timeRangeFilter.value) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      default:
        startDate = null;
    }
    
    if (startDate) {
      result = result.filter(item => new Date(item.timestamp) >= startDate);
    }
  }
  
  // 排序
  result.sort((a, b) => {
    switch (sortOption.value) {
      case 'duration':
        return b.duration - a.duration;
      case 'progress':
        return (b.progress || 0) - (a.progress || 0);
      case 'recent':
      default:
        return new Date(b.timestamp) - new Date(a.timestamp);
    }
  });
  
  filteredHistory.value = result;
};

// 加载更多历史记录
const loadMoreHistory = async () => {
  if (isLoading.value) return;
  
  try {
    isLoading.value = true;
    page.value += 1;
    
    // TODO: 从API加载更多历史记录
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟加载延迟
    
    // 模拟没有更多数据
    hasMoreHistory.value = false;
    
    isLoading.value = false;
  } catch (error) {
    console.error('加载更多历史记录失败:', error);
    isLoading.value = false;
  }
};

// 加载历史记录数据
const loadHistory = async () => {
  try {
    // TODO: 从API获取数据
    // 模拟数据
    const currentDate = new Date();
    
    if (props.isTeacher) {
      // 教师编辑历史
      historyItems.value = [
        {
          id: 1,
          type: 'edit',
          title: '土木工程概论知识图谱',
          graphId: 1,
          timestamp: new Date(currentDate - 2 * 60 * 60 * 1000).toISOString(),
          duration: 45,
          nodesEdited: 5
        },
        {
          id: 2,
          type: 'create',
          title: '建筑材料学知识图谱',
          graphId: 2,
          timestamp: new Date(currentDate - 5 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          nodesEdited: 12
        },
        {
          id: 3,
          type: 'edit',
          title: '结构力学基础知识图谱',
          graphId: 3,
          timestamp: new Date(currentDate - 1 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 30,
          nodesEdited: 3
        },
        {
          id: 4,
          type: 'share',
          title: '工程测量学知识图谱',
          graphId: 4,
          timestamp: new Date(currentDate - 2 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 5
        },
        {
          id: 5,
          type: 'edit',
          title: '土木工程概论知识图谱',
          graphId: 1,
          timestamp: new Date(currentDate - 3 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 75,
          nodesEdited: 8
        }
      ];
      
      // 统计数据
      totalHours.value = 28;
      totalGraphs.value = 4;
      activeStreak.value = 3;
    } else {
      // 学生学习历史
      historyItems.value = [
        {
          id: 1,
          title: '土木工程概论知识图谱',
          graphId: 1,
          timestamp: new Date(currentDate - 3 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          progress: 75,
          nodesLearned: 8
        },
        {
          id: 2,
          title: '建筑材料学知识图谱',
          graphId: 2,
          timestamp: new Date(currentDate - 6 * 60 * 60 * 1000).toISOString(),
          duration: 45,
          progress: 30,
          nodesLearned: 5
        },
        {
          id: 3,
          title: '结构力学基础知识图谱',
          graphId: 3,
          timestamp: new Date(currentDate - 1 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 90,
          progress: 45,
          nodesLearned: 10
        },
        {
          id: 4,
          title: '土木工程概论知识图谱',
          graphId: 1,
          timestamp: new Date(currentDate - 2 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 30,
          progress: 65,
          nodesLearned: 3
        },
        {
          id: 5,
          title: '建筑材料学知识图谱',
          graphId: 2,
          timestamp: new Date(currentDate - 3 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 45,
          progress: 20,
          nodesLearned: 4
        }
      ];
      
      // 统计数据
      totalHours.value = 32;
      totalGraphs.value = 3;
      activeStreak.value = 4;
      averageProgress.value = 42;
    }
    
    // 模拟有更多数据可加载
    hasMoreHistory.value = true;
    
    filterHistory(); // 初始过滤
  } catch (error) {
    console.error('加载历史记录失败:', error);
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadHistory();
});
</script>

<style scoped>
.my-history {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-full);
  font-size: 0.875rem;
  background-color: var(--background-color);
  color: var(--text-color);
  transition: all var(--transition-normal);
}

.search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-light);
  outline: none;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-color-secondary);
  pointer-events: none;
}

.filter-sort {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 0.875rem;
  background-color: var(--background-color);
  color: var(--text-color);
}

.history-stats {
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

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.history-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-date {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.history-item {
  display: flex;
  padding: 0.75rem;
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-normal);
}

.history-item:hover {
  background-color: var(--background-color-hover);
}

.history-time {
  font-size: 0.75rem;
  color: var(--text-color-tertiary);
  width: 50px;
  flex-shrink: 0;
}

.history-content {
  display: flex;
  flex: 1;
}

.history-icon {
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

.history-details {
  flex: 1;
}

.history-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.history-link {
  color: var(--text-color);
  text-decoration: none;
  transition: color var(--transition-normal);
}

.history-link:hover {
  color: var(--primary-color);
}

.history-action {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}

.history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--text-color-tertiary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar {
  width: 100px;
  height: 6px;
  background-color: var(--background-color-secondary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: var(--border-radius-full);
}

.progress-text {
  white-space: nowrap;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.empty-description {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin: 0 0 1.5rem 0;
  max-width: 400px;
}

.empty-actions {
  display: flex;
  justify-content: center;
}

@media (max-width: 1024px) {
  .history-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
  
  .filter-sort {
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .history-stats {
    grid-template-columns: 1fr;
  }
}
</style>
