<template>
  <div class="course-homework">
    <div class="section-header section-header--toolbar">
      <div class="section-actions">
        <button class="btn btn-primary" @click="createHomeworkAction">
          <i class="btn-icon plus-icon"></i>
          布置作业
        </button>
        <button class="btn btn-secondary" @click="importHomework">
          <i class="btn-icon import-icon"></i>
          导入作业
        </button>
      </div>
    </div>

    <!-- 作业统计 -->
    <div class="homework-stats">
      <div class="stat-card">
        <div class="stat-number">{{ homeworkStats.total }}</div>
        <div class="stat-label">总作业数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ homeworkStats.published }}</div>
        <div class="stat-label">已发布</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ homeworkStats.submitted }}</div>
        <div class="stat-label">已提交</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ homeworkStats.graded }}</div>
        <div class="stat-label">已批改</div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载作业列表...</p>
    </div>

    <!-- 作业列表 -->
    <div v-else-if="homeworkList.length > 0" class="homework-list">
      <div
        v-for="homework in homeworkList"
        :key="homework.id"
        class="homework-item"
        :class="homework.status"
      >
        <div class="homework-header">
          <div class="homework-info">
            <h3 class="homework-title">{{ homework.title }}</h3>
            <div class="homework-meta">
              <span class="meta-item">
                <WorkspaceIcon name="calendar" :size="14" />
                创建于: {{ formatTime(homework.originalData.createTime) }}
              </span>
              <span class="meta-item">
                <WorkspaceIcon name="sparkles" :size="14" />
                更新于: {{ formatTime(homework.originalData.updateTime) }}
              </span>
              <span class="meta-item">
                <WorkspaceIcon name="clock" :size="14" />
                截止于: {{ formatTime(homework.overTime) }}
              </span>
            </div>
          </div>
          <div class="homework-status">
            <span class="status-badge" :class="homework.status">
              {{ getStatusText(homework.status) }}
            </span>
          </div>
        </div>

        <div class="homework-content">
          <p class="homework-description">{{ homework.description }}</p>

          <div class="homework-progress">
            <div class="progress-info">
              <span>提交情况：{{ homework.submittedCount }} 人提交</span>
              <span>已批改：{{ homework.gradedCount }} / {{ homework.submittedCount }}</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="`width: ${homework.submittedCount > 0 ? (homework.gradedCount / homework.submittedCount * 100) : 0}%`"
              ></div>
            </div>
          </div>

          <div class="homework-actions">
            <button class="action-btn" @click="viewHomework(homework)">
              <i class="view-icon"></i>
              查看详情
            </button>
            <button class="action-btn" @click="gradeHomework(homework)">
              <i class="grade-icon"></i>
              批改作业
            </button>
            <button class="action-btn" @click="editHomework(homework)">
              <i class="edit-icon"></i>
              编辑
            </button>
            <button class="action-btn danger" @click="deleteHomeworkAction(homework.id)">
              <i class="delete-icon"></i>
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon" aria-hidden="true">
        <WorkspaceIcon name="homework" :size="34" />
      </div>
      <h3 class="empty-title">暂无作业</h3>
      <p class="empty-description">开始布置您的第一个作业吧</p>
      <button class="btn btn-primary" @click="createHomeworkAction">
        <i class="plus-icon"></i>
        布置作业
      </button>
    </div>

    <!-- 作业创建/编辑对话框 -->
    <HomeworkDialog
      :visible="dialogVisible"
      :homework="currentHomework"
      :course-id="props.courseId"
      @close="closeDialog"
      @submit="handleHomeworkSubmit"
    />

    <!-- 作业详情对话框 -->
    <HomeworkDetailDialog
      :visible="detailDialogVisible"
      :homework-id="currentHomeworkId"
      @close="closeDetailDialog"
      @edit="editFromDetail"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getHomeworkListByCourse, createHomework, updateHomework, deleteHomework, getHomeworkSubmissions } from '@/api/homework';
import WorkspaceIcon from '@/ui/workspace/WorkspaceIcon.vue';
import HomeworkDialog from './HomeworkDialog.vue';
import HomeworkDetailDialog from './HomeworkDetailDialog.vue';

const router = useRouter();

// 定义props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
});

// 定义emits
const emit = defineEmits(['refresh']);

// 响应式数据
const loading = ref(false);
const homeworkList = ref([]);
const homeworkStats = ref({
  total: 0,
  published: 0,
  submitted: 0,
  graded: 0
});

// 对话框相关状态
const dialogVisible = ref(false);
const currentHomework = ref(null);

// 详情对话框相关状态
const detailDialogVisible = ref(false);
const currentHomeworkId = ref(null);

