<template>
  <div class="student-course-detail-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <button
        class="back-to-courses-btn"
        @click="handleBackToCourses"
        type="button"
      >
        <i class="back-icon"></i>
        <span>返回课程列表</span>
      </button>
      <div class="header-content">
        <h1 class="page-title">{{ courseInfo.title || '课程详情' }}</h1>
        <div class="course-meta">
          <span class="course-teacher">授课教师：{{ courseInfo.teacher || '未知' }}</span>
          <span class="course-progress">学习进度：{{ courseInfo.progress || 0 }}%</span>
        </div>
      </div>
    </div>

    <!-- 主要内容布局 -->
    <div class="content-layout">
      <!-- 左侧导航菜单 -->
      <div class="sidebar">
        <div class="sidebar-menu">
          <div
            v-for="tab in menuTabs"
            :key="tab.key"
            class="menu-item"
            :class="{ active: activeTab === tab.key }"
            @click="switchTab(tab.key)"
          >
            <i class="menu-icon" :class="tab.icon"></i>
            <span class="menu-text">{{ tab.label }}</span>
          </div>
        </div>
      </div>

      <!-- 主内容区域 -->
      <div class="main-content">
        <!-- 内容区域 -->
        <div class="tab-content">
          <StudentChapters v-if="activeTab === 'chapters'" :course-id="courseId" />
          <StudentHomework v-else-if="activeTab === 'homework'" :course-id="courseId" />
          <StudentKnowledgeGraph v-else-if="activeTab === 'knowledge-graph'" :course-id="courseId" />
          <StudentMaterials v-else-if="activeTab === 'materials'" :course-id="courseId" />
          <StudentDiscussions v-else-if="activeTab === 'discussions'" :course-id="courseId" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCourseById } from '@/api/courses';

// 导入子组件
import StudentChapters from './chapters/StudentChapters.vue';
import StudentKnowledgeGraph from './knowledgegraph/StudentKnowledgeGraph.vue';
import StudentMaterials from './materials/StudentMaterials.vue';
import StudentDiscussions from './discussions/StudentDiscussions.vue';
import StudentHomework from './homework/StudentHomework.vue';
import '@/student/styles/student-course-detail.css';
import '@/student/styles/student-discussions.css';

const route = useRoute();
const router = useRouter();

// 当前激活的标签页
const activeTab = ref('chapters');

// 课程ID（从路由参数获取）
const courseId = computed(() => route.params.courseId);

// 课程信息
const courseInfo = ref({
  title: '',
  teacher: '',
  progress: 0,
  totalHours: 0,
  description: ''
});

// 菜单标签页配置（学生端简化版）
const menuTabs = [
  {
    key: 'chapters',
    label: '课程章节',
    icon: 'chapters-icon'
  },
  {
    key: 'homework',
    label: '课程作业',
    icon: 'homework-icon'
  },
  {
    key: 'knowledge-graph',
    label: '知识图谱',
    icon: 'knowledge-graph-icon'
  },
  {
    key: 'materials',
    label: '课程资料',
    icon: 'materials-icon'
  },
  {
    key: 'discussions',
    label: '课程讨论',
    icon: 'discussions-icon'
  }
];

// 切换标签页
const switchTab = (tabKey) => {
  activeTab.value = tabKey;
  // 保存当前标签页到本地存储
  localStorage.setItem(`student-course-detail-active-tab-${courseId.value}`, tabKey);
  console.log('切换到标签页:', tabKey);
};

// 返回课程列表
const handleBackToCourses = () => {
  router.push('/student/my');
  console.log('返回学生课程列表');
};

// 加载课程信息
const loadCourseInfo = async () => {
  try {
    console.log('正在加载课程信息，课程ID:', courseId.value);

    if (courseId.value) {
      const response = await getCourseById(courseId.value);
      console.log('获取课程信息响应:', response);

      // 处理API响应
      if (response && response.code === 200 && response.data) {
        courseInfo.value = {
          title: response.data.name || '未命名课程',
          teacher: response.data.teacherName || '未知教师',
          description: response.data.description || '',
          progress: 0, // 学生端需要从其他API获取学习进度
          totalHours: response.data.totalHours || 0
        };
        console.log('课程信息加载成功:', courseInfo.value);
      } else {
        console.warn('课程信息响应格式异常，使用默认值');
        courseInfo.value = {
          title: '未知课程',
          teacher: '未知教师',
          progress: 0,
          totalHours: 0,
          description: ''
        };
      }
    } else {
      console.warn('课程ID为空，无法加载课程信息');
    }
  } catch (error) {
    console.error('加载课程信息失败:', error);
    courseInfo.value = {
      title: '加载失败',
      teacher: '未知教师',
      progress: 0,
      totalHours: 0,
      description: ''
    };
  }
};

// 组件挂载时的初始化
onMounted(() => {
  // 检查URL查询参数中是否指定了标签页
  const queryTab = route.query.tab;
  if (queryTab && menuTabs.some(tab => tab.key === queryTab)) {
    activeTab.value = queryTab;
  } else {
    // 从本地存储恢复上次的标签页
    const savedTab = localStorage.getItem(`student-course-detail-active-tab-${courseId.value}`);
    if (savedTab && menuTabs.some(tab => tab.key === savedTab)) {
      activeTab.value = savedTab;
    }
  }

  // 加载课程信息
  loadCourseInfo();

  console.log('学生课程详情页面已加载，课程ID:', courseId.value, '当前标签页:', activeTab.value);
});
</script>


