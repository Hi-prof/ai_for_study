import Cookies from 'js-cookie'

const TokenKey = 'User-Token'
const UserKey = 'User-information'

export function getToken() {
  const token = Cookies.get(TokenKey)
  console.log('获取Token:', token ? '存在' : '不存在')
  return token
}

export function setToken(token) {
  // 生产环境需要设置正确的Cookie选项
  const cookieOptions = {
    path: '/',
    sameSite: 'lax'
  }

  // 如果是生产环境，设置域
  if (window.location.hostname !== 'localhost') {
    cookieOptions.domain = window.location.hostname
  }

  console.log('设置Token，选项:', cookieOptions)
  return Cookies.set(TokenKey, token, cookieOptions)
}

export function removeToken() {
  const cookieOptions = {
    path: '/',
    sameSite: 'lax'
  }

  if (window.location.hostname !== 'localhost') {
    cookieOptions.domain = window.location.hostname
  }

  return Cookies.remove(TokenKey, cookieOptions)
}

export function getUser() {
  const userStr = Cookies.get(UserKey)
  console.log('获取用户信息:', userStr ? '存在' : '不存在')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      console.log('解析用户信息成功，用户ID:', user?.id || user?.userId)
      return user
    } catch (e) {
      console.error('解析用户信息失败:', e)
      return null
    }
  }
  return null
}

export function setUser(user) {
  const cookieOptions = {
    path: '/',
    sameSite: 'lax'
  }

  if (window.location.hostname !== 'localhost') {
    cookieOptions.domain = window.location.hostname
  }

  console.log('设置用户信息，用户ID:', user?.id || user?.userId)
  return Cookies.set(UserKey, JSON.stringify(user), cookieOptions)
}

export function removeUser() {
  const cookieOptions = {
    path: '/',
    sameSite: 'lax'
  }

  if (window.location.hostname !== 'localhost') {
    cookieOptions.domain = window.location.hostname
  }

  return Cookies.remove(UserKey, cookieOptions)
}