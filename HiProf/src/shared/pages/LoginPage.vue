<template>
  <div class="auth-page login-page glass-morphic-bg">
    <!-- 添加背景光斑效果 -->
    <div class="glass-orb glass-orb-1"></div>
    <div class="glass-orb glass-orb-2"></div>
    <div class="glass-orb glass-orb-3"></div>
    <div class="glass-orb glass-orb-4"></div>
    
    <div class="auth-container glass-card">
      <div class="auth-header">
        <h1>Hi Prof登入</h1>
        <h2>用户登录</h2>
      </div>
      
      <form class="auth-form" @submit.prevent="handleLogin">
        <div v-if="errorMessage" class="auth-error glass">
          {{ errorMessage }}
        </div>
        
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            type="text"
            id="username"
            v-model="loginForm.username"
            placeholder="请输入用户名"
            @keyup.enter="handleLogin"
            class="glass-input"
            autocomplete="username"
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="loginForm.password" 
            placeholder="请输入密码" 
            @keyup.enter="handleLogin"
            class="glass-input"
            autocomplete="current-password"
          />
        </div>
        
        <div class="form-group" v-if="captchaEnabled">
          <label for="code">验证码</label>
          <div class="captcha-container">
            <input 
              type="text" 
              id="code" 
              v-model="loginForm.code" 
              placeholder="请输入验证码" 
              @keyup.enter="handleLogin"
              class="glass-input"
            />
            <div class="captcha-image glass" @click="getCode" :title="codeUrl ? '点击刷新验证码' : '点击获取验证码'">
              <img v-if="codeUrl" :src="codeUrl" alt="验证码" @error="handleImageError" />
              <div v-else class="captcha-placeholder">
                <span>点击获取验证码</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-options">
          <div class="remember-me">
            <input type="checkbox" id="remember" v-model="loginForm.rememberMe" />
            <label for="remember">记住我</label>
          </div>
          <router-link to="/forgot-password" class="forgot-password">
            忘记密码?
          </router-link>
        </div>
        
        <button
          class="auth-button glass-button"
          @click="handleLogin"
          :disabled="isLoading"
        >
          <span v-if="!isLoading">登录</span>
          <span v-else>登录中...</span>
        </button>


        
        <div class="auth-links">
          <p>
            还没有账号? 
            <router-link to="/register">立即注册</router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { login, getCodeImage } from '@/api/auth';
import Cookies from 'js-cookie';
import LoadingSpinner from '@/ui/common/LoadingSpinner.vue';    

const router = useRouter();
const route = useRoute();
const errorMessage = ref('');
const isLoading = ref(false);
const redirect = ref(undefined);

// 验证码相关
const captchaEnabled = ref(false); // 是否启用验证码
const codeUrl = ref('');



// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false,
  code: '',
  uuid: ''
});

// 监听路由参数
onMounted(() => {
  // 获取重定向地址
  redirect.value = route.query && route.query.redirect;

  // 检查是否有记住的登录信息
  getCookie();

  // 获取验证码
  getCode();
});

// 获取验证码 - 修复axios响应格式处理
const getCode = async () => {
  try {
    const response = await getCodeImage();
    // axios返回格式：{data: {...}, status: 200, ...}
    const res = response.data;
    
    console.log('验证码API响应:', res);
    
    if (res && res.img) {
      captchaEnabled.value = res.captchaEnabled !== false;
      codeUrl.value = "data:image/gif;base64," + res.img;
      loginForm.uuid = res.uuid;
      console.log('验证码设置成功');
    } else {
      console.warn('验证码响应格式异常:', res);
      captchaEnabled.value = false; // 后端不支持验证码时禁用
    }
  } catch (error) {
    console.error('获取验证码失败:', error);
    captchaEnabled.value = false; // 网络错误时禁用验证码
    errorMessage.value = '验证码加载失败，请刷新页面重试';
  }
};

