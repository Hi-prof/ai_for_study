<template>
  <div class="demo-container">
    <h1>章节学习页面演示</h1>
    
    <div class="demo-controls">
      <label>
        课程ID:
        <input v-model="demoProps.courseId" type="text" placeholder="输入课程ID" />
      </label>
      <label>
        章节ID (可选):
        <input v-model="demoProps.chapterId" type="text" placeholder="输入章节ID" />
      </label>
      <button @click="refreshDemo">刷新演示</button>
    </div>

    <div class="demo-content">
      <ChapterLearningPage 
        v-if="showDemo"
        :course-id="demoProps.courseId" 
        :chapter-id="demoProps.chapterId || undefined"
        @chapter-select="handleChapterSelect"
      />
    </div>

    <div class="demo-info">
      <h3>组件信息</h3>
      <ul>
        <li>当前课程ID: {{ demoProps.courseId }}</li>
        <li>当前章节ID: {{ demoProps.chapterId || '未指定' }}</li>
        <li>最后选择的章节: {{ lastSelectedChapter || '无' }}</li>
      </ul>
      
      <h3>功能说明</h3>
      <ul>
        <li>左侧显示当前章节的详细信息和学习资源</li>
        <li>右侧显示章节导航图谱，支持列表和树形视图切换</li>
        <li>点击右侧章节节点可以快速导航到对应章节</li>
        <li>支持上一章/下一章导航和完成标记</li>
        <li>响应式设计，适配不同屏幕尺寸</li>
      </ul>

      <h3>测试建议</h3>
      <ul>
        <li>使用真实的课程ID进行测试</li>
        <li>尝试不同的章节ID参数</li>
        <li>测试响应式布局（调整浏览器窗口大小）</li>
        <li>测试章节导航功能</li>
        <li>测试文件上传和管理功能</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import ChapterLearningPage from './ChapterLearningPage.vue';

// 演示数据
const showDemo = ref(true);
const lastSelectedChapter = ref(null);

const demoProps = reactive({
  courseId: '1', // 默认课程ID
  chapterId: '' // 默认为空，让组件自动选择第一个章节
});

// 方法
const handleChapterSelect = (chapterId) => {
  lastSelectedChapter.value = chapterId;
  console.log('选择了章节:', chapterId);
};

const refreshDemo = () => {
  showDemo.value = false;
  setTimeout(() => {
    showDemo.value = true;
  }, 100);
};
</script>

<style scoped>
.demo-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-container h1 {
  color: var(--text-color, #333);
  margin-bottom: 2rem;
  text-align: center;
}

.demo-controls {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.demo-controls label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--text-color, #333);
}

.demo-controls input {
  padding: 0.5rem;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 0.25rem;
  font-size: 0.875rem;
  min-width: 150px;
}

.demo-controls button {
  padding: 0.5rem 1rem;
  background: var(--primary-color, #3498db);
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.demo-controls button:hover {
  background: #2980b9;
}

.demo-content {
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  min-height: 600px;
}

.demo-info {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.demo-info h3 {
  color: var(--text-color, #333);
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
}

.demo-info h3:not(:first-child) {
  margin-top: 2rem;
}

.demo-info ul {
  margin: 0;
  padding-left: 1.5rem;
}

.demo-info li {
  margin-bottom: 0.5rem;
  color: var(--text-light, #666);
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .demo-container {
    padding: 1rem;
  }
  
  .demo-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .demo-controls label {
    width: 100%;
  }
  
  .demo-controls input {
    min-width: auto;
  }
}
</style>
