<template>
  <header class="app-header">
    <div class="container">
      <div class="header-content flex justify-between align-center">
        <div class="logo-container flex align-center">
          <router-link to="/" class="logo-link">
            <span class="logo-text">Hi Prof</span>
          </router-link>
        </div>
        
        <nav class="main-nav">
          <ul class="nav-list flex">
            <!-- 通用导航 -->
            <li class="nav-item">
              <router-link to="/ai-assistant" class="nav-link">
                <span>AI助手</span>
              </router-link>
            </li>

            <!-- 基于角色的导航 -->
            <li class="nav-item" v-if="userRole === 'student'">
              <router-link to="/student" class="nav-link">
                <span>学习中心</span>
              </router-link>
            </li>

            <!-- 知识图谱页面的特殊导航 -->
            <li class="nav-item dropdown-nav" v-if="$route.path === '/knowledge-graph'">
              <div class="nav-group">
                <a href="javascript:void(0)" class="nav-link" @click="scrollToSection('announcement')">
                  <span>公告</span>
                </a>
                <a href="javascript:void(0)" class="nav-link" @click="scrollToSection('system-overview')">
                  <span>系统概览</span>
                </a>
                <a href="javascript:void(0)" class="nav-link" @click="scrollToSection('popular-graphs')">
                  <span>热门知识图谱</span>
                </a>
                <a href="javascript:void(0)" class="nav-link" @click="scrollToSection('interactive-demo')">
                  <span>知识图谱体验</span>
                </a>
              </div>
            </li>
          </ul>
        </nav>
        
        <div class="right-section flex align-center">
          <!-- 未登录状态 -->
          <div v-if="!isLoggedIn" class="auth-buttons flex align-center">
            <router-link to="/login" class="btn btn-outline mr-2">登录</router-link>
            <router-link to="/register" class="btn btn-outline mr-2">注册</router-link>
          </div>
          
          <!-- 已登录状态 -->
          <div v-else class="user-menu flex align-center">
            <div class="user-dropdown" ref="dropdown">
              <button class="user-button" @click="toggleDropdown">
                <span v-if="currentUser.avatar" class="user-avatar">
                  <img :src="currentUser.avatar" :alt="currentUser.username" />
                </span>
                <span v-else class="user-avatar-placeholder">
                  {{ getInitials(currentUser.username) }}
                </span>
              </button>
            </div>
            
            <!-- 课程中心按钮 - 根据角色跳转 -->
            <router-link :to="getPersonalCenterPath()" class="btn btn-outline mr-2">课程中心</router-link>
            
            <!-- 退出登录按钮 -->
            <button @click="handleLogout" class="btn btn-outline btn-logout">
              <span v-if="isLoggingOut">退出中...</span>
              <span v-else>退出登录</span>
            </button>
          </div>
          
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { isAuthenticated, getCurrentUser, logout } from '@/api/auth';

const router = useRouter();
const route = useRoute();
const isDropdownOpen = ref(false);
const dropdown = ref(null);
const isLoggingOut = ref(false);

// 响应式的用户信息
const currentUserData = ref(getCurrentUser());
const userRoleData = ref(null);

// 更新用户信息的函数
const updateUserInfo = () => {
  const user = getCurrentUser();
  currentUserData.value = user || { username: '用户' };
  userRoleData.value = user?.role || null;
  console.log('AppHeader - 更新用户信息:', {
    user: user,
    role: user?.role,
    userRoleData: userRoleData.value
  });
};

// 计算属性：是否已登录
const isLoggedIn = computed(() => {
  return isAuthenticated();
});

// 计算属性：当前用户信息
const currentUser = computed(() => {
  return currentUserData.value;
});

// 计算属性：用户角色
const userRole = computed(() => {
  return userRoleData.value;
});

// 获取用户名首字母作为头像
const getInitials = (name) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

// 根据用户角色获取个人中心路径
const getPersonalCenterPath = () => {
  const role = userRole.value;
  switch (role) {
    case 'teacher':
      return '/my'; // 教师个人中心，通过智能重定向到 /teacher/my
    case 'student':
      return '/my'; // 学生个人中心，通过智能重定向到 /student/my
    default:
      return '/my';
  }
};

// 切换下拉菜单
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

// 点击外部关闭下拉菜单
const handleOutsideClick = (event) => {
  if (dropdown.value && !dropdown.value.contains(event.target)) {
    isDropdownOpen.value = false;
  }
};

// 处理退出登录
const handleLogout = async () => {
  try {
    isLoggingOut.value = true;
    
    // 添加超时保护
    const logoutPromise = logout();
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, timedOut: true });
      }, 3000); // 3秒超时
    });
    
    // 使用Promise.race确保不会永久卡住
    const result = await Promise.race([logoutPromise, timeoutPromise]);
    
    // 如果是超时结果，记录日志
    if (result && result.timedOut) {
      console.warn('退出登录操作超时，已强制完成');
    }
    
    isDropdownOpen.value = false;
    
    // 重定向到首页
    router.push('/').then(() => {
      // 重定向完成后刷新页面
      window.location.reload();
    });
  } catch (error) {
    console.error('退出登录失败:', error);
    // 即使出错也刷新页面
    window.location.reload();
  } finally {
    isLoggingOut.value = false;
  }
};