// 加载作业列表
const loadHomeworkList = async () => {
  loading.value = true;
  try {
    // 调用真实的API接口
    const response = await getHomeworkListByCourse(props.courseId);

    // 处理不同的响应格式
    if (response) {
      let homeworkData = [];

      // 检查标准的TableDataInfo格式
      if (response.code === 0 && response.rows && Array.isArray(response.rows)) {
        homeworkData = response.rows;
      }
      // 检查直接返回数组的情况
      else if (Array.isArray(response.rows)) {
        homeworkData = response.rows;
      }
      // 检查直接返回数组的情况
      else if (Array.isArray(response)) {
        homeworkData = response;
      }
      // 如果没有数据但API调用成功
      else {
        homeworkData = [];
      }

      // 为每个作业获取提交统计信息（从HomeworkGrading.vue移植）
      const homeworkListWithStats = [];
      for (const homework of homeworkData) {
        try {
          const submissionResponse = await getHomeworkSubmissions(homework.id);
          let submissionCount = 0;
          let gradedCount = 0;

          if (submissionResponse && submissionResponse.rows) {
            submissionCount = submissionResponse.rows.length;
            gradedCount = submissionResponse.rows.filter(sub =>
              sub.score !== null && sub.score !== undefined
            ).length;
          }

          homeworkListWithStats.push({
            id: homework.id,
            title: homework.title || '未命名作业',
            description: homework.content || '暂无描述',
            chapter: '暂无章节信息', // API中没有章节字段，可以后续扩展
            type: 'general', // API中没有类型字段，使用默认值
            status: 'published', // API中没有状态字段，使用默认值
            overTime: homework.overTime, // 使用新的截止时间字段
            createTime: homework.createTime,
            updateTime: homework.updateTime,
            totalStudents: 0, // API中没有学生数量字段，使用默认值
            submittedCount: submissionCount, // 实际提交数量
            gradedCount: gradedCount, // 实际批改数量
            // 保留原始API数据
            originalData: homework
          });
        } catch (error) {
          // 如果获取提交统计失败，使用默认值
          homeworkListWithStats.push({
            id: homework.id,
            title: homework.title || '未命名作业',
            description: homework.content || '暂无描述',
            chapter: '暂无章节信息',
            type: 'general',
            status: 'published',
            overTime: homework.overTime,
            createTime: homework.createTime,
            updateTime: homework.updateTime,
            totalStudents: 0,
            submittedCount: 0,
            gradedCount: 0,
            originalData: homework
          });
        }
      }

      homeworkList.value = homeworkListWithStats;
    } else {
      homeworkList.value = [];
    }

    // 计算统计数据（增强版，包含实际批改统计）
    homeworkStats.value = {
      total: homeworkList.value.length,
      published: homeworkList.value.filter(h => h.status === 'published').length,
      submitted: homeworkList.value.reduce((sum, h) => sum + h.submittedCount, 0),
      graded: homeworkList.value.reduce((sum, h) => sum + h.gradedCount, 0)
    };
  } catch (error) {
    // 发生错误时显示空列表
    homeworkList.value = [];
    homeworkStats.value = {
      total: 0,
      published: 0,
      submitted: 0,
      graded: 0
    };
  } finally {
    loading.value = false;
  }
};



// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'draft': '草稿',
    'published': '已发布',
    'closed': '已截止',
    'graded': '已批改'
  };
  return statusMap[status] || '未知';
};

// 格式化时间
const formatTime = (timeString) => {
  if (!timeString) return '';
  try {
    return new Date(timeString).toLocaleString('zh-CN');
  } catch (error) {
    return timeString;
  }
};

// 布置作业
const createHomeworkAction = () => {
  currentHomework.value = null; // 清空当前作业，表示新建模式
  dialogVisible.value = true;
};

// 导入作业
const importHomework = () => {
  // TODO: 实现导入作业逻辑
  // 可以打开文件选择对话框，上传作业文件
};

// 查看作业详情
const viewHomework = (homework) => {
  currentHomeworkId.value = homework.id;
  detailDialogVisible.value = true;
};

// 批改作业 - 直接跳转到提交记录页面
const gradeHomework = (homework) => {
  router.push({
    name: 'HomeworkSubmissions',
    params: {
      courseId: props.courseId,
      homeworkId: homework.id
    }
  });
};

// 编辑作业
const editHomework = (homework) => {
  currentHomework.value = homework; // 设置当前作业，表示编辑模式
  dialogVisible.value = true;
};

// 删除作业
const deleteHomeworkAction = async (homeworkId) => {
  try {
    // 这里可以先显示确认对话框
    if (confirm('确定要删除这个作业吗？')) {
      await deleteHomework(homeworkId);

      // 重新加载作业列表
      await loadHomeworkList();

      // 发出刷新事件
      emit('refresh');
    }
  } catch (error) {
    // 这里可以显示错误提示
    alert('删除失败，请重试！');
  }
};

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false;
  currentHomework.value = null;
};

// 关闭详情对话框
const closeDetailDialog = () => {
  detailDialogVisible.value = false;
  currentHomeworkId.value = null;
};

