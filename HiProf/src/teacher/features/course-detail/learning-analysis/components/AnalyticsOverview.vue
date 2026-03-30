<template>
  <div class="overview-stats">
    <div class="stat-card primary">
      <div class="stat-icon">
        <i class="students-icon"></i>
      </div>
      <div class="stat-content">
        <div class="stat-number">{{ stats.totalStudents }}</div>
        <div class="stat-label">参与学生</div>
      </div>
    </div>
    
    <div class="stat-card success">
      <div class="stat-icon">
        <i class="score-icon"></i>
      </div>
      <div class="stat-content">
        <div class="stat-number">{{ stats.averageScore.toFixed(1) }}</div>
        <div class="stat-label">平均分</div>
      </div>
    </div>
    
    <div class="stat-card warning">
      <div class="stat-icon">
        <i class="items-icon"></i>
      </div>
      <div class="stat-content">
        <div class="stat-number">{{ stats.totalItems }}</div>
        <div class="stat-label">评分项目</div>
      </div>
    </div>
    
    <div class="stat-card info">
      <div class="stat-icon">
        <i class="records-icon"></i>
      </div>
      <div class="stat-content">
        <div class="stat-number">{{ stats.totalRecords }}</div>
        <div class="stat-label">评分记录</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// 定义props
const props = defineProps({
  summaries: {
    type: Array,
    default: () => []
  },
  scoreItems: {
    type: Array,
    default: () => []
  },
  scoreRecords: {
    type: Array,
    default: () => []
  }
})

// 计算统计数据
const stats = computed(() => {
  if (!props.summaries.length) {
    return {
      totalStudents: 0,
      averageScore: 0,
      totalItems: props.scoreItems.length,
      totalRecords: props.scoreRecords.length
    }
  }

  const totalScore = props.summaries.reduce((sum, s) => sum + (s.totalScore || 0), 0)
  return {
    totalStudents: props.summaries.length,
    averageScore: totalScore / props.summaries.length,
    totalItems: props.scoreItems.length,
    totalRecords: props.scoreRecords.length
  }
})
</script>
