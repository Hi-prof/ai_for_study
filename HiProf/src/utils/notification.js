// 通知工具函数

import { notificationManager } from '@/ui/common/NotificationToast.vue'

// 成功通知
export function showSuccess(title, message, options = {}) {
  return notificationManager.success(title, message, options)
}

// 错误通知
export function showError(title, message, options = {}) {
  return notificationManager.error(title, message, options)
}

// 警告通知
export function showWarning(title, message, options = {}) {
  return notificationManager.warning(title, message, options)
}

// 信息通知
export function showInfo(title, message, options = {}) {
  return notificationManager.info(title, message, options)
}

// 移除通知
export function removeNotification(id) {
  return notificationManager.remove(id)
}

// 清除所有通知
export function clearNotifications() {
  return notificationManager.clear()
}

// 快捷方法
export const notify = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  remove: removeNotification,
  clear: clearNotifications
}

// API 错误处理
export function handleApiError(error, defaultMessage = '操作失败') {
  let title = '错误'
  let message = defaultMessage

  if (error.response) {
    // 服务器响应错误
    const status = error.response.status
    const data = error.response.data

    switch (status) {
      case 400:
        title = '请求错误'
        message = data.message || '请求参数有误'
        break
      case 401:
        title = '未授权'
        message = '请重新登录'
        break
      case 403:
        title = '禁止访问'
        message = '您没有权限执行此操作'
        break
      case 404:
        title = '资源不存在'
        message = '请求的资源未找到'
        break
      case 422:
        title = '数据验证失败'
        message = data.message || '提交的数据格式不正确'
        break
      case 429:
        title = '请求过于频繁'
        message = '请稍后再试'
        break
      case 500:
        title = '服务器错误'
        message = '服务器内部错误，请稍后重试'
        break
      case 502:
        title = '网关错误'
        message = '服务暂时不可用'
        break
      case 503:
        title = '服务不可用'
        message = '服务正在维护中'
        break
      default:
        title = '网络错误'
        message = data.message || `请求失败 (${status})`
    }
  } else if (error.request) {
    // 网络错误
    title = '网络错误'
    message = '网络连接失败，请检查网络设置'
  } else {
    // 其他错误
    title = '错误'
    message = error.message || defaultMessage
  }

  showError(title, message)
}

// 文件上传错误处理
export function handleFileError(error, fileName) {
  let message = `文件 "${fileName}" 上传失败`

  if (error.code === 'FILE_TOO_LARGE') {
    message = `文件 "${fileName}" 超过大小限制`
  } else if (error.code === 'INVALID_FILE_TYPE') {
    message = `文件 "${fileName}" 格式不支持`
  } else if (error.code === 'UPLOAD_FAILED') {
    message = `文件 "${fileName}" 上传失败，请重试`
  }

  showError('上传失败', message)
}

// 表单验证错误处理
export function handleValidationErrors(errors) {
  if (Array.isArray(errors)) {
    errors.forEach(error => {
      showError('验证失败', error.message || error)
    })
  } else if (typeof errors === 'object') {
    Object.keys(errors).forEach(field => {
      const fieldErrors = Array.isArray(errors[field]) ? errors[field] : [errors[field]]
      fieldErrors.forEach(error => {
        showError(`${field} 验证失败`, error)
      })
    })
  } else {
    showError('验证失败', errors || '表单数据不正确')
  }
}

// 操作成功提示
export function showOperationSuccess(operation, target = '') {
  const messages = {
    create: `${target}创建成功`,
    update: `${target}更新成功`,
    delete: `${target}删除成功`,
    save: `${target}保存成功`,
    upload: `${target}上传成功`,
    download: `${target}下载成功`,
    copy: `${target}复制成功`,
    send: `${target}发送成功`,
    submit: `${target}提交成功`,
    import: `${target}导入成功`,
    export: `${target}导出成功`
  }

  const message = messages[operation] || `${operation}成功`
  showSuccess('操作成功', message)
}

// 操作确认
export function showConfirmation(title, message, onConfirm, onCancel) {
  // 这里可以集成确认对话框组件
  // 暂时使用浏览器原生确认框
  if (confirm(`${title}\n\n${message}`)) {
    onConfirm && onConfirm()
  } else {
    onCancel && onCancel()
  }
}

// 加载状态通知
export function showLoading(message = '加载中...') {
  return showInfo('', message, { persistent: true })
}

// 进度通知
export function showProgress(title, progress, total) {
  const percentage = Math.round((progress / total) * 100)
  return showInfo(title, `进度: ${progress}/${total} (${percentage}%)`, { persistent: true })
}

// 批量操作结果
export function showBatchResult(successCount, failCount, operation = '操作') {
  if (failCount === 0) {
    showSuccess('批量操作完成', `成功${operation} ${successCount} 项`)
  } else if (successCount === 0) {
    showError('批量操作失败', `${failCount} 项${operation}失败`)
  } else {
    showWarning('批量操作部分成功', `成功 ${successCount} 项，失败 ${failCount} 项`)
  }
}

// 网络状态通知
export function showNetworkStatus(isOnline) {
  if (isOnline) {
    showSuccess('网络已连接', '网络连接已恢复')
  } else {
    showError('网络已断开', '请检查网络连接', { persistent: true })
  }
}

// 自动保存通知
export function showAutoSave(success = true) {
  if (success) {
    showInfo('', '已自动保存', { duration: 2000 })
  } else {
    showWarning('自动保存失败', '请手动保存您的工作')
  }
}

export default notify
