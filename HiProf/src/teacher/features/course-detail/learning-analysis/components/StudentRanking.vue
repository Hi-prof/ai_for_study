<template>
  <div class="analytics-card full-width">
    <div class="card-header">
      <h3 class="card-title">学生成绩排名</h3>
      <div class="card-actions">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索学生..."
            class="search-input"
          >
          <i class="search-icon"></i>
        </div>
      </div>
    </div>
    
    <div class="card-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-message">
        <p>正在加载学生成绩数据...</p>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="error" class="error-message">
        <p>{{ error }}</p>
        <button class="btn btn-link" @click="loadSummaries">重试</button>
      </div>
      
      <!-- 无数据状态 -->
      <div v-else-if="filteredStudents.length === 0" class="no-students-message">
        <p>{{ searchQuery ? '未找到匹配的学生' : '暂无学生成绩数据' }}</p>
      </div>
      
      <!-- 数据表格 -->
      <div v-else class="students-table">
        <div class="table-header">
          <div class="header-cell rank">排名</div>
          <div class="header-cell student">学生</div>
          <div class="header-cell regular-score">常规分</div>
          <div class="header-cell extra-score">额外分</div>
          <div class="header-cell penalty-score">扣分</div>
          <div class="header-cell actions">操作</div>
          <div class="header-cell total-score">总分</div>
        </div>
        
        <div class="table-body">
          <div
            v-for="summary in filteredStudents"
            :key="summary.studentId"
            class="table-row"
            :class="{ 'top-performer': summary.ranking <= 3 }"
          >
            <div class="table-cell rank">
              <span class="rank-number" :class="getRankClass(summary.ranking)">
                {{ summary.ranking }}
              </span>
            </div>
            
            <div class="table-cell student">
              <div class="student-info">
                <div class="student-details">
                  <span class="student-name">学生</span>
                  <span class="student-id">ID: {{ summary.studentId }}</span>
                </div>
              </div>
            </div>
            
            <div class="table-cell regular-score">
              <span class="score-value">
                {{ summary.regularScore.toFixed(1) }}
              </span>
            </div>
            
            <div class="table-cell extra-score">
              <span class="score-value extra">
                +{{ summary.extraScore.toFixed(1) }}
              </span>
            </div>
            
            <div class="table-cell penalty-score">
              <span class="score-value penalty">
                -{{ summary.penaltyScore.toFixed(1) }}
              </span>
            </div>
            
            <div class="table-cell actions">
              <button
                class="action-btn"
                @click="handleViewDetail(summary)"
                title="查看详情"
              >
                <i class="view-icon"></i>
              </button>
            </div>

            <div class="table-cell total-score">
              <span class="score-value total" :class="getScoreClass(summary.totalScore)">
                {{ summary.totalScore.toFixed(1) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getSummariesList } from '@/api/summaries'
import { 
  getScoreClass, 
  getRankClass, 
  viewStudentDetail
} from '../composables/useAnalyticsUtils'

// 定义props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
})

// 定义emits
const emit = defineEmits(['view-student-detail'])

// 响应式数据
const searchQuery = ref('')
const loading = ref(false)
const error = ref('')
const summaries = ref([])

// 加载分值统计数据
const loadSummaries = async () => {
  if (!props.courseId) return
  
  loading.value = true
  error.value = ''
  
  try {
    console.log('加载学生成绩排名，课程ID:', props.courseId)
    const response = await getSummariesList({ courseId: props.courseId })
    
    if (response.code === 200) {
      summaries.value = response.rows || []
      console.log('学生成绩排名加载成功:', summaries.value)
    } else {
      error.value = response.message || '获取学生成绩数据失败'
      console.error('获取学生成绩失败:', response)
    }
  } catch (err) {
    error.value = '网络错误，请稍后重试'
    console.error('加载学生成绩排名失败:', err)
  } finally {
    loading.value = false
  }
}

// 计算属性 - 过滤后的学生列表
const filteredStudents = computed(() => {
  if (!summaries.value.length) return []
  
  // 如果有搜索查询，过滤学生
  if (searchQuery.value.trim()) {
    return summaries.value.filter(summary => 
      summary.studentId.toString().includes(searchQuery.value.trim())
    )
  }
  
  return summaries.value
})

// 查看学生详情
const handleViewDetail = (summary) => {
  emit('view-student-detail', summary)
  viewStudentDetail(summary)
}

// 监听courseId变化
watch(() => props.courseId, () => {
  loadSummaries()
}, { immediate: false })

// 组件挂载时加载数据
onMounted(() => {
  loadSummaries()
})
</script>
