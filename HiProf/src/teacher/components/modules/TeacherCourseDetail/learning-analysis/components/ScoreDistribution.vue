<template>
  <div class="analytics-card">
    <div class="card-header">
      <h3 class="card-title">成绩分布分析</h3>
      <div class="card-actions">
        <select v-model="selectedScoreItem" class="score-item-select">
          <option value="">综合成绩</option>
          <option
            v-for="item in scoreItems"
            :key="item.id"
            :value="item.id"
          >
            {{ item.itemName }}
          </option>
        </select>
      </div>
    </div>
    
    <div class="card-content">
      <div class="score-distribution">
        <div
          v-for="range in scoreRanges"
          :key="range.label"
          class="distribution-item"
        >
          <span class="grade-range">{{ range.label }}</span>
          <div class="grade-bar">
            <div
              class="grade-fill"
              :class="range.class"
              :style="`width: ${range.percentage}%`"
            ></div>
          </div>
          <span class="grade-count">{{ range.count }}人 ({{ range.percentage.toFixed(1) }}%)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { calculateScoreRanges } from '../composables/useAnalyticsUtils'

// 定义props
const props = defineProps({
  summaries: {
    type: Array,
    default: () => []
  },
  scoreItems: {
    type: Array,
    default: () => []
  }
})

// 响应式数据
const selectedScoreItem = ref('')

// 计算属性 - 成绩分布区间
const scoreRanges = computed(() => {
  // 目前只支持综合成绩分布，后续可扩展支持单项成绩分布
  return calculateScoreRanges(props.summaries)
})
</script>
