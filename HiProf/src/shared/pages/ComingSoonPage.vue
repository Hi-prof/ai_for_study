<template>
  <DefaultLayout>
    <div class="glass-morphic-bg coming-soon-container">
      <!-- 彩色光斑背景效果 -->
      <div class="glass-orb glass-orb-1"></div>
      <div class="glass-orb glass-orb-2"></div>
      <div class="glass-orb glass-orb-3"></div>
      <div class="glass-orb glass-orb-4"></div>
      
      <div class="coming-soon-content">
        <div class="container">
          <div class="content-card glass-card">
            <div class="icon-container">
              <span class="coming-soon-icon">🚧</span>
            </div>
            
            <h1 class="coming-soon-title">{{ pageTitle }}</h1>
            <h2 class="coming-soon-subtitle">功能开发中</h2>
            
            <p class="coming-soon-description">
              我们正在努力开发这个功能，为您提供更好的使用体验。
              <br>
              敬请期待，即将与您见面！
            </p>
            
            <div class="action-buttons">
              <button @click="goBack" class="glass-button primary">
                返回上一页
              </button>
              <router-link to="/" class="glass-button outline">
                回到首页
              </router-link>
            </div>
            
            <div class="progress-info">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
              </div>
              <p class="progress-text">开发进度: {{ progressPercentage }}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DefaultLayout from '@/ui/layouts/DefaultLayout.vue';

const route = useRoute();
const router = useRouter();

// 根据路由确定页面标题
const pageTitle = computed(() => {
  switch (route.name) {
    case 'ai-assistant':
      return 'AI智能助手';
    case 'lesson-preparation':
      return '教师教学助手';
    default:
      return '功能开发中';
  }
});

// 模拟开发进度
const progressPercentage = ref(0);

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    router.push('/');
  }
};

// 页面加载时的动画效果
onMounted(() => {
  // 模拟进度条动画
  const targetProgress = Math.floor(Math.random() * 30) + 15; // 15-45% 的随机进度
  let currentProgress = 0;
  const interval = setInterval(() => {
    currentProgress += 1;
    progressPercentage.value = currentProgress;
    if (currentProgress >= targetProgress) {
      clearInterval(interval);
    }
  }, 50);
});
</script>

<style scoped>
@import '@/assets/styles/glassmorphism.css';

.coming-soon-container {
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.coming-soon-container::after {
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

.coming-soon-content {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: var(--spacing-xl) 0;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.content-card {
  padding: var(--spacing-xxl);
  text-align: center;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.icon-container {
  margin-bottom: var(--spacing-xl);
}

.coming-soon-icon {
  font-size: 5rem;
  display: inline-block;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.coming-soon-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  color: rgba(0, 0, 0, 0.9);
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.5);
}

.coming-soon-subtitle {
  font-size: 1.5rem;
  font-weight: 500;
  margin-bottom: var(--spacing-lg);
  color: rgba(0, 0, 0, 0.7);
}

.coming-soon-description {
  font-size: 1.1rem;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: var(--spacing-xl);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.glass-button {
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  text-decoration: none;
  display: inline-block;
  transition: var(--glass-transition);
}

.glass-button.primary {
  background: rgba(59, 130, 246, 0.7);
  color: white;
  border: 1px solid rgba(59, 130, 246, 0.8);
}

.glass-button.primary:hover {
  background: rgba(59, 130, 246, 0.8);
  transform: translateY(-2px);
}

.glass-button.outline {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.glass-button.outline:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.progress-info {
  margin-top: var(--spacing-lg);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: var(--spacing-sm);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.9rem;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .coming-soon-title {
    font-size: 2rem;
  }
  
  .coming-soon-subtitle {
    font-size: 1.25rem;
  }
  
  .content-card {
    padding: var(--spacing-xl);
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .glass-button {
    width: 200px;
  }
}

@media (max-width: 480px) {
  .coming-soon-title {
    font-size: 1.75rem;
  }
  
  .coming-soon-icon {
    font-size: 4rem;
  }
  
  .container {
    padding: 0 var(--spacing-md);
  }
}
</style>
