<template>
  <div class="my-lessons-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <i class="back-icon">←</i>
          返回
        </button>
        <h1 class="page-title">我的教案</h1>
      </div>
      <div class="header-right">
        <button class="btn btn-primary" @click="createNewLesson">
          <i class="add-icon">+</i>
          创建教案
        </button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-section">
      <div class="search-box">
        <input 
          v-model="searchKeyword" 
          type="text" 
          placeholder="搜索教案标题..."
          class="search-input"
          @input="handleSearch"
        >
        <i class="search-icon">🔍</i>
      </div>
      <div class="filter-options">
        <select v-model="selectedCourse" @change="handleFilter" class="filter-select">
          <option value="">全部课程</option>
          <option v-for="course in courses" :key="course.id" :value="course.id">
            {{ course.name }}
          </option>
        </select>
        <select v-model="sortBy" @change="handleSort" class="filter-select">
          <option value="createTime">按创建时间</option>
          <option value="updateTime">按更新时间</option>
          <option value="title">按标题</option>
        </select>
      </div>
    </div>

    <!-- 教案列表 -->
    <div class="lessons-container">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载教案列表...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredLessons.length === 0" class="empty-state">
        <div class="empty-icon">📄</div>
        <h3 class="empty-title">{{ searchKeyword ? '未找到相关教案' : '还没有教案' }}</h3>
        <p class="empty-desc">
          {{ searchKeyword ? '试试其他关键词或清空搜索条件' : '点击"创建教案"开始制作你的第一个教案' }}
        </p>
        <button v-if="!searchKeyword" class="btn btn-primary" @click="createNewLesson">
          创建教案
        </button>
      </div>

      <!-- 教案网格 -->
      <div v-else class="lessons-grid">
        <div 
          v-for="lesson in paginatedLessons" 
          :key="lesson.id" 
          class="lesson-card"
          @click="viewLesson(lesson)"
        >
          <div class="lesson-header">
            <h3 class="lesson-title">{{ lesson.title }}</h3>
            <div class="lesson-actions" @click.stop>
              <button 
                class="action-btn edit-btn" 
                @click="editLesson(lesson)"
                title="编辑"
              >
                ✏️
              </button>
              <button 
                class="action-btn export-btn" 
                @click="exportLesson(lesson)"
                title="导出"
              >
                📥
              </button>
              <button 
                class="action-btn delete-btn" 
                @click="deleteLesson(lesson)"
                title="删除"
              >
                🗑️
              </button>
            </div>
          </div>
          
          <div class="lesson-content">
            <div class="lesson-meta">
              <span class="lesson-course">{{ getCourseNameById(lesson.courseId) }}</span>
              <span class="lesson-modules">{{ lesson.moduleCount || 0 }} 个模块</span>
            </div>
            <p class="lesson-desc">{{ lesson.description || '暂无描述' }}</p>
          </div>
          
          <div class="lesson-footer">
            <div class="lesson-dates">
              <span class="create-date">创建：{{ formatDate(lesson.createTime) }}</span>
              <span class="update-date">更新：{{ formatDate(lesson.updateTime) }}</span>
            </div>
            <div class="lesson-status">
              <span class="status-badge" :class="lesson.status">
                {{ getStatusText(lesson.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          class="page-btn" 
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          上一页
        </button>
        <span class="page-info">
          第 {{ currentPage }} / {{ totalPages }} 页，共 {{ filteredLessons.length }} 个教案
        </span>
        <button 
          class="page-btn" 
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteDialog" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">确认删除</h3>
        </div>
        <div class="modal-body">
          <p>确定要删除教案"{{ lessonToDelete?.title }}"吗？</p>
          <p class="warning-text">此操作无法撤销！</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="cancelDelete">取消</button>
          <button class="btn btn-danger" @click="confirmDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getLessonPlanList, deleteLessonPlan } from '@/api/lessonPlan';
import { getCoursesList } from '@/api/courses';
import { downloadLessonPlanAsWord } from '@/utils/wordGenerator';

// 导入样式
import '@/teacher/styles/my-lessons.css';

const router = useRouter();

// 响应式数据
const loading = ref(false);
const lessons = ref([]);
const courses = ref([]);
const searchKeyword = ref('');
const selectedCourse = ref('');
const sortBy = ref('createTime');
const currentPage = ref(1);
const pageSize = ref(12);

// 删除确认对话框
const showDeleteDialog = ref(false);
const lessonToDelete = ref(null);

// 计算属性
const filteredLessons = computed(() => {
  let result = [...lessons.value];
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(lesson => 
      lesson.title.toLowerCase().includes(keyword) ||
      (lesson.description && lesson.description.toLowerCase().includes(keyword))
    );
  }
  
  // 课程过滤
  if (selectedCourse.value) {
    result = result.filter(lesson => lesson.courseId === selectedCourse.value);
  }
  
  // 排序
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'updateTime':
        return new Date(b.updateTime) - new Date(a.updateTime);
      case 'createTime':
      default:
        return new Date(b.createTime) - new Date(a.createTime);
    }
  });
  
  return result;
});

