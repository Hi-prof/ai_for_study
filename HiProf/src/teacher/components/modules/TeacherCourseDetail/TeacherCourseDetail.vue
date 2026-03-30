<template>
  <WorkspaceScaffold
    tone="teacher"
    title="八闽慧教"
    subtitle="教师课程工作台"
    :sidebar-title="courseInfo.title"
    :sidebar-description="courseInfo.description"
    role-label="教师端"
    :user-name="currentUserDisplayName"
    :tabs="menuTabs"
    :active-tab="activeTab"
    back-label="返回课程列表"
    nav-aria-label="课程工作台导航"
    @back="handleBackToCourses"
    @change-tab="switchTab"
  >
    <div class="teacher-course-workspace__panel-body">
      <component :is="activeView" :course-id="courseId" />
    </div>
  </WorkspaceScaffold>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { getCourseById } from '@/api/courses';
import { getCurrentUser } from '@/api/auth';
import {
  defaultTeacherCourseWorkspaceTab,
  teacherCourseWorkspaceTabs
} from '@/constants/courseWorkspace';
import WorkspaceScaffold from '@/ui/workspace/WorkspaceScaffold.vue';

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
const currentUser = ref(getCurrentUser() || {});

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
const activeView = computed(() => courseViews[activeTab.value] || CourseChapters);

const menuTabs = teacherCourseWorkspaceTabs.map(tab => ({
  ...tab,
  label: {
    chapters: '章节',
    'knowledge-graph': '知识图谱',
    homework: '作业',
    discussion: '讨论',
    materials: '资料',
    analytics: '学情分析'
  }[tab.key] || tab.label
}));

const currentUserDisplayName = computed(() => {
  return currentUser.value.name || currentUser.value.username || '教师';
});

const courseInfo = ref({
  title: '加载中...',
  description: ''
});

function resolveTab(tabKey) {
  const matchedTab = menuTabs.find(tab => tab.key === tabKey);
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

    courseInfo.value = {
      title: courseData.name || courseData.title || `课程 ${courseId.value}`,
      description: courseData.description || courseData.remark || ''
    };
  } catch (error) {
    courseInfo.value = {
      title: `课程 ${courseId.value}`,
      description: '课程信息暂时没有顺利取回来，但课程内容管理入口还在，先干活不耽误。'
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
    currentUser.value = getCurrentUser() || {};
    syncActiveTab();
    loadCourseInfo();
  },
  { immediate: true }
);
</script>
