<template>
  <div v-if="visible" class="homework-detail-overlay" @click="handleOverlayClick">
    <div class="homework-detail-dialog" @click.stop>
      <div class="dialog-header">
        <h3 class="dialog-title">{{ currentHomework?.title || currentHomework?.name || '作业详情' }}</h3>
        <button class="close-btn" @click="closeDialog">
          <i class="close-icon">×</i>
        </button>
      </div>

      <div class="dialog-content">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>正在加载作业详情...</p>
        </div>

        <div v-else-if="currentHomework" class="homework-detail-content">
          <!-- 作业基本信息 -->
          <div class="homework-info-section">
            <h4 class="section-title">作业信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <label class="info-label">作业名称：</label>
                <span class="info-value">{{ currentHomework.title || currentHomework.name }}</span>
              </div>
              <div class="info-item">
                <label class="info-label">截止时间：</label>
                <span class="info-value" :class="getDeadlineClass()">
                  {{ formatDateTime(currentHomework.overTime || currentHomework.deadline) }}
                </span>
              </div>
              <div class="info-item">
                <label class="info-label">作业状态：</label>
                <span class="info-value status" :class="getStatusClass()">
                  {{ getStatusText() }}
                </span>
              </div>
              <div v-if="currentHomework.score !== null && currentHomework.score !== undefined" class="info-item">
                <label class="info-label">作业得分：</label>
                <span class="info-value score">{{ currentHomework.score }}分</span>
              </div>
            </div>
          </div>

          <!-- 作业内容 -->
          <div class="homework-content-section">
            <h4 class="section-title">作业要求</h4>
            <div class="homework-content">
              <p>{{ currentHomework.description || currentHomework.content || '暂无作业要求' }}</p>
            </div>
          </div>

          <!-- 教师附件 -->
          <div v-if="teacherAttachments.length > 0" class="teacher-attachments-section">
            <h4 class="section-title">教师附件</h4>
            <div class="attachments-list">
              <div
                v-for="(attachment, index) in teacherAttachments"
                :key="index"
                class="attachment-item"
              >
                <div class="attachment-info">
                  <i class="attachment-icon">📎</i>
                  <span class="attachment-name">{{ attachment.name }}</span>
                </div>
                <a
                  :href="attachment.url"
                  target="_blank"
                  class="download-btn"
                  @click="downloadAttachment(attachment)"
                >
                  下载
                </a>
              </div>
            </div>
          </div>

          <!-- 提交状态和内容 -->
          <div v-if="isSubmitted()" class="submission-section">
            <h4 class="section-title">我的提交</h4>
            <div class="submission-info">
              <div class="info-item">
                <label class="info-label">提交时间：</label>
                <span class="info-value">{{ formatDateTime(submissionRecord?.createTime || currentHomework.submitTime) }}</span>
              </div>
              <div v-if="submissionRecord?.content || currentHomework.submissionContent" class="submission-content">
                <label class="info-label">提交内容：</label>
                <div class="content-display">{{ submissionRecord?.content || currentHomework.submissionContent }}</div>
              </div>
              <div v-if="submissionRecord?.fileIds || currentHomework.submissionFile" class="submission-files">
                <label class="info-label">提交文件：</label>
                <div class="content-display">{{ submissionRecord?.fileIds || currentHomework.submissionFile }}</div>
              </div>
            </div>
          </div>

          <!-- 批改结果 -->
          <div v-if="isGraded()" class="grading-section">
            <h4 class="section-title">批改结果</h4>
            <div class="grading-info">
              <div class="info-item">
                <label class="info-label">得分：</label>
                <span class="info-value score">{{ currentHomework.score }}分</span>
              </div>
              <div v-if="currentHomework.feedback" class="feedback-content">
                <label class="info-label">教师评语：</label>
                <div class="content-display feedback">{{ currentHomework.feedback }}</div>
              </div>
            </div>
          </div>

          <!-- 作业提交表单 -->
          <div v-if="canSubmit()" class="submission-form-section">
            <h4 class="section-title">{{ isEditing ? '修改作业' : '提交作业' }}</h4>
            <div class="submission-form">
              <div class="form-group">
                <label class="form-label">作业内容：</label>
                <textarea
                  v-model="submissionForm.content"
                  class="form-textarea"
                  placeholder="请输入您的作业内容..."
                  rows="6"
                ></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">附件上传：</label>
                <div class="file-upload-area">
                  <input
                    ref="fileInput"
                    type="file"
                    multiple
                    @change="handleFileSelect"
                    class="file-input"
                  />
                  <div class="upload-hint">
                    <i class="upload-icon">📎</i>
                    <span>点击选择文件或拖拽文件到此处</span>
                  </div>
                </div>

                <div v-if="submissionForm.files.length > 0" class="selected-files">
                  <div
                    v-for="(file, index) in submissionForm.files"
                    :key="index"
                    class="file-item"
                  >
                    <span class="file-name">{{ file.name }}</span>
                    <button
                      type="button"
                      class="remove-file-btn"
                      @click="removeFile(index)"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button type="button" class="btn btn-secondary" @click="closeDialog">
          关闭
        </button>
        <button
          v-if="canSubmit()"
          type="button"
          class="btn btn-primary"
          @click="submitHomework"
          :disabled="submitting || !submissionForm.content.trim()"
        >
          {{ submitting ? (isEditing ? '修改中...' : '提交中...') : (isEditing ? '修改作业' : '提交作业') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { getHomeworkById } from '@/api/homework';
import { uploadFile } from '@/api/files';
import { getCurrentUser } from '@/api/auth';
import { submitWorkRecord, updateWorkRecord, getWorkRecordsList } from '@/api/homeworkrecords.js'; // 导入提交和修改作业接口

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
  courseId: {
    type: [String, Number],
    required: true
  }
});

