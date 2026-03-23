<template>
  <div class="homework-submissions">
    <!-- 页面标题和返回按钮 -->
    <div class="section-header">
      <div class="header-left">
        <button class="btn btn-secondary" @click="goBack">
          <i class="btn-icon">←</i>
          返回
        </button>
        <h2 class="section-title">{{ homework?.title || '作业提交记录' }}</h2>
      </div>
      <div class="section-actions">
        <button class="btn btn-secondary" @click="refreshData">
          <i class="btn-icon refresh-icon">🔄</i>
          刷新
        </button>
        <button class="btn btn-primary" @click="exportGrades">
          <i class="btn-icon export-icon">📊</i>
          导出成绩
        </button>
      </div>
    </div>

    <!-- 作业信息 -->
    <div v-if="homework" class="homework-info-card">
      <div class="homework-meta">
        <span class="meta-item">
          <i class="icon">📅</i>
          截止时间: {{ formatDateTime(homework.overTime) }}
        </span>
        <span class="meta-item">
          <i class="icon">👥</i>
          提交人数: {{ submissions.length }}
        </span>
        <span class="meta-item">
          <i class="icon">✅</i>
          已批改: {{ gradedCount }}
        </span>
        <span class="meta-item">
          <i class="icon">⏳</i>
          待批改: {{ submissions.length - gradedCount }}
        </span>
      </div>

    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载提交记录...</p>
    </div>

    <!-- 提交记录列表 -->
    <div v-else-if="submissions.length > 0" class="submissions-list">
      <div
        v-for="submission in submissions"
        :key="submission.id"
        class="submission-card"
      >
        <div class="submission-header">
          <div class="student-info">
            <span class="student-name">{{ submission.studentName }}</span>
            <span class="student-id">{{ submission.studentId }}</span>
          </div>
          <div class="submission-status">
            <span :class="['status-badge', submission.isLate ? 'late' : 'ontime']">
              {{ submission.isLate ? '迟交' : '按时' }}
            </span>
            <span class="submit-time">
              {{ formatDateTime(submission.submitTime) }}
            </span>
          </div>
        </div>

        <!-- 学生提交内容 -->
        <div class="submission-content">
          <div v-if="submission.sContent" class="content-section">
            <h4 class="content-title">提交内容：</h4>
            <div class="content-text">{{ submission.sContent }}</div>
          </div>

          <div v-if="submission.sFile && submission.sFile.trim()" class="file-section">
            <h4 class="content-title">提交文件：</h4>
            <div class="file-list">
              <div class="file-item">
                <i class="file-icon">📎</i>
                <a :href="submission.sFile" target="_blank" class="file-link">
                  查看提交文件
                </a>
              </div>
            </div>
          </div>

          <div v-if="!submission.sFile || !submission.sFile.trim()" class="no-file-section">
            <p class="no-file-text">该学生未提交文件</p>
          </div>
        </div>

        <!-- 批改区域 -->
        <div class="grading-area">
          <div v-if="submission.graded" class="grade-display">
            <span class="grade-score">评分: {{ submission.score }}/100</span>
            <span class="grade-comment">评语: {{ submission.comment }}</span>
            <button
              class="btn btn-sm btn-secondary"
              @click="editGrade(submission)"
            >
              修改批改
            </button>
          </div>
          <div v-else class="grade-actions">
            <button
              class="btn btn-sm btn-primary"
              @click="gradeSubmission(submission)"
            >
              开始批改
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📝</div>
      <h3 class="empty-title">暂无学生提交</h3>
      <p class="empty-description">当前作业还没有学生提交，或者所有提交都还未加载完成</p>
    </div>

    <!-- 批改对话框 -->
    <GradingDialog
      v-model:visible="gradingDialogVisible"
      :homework="homework"
      :submission="currentSubmission"
      @submit="handleGradeSubmit"
      @cancel="closeGradingDialog"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getHomeworkById } from '@/api/homework';

import { getWorkRecordsByHomework, processWorkRecordScoring } from '@/api/homeworkrecords';
import { getScoreItemsList, getScoreRecordById } from '@/api/summaries';
import GradingDialog from './GradingDialog.vue';

// 导入样式文件
import '@/teacher/styles/homework-submissions.css';

// 导入用户信息获取工具
import { getUser } from '@/utils/auth';

// 路由实例
const router = useRouter();
const route = useRoute();

// 获取路由参数
const courseId = computed(() => route.params.courseId);
const homeworkId = computed(() => route.params.homeworkId);

// 响应式数据
const loading = ref(false);
const homework = ref(null);
const submissions = ref([]);
const gradingDialogVisible = ref(false);
const currentSubmission = ref(null);

// 计算已批改数量
const gradedCount = computed(() => {
  return submissions.value.filter(sub => sub.graded).length;
});

// 加载作业详情
const loadHomeworkDetail = async () => {
  try {
    const response = await getHomeworkById(homeworkId.value);
    if (response && response.data) {
      homework.value = response.data;
    }
  } catch (error) {
    console.error('加载作业详情失败:', error);
  }
};

