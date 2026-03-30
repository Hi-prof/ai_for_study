<template>
  <DefaultLayout>
    <div class="glass-morphic-bg homepage-container">
      <!-- 彩色光斑背景效果 - Context7 增强版 -->
      <div class="glass-orb glass-orb-1"></div>
      <div class="glass-orb glass-orb-2"></div>
      <div class="glass-orb glass-orb-3"></div>
      <div class="glass-orb glass-orb-4"></div>
      
      <div class="hero-announcement-section">
        <div id="announcement" class="glass announcement-wrapper announcement">
          <AnnouncementBar />
        </div>
        
        <section class="hero-section">
          <div class="container hero-container">
            <Carousel />
          </div>
        </section>
      </div>
    
      <section id="system-overview" class="system-overview">
        <SystemOverview />
      </section>
    
      <section id="popular-graphs" class="popular-graphs">
        <PopularGraphCard />
      </section>
    
      <section id="interactive-demo" class="interactive-demo">
        <InteractiveDemo />
      </section>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { onMounted, nextTick } from 'vue';
import DefaultLayout from '@/ui/layouts/DefaultLayout.vue';
import AnnouncementBar from '@/ui/home/AnnouncementBar.vue';
import Carousel from '@/ui/home/Carousel.vue';
import SystemOverview from '@/ui/home/SystemOverview.vue';
import PopularGraphCard from '@/ui/home/PopularGraphCard.vue';
import InteractiveDemo from '@/ui/home/InteractiveDemo.vue';

// 处理页面加载和路由跳转
onMounted(() => {
  // 检查是否有锚点需要跳转
  nextTick(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300); // 给页面组件足够时间渲染
    } else {
      // 只有在没有锚点的情况下才滚动到顶部
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  });
});
</script>

<style scoped>
@import '@/assets/styles/glassmorphism.css';

/* Add styles for better section spacing */
html {
  scroll-behavior: smooth;
}

.homepage-container {
  min-height: 100vh;
  background: linear-gradient(135deg, 
    rgba(224, 242, 254, 0.8) 0%, 
    rgba(240, 253, 250, 0.8) 25%,
    rgba(254, 249, 195, 0.8) 50%,
    rgba(250, 232, 255, 0.8) 75%,
    rgba(239, 246, 255, 0.8) 100%);
  position: relative;
  backdrop-filter: blur(var(--glass-blur, 16px));
  -webkit-backdrop-filter: blur(var(--glass-blur, 16px));
}

/* 添加微妙的网格背景 */
.homepage-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 1;
}

.homepage-container section {
  padding: 0; /* 完全消除所有section的padding */
  margin: 0; /* 完全消除所有section的margin */
  position: relative;
  z-index: 2;
}

.homepage-container section:first-of-type,
.hero-announcement-section {
  padding-top: 0; /* 完全消除顶部padding */
  margin-top: 0; /* 完全消除顶部margin */
}

.hero-announcement-section {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  z-index: 2;
  margin: 0;
  padding: 0;
}

.hero-section {
  flex: 1;
  min-width: 0;
  padding: 0;
  position: relative;
  margin: 0;
}

.hero-container {
  max-width: 100%;
  margin: 0;
  padding: 0;
}

.announcement-wrapper {
  width: 100%;
  min-height: 60px; /* 进一步减小高度，从80px减少到60px */
  position: relative;
  border-radius: 8px; /* 减小圆角，从12px到8px */
  z-index: 10;
  margin: 0;
  padding: var(--spacing-xs) 0; /* 进一步减小内边距，从sm改为xs */
  display: flex;
  flex-direction: column;
  justify-content: center; /* 确保内容垂直居中 */
}

/* 全局紧凑模式 */
.homepage-container .container {
  padding-left: var(--spacing-xs);
  padding-right: var(--spacing-xs);
}

@media (max-width: 768px) {
  .hero-announcement-section {
    flex-direction: column;
  }
  
  .announcement-wrapper {
    flex: none;
    width: 100%;
    height: 300px;
    margin: 0;
  }
  
  .homepage-container .container {
    padding-left: var(--spacing-xs);
    padding-right: var(--spacing-xs);
  }
}
</style>

<style>
/* 全局样式 - 确保平滑滚动行为 */
html {
  scroll-behavior: smooth;
}
</style>
