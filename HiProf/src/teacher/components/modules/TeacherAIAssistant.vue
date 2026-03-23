<template>
  <div class="ai-assistant-panel">
    <WorkspaceFeatureGrid :items="teacherAssistantItems" @select="handleFeatureSelect" />

    <div v-if="showCourseSelector" class="modal-overlay" @click="cancelCourseSelection">
      <div class="modal-content" role="dialog" aria-modal="true" aria-label="选择课程" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">选择课程</h3>
          <button type="button" class="modal-close" aria-label="关闭课程选择弹窗" @click="cancelCourseSelection">
            ×
          </button>
        </div>

        <div class="modal-body">
          <p class="modal-description">请选择要生成教案的课程：</p>

          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>正在加载课程列表...</p>
          </div>

          <div v-else class="course-list">
            <button
              v-for="course in courses"
              :key="course.id || course.courseId"
              type="button"
              class="course-item"
              @click="selectCourseForLessonPlan(course.id || course.courseId)"
            >
              <div class="course-info">
                <h4 class="course-name">{{ course.name || course.courseName || '未命名课程' }}</h4>
                <p class="course-desc">{{ course.description || '暂无描述' }}</p>
              </div>
              <div class="course-action">
                <WorkspaceIcon name="arrowRight" :size="18" class="arrow-icon" />
              </div>
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="cancelCourseSelection">
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getCoursesList } from '@/api/courses';
import WorkspaceFeatureGrid from '@/ui/workspace/WorkspaceFeatureGrid.vue';
import WorkspaceIcon from '@/ui/workspace/WorkspaceIcon.vue';
import { teacherAssistantItems } from '@/constants/workspace';
import '@/teacher/styles/teacher-ai-assistant.css';

const router = useRouter();

const showCourseSelector = ref(false);
const courses = ref([]);
const loading = ref(false);

const loadCourses = async () => {
  loading.value = true;

  try {
    const response = await getCoursesList();
    courses.value = response?.rows || [];
  } catch (error) {
    console.error('获取课程列表失败:', error);
    alert('获取课程列表失败，请重试');
  } finally {
    loading.value = false;
  }
};

const handleAILessonGeneration = async () => {
  await loadCourses();

  if (courses.value.length === 0) {
    alert('请先创建课程，然后再生成教案');
    return;
  }

  if (courses.value.length === 1) {
    const courseId = courses.value[0].id || courses.value[0].courseId;
    router.push(`/teacher/course/${courseId}/ai-lesson-plan-generator`);
    return;
  }

  showCourseSelector.value = true;
};

const selectCourseForLessonPlan = (courseId) => {
  showCourseSelector.value = false;
  router.push(`/teacher/course/${courseId}/ai-lesson-plan-generator`);
};

const cancelCourseSelection = () => {
  showCourseSelector.value = false;
};

const handleAIPPTGeneration = () => {
  console.log('AI生成PPT');
};

const handleAIChatAssistant = () => {
  console.log('AI智能问答');
};

const handleMyLessons = () => {
  router.push('/teacher/my-lessons');
};

const handleFeatureSelect = async (featureKey) => {
  switch (featureKey) {
    case 'lesson-plan':
      await handleAILessonGeneration();
      break;
    case 'slides':
      handleAIPPTGeneration();
      break;
    case 'chat':
      handleAIChatAssistant();
      break;
    case 'my-lessons':
      handleMyLessons();
      break;
    default:
      break;
  }
};
</script>
