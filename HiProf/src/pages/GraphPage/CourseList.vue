<template>
  <div class="course-selector">
    <div class="course-list">
      <div v-if="isLoading" class="loading">加载课程列表中...</div>
      <div v-else-if="courses.length === 0" class="no-courses">暂无课程</div>
      <div v-else class="course-cards">
        <div 
          v-for="course in courses" 
          :key="course.id" 
          class="course-card"
          @click="handleCourseSelect(course.id)"
        >
          <h3>{{ course.name }}</h3>
          <p>{{ course.content }}</p>
          <div class="course-meta">
            <span class="node-count">{{ course.nodeCount || 0 }} 个知识点</span>
            <span class="view-graph">查看图谱</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { getKnowledgeGraphList } from '../../api/graph';

// 定义类型接口
interface Course {
  id: string | number;
  name: string;
  content?: string;
  nodeCount?: number;
}

// 定义 props
interface Props {
  initialCourses?: Course[];
}

const props = withDefaults(defineProps<Props>(), {
  initialCourses: () => []
});

// 定义 emits
const emit = defineEmits<{
  courseSelect: [courseId: string | number];
  coursesLoaded: [courses: Course[]];
}>();

// 响应式数据
const courses = ref<Course[]>(props.initialCourses);
const isLoading = ref(false);

// 加载课程列表
const loadCourses = async () => {
  isLoading.value = true;
  try {
    const data = await getKnowledgeGraphList();
    courses.value = data.rows || [];
    console.log('图谱列表:', courses.value);
    emit('coursesLoaded', courses.value);
  } catch (error) {
    console.error('加载课程列表失败:', error);
    courses.value = [];
  } finally {
    isLoading.value = false;
  }
};

// 处理课程选择
const handleCourseSelect = (courseId: string | number) => {
  emit('courseSelect', courseId);
};

// 生命周期
onMounted(async () => {
  if (courses.value.length === 0) {
    await loadCourses();
  }
});

// 暴露方法给父组件
defineExpose({
  loadCourses
});
</script>

<style scoped>
.course-selector {
  padding: 20px;
}

.course-list {
  max-width: 1200px;
  margin: 0 auto;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 16px;
  color: #666;
}

.no-courses {
  text-align: center;
  padding: 40px;
  font-size: 16px;
  color: #999;
}

.course-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

.course-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-color: #4299e1;
}

.course-card h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.course-card p {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #718096;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.node-count {
  color: #4a5568;
  background: #f7fafc;
  padding: 4px 8px;
  border-radius: 4px;
}

.view-graph {
  color: #4299e1;
  font-weight: 500;
}

.course-card:hover .view-graph {
  color: #3182ce;
}
</style>
