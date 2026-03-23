<template>
  <main class="course-workspace">
    <a class="course-workspace__skip" href="#teacher-course-panel">跳到课程内容</a>
    <div class="course-workspace__glow course-workspace__glow--one"></div>
    <div class="course-workspace__glow course-workspace__glow--two"></div>

    <section class="course-workspace__hero">
      <div class="course-workspace__hero-top">
        <button type="button" class="course-workspace__back-button" @click="handleBackToCourses">
          <WorkspaceIcon name="arrowLeft" :size="18" />
          <span>返回课程列表</span>
        </button>

        <div class="course-workspace__badge">
          <WorkspaceIcon name="teacher" :size="16" />
          <span>教师课程工作台</span>
        </div>
      </div>

      <div class="course-workspace__hero-main">
        <div class="course-workspace__hero-copy">
          <p class="course-workspace__eyebrow">{{ activeTabMeta.label }}</p>
          <h1>{{ courseInfo.title }}</h1>
          <p v-if="courseDescription">{{ courseDescription }}</p>
        </div>

        <div class="course-workspace__summary">
          <article v-for="item in courseSummary" :key="item.label" class="course-workspace__summary-card">
            <span class="course-workspace__summary-icon">
              <WorkspaceIcon :name="item.icon" :size="20" />
            </span>
            <div>
              <span class="course-workspace__summary-label">{{ item.label }}</span>
              <strong class="course-workspace__summary-value">{{ item.value }}</strong>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="course-workspace__body">
      <aside class="course-workspace__nav" aria-label="课程工作台导航">
        <button
          v-for="tab in teacherCourseWorkspaceTabs"
          :key="tab.key"
          type="button"
          class="course-workspace__nav-item"
          :class="{ 'is-active': activeTab === tab.key }"
          :aria-current="activeTab === tab.key ? 'page' : undefined"
          @click="switchTab(tab.key)"
        >
          <span class="course-workspace__nav-icon">
            <WorkspaceIcon :name="tab.icon" :size="18" />
          </span>
          <span class="course-workspace__nav-copy">
            <strong>{{ tab.label }}</strong>
            <span :title="tab.description">{{ tab.description }}</span>
          </span>
          <span class="course-workspace__nav-state">
            <span v-if="activeTab === tab.key">当前</span>
            <WorkspaceIcon v-else name="arrowRight" :size="14" />
          </span>
        </button>
      </aside>

      <section id="teacher-course-panel" class="course-workspace__panel">
        <header class="course-workspace__panel-header">
          <div class="course-workspace__panel-heading">
            <h2>{{ activeTabMeta.label }}</h2>
            <span>{{ courseInfo.title }}</span>
          </div>
        </header>

        <div class="course-workspace__panel-body">
          <component :is="activeView" :course-id="courseId" />
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { getCourseById } from '@/api/courses';
import {
  defaultTeacherCourseWorkspaceTab,
  getTeacherCourseWorkspaceTab,
  teacherCourseWorkspaceTabs
} from '@/constants/courseWorkspace';
import { calculateSemester } from '@/utils/semester';
import WorkspaceIcon from '@/ui/workspace/WorkspaceIcon.vue';

import CourseChapters from './chapter/CourseChapters.vue';
import CourseKnowledgeGraph from './knowledgegraph/CourseKnowledgeGraph.vue';
import CourseHomework from './homework/CourseHomework.vue';
import CourseDiscussion from './discussion/CourseDiscussion.vue';
import CourseMaterials from './CourseMaterials.vue';
import CourseAnalytics from './learning-analysis/WCourseAnalytics.vue';

import '@/teacher/styles/variables.css';
import '@/teacher/styles/common.css';
import '@/teacher/styles/components.css';
import '@/teacher/styles/course-workspace.css';

const route = useRoute();
const router = useRouter();

const courseViews = {
  chapters: CourseChapters,
  'knowledge-graph': CourseKnowledgeGraph,
  homework: CourseHomework,
  discussion: CourseDiscussion,
  materials: CourseMaterials,
  analytics: CourseAnalytics
};

const activeTab = ref(defaultTeacherCourseWorkspaceTab);
const courseId = computed(() => String(route.params.courseId || ''));
const courseStorageKey = computed(() => `course-detail-active-tab-${courseId.value}`);
const activeTabMeta = computed(() => getTeacherCourseWorkspaceTab(activeTab.value));
const activeView = computed(() => courseViews[activeTab.value] || CourseChapters);

const courseInfo = ref({
  title: '课程工作台',
  description: '',
  semester: '未设置',
  studentCount: 0,
  totalHours: 0,
  progress: 0
});

const courseDescription = computed(() => {
  return (courseInfo.value.description || '').trim();
});

const courseSummary = computed(() => {
  return [
    {
      label: '开课学期',
      value: courseInfo.value.semester || '未设置',
      icon: 'calendar'
    },
    {
      label: '学生人数',
      value: `${courseInfo.value.studentCount} 人`,
      icon: 'users'
    },
    {
      label: '总课时',
      value: `${courseInfo.value.totalHours} 学时`,
      icon: 'clock'
    },
    {
      label: '课程进度',
      value: `${courseInfo.value.progress}%`,
      icon: 'progress'
    }
  ];
});

function resolveNumericValue(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function resolveTab(tabKey) {
  const matchedTab = teacherCourseWorkspaceTabs.find(tab => tab.key === tabKey);
  return matchedTab ? matchedTab.key : defaultTeacherCourseWorkspaceTab;
}

function syncActiveTab() {
  const routeTab = typeof route.query.tab === 'string' ? resolveTab(route.query.tab) : '';
  const savedTab = localStorage.getItem(courseStorageKey.value);
  activeTab.value = routeTab || resolveTab(savedTab);
}

async function loadCourseInfo() {
  if (!courseId.value) {
    return;
  }

  try {
    const response = await getCourseById(courseId.value);
    const courseData = response?.data || response?.courseData || (response?.id ? response : null);

    if (!courseData) {
      throw new Error('课程数据为空');
    }

    const createTime = courseData.createTime || courseData.create_at || '';

    courseInfo.value = {
      title: courseData.name || courseData.title || `课程 ${courseId.value}`,
      description: courseData.description || courseData.remark || '',
      semester: courseData.semester || (createTime ? calculateSemester(createTime) : '未设置'),
      studentCount: resolveNumericValue(courseData.studentCount),
      totalHours: resolveNumericValue(courseData.totalHours),
      progress: resolveNumericValue(courseData.progress)
    };
  } catch (error) {
    courseInfo.value = {
      title: `课程 ${courseId.value}`,
      description: '课程信息暂时没有顺利取回来，但课程内容管理入口还在，先干活不耽误。',
      semester: '未设置',
      studentCount: 0,
      totalHours: 0,
      progress: 0
    };
  }
}

function switchTab(tabKey) {
  const nextTab = resolveTab(tabKey);

  if (activeTab.value === nextTab && route.query.tab === nextTab) {
    return;
  }

  activeTab.value = nextTab;
  localStorage.setItem(courseStorageKey.value, nextTab);

  router.replace({
    query: {
      ...route.query,
      tab: nextTab
    }
  }).catch(() => {});
}

function handleBackToCourses() {
  router.push('/teacher/my');
}

watch(
  () => route.query.tab,
  () => {
    syncActiveTab();
  }
);

watch(
  courseId,
  () => {
    syncActiveTab();
    loadCourseInfo();
  },
  { immediate: true }
);
</script>
