<template>
  <div class="outline-list">
    <div class="search-container">
      <div class="search-box">
        <input
          type="text"
          placeholder="搜索..."
          v-model="searchQuery"
          @input="filterCourses"
        />
        <i class="search-icon"></i>
      </div>
    </div>
    
    <div class="outline-grid">
      <div 
        v-for="course in filteredCourses" 
        :key="course.id" 
        class="outline-card"
      >
        <div class="outline-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9h14V7H3v2zm0 4h14v-2H3v2zm0 4h14v-2H3v2zm16 0h2v-2h-2v2zm0-10v2h2V7h-2zm0 6h2v-2h-2v2z" fill="currentColor"/>
          </svg>
        </div>
        <div class="outline-info" @click="selectOutline(course)">
          <h3 class="outline-title">{{ course.title }}</h3>
          <p class="outline-details">{{ course.description || '暂无描述' }}</p>
          <div class="outline-meta">
            <span class="outline-nodes">{{ course.nodeCount || '未知' }} 个知识点</span>
            <span class="outline-date">{{ formatDate(course.updatedAt) }}</span>
          </div>
        </div>
        <div class="outline-actions-bar">
          <button class="action-btn edit-btn" @click.stop="editCourse(course)" title="编辑">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
            </svg>
          </button>
          <button class="action-btn delete-btn" @click.stop="confirmDeleteCourse(course)" title="删除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div v-if="filteredCourses.length === 0 && !isLoading" class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" fill="currentColor"/>
          </svg>
        </div>
        <h3>没有找到大纲</h3>
        <p>尝试调整搜索条件或者创建一个新的大纲</p>
      </div>
      
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>正在加载大纲...</p>
      </div>
    </div>
    
    <div class="outline-actions">
      <button class="btn-create" @click="openCreateCourseDialog">
        <span class="btn-icon">+</span>
        <span>创建新大纲</span>
      </button>
    </div>
    
    <!-- 创建/编辑大纲对话框 -->
    <div v-if="showCourseDialog" class="dialog-overlay" @click="closeCourseDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>{{ isEditing ? '编辑大纲' : '创建新大纲' }}</h3>
          <button class="close-btn" @click="closeCourseDialog">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label for="course-title">大纲标题</label>
            <input 
              id="course-title" 
              v-model="editingCourse.title" 
              type="text" 
              placeholder="输入大纲标题"
              required
              :class="{ 'has-error': validation.title }"
            />
            <p v-if="validation.title" class="error-message">{{ validation.title }}</p>
          </div>
          <div class="form-group">
            <label for="course-description">大纲描述</label>
            <textarea 
              id="course-description" 
              v-model="editingCourse.description" 
              placeholder="输入大纲描述"
              rows="4"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="closeCourseDialog">取消</button>
          <button class="btn-save" @click="saveCourse" :disabled="isSaving">
            <span v-if="isSaving" class="spinner-sm"></span>
            <span>{{ isSaving ? '保存中...' : '保存' }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="dialog-overlay" @click="cancelDelete">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>确认删除</h3>
          <button class="close-btn" @click="cancelDelete">×</button>
        </div>
        <div class="dialog-body">
          <p>确定要删除大纲 "{{ courseToDelete?.title }}" 吗？</p>
          <p class="warning-text">此操作不可逆，删除后数据无法恢复。</p>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="cancelDelete">取消</button>
          <button class="btn-delete" @click="deleteCourseConfirmed" :disabled="isDeleting">
            <span v-if="isDeleting" class="spinner-sm"></span>
            <span>{{ isDeleting ? '删除中...' : '确认删除' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineEmits } from 'vue';
import { getKnowledgeGraphList, createKnowledgeGraph, updateKnowledgeGraph, deleteKnowledgeGraph } from '@/api/graph';
import { useRouter } from 'vue-router';

const router = useRouter();
const courses = ref([]);
const searchQuery = ref('');
const isLoading = ref(true);

const emit = defineEmits(['select-outline']);

// 对话框状态
const showCourseDialog = ref(false);
const isEditing = ref(false);
const editingCourse = ref({
  title: '',
  description: ''
});
const validation = ref({});
const isSaving = ref(false);

// 删除确认状态
const showDeleteConfirm = ref(false);
const courseToDelete = ref(null);
const isDeleting = ref(false);

// 过滤后的课程列表
const filteredCourses = computed(() => {
  if (!searchQuery.value.trim()) return courses.value;
  
  const query = searchQuery.value.toLowerCase();
  return courses.value.filter(course => 
    course.title.toLowerCase().includes(query) || 
    (course.description && course.description.toLowerCase().includes(query))
  );
});

// 获取课程列表
const fetchCourses = async () => {
  isLoading.value = true;
  try {
    const response = await getKnowledgeGraphList();
    if (response && response.rows && Array.isArray(response.rows)) {
      courses.value = response.rows.map(course => ({
        ...course,
        // 标准化属性名，有些API可能返回name而不是title
        title: course.title || course.name || `图谱 #${course.id}`,
        // 确保有一个默认描述
        description: course.description || course.content || `${course.title || course.name || '知识图谱'}相关知识点的结构化大纲`,
        // 如果API没有提供更新时间，使用当前时间
        updatedAt: course.updatedAt || new Date().toISOString()
      }));
    } else if (Array.isArray(response)) {
      courses.value = response.map(course => ({
        ...course,
        title: course.title || course.name || `图谱 #${course.id}`,
        description: course.description || course.content || `${course.title || course.name || '知识图谱'}相关知识点的结构化大纲`,
        updatedAt: course.updatedAt || new Date().toISOString()
      }));
    } else {
      console.error('获取的课程列表格式不正确:', response);
      courses.value = [];
    }
  } catch (error) {
    console.error('获取课程列表失败:', error);
    courses.value = [];
  } finally {
    isLoading.value = false;
  }
};

// 选择大纲
const selectOutline = (course) => {
  if (course && course.id) {
    // 发送事件给父组件
    emit('select-outline', course);
  }
};

// 打开创建大纲对话框
const openCreateCourseDialog = () => {
  isEditing.value = false;
  editingCourse.value = {
    title: '',
    description: ''
  };
  validation.value = {};
  showCourseDialog.value = true;
};

// 打开编辑大纲对话框
const editCourse = (course) => {
  isEditing.value = true;
  editingCourse.value = {
    id: course.id,
    title: course.title,
    description: course.description || ''
  };
  validation.value = {};
  showCourseDialog.value = true;
};

// 关闭对话框
const closeCourseDialog = () => {
  showCourseDialog.value = false;
};

// 验证表单
const validateForm = () => {
  const errors = {};
  
  if (!editingCourse.value.title.trim()) {
    errors.title = '大纲标题不能为空';
  }
  
  validation.value = errors;
  return Object.keys(errors).length === 0;
};

// 保存大纲
const saveCourse = async () => {
  if (!validateForm()) return;
  
  isSaving.value = true;
  try {
    if (isEditing.value) {
      // 更新现有大纲
      await updateKnowledgeGraph(editingCourse.value.id, editingCourse.value);
      
      // 更新本地列表
      const index = courses.value.findIndex(c => c.id === editingCourse.value.id);
      if (index !== -1) {
        courses.value[index] = {
          ...courses.value[index],
          title: editingCourse.value.title,
          description: editingCourse.value.description,
          updatedAt: new Date().toISOString()
        };
      }
    } else {
      // 创建新大纲
      const result = await createKnowledgeGraph(editingCourse.value);
      
      // 添加到本地列表
      if (result && result.id) {
        courses.value.push({
          ...result,
          description: editingCourse.value.description,
          updatedAt: new Date().toISOString(),
          nodeCount: 0
        });
      }
    }
    
    closeCourseDialog();
  } catch (error) {
    console.error(isEditing.value ? '更新大纲失败:' : '创建大纲失败:', error);
    alert(isEditing.value ? '更新大纲失败，请重试' : '创建大纲失败，请重试');
  } finally {
    isSaving.value = false;
  }
};

// 确认删除大纲
const confirmDeleteCourse = (course) => {
  courseToDelete.value = course;
  showDeleteConfirm.value = true;
};

// 取消删除
const cancelDelete = () => {
  courseToDelete.value = null;
  showDeleteConfirm.value = false;
};

// 确认删除
const deleteCourseConfirmed = async () => {
  if (!courseToDelete.value || !courseToDelete.value.id) return;
  
  isDeleting.value = true;
  try {
    await deleteKnowledgeGraph(courseToDelete.value.id);
    
    // 从本地列表中移除
    courses.value = courses.value.filter(c => c.id !== courseToDelete.value.id);
    
    cancelDelete();
  } catch (error) {
    console.error('删除大纲失败:', error);
    alert('删除大纲失败，请重试');
  } finally {
    isDeleting.value = false;
  }
};

// 搜索过滤
const filterCourses = () => {
  console.log('过滤大纲，关键词:', searchQuery.value);
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知时间';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (e) {
    return '未知时间';
  }
};

onMounted(() => {
  fetchCourses();
});
</script>

<style scoped>
@import '@/teacher/styles/create-course.css';
.outline-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem 0.75rem;
  background-color: var(--background-color);
  border-radius: 12px;
}

