<template>
  <div 
    class="module-card" 
    :class="[`${type}-card`, { 'clickable': clickable }]"
    @click="handleClick"
  >
    <!-- 卡片头部 -->
    <div class="module-header">
      <div class="module-icon" :class="`${iconType}-icon`">
        <i :class="iconClass"></i>
      </div>
      <div v-if="badge" class="module-badge" :class="badgeType">{{ badge }}</div>
    </div>
    
    <!-- 卡片内容 -->
    <div class="module-content">
      <h3 class="module-title">{{ title }}</h3>
      <p class="module-desc">{{ description }}</p>
      
      <!-- 统计信息 -->
      <div v-if="stats && stats.length > 0" class="module-stats">
        <div 
          v-for="stat in stats" 
          :key="stat.label" 
          class="stat-item"
        >
          <span class="stat-label">{{ stat.label }}</span>
          <span class="stat-value">{{ stat.value }}</span>
        </div>
      </div>
    </div>
    
    <!-- 卡片底部 -->
    <div v-if="showFooter" class="module-footer">
      <slot name="footer">
        <button 
          class="module-btn" 
          :class="buttonClass"
          @click.stop="handleButtonClick"
        >
          {{ buttonText }}
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// 定义props
const props = defineProps({
  // 基本信息
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'default' // default, lesson-design, my-lessons, courseware, question-bank, homework, discussion, analysis, ai-lesson, ai-ppt, ai-chat
  },
  
  // 图标相关
  iconType: {
    type: String,
    default: 'default'
  },
  iconClass: {
    type: String,
    default: ''
  },
  
  // 徽章
  badge: {
    type: String,
    default: ''
  },
  badgeType: {
    type: String,
    default: '' // recent, hot, ai, etc.
  },
  
  // 统计信息
  stats: {
    type: Array,
    default: () => []
  },
  
  // 按钮相关
  showFooter: {
    type: Boolean,
    default: true
  },
  buttonText: {
    type: String,
    default: '查看详情'
  },
  buttonClass: {
    type: String,
    default: 'btn-blue'
  },
  
  // 交互相关
  clickable: {
    type: Boolean,
    default: true
  }
});

// 定义事件
const emit = defineEmits(['click', 'button-click']);

// 处理卡片点击
const handleClick = () => {
  if (props.clickable) {
    emit('click');
  }
};

// 处理按钮点击
const handleButtonClick = () => {
  emit('button-click');
};
</script>

<style scoped>
/* 模块卡片基础样式 */
.module-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f0f0f0;
  overflow: hidden;
  min-height: 280px;
}

.module-card.clickable {
  cursor: pointer;
}

.module-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border-color: #d1d5db;
}

.module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 1rem;
  position: relative;
}

.module-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 图标颜色主题 */
.lesson-design-icon {
  background: linear-gradient(135deg, #4F9CF9 0%, #3B82F6 100%);
}

.my-lessons-icon {
  background: linear-gradient(135deg, #A855F7 0%, #8B5CF6 100%);
}

.courseware-icon {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
}

.question-bank-icon {
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
}

.homework-icon {
  background: linear-gradient(135deg, #4F9CF9 0%, #3B82F6 100%);
}

.discussion-icon {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
}

.analysis-icon {
  background: linear-gradient(135deg, #A855F7 0%, #8B5CF6 100%);
}

.ai-lesson-icon {
  background: linear-gradient(135deg, #4F9CF9 0%, #3B82F6 100%);
}

.ai-ppt-icon {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
}

.ai-chat-icon {
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
}

.default-icon {
  background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%);
}

.module-icon i {
  font-size: 24px;
  color: white;
}

.module-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #f3f4f6;
  color: #6b7280;
}

.module-badge.recent {
  background: #fef3c7;
  color: #d97706;
}

.module-badge.hot {
  background: #fee2e2;
  color: #dc2626;
}

.module-badge.ai {
  background: #e0e7ff;
  color: #6366f1;
}

.module-content {
  flex: 1;
  padding: 0 1.5rem 1rem;
  text-align: left;
}

.module-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.module-desc {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

.module-stats {
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-label {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
}

.module-footer {
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid #f3f4f6;
  background: rgba(249, 250, 251, 0.5);
}

.module-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* 按钮颜色主题 */
.btn-blue {
  background: #3B82F6;
  color: white;
}

.btn-blue:hover {
  background: #2563EB;
}

.btn-purple {
  background: #8B5CF6;
  color: white;
}

.btn-purple:hover {
  background: #7C3AED;
}

.btn-green {
  background: #10B981;
  color: white;
}

.btn-green:hover {
  background: #059669;
}

.btn-orange {
  background: #F59E0B;
  color: white;
}

.btn-orange:hover {
  background: #D97706;
}

.btn-gray {
  background: #6B7280;
  color: white;
}

.btn-gray:hover {
  background: #4B5563;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .module-card {
    min-height: 240px;
  }
  
  .module-header {
    padding: 1.25rem 1.25rem 0.75rem;
  }
  
  .module-content {
    padding: 0 1.25rem 0.75rem;
  }
  
  .module-footer {
    padding: 0.75rem 1.25rem 1.25rem;
  }
  
  .module-icon {
    width: 50px;
    height: 50px;
  }
  
  .module-icon i {
    font-size: 20px;
  }
}
</style>