// 滚动到页面指定区域
const scrollToSection = (sectionId) => {
  // 如果当前不在首页，先导航到首页，然后滚动
  if (router.currentRoute.value.path !== '/') {
    router.push('/').then(() => {
      // 导航完成后再滚动
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const headerHeight = 80; // 导航栏高度
          const elementTop = element.offsetTop - headerHeight;
          window.scrollTo({
            top: Math.max(0, elementTop),
            behavior: 'smooth'
          });
        }
      }, 300);
    });
  } else {
    // 如果已经在首页，直接滚动
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        const headerHeight = 80; // 导航栏高度
        const elementTop = element.offsetTop - headerHeight;
        window.scrollTo({
          top: Math.max(0, elementTop),
          behavior: 'smooth'
        });
      }
    }, 100);
  }
};

// 监听路由变化，更新用户信息
watch(() => route.path, () => {
  updateUserInfo();
}, { immediate: true });

// 监听登录状态变化
watch(() => isAuthenticated(), (newVal) => {
  if (newVal) {
    updateUserInfo();
  } else {
    currentUserData.value = { username: '用户' };
    userRoleData.value = null;
  }
});

// 组件挂载时添加点击事件监听
onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
  // 初始化用户信息
  updateUserInfo();
});

// 组件卸载时移除点击事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
});
</script>

<style scoped>
.app-header {
  background: #7D1006;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--header-height);
  display: flex;
  align-items: center;
  transition: var(--glass-transition, all 0.3s cubic-bezier(0.4, 0, 0.2, 1));
}

.header-content {
  height: 100%;
}

.logo-container {
  height: 100%;
}

.logo-link {
  display: flex;
  align-items: center;
  height: 100%;
  text-decoration: none;
}

.logo-image {
  height: 28px;
  margin-right: 0.5rem;
  padding: 5px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(31, 38, 135, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.logo-image:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(31, 38, 135, 0.2);
}

.logo-text {
  font-family: var(--font-family-heading);
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  font-weight: 600;
  color: white;
  letter-spacing: -0.01em;
  padding: 0.25rem 0.625rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(0.3125rem);
  -webkit-backdrop-filter: blur(0.3125rem);
  border-radius: var(--border-radius-sm);
  box-shadow: 0 0.25rem 0.9375rem rgba(31, 38, 135, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all var(--transition-normal) ease;
}

.logo-text:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.nav-list {
  gap: var(--spacing-md);
}

.nav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  padding: 0.75rem 1.25rem;
  border-radius: 1.5rem;
  position: relative;
  text-decoration: none;
  font-size: clamp(0.75rem, 1.8vw, 0.875rem);
  letter-spacing: 0.01875rem;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(0.75rem);
  -webkit-backdrop-filter: blur(0.75rem);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 0.25rem 0.9375rem rgba(0, 0, 0, 0.08),
    0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.1),
    inset 0 0.0625rem 0 rgba(255, 255, 255, 0.2);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  overflow: hidden;
  white-space: nowrap;
  transform: translateZ(0);
  will-change: transform, box-shadow, background;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
  transition: left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 1;
}

.nav-link::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
  transform: translate(-50%, -50%);
  z-index: 0;
  pointer-events: none;
}

.nav-link span {
  position: relative;
  z-index: 2;
  transition: transform 0.3s ease;
}

.nav-link:hover {
  color: white;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-color: rgba(255, 255, 255, 0.35);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 4px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 0 0 1px rgba(59, 130, 246, 0.1);
  transform: translateY(-3px) scale(1.02);
}

.nav-link:hover::before {
  left: 100%;
}

.nav-link:hover::after {
  width: 120px;
  height: 120px;
  opacity: 1;
}

.nav-link:hover span {
  transform: translateY(-1px);
}

.nav-link:active {
  transform: translateY(-1px) scale(1.01);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  transition: all 0.2s ease;
}

.nav-link:focus {
  outline: none;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 4px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 0 0 3px rgba(59, 130, 246, 0.3);
}