.search-container {
  margin-bottom: 1rem;
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 320px;
  margin: 0 auto 0 0;
}

.search-box input {
  width: 100%;
  height: 36px;
  padding: 0 36px 0 12px;
  font-size: 14px;
  border-radius: 8px;
  border: none;
  background-color: rgba(142, 142, 147, 0.12);
  color: var(--text-color);
  outline: none;
  transition: all 0.3s ease;
}

.search-box input:focus {
  background-color: rgba(142, 142, 147, 0.18);
  box-shadow: 0 0 0 1px var(--primary-color);
}

.search-icon {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  opacity: 0.5;
}

.outline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.outline-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 1.5rem;
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.08);
  height: 100%;
  min-height: 180px;
}

.outline-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.outline-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  cursor: pointer;
}

.outline-info:active {
  transform: scale(0.98);
}

.outline-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background-color: #007AFF;
  color: white;
  margin-bottom: 1rem;
}

.outline-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--text-color);
}

.outline-details {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0 0 auto;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.outline-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  font-size: 13px;
  color: var(--text-tertiary);
}

.outline-date, .outline-nodes {
  display: inline-block;
}

/* 卡片操作栏 */
.outline-actions-bar {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.outline-card:hover .outline-actions-bar {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  color: #555;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.action-btn:hover {
  transform: scale(1.1);
}

.action-btn.edit-btn:hover {
  background-color: #007AFF;
  color: white;
}

.action-btn.delete-btn:hover {
  background-color: #FF3B30;
  color: white;
}

/* 创建大纲按钮 */
.outline-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

/* btn-create 样式已迁移到 create-course.css */

.btn-icon {
  font-size: 20px;
  margin-right: 8px;
  line-height: 1;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  width: 100%;
  max-width: 500px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: dialog-appear 0.3s ease;
}

@keyframes dialog-appear {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  color: #999;
  cursor: pointer;
  padding: 0 8px;
}

.close-btn:hover {
  color: #333;
}

.dialog-body {
  padding: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

/* 表单样式 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #007AFF;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
  outline: none;
}

.has-error {
  border-color: #FF3B30 !important;
}

.error-message {
  color: #FF3B30;
  font-size: 14px;
  margin-top: 4px;
}

/* 按钮样式 */
.btn-save,
.btn-cancel,
.btn-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  height: 40px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-save {
  background-color: #007AFF;
  color: white;
  min-width: 80px;
}

.btn-save:hover {
  background-color: #0071e3;
}

.btn-save:disabled {
  background-color: #99caff;
  cursor: not-allowed;
}

.btn-cancel {
  background-color: transparent;
  color: #666;
}

.btn-cancel:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.btn-delete {
  background-color: #FF3B30;
  color: white;
  min-width: 100px;
}

.btn-delete:hover {
  background-color: #e0352b;
}

.btn-delete:disabled {
  background-color: #ffadaa;
  cursor: not-allowed;
}

/* 警告文本 */
.warning-text {
  color: #FF3B30;
  font-weight: 500;
}

/* 小型加载动画 */
.spinner-sm {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

/* 空状态和加载状态 */
.empty-state, .loading-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--text-secondary);
}

.empty-icon, .loading-icon {
  margin-bottom: 1rem;
  color: var(--text-tertiary);
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 20px;
  margin: 0 0 0.5rem;
  color: var(--text-color);
}

.empty-state p {
  font-size: 15px;
  margin: 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 122, 255, 0.2);
  border-top-color: #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .outline-card {
    background-color: #1C1C1E;
    border-color: rgba(255, 255, 255, 0.08);
  }
  
  .action-btn {
    background: rgba(45, 45, 48, 0.9);
    color: #ccc;
  }
  
  .dialog-content {
    background-color: #1C1C1E;
    color: white;
  }
  
  .dialog-header,
  .dialog-footer {
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .form-group label {
    color: #eee;
  }
  
  .form-group input,
  .form-group textarea {
    background-color: #2C2C2E;
    border-color: rgba(255, 255, 255, 0.2);
    color: white;
  }
  
  .close-btn {
    color: #777;
  }
  
  .close-btn:hover {
    color: #ddd;
  }
  
  .btn-cancel {
    color: #aaa;
  }
  
  .btn-cancel:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .outline-grid {
    grid-template-columns: 1fr;
  }
  
  .outline-list {
    padding: 1rem;
  }
  
  .dialog-content {
    max-width: 90%;
    margin: 0 16px;
  }
}
</style> 