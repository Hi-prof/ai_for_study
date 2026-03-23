<template>
  <div class="settings-panel">
    <MySettings />
  </div>
</template>

<script setup>
import MySettings from '@/ui/my/MySettings.vue';
</script>

<style scoped>
/* 设置面板样式 */
.settings-panel {
  flex: 1;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
