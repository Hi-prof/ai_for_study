<template>
  <div class="my-profile">
    <div class="profile-section">
      <h2 class="section-title">个人信息</h2>
      
      <div class="profile-content">
        <!-- 基本信息 -->
        <div class="profile-card">
          <div class="profile-header">
            <h3 class="profile-subtitle">基本信息</h3>
            <button class="btn btn-outline" @click="showEditBasicInfo = true">
              <i class="edit-icon"></i>
              编辑
            </button>
          </div>
          
          <div class="profile-info-grid">
            <div class="info-item">
              <div class="info-label">用户名</div>
              <div class="info-value">{{ currentUser.username }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">姓名</div>
              <div class="info-value">{{ currentUser.name || '未设置' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">角色</div>
              <div class="info-value">{{ userRoleText }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">邮箱</div>
              <div class="info-value">{{ currentUser.email || '未设置' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">注册时间</div>
              <div class="info-value">{{ formatDate(currentUser.registerTime) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">最近登录</div>
              <div class="info-value">{{ formatDate(currentUser.lastLoginTime) }}</div>
            </div>
          </div>
        </div>
        
        <!-- 安全设置 -->
        <div class="profile-card">
          <div class="profile-header">
            <h3 class="profile-subtitle">安全设置</h3>
          </div>
          
          <div class="security-items">
            <div class="security-item">
              <div class="security-info">
                <div class="security-title">修改密码</div>
                <div class="security-desc">定期更换密码可以保护账号安全</div>
              </div>
              <button class="btn btn-outline" @click="showChangePassword = true">
                修改
              </button>
            </div>
            
            <div class="security-item">
              <div class="security-info">
                <div class="security-title">绑定手机</div>
                <div class="security-desc">{{ currentUser.phone ? '已绑定：' + maskPhone(currentUser.phone) : '未绑定手机号码' }}</div>
              </div>
              <button class="btn btn-outline" @click="showBindPhone = true">
                {{ currentUser.phone ? '修改' : '绑定' }}
              </button>
            </div>
            
            <div class="security-item">
              <div class="security-info">
                <div class="security-title">账号注销</div>
                <div class="security-desc">永久删除您的账号和所有数据</div>
              </div>
              <button class="btn btn-danger" @click="showDeleteAccount = true">
                注销
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 编辑基本信息对话框 -->
    <EditProfileDialog 
      v-if="showEditBasicInfo" 
      :user="currentUser" 
      @close="showEditBasicInfo = false"
      @save="updateProfile"
    />
    
    <!-- 修改密码对话框 -->
    <div v-if="showChangePassword" class="dialog-overlay">
      <!-- 修改密码对话框内容 -->
      <!-- TODO: 实现修改密码对话框 -->
    </div>
    
    <!-- 绑定手机对话框 -->
    <div v-if="showBindPhone" class="dialog-overlay">
      <!-- 绑定手机对话框内容 -->
      <!-- TODO: 实现绑定手机对话框 -->
    </div>
    
    <!-- 注销账号对话框 -->
    <div v-if="showDeleteAccount" class="dialog-overlay">
      <!-- 注销账号对话框内容 -->
      <!-- TODO: 实现注销账号对话框 -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getCurrentUser } from '@/api/auth';
import EditProfileDialog from './EditProfileDialog.vue';

// 当前用户信息
const currentUser = ref(getCurrentUser() || {});

// 对话框显示状态
const showEditBasicInfo = ref(false);
const showChangePassword = ref(false);
const showBindPhone = ref(false);
const showDeleteAccount = ref(false);

// 是否为教师角色
const isTeacher = computed(() => {
  return currentUser.value.role === 'teacher';
});

// 用户角色文本
const userRoleText = computed(() => {
  return isTeacher.value ? '教师' : '学生';
});

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '未知';
  
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 手机号码脱敏
const maskPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

// 更新个人资料
const updateProfile = (profileData) => {
  // TODO: 调用API更新个人资料
  console.log('更新个人资料:', profileData);
  
  // 临时更新本地数据
  Object.assign(currentUser.value, profileData);
  localStorage.setItem('user', JSON.stringify(currentUser.value));
};
</script>

<style scoped>
.my-profile {
  padding: 1rem 0;
}

.profile-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  color: var(--text-color);
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-card {
  background-color: var(--background-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  padding: 1.5rem;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.profile-subtitle {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}

.profile-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.25rem;
}

.info-value {
  font-size: 1rem;
  color: var(--text-color);
}



.security-items {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border-color-light);
}

.security-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.security-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: var(--text-color);
}

.security-desc {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.edit-icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 0.25rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234299e1'%3E%3Cpath d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'/%3E%3C/svg%3E");
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  vertical-align: middle;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
  font-size: 0.875rem;
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

.btn-danger {
  background: none;
  border: 1px solid var(--error-color);
  color: var(--error-color);
}

.btn-danger:hover {
  background-color: var(--error-color-light);
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

@media (max-width: 768px) {
  .profile-info-grid {
    grid-template-columns: 1fr;
  }
}
</style> 