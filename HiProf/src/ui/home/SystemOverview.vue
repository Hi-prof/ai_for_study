<template>
  <section class="system-overview">
    <div class="container">
      <h2 class="section-title">系统概览</h2>
      <p class="section-description">
        知识图谱系统是一个可视化学习和知识管理平台，帮助用户构建、分享和学习知识体系。
      </p>
      
      <div class="features-grid">
        <div class="feature-card glass-card" v-for="(feature, index) in features" :key="index">
          <div class="feature-icon" :style="{ backgroundColor: feature.color }">
            <span class="icon-placeholder">{{ feature.icon }}</span>
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
          <router-link :to="feature.link" class="feature-link glass-button">
            {{ feature.linkText }} &rarr;
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';

// 系统功能特性数据
const features = ref([
  {
    title: '知识图谱',
    description: '通过可视化图谱直观展示知识点之间的关联，帮助理解复杂知识体系。',
    icon: '🔍',
    color: 'rgba(59, 130, 246, 0.7)',
    link: '/graph',
    linkText: '查看图谱'
  },
  {
    title: '知识大纲',
    description: '树状结构展示知识体系，与图谱视图同步切换，方便不同维度的知识组织。',
    icon: '📋',
    color: 'rgba(16, 185, 129, 0.7)',
    link: '/outline',
    linkText: '浏览大纲'
  },
  {
    title: '学习路径',
    description: '智能推荐个性化学习路径，根据知识点依赖关系优化学习顺序。',
    icon: '🛤️',
    color: 'rgba(139, 92, 246, 0.7)',
    link: '/graph',
    linkText: '开始学习'
  }
]);
</script>

<style scoped>
@import '../../assets/styles/glassmorphism.css';

.system-overview {
  padding: 0;
  position: relative;
  z-index: 5;
}

.section-title {
  font-size: var(--font-size-xxlarge);
  margin-bottom: var(--spacing-xs);
  text-align: center;
  color: rgba(0, 0, 0, 0.85);
  position: relative;
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.5);
}

.section-title::after {
  content: "";
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.2), transparent);
}

.section-description {
  font-size: var(--font-size-medium);
  color: rgba(0, 0, 0, 0.7);
  text-align: center;
  max-width: 800px;
  margin: 0 auto var(--spacing-sm);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.feature-card {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-lg);
  height: 100%;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: var(--glass-transition);
}

.feature-icon {
  width: 60px;
  height: 60px;
  border-radius: var(--border-radius-round);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-md);
  color: white;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.icon-placeholder {
  font-size: 28px;
}

.feature-title {
  font-size: var(--font-size-large);
  margin-bottom: var(--spacing-sm);
  color: rgba(0, 0, 0, 0.85);
}

.feature-description {
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: var(--spacing-md);
  flex-grow: 1;
}

.feature-link {
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  align-self: flex-start;
  padding: 8px 16px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style> 