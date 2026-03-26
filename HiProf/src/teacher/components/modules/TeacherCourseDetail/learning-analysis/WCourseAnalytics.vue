<template>
  <div class="course-analytics">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在加载学情数据...</p>
    </div>

    <!-- 主要内容 -->
    <div v-else class="analytics-content">
      <div class="section-header section-header--toolbar">
        <div class="section-actions">
          <button class="btn btn-secondary" @click="refreshData" :disabled="loading">
            <i class="btn-icon refresh-icon"></i>
            刷新数据
          </button>
          <button class="btn btn-primary" @click="handleExportAnalytics" :disabled="!hasData">
            <i class="btn-icon export-icon"></i>
            导出分析
          </button>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="error-message">
        <i class="error-icon"></i>
        <span>{{ error }}</span>
        <button class="btn btn-link" @click="refreshData">重试</button>
      </div>

      <!-- 无数据提示 -->
      <div v-else-if="!hasData" class="no-data-message">
        <i class="no-data-icon"></i>
        <h3>暂无学情数据</h3>
        <p>该课程还没有学生的分值记录，请先添加评分项目和学生成绩。</p>
      </div>

      <!-- 数据展示 -->
      <div v-else class="analytics-data">
        <!-- 总体统计 -->
        <AnalyticsOverview
          :summaries="summaries"
          :score-items="scoreItems"
          :score-records="scoreRecords"
        />

        <!-- 分析图表区域 -->
        <div class="analytics-grid">
          <!-- 评分项目分析 -->
          <div class="analytics-card">
            <div class="card-header">
              <h3 class="card-title">评分项目分析</h3>
              <ScoreItemEditor
                :course-id="courseId"
                :score-items="scoreItems"
                @save="handleSaveScoreItems"
              />
            </div>
            <div class="card-content">
              <ScoreItemsDisplay
                :score-items="scoreItems"
                :score-records="scoreRecords"
              />
            </div>
          </div>

          <!-- 成绩分布分析 -->
          <ScoreDistribution
            :summaries="summaries"
            :score-items="scoreItems"
          />

          <!-- 学生成绩排名 -->
          <StudentRanking
            :course-id="courseId"
            @view-student-detail="handleViewStudentDetail"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useCourseAnalytics } from './composables/useCourseAnalytics'
import { exportAnalytics, viewStudentDetail } from './composables/useAnalyticsUtils'

// 引入子组件
import AnalyticsOverview from './components/AnalyticsOverview.vue'
import ScoreItemEditor from './components/ScoreItemEditor.vue'
import ScoreItemsDisplay from './components/ScoreItemsDisplay.vue'
import ScoreDistribution from './components/ScoreDistribution.vue'
import StudentRanking from './components/StudentRanking.vue'

// 定义props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
})

// 定义emits
const emit = defineEmits(['refresh'])

// 使用数据管理 composable
const {
  loading,
  error,
  summaries,
  scoreItems,
  scoreRecords,
  hasData,
  loadAllData,
  refreshData
} = useCourseAnalytics(props.courseId)

// 事件处理方法
const handleExportAnalytics = () => {
  const analyticsData = {
    summaries: summaries.value,
    scoreItems: scoreItems.value,
    scoreRecords: scoreRecords.value
  }
  exportAnalytics(analyticsData)
}

const handleViewStudentDetail = (summary) => {
  viewStudentDetail(summary)
}

const handleSaveScoreItems = async (updatedScoreItems) => {
  // The child component has saved the items and returned the latest list.
  // We update our local state immediately for responsiveness.
  scoreItems.value = updatedScoreItems;

  // Now, trigger a full refresh of all analytics data to ensure consistency.
  await refreshData();
};

// 生命周期
onMounted(() => {
  console.log('学情分析组件加载，课程ID:', props.courseId)
  loadAllData()

  // 开发模式下的调试信息
  if (import.meta.env.DEV) {
    console.log('🔧 开发模式：学情分析组件已挂载')
    console.log('📊 可用的调试方法：')
    console.log('  - refreshData() - 刷新数据')
    console.log('  - loadAllData() - 重新加载所有数据')

    // 将调试方法挂载到 window 对象（仅开发模式）
    window.analyticsDebug = {
      refreshData,
      loadAllData,
      summaries: summaries.value,
      scoreItems: scoreItems.value,
      scoreRecords: scoreRecords.value
    }
  }
})

// 导入样式文件（确保基础样式优先加载）
import '@/teacher/styles/variables.css';
import '@/teacher/styles/common.css';
import '@/teacher/styles/components.css';
import '@/teacher/styles/teacher-course-analytics.css';
</script>
