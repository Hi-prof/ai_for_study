<template>
  <div v-if="visible" class="grading-dialog-overlay" @click="handleOverlayClick">
    <div class="grading-dialog" @click.stop>
      <div class="dialog-header">
        <h3 class="dialog-title">批改作业</h3>
        <button class="close-btn" @click="closeDialog">
          <i class="close-icon">×</i>
        </button>
      </div>
      
      <div class="dialog-content">
        <!-- 学生信息 -->
        <div v-if="submission" class="student-section">
          <h4 class="section-title">学生信息</h4>
          <div class="student-info">
            <div class="info-item">
              <span class="label">姓名:</span>
              <span class="value">{{ submission.studentName }}</span>
            </div>
            <div class="info-item">
              <span class="label">提交时间:</span>
              <span class="value">{{ formatDateTime(submission.submitTime) }}</span>
            </div>
            <div class="info-item">
              <span class="label">提交状态:</span>
              <span :class="['status', submission.isLate ? 'late' : 'ontime']">
                {{ submission.isLate ? '迟交' : '按时提交' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 学生提交内容 -->
        <div v-if="submission" class="submission-section">
          <h4 class="section-title">学生提交</h4>
          <div class="submission-content">
            <div v-if="submission.sContent" class="text-content">
              <h5>提交内容:</h5>
              <div class="content-box">{{ submission.sContent }}</div>
            </div>
            <div v-if="submission.sFile && submission.sFile.trim()" class="file-content">
              <h5>提交文件:</h5>
              <a :href="submission.sFile" target="_blank" class="file-link">
                <i class="file-icon">📄</i>
                查看学生提交文件
              </a>
            </div>
            <div v-if="!submission.sFile || !submission.sFile.trim()" class="no-file-notice">
              <p class="no-file-text">该学生未提交文件</p>
            </div>
          </div>
        </div>

        <!-- 批改表单 -->
        <div class="grading-section">
          <h4 class="section-title">批改评分</h4>
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="score" class="form-label">评分 (0-100分) *</label>
              <div class="score-input-group">
                <input
                  id="score"
                  v-model.number="formData.score"
                  type="number"
                  class="form-input score-input"
                  placeholder="请输入分数"
                  min="0"
                  max="100"
                  required
                />
                <span class="score-unit">分</span>
              </div>
              <div class="score-buttons">
                <button type="button" class="score-btn" @click="setScore(100)">优秀</button>
                <button type="button" class="score-btn" @click="setScore(85)">良好</button>
                <button type="button" class="score-btn" @click="setScore(75)">中等</button>
                <button type="button" class="score-btn" @click="setScore(60)">及格</button>
              </div>
            </div>
            
            <div class="form-group">
              <label for="comment" class="form-label">评语</label>
              <textarea
                id="comment"
                v-model="formData.comment"
                class="form-textarea"
                placeholder="请输入评语和建议"
                rows="4"
              ></textarea>
              <div class="comment-templates">
                <span class="template-label">常用评语:</span>
                <button 
                  type="button" 
                  class="template-btn" 
                  @click="addTemplate('作业完成质量很好，继续保持！')"
                >
                  优秀
                </button>
                <button 
                  type="button" 
                  class="template-btn" 
                  @click="addTemplate('作业基本完成，但还有改进空间。')"
                >
                  良好
                </button>
                <button 
                  type="button" 
                  class="template-btn" 
                  @click="addTemplate('作业完成情况一般，需要更加认真。')"
                >
                  一般
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button type="button" class="btn btn-secondary" @click="closeDialog">
          取消
        </button>
        <button 
          type="button" 
          class="btn btn-primary" 
          @click="handleSubmit"
          :disabled="!formData.score || loading"
        >
          <span v-if="loading">保存中...</span>
          <span v-else>保存批改</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

// 导入样式文件
import '@/teacher/styles/grading-dialog.css';

// 定义props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  homework: {
    type: Object,
    default: null
  },
  submission: {
    type: Object,
    default: null
  }
});

// 定义emits
const emit = defineEmits(['update:visible', 'submit', 'cancel']);

// 响应式数据
const loading = ref(false);
const formData = ref({
  score: null,
  comment: ''
});

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '未知';
  
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

// 设置分数
const setScore = (score) => {
  formData.value.score = score;
};

// 添加评语模板
const addTemplate = (template) => {
  if (formData.value.comment) {
    formData.value.comment += ' ' + template;
  } else {
    formData.value.comment = template;
  }
};

// 重置表单
const resetForm = () => {
  formData.value = {
    score: null,
    comment: ''
  };
};

// 监听submission变化，初始化表单数据
watch(() => props.submission, (newSubmission) => {
  if (newSubmission) {
    formData.value = {
      score: newSubmission.score || null,
      comment: newSubmission.remark || newSubmission.comment || ''
    };
  } else {
    resetForm();
  }
}, { immediate: true });

// 关闭对话框
const closeDialog = () => {
  resetForm();
  emit('update:visible', false);
  emit('cancel');
};

// 处理遮罩层点击
const handleOverlayClick = () => {
  closeDialog();
};

// 提交表单
const handleSubmit = async () => {
  if (!formData.value.score) {
    alert('请输入评分');
    return;
  }
  
  if (formData.value.score < 0 || formData.value.score > 100) {
    alert('评分必须在0-100之间');
    return;
  }
  
  loading.value = true;
  try {
    // 发出提交事件，由父组件处理具体的API调用
    emit('submit', {
      submissionId: props.submission?.id,
      studentId: props.submission?.studentId,
      homeworkId: props.homework?.id,
      score: formData.value.score,
      comment: formData.value.comment
    });
  } finally {
    loading.value = false;
  }
};
</script>
