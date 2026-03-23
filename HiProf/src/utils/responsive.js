// 响应式工具函数

import { ref, onMounted, onUnmounted } from 'vue'

// 断点定义
export const breakpoints = {
  xs: 480,
  sm: 768,
  md: 1024,
  lg: 1280,
  xl: 1536
}

// 获取当前屏幕尺寸类型
export function useBreakpoint() {
  const windowWidth = ref(window.innerWidth)
  const currentBreakpoint = ref(getCurrentBreakpoint(window.innerWidth))

  function getCurrentBreakpoint(width) {
    if (width < breakpoints.xs) return 'xs'
    if (width < breakpoints.sm) return 'sm'
    if (width < breakpoints.md) return 'md'
    if (width < breakpoints.lg) return 'lg'
    return 'xl'
  }

  function updateSize() {
    windowWidth.value = window.innerWidth
    currentBreakpoint.value = getCurrentBreakpoint(window.innerWidth)
  }

  onMounted(() => {
    window.addEventListener('resize', updateSize, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateSize)
  })

  return {
    windowWidth,
    currentBreakpoint,
    isMobile: () => currentBreakpoint.value === 'xs' || currentBreakpoint.value === 'sm',
    isTablet: () => currentBreakpoint.value === 'md',
    isDesktop: () => currentBreakpoint.value === 'lg' || currentBreakpoint.value === 'xl'
  }
}

// 检测设备类型
export function useDeviceDetection() {
  const isTouchDevice = ref('ontouchstart' in window || navigator.maxTouchPoints > 0)
  const isMobileDevice = ref(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
  const isIOS = ref(/iPad|iPhone|iPod/.test(navigator.userAgent))
  const isAndroid = ref(/Android/.test(navigator.userAgent))

  return {
    isTouchDevice,
    isMobileDevice,
    isIOS,
    isAndroid
  }
}

// 侧边栏响应式管理
export function useSidebarResponsive() {
  const { currentBreakpoint, isMobile } = useBreakpoint()
  const sidebarCollapsed = ref(false)
  const sidebarVisible = ref(true)

  // 监听屏幕尺寸变化
  function handleBreakpointChange() {
    if (isMobile()) {
      // 移动端默认隐藏侧边栏
      sidebarVisible.value = false
      sidebarCollapsed.value = true
    } else {
      // 桌面端显示侧边栏
      sidebarVisible.value = true
      // 恢复之前的折叠状态
      const savedState = localStorage.getItem('sidebarCollapsed')
      sidebarCollapsed.value = savedState === 'true'
    }
  }

  function toggleSidebar() {
    if (isMobile()) {
      sidebarVisible.value = !sidebarVisible.value
    } else {
      sidebarCollapsed.value = !sidebarCollapsed.value
      localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value)
    }
  }

  function closeSidebar() {
    if (isMobile()) {
      sidebarVisible.value = false
    }
  }

  onMounted(() => {
    handleBreakpointChange()
    window.addEventListener('resize', handleBreakpointChange, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleBreakpointChange)
  })

  return {
    sidebarCollapsed,
    sidebarVisible,
    toggleSidebar,
    closeSidebar,
    isMobile
  }
}

// 虚拟滚动工具
export function useVirtualScroll(items, itemHeight = 60, containerHeight = 400) {
  const scrollTop = ref(0)
  const visibleStart = ref(0)
  const visibleEnd = ref(Math.ceil(containerHeight / itemHeight))

  function updateVisibleRange() {
    const start = Math.floor(scrollTop.value / itemHeight)
    const end = Math.min(start + Math.ceil(containerHeight / itemHeight) + 1, items.length)
    
    visibleStart.value = start
    visibleEnd.value = end
  }

  function handleScroll(event) {
    scrollTop.value = event.target.scrollTop
    updateVisibleRange()
  }

  return {
    scrollTop,
    visibleStart,
    visibleEnd,
    handleScroll,
    updateVisibleRange
  }
}

// 无限滚动
export function useInfiniteScroll(loadMore, threshold = 100) {
  const loading = ref(false)
  const hasMore = ref(true)

  function handleScroll(event) {
    if (loading.value || !hasMore.value) return

    const { scrollTop, scrollHeight, clientHeight } = event.target
    
    if (scrollHeight - scrollTop - clientHeight < threshold) {
      loading.value = true
      loadMore().finally(() => {
        loading.value = false
      })
    }
  }

  return {
    loading,
    hasMore,
    handleScroll
  }
}

// 图片懒加载
export function useLazyLoad() {
  const observer = ref(null)

  function createObserver() {
    observer.value = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target
          const src = img.dataset.src
          if (src) {
            img.src = src
            img.removeAttribute('data-src')
            observer.value.unobserve(img)
          }
        }
      })
    }, {
      rootMargin: '50px'
    })
  }

  function observe(element) {
    if (observer.value) {
      observer.value.observe(element)
    }
  }

  function unobserve(element) {
    if (observer.value) {
      observer.value.unobserve(element)
    }
  }

  onMounted(() => {
    createObserver()
  })

  onUnmounted(() => {
    if (observer.value) {
      observer.value.disconnect()
    }
  })

  return {
    observe,
    unobserve
  }
}

// 防抖函数
export function useDebounce(fn, delay = 300) {
  let timeoutId = null

  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

// 节流函数
export function useThrottle(fn, delay = 300) {
  let lastCall = 0

  return function (...args) {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn.apply(this, args)
    }
  }
}

// 本地存储工具
export function useLocalStorage(key, defaultValue = null) {
  const storedValue = ref(defaultValue)

  function loadValue() {
    try {
      const item = localStorage.getItem(key)
      if (item !== null) {
        try {
        storedValue.value = JSON.parse(item)
      } catch (e) {
        storedValue.value = item // Assign raw string if JSON parsing fails
      }
      }
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error)
    }
  }

  function saveValue(value) {
    try {
      storedValue.value = value
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error)
    }
  }

  function removeValue() {
    try {
      storedValue.value = defaultValue
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error)
    }
  }

  onMounted(() => {
    loadValue()
  })

  return {
    value: storedValue,
    save: saveValue,
    remove: removeValue
  }
}

// 主题切换工具
export function useTheme() {
  const { value: theme, save: saveTheme } = useLocalStorage('theme', 'light')

  function toggleTheme() {
    const newTheme = theme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  function setTheme(newTheme) {
    theme.value = newTheme
    saveTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  onMounted(() => {
    // 应用保存的主题
    if (theme.value) {
      document.documentElement.setAttribute('data-theme', theme.value)
    }
  })

  return {
    theme,
    toggleTheme,
    setTheme,
    isDark: () => theme.value === 'dark'
  }
}
