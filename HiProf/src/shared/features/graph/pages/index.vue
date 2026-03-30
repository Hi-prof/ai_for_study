<template>
  <div :class="['graph-page', { embedded: isEmbedded }]">
    <div v-if="!isEmbedded" class="graph-header">
      <!-- 课程选择器 -->
      <CourseList 
        v-if="!courseId"
        :initialCourses="courses"
        @course-select="handleCourseSelect"
        @courses-loaded="handleCoursesLoaded"
      />
      
      <!-- 课程图谱头部 -->
      <div class="course-graph-header" v-else>
        <button class="nav-btn my-btn" @click="goToMyPage">返回图谱列表</button>
        <h1>{{ getDisplayTitle() }}</h1>
        <button
          v-if="!currentCourse?.hasError"
          class="nav-btn outline-btn"
          @click="goToOutline"
        >
          进入大纲编辑
        </button>
        <!-- 错误状态下显示重试按钮 -->
        <button
          v-if="currentCourse?.hasError"
          class="nav-btn retry-btn"
          @click="loadCourseInfo"
        >
          重新加载
        </button>
      </div>
    </div>
    
    <!-- 图谱视图 -->
    <GraphView
      v-if="courseId"
      :courseId="courseId"
      :graphId="graphId"
      :currentCourse="currentCourse"
      @node-select="handleNodeSelect"
      @node-hover="handleNodeHover"
      @node-save="handleNodeSave"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCourseById } from '@/api/courses.js';
import CourseList from '@/shared/features/graph/components/graph/CourseList.vue';
import GraphView from '@/shared/features/graph/components/graph/GraphView.vue';
// 引入样式文件
import '@/styles/pages/GraphPage.css';

// 定义类型接口
interface Course {
  id: string | number;
  name: string;
  content?: string;
  nodeCount?: number;
}

interface Node {
  id: string | number;
  text?: string;
  name?: string;
  content?: string;
  category?: string;
  data?: any;
}

// 路由相关
const route = useRoute();
const router = useRouter();

// 支持通过路径参数或查询参数获取课程 ID
const courseId = computed(() => route.params.id || route.query.courseId);

// 获取知识图谱 ID（从查询参数）
const graphId = computed(() => route.query.graphId);

// 判断是否作为嵌入视图（iframe）加载
const isEmbedded = computed(() => 'embedded' in route.query);

// 课程列表相关
const courses = ref<Course[]>([]);
const currentCourse = ref<Course | null>(null);

// 处理课程选择
const handleCourseSelect = (selectedCourseId: string | number) => {
  router.push(`/graph/${selectedCourseId}`);
};

// 处理课程列表加载完成
const handleCoursesLoaded = (loadedCourses: Course[]) => {
  courses.value = loadedCourses;
  
  // 如果有课程ID，查找当前课程信息
  if (courseId.value && loadedCourses.length > 0) {
    const course = loadedCourses.find(c => c.id.toString() === courseId.value.toString());
    if (course) {
      currentCourse.value = course;
    }
  }
};

// 处理节点选择
const handleNodeSelect = (node: Node) => {
  // 这里可以添加额外的节点选择处理逻辑
};

// 处理节点悬停
const handleNodeHover = (node: Node | null) => {
  // 这里可以添加节点悬停处理逻辑
};

// 处理节点保存
const handleNodeSave = (nodeData: any) => {
  // 这里可以添加额外的节点保存处理逻辑
};

// 导航到知识大纲
const goToOutline = () => {
  if (courseId.value) {
    // 传递图谱ID作为路径参数，课程ID作为查询参数
    router.push(`/outline/${courseId.value}?courseId=${courseId.value}`);
  } else {
    router.push('/outline');
  }
};

// 导航到首页
const goToHome = () => {
  router.push('/');
};

// 导航到个人中心
const goToMyPage = () => {
  router.push('/teacher/my');
};

// 获取显示标题
const getDisplayTitle = () => {
  if (!currentCourse.value) {
    return '知识图谱';
  }

  if (currentCourse.value.hasError) {
    return currentCourse.value.name;
  }

  const name = currentCourse.value.name;
  if (name && !name.startsWith('课程 #')) {
    return `${name}知识图谱`;
  }

  return '知识图谱';
};

