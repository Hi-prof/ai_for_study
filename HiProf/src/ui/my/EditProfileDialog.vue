<template>
  <div class="edit-profile-dialog" v-if="modelValue">
    <div class="dialog-overlay" @click="closeDialog"></div>
    <div class="dialog-content">
      <div class="dialog-header">
        <h3 class="dialog-title">编辑个人资料</h3>
        <button class="close-button" @click="closeDialog">&times;</button>
      </div>
      
      <div class="dialog-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="name">姓名</label>
            <input 
              type="text" 
              id="name" 
              v-model="formData.name" 
              class="form-control"
              placeholder="请输入您的姓名"
            />
          </div>
          
          <div class="form-group">
            <label for="email">邮箱</label>
            <input 
              type="email" 
              id="email" 
              v-model="formData.email" 
              class="form-control"
              placeholder="请输入您的邮箱"
            />
          </div>
          
          <div class="form-group">
            <label for="avatar">头像</label>
            <div class="avatar-upload">
              <div class="avatar-preview">
                <img v-if="previewImage || formData.avatar" :src="previewImage || formData.avatar" alt="头像预览" />
                <div v-else class="avatar-placeholder">{{ getInitials(formData.name || user.name || user.username) }}</div>
              </div>
              <input 
                type="file" 
                id="avatar" 
                ref="avatarInput"
                @change="handleAvatarChange" 
                accept="image/*"
                class="file-input"
              />
              <button type="button" class="btn btn-outline" @click="triggerFileInput">选择图片</button>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="closeDialog">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'save', 'close']);

// 表单数据
const formData = ref({
  name: '',
  email: '',
  avatar: ''
});

// 头像预览
const previewImage = ref(null);
const avatarInput = ref(null);

// 提交状态
const isSubmitting = ref(false);

// 初始化表单数据
onMounted(() => {
  formData.value = {
    name: props.user.name || '',
    email: props.user.email || '',
    avatar: props.user.avatar || ''
  };
});

// 监听用户数据变化
watch(() => props.user, (newUser) => {
  formData.value = {
    name: newUser.name || '',
    email: newUser.email || '',
    avatar: newUser.avatar || ''
  };
}, { deep: true });

// 获取用户名首字母作为头像
const getInitials = (name) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

// 触发文件选择
const triggerFileInput = () => {
  if (avatarInput.value) {
    avatarInput.value.click();
  }
};

// 处理头像变更
const handleAvatarChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    // 创建预览URL
    previewImage.value = URL.createObjectURL(file);
    
    // 在实际应用中，这里应该处理文件上传
    // 为了演示，我们只是更新预览
    // TODO: 实现文件上传逻辑
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    isSubmitting.value = true;
    
    // 构建更新数据
    const updatedData = {
      name: formData.value.name,
      email: formData.value.email,
      avatar: previewImage.value || formData.value.avatar
    };
    
    // 触发保存事件
    emit('save', updatedData);
    
    // 关闭对话框
    closeDialog();
  } catch (error) {
    console.error('保存个人资料失败:', error);
  } finally {
    isSubmitting.value = false;
  }
};

// 关闭对话框
const closeDialog = () => {
  emit('update:modelValue', false);
  emit('close');
};
</script>

<style scoped>
.edit-profile-dialog {
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
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  background-color: var(--input-background);
  color: var(--text-color);
  transition: border-color var(--transition-normal);
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
}

.avatar-upload {
  display: flex;
  align-items: center;
}

.avatar-preview {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 1rem;
  background-color: var(--background-color-secondary);
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-color);
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
}

.file-input {
  display: none;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.75rem 1.25rem;
  border-radius: var(--border-radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.btn-outline {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-color);
}

.btn-outline:hover {
  border-color: var(--text-color);
  background-color: var(--hover-color);
}

.btn-primary {
  background-color: var(--primary-color);
  border: 1px solid var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-color-dark);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style> 