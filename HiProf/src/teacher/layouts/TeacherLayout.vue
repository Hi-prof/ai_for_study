<template>
  <div class="teacher-layout">
    <!-- 移动端遮罩 -->
    <div
      v-if="isMobile() && sidebarVisible"
      class="sidebar-overlay"
      @click="closeSidebar"
    ></div>

    <!-- 侧边栏 -->
    <aside
      class="sidebar"
      :class="{
        'sidebar-collapsed': sidebarCollapsed,
        'sidebar-mobile': isMobile(),
        'sidebar-visible': sidebarVisible
      }"
    >
      <div class="sidebar-header">
        <div class="logo">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          </svg>
          <span v-if="!sidebarCollapsed" class="logo-text">备课助手</span>
        </div>
        <button
          class="sidebar-toggle"
          @click="toggleSidebar"
          :title="isMobile() ? (sidebarVisible ? '关闭菜单' : '打开菜单') : (sidebarCollapsed ? '展开侧边栏' : '收起侧边栏')"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li class="nav-item">
            <router-link to="/teacher/my" class="nav-link" @click="handleNavClick">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
              </svg>
              <span v-if="!sidebarCollapsed || isMobile()" class="nav-text">个人中心</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info" v-if="!sidebarCollapsed">
          <div class="user-avatar">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <div class="user-details">
            <div class="user-name">{{ currentUser.name || currentUser.username || '教师' }}</div>
            <div class="user-role">{{ currentUser.subject || '教师' }}</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 顶部导航栏 -->
      <header class="top-header">
        <div class="header-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <button class="theme-toggle" @click="toggleTheme" :title="isDark ? '切换到浅色主题' : '切换到深色主题'">
            <svg v-if="isDark" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
              <path d="M12 1V3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M12 21V23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M4.22 4.22L5.64 5.64" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M18.36 18.36L19.78 19.78" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M1 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M21 12H23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M4.22 19.78L5.64 18.36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M18.36 5.64L19.78 4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12.79C20.8427 14.4922 20.2039 16.1144 19.1583 17.4668C18.1127 18.8192 16.7035 19.8458 15.0957 20.4265C13.4879 21.0073 11.7473 21.1181 10.0713 20.746C8.39524 20.3739 6.84947 19.5345 5.62596 18.3259C4.40245 17.1174 3.54475 15.5884 3.14823 13.9155C2.75171 12.2427 2.83421 10.4995 3.38681 8.88482C3.93941 7.27015 4.94043 5.84482 6.27133 4.78218C7.60223 3.71954 9.20819 3.05999 10.9 2.88C9.2019 4.91127 8.66697 7.51565 9.45273 9.91716C10.2385 12.3187 12.2498 14.2054 14.7304 14.8284C17.2109 15.4514 19.8335 14.7358 21.75 12.9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- 页面内容 -->
      <div class="page-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebarResponsive, useTheme } from '@/utils/responsive'
import { getCurrentUser } from '@/api/auth'

export default {
  name: 'TeacherLayout',
  setup() {
    const route = useRoute()
    const { sidebarCollapsed, sidebarVisible, toggleSidebar, closeSidebar, isMobile } = useSidebarResponsive()
    const { theme, toggleTheme, isDark } = useTheme()

    // 获取当前用户信息
    const currentUser = ref(getCurrentUser() || {})

    const pageTitle = computed(() => {
      const titles = {
        '/teacher/my': '教师个人中心'
      }
      return titles[route.path] || '教师个人中心'
    })

    const handleNavClick = () => {
      // 移动端点击导航后关闭侧边栏
      if (isMobile()) {
        closeSidebar()
      }
    }

    return {
      sidebarCollapsed,
      sidebarVisible,
      isDark,
      pageTitle,
      currentUser,
      toggleSidebar,
      toggleTheme,
      closeSidebar,
      isMobile,
      handleNavClick
    }
  }
}
</script>

<style scoped>
.teacher-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-secondary);
}

.sidebar {
  width: 280px;
  background-color: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  transition: width var(--transition-normal);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: var(--z-fixed);
}

.sidebar-collapsed {
  width: 80px;
}

.sidebar-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: var(--primary-color);
}

.logo-text {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.sidebar-toggle {
  background: none;
  border: none;
  padding: var(--spacing-xs);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.sidebar-toggle:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.sidebar-toggle svg {
  width: 20px;
  height: 20px;
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-md);
}

.nav-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all var(--transition-fast);
  font-weight: var(--font-medium);
}

.nav-link:hover {
  background-color: var(--primary-50);
  color: var(--primary-600);
}

.nav-link.router-link-active {
  background-color: var(--primary-100);
  color: var(--primary-700);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-text {
  font-size: var(--text-sm);
}

.sidebar-footer {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary-100);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-600);
}

.user-avatar svg {
  width: 20px;
  height: 20px;
}

.user-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.user-role {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.main-content {
  flex: 1;
  margin-left: 280px;
  transition: margin-left var(--transition-normal);
  display: flex;
  flex-direction: column;
}

.sidebar-collapsed + .main-content {
  margin-left: 80px;
}

.top-header {
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  padding: var(--spacing-md) var(--spacing-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.page-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.theme-toggle {
  background: none;
  border: none;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.theme-toggle:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.theme-toggle svg {
  width: 20px;
  height: 20px;
}

.page-content {
  flex: 1;
  padding: var(--spacing-xl);
  overflow-y: auto;
}

/* 移动端遮罩 */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: calc(var(--z-fixed) - 1);
  opacity: 0;
  animation: fadeIn var(--transition-normal) forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

/* 移动端侧边栏 */
.sidebar-mobile {
  transform: translateX(-100%);
  transition: transform var(--transition-normal);
  z-index: var(--z-modal);
}

.sidebar-mobile.sidebar-visible {
  transform: translateX(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }

  .page-content {
    padding: var(--spacing-md);
  }

  .top-header {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .page-title {
    font-size: var(--text-lg);
  }
}

@media (max-width: 480px) {
  .page-content {
    padding: var(--spacing-sm);
  }

  .top-header {
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .sidebar-header {
    padding: var(--spacing-md);
  }

  .sidebar-nav {
    padding: var(--spacing-sm);
  }

  .sidebar-footer {
    padding: var(--spacing-md);
  }
}
</style>
