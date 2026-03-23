import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import tokenManager from '@/utils/tokenManager'
import { getTokenRemainingMinutes } from '@/utils/auth'

/**
 * Token管理组合式函数
 * 提供token状态监控和自动刷新功能
 */
export function useTokenManager() {
  const router = useRouter()
  
  // 响应式状态
  const tokenStatus = ref({
    hasToken: false,
    isExpired: true,
    remainingMinutes: 0,
    isExpiringSoon: false
  })
  
  const isRefreshing = ref(false)
  const showWarning = ref(false)
  const warningMessage = ref('')

  // 更新token状态
  const updateTokenStatus = () => {
    tokenStatus.value = tokenManager.getStatus()
  }

  // token刷新成功回调
  const onTokenRefresh = (data) => {
    console.log('Token已刷新:', data)
    updateTokenStatus()
    isRefreshing.value = false
    
    // 如果是手动刷新，显示成功提示
    if (data.manual) {
      showSuccessMessage('Token刷新成功')
    }
  }

  // token警告回调
  const onTokenWarning = (data) => {
    const { remainingMinutes } = data
    console.log(`Token警告: 剩余${remainingMinutes}分钟`)
    
    showWarning.value = true
    warningMessage.value = `您的登录状态将在${remainingMinutes}分钟后过期，建议及时保存工作`
    
    // 10秒后自动隐藏警告
    setTimeout(() => {
      showWarning.value = false
    }, 10000)
  }

  // token过期回调
  const onTokenExpired = (data) => {
    console.log('Token已过期:', data)
    updateTokenStatus()
    isRefreshing.value = false
    
    // 显示过期提示并跳转到登录页
    showErrorMessage('登录已过期，请重新登录')
    
    setTimeout(() => {
      const currentPath = router.currentRoute.value.fullPath
      router.push({
        path: '/login',
        query: { redirect: currentPath }
      })
    }, 2000)
  }

  // 手动刷新token
  const refreshToken = async () => {
    if (isRefreshing.value) {
      return false
    }
    
    isRefreshing.value = true
    const success = await tokenManager.manualRefresh()
    
    if (!success) {
      isRefreshing.value = false
    }
    
    return success
  }

  // 显示成功消息（可以根据项目的通知组件调整）
  const showSuccessMessage = (message) => {
    console.log('成功:', message)
    // 这里可以集成项目的通知组件
    // 例如: ElMessage.success(message)
  }

  // 显示错误消息（可以根据项目的通知组件调整）
  const showErrorMessage = (message) => {
    console.log('错误:', message)
    // 这里可以集成项目的通知组件
    // 例如: ElMessage.error(message)
  }

  // 关闭警告
  const dismissWarning = () => {
    showWarning.value = false
  }

  // 延长会话（手动刷新token）
  const extendSession = async () => {
    dismissWarning()
    await refreshToken()
  }

  // 组件挂载时启动监控
  onMounted(() => {
    // 注册回调函数
    tokenManager.on('onRefresh', onTokenRefresh)
    tokenManager.on('onWarning', onTokenWarning)
    tokenManager.on('onExpired', onTokenExpired)
    
    // 启动监控
    tokenManager.startMonitoring()
    
    // 初始化状态
    updateTokenStatus()
  })

  // 组件卸载时清理
  onUnmounted(() => {
    // 移除回调函数
    tokenManager.off('onRefresh', onTokenRefresh)
    tokenManager.off('onWarning', onTokenWarning)
    tokenManager.off('onExpired', onTokenExpired)
  })

  return {
    // 状态
    tokenStatus,
    isRefreshing,
    showWarning,
    warningMessage,
    
    // 方法
    refreshToken,
    dismissWarning,
    extendSession,
    updateTokenStatus,
    
    // 计算属性
    remainingMinutes: () => getTokenRemainingMinutes()
  }
}

/**
 * 全局token管理器
 * 用于在应用级别管理token状态
 */
export function useGlobalTokenManager() {
  // 启动全局监控
  const startGlobalMonitoring = () => {
    tokenManager.startMonitoring()
  }

  // 停止全局监控
  const stopGlobalMonitoring = () => {
    tokenManager.stopMonitoring()
  }

  return {
    startGlobalMonitoring,
    stopGlobalMonitoring,
    tokenManager
  }
}
