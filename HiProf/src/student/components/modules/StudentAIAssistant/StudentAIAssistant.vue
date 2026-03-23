<template>
  <div class="ai-assistant-panel">
    <WorkspaceFeatureGrid :items="studentAssistantItems" @select="handleFeatureSelect" />
  </div>
</template>

<script setup>
import WorkspaceFeatureGrid from '@/ui/workspace/WorkspaceFeatureGrid.vue';
import { studentAssistantItems } from '@/constants/workspace';

const handleAIChatAssistant = () => {
  console.log('AI学习助手');
};

const handleAITutor = () => {
  console.log('AI学习指导');
};

const handleAIPractice = () => {
  console.log('AI练习生成');
};

const handleFeatureSelect = (featureKey) => {
  switch (featureKey) {
    case 'chat':
      handleAIChatAssistant();
      break;
    case 'tutor':
      handleAITutor();
      break;
    case 'practice':
      handleAIPractice();
      break;
    default:
      break;
  }
};
</script>

<style scoped>
.ai-assistant-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
