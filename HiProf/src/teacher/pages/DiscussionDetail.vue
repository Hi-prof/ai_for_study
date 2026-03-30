<template>
  <div class="discussion-detail">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-button" @click="goBack">
          <i class="back-icon"></i>
          返回
        </button>
        <div class="page-title">
          <h2>{{ sessionInfo?.name || '讨论聊天' }}</h2>
          <p v-if="sessionInfo?.remark" class="session-remark">{{ sessionInfo.remark }}</p>
        </div>
      </div>
    </div>

    <!-- 聊天组件 -->
    <div class="chat-container">
      <ChatDiscussion 
        :courseId="courseId" 
        :sessionId="sessionId"
        @message-sent="handleMessageSent"
      />
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getSessionDetail } from '@/api/session';
import ChatDiscussion from '@/teacher/features/course-detail/discussion/ChatDiscussion.vue';

// 定义props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  },
  sessionId: {
    type: [String, Number],
    required: true
  }
});

// 路由实例
const router = useRouter();

// 响应式数据
const sessionInfo = ref(null);

// 方法
const goBack = () => {
  // 返回到课程详情页的讨论区
  router.push({
    name: 'teacher-course-detail',
    params: { courseId: props.courseId }
  });
};

const handleMessageSent = (message) => {
  console.log('消息已发送:', message);
  // 这里可以添加额外的处理逻辑
};


const loadSessionInfo = async () => {
  if (!props.sessionId) {
    console.warn('sessionId为空，无法加载会话信息');
    return;
  }

  try {
    console.log('开始加载会话信息...', props.sessionId);
    const response = await getSessionDetail(props.sessionId);
    console.log('会话信息API响应:', response);

    if (response && response.code === 200) {
      sessionInfo.value = response.data || response;
      console.log('会话信息加载成功:', sessionInfo.value);
    } else {
      console.warn('会话信息响应异常:', response);
      // 如果API失败，使用默认信息
      sessionInfo.value = {
        id: props.sessionId,
        name: `讨论会话 #${props.sessionId}`,
        remark: '会话信息加载失败',
        createBy: '未知',
        createTime: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('加载会话信息失败:', error);
    // 如果API调用失败，使用默认信息
    sessionInfo.value = {
      id: props.sessionId,
      name: `讨论会话 #${props.sessionId}`,
      remark: '会话信息加载失败',
      createBy: '未知',
      createTime: new Date().toISOString()
    };
  }
};

// 生命周期
onMounted(() => {
  loadSessionInfo();
});
</script>

<style src="@/teacher/styles/discussion-detail.css" scoped></style>
