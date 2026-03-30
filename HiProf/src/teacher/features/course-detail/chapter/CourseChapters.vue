<template>
  <div class="course-chapters">
    <div class="section-header section-header--toolbar">
      <div class="section-actions">
        <button class="btn btn-primary" @click="enterChapterLearning">
          <i class="btn-icon learn-icon"></i>
          进入章节学习
        </button>
        <button class="btn btn-ai" @click="showAiGenerateDialog">
          <i class="btn-icon ai-icon"></i>
          AI智能生成章节
        </button>
        <ChapterEditor 
          :chapters="chapters" 
          :course-id="courseId" 
          @save="handleChaptersSaved" 
          @loading="setLoading" 
        />
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载章节列表...</p>
    </div>

    <!-- 章节列表 -->
    <div v-else-if="chapters.length > 0" class="chapters-list">
      <ChapterItem
        v-for="(chapter, index) in chapters"
        :key="chapter.id"
        :chapter="chapter"
        :index="index"
        @toggle="toggleChapter"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon" aria-hidden="true">
        <WorkspaceIcon name="chapters" :size="34" />
      </div>
      <h3 class="empty-title">暂无章节</h3>
      <p class="empty-description">开始创建您的第一个章节吧</p>
      <div class="empty-actions">
        <button class="btn btn-primary" @click="enterChapterLearning">
          <i class="learn-icon"></i>
          进入章节学习
        </button>
        <button class="btn btn-ai" @click="showAiGenerateDialog">
          <i class="ai-icon"></i>
          AI智能生成章节
        </button>
        <ChapterEditor 
          :chapters="chapters" 
          :course-id="courseId" 
          @save="handleChaptersSaved" 
          @loading="setLoading" 
        />
      </div>
    </div>



  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useChapterManagement } from '@/teacher/composables/useChapterManagement';
import WorkspaceIcon from '@/ui/workspace/WorkspaceIcon.vue';
import ChapterEditor from './ChapterEditor.vue';
import ChapterItem from './ChapterItem.vue';

// Props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
});

// 路由
const router = useRouter();

// 使用章节管理 Composable
const {
  loading,
  chapters,
  loadChapters,
  toggleChapter,
  createNewChapter,
  updateChapterInfo,
  deleteChapter
} = useChapterManagement(props.courseId);

// 新的处理方法
const setLoading = (isLoading) => {
  // 这里可以添加全局加载状态处理
};

const handleChaptersSaved = async () => {
  // 重新加载章节数据
  await loadChapters();
};

// 进入章节学习
const enterChapterLearning = () => {
  router.push({
    name: 'teacher-chapter-learning',
    params: {
      courseId: props.courseId
    }
  });
};

// 跳转到AI智能生成章节页面
const showAiGenerateDialog = () => {
  router.push({
    name: 'ai-chapter-generator',
    params: {
      courseId: props.courseId
    }
  });
};

// 组件挂载时加载数据
onMounted(() => {
  loadChapters();
});



</script>

<style scoped>
.course-chapters {
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
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
  background-color: #6366f1;
  color: white;
}

.btn-primary:hover {
  background-color: #4f46e5;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.btn-ai {
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  color: white;
  border: none;
}

.btn-ai:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.loading-state {
  text-align: center;
  padding: 3rem;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.chapters-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  border: 2px dashed #d1d5db;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.empty-description {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
}

.empty-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* 图标样式 */
.btn-icon, .plus-icon, .ai-icon, .learn-icon {
  width: 1rem;
  height: 1rem;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.plus-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.ai-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v-.07zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/%3E%3C/svg%3E");
}

.learn-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/%3E%3C/svg%3E");
}
</style>
