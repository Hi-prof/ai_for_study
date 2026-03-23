import { getCurrentUser } from '@/api/auth';

export const sharedRoutes = [
  { path: '/', name: 'home', component: () => import('@/pages/MainHomePage.vue'), meta: { title: 'Hi Prof 智能教育平台' } },
  { path: '/ai-assistant', name: 'ai-assistant', component: () => import('@/pages/AIAssistantPage.vue'), meta: { title: 'AI智能助手' } },
  { path: '/outline/:graphId', name: 'outline', component: () => import('@/pages/GraphPage/OutlinePage.vue'), meta: { title: '知识图谱大纲', requiresAuth: true } },
  { path: '/outline-edit/:id', name: 'outline-edit', component: () => import('@/pages/GraphPage/OutlinePage.vue'), meta: { title: '编辑知识图谱大纲', requiresAuth: true, isEditMode: true } },
  { path: '/graph', name: 'graph', component: () => import('@/pages/GraphPage/index.vue'), meta: { title: '知识图谱' } },
  { path: '/graph/:id', name: 'course-graph', component: () => import('@/pages/GraphPage/index.vue'), meta: { title: '课程知识图谱' } },
  {
    path: '/my',
    name: 'my',
    redirect: () => {
      try {
        const user = getCurrentUser();
        if (user?.role === 'teacher') return '/teacher/my';
        if (user?.role === 'student') return '/student/my';
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
      return '/login';
    },
    meta: { title: '个人中心', requiresAuth: true }
  },
  { path: '/test/session-api', name: 'session-api-test', component: () => import('@/pages/ComingSoonPage.vue'), meta: { title: '会话API测试' } },
  { path: '/login', name: 'login', component: () => import('@/pages/LoginPage.vue'), meta: { title: '登录', hideForAuth: true } },
  { path: '/register', name: 'register', component: () => import('@/pages/RegisterPage.vue'), meta: { title: '注册', hideForAuth: true } },
  { path: '/forgot-password', name: 'forgot-password', component: () => import('@/pages/ForgotPasswordPage.vue'), meta: { title: '找回密码', hideForAuth: true } },
  { path: '/reset-password', name: 'reset-password', component: () => import('@/pages/ResetPasswordPage.vue'), meta: { title: '重置密码', hideForAuth: true } },
  { path: '/dev-tools', name: 'dev-tools', component: () => import('@/views/dev/DevTools.vue'), meta: { title: '开发工具' } }
];

export const fallbackRoutes = [
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/MainHomePage.vue'), meta: { title: '页面未找到' } }
];
