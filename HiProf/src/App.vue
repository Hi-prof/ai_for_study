<template>
  <div id="app">
    <ErrorBoundary>
      <router-view />
    </ErrorBoundary>
    <NotificationToast />
  </div>
</template>

<script setup>
// 导入全局样式
import '@/assets/styles/variables.css';
import '@/assets/styles/theme.css';
import '@/assets/styles/global.css';
import '@/assets/styles/glassmorphism.css';

// 导入全局组件
import ErrorBoundary from '@/ui/common/ErrorBoundary.vue';
import NotificationToast from '@/ui/common/NotificationToast.vue';

import { onMounted, watch, nextTick } from 'vue';
import { createApp } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// 监听路由变化，确保首页滚动到顶部
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/') {
      // 等待DOM更新后再滚动
      nextTick(() => {
        window.scrollTo(0, 0);
      });
    }
  }
);

onMounted(() => {
  // 首次加载时，如果是首页则滚动到顶部
  if (route.path === '/') {
    // 立即滚动到顶部
    window.scrollTo(0, 0);
    
    // 确保在所有内容加载后再次滚动到顶部
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  }


});
</script>

<style>
/* 全局样式已通过import导入 */
</style>