// 主动获取课程信息
const loadCourseInfo = async () => {
  if (!courseId.value) return;

  try {
    // 使用课程API获取课程信息
    const response = await getCourseById(courseId.value);

    // 处理权限错误
    if (response && response.code === 403) {
      currentCourse.value = {
        id: courseId.value,
        name: '权限不足',
        content: response.message || '没有权限访问该课程，请联系管理员授权',
        nodeCount: 0,
        hasError: true,
        errorType: 'permission'
      };
      document.title = '权限不足 - Hi Prof 智能教育平台';
      return;
    }

    // 处理其他错误状态
    if (response && response.code !== 200) {
      currentCourse.value = {
        id: courseId.value,
        name: '加载失败',
        content: response.message || '课程信息加载失败，请稍后重试',
        nodeCount: 0,
        hasError: true,
        errorType: 'api_error'
      };
      document.title = '加载失败 - Hi Prof 智能教育平台';
      return;
    }

    // 处理成功响应
    let courseData = null;
    if (response && response.code === 200 && response.data) {
      courseData = response.data;
    } else if (response && response.courseData) {
      courseData = response.courseData;
    } else if (response && response.id) {
      courseData = response;
    }

    if (courseData && courseData.id) {
      // 处理课程名称，确保不会出现undefined
      const courseName = courseData.name || courseData.title || courseData.courseName || `课程 ${courseData.id}`;

      currentCourse.value = {
        id: courseData.id,
        name: courseName,
        content: courseData.content || courseData.description,
        nodeCount: courseData.nodeCount || 0,
        hasError: false
      };

      // 动态更新页面标题
      document.title = `${courseName}知识图谱 - Hi Prof 智能教育平台`;
    } else {
      currentCourse.value = {
        id: courseId.value,
        name: '课程不存在',
        content: '未找到对应的课程信息，请检查课程ID是否正确',
        nodeCount: 0,
        hasError: true,
        errorType: 'not_found'
      };
      document.title = '课程不存在 - Hi Prof 智能教育平台';
    }
  } catch (error) {
    console.error('GraphPage: 获取课程信息失败:', error);
    currentCourse.value = {
      id: courseId.value,
      name: '网络错误',
      content: '网络连接失败，请检查网络连接后重试',
      nodeCount: 0,
      hasError: true,
      errorType: 'network_error'
    };
    document.title = '网络错误 - Hi Prof 智能教育平台';
  }
};

// 监听路由变化
watch(courseId, async (newId) => {
  if (newId) {
    // 首先尝试从已有的courses列表中查找
    if (courses.value.length > 0) {
      const course = courses.value.find(c => c.id.toString() === newId.toString());
      if (course) {
        currentCourse.value = course;
        return;
      }
    }

    // 如果courses列表中没有，主动获取课程信息
    await loadCourseInfo();
  } else {
    currentCourse.value = null;
  }
}, { immediate: true });

// 生命周期钩子
onMounted(async () => {
  // 如果有courseId但没有currentCourse，主动获取课程信息
  if (courseId.value && !currentCourse.value) {
    await loadCourseInfo();
  }
});
</script>

<style scoped>
.graph-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.graph-page.embedded {
  background: #f8f9fa;
  min-height: auto;
}

.graph-header {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
}

.course-graph-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 40px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.course-graph-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
  flex: 1;
  text-align: center;
}

.nav-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  border: none;
  outline: none;
}

.my-btn {
  background: #4299e1;
  color: white;
}

.my-btn:hover {
  background: #3182ce;
  transform: translateY(-1px);
}

.outline-btn {
  background: transparent;
  color: #4299e1;
  border: 1px solid #4299e1;
}

.outline-btn:hover {
  background: #4299e1;
  color: white;
  transform: translateY(-1px);
}

.retry-btn {
  background: #f56565;
  color: white;
}

.retry-btn:hover {
  background: #e53e3e;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .course-graph-header {
    flex-direction: column;
    gap: 15px;
    padding: 15px 20px;
  }
  
  .course-graph-header h1 {
    font-size: 20px;
    text-align: center;
  }
  
  .nav-btn {
    width: 100%;
    text-align: center;
  }
}
</style>
