<template>
  <WorkspaceScaffold
    tone="teacher"
    title="八闽慧教"
    subtitle="教师教学工作台"
    sidebar-title="教师教学工作台"
    sidebar-description="课程管理、AI 教学助手与账号设置统一收口到同一工作区。"
    role-label="教师端"
    :user-name="currentUserDisplayName"
    :tabs="teacherWorkspaceTabs"
    :active-tab="activeTab"
    :show-nav-descriptions="true"
    @change-tab="switchTab"
    @back="handleBackToHome"
  >
    <div class="teacher-home-workspace__panel-body">
      <component :is="activeComponent" />
    </div>
  </WorkspaceScaffold>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { getCurrentUser } from '@/api/auth';
import TeacherAIAssistant from '@/teacher/features/home/TeacherAIAssistant.vue';
import TeacherCourses from '@/teacher/features/home/TeacherCourses.vue';
import TeacherSettings from '@/teacher/features/home/TeacherSettings.vue';
import WorkspaceScaffold from '@/ui/workspace/WorkspaceScaffold.vue';
import { useWorkspacePage } from '@/shared/composables/useWorkspacePage';
import { teacherWorkspaceTabs } from '@/constants/workspace';

const teacherModules = {
  courses: TeacherCourses,
  'ai-assistant': TeacherAIAssistant,
  settings: TeacherSettings
};

const currentUser = ref(getCurrentUser() || {});

const {
  activeTab,
  switchTab,
  restoreTab,
  handleBackToHome
} = useWorkspacePage({
  defaultTab: 'courses',
  storageKey: 'teacher-active-tab',
  tabs: teacherWorkspaceTabs
});

const activeComponent = computed(() => {
  return teacherModules[activeTab.value] || TeacherCourses;
});

const currentUserDisplayName = computed(() => {
  return currentUser.value.name || currentUser.value.username || '教师';
});

onMounted(() => {
  currentUser.value = getCurrentUser() || {};
  restoreTab();
});
</script>

<style scoped>
.teacher-home-workspace__panel-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px;
}

.teacher-home-workspace__panel-body > * {
  flex: 1;
  min-height: 0;
}

@media (max-width: 900px) {
  .teacher-home-workspace__panel-body {
    padding: 12px;
  }
}
</style>
