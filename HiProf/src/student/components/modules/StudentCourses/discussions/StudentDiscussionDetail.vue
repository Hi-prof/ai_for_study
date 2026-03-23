<template>
  <div class="student-discussion-detail">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-button" @click="goBack">
          <i class="back-icon">←</i>
          返回
        </button>
        <div class="page-title">
          <h2>{{ discussionName || '课程讨论' }}</h2>
          <p v-if="sessionInfo?.remark" class="session-remark">{{ sessionInfo.remark }}</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="showSessionInfo" v-if="sessionInfo">
          <i class="info-icon">ℹ</i>
          讨论信息
        </button>
      </div>
    </div>

    <!-- 聊天组件 -->
    <div class="chat-container">
      <StudentChatDiscussion 
        :courseId="courseId" 
        :sessionId="sessionId"
        @message-sent="handleMessageSent"
      />
    </div>

    <!-- 讨论信息弹窗 -->
    <div v-if="showInfoModal" class="modal-overlay" @click="closeInfoModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>讨论信息</h3>
          <button class="close-button" @click="closeInfoModal">×</button>
        </div>
        <div class="modal-body">
          <div class="info-item">
            <label>讨论名称：</label>
            <span>{{ sessionInfo?.name || '未命名讨论' }}</span>
          </div>
          <div class="info-item" v-if="sessionInfo?.remark">
            <label>讨论描述：</label>
            <span>{{ sessionInfo.remark }}</span>
          </div>
          <div class="info-item">
            <label>创建时间：</label>
            <span>{{ formatDateTime(sessionInfo?.createTime) }}</span>
          </div>
          <div class="info-item" v-if="sessionInfo?.memberIds">
            <label>参与人数：</label>
            <span>{{ sessionInfo.memberIds.length }} 人</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getSessionDetail } from '@/api/session';
import StudentChatDiscussion from './StudentChatDiscussion.vue';

const route = useRoute();
const router = useRouter();

// 路由参数
const courseId = computed(() => route.params.courseId);
const sessionId = computed(() => route.params.sessionId);
const discussionName = computed(() => route.query.discussionName || '');

// 响应式数据
const sessionInfo = ref(null);
const loading = ref(false);
const showInfoModal = ref(false);

// 组件挂载时加载数据
onMounted(() => {
  loadSessionInfo();
});

// 加载会话信息
const loadSessionInfo = async () => {
  if (!sessionId.value) return;
  
  loading.value = true;
  try {
    console.log('加载讨论信息，会话ID:', sessionId.value);
    
    const response = await getSessionDetail(sessionId.value);
    console.log('讨论信息API响应:', response);

    if (response && response.code === 200) {
      sessionInfo.value = response.data || response;
      console.log('讨论信息加载成功:', sessionInfo.value);
    } else {
      console.warn('讨论信息响应异常:', response);
    }
  } catch (error) {
    console.error('加载讨论信息失败:', error);
  } finally {
    loading.value = false;
  }
};

// 返回上一页
const goBack = () => {
  // 优先返回到课程讨论列表
  if (courseId.value) {
    router.push({
      name: 'student-course-detail',
      params: { courseId: courseId.value },
      query: { tab: 'discussions' }
    });
  } else {
    // 如果没有课程ID，使用浏览器后退
    router.go(-1);
  }
};

// 显示会话信息
const showSessionInfo = () => {
  showInfoModal.value = true;
};

// 关闭信息弹窗
const closeInfoModal = () => {
  showInfoModal.value = false;
};

// 处理消息发送事件
const handleMessageSent = () => {
  console.log('消息发送成功');
  // 可以在这里添加一些额外的处理逻辑
};

// 格式化日期时间
const formatDateTime = (timeStr) => {
  if (!timeStr) return '未知';
  
  const date = new Date(timeStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
.student-discussion-detail {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f9fafb;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-button:hover {
  background: #e5e7eb;
}

.back-icon {
  font-size: 16px;
  font-style: normal;
}

.page-title h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.session-remark {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.info-icon {
  font-size: 14px;
  font-style: normal;
}

.chat-container {
  flex: 1;
  margin: 24px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  color: #6b7280;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.close-button:hover {
  background: #e5e7eb;
}

.modal-body {
  padding: 24px;
}

.info-item {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-start;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item label {
  font-weight: 600;
  color: #374151;
  min-width: 100px;
  margin-right: 12px;
}

.info-item span {
  color: #6b7280;
  line-height: 1.5;
  word-break: break-word;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 12px 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .header-left {
    gap: 12px;
  }
  
  .page-title h2 {
    font-size: 18px;
  }
  
  .header-actions {
    justify-content: flex-end;
  }
  
  .chat-container {
    margin: 16px;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .modal-header {
    padding: 16px 20px;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .info-item {
    flex-direction: column;
    gap: 4px;
  }
  
  .info-item label {
    min-width: auto;
    margin-right: 0;
  }
}
</style>