// 从详情对话框编辑作业
const editFromDetail = (homeworkData) => {
  // 将详情数据转换为编辑格式
  const homeworkForEdit = {
    id: homeworkData.id,
    title: homeworkData.title,
    description: homeworkData.content,
    originalData: homeworkData
  };

  // 关闭详情对话框
  closeDetailDialog();

  // 打开编辑对话框
  currentHomework.value = homeworkForEdit;
  dialogVisible.value = true;
};

// 处理作业提交（创建或更新）
const handleHomeworkSubmit = async (homeworkData) => {
  try {
    let response;

    if (homeworkData.id) {
      // 更新作业
      response = await updateHomework(homeworkData);
    } else {
      // 创建作业
      response = await createHomework(homeworkData);
    }

    // 检查响应是否成功
    if (response && (response.code === 200 || response.code === 0 || response.success === true)) {
      // 关闭对话框
      closeDialog();

      // 重新加载作业列表
      await loadHomeworkList();

      // 发出刷新事件
      emit('refresh');

      // 显示成功提示
      alert(homeworkData.id ? '作业更新成功！' : '作业创建成功！');
    } else {
      // 显示错误信息
      const errorMsg = response?.msg || '操作失败';
      alert(`操作失败：${errorMsg}`);
    }
  } catch (error) {
    alert('操作失败，请重试！');
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadHomeworkList();
});
</script>

<style scoped>
/* 作业管理样式 */
.course-homework {
  background-color: var(--background-color, #ffffff);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0 0.85rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  background-color: transparent;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color, #1f2937);
  margin: 0;
}

.section-actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-primary {
  background-color: var(--primary-color, #6366f1);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-color-dark, #4f46e5);
}

.btn-secondary {
  background-color: var(--background-color-secondary, #f3f4f6);
  color: var(--text-color, #374151);
  border-color: var(--border-color, #d1d5db);
}

.btn-secondary:hover {
  background-color: var(--background-color-tertiary, #e5e7eb);
}

/* 作业统计 */
.homework-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.8rem;
  padding: 1rem 0 0;
  background-color: transparent;
  border-bottom: none;
}

.stat-card {
  display: flex;
  align-items: flex-end;
  gap: 0.7rem;
  text-align: left;
  padding: 0.95rem 1rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 1.85rem;
  line-height: 1;
  font-weight: 700;
  color: var(--primary-color, #6366f1);
  margin-bottom: 0;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary, #6b7280);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-color-secondary, #6b7280);
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--border-color, #e5e7eb);
  border-top: 2px solid var(--primary-color, #6366f1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 作业列表 */
.homework-list {
  padding: 0.9rem 0 0;
}

.homework-item {
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
  margin-bottom: 0.9rem;
  overflow: hidden;
  transition: all 0.2s;
  background-color: white;
}

.homework-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.homework-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.homework-info {
  flex: 1;
}

.homework-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color, #1f2937);
  margin: 0 0 0.5rem 0;
}

.homework-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary, #6b7280);
}

.homework-status {
  margin-left: 1rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.published {
  background-color: #dcfce7;
  color: #166534;
}

.status-badge.draft {
  background-color: #fef3c7;
  color: #92400e;
}

.status-badge.closed {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-badge.graded {
  background-color: #dbeafe;
  color: #1e40af;
}

/* 作业内容 */
.homework-content {
  padding: 1rem;
}

.homework-description {
  color: var(--text-color-secondary, #6b7280);
  margin: 0 0 0.9rem 0;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.homework-progress {
  margin-bottom: 1rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem 0.8rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-color-secondary, #6b7280);
}

.progress-bar {
  height: 0.5rem;
  background-color: var(--background-color-secondary, #f3f4f6);
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color, #6366f1);
  border-radius: 0.25rem;
  transition: width 0.3s ease;
}

.homework-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 0.25rem;
  background-color: white;
  color: var(--text-color, #374151);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: var(--background-color-secondary, #f3f4f6);
}

.action-btn.danger {
  color: #dc2626;
  border-color: #fecaca;
}

.action-btn.danger:hover {
  background-color: #fef2f2;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color, #1f2937);
  margin: 0 0 0.5rem 0;
}

.empty-description {
  color: var(--text-color-secondary, #6b7280);
  margin: 0 0 1.5rem 0;
}

/* 图标样式 */
.btn-icon, .plus-icon, .import-icon, .chapter-icon, .type-icon, .deadline-icon,
.view-icon, .grade-icon, .edit-icon, .delete-icon {
  width: 1rem;
  height: 1rem;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.plus-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.import-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.chapter-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath d='M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z' /%3E%3C/svg%3E");
}

.type-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.deadline-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.view-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath d='M10 12a2 2 0 100-4 2 2 0 000 4z' /%3E%3Cpath fill-rule='evenodd' d='M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.grade-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.edit-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath d='M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z' /%3E%3C/svg%3E");
}

.delete-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

/* 响应式设计 */
@media (max-width: 768px) {
  .homework-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .section-actions {
    justify-content: center;
  }

  .homework-header {
    flex-direction: column;
    gap: 1rem;
  }

  .homework-meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  .homework-actions {
    justify-content: center;
  }
}
</style>