// 定义emits
const emit = defineEmits(['close', 'submit-success']);

// 响应式数据
const submitting = ref(false);
const loading = ref(false);
const fileInput = ref(null);
const homeworkDetail = ref(null);
const submissionRecord = ref(null); // 存储学生的提交记录

// 提交表单数据
const submissionForm = reactive({
  content: '',
  files: []
});

// 加载作业详情函数（提前声明）
const loadHomeworkDetail = async (homeworkId) => {
  if (!homeworkId) return;

  loading.value = true;
  try {
    // 1. 获取作业详情
    const response = await getHomeworkById(homeworkId);

    if (response && (response.code === 200 || response.code === 0) && response.data) {
      // 处理详情数据，添加学生端需要的字段
      homeworkDetail.value = {
        ...response.data,
        title: response.data.title || '未命名作业',
        description: response.data.content || response.data.remark || '暂无描述',
        submissionContent: response.data.sContent || '',
        submissionFile: response.data.sFile || '',
        hasSubmitted: !!(response.data.sContent || response.data.sFile),
        originalData: response.data
      };
      console.log('加载作业详情成功:', homeworkDetail.value);

      // 2. 获取当前用户的提交记录
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.id) {
        try {
          // 使用三字段精确过滤：homeworkId + courseId + userId，确保每个人的作业一一对应
          const recordResponse = await getWorkRecordsList({
            clHomeworkRecords: {
              homeworkId: homeworkId,
              courseId: props.courseId,
              userId: currentUser.id
            }
          });
          if (recordResponse && recordResponse.code === 200 && recordResponse.rows && recordResponse.rows.length > 0) {
            // BUGFIX: 后端API可能返回不匹配的作业记录，前端进行过滤
            const filteredRecords = recordResponse.rows.filter(record => record.homeworkId === homeworkId);

            if (filteredRecords.length > 0) {
              submissionRecord.value = filteredRecords[0]; // 取第一条匹配的记录
              console.log('获取并过滤提交记录成功:', submissionRecord.value);

              // 预填充表单数据
              if (submissionRecord.value.content) {
                submissionForm.content = submissionRecord.value.content;
              }

              // 更新作业详情中的提交状态
              homeworkDetail.value.hasSubmitted = true;
              homeworkDetail.value.submissionContent = submissionRecord.value.content || '';
              homeworkDetail.value.submissionFile = submissionRecord.value.fileIds || '';
              homeworkDetail.value.submitTime = submissionRecord.value.createTime;
            } else {
              submissionRecord.value = null;
              console.log(`未找到与当前作业ID (${homeworkId}) 匹配的提交记录`);
            }
          } else {
            submissionRecord.value = null;
            console.log('未找到提交记录');
          }
        } catch (recordError) {
          console.error('获取提交记录失败:', recordError);
          submissionRecord.value = null;
        }
      }
    } else {
      console.warn('作业详情响应格式异常:', response);
      homeworkDetail.value = null;
    }
  } catch (error) {
    console.error('加载作业详情失败:', error);
    homeworkDetail.value = null;
  } finally {
    loading.value = false;
  }
};

