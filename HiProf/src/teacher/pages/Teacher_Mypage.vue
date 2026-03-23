<template>
  <WorkspaceShell
    tone="teacher"
    title="教师教学工作台"
    role-label="教师端"
    :tabs="teacherWorkspaceTabs"
    :active-tab="activeTab"
    @change-tab="switchTab"
    @back-home="handleBackToHome"
  >
    <component :is="activeComponent" />
  </WorkspaceShell>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import TeacherAIAssistant from '@/teacher/components/modules/TeacherAIAssistant.vue';
import TeacherCourses from '@/teacher/components/modules/TeacherCourses.vue';
import TeacherSettings from '@/teacher/components/modules/TeacherSettings.vue';
import WorkspaceShell from '@/ui/workspace/WorkspaceShell.vue';
import { useWorkspacePage } from '@/composables/useWorkspacePage';
import { teacherWorkspaceTabs } from '@/constants/workspace';

const teacherModules = {
  courses: TeacherCourses,
  'ai-assistant': TeacherAIAssistant,
  settings: TeacherSettings
};

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

onMounted(() => {
  restoreTab();
});
</script>
