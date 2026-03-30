import { getCurrentUser } from '@/api/auth';

export const sharedRoutes = [
  { path: '/', name: 'home', component: () => import('@/shared/pages/MainHomePage.vue'), meta: { title: 'Hi Prof 智能教育平台' } },
  { path: '/ai-assistant', name: 'ai-assistant', component: () => import('@/shared/pages/AIAssistantPage.vue'), meta: { title: 'AI智能助手' } },
  { path: '/outline/:graphId', name: 'outline', component: () => import('@/shared/features/graph/pages/OutlinePage.vue'), meta: { title: '知识图谱大纲', requiresAuth: true } },
  { path: '/outline-edit/:id', name: 'outline-edit', component: () => import('@/shared/features/graph/pages/OutlinePage.vue'), meta: { title: '编辑知识图谱大纲', requiresAuth: true, isEditMode: true } },
  { path: '/graph', name: 'graph', component: () => import('@/shared/features/graph/pages/index.vue'), meta: { title: '知识图谱' } },
  { path: '/graph/:id', name: 'course-graph', component: () => import('@/shared/features/graph/pages/index.vue'), meta: { title: '课程知识图谱' } },
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
  { path: '/test/session-api', name: 'session-api-test', component: () => import('@/shared/pages/ComingSoonPage.vue'), meta: { title: '会话API测试' } },
  { path: '/login', name: 'login', component: () => import('@/shared/pages/LoginPage.vue'), meta: { title: '登录', hideForAuth: true } },
  { path: '/register', name: 'register', component: () => import('@/shared/pages/RegisterPage.vue'), meta: { title: '注册', hideForAuth: true } },
  { path: '/forgot-password', name: 'forgot-password', component: () => import('@/shared/pages/ForgotPasswordPage.vue'), meta: { title: '找回密码', hideForAuth: true } },
  { path: '/reset-password', name: 'reset-password', component: () => import('@/shared/pages/ResetPasswordPage.vue'), meta: { title: '重置密码', hideForAuth: true } },
  { path: '/dev-tools', name: 'dev-tools', component: () => import('@/shared/pages/DevTools.vue'), meta: { title: '开发工具' } }
];

export const fallbackRoutes = [
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/shared/pages/MainHomePage.vue'), meta: { title: '页面未找到' } }
];
