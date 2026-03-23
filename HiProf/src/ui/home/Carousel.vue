<template>
  <div class="carousel-container">
    <div class="carousel" ref="carouselRef">
      <div 
        v-for="(slide, index) in slides" 
        :key="index" 
        class="carousel-slide"
        :class="{ active: currentSlide === index }"
        :style="{ transform: `translateX(${100 * (index - currentSlide)}%)` }"
      >
        <div class="carousel-background" :class="slide.backgroundClass">
        </div>
        <div class="carousel-caption">
          <div class="caption-header">
            <h2 class="carousel-title">{{ slide.title }}</h2>
          </div>
          <p class="carousel-description">{{ slide.description }}</p>
        </div>
      </div>
    </div>
    
    <div class="carousel-controls">
      <button @click="prevSlide" class="carousel-control glass prev">&lt;</button>
      <div class="carousel-indicators">
        <button 
          v-for="(slide, index) in slides" 
          :key="index"
          @click="goToSlide(index)"
          class="carousel-indicator"
          :class="{ active: currentSlide === index }"
        ></button>
      </div>
      <button @click="nextSlide" class="carousel-control glass next">&gt;</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import '@/assets/styles/components/carousel.css';

// 更新轮播图数据，增加更丰富的内容和功能
const slides = ref([
  {
    title: '知识图谱可视化学习',
    description: '通过交互式知识图谱，直观地理解知识点之间的关联，支持多维度知识探索和智能导航',
    backgroundClass: 'bg-knowledge-graph'
  },
  {
    title: '个性化学习路径',
    description: 'AI智能推荐系统根据您的学习情况、目标和偏好，制定最适合的个性化学习路径',
    backgroundClass: 'bg-learning-path'
  },
  {
    title: '知识分享与协作',
    description: '与全球学习者分享您的知识图谱，共同构建和完善知识体系，促进知识的传播与创新',
    backgroundClass: 'bg-collaboration'
  },
  {
    title: 'AI智能学习助手',
    description: '24/7在线AI助手为您提供智能答疑、学习建议、知识点解析和个性化辅导服务',
    backgroundClass: 'bg-ai-assistant'
  },
  {
    title: '学习数据分析',
    description: '深度分析您的学习行为、进度和成效，提供详细的数据报告和智能化改进建议',
    backgroundClass: 'bg-analytics'
  }
]);

const carouselRef = ref(null);
const currentSlide = ref(0);
let autoplayInterval = null;

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slides.value.length;
};

const prevSlide = () => {
  currentSlide.value = (currentSlide.value - 1 + slides.value.length) % slides.value.length;
};

const goToSlide = (index) => {
  currentSlide.value = index;
};

const startAutoplay = () => {
  stopAutoplay();
  autoplayInterval = setInterval(nextSlide, 5000);
};

const stopAutoplay = () => {
  if (autoplayInterval) {
    clearInterval(autoplayInterval);
  }
};

onMounted(() => {
  startAutoplay();
  
  // 鼠标悬停时暂停自动播放
  if (carouselRef.value) {
    carouselRef.value.addEventListener('mouseenter', stopAutoplay);
    carouselRef.value.addEventListener('mouseleave', startAutoplay);
  }
});

onBeforeUnmount(() => {
  stopAutoplay();
  
  // 移除事件监听
  if (carouselRef.value) {
    carouselRef.value.removeEventListener('mouseenter', stopAutoplay);
    carouselRef.value.removeEventListener('mouseleave', startAutoplay);
  }
});
</script> 