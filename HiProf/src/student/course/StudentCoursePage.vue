<template>
  <main class="student-course-workspace">
    <header class="student-course-workspace__topbar">
      <div class="student-course-workspace__brand-group">
        <button
          type="button"
          class="student-course-workspace__return-button"
          @click="handleBackToCourses"
        >
          <WorkspaceIcon name="arrowLeft" :size="16" />
          <span>返回我的课程</span>
        </button>

        <div class="student-course-workspace__brand-copy">
          <strong>八闽慧教</strong>
          <small>学生课程工作台</small>
        </div>
      </div>

      <div class="student-course-workspace__user-copy">
        <strong>{{ currentUserDisplayName }}</strong>
        <small>学生端</small>
      </div>
    </header>

    <div class="student-course-workspace__shell">
      <aside class="student-course-workspace__sidebar" aria-label="学生课程导航">
        <div class="student-course-workspace__sidebar-header">
          <h1>{{ courseInfo.title }}</h1>
          <p>{{ courseInfo.description }}</p>

          <div class="student-course-workspace__meta">
            <span class="student-course-workspace__meta-item">
              <WorkspaceIcon name="teacher" :size="14" />
              <span>{{ courseInfo.teacher }}</span>
            </span>
            <span class="student-course-workspace__meta-item">
              <WorkspaceIcon name="progress" :size="14" />
              <span>学习进度 {{ courseInfo.progress }}%</span>
            </span>
          </div>
        </div>

        <nav class="student-course-workspace__nav">
          <button
            v-for="tab in studentCourseWorkspaceTabs"
            :key="tab.key"
            type="button"
            class="student-course-workspace__nav-item"
            :class="{ 'is-active': activeTab === tab.key }"
            :aria-current="activeTab === tab.key ? 'page' : undefined"
            @click="switchTab(tab.key)"
          >
            <span class="student-course-workspace__nav-icon">
              <WorkspaceIcon :name="tab.icon" :size="18" />
            </span>
            <span class="student-course-workspace__nav-copy">
              <strong>{{ tab.label }}</strong>
              <small>{{ tab.description }}</small>
            </span>
          </button>
        </nav>
      </aside>

      <section class="student-course-workspace__panel">
        <div class="student-course-workspace__panel-body">
          <component :is="activeView" :course-id="courseId" />
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { getCurrentUser } from '@/api/auth';
import { getCourseById } from '@/api/courses';
import StudentChapters from '@/student/components/modules/StudentCourses/chapters/StudentChapters.vue';
import StudentDiscussions from '@/student/components/modules/StudentCourses/discussions/StudentDiscussions.vue';
import StudentHomework from '@/student/components/modules/StudentCourses/homework/StudentHomework.vue';
import StudentKnowledgeGraph from '@/student/components/modules/StudentCourses/knowledgegraph/StudentKnowledgeGraph.vue';
import StudentMaterials from '@/student/components/modules/StudentCourses/materials/StudentMaterials.vue';
import WorkspaceIcon from '@/ui/workspace/WorkspaceIcon.vue';

import '@/student/styles/variables.css';
import '@/student/styles/student-course-workspace.css';

const defaultStudentCourseWorkspaceTab = 'chapters';

const studentCourseWorkspaceTabs = [
  {
    key: 'chapters',
    label: '课程章节',
    description: '按章节进入课程内容',
    icon: 'chapters'
  },
  {
    key: 'homework',
    label: '课程作业',
    description: '查看提交状态和截止时间',
    icon: 'homework'
  },
  {
    key: 'knowledge-graph',
    label: '知识图谱',
    description: '浏览课程知识结构',
    icon: 'knowledgeGraph'
  },
  {
    key: 'materials',
    label: '课程资料',
    description: '下载老师分享的资料',
    icon: 'materials'
  },
  {
    key: 'discussion',
    label: '课程讨论',
    description: '参与课程讨论交流',
    icon: 'discussion'
  }
];

const legacyTabMap = {
  discussions: 'discussion'
};

const route = useRoute();
const router = useRouter();
const currentUser = ref(getCurrentUser() || {});

const courseViews = {
  chapters: StudentChapters,
  homework: StudentHomework,
  'knowledge-graph': StudentKnowledgeGraph,
  materials: StudentMaterials,
  discussion: StudentDiscussions
};

const activeTab = ref(defaultStudentCourseWorkspaceTab);
const courseId = computed(() => String(route.params.courseId || ''));
const courseStorageKey = computed(() => `student-course-detail-active-tab-${courseId.value}`);
const activeView = computed(() => {
  return courseViews[activeTab.value] || StudentChapters;
});

const currentUserDisplayName = computed(() => {
  return currentUser.value.name || currentUser.value.username || '学生';
});

const courseInfo = ref({
  title: '加载中...',
  teacher: '授课教师待加载',
  progress: 0,
  description: '课程信息正在同步。'
});

function resolveTab(tabKey) {
  const normalizedKey = legacyTabMap[tabKey] || tabKey;
  const matchedTab = studentCourseWorkspaceTabs.find(tab => tab.key === normalizedKey);
  return matchedTab ? matchedTab.key : defaultStudentCourseWorkspaceTab;
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
      teacher: courseData.teacherName || courseData.teacher || '授课教师待补充',
      progress: Number(courseData.progress || 0),
      description: courseData.description || '课程信息已经整理到学生工作台，学习入口和资料、作业、讨论都分开维护。'
    };
  } catch (error) {
    courseInfo.value = {
      title: `课程 ${courseId.value}`,
      teacher: '授课教师待补充',
      progress: 0,
      description: '课程信息暂时没有顺利取回来，但学习入口还在，不影响继续进入各个模块。'
    };
  }
}

function switchTab(tabKey) {
  const nextTab = resolveTab(tabKey);
  const currentQueryTab = typeof route.query.tab === 'string' ? resolveTab(route.query.tab) : '';

  if (activeTab.value === nextTab && currentQueryTab === nextTab) {
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
  router.push('/student/my');
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
