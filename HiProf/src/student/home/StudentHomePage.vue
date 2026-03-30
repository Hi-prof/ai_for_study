<template>
  <main class="student-home-workspace">
    <header class="student-home-workspace__topbar">
      <div class="student-home-workspace__brand-group">
        <button
          type="button"
          class="student-home-workspace__return-button"
          @click="handleBackToHome"
        >
          <WorkspaceIcon name="arrowLeft" :size="16" />
          <span>返回首页</span>
        </button>

        <div class="student-home-workspace__brand-copy">
          <strong>八闽慧教</strong>
          <small>学生学习工作台</small>
        </div>
      </div>

      <div class="student-home-workspace__user-copy">
        <strong>{{ currentUserDisplayName }}</strong>
        <small>学生端</small>
      </div>
    </header>

    <div class="student-home-workspace__shell">
      <aside class="student-home-workspace__sidebar" aria-label="学生工作台导航">
        <div class="student-home-workspace__sidebar-header">
          <h1>学生学习工作台</h1>
          <p>课程学习、AI 辅助与账号设置统一收口，结构和教师端保持同样清晰的维护边界。</p>
        </div>

        <nav class="student-home-workspace__nav">
          <button
            v-for="tab in studentWorkspaceTabs"
            :key="tab.key"
            type="button"
            class="student-home-workspace__nav-item"
            :class="{ 'is-active': activeTab === tab.key }"
            :aria-current="activeTab === tab.key ? 'page' : undefined"
            @click="switchTab(tab.key)"
          >
            <span class="student-home-workspace__nav-icon">
              <WorkspaceIcon :name="tab.icon" :size="18" />
            </span>
            <span class="student-home-workspace__nav-copy">
              <strong>{{ tab.label }}</strong>
              <small>{{ tab.description }}</small>
            </span>
          </button>
        </nav>
      </aside>

      <section class="student-home-workspace__panel">
        <div class="student-home-workspace__panel-body">
          <component :is="activeComponent" />
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { getCurrentUser } from '@/api/auth';
import { studentWorkspaceTabs } from '@/constants/workspace';
import { useWorkspacePage } from '@/shared/composables/useWorkspacePage';
import StudentAIAssistant from '@/student/components/modules/StudentAIAssistant/StudentAIAssistant.vue';
import StudentCourses from '@/student/components/modules/StudentCourses/StudentCourses.vue';
import StudentSettings from '@/student/components/modules/StudentSettings/StudentSettings.vue';
import WorkspaceIcon from '@/ui/workspace/WorkspaceIcon.vue';

import '@/student/styles/variables.css';
import '@/student/styles/student-home-workspace.css';

const route = useRoute();

const studentModules = {
  courses: StudentCourses,
  'ai-assistant': StudentAIAssistant,
  settings: StudentSettings
};

const currentUser = ref(getCurrentUser() || {});

const initialTab = computed(() => {
  return typeof route.query.tab === 'string' ? route.query.tab : '';
});

const {
  activeTab,
  switchTab,
  restoreTab,
  handleBackToHome
} = useWorkspacePage({
  defaultTab: 'courses',
  storageKey: 'student-active-tab',
  tabs: studentWorkspaceTabs,
  initialTab
});

const activeComponent = computed(() => {
  return studentModules[activeTab.value] || StudentCourses;
});

const currentUserDisplayName = computed(() => {
  return currentUser.value.name || currentUser.value.username || '学生';
});

onMounted(() => {
  currentUser.value = getCurrentUser() || {};
  restoreTab();
});
</script>
