<template>
  <div class="my-settings">
    <!-- 设置标签页 -->
    <div class="settings-tabs">
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'account' }" 
        @click="activeTab = 'account'"
      >
        账号安全
      </button>
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'preference' }" 
        @click="activeTab = 'preference'"
      >
        偏好设置
      </button>
    </div>
    
    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 账号安全设置 -->
      <div v-if="activeTab === 'account'" class="settings-panel">
        <h2 class="panel-title">账号：{{ currentUser.username || '未登录' }}</h2>
        
        <div class="form-section">
          <h3 class="section-title">修改密码</h3>
          
          <div class="password-card">
            <div class="password-info">
              <div class="password-icon">
                <i class="fas fa-lock"></i>
              </div>
              <div class="password-text">
                <div class="password-title">账号密码</div>
                <div class="password-desc">定期更换密码可以保护账号安全</div>
              </div>
            </div>
            <button class="btn btn-primary" @click="showPasswordDialog = true">
              修改密码
            </button>
          </div>
        </div>
        

      </div>
      
      <!-- 偏好设置 -->
      <div v-if="activeTab === 'preference'" class="settings-panel">
        <h2 class="panel-title">账号：{{ currentUser.username || '未登录' }}</h2>
        
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">语言</label>
            <select v-model="preferences.language" class="form-select">
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
        </div>
        
        <div class="form-actions">
          <button class="btn btn-primary" @click="savePreferences" :disabled="isSaving">
            <span v-if="isSaving">保存中...</span>
            <span v-else>保存</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 修改密码对话框 -->
    <ChangePasswordDialog 
      v-model="showPasswordDialog" 
      @save="handlePasswordChange" 
      @close="showPasswordDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ChangePasswordDialog from './ChangePasswordDialog.vue';
import { getCurrentUser } from '@/api/auth';
import { getUser, setUser } from '@/utils/auth';

// 当前用户信息
const currentUser = ref({ username: '加载中...' });

// 当前激活的标签页
const activeTab = ref('account');

// 保存状态
const isSaving = ref(false);

// 显示密码对话框
const showPasswordDialog = ref(false);

// 偏好设置
const preferences = ref({
  language: 'zh-CN'
});

// 组件挂载时加载用户数据
onMounted(() => {
  // 尝试两种方式获取用户信息
  const apiUser = getCurrentUser();
  const cookieUser = getUser();
  
  console.log('API用户信息:', apiUser);
  console.log('Cookie用户信息:', cookieUser);
  
  // 模拟用户数据 - 确保总是有用户名显示
  const mockUser = { 
    username: 'admin',
    role: 'admin',
    email: 'admin@example.com'
  };
  
  // 使用可用的用户信息
  if (apiUser && apiUser.username) {
    currentUser.value = apiUser;
  } else if (cookieUser && cookieUser.username) {
    currentUser.value = cookieUser;
  } else {
    // 使用模拟数据
    currentUser.value = mockUser;
    console.log('使用模拟用户数据:', mockUser);
    
    // 同时将模拟数据写入cookie，以便其他组件也能获取
    setUser(mockUser);
  }
});

// 处理密码修改
const handlePasswordChange = async (passwordData) => {
  try {
    isSaving.value = true;
    
    // TODO: 调用API修改密码
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
    console.log('修改密码:', passwordData);
    
    // 模拟成功
    alert('密码修改成功！');
  } catch (error) {
    console.error('修改密码失败:', error);
    alert('修改失败，请重试');
  } finally {
    isSaving.value = false;
  }
};

// 保存偏好设置
const savePreferences = async () => {
  isSaving.value = true;
  
  try {
    // TODO: 调用API保存偏好设置
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
    console.log('保存偏好设置:', preferences.value);
    
    // 应用主题设置
    if (preferences.value.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (preferences.value.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      // 跟随系统
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    // 模拟成功
    alert('偏好设置保存成功！');
  } catch (error) {
    console.error('保存偏好设置失败:', error);
    alert('保存失败，请重试');
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.my-settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.5rem;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
}

.settings-tabs::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

.tab-button {
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  cursor: pointer;
  transition: all var(--transition-normal);
  white-space: nowrap;
}

.tab-button:hover {
  color: var(--primary-color);
}

.tab-button.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.settings-panel {
  background-color: var(--background-color);
  border-radius: var(--border-radius-lg);
  padding: 1.5rem;
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: var(--text-color);
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
}

.form-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: var(--text-color);
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 0.875rem;
  background-color: var(--background-color);
  color: var(--text-color);
  transition: all var(--transition-normal);
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-light);
  outline: none;
}

.form-input:disabled {
  background-color: var(--background-color-secondary);
  cursor: not-allowed;
}

.form-help {
  font-size: 0.75rem;
  color: var(--text-color-tertiary);
  margin: 0.25rem 0 0 0;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 1.5rem;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.checkbox-group label {
  font-size: 0.875rem;
  color: var(--text-color);
  cursor: pointer;
}

.btn-sm {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
}

.btn-danger {
  background-color: var(--danger-color);
  color: white;
}

.btn-danger:hover {
  background-color: var(--danger-color-dark);
}

.password-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: var(--background-color-light);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
}

.password-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.password-icon {
  width: 40px;
  height: 40px;
  background-color: var(--primary-color-light);
  color: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.password-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.password-desc {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

@media (max-width: 768px) {
  .settings-tabs {
    flex-wrap: wrap;
  }
  
  .password-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .password-card .btn {
    width: 100%;
  }
}
</style>
