<template>
  <div class="course-selector">
    <div class="course-header">
      <div class="course-title">选择知识图谱</div>
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索知识图谱..."
          @input="filterCourses"
        />
        <i class="search-icon"></i>
      </div>
    </div>
    
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
    
    <div v-else class="course-list">
      <div
        v-for="course in filteredCourses"
        :key="course.id"
        class="course-item"
        :class="{'active': selectedCourseId === course.id}"
        @click="selectCourse(course)"
      >
        <div class="course-avatar">{{ course.name ? course.name.charAt(0) : '#' }}</div>
        <div class="course-content">
          <div class="course-name">{{ course.name || '未命名图谱' }}</div>
          <div class="course-info">
            <span class="course-nodes">{{ course.nodeCount || 0 }} 知识点</span>
            <span class="course-date">{{ formatDate(course.updatedAt) }}</span>
          </div>
        </div>
      </div>
      
      <div v-if="filteredCourses.length === 0 && !isLoading" class="empty-course-list">
        <i class="empty-icon">📚</i>
        <p>没有找到匹配的知识图谱</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { getKnowledgeGraphList } from '@/api/graph';

const props = defineProps({
  selectedCourseId: {
    type: [String, Number],
    default: ''
  }
});

const emit = defineEmits(['course-select']);

const searchQuery = ref('');
const courses = ref([]);
const isLoading = ref(false);

// 过滤课程列表
const filteredCourses = computed(() => {
  if (!Array.isArray(courses.value) || courses.value.length === 0) {
    return [];
  }
  
  if (!searchQuery.value) {
    return courses.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return courses.value.filter(course => 
    (course.name && course.name.toLowerCase().includes(query)) || 
    (course.description && course.description.toLowerCase().includes(query))
  );
});

// 获取课程列表
const fetchCourses = async () => {
  isLoading.value = true;
  try {
    const response = await getKnowledgeGraphList();
    if (response && response.rows && Array.isArray(response.rows)) {
      courses.value = response.rows.map(course => ({
        ...course,
        // 确保name属性存在（有些API可能返回title而不是name）
        name: course.name || course.title || `图谱 #${course.id}`
      }));
    } else if (Array.isArray(response)) {
      courses.value = response.map(course => ({
        ...course,
        name: course.name || course.title || `图谱 #${course.id}`
      }));
    } else {
      console.warn('无法解析课程列表数据:', response);
      courses.value = [];
    }
  } catch (error) {
    console.error('获取课程列表失败:', error);
    courses.value = [];
  } finally {
    isLoading.value = false;
  }
};

// 筛选课程
const filterCourses = () => {
  console.log('筛选课程，关键词:', searchQuery.value);
};

// 选择课程
const selectCourse = (course) => {
  console.log('选择课程:', course);
  emit('course-select', course);
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit'
    });
  } catch (e) {
    return '';
  }
};

onMounted(() => {
  console.log('CourseSelector组件已挂载，开始获取课程列表');
  fetchCourses();
});
</script>

<style scoped>
.course-selector {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 16px;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.course-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.search-box {
  position: relative;
  width: 240px;
}

.search-box input {
  width: 100%;
  height: 36px;
  padding: 0 36px 0 12px;
  font-size: 14px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background-color: #f9f9f9;
  outline: none;
  transition: all 0.3s ease;
}

.search-box input:focus {
  border-color: var(--primary-color, #4a89dc);
  box-shadow: 0 0 0 2px rgba(74, 137, 220, 0.1);
  background-color: #fff;
}

.search-icon {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  opacity: 0.5;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100px;
  gap: 12px;
  color: #666;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #4a89dc;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.course-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
}

.course-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
  gap: 12px;
  border: 1px solid #eee;
  width: calc(50% - 6px);
}

.course-item:hover {
  background-color: #f5f5f5;
  border-color: #e0e0e0;
}

.course-item.active {
  background-color: #f0f7ff;
  border-color: #b3d7ff;
}

.course-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #4a89dc;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
}

.course-content {
  flex: 1;
  min-width: 0;
}

.course-name {
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.course-nodes {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
}

.empty-course-list {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 150px;
  color: #666;
  font-style: italic;
  gap: 16px;
  width: 100%;
}

.empty-icon {
  font-size: 36px;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .course-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .search-box {
    width: 100%;
  }
  
  .course-item {
    width: 100%;
  }
}
</style> 