const totalPages = computed(() => {
  return Math.ceil(filteredLessons.value.length / pageSize.value);
});

const paginatedLessons = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredLessons.value.slice(start, end);
});

// 方法
const loadLessons = async () => {
  loading.value = true;
  try {
    const response = await getLessonPlanList();
    if (response && response.rows) {
      lessons.value = response.rows.map(lesson => ({
        ...lesson,
        moduleCount: lesson.tpModuleList?.length || 0,
        status: 'published' // 默认状态
      }));
    }
  } catch (error) {
    console.error('获取教案列表失败:', error);
    alert('获取教案列表失败，请重试');
  } finally {
    loading.value = false;
  }
};

const loadCourses = async () => {
  try {
    const response = await getCoursesList();
    if (response && response.rows) {
      courses.value = response.rows;
    }
  } catch (error) {
    console.error('获取课程列表失败:', error);
  }
};

const getCourseNameById = (courseId) => {
  const course = courses.value.find(c => c.id === courseId);
  return course ? course.name : '未知课程';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getStatusText = (status) => {
  const statusMap = {
    draft: '草稿',
    published: '已发布',
    archived: '已归档'
  };
  return statusMap[status] || '未知';
};

const handleSearch = () => {
  currentPage.value = 1; // 重置到第一页
};

const handleFilter = () => {
  currentPage.value = 1; // 重置到第一页
};

const handleSort = () => {
  currentPage.value = 1; // 重置到第一页
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const goBack = () => {
  router.back();
};

const createNewLesson = () => {
  // 跳转到教案生成页面，这里可以显示课程选择
  router.push('/teacher/my');
};

const viewLesson = (lesson) => {
  console.log('查看教案:', lesson);
  // TODO: 实现教案详情查看
  alert('教案详情功能正在开发中...');
};

const editLesson = (lesson) => {
  console.log('编辑教案:', lesson);
  // TODO: 实现教案编辑功能
  alert('教案编辑功能正在开发中...');
};

const exportLesson = async (lesson) => {
  try {
    // 构建教案内容
    let content = `[${lesson.title}]\n\n`;
    
    if (lesson.tpModuleList && lesson.tpModuleList.length > 0) {
      lesson.tpModuleList.forEach(module => {
        content += `### ${module.title} ###\n`;
        content += `${module.content || ''}\n\n`;
      });
    } else {
      content += '教案内容为空';
    }
    
    const filename = `${lesson.title}_${formatDate(lesson.createTime)}.docx`;
    await downloadLessonPlanAsWord(content, filename);
    alert('教案导出成功！');
  } catch (error) {
    console.error('导出教案失败:', error);
    alert('导出教案失败，请重试');
  }
};

const deleteLesson = (lesson) => {
  lessonToDelete.value = lesson;
  showDeleteDialog.value = true;
};

const cancelDelete = () => {
  showDeleteDialog.value = false;
  lessonToDelete.value = null;
};

const confirmDelete = async () => {
  if (!lessonToDelete.value) return;
  
  try {
    await deleteLessonPlan(lessonToDelete.value.id);
    
    // 从列表中移除
    const index = lessons.value.findIndex(l => l.id === lessonToDelete.value.id);
    if (index !== -1) {
      lessons.value.splice(index, 1);
    }
    
    alert('教案删除成功！');
    showDeleteDialog.value = false;
    lessonToDelete.value = null;
  } catch (error) {
    console.error('删除教案失败:', error);
    alert('删除教案失败，请重试');
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadLessons();
  loadCourses();
});
</script>