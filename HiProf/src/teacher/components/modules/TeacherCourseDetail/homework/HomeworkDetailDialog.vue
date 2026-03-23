<template>
  <Teleport to="body">
    <div v-if="visible" class="homework-detail-overlay" @click="handleOverlayClick">
      <div class="homework-detail-dialog" @click.stop>
      <div class="dialog-header">
        <h3 class="dialog-title">作业详情</h3>
        <button class="close-btn" @click="closeDialog">
          <i class="close-icon">×</i>
        </button>
      </div>
      
      <div class="dialog-content">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>正在加载作业详情...</p>
        </div>
        
        <div v-else-if="homeworkDetail" class="detail-content">
          <!-- 基本信息 -->
          <div class="detail-section">
            <h4 class="section-title">基本信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>作业ID:</label>
                <span>{{ homeworkDetail.id || '未知' }}</span>
              </div>
              <div class="detail-item">
                <label>作业名称:</label>
                <span>{{ homeworkDetail.name || '未命名作业' }}</span>
              </div>
              <div class="detail-item">
                <label>课程ID:</label>
                <span>{{ homeworkDetail.courseId || '未知' }}</span>
              </div>
              <div class="detail-item">
                <label>创建时间:</label>
                <span>{{ formatTime(homeworkDetail.createTime) }}</span>
              </div>
              <div class="detail-item">
                <label>更新时间:</label>
                <span>{{ formatTime(homeworkDetail.updateTime) }}</span>
              </div>
              <div class="detail-item">
                <label>创建者:</label>
                <span>{{ homeworkDetail.createBy || '未知' }}</span>
              </div>
              <div class="detail-item">
                <label>截止时间:</label>
                <span>{{ formatTime(homeworkDetail.overTime) || '未设置' }}</span>
              </div>
            </div>
          </div>
          
          <!-- 作业内容 -->
          <div class="detail-section">
            <h4 class="section-title">作业内容</h4>
            <div class="content-area">
              <div class="content-item">
                <label>教师内容:</label>
                <div class="content-text">
                  {{ homeworkDetail.tContent || '暂无内容' }}
                </div>
              </div>
              <div class="content-item">
                <label>教师文件:</label>
                <div class="content-text">
                  {{ homeworkDetail.tFile || '暂无文件' }}
                </div>
              </div>
              <div class="content-item">
                <label>学生内容:</label>
                <div class="content-text">
                  {{ homeworkDetail.sContent || '暂无内容' }}
                </div>
              </div>
              <div class="content-item">
                <label>学生文件:</label>
                <div class="content-text">
                  {{ homeworkDetail.sFile || '暂无文件' }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- 备注信息 -->
          <div class="detail-section" v-if="homeworkDetail.remark">
            <h4 class="section-title">备注信息</h4>
            <div class="remark-content">
              {{ homeworkDetail.remark }}
            </div>
          </div>
          
          <!-- 其他参数 -->
          <div class="detail-section" v-if="homeworkDetail.params && Object.keys(homeworkDetail.params).length > 0">
            <h4 class="section-title">其他参数</h4>
            <div class="params-content">
              <pre>{{ JSON.stringify(homeworkDetail.params, null, 2) }}</pre>
            </div>
          </div>
        </div>
        
        <div v-else class="error-state">
          <div class="error-icon">⚠️</div>
          <p>无法加载作业详情</p>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button type="button" class="btn btn-secondary" @click="closeDialog">
          关闭
        </button>
        <button 
          type="button" 
          class="btn btn-primary" 
          @click="editHomework"
          v-if="homeworkDetail"
        >
          编辑作业
        </button>
      </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import { getHomeworkById } from '@/api/homework';

// 定义props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  homeworkId: {
    type: [String, Number],
    default: null
  }
});

// 定义emits
const emit = defineEmits(['close', 'edit']);

// 响应式数据
const loading = ref(false);
const homeworkDetail = ref(null);

// 监听homeworkId变化，加载作业详情
watch(() => props.homeworkId, async (newHomeworkId) => {
  if (newHomeworkId && props.visible) {
    await loadHomeworkDetail(newHomeworkId);
  }
}, { immediate: true });

// 监听visible变化
watch(() => props.visible, async (newVisible) => {
  if (newVisible && props.homeworkId) {
    await loadHomeworkDetail(props.homeworkId);
  } else if (!newVisible) {
    // 对话框关闭时清空数据
    homeworkDetail.value = null;
  }
});

// 加载作业详情
const loadHomeworkDetail = async (homeworkId) => {
  loading.value = true;
  try {
    const response = await getHomeworkById(homeworkId);

    if (response && (response.code === 200 || response.code === 0) && response.data) {
      homeworkDetail.value = response.data;
    } else {
      homeworkDetail.value = null;
    }
  } catch (error) {
    homeworkDetail.value = null;
  } finally {
    loading.value = false;
  }
};

// 格式化时间
const formatTime = (timeString) => {
  if (!timeString) return '未知';
  try {
    return new Date(timeString).toLocaleString('zh-CN');
  } catch (error) {
    return timeString;
  }
};

// 关闭对话框
const closeDialog = () => {
  emit('close');
};

// 处理遮罩层点击
const handleOverlayClick = () => {
  closeDialog();
};

// 编辑作业
const editHomework = () => {
  emit('edit', homeworkDetail.value);
  closeDialog();
};
</script>

<style scoped>
/* 对话框遮罩层 */
.homework-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* 对话框主体 */
.homework-detail-dialog {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 对话框头部 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.dialog-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #e5e7eb;
  color: #374151;
}

/* 对话框内容 */
.dialog-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.detail-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.detail-item span {
  color: #6b7280;
  font-size: 0.875rem;
  word-break: break-word;
}

.content-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.content-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.content-item label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.content-text {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.75rem;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}

.remark-content {
  background-color: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.375rem;
  padding: 0.75rem;
  color: #92400e;
  font-size: 0.875rem;
  line-height: 1.4;
}

.params-content {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.75rem;
}

.params-content pre {
  margin: 0;
  font-size: 0.75rem;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .homework-detail-dialog {
    width: 95%;
    margin: 1rem;
  }
  
  .dialog-header,
  .dialog-content,
  .dialog-footer {
    padding: 1rem;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
