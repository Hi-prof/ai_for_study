<template>
  <main class="teacher-course-workspace">
    <header class="teacher-course-workspace__topbar">
      <div class="teacher-course-workspace__brand-group">
        <button
          type="button"
          class="teacher-course-workspace__return-button"
          @click="handleBackToCourses"
        >
          <WorkspaceIcon name="arrowLeft" :size="16" />
          <span>返回课程列表</span>
        </button>

        <div class="teacher-course-workspace__brand" aria-label="八闽慧教教师课程工作台">
          <span class="teacher-course-workspace__brand-copy">
            <strong>八闽慧教</strong>
            <small>教师课程工作台</small>
          </span>
        </div>
      </div>

      <div class="teacher-course-workspace__user teacher-course-workspace__user--text-only">
        <span class="teacher-course-workspace__user-copy">
          <strong>{{ currentUserDisplayName }}</strong>
          <small>教师端</small>
        </span>
      </div>
    </header>

    <div class="teacher-course-workspace__shell">
      <aside class="teacher-course-workspace__sidebar" aria-label="课程工作台导航">
        <div class="teacher-course-workspace__sidebar-header">
          <h1>{{ courseInfo.title }}</h1>
        </div>

        <nav class="teacher-course-workspace__nav">
          <button
            v-for="tab in menuTabs"
            :key="tab.key"
            type="button"
            class="teacher-course-workspace__nav-item"
            :class="{ 'is-active': activeTab === tab.key }"
            :aria-current="activeTab === tab.key ? 'page' : undefined"
            @click="switchTab(tab.key)"
          >
            <span class="teacher-course-workspace__nav-icon">
              <WorkspaceIcon :name="tab.icon" :size="18" />
            </span>
            <span class="teacher-course-workspace__nav-label">{{ tab.label }}</span>
          </button>
        </nav>
      </aside>

      <section id="teacher-course-panel" class="teacher-course-workspace__panel">
        <div class="teacher-course-workspace__panel-body">
          <component :is="activeView" :course-id="courseId" />
        </div>
      </section>
    </div>
  </main>
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
import WorkspaceIcon from '@/ui/workspace/WorkspaceIcon.vue';

import CourseChapters from '@/teacher/components/modules/TeacherCourseDetail/chapter/CourseChapters.vue';
import CourseKnowledgeGraph from '@/teacher/components/modules/TeacherCourseDetail/knowledgegraph/CourseKnowledgeGraph.vue';
import CourseHomework from '@/teacher/components/modules/TeacherCourseDetail/homework/CourseHomework.vue';
import CourseDiscussion from '@/teacher/components/modules/TeacherCourseDetail/discussion/CourseDiscussion.vue';
import CourseMaterials from '@/teacher/components/modules/TeacherCourseDetail/CourseMaterials.vue';
import CourseAnalytics from '@/teacher/components/modules/TeacherCourseDetail/learning-analysis/WCourseAnalytics.vue';

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
