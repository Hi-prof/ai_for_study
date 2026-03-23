/**
 * 学情分析工具函数 Composable
 * 统一管理各种工具函数和计算逻辑
 */

/**
 * 获取评分项目类型文本
 */
export const getItemTypeText = (type) => {
  const typeMap = {
    'regular': '常规',
    'extra': '加分',
    'penalty': '扣分'
  }
  return typeMap[type] || type
}

/**
 * 获取评分项目类型样式类
 */
export const getItemTypeClass = (type) => {
  return `item-type-${type}`
}

/**
 * 获取成绩等级样式类
 */
export const getScoreClass = (score) => {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 70) return 'average'
  if (score >= 60) return 'poor'
  return 'fail'
}

/**
 * 获取排名样式类
 */
export const getRankClass = (rank) => {
  if (rank === 1) return 'first'
  if (rank === 2) return 'second'
  if (rank === 3) return 'third'
  return ''
}

/**
 * 获取学生姓名首字母
 */
export const getStudentInitials = (name) => {
  if (!name) return '?'
  return name.length > 1 ? name.slice(-2) : name
}

/**
 * 获取指定评分项目的记录数量
 */
export const getItemRecordCount = (itemId, scoreRecords) => {
  return scoreRecords.filter(record => record.itemId === itemId).length
}

/**
 * 计算成绩分布区间
 */
export const calculateScoreRanges = (summaries) => {
  const total = summaries.length
  if (total === 0) return []

  const ranges = [
    { label: '90-100分', min: 90, max: 100, class: 'excellent' },
    { label: '80-89分', min: 80, max: 89, class: 'good' },
    { label: '70-79分', min: 70, max: 79, class: 'average' },
    { label: '60-69分', min: 60, max: 69, class: 'poor' },
    { label: '60分以下', min: 0, max: 59, class: 'fail' }
  ]

  return ranges.map(range => {
    const count = summaries.filter(s => {
      const score = s.totalScore || 0
      return score >= range.min && score <= range.max
    }).length

    return {
      ...range,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }
  })
}

/**
 * 过滤评分项目
 */
export const filterScoreItems = (scoreItems, selectedType) => {
  if (!selectedType) {
    return scoreItems
  }
  return scoreItems.filter(item => item.itemType === selectedType)
}

/**
 * 过滤学生列表
 */
export const filterStudents = (students, searchQuery) => {
  if (!searchQuery.trim()) {
    return students
  }

  const query = searchQuery.toLowerCase()
  return students.filter(student =>
    (student.studentName && student.studentName.toLowerCase().includes(query)) ||
    (student.studentId && student.studentId.toString().includes(query))
  )
}

/**
 * 导出分析数据（占位函数）
 */
export const exportAnalytics = (data) => {
  console.log('导出学情分析数据:', data)
  // TODO: 实现具体的导出功能
}

/**
 * 查看学生详情（占位函数）
 */
export const viewStudentDetail = (summary) => {
  console.log('查看学生详情:', summary)
  // TODO: 实现学生详情查看功能
}
