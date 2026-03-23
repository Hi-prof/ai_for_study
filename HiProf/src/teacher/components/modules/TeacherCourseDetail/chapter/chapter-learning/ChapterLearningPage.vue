<template>
  <div class="chapter-learning-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="handleBack">
          <i class="back-icon">←</i>
          返回课程
        </button>
        <div class="course-info">
          <h1 class="course-title">{{ courseInfo.title }}</h1>
          <span class="course-teacher">{{ courseInfo.teacher }}</span>
        </div>
      </div>
      <div class="header-right">
        <div class="learning-progress">
          <span class="progress-text">学习进度</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${learningProgress}%` }"></div>
          </div>
          <span class="progress-value">{{ learningProgress }}%</span>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧：章节详情区域 -->
      <div class="left-panel">
        <!-- 当前章节信息 -->
        <div class="current-chapter-info">
          <div class="chapter-header">
            <h2 class="chapter-title">{{ currentChapter?.title || '选择章节开始学习' }}</h2>
            <div class="chapter-meta">
              <span class="chapter-number">第{{ currentChapterIndex + 1 }}章</span>
              <span class="chapter-status" :class="getChapterStatusClass(currentChapter)">
                {{ getChapterStatusText(currentChapter) }}
              </span>
            </div>
          </div>
          
          <div v-if="currentChapter" class="chapter-content">
            <div class="chapter-description">
              <h3>学习目标</h3>
              <p>{{ currentChapter.description || '暂无描述' }}</p>
            </div>
            
            <div v-if="currentChapter.detailContent" class="chapter-detail">
              <h3>详细内容</h3>
              <div class="detail-content" v-html="currentChapter.detailContent"></div>
            </div>
          </div>
        </div>

        <!-- 章节文件列表 -->
        <div v-if="currentChapter" class="chapter-files-section">
          <ChapterFileList
            :course-id="courseId"
            :node-name="currentChapter.title"
            :node-id="null"
            @upload-success="handleFileUploadSuccess"
            @upload-error="handleFileUploadError"
          />
        </div>

      </div>

      <!-- 右侧：章节图谱区域 -->
      <div class="right-panel">
        <div class="chapter-map-section">
          <div class="section-header">
            <h3>章节导航</h3>
          </div>

          <!-- 章节图谱容器 -->
          <div class="chapter-map-container">
            <!-- 章节列表视图 -->
            <div class="list-map-view">
              <template v-for="(chapter, index) in chapters" :key="chapter.id">
                <!-- 主章节 -->
                <div
                  class="chapter-item"
                  :class="{
                    'active': chapter.id === currentChapterId,
                    'completed': chapter.progress === 100
                  }"
                  @click="handleChapterSelect(chapter.id)"
                >
                  <span class="chapter-number">{{ index + 1 }}</span>
                  <span class="chapter-title">{{ chapter.title }}</span>
                </div>

                <!-- 子章节 -->
                <template v-if="chapter.sections && chapter.sections.length > 0">
                  <div
                    v-for="(section, sectionIndex) in chapter.sections"
                    :key="`${chapter.id}-${section.id}`"
                    class="chapter-item sub-chapter"
                    :class="{
                      'active': section.id === currentChapterId,
                      'completed': section.progress === 100
                    }"
                    @click="handleChapterSelect(section.id)"
                  >
                    <span class="chapter-number">{{ index + 1 }}.{{ sectionIndex + 1 }}</span>
                    <span class="chapter-title">{{ section.title }}</span>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useChapterManagement } from '@/composables/useChapterManagement';
import { getCourseById } from '@/api/courses';
import ChapterFileList from '../ChapterFileList.vue';

// 路由相关
const route = useRoute();
const router = useRouter();

// Props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  },
  chapterId: {
    type: [String, Number],
    default: null
  }
});

// 响应式数据
const courseInfo = ref({
  title: '',
  teacher: '',
  description: ''
});

const currentChapterId = ref(props.chapterId);
const learningProgress = ref(0);

// 使用章节管理 Composable
const {
  loading,
  chapters,
  loadChapters,
  toggleChapter
} = useChapterManagement(props.courseId);

// 计算属性
const currentChapter = computed(() => {
  return chapters.value.find(c => c.id === currentChapterId.value);
});

const currentChapterIndex = computed(() => {
  return chapters.value.findIndex(c => c.id === currentChapterId.value);
});

// 方法
const handleBack = () => {
  router.push({
    name: 'teacher-course-detail',
    params: { courseId: props.courseId }
  });
};

const handleChapterSelect = (chapterId) => {
  currentChapterId.value = chapterId;
  loadChapterFiles(chapterId);
};


const updateLearningProgress = () => {
  const completedChapters = chapters.value.filter(c => c.progress === 100).length;
  learningProgress.value = Math.round((completedChapters / chapters.value.length) * 100);
};

const loadChapterFiles = async (chapterId) => {
  try {
    // 章节文件现在通过 ChapterFileList 组件处理
    // 这里保留接口以备将来扩展
    console.log('加载章节文件:', chapterId);
  } catch (error) {
    console.error('加载章节文件失败:', error);
  }
};

const getChapterStatusClass = (chapter) => {
  if (!chapter) return '';
  if (chapter.progress === 100) return 'completed';
  if (chapter.id === currentChapterId.value) return 'current';
  return 'pending';
};

const getChapterStatusText = (chapter) => {
  if (!chapter) return '';
  if (chapter.progress === 100) return '已完成';
  if (chapter.id === currentChapterId.value) return '学习中';
  return '未开始';
};



// 这些工具函数已移至 ChapterFileList 组件中

const handleFileUploadSuccess = () => {
  console.log('文件上传成功');
  // 可以在这里添加成功提示或其他逻辑
};

const handleFileUploadError = (error) => {
  console.error('文件上传失败:', error);
  // 可以在这里添加错误提示
};

// 加载课程信息
const loadCourseInfo = async () => {
  try {
    const response = await getCourseById(props.courseId);
    if (response && response.code === 200 && response.data) {
      courseInfo.value = {
        title: response.data.name || '未命名课程',
        teacher: response.data.teacherName || '未知教师',
        description: response.data.description || ''
      };
    }
  } catch (error) {
    console.error('加载课程信息失败:', error);
  }
};

// 监听当前章节变化
watch(currentChapterId, (newChapterId) => {
  if (newChapterId) {
    loadChapterFiles(newChapterId);
  }
});

// 加载所有章节的子节点
const loadAllChapterSections = async () => {
  for (const chapter of chapters.value) {
    if (!chapter.sectionsLoaded) {
      await toggleChapter(chapter.id);
    }
  }
};

// 组件挂载
onMounted(async () => {
  await Promise.all([
    loadCourseInfo(),
    loadChapters()
  ]);

  // 加载所有章节的子节点以显示完整的导航
  await loadAllChapterSections();

  // 如果没有指定章节ID，默认选择第一个章节
  if (!currentChapterId.value && chapters.value.length > 0) {
    currentChapterId.value = chapters.value[0].id;
  }

  // 加载当前章节文件
  if (currentChapterId.value) {
    loadChapterFiles(currentChapterId.value);
  }

  // 计算学习进度
  updateLearningProgress();
});
</script>

<style scoped>
.chapter-learning-page {
  min-height: 100vh;
  background-color: var(--background-light, #f5f5f5);
  display: flex;
  flex-direction: column;
}

/* 页面头部 */
.page-header {
  background: white;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--background-light, #f5f5f5);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 0.375rem;
  color: var(--text-color, #333);
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--primary-color, #3498db);
  color: white;
}

.back-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.course-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.course-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color, #333);
  margin: 0;
}

.course-teacher {
  font-size: 0.875rem;
  color: var(--text-light, #666);
}

.header-right {
  display: flex;
  align-items: center;
}

.learning-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-text {
  font-size: 0.875rem;
  color: var(--text-light, #666);
}

.progress-bar {
  width: 200px;
  height: 8px;
  background: var(--background-light, #f5f5f5);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar.small {
  width: 100px;
  height: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color, #3498db), var(--secondary-color, #2ecc71));
  transition: width 0.3s ease;
}

.progress-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary-color, #3498db);
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 1rem;
  padding: 1rem 2rem;
  width: 100%;
}

/* 左侧面板 */
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.current-chapter-info {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.chapter-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color, #333);
  margin: 0;
  flex: 1;
}

.chapter-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.chapter-number {
  font-size: 0.875rem;
  color: var(--text-light, #666);
  background: var(--background-light, #f5f5f5);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
}

.chapter-status {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-weight: 500;
}

.chapter-status.completed {
  background: var(--success-color, #2ecc71);
  color: white;
}

.chapter-status.current {
  background: var(--primary-color, #3498db);
  color: white;
}

.chapter-status.pending {
  background: var(--background-light, #f5f5f5);
  color: var(--text-light, #666);
}

.chapter-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chapter-description h3,
.chapter-detail h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color, #333);
  margin: 0 0 0.5rem 0;
}

.chapter-description p {
  color: var(--text-light, #666);
  line-height: 1.6;
  margin: 0;
}

.detail-content {
  color: var(--text-light, #666);
  line-height: 1.6;
}

/* 章节文件区域 */
.chapter-files-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 章节文件区域样式已移至 ChapterFileList 组件 */

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color, #333);
  margin: 0;
}

.action-btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 0.25rem;
  background: white;
  color: var(--text-color, #333);
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--primary-color, #3498db);
  color: white;
  border-color: var(--primary-color, #3498db);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn:disabled:hover {
  background: white;
  color: var(--text-color, #333);
  border-color: var(--border-color, #e0e0e0);
}

/* 空状态样式已移至 ChapterFileList 组件 */


/* 右侧面板 */
.right-panel {
  display: flex;
  flex-direction: column;
}

.chapter-map-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: fit-content;
  max-height: calc(100vh - 200px);
  margin-left: 2rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.map-controls {
  display: flex;
  gap: 0.5rem;
}

.control-btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 0.25rem;
  background: white;
  color: var(--text-color, #333);
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.control-btn:hover {
  background: var(--primary-color, #3498db);
  color: white;
  border-color: var(--primary-color, #3498db);
}

.chapter-map-container {
  flex: 1;
  overflow-y: auto;
  margin-top: 1rem;
}

/* 列表视图 */
.list-map-view {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.chapter-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-left: 3px solid transparent;
}

.chapter-item:hover {
  background-color: #f8f9fa;
}

.chapter-item.active {
  background-color: #e3f2fd;
  border-left-color: var(--primary-color, #3498db);
}

.chapter-item.sub-chapter {
  padding-left: 2.5rem;
  background-color: #fafafa;
}

.chapter-item.sub-chapter:hover {
  background-color: #f0f0f0;
}

.chapter-item.sub-chapter.active {
  background-color: #e8f4fd;
}

.chapter-number {
  font-size: 0.875rem;
  color: var(--text-light, #666);
  min-width: 3rem;
  font-weight: 500;
}

.chapter-title {
  flex: 1;
  font-size: 0.875rem;
  color: var(--text-color, #333);
  margin-left: 0.5rem;
}



/* 响应式设计 */
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .right-panel {
    order: -1;
  }

  .chapter-map-section {
    max-height: 300px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .header-left {
    width: 100%;
  }

  .learning-progress {
    width: 100%;
    justify-content: space-between;
  }

  .progress-bar {
    width: 150px;
  }

  .main-content {
    padding: 0.5rem;
  }

}
</style>
