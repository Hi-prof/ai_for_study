<template>
  <div class="auth-page forgot-password-page">
    <div class="auth-container">
      <div class="auth-header">
        <h1>知识图谱系统</h1>
        <h2>找回密码</h2>
      </div>
      
      <div class="auth-form">
        <p class="instructions">
          请输入您的注册邮箱，我们将向您发送密码重置链接。
        </p>
        
        <div v-if="errorMessage" class="auth-error">
          {{ errorMessage }}
        </div>
        
        <div v-if="successMessage" class="auth-success">
          {{ successMessage }}
        </div>
        
        <div v-if="!isSuccess" class="form-group">
          <label for="email">电子邮箱</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            placeholder="请输入您的注册邮箱" 
            @keyup.enter="handleForgotPassword"
          />
        </div>
        
        <button 
          v-if="!isSuccess"
          class="auth-button" 
          @click="handleForgotPassword"
          :disabled="isLoading || !email"
        >
          <span v-if="!isLoading">发送重置链接</span>
          <LoadingSpinner v-else small />
        </button>
        
        <div class="auth-links">
          <p>
            <router-link to="/login">返回登录</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { forgotPassword } from '@/api/auth';
import LoadingSpinner from '@/ui/common/LoadingSpinner.vue';

const email = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const isSuccess = ref(false);

// 处理忘记密码
const handleForgotPassword = async () => {
  // 验证邮箱
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value) {
    errorMessage.value = '请输入电子邮箱';
    return;
  } else if (!emailRegex.test(email.value)) {
    errorMessage.value = '请输入有效的电子邮箱';
    return;
  }
  
  try {
    isLoading.value = true;
    errorMessage.value = '';
    successMessage.value = '';
    
    await forgotPassword(email.value);
    
    // 请求成功
    isSuccess.value = true;
    successMessage.value = `重置链接已发送到 ${email.value}，请检查您的邮箱。`;
  } catch (error) {
    console.error('忘记密码请求失败:', error);
    if (error.response && error.response.status === 404) {
      errorMessage.value = '该邮箱未注册';
    } else {
      errorMessage.value = '发送重置链接失败，请稍后重试';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-color-light) 0%, var(--background-color) 100%);
  padding: var(--spacing-lg);
}

.auth-container {
  width: 100%;
  max-width: 420px;
  background-color: var(--background-color-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color-light);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.auth-header h1 {
  font-size: var(--font-size-xlarge);
  margin-bottom: var(--spacing-sm);
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color, #6d28d9) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-header h2 {
  font-size: var(--font-size-large);
  color: var(--text-color);
  font-weight: 500;
}

.instructions {
  text-align: center;
  margin-bottom: var(--spacing-md);
  color: var(--text-lighter);
  font-size: var(--font-size-small);
  line-height: 1.5;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

label {
  font-size: var(--font-size-small);
  font-weight: 500;
  color: var(--text-color);
}

input[type="email"] {
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  background-color: var(--background-color);
  font-size: var(--font-size-medium);
  transition: border-color 0.2s ease;
}

input[type="email"]:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
}

.auth-button {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-medium);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-button:hover {
  background-color: var(--primary-color-dark, #3a75c4);
}

.auth-button:disabled {
  background-color: var(--text-lighter);
  cursor: not-allowed;
}

.auth-error {
  background-color: rgba(var(--error-color-rgb, 220, 38, 38), 0.1);
  color: var(--error-color, #dc2626);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-small);
  border-left: 3px solid var(--error-color, #dc2626);
}

.auth-success {
  background-color: rgba(var(--success-color-rgb, 34, 197, 94), 0.1);
  color: var(--success-color, #22c55e);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-small);
  border-left: 3px solid var(--success-color, #22c55e);
}

.auth-links {
  text-align: center;
  margin-top: var(--spacing-md);
  font-size: var(--font-size-small);
}

.auth-links a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.auth-links a:hover {
  text-decoration: underline;
}
</style> 