// 处理登录
const handleLogin = async () => {
  // 表单验证
  if (!loginForm.username) {
    errorMessage.value = '请输入用户名';
    return;
  }
  if (!loginForm.password) {
    errorMessage.value = '请输入密码';
    return;
  }
  // 验证码验证 - 添加调试信息
  console.log('验证码检查:', {
    captchaEnabled: captchaEnabled.value,
    code: loginForm.code,
    uuid: loginForm.uuid
  });
  
  // 临时禁用验证码验证用于测试
  // if (captchaEnabled.value && !loginForm.code) {
  //   errorMessage.value = '请输入验证码';
  //   return;
  // }
  
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    const response = await login(
      loginForm.username, 
      loginForm.password, 
      loginForm.rememberMe,
      loginForm.code,
      loginForm.uuid
    );
    
    console.log('登录API返回:', response);
    console.log('response.userProfile:', response.userProfile);
    console.log('response.userProfile?.role:', response.userProfile?.role);

    // 登录成功后，根据用户角色智能重定向
    if (redirect.value) {
      // 如果有重定向地址，直接跳转
      router.push(redirect.value);
    } else {
      // 没有重定向地址时，根据用户角色跳转到对应页面
      const userProfile = response.userProfile;
      const userRole = userProfile?.role;

      console.log('用户角色:', userRole, '准备重定向');

      if (userRole === 'teacher') {
        router.push('/my');  // 教师登录后跳转到个人中心
      } else if (userRole === 'student') {
        router.push('/my');  // 学生登录后也跳转到个人中心（通过智能重定向到学生个人中心）
      } else {
        // 如果角色未确定，尝试从Cookie获取
        setTimeout(() => {
          const userInfo = JSON.parse(Cookies.get('User-information') || '{}');
          const cookieRole = userInfo.role;

          console.log('从Cookie获取的用户角色:', cookieRole);

          if (cookieRole === 'teacher') {
            router.push('/my');  // 教师登录后跳转到个人中心
          } else if (cookieRole === 'student') {
            router.push('/my');  // 学生登录后也跳转到个人中心（通过智能重定向到学生个人中心）
          } else {
            // 如果仍然无法确定角色，跳转到首页
            router.push('/');
          }
        }, 200);
      }
    }
  } catch (error) {
    console.error('登录失败:', error);
    if (error.response && error.response.status === 401) {
      errorMessage.value = '用户名或密码错误';
    } else if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message;
    } else {
      errorMessage.value = '登录失败，请稍后重试';
    }
        // 登录失败后自动刷新验证码
        if (captchaEnabled.value) {
          loginForm.code = '';
          getCode(); // 自动获取新验证码
        }
  } finally {
    isLoading.value = false;
  }
};

// 从Cookie获取登录信息
const getCookie = () => {
  const username = Cookies.get('username');
  const password = Cookies.get('password');
  const rememberMe = Cookies.get('rememberMe');

  if (username && password && rememberMe) {
    loginForm.username = username;
    loginForm.password = password;
    loginForm.rememberMe = rememberMe === 'true';
  }
};

// 处理验证码图片加载错误 - 简化版
const handleImageError = () => {
  console.error('验证码图片加载失败');
  codeUrl.value = '';
  // 用户可以手动点击重新获取，不要自动重试
};

</script>

<style scoped>
@import '@/assets/styles/glassmorphism.css';

.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: var(--spacing-lg);
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, 
    rgba(74, 144, 226, 0.1) 0%, 
    rgba(162, 155, 254, 0.08) 25%,
    rgba(255, 184, 0, 0.05) 50%,
    rgba(46, 213, 115, 0.08) 75%,
    rgba(255, 107, 107, 0.1) 100%);
}

