<template>
  <div class="change-password-dialog" v-if="modelValue">
    <div class="dialog-overlay" @click="closeDialog"></div>
    <div class="dialog-content">
      <div class="dialog-header">
        <h3 class="dialog-title">修改密码</h3>
        <button class="close-button" @click="closeDialog">&times;</button>
      </div>
      
      <div class="dialog-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="currentPassword">当前密码</label>
            <div class="password-input-wrapper">
              <input 
                :type="showCurrentPassword ? 'text' : 'password'" 
                id="currentPassword" 
                v-model="formData.currentPassword" 
                class="form-control"
                placeholder="请输入当前密码"
              />
              <button 
                type="button" 
                class="password-toggle" 
                @click="showCurrentPassword = !showCurrentPassword"
              >
                <i :class="showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
            <div v-if="errors.currentPassword" class="form-error">{{ errors.currentPassword }}</div>
          </div>
          
          <div class="form-group">
            <label for="newPassword">新密码</label>
            <div class="password-input-wrapper">
              <input 
                :type="showNewPassword ? 'text' : 'password'" 
                id="newPassword" 
                v-model="formData.newPassword" 
                class="form-control"
                placeholder="请输入新密码"
              />
              <button 
                type="button" 
                class="password-toggle" 
                @click="showNewPassword = !showNewPassword"
              >
                <i :class="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
            <div class="password-strength" v-if="formData.newPassword">
              <div class="strength-bar">
                <div class="strength-progress" :style="{ width: passwordStrength.percent + '%', backgroundColor: passwordStrength.color }"></div>
              </div>
              <div class="strength-text" :style="{ color: passwordStrength.color }">{{ passwordStrength.text }}</div>
            </div>
            <p class="form-help">密码长度至少为8位，包含字母和数字</p>
            <div v-if="errors.newPassword" class="form-error">{{ errors.newPassword }}</div>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">确认新密码</label>
            <div class="password-input-wrapper">
              <input 
                :type="showConfirmPassword ? 'text' : 'password'" 
                id="confirmPassword" 
                v-model="formData.confirmPassword" 
                class="form-control"
                placeholder="请再次输入新密码"
              />
              <button 
                type="button" 
                class="password-toggle" 
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
            <div v-if="errors.confirmPassword" class="form-error">{{ errors.confirmPassword }}</div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="closeDialog">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? '修改中...' : '修改密码' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'save', 'close']);

// 表单数据
const formData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 显示密码控制
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// 错误信息
const errors = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 提交状态
const isSubmitting = ref(false);

// 密码强度计算
const passwordStrength = computed(() => {
  const password = formData.value.newPassword;
  
  if (!password) {
    return { percent: 0, color: '#e0e0e0', text: '' };
  }
  
  let strength = 0;
  let color = '';
  let text = '';
  
  // 长度检查
  if (password.length >= 8) {
    strength += 25;
  }
  
  // 包含数字
  if (/\d/.test(password)) {
    strength += 25;
  }
  
  // 包含小写字母
  if (/[a-z]/.test(password)) {
    strength += 25;
  }
  
  // 包含大写字母或特殊字符
  if (/[A-Z]/.test(password) || /[^a-zA-Z0-9]/.test(password)) {
    strength += 25;
  }
  
  // 设置颜色和文本
  if (strength <= 25) {
    color = '#ff4d4f';
    text = '弱';
  } else if (strength <= 50) {
    color = '#faad14';
    text = '一般';
  } else if (strength <= 75) {
    color = '#52c41a';
    text = '强';
  } else {
    color = '#1890ff';
    text = '非常强';
  }
  
  return { percent: strength, color, text };
});

// 验证表单
const validateForm = () => {
  let isValid = true;
  
  // 重置错误信息
  Object.keys(errors).forEach(key => errors[key] = '');
  
  // 验证当前密码
  if (!formData.value.currentPassword) {
    errors.currentPassword = '请输入当前密码';
    isValid = false;
  }
  
  // 验证新密码
  if (!formData.value.newPassword) {
    errors.newPassword = '请输入新密码';
    isValid = false;
  } else if (formData.value.newPassword.length < 8) {
    errors.newPassword = '密码长度至少为8位';
    isValid = false;
  } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(formData.value.newPassword)) {
    errors.newPassword = '密码必须包含字母和数字';
    isValid = false;
  } else if (formData.value.newPassword === formData.value.currentPassword) {
    errors.newPassword = '新密码不能与当前密码相同';
    isValid = false;
  }
  
  // 验证确认密码
  if (!formData.value.confirmPassword) {
    errors.confirmPassword = '请确认新密码';
    isValid = false;
  } else if (formData.value.confirmPassword !== formData.value.newPassword) {
    errors.confirmPassword = '两次输入的密码不一致';
    isValid = false;
  }
  
  return isValid;
};

// 提交表单
const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }
  
  try {
    isSubmitting.value = true;
    
    // 触发保存事件
    emit('save', {
      currentPassword: formData.value.currentPassword,
      newPassword: formData.value.newPassword
    });
    
    // 重置表单
    formData.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    
    // 关闭对话框
    closeDialog();
  } catch (error) {
    console.error('修改密码失败:', error);
  } finally {
    isSubmitting.value = false;
  }
};

// 关闭对话框
const closeDialog = () => {
  emit('update:modelValue', false);
  emit('close');
  
  // 重置表单
  formData.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  
  // 重置错误信息
  Object.keys(errors).forEach(key => errors[key] = '');
  
  // 重置密码显示状态
  showCurrentPassword.value = false;
  showNewPassword.value = false;
  showConfirmPassword.value = false;
};
</script>

<style scoped>
.change-password-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.dialog-content {
  position: relative;
  width: 90%;
  max-width: 500px;
  background-color: var(--background-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 1001;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.dialog-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-color-secondary);
}

.dialog-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.form-control {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 0.875rem;
  background-color: var(--background-color);
  color: var(--text-color);
  transition: all var(--transition-normal);
}

.form-control:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-light);
  outline: none;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.5rem 1.25rem;
  border-radius: var(--border-radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.btn-outline {
  background-color: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-color);
}

.btn-outline:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-primary {
  background-color: var(--primary-color);
  border: 1px solid var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-color-dark);
  border-color: var(--primary-color-dark);
}

.btn-primary:disabled {
  background-color: var(--primary-color-light);
  border-color: var(--primary-color-light);
  cursor: not-allowed;
}

.form-help {
  font-size: 0.75rem;
  color: var(--text-color-tertiary);
  margin: 0.25rem 0 0 0;
}

.form-error {
  font-size: 0.75rem;
  color: var(--danger-color);
  margin: 0.25rem 0 0 0;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-toggle {
  position: absolute;
  right: 0.625rem;
  background: none;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-strength {
  margin-top: 0.5rem;
}

.strength-bar {
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.strength-progress {
  height: 100%;
  transition: width 0.3s, background-color 0.3s;
}

.strength-text {
  font-size: 0.75rem;
  text-align: right;
}
</style> 