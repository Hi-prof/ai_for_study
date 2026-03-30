import TeacherCoursePage from '@/teacher/course/TeacherCoursePage.vue';

export const teacherRoutes = [
  {
    path: '/teacher',
    name: 'teacher',
    component: () => import('@/teacher/layouts/TeacherLayout.vue'),
    meta: { title: '教师教学助手', requiresAuth: true, role: 'teacher' },
    children: [{ path: '', redirect: '/teacher/my' }]
  },
  {
    path: '/teacher/my',
    name: 'teacher-my',
    component: () => import('@/teacher/home/TeacherHomePage.vue'),
    meta: { title: '教师个人中心', requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/my-lessons',
    name: 'teacher-my-lessons',
    component: () => import('@/teacher/components/modules/TeacherMyLessons.vue'),
    meta: { title: '我的教案', requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/class/:id',
    name: 'teacher-class-detail',
    component: () => import('@/teacher/home/TeacherHomePage.vue'),
    meta: { title: '班级详情', requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/course/:courseId',
    name: 'teacher-course-detail',
    component: TeacherCoursePage,
    meta: { title: '课程详情', requiresAuth: true, role: 'teacher' },
    props: true
  },
  {
    path: '/teacher/course/:courseId/ai-chapter-generator',
    name: 'ai-chapter-generator',
    component: () => import('@/teacher/components/modules/TeacherCourseDetail/chapter/AiChapterGenerator.vue'),
    meta: { title: 'AI智能生成章节', requiresAuth: true, role: 'teacher' },
    props: true
  },
  {
    path: '/teacher/course/:courseId/chapter-learning/:chapterId?',
    name: 'teacher-chapter-learning',
    component: () => import('@/teacher/components/modules/TeacherCourseDetail/chapter/chapter-learning/ChapterLearningPage.vue'),
    meta: { title: '章节学习', requiresAuth: true, role: 'teacher' },
    props: true
  },
  {
    path: '/teacher/course/:courseId/ai-knowledge-graph',
    name: 'ai-knowledge-graph-generator',
    component: () => import('@/teacher/components/modules/TeacherCourseDetail/knowledgegraph/refactored/AiKnowledgeGraphGenerator.vue'),
    meta: { title: 'AI生成知识图谱', requiresAuth: true, role: 'teacher' },
    props: true
  },
  {
    path: '/teacher/course/:courseId/ai-lesson-plan-generator',
    name: 'ai-lesson-plan-generator',
    component: () => import('@/teacher/components/modules/TeacherCourseDetail/lessonplan/AiLessonPlanGenerator.vue'),
    meta: { title: 'AI智能生成教案', requiresAuth: true, role: 'teacher' },
    props: true
  },
  {
    path: '/teacher/course/:courseId/homework-grading',
    name: 'homework-grading',
    component: () => import('@/teacher/pages/HomeworkGradingPage.vue'),
    meta: { title: '作业批改', requiresAuth: true, role: 'teacher' },
    props: true
  },
  {
    path: '/teacher/course/:courseId/homework/:homeworkId/submissions',
    name: 'HomeworkSubmissions',
    component: () => import('@/teacher/components/modules/TeacherCourseDetail/homework/HomeworkSubmissions.vue'),
    meta: { title: '作业提交记录', requiresAuth: true, role: 'teacher' },
    props: true
  },
  {
    path: '/teacher/course/:courseId/discussion/:sessionId',
    name: 'discussion-detail',
    component: () => import('@/teacher/components/modules/TeacherCourseDetail/discussion/DiscussionDetail.vue'),
    meta: { title: '讨论详情', requiresAuth: true, role: 'teacher' },
    props: true
  },
  {
    path: '/teacher/text-node-parser-test',
    name: 'text-node-parser-test',
    component: () => import('@/teacher/components/modules/TeacherCourseDetail/textparser/TextNodeParserTest.vue'),
    meta: { title: '文本节点解析器测试', requiresAuth: false }
  }
];