.auth-container {
  width: 100%;
  max-width: 440px;
  padding: 2.5rem;
  position: relative;
  z-index: 10;
  /* 继承glass-card样式 */
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.9) 0%, 
    rgba(147, 51, 234, 0.9) 50%,
    rgba(236, 72, 153, 0.9) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.auth-header h2 {
  font-size: 1.125rem;
  color: rgba(0, 0, 0, 0.7);
  font-weight: 500;
  margin-top: 0.5rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.auth-error {
  padding: 1rem;
  border-radius: 12px;
  color: rgba(220, 38, 38, 0.9);
  font-size: 0.875rem;
  text-align: center;
  font-weight: 500;
  border: 1px solid rgba(220, 38, 38, 0.2);
  background: rgba(248, 113, 113, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.captcha-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.captcha-container input {
  flex: 1;
}

.captcha-image {
  width: 120px;
  height: 48px;
  cursor: pointer;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid var(--glass-border);
  transition: var(--glass-transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.captcha-image:hover {
  background: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
}

.captcha-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.captcha-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  text-align: center;
}

label {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.8);
  letter-spacing: 0.01em;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  margin: 0.5rem 0;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.remember-me input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: rgba(59, 130, 246, 0.8);
  border-radius: 4px;
}

.remember-me label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.7);
  cursor: pointer;
}

.forgot-password {
  color: rgba(59, 130, 246, 0.9);
  text-decoration: none;
  transition: all 0.3s ease;
  font-weight: 500;
  position: relative;
}

.forgot-password::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.9), rgba(147, 51, 234, 0.9));
  transition: width 0.3s ease;
  border-radius: 1px;
}

.forgot-password:hover::after {
  width: 100%;
}

.auth-button {
  margin-top: 0.5rem;
  height: 52px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  z-index: 1;
  color: rgba(0, 0, 0, 0.9);
  letter-spacing: 0.5px;
  /* 继承glass-button样式 */
}

.auth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 测试账号提示样式 */
.test-account-tip {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(10px);
  font-size: var(--text-sm);
}

.tip-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
  color: var(--primary-color);
  font-weight: var(--font-medium);
}

.tip-header svg {
  width: 16px;
  height: 16px;
}

.tip-content {
  margin-bottom: var(--spacing-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}

.tip-content p {
  margin: var(--spacing-xs) 0;
}

.tip-content code {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-family: 'Courier New', monospace;
  font-size: var(--text-xs);
  color: var(--primary-color);
}

.quick-login-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: var(--text-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
  backdrop-filter: blur(5px);
}

.quick-login-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: var(--primary-color);
  transform: translateY(-1px);
}

.auth-button:disabled:hover {
  background: var(--glass-bg-primary);
  transform: none;
}

.auth-links {
  text-align: center;
  font-size: 0.875rem;
  margin-top: 1rem;
  color: rgba(0, 0, 0, 0.7);
}

.auth-links a {
  color: rgba(59, 130, 246, 0.9);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
}

.auth-links a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.9), rgba(147, 51, 234, 0.9));
  transition: width 0.3s ease;
  border-radius: 1px;
}

.auth-links a:hover::after {
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .auth-page {
    padding: 1rem;
  }
  
  .auth-container {
    max-width: 100%;
    padding: 2rem 1.5rem;
  }
  
  .auth-header h1 {
    font-size: 1.75rem;
  }
  
  .auth-header h2 {
    font-size: 1rem;
  }
  
  .auth-button {
    height: 48px;
    font-size: 0.9rem;
  }
  
  .form-options {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .captcha-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .captcha-image {
    width: 100%;
    height: 52px;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .auth-container {
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid rgba(0, 0, 0, 0.3);
  }
  
  .glass-input {
    background: rgba(255, 255, 255, 0.9);
    border: 2px solid rgba(0, 0, 0, 0.3);
  }
  
  .auth-button {
    background: rgba(59, 130, 246, 0.9);
    color: white;
    border: 2px solid rgba(0, 0, 0, 0.2);
  }
}

/* 减少动画的用户偏好 */
@media (prefers-reduced-motion: reduce) {
  .glass-orb {
    animation: none;
  }
  
  * {
    transition: none !important;
  }
  
  .auth-container,
  .glass-input,
  .auth-button {
    transform: none !important;
  }
}
</style> 
