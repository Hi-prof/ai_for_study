import { ref, computed } from 'vue'
import {
  getSummariesByCourse,
  getScoreItemsByCourse,
  getScoreRecordsList,
  createScoreItem,
  updateScoreItem,
  deleteScoreItem as apiDeleteScoreItem
} from '@/api/summaries'

/**
 * 课程学情分析数据管理 Composable
 * 统一管理数据获取、状态和基础计算逻辑
 */
export function useCourseAnalytics(courseId) {
  // 响应式状态
  const loading = ref(false)
  const error = ref('')
  
  // 核心数据
  const summaries = ref([])
  const scoreItems = ref([])
  const scoreRecords = ref([])

  // 计算属性 - 是否有数据
  const hasData = computed(() => {
    return summaries.value.length > 0 || scoreItems.value.length > 0
  })

  // 计算属性 - 统计数据
  const summaryStats = computed(() => {
    if (!summaries.value.length) {
      return {
        totalStudents: 0,
        averageScore: 0,
        totalItems: scoreItems.value.length,
        totalRecords: scoreRecords.value.length
      }
    }

    const totalScore = summaries.value.reduce((sum, s) => sum + (s.totalScore || 0), 0)
    return {
      totalStudents: summaries.value.length,
      averageScore: totalScore / summaries.value.length,
      totalItems: scoreItems.value.length,
      totalRecords: scoreRecords.value.length
    }
  })

  // 计算属性 - 学生成绩汇总（按总分排序）
  const studentSummaries = computed(() => {
    if (!summaries.value.length) return []

    return summaries.value
      .map(summary => ({
        ...summary,
        recordCount: scoreRecords.value.filter(r => r.studentId === summary.studentId).length
      }))
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
  })

  // 数据加载方法
  const loadSummaries = async () => {
    try {
      const response = await getSummariesByCourse(courseId)
      if (response.code === 200) {
        summaries.value = response.rows || response.data || []
      } else {
        throw new Error(response.message || '获取学生成绩汇总失败')
      }
    } catch (err) {
      console.error('加载学生成绩汇总失败:', err)
      throw err
    }
  }

  const loadScoreItems = async () => {
    try {
      const response = await getScoreItemsByCourse(courseId)
      if (response.code === 200) {
        scoreItems.value = response.rows || response.data || []
      } else {
        throw new Error(response.message || '获取评分项目失败')
      }
    } catch (err) {
      console.error('加载评分项目失败:', err)
      throw err
    }
  }

  const loadScoreRecords = async () => {
    try {
      const response = await getScoreRecordsList({ courseId })
      if (response.code === 200) {
        scoreRecords.value = response.rows || response.data || []
      } else {
        throw new Error(response.message || '获取评分记录失败')
      }
    } catch (err) {
      console.error('加载评分记录失败:', err)
      throw err
    }
  }

  // 主要数据加载方法
  const loadAllData = async () => {
    loading.value = true
    error.value = ''

    try {
      await Promise.all([
        loadSummaries(),
        loadScoreItems(),
        loadScoreRecords()
      ])
    } catch (err) {
      error.value = err.message || '加载数据失败'
    } finally {
      loading.value = false
    }
  }

  // 刷新数据
  const refreshData = async () => {
    await loadAllData();
  }

  // 创建评分项目
  const createScoreItem = async (itemData) => {
    try {
      const response = await createScoreItem(itemData);
      if (response.code !== 200) {
        throw new Error(response.message || '创建评分项目失败');
      }
      await loadScoreItems(); // Refresh the list
    } catch (err) {
      console.error('创建评分项目失败:', err);
      throw err;
    }
  };

  // 更新评分项目
  const updateScoreItem = async (itemData) => {
    try {
      const response = await updateScoreItem(itemData);
      if (response.code !== 200) {
        throw new Error(response.message || '更新评分项目失败');
      }
      await loadScoreItems(); // Refresh the list
    } catch (err) {
      console.error('更新评分项目失败:', err);
      throw err;
    }
  };

  // 删除评分项目
  const deleteScoreItem = async (itemId) => {
    try {
      const response = await apiDeleteScoreItem(itemId);
      if (response.code !== 200) {
        throw new Error(response.message || '删除评分项目失败');
      }
      await loadScoreItems(); // Refresh the list
    } catch (err) {
      console.error('删除评分项目失败:', err);
      throw err;
    }
  };

  return {
    // 状态
    loading,
    error,
    
    // 数据
    summaries,
    scoreItems,
    scoreRecords,
    
    // 计算属性
    hasData,
    summaryStats,
    studentSummaries,
    
    // 方法
    loadAllData,
    refreshData,
    createScoreItem,
    updateScoreItem,
    deleteScoreItem
  }
}
