import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import routes from './routes';
import { isAuthenticated, getCurrentUser } from '@/api/auth';

const router = createRouter({
  // 生产环境使用Hash路由，开发环境使用History路由
  history: process.env.NODE_ENV === 'production' ? createWebHashHistory() : createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 如果有锚点哈希，滚动到对应元素
    if (to.hash) {
      return new Promise((resolve) => {
        // 等待DOM渲染完成
        setTimeout(() => {
          const element = document.querySelector(to.hash);
          if (element) {
            const headerHeight = 80; // 导航栏高度
            const elementTop = element.offsetTop - headerHeight;
            resolve({
              top: Math.max(0, elementTop),
              behavior: 'smooth'
            });
          } else {
            resolve({ top: 0, behavior: 'smooth' });
          }
        }, 100);
      });
    }
    
    // 如果有保存的位置，使用它
    if (savedPosition) {
      return savedPosition;
    }

    // 同一路径内仅切换查询参数时，保留当前位置，别每点一下侧栏就弹回顶部
    if (to.path === from.path) {
      return false;
    }
    
    // 对于首页且没有锚点，滚动到顶部
    if (to.path === '/') {
      return { top: 0 };
    }
    
    // 其他情况滚动到顶部
    return { top: 0 };
  }
});

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - Hi Prof 智能教育平台` : 'Hi Prof 智能教育平台';

  // 检查是否需要登录权限
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const hideForAuth = to.matched.some(record => record.meta.hideForAuth);
  const isUserAuthenticated = isAuthenticated();

  // 如果页面需要登录但用户未登录，重定向到登录页
  if (requiresAuth && !isUserAuthenticated) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    });
    return;
  }

  // 如果用户已登录且当前页面应该对已登录用户隐藏（如登录页、注册页等），重定向到首页
  if (isUserAuthenticated && hideForAuth) {
    next({ path: '/' });
    return;
  }

  // 角色基础访问控制
  if (isUserAuthenticated && requiresAuth) {
    let currentUser = getCurrentUser();

    // 如果本地用户信息没有角色，尝试从服务器获取
    if (!currentUser?.role) {
      try {
        currentUser = await getCurrentUser(true); // 强制从服务器刷新
      } catch (error) {
        console.error('获取用户角色失败:', error);
        // 如果获取失败，重定向到登录页
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        });
        return;
      }
    }

    const userRole = currentUser?.role;
    console.log('当前用户角色:', userRole, '目标路由:', to.path);

    // 检查路由是否需要特定角色
    const requiredRole = to.matched.find(record => record.meta.role)?.meta.role;

    if (requiredRole && userRole !== requiredRole) {
      console.log('角色不匹配，需要角色:', requiredRole, '当前角色:', userRole);
      // 根据用户角色重定向到相应的主页
      const redirectPath = getDefaultPathForRole(userRole);

      // 避免无限重定向
      if (to.path !== redirectPath) {
        next({
          path: redirectPath,
          replace: true
        });
        return;
      }
    }
  }

  // 其他情况正常导航
  next();
});

// 根据用户角色获取默认路径
function getDefaultPathForRole(role) {
  switch (role) {
    case 'teacher':
      return '/teacher';
    case 'student':
      return '/student';
    default:
      return '/';
  }
}

export default router; 
