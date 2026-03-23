<template>
  <div class="auth-page register-page">
    <div class="auth-container">
      <div class="auth-header">
        <h1>知识图谱系统</h1>
        <h2>用户注册</h2>
      </div>
      
      <div class="auth-form">
        <div v-if="errorMessage" class="auth-error">
          {{ errorMessage }}
        </div>
        
        <div class="form-group">
          <label for="username">用户名 <span class="required">*</span></label>
          <input 
            type="text" 
            id="username" 
            v-model="formData.username" 
            placeholder="请输入用户名" 
          />
          <div v-if="validationErrors.username" class="field-error">
            {{ validationErrors.username }}
          </div>
        </div>
        
        <div class="form-group">
          <label for="email">电子邮箱 <span class="required">*</span></label>
          <input 
            type="email" 
            id="email" 
            v-model="formData.email" 
            placeholder="请输入电子邮箱" 
          />
          <div v-if="validationErrors.email" class="field-error">
            {{ validationErrors.email }}
          </div>
        </div>
        
        <div class="form-group">
          <label for="password">密码 <span class="required">*</span></label>
          <input 
            type="password" 
            id="password" 
            v-model="formData.password" 
            placeholder="请输入密码" 
          />
          <div v-if="validationErrors.password" class="field-error">
            {{ validationErrors.password }}
          </div>
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">确认密码 <span class="required">*</span></label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="formData.confirmPassword" 
            placeholder="请再次输入密码" 
          />
          <div v-if="validationErrors.confirmPassword" class="field-error">
            {{ validationErrors.confirmPassword }}
          </div>
        </div>
        
        <div class="form-group">
          <label for="role">用户角色 <span class="required">*</span></label>
          <select id="role" v-model="formData.role">
            <option value="">请选择角色</option>
            <option value="teacher">教师</option>
            <option value="student">学生</option>
          </select>
          <div v-if="validationErrors.role" class="field-error">
            {{ validationErrors.role }}
          </div>
        </div>
        
        <div class="form-group">
          <div class="terms-checkbox">
            <input 
              type="checkbox" 
              id="agreeTerms" 
              v-model="formData.agreeTerms" 
            />
            <label for="agreeTerms">
              我已阅读并同意
              <a href="#" @click.prevent="showTerms">用户协议和隐私政策</a>
            </label>
          </div>
          <div v-if="validationErrors.agreeTerms" class="field-error">
            {{ validationErrors.agreeTerms }}
          </div>
        </div>
        
        <button 
          class="auth-button" 
          @click="handleRegister"
          :disabled="isLoading"
        >
          <span v-if="!isLoading">注册</span>
          <span v-else>注册中...</span>
        </button>
        
        <div class="auth-links">
          <p>
            已有账号? 
            <router-link to="/login">立即登录</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { register } from '@/api/auth';

const router = useRouter();
const errorMessage = ref('');
const isLoading = ref(false);

// 表单数据
const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
  agreeTerms: false
});

// 验证错误
const validationErrors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
  agreeTerms: ''
});

// 验证表单
const validateForm = () => {
  let isValid = true;
  
  // 重置验证错误
  Object.keys(validationErrors).forEach(key => {
    validationErrors[key] = '';
  });
  
  // 验证用户名
  if (!formData.username) {
    validationErrors.username = '请输入用户名';
    isValid = false;
  } else if (formData.username.length < 3) {
    validationErrors.username = '用户名至少需要3个字符';
    isValid = false;
  }
  
  // 验证邮箱
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email) {
    validationErrors.email = '请输入电子邮箱';
    isValid = false;
  } else if (!emailRegex.test(formData.email)) {
    validationErrors.email = '请输入有效的电子邮箱';
    isValid = false;
  }
  
  // 验证密码
  if (!formData.password) {
    validationErrors.password = '请输入密码';
    isValid = false;
  } else if (formData.password.length < 6) {
    validationErrors.password = '密码至少需要6个字符';
    isValid = false;
  }
  
  // 验证确认密码
  if (!formData.confirmPassword) {
    validationErrors.confirmPassword = '请确认密码';
    isValid = false;
  } else if (formData.password !== formData.confirmPassword) {
    validationErrors.confirmPassword = '两次输入的密码不一致';
    isValid = false;
  }
  
  // 验证角色
  if (!formData.role) {
    validationErrors.role = '请选择用户角色';
    isValid = false;
  }
  
  // 验证条款同意
  if (!formData.agreeTerms) {
    validationErrors.agreeTerms = '您必须同意用户协议和隐私政策';
    isValid = false;
  }
  
  return isValid;
};

// 处理注册
const handleRegister = async () => {
  if (!validateForm()) {
    return;
  }
  
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    // 准备发送到服务器的数据
    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role
    };
    
    const response = await register(userData);
    
    // 注册成功，跳转到登录页面
    router.push({
      path: '/login',
      query: { registered: 'success' }
    });
  } catch (error) {
    console.error('注册失败:', error);
    if (error.response) {
      if (error.response.status === 409) {
        errorMessage.value = '用户名或邮箱已存在';
      } else if (error.response.data && error.response.data.message) {
        errorMessage.value = error.response.data.message;
      } else {
        errorMessage.value = '注册失败，请稍后重试';
      }
    } else {
      errorMessage.value = '注册失败，请检查网络连接';
    }
  } finally {
    isLoading.value = false;
  }
};

// 显示条款
const showTerms = () => {
  // 此处可以显示条款弹窗
  alert('用户协议和隐私政策内容');
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
  max-width: 460px;
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

.auth-error {
  padding: var(--spacing-sm);
  background-color: rgba(var(--error-color-rgb), 0.1);
  border: 1px solid var(--error-color);
  border-radius: var(--border-radius-sm);
  color: var(--error-color);
  font-size: var(--font-size-small);
  text-align: center;
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

.required {
  color: var(--error-color);
}

input[type="text"],
input[type="password"],
input[type="email"],
select {
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  background-color: var(--background-color);
  font-size: var(--font-size-medium);
  transition: border-color 0.2s ease;
}

input[type="text"]:focus,
input[type="password"]:focus,
input[type="email"]:focus,
select:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
}

.field-error {
  color: var(--error-color);
  font-size: var(--font-size-small);
  margin-top: 2px;
}

.terms-checkbox {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin: var(--spacing-xs) 0;
}

.terms-checkbox label {
  font-size: var(--font-size-small);
}

.terms-checkbox a {
  color: var(--primary-color);
  text-decoration: none;
}

.terms-checkbox a:hover {
  text-decoration: underline;
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
  margin-top: var(--spacing-sm);
}

.auth-button:hover {
  background-color: var(--primary-color-dark, #3a75c4);
}

.auth-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-links {
  text-align: center;
  font-size: var(--font-size-small);
  margin-top: var(--spacing-md);
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