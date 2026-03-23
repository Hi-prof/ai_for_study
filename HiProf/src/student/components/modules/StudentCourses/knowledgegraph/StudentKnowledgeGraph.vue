<template>
  <div class="student-knowledge-graph">
    <!-- 页面标题 -->
    <div class="section-header">
      <div class="section-title-area">
        <h2 class="section-title">知识图谱</h2>
        <span v-if="currentKnowledgeGraph" class="graph-name">{{ currentKnowledgeGraph.name }}</span>
      </div>
      <div class="section-actions">
        <button
          class="btn btn-outline"
          @click="goToOutline"
          :disabled="!currentKnowledgeGraph || loading"
        >
          <i class="btn-icon outline-icon"></i>
          进入大纲
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载知识图谱...</p>
    </div>

    <!-- 知识图谱容器 -->
    <div v-else-if="currentKnowledgeGraph" class="graph-container">
      <!-- 嵌入式图谱可视化界面 -->
      <iframe
        :key="iframeKey"
        :src="getGraphUrl()"
        class="graph-iframe"
        frameborder="0"
        @load="onGraphIframeLoad"
        @error="handleIframeError"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
      ></iframe>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">🕸️</div>
      <h3 class="empty-title">暂无知识图谱</h3>
      <p class="empty-description">该课程还没有创建知识图谱，请联系老师</p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getCourseKnowledgeGraphList } from '@/api/graph';
import '@/student/styles/student-knowledge-graph.css';

// 定义 props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
});

// 路由
const router = useRouter();

// 响应式数据
const loading = ref(false);
const knowledgeGraphList = ref([]);
const currentKnowledgeGraph = ref(null);
const iframeKey = ref(0);

// 进入大纲页面
const goToOutline = () => {
  console.log('进入大纲页面');
  if (currentKnowledgeGraph.value) {
    // 使用路由跳转到大纲页面，传递知识图谱ID作为路径参数，课程ID作为查询参数
    router.push(`/outline/${currentKnowledgeGraph.value.id}?courseId=${props.courseId}`);
  } else {
    console.warn('没有可用的知识图谱');
  }
};

// 获取课程知识图谱列表
const loadKnowledgeGraphList = async () => {
  try {
    console.log(`正在获取课程${props.courseId}的知识图谱列表`);

    const response = await getCourseKnowledgeGraphList(props.courseId);
    console.log('获取知识图谱列表响应:', response);

    if (response && response.rows) {
      knowledgeGraphList.value = response.rows;
      console.log(`获取到${knowledgeGraphList.value.length}个知识图谱`);

      // 如果有知识图谱，选择第一个作为当前图谱
      if (knowledgeGraphList.value.length > 0) {
        currentKnowledgeGraph.value = knowledgeGraphList.value[0];
        console.log('当前知识图谱:', currentKnowledgeGraph.value);
      }
    } else {
      console.warn('知识图谱列表响应格式异常:', response);
      knowledgeGraphList.value = [];
    }
  } catch (error) {
    console.error('获取知识图谱列表失败:', error);
    knowledgeGraphList.value = [];
  }
};

// 获取图谱URL（学生端只读模式）
const getGraphUrl = () => {
  if (!currentKnowledgeGraph.value) {
    return '';
  }

  // 基于域名/IP判断是否为生产环境
  const hostname = window.location.hostname;
  const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '0.0.0.0';

  // 生产环境强制使用hash路由
  const baseUrl = isProduction ? '/#/graph' : '/graph';
  const params = `embedded=true&courseId=${props.courseId}&graphId=${currentKnowledgeGraph.value.id}&readonly=true&t=${Date.now()}`;

  return `${baseUrl}?${params}`;
};

// iframe加载完成回调
const onGraphIframeLoad = () => {
  console.log('知识图谱iframe加载完成');
};

// iframe错误处理
const handleIframeError = (error) => {
  console.error('知识图谱iframe加载失败:', error);
};

// 组件挂载时加载数据
onMounted(() => {
  if (props.courseId) {
    loading.value = true;
    loadKnowledgeGraphList().finally(() => {
      loading.value = false;
    });
  } else {
    console.warn('课程ID为空，无法加载知识图谱列表');
  }
});

// 暴露方法给父组件
defineExpose({
  loadKnowledgeGraphList
});
</script>

<style scoped>
.student-knowledge-graph {
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-title-area {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.graph-name {
  font-size: 1rem;
  color: #6b7280;
  background-color: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline {
  background-color: #ffffff;
  color: #374151;
  border-color: #d1d5db;
}

.btn-outline:hover:not(:disabled) {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.outline-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 400px;
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
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.graph-container {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  min-height: 500px;
}

.graph-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 400px;
  color: #6b7280;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.empty-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  text-align: center;
}
</style>