// 加载提交记录
const loadSubmissions = async () => {
  loading.value = true;
  try {
    const response = await getWorkRecordsByHomework(homeworkId.value);
    if (response && response.rows) {
      const submissionPromises = response.rows.map(async (sub) => {
        const submissionData = {
          ...sub,
          studentName: `学生ID: ${sub.userId}`,
          studentId: sub.userId,
          sContent: sub.content,
          sFile: sub.fileIds,
          submitTime: sub.createTime,
          isLate: false, // API暂未返回是否迟交
          graded: sub.scoreId !== null && sub.scoreId !== undefined && sub.updateTime && sub.updateTime.trim() !== '',
          score: null,
          comment: ''
        };

        if (submissionData.graded && sub.scoreId) {
          try {
            const scoreRecordResponse = await getScoreRecordById(sub.scoreId);
            if (scoreRecordResponse && scoreRecordResponse.data) {
              submissionData.score = scoreRecordResponse.data.score;
              submissionData.comment = scoreRecordResponse.data.remark;
            }
          } catch (e) {
            console.error(`获取scoreId ${sub.scoreId} 的评分记录失败:`, e);
          }
        }
        return submissionData;
      });
      submissions.value = await Promise.all(submissionPromises);

    } else {
      submissions.value = [];
    }
    console.log('加载提交记录成功:', submissions.value);
  } catch (error) {
    console.error('加载提交记录失败:', error);
    submissions.value = [];
  } finally {
    loading.value = false;
  }
};

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '未设置';

  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return '无效日期';
  }
};

// 返回上一页
const goBack = () => {
  router.go(-1);
};

// 开始批改
const gradeSubmission = (submission) => {
  currentSubmission.value = submission;
  gradingDialogVisible.value = true;
};

// 编辑批改
const editGrade = (submission) => {
  currentSubmission.value = submission;
  gradingDialogVisible.value = true;
};

// 关闭批改对话框
const closeGradingDialog = () => {
  gradingDialogVisible.value = false;
  currentSubmission.value = null;
};

// 处理批改提交
const handleGradeSubmit = async (gradeData) => {
  if (!currentSubmission.value) return;

  try {
    console.log('开始处理批改提交:', gradeData);
    console.log('当前提交记录:', currentSubmission.value);

    // 检查当前提交记录的scoreId
    const workRecord = {
      id: currentSubmission.value.id,
      scoreId: currentSubmission.value.scoreId,
      homeworkId: currentSubmission.value.homeworkId,
      courseId: currentSubmission.value.courseId,
      userId: currentSubmission.value.userId,
      content: currentSubmission.value.content,
      fileIds: currentSubmission.value.fileIds,
      state: currentSubmission.value.state,
      remark: gradeData.comment, // 更新评语
      // 保持其他字段不变
      createBy: currentSubmission.value.createBy,
      createTime: currentSubmission.value.createTime,
      updateBy: currentSubmission.value.updateBy,
      updateTime: currentSubmission.value.updateTime
    };

    // 如果scoreId为null，需要创建分值变更记录的数据
    // 准备scoreRecordData，无论scoreId是否存在，都需要itemId
    const itemsResponse = await getScoreItemsList({ courseId: courseId.value });
    let homeworkItem;
    if (itemsResponse && itemsResponse.code === 200 && itemsResponse.rows) {
        homeworkItem = itemsResponse.rows.find(item => item.itemName === '作业');
    }

    if (!homeworkItem) {
        console.warn('未找到"作业"类型的分值变更项目');
        alert('未找到作业评分项目，请联系管理员配置');
        return;
    }

    const userInfo = getUser();
    const scoreRecordData = {
        itemId: homeworkItem.id, // 始终包含itemId
        studentId: currentSubmission.value.studentId || currentSubmission.value.userId,
        courseId: parseInt(courseId.value),
        score: parseFloat(gradeData.score),
        graderId: userInfo?.id || userInfo?.userId || 0,
        remark: gradeData.comment || '作业批改'
    };

    console.log('准备的分值记录数据:', scoreRecordData);

    // 使用新的processWorkRecordScoring函数处理
    const result = await processWorkRecordScoring(workRecord, scoreRecordData);

    if (result.code === 200) {
      console.log('作业批改处理成功:', result);

      // 更新成功后，刷新列表
      await loadSubmissions();
    } else {
      console.error('作业批改处理失败:', result);
      alert(`批改失败：${result.message || '未知错误'}`);
    }
  } catch (error) {
    console.error('批改作业失败:', error);
    alert('批改失败，请重试！');
  } finally {
    closeGradingDialog();
  }
};




// 刷新数据
const refreshData = () => {
  loadHomeworkDetail();
  loadSubmissions();
};

// 导出成绩
const exportGrades = () => {
  // 实现导出功能
  alert('导出功能开发中...');
};

// 组件挂载时加载数据
onMounted(() => {
  loadHomeworkDetail();
  loadSubmissions();
});
</script>
