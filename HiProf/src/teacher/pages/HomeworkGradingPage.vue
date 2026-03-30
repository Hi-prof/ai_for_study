<template>
  <div class="homework-grading-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <button
        class="back-btn"
        @click="handleBack"
        type="button"
      >
        <i class="back-icon"></i>
        <span>返回课程详情</span>
      </button>
      <div class="header-content">
        <h1 class="page-title">{{ courseInfo.title || '课程' }} - 作业批改</h1>
        <p class="page-subtitle">批改学生提交的作业并给出评分和评语</p>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="page-content">
      <!-- 使用现有的作业提交和批改组件 -->
      <HomeworkSubmissions
        :course-id="courseId"
        @refresh="handleRefresh"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCourseById } from '@/api/courses';
import HomeworkSubmissions from '@/teacher/pages/HomeworkSubmissions.vue';

const route = useRoute();
const router = useRouter();

// 课程ID（从路由参数获取）
const courseId = computed(() => route.params.courseId);

// 课程信息
const courseInfo = ref({
  title: '',
  semester: '',
  studentCount: 0
});

// 返回课程详情页面
const handleBack = () => {
  // 返回到课程详情页面的作业管理标签页
  router.push({
    name: 'teacher-course-detail',
    params: { courseId: courseId.value },
    query: { tab: 'homework' }
  });
};

// 刷新处理
const handleRefresh = () => {
  console.log('刷新作业批改数据');
  loadCourseInfo();
};

// 加载课程信息
const loadCourseInfo = async () => {
  try {
    console.log('正在加载课程信息，课程ID:', courseId.value);

    if (courseId.value) {
      const response = await getCourseById(courseId.value);
      
      if (response && response.data) {
        courseInfo.value = {
          title: response.data.title || response.data.name || '未知课程',
          semester: response.data.semester || '',
          studentCount: response.data.studentCount || 0
        };
      } else {
        // 如果API调用失败，使用默认值
        courseInfo.value = {
          title: '课程详情',
          semester: '',
          studentCount: 0
        };
      }
    }
  } catch (error) {
    console.error('加载课程信息失败:', error);
    // 使用默认值
    courseInfo.value = {
      title: '课程详情',
      semester: '',
      studentCount: 0
    };
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadCourseInfo();
});
</script>

<style scoped>
/* 页面整体样式 */
.homework-grading-page {
  min-height: 100vh;
  background-color: var(--background-color-secondary, #f8fafc);
}

/* 页面头部样式 */
.page-header {
  background-color: white;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  padding: 1.5rem 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--background-color-secondary, #f3f4f6);
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 0.375rem;
  color: var(--text-color, #374151);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;
}

.back-btn:hover {
  background-color: var(--background-color-tertiary, #e5e7eb);
}

.back-icon {
  width: 1rem;
  height: 1rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z' clip-rule='evenodd' /%3E%3C/svg%3E");
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-color, #1f2937);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-color-secondary, #6b7280);
  margin: 0;
}

/* 主要内容区域 */
.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 1rem;
  }
  
  .page-content {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .page-subtitle {
    font-size: 0.875rem;
  }
}
</style>
