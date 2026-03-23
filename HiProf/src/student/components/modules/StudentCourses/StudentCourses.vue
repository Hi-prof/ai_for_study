<template>
  <div class="courses-panel">
    <!-- 课程筛选标签 -->
    <div class="filter-tabs">
      <div 
        class="filter-tab" 
        :class="{ active: courseFilter === 'all' }" 
        @click="courseFilter = 'all'"
      >
        全部课程
      </div>
      <div 
        class="filter-tab" 
        :class="{ active: courseFilter === 'ongoing' }" 
        @click="courseFilter = 'ongoing'"
      >
        进行中
      </div>
      <div 
        class="filter-tab" 
        :class="{ active: courseFilter === 'completed' }" 
        @click="courseFilter = 'completed'"
      >
        已完成
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="coursesLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载课程列表...</p>
    </div>

    <!-- 课程列表 -->
    <div v-else-if="filteredCourses.length > 0" class="courses-grid">
      <div
        v-for="course in filteredCourses"
        :key="course.id"
        :class="['course-card', `course-card-${course.type}`]"
        @click="enterCourse(course.id)"
      >
        <div class="course-header">
          <h3 class="course-title">{{ course.title }}</h3>
          <div class="course-teacher">{{ course.teacher }}</div>
        </div>
        <div class="course-stats">
          <div class="stat-item">
            <span class="stat-label">学习进度</span>
            <span class="stat-value">{{ course.progress }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总课时</span>
            <span class="stat-value">{{ course.totalHours }}学时</span>
          </div>
        </div>
        <div class="progress-section">
          <div class="progress-label">进度: {{ course.progress }}%</div>
          <div class="progress-bar">
            <div class="progress-fill" :style="`width: ${course.progress}%`"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon" aria-hidden="true">
        <WorkspaceIcon name="courses" :size="34" />
      </div>
      <h3 class="empty-title">暂无课程</h3>
      <p class="empty-description">您还没有注册任何课程，请联系老师或管理员添加课程</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { getCoursesByUserId } from '@/api/coursemembers';
import { getCourseById } from '@/api/courses';
import { getCurrentUser } from '@/api/auth';
import { calculateSemester } from '@/utils/semester';
import WorkspaceIcon from '@/ui/workspace/WorkspaceIcon.vue';
import '@/student/styles/student-courses.css';

// 路由实例
const router = useRouter();

// 课程筛选状态
const courseFilter = ref('ongoing');

// 课程数据
const courses = ref([]);
const coursesLoading = ref(false);

// 组件挂载时加载数据
onMounted(async () => {
  await fetchCourses();
});

// 获取学生课程列表
const fetchCourses = async () => {
  coursesLoading.value = true;
  try {
    // 获取当前用户信息
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.id) {
      console.error('无法获取当前用户信息');
      courses.value = [];
      return;
    }

    // 使用新的API获取用户加入的课程列表
    const response = await getCoursesByUserId(currentUser.id);

    if (response && response.rows && Array.isArray(response.rows)) {
      // 获取每个课程的详细信息
      const coursePromises = response.rows.map(async (courseMember, index) => {
        let courseTitle = '未命名课程';
        let courseDescription = '';
        const courseId = courseMember.courseId || courseMember.id;

        if (courseId) {
          try {
            const courseDetailResponse = await getCourseById(courseId);
            if (courseDetailResponse && courseDetailResponse.code === 200 && courseDetailResponse.data) {
              courseTitle = courseDetailResponse.data.name || courseDetailResponse.data.courseName || '未命名课程';
              courseDescription = courseDetailResponse.data.description || '';
            }
          } catch (error) {
            console.error(`获取课程 ${courseId} 详情失败:`, error);
          }
        }

        return {
          id: courseId,
          title: courseTitle,
          teacher: courseMember.teacherName || '未知教师',
          progress: courseMember.progress || Math.floor(Math.random() * 100), // 随机进度，实际应该从API获取
          totalHours: courseMember.totalHours || 32,
          type: index % 2 === 0 ? 'blue' : 'green', // 交替使用蓝色和绿色主题
          status: courseMember.progress >= 100 ? 'completed' : 'ongoing', // 根据进度判断状态
          semester: courseMember.createTime ? calculateSemester(courseMember.createTime) : '未知学期',
          description: courseDescription,
          majorId: courseMember.majorId,
          className: courseMember.className || '',
          teacherId: courseMember.teacherId,
          memberRole: courseMember.memberRole // 成员角色
        };
      });

      // 等待所有课程详情获取完成
      courses.value = await Promise.all(coursePromises);

    } else {
      console.warn('获取学生课程列表响应格式不符合预期:', response);
      courses.value = [];
    }
  } catch (error) {
    console.error('获取学生课程列表失败:', error);
    courses.value = [];
  } finally {
    coursesLoading.value = false;
  }
};

// 筛选后的课程
const filteredCourses = computed(() => {
  if (courseFilter.value === 'all') {
    return courses.value;
  }
  return courses.value.filter(course => course.status === courseFilter.value);
});

// 课程相关方法
const enterCourse = (courseId) => {
  console.log('进入课程:', courseId);

  // 验证课程ID
  if (!courseId) {
    console.error('课程ID无效，无法进入课程详情页');
    alert('课程ID无效，无法进入课程详情页');
    return;
  }

  try {
    // 跳转到学生课程详情页面
    router.push({
      name: 'student-course-detail',
      params: {
        courseId: courseId.toString()
      }
    });
  } catch (error) {
    console.error('跳转失败:', error);
    alert('跳转失败，请重试');
  }
};

// 暴露方法给父组件
defineExpose({
  fetchCourses
});
</script>

