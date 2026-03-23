<template>
  <WorkspaceShell
    tone="student"
    title="学生学习工作台"
    description="学生端入口重新收拢成一套更稳定的学习界面，课程、AI 辅助和设置切换更直观，不用东一榔头西一棒子。"
    role-label="学生端"
    :tabs="studentWorkspaceTabs"
    :active-tab="activeTab"
    @change-tab="switchTab"
    @back-home="handleBackToHome"
  >
    <component :is="activeComponent" />
  </WorkspaceShell>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import StudentAIAssistant from '@/student/components/modules/StudentAIAssistant/StudentAIAssistant.vue';
import StudentCourses from '@/student/components/modules/StudentCourses/StudentCourses.vue';
import StudentSettings from '@/student/components/modules/StudentSettings/StudentSettings.vue';
import WorkspaceShell from '@/ui/workspace/WorkspaceShell.vue';
import { useWorkspacePage } from '@/composables/useWorkspacePage';
import { studentWorkspaceTabs } from '@/constants/workspace';

const route = useRoute();

const studentModules = {
  courses: StudentCourses,
  'ai-assistant': StudentAIAssistant,
  settings: StudentSettings
};

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

onMounted(() => {
  restoreTab();
});
</script>
