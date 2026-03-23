<template>
  <div class="student-layout">
    <!-- 主内容区域 -->
    <main class="main-content">
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
  name: 'StudentLayout',
  setup() {
    const route = useRoute()
    const { sidebarCollapsed, sidebarVisible, toggleSidebar, closeSidebar, isMobile } = useSidebarResponsive()
    const { theme, toggleTheme, isDark } = useTheme()
    
    // 获取当前用户信息
    const currentUser = ref(getCurrentUser() || {})

    const pageTitle = computed(() => {
      const titles = {
        '/student/my': '个人中心'
      }
      return titles[route.path] || '个人中心'
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
.student-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-secondary);
}

.main-content {
  flex: 1;
  width: 100%;
  margin-left: 0;
  display: flex;
  flex-direction: column;
}

.page-content {
  flex: 1;
  padding: 0;
  overflow-y: auto;
  width: 100%;
  height: 100vh;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-content {
    padding: 0;
  }
}

@media (max-width: 480px) {
  .page-content {
    padding: 0;
  }
}
</style>