// 监听props变化，重新加载作业详情
watch(() => props.homework, async (newHomework) => {
  if (newHomework && props.visible) {
    await loadHomeworkDetail(newHomework.id);
  }
}, { immediate: true });

watch(() => props.visible, async (newVisible) => {
  if (newVisible && props.homework) {
    await loadHomeworkDetail(props.homework.id);
  } else if (!newVisible) {
    // 对话框关闭时清空详情数据
    homeworkDetail.value = null;
  }
});

// 当前显示的作业数据（优先使用详情数据，回退到props数据）
const currentHomework = computed(() => {
  return homeworkDetail.value || props.homework;
});

// 教师附件列表
const teacherAttachments = computed(() => {
  if (!currentHomework.value || !currentHomework.value.fileIds) {
    return [];
  }

  const fileIds = currentHomework.value.fileIds;
  if (typeof fileIds !== 'string' || !fileIds.trim()) {
    return [];
  }

  // 分割文件URL（可能是逗号分隔的）
  const urls = fileIds.split(',').map(url => url.trim()).filter(url => url);

  return urls.map((url, index) => {
    // 从URL中提取文件名
    const fileName = extractFileNameFromUrl(url);
    return {
      name: fileName,
      url: url,
      index: index
    };
  });
});

// 计算属性
const isEditing = computed(() => {
  return submissionRecord.value !== null;
});

const homeworkStatus = computed(() => {
  if (!currentHomework.value) return 'unknown';

  const now = new Date();
  const deadline = new Date(currentHomework.value.overTime || currentHomework.value.deadline);

  // 如果已经批改（有分数说明已批改）
  if (currentHomework.value.score !== null && currentHomework.value.score !== undefined) {
    return 'graded';
  }

  // 如果已经提交（基于updateTime判断：有提交记录且updateTime不为空）
  if (submissionRecord.value && submissionRecord.value.updateTime && submissionRecord.value.updateTime.trim() !== '') {
    return 'submitted';
  }

  // 如果已经逾期
  if (now > deadline) {
    return 'overdue';
  }

  // 未提交
  return 'pending';
});

// 方法
const isSubmitted = () => {
  return homeworkStatus.value === 'submitted' || homeworkStatus.value === 'graded';
};

const isGraded = () => {
  return homeworkStatus.value === 'graded';
};

const canSubmit = () => {
  // 可以提交的情况：未提交、已提交但未批改
  return homeworkStatus.value === 'pending' || homeworkStatus.value === 'submitted';
};

const getStatusText = () => {
  switch (homeworkStatus.value) {
    case 'graded':
      return '已批改';
    case 'submitted':
      return '已提交';
    case 'overdue':
      return '已逾期';
    case 'pending':
    default:
      return '未提交';
  }
};

const getStatusClass = () => {
  return `status-${homeworkStatus.value}`;
};

const getDeadlineClass = () => {
  if (!currentHomework.value) return '';

  const now = new Date();
  const deadline = new Date(currentHomework.value.overTime || currentHomework.value.deadline);
  const timeDiff = deadline.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  if (now > deadline) {
    return 'overdue';
  } else if (daysDiff <= 1) {
    return 'urgent';
  }
  return '';
};

const formatDateTime = (timeString) => {
  if (!timeString) return '未设置';
  try {
    return new Date(timeString).toLocaleString('zh-CN');
  } catch (error) {
    return timeString;
  }
};

