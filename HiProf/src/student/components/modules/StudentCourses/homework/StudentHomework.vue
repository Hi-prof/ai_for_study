<template>
  <div class="student-homework-container">
    <!-- 页面头部 -->
    <div class="homework-header">
      <h2 class="homework-title">课程作业</h2>
      <div class="homework-stats">
        <div class="stat-item">
          <span class="stat-label">总作业</span>
          <span class="stat-value">{{ homeworkStats.total }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已提交</span>
          <span class="stat-value submitted">{{ homeworkStats.submitted }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已批改</span>
          <span class="stat-value graded">{{ homeworkStats.graded }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">未提交</span>
          <span class="stat-value pending">{{ homeworkStats.pending }}</span>
        </div>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="homework-filters">
      <div class="filter-group">
        <label class="filter-label">状态筛选：</label>
        <select v-model="statusFilter" class="filter-select" @change="loadHomeworkList">
          <option value="">全部状态</option>
          <option value="pending">未提交</option>
          <option value="submitted">已提交</option>
          <option value="graded">已批改</option>
          <option value="overdue">已逾期</option>
        </select>
      </div>
    </div>

    <!-- 作业列表 -->
    <div class="homework-list">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载作业列表...</p>
      </div>

      <div v-else-if="homeworkList.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p class="empty-text">暂无作业</p>
        <p class="empty-hint">老师还没有布置作业，请稍后查看</p>
      </div>

      <div v-else class="homework-items">
        <div
          v-for="homework in homeworkList"
          :key="homework.id"
          class="homework-item"
          :class="getHomeworkStatusClass(homework)"
          @click="viewHomeworkDetail(homework)"
        >
          <div class="homework-content">
            <div class="homework-main">
              <h3 class="homework-name">{{ homework.title }}</h3>
              <p class="homework-description">{{ homework.content || '暂无描述' }}</p>
            </div>

            <div class="homework-meta">
              <div class="homework-info">
                <span class="homework-deadline">
                  <i class="deadline-icon">⏰</i>
                  截止时间：{{ formatDateTime(homework.overTime || homework.deadline) }}
                </span>
                <span class="homework-status" :class="getHomeworkStatusClass(homework)">
                  {{ getHomeworkStatusText(homework) }}
                </span>
              </div>

              <div class="homework-actions">
                <span v-if="homework.score !== null && homework.score !== undefined" class="homework-score">
                  得分：{{ homework.score }}分
                </span>
                <button class="view-detail-btn" @click.stop="viewHomeworkDetail(homework)">
                  {{ getActionButtonText(homework) }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 作业详情对话框 -->
    <StudentHomeworkDetail
      v-if="detailDialogVisible"
      :visible="detailDialogVisible"
      :homework="currentHomework"
      :course-id="props.courseId"
      @close="closeDetailDialog"
      @submit-success="loadHomeworkList"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getStudentHomework } from '@/api/homework';
import { getWorkRecordsList } from '@/api/homeworkrecords';
import { getCurrentUser } from '@/api/auth';
import StudentHomeworkDetail from './StudentHomeworkDetail.vue';

// 定义props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
});

// 响应式数据
const loading = ref(false);
const homeworkList = ref([]);
const statusFilter = ref('');

// 对话框相关状态
const detailDialogVisible = ref(false);
const currentHomework = ref(null);

// 作业统计
const homeworkStats = computed(() => {
  const stats = {
    total: homeworkList.value.length,
    submitted: 0,
    graded: 0,
    pending: 0
  };

  homeworkList.value.forEach(homework => {
    const status = getHomeworkStatus(homework);
    if (status === 'submitted' || status === 'graded') {
      stats.submitted++;
    }
    if (status === 'graded') {
      stats.graded++;
    }
    if (status === 'pending' || status === 'overdue') {
      stats.pending++;
    }
  });

  return stats;
});

// 加载作业列表
const loadHomeworkList = async () => {
  loading.value = true;
  try {
    // 1. 获取当前用户信息
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.id) {
      console.error('无法获取当前用户信息');
      homeworkList.value = [];
      return;
    }

    // 2. 并行获取作业列表和作业提交记录
    const [homeworkResponse, recordsResponse] = await Promise.all([
      getStudentHomework({ courseId: props.courseId, status: statusFilter.value }),
      getWorkRecordsList({
        clHomeworkRecords: {
          courseId: props.courseId,
          userId: currentUser.id
        }
      })
    ]);

    // 3. 处理作业列表
    let rawHomeworkList = [];
    if (homeworkResponse && homeworkResponse.code === 200 && Array.isArray(homeworkResponse.rows)) {
      rawHomeworkList = homeworkResponse.rows;
    } else {
      console.warn('作业列表响应格式异常:', homeworkResponse);
    }

    // 4. 处理作业提交记录，使用复合键确保精确匹配 (homeworkId + courseId)
    const workRecordsMap = new Map();
    if (recordsResponse && recordsResponse.code === 200 && Array.isArray(recordsResponse.rows)) {
      recordsResponse.rows.forEach(record => {
        // 使用复合键：homeworkId-courseId，确保三字段精确匹配 (homeworkId + courseId + userId)
        const compositeKey = `${record.homeworkId}-${record.courseId}`;
        workRecordsMap.set(compositeKey, record);
      });
    } else {
      console.warn('作业记录响应格式异常:', recordsResponse);
    }

    // 5. 合并数据，更新作业的提交状态
    homeworkList.value = rawHomeworkList.map(homework => {
      // 使用复合键查找：homeworkId-courseId，确保精确匹配
      const compositeKey = `${homework.id}-${homework.courseId}`;
      const record = workRecordsMap.get(compositeKey);
      // 基于updateTime判断是否已提交：有updateTime且不为空表示已提交
      const hasSubmitted = record && record.updateTime && record.updateTime.trim() !== '';

      return {
        id: homework.id,
        title: homework.title || '未命名作业',
        content: homework.content || '暂无描述',
        overTime: homework.overTime,
        deadline: homework.overTime,
        courseId: homework.courseId,
        fileIds: homework.fileIds || '',

        // 根据提交记录更新状态
        submissionContent: record?.content || '',
        submissionFile: record?.fileIds || '',
        hasSubmitted: hasSubmitted,
        score: record?.scoreId, // 假设 scoreId 存储分数，后续可能需要关联查询分数表
        feedback: record?.remark || '',
        submitTime: record?.createTime || null,

        originalData: homework,
        recordData: record // 保存提交记录的原始数据
      };
    });

    console.log('加载并合并学生作业列表成功:', homeworkList.value);

  } catch (error) {
    console.error('加载学生作业列表失败:', error);
    homeworkList.value = [];
  } finally {
    loading.value = false;
  }
};