.nav-link.router-link-active {
  color: rgba(59, 130, 246, 0.9);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 197, 253, 0.15) 100%);
  border-color: rgba(59, 130, 246, 0.25);
  box-shadow: 
    0 6px 24px rgba(59, 130, 246, 0.15),
    0 2px 6px rgba(59, 130, 246, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.nav-link.router-link-active::after {
  width: 80px;
  height: 80px;
  opacity: 0.7;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .nav-link {
    padding: 10px 16px;
    font-size: 13px;
    border-radius: 20px;
    letter-spacing: 0.2px;
  }
  
  .nav-link:hover {
    transform: translateY(-2px) scale(1.01);
  }
  
  .nav-link:active {
    transform: translateY(-1px) scale(1.005);
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: more) {
  .nav-link {
    border-width: 2px;
    border-color: rgba(0, 0, 0, 0.3);
    background: rgba(255, 255, 255, 0.2);
  }
  
  .nav-link:hover {
    border-color: rgba(0, 0, 0, 0.5);
    background: rgba(255, 255, 255, 0.35);
  }
}

/* 减少动效模式支持 */
@media (prefers-reduced-motion: reduce) {
  .nav-link {
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }
  
  .nav-link::before,
  .nav-link::after {
    display: none;
  }
  
  .nav-link:hover {
    transform: none;
  }
}

.dropdown-nav {
  position: relative;
}

.nav-group {
  display: flex;
  gap: var(--spacing-md);
}

@media (max-width: 768px) {
  .nav-group {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
}

.right-section {
  display: flex;
  align-items: center;
}

.auth-buttons, .user-menu {
  gap: var(--spacing-sm);
}

.theme-toggle-wrapper {
  display: flex;
  align-items: center;
}

.mr-3 {
  margin-right: 0.75rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

/* 用户下拉菜单样式 */
.user-dropdown {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-normal);
}

.user-button:hover {
  background-color: var(--hover-color);
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: var(--spacing-xs);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 28px;
  height: 28px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  margin-right: var(--spacing-xs);
  opacity: 0; /* 隐藏占位符但保持其功能 */
}

.user-name {
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-medium);
  margin-right: var(--spacing-xs);
}

.dropdown-icon {
  width: 10px;
  height: 10px;
  border-left: 2px solid var(--text-lighter);
  border-bottom: 2px solid var(--text-lighter);
  transform: rotate(-45deg);
  transition: transform var(--transition-normal);
}

.dropdown-icon.open {
  transform: rotate(135deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: var(--glass-bg-primary, rgba(255, 255, 255, 0.15));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 12px;
  box-shadow: var(--glass-shadow, 0 8px 32px rgba(31, 38, 135, 0.15));
  overflow: hidden;
  z-index: 200;
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.2));
}

.dropdown-item {
  display: block;
  padding: var(--spacing-sm) var(--spacing-md);
  color: rgba(0, 0, 0, 0.8);
  text-decoration: none;
  transition: var(--glass-transition, all 0.3s cubic-bezier(0.4, 0, 0.2, 1));
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-size: var(--font-size-small);
  font-weight: 500;
  border: none;
  background: transparent;
}

.dropdown-item:hover {
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.1));
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border-color);
  margin: var(--spacing-xxs) 0;
}

.logout-button {
  color: var(--error-color, #dc2626);
}

@media (max-width: 768px) {
  .main-nav {
    display: none;
  }
  
  .logo-text {
    display: none;
  }
  
  .user-name {
    display: none;
  }
  
  .btn {
    padding: 10px 20px;
    font-size: 12px;
    min-width: 80px;
  }
  
  .auth-buttons .btn {
    height: 38px;
  }
  
  .btn:hover {
    transform: translateY(-2px) scale(1.01);
  }
  
  .btn:active {
    transform: translateY(-1px) scale(1.005);
  }
  
  .auth-buttons {
    gap: 8px;
  }
}

.btn {
  padding: 0.75rem 1.5rem;
  font-size: clamp(0.75rem, 1.6vw, 0.875rem);
  border-radius: 3.125rem;
  font-weight: 600;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  border: none;
  backdrop-filter: blur(1rem);
  -webkit-backdrop-filter: blur(1rem);
  cursor: pointer;
  letter-spacing: 0.03125rem;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s;
  z-index: 1;
}

.btn:hover::before {
  left: 100%;
}

.btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  transition: all 0.4s ease;
  transform: translate(-50%, -50%);
  z-index: 0;
}

.btn:active::after {
  width: 120px;
  height: 120px;
}

.btn-outline {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  color: white;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.btn-outline:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  transform: translateY(-3px) scale(1.02);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.btn-outline:active {
  transform: translateY(-1px) scale(1.01);
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  color: white;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 4px 15px rgba(102, 126, 234, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 50%, #f093fb 100%);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 
    0 8px 25px rgba(102, 126, 234, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.2);
}

.btn-primary:active {
  transform: translateY(-1px) scale(1.01);
  box-shadow: 
    0 4px 15px rgba(102, 126, 234, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.auth-buttons .btn {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  min-width: 90px;
}

/* 聚焦状态 */
.btn:focus {
  outline: none;
  box-shadow: 
    0 0 0 3px rgba(102, 126, 234, 0.3),
    0 4px 15px rgba(0, 0, 0, 0.1);
}

.btn-primary:focus {
  box-shadow: 
    0 0 0 3px rgba(102, 126, 234, 0.4),
    0 8px 25px rgba(102, 126, 234, 0.3);
}

/* 添加退出登录按钮样式 */
.btn-logout {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-color: rgba(255, 255, 255, 0.4);
}
</style> 