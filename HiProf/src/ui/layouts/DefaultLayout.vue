<template>
  <div class="default-layout">
    <AppHeader />
    
    <main class="main-content">
      <slot></slot>
    </main>
    
    <AppFooter v-if="!isOutlinePage" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/ui/common/AppHeader.vue';
import AppFooter from '@/ui/common/AppFooter.vue';

const route = useRoute();
const isOutlinePage = computed(() => route.path.includes('/outline'));
</script>

<style scoped>
.default-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

.main-content {
  flex: 1;
  margin: 0;
  padding: 0;
}
</style> 