// 获取作业状态
const getHomeworkStatus = (homework) => {
  const now = new Date();
  const deadline = new Date(homework.overTime || homework.deadline);

  // 如果已经批改（有分数说明已批改）
  if (homework.score !== null && homework.score !== undefined) {
    return 'graded';
  }

  // 如果已经提交（有学生提交内容或文件）
  if (homework.hasSubmitted) {
    return 'submitted';
  }

  // 如果已经逾期
  if (now > deadline) {
    return 'overdue';
  }

  // 未提交
  return 'pending';
};

// 获取作业状态文本
const getHomeworkStatusText = (homework) => {
  const status = getHomeworkStatus(homework);

  switch (status) {
    case 'graded':
      return '已批改';
    case 'submitted':
      return '已提交';
    case 'overdue':
      return '已逾期';
    case 'pending':
    default:
      const now = new Date();
      const deadline = new Date(homework.overTime || homework.deadline);
      const timeDiff = deadline.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysDiff <= 1) {
        return '即将截止';
      }
      return '未提交';
  }
};

// 获取作业状态样式类
const getHomeworkStatusClass = (homework) => {
  const status = getHomeworkStatus(homework);
  return `status-${status}`;
};

// 获取操作按钮文本
const getActionButtonText = (homework) => {
  const status = getHomeworkStatus(homework);

  switch (status) {
    case 'graded':
      return '查看成绩';
    case 'submitted':
      return '查看详情';
    case 'overdue':
      return '已逾期';
    case 'pending':
    default:
      return '提交作业';
  }
};

// 格式化时间
const formatDateTime = (timeString) => {
  if (!timeString) return '未设置';
  try {
    return new Date(timeString).toLocaleString('zh-CN');
  } catch (error) {
    return timeString;
  }
};

// 查看作业详情
const viewHomeworkDetail = (homework) => {
  currentHomework.value = homework;
  detailDialogVisible.value = true;
};

// 关闭详情对话框
const closeDetailDialog = () => {
  detailDialogVisible.value = false;
  currentHomework.value = null;
};



// 组件挂载时加载数据
onMounted(() => {
  loadHomeworkList();
});
</script>

<style scoped src="@/student/styles/student-homework.css"></style>