// 从URL中提取文件名
const extractFileNameFromUrl = (url) => {
  if (!url) return '未知文件';

  try {
    // 从URL中提取文件名部分
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];

    // 如果文件名包含查询参数，去掉它们
    const cleanFileName = fileName.split('?')[0];

    // 如果文件名是UUID格式，尝试从中提取扩展名
    if (cleanFileName.includes('.')) {
      const parts = cleanFileName.split('.');
      const extension = parts[parts.length - 1];

      // 如果是常见的文档格式，返回更友好的名称
      const extensionMap = {
        'docx': 'Word文档',
        'doc': 'Word文档',
        'pdf': 'PDF文档',
        'pptx': 'PowerPoint文档',
        'ppt': 'PowerPoint文档',
        'xlsx': 'Excel文档',
        'xls': 'Excel文档',
        'txt': '文本文档',
        'zip': '压缩文件',
        'rar': '压缩文件'
      };

      const friendlyName = extensionMap[extension.toLowerCase()];
      if (friendlyName) {
        return `${friendlyName}.${extension}`;
      }
    }

    return cleanFileName || '附件文件';
  } catch (error) {
    return '附件文件';
  }
};

// 下载附件
const downloadAttachment = (attachment) => {
  console.log('下载附件:', attachment);
  // 浏览器会自动处理下载，这里可以添加下载统计等逻辑
};

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  submissionForm.files.push(...files);
};

const removeFile = (index) => {
  submissionForm.files.splice(index, 1);
};

const submitHomework = async () => {
  if (!submissionForm.content.trim()) {
    alert('请输入作业内容');
    return;
  }

  submitting.value = true;
  try {
    // 1. 上传文件（如果有）
    let uploadedFileIds = '';
    if (submissionForm.files.length > 0) {
      const fileUploadPromises = submissionForm.files.map(file => uploadFile(file));
      const uploadResults = await Promise.all(fileUploadPromises);

      const failedUploads = uploadResults.filter(result => result.error);
      if (failedUploads.length > 0) {
        throw new Error(`文件上传失败: ${failedUploads.map(r => r.msg).join(', ')}`);
      }

      uploadedFileIds = uploadResults.map(result => result.data.fileId || result.data.url).join(',');
    }

    // 2. 获取当前用户ID
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.id) {
      throw new Error('无法获取当前用户信息，请重新登录');
    }

    // 3. 构造提交数据
    const submissionData = {
      homeworkId: currentHomework.value.id, // 确保 homeworkId 被正确设置
      courseId: props.courseId,
      userId: currentUser.id,
      content: submissionForm.content,
      fileIds: uploadedFileIds,
      // 不再使用state字段，提交状态通过updateTime判断
    };

    // 4. 根据是否为编辑模式调用不同的API
    let response;
    if (isEditing.value && submissionRecord.value) {
      // 修改现有记录
      submissionData.id = submissionRecord.value.id;
      response = await updateWorkRecord(submissionData);
      console.log('修改作业记录:', submissionData);
    } else {
      // 创建新记录
      response = await submitWorkRecord(submissionData);
      console.log('提交新作业记录:', submissionData);
    }

    if (response && response.code === 200) {
      const successMessage = isEditing.value ? '作业修改成功！' : '作业提交成功！';
      alert(successMessage);
      emit('submit-success'); // 触发成功事件
      closeDialog(); // 关闭对话框
    } else {
      const errorMessage = isEditing.value ? '修改失败，请稍后重试' : '提交失败，请稍后重试';
      throw new Error(response.msg || errorMessage);
    }

  } catch (error) {
    console.error('提交/修改作业时发生错误:', error);
    const actionText = isEditing.value ? '修改' : '提交';
    alert(`${actionText}失败：${error.message}`);
  } finally {
    submitting.value = false;
  }
};

const closeDialog = () => {
  // 重置表单
  submissionForm.content = '';
  submissionForm.files = [];
  if (fileInput.value) {
    fileInput.value.value = '';
  }

  // 重置提交记录
  submissionRecord.value = null;

  emit('close');
};

const handleOverlayClick = () => {
  closeDialog();
};
</script>

<style scoped src="@/student/styles/student-homework.css"></style>


