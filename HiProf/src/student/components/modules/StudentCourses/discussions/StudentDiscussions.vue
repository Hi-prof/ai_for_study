<template>
  <div class="student-discussions">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">课程讨论</h2>
        <p class="page-description">参与课程相关的讨论交流</p>
      </div>
    </div>

    <!-- 讨论列表 -->
    <div class="discussions-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载讨论列表中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="discussions.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <h3 class="empty-title">暂无讨论</h3>
        <p class="empty-description">老师还没有创建讨论，请稍后再来看看</p>
      </div>

      <!-- 讨论列表 -->
      <div v-else class="discussions-list">
        <div
          v-for="discussion in discussions"
          :key="discussion.id"
          class="discussion-card"
          @click="enterDiscussion(discussion)"
        >
          <div class="discussion-header">
            <div class="discussion-info">
              <h3 class="discussion-title">{{ discussion.name }}</h3>
              <p v-if="discussion.remark" class="discussion-description">
                {{ discussion.remark }}
              </p>
            </div>
            <div class="discussion-meta">
              <div class="member-count">
                <i class="users-icon">👥</i>
                <span>{{ discussion.memberCount || 0 }} 人</span>
              </div>
            </div>
          </div>

          <div class="discussion-footer">
            <div class="last-message">
              <span v-if="discussion.lastMessage" class="message-preview">
                {{ discussion.lastMessage }}
              </span>
              <span v-else class="no-message">暂无消息</span>
            </div>
            <div class="discussion-time">
              <span v-if="discussion.lastMessageTime">
                {{ formatTime(discussion.lastMessageTime) }}
              </span>
              <span v-else-if="discussion.createTime">
                {{ formatTime(discussion.createTime) }}
              </span>
            </div>
          </div>

          <!-- 未读消息提示 -->
          <div v-if="discussion.unreadCount > 0" class="unread-badge">
            {{ discussion.unreadCount > 99 ? '99+' : discussion.unreadCount }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getSessionListByCourse } from '@/api/session';

// 定义props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
});

const router = useRouter();

// 响应式数据
const loading = ref(false);
const discussions = ref([]);

// 组件挂载时加载数据
onMounted(() => {
  loadDiscussions();
});

// 加载讨论列表
const loadDiscussions = async () => {
  loading.value = true;
  try {
    console.log('加载课程讨论列表，课程ID:', props.courseId);
    
    const response = await getSessionListByCourse(props.courseId);
    console.log('讨论列表API响应:', response);

    if (response && response.code === 200) {
      if (response.rows && Array.isArray(response.rows)) {
        discussions.value = response.rows.map(session => ({
          id: session.id,
          name: session.name || '未命名讨论',
          remark: session.remark || '',
          memberCount: session.memberIds ? session.memberIds.length : 0,
          createTime: session.createTime,
          lastMessage: session.lastMessage || '',
          lastMessageTime: session.lastMessageTime || session.updateTime,
          unreadCount: session.unreadCount || 0,
          // 保留原始数据用于传递
          originalData: session
        }));
        
        console.log('讨论列表加载成功，数量:', discussions.value.length);
      } else if (response.data && Array.isArray(response.data.rows)) {
        // 兼容嵌套在data中的情况
        discussions.value = response.data.rows.map(session => ({
          id: session.id,
          name: session.name || '未命名讨论',
          remark: session.remark || '',
          memberCount: session.memberIds ? session.memberIds.length : 0,
          createTime: session.createTime,
          lastMessage: session.lastMessage || '',
          lastMessageTime: session.lastMessageTime || session.updateTime,
          unreadCount: session.unreadCount || 0,
          originalData: session
        }));
        
        console.log('讨论列表加载成功，数量:', discussions.value.length);
      } else {
        console.warn('API返回的数据格式异常:', response);
        discussions.value = [];
      }
    } else {
      console.warn('讨论列表响应异常:', response);
      discussions.value = [];
    }
  } catch (error) {
    console.error('加载讨论列表失败:', error);
    discussions.value = [];
  } finally {
    loading.value = false;
  }
};

// 进入讨论详情
const enterDiscussion = (discussion) => {
  console.log('进入讨论:', discussion);
  
  // 跳转到讨论详情页面
  router.push({
    name: 'student-discussion-detail',
    params: {
      courseId: props.courseId,
      sessionId: discussion.id
    },
    query: {
      discussionName: discussion.name
    }
  });
};

// 格式化时间显示
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  
  const date = new Date(timeStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // 今天
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffDays === 1) {
    // 昨天
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffDays < 7) {
    // 一周内
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()] + ' ' + date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else {
    // 超过一周
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    });
  }
};
</script>

<style scoped>
.student-discussions {
  padding: 24px;
  background: #f9fafb;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  max-width: 800px;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.page-description {
  margin: 0;
  font-size: 16px;
  color: #6b7280;
}

.discussions-content {
  max-width: 800px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-title {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: #374151;
}

.empty-description {
  margin: 0;
  font-size: 16px;
  max-width: 400px;
  line-height: 1.5;
}

.discussions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.discussion-card {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.discussion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #d1d5db;
}

.discussion-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.discussion-info {
  flex: 1;
  min-width: 0;
}

.discussion-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
}

.discussion-description {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.discussion-meta {
  display: flex;
  align-items: center;
  margin-left: 16px;
}

.member-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 6px 12px;
  border-radius: 20px;
}

.users-icon {
  font-size: 14px;
}

.discussion-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-message {
  flex: 1;
  min-width: 0;
}

.message-preview {
  font-size: 14px;
  color: #374151;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.no-message {
  font-size: 14px;
  color: #9ca3af;
  font-style: italic;
}

.discussion-time {
  margin-left: 16px;
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
}

.unread-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #ef4444;
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
  line-height: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .student-discussions {
    padding: 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .discussion-card {
    padding: 16px;
  }
  
  .discussion-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .discussion-meta {
    margin-left: 0;
    justify-content: flex-start;
  }
  
  .discussion-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .discussion-time {
    margin-left: 0;
    text-align: left;
  }
}
</style>
