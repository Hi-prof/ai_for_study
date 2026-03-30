<template>
  <div class="auth-page reset-password-page">
    <div class="auth-container">
      <div class="auth-header">
        <h1>知识图谱系统</h1>
        <h2>重置密码</h2>
      </div>
      
      <div class="auth-form">
        <div v-if="errorMessage" class="auth-error">
          {{ errorMessage }}
        </div>
        
        <div v-if="successMessage" class="auth-success">
          {{ successMessage }}
        </div>
        
        <template v-if="!isSuccess && !isTokenInvalid">
          <div class="form-group">
            <label for="password">新密码</label>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              placeholder="请输入新密码" 
            />
            <div v-if="validationError.password" class="field-error">
              {{ validationError.password }}
            </div>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">确认密码</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="confirmPassword" 
              placeholder="请再次输入新密码" 
            />
            <div v-if="validationError.confirmPassword" class="field-error">
              {{ validationError.confirmPassword }}
            </div>
          </div>
          
          <button 
            class="auth-button" 
            @click="handleResetPassword"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">重置密码</span>
            <LoadingSpinner v-else small />
          </button>
        </template>
        
        <div class="auth-links">
          <p v-if="isSuccess || isTokenInvalid">
            <router-link to="/login">返回登录</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { resetPassword } from '@/api/auth';
import LoadingSpinner from '@/ui/common/LoadingSpinner.vue';

const route = useRoute();
const router = useRouter();
const token = ref('');
const password = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const isSuccess = ref(false);
const isTokenInvalid = ref(false);
const validationError = reactive({
  password: '',
  confirmPassword: ''
});

onMounted(() => {
  // 从URL获取token
  token.value = route.query.token || '';
  
  if (!token.value) {
    isTokenInvalid.value = true;
    errorMessage.value = '无效的重置链接，请重新申请重置密码';
  }
});

// 验证表单
const validateForm = () => {
  let isValid = true;
  
  // 重置验证错误
  validationError.password = '';
  validationError.confirmPassword = '';
  
  // 验证密码
  if (!password.value) {
    validationError.password = '请输入新密码';
    isValid = false;
  } else if (password.value.length < 6) {
    validationError.password = '密码至少需要6个字符';
    isValid = false;
  }
  
  // 验证确认密码
  if (!confirmPassword.value) {
    validationError.confirmPassword = '请确认新密码';
    isValid = false;
  } else if (password.value !== confirmPassword.value) {
    validationError.confirmPassword = '两次输入的密码不一致';
    isValid = false;
  }
  
  return isValid;
};

// 处理重置密码
const handleResetPassword = async () => {
  if (!validateForm()) {
    return;
  }
  
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    await resetPassword(token.value, password.value);
    
    // 重置成功
    isSuccess.value = true;
    successMessage.value = '密码重置成功，请使用新密码登录';
    
    // 3秒后自动跳转到登录页
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  } catch (error) {
    console.error('重置密码失败:', error);
    if (error.response) {
      if (error.response.status === 400) {
        errorMessage.value = '重置链接已失效，请重新申请';
        isTokenInvalid.value = true;
      } else {
        errorMessage.value = '重置密码失败，请稍后重试';
      }
    } else {
      errorMessage.value = '重置密码失败，请检查网络连接';
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

input[type="password"] {
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  background-color: var(--background-color);
  font-size: var(--font-size-medium);
  transition: border-color 0.2s ease;
}

input[type="password"]:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
}

.field-error {
  color: var(--error-color, #dc2626);
  font-size: var(--font-size-xs);
  margin-top: 2px;
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