<template>
  <div class="course-discussion">
    <!-- 页面标题 -->
    <div class="section-header">
      <h2 class="section-title">讨论区</h2>
    </div>

    <!-- 讨论统计 -->
    <div class="discussion-stats">
      <div class="stat-card">
        <div class="stat-number">{{ discussionStats.totalTopics }}</div>
        <div class="stat-label">讨论话题</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ discussionStats.totalReplies }}</div>
        <div class="stat-label">回复数量</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ discussionStats.activeUsers }}</div>
        <div class="stat-label">活跃用户</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ discussionStats.todayPosts }}</div>
        <div class="stat-label">今日发帖</div>
      </div>
    </div>

    <!-- 会话列表部分 -->
    <div class="session-section">
      <div class="section-header">
        <h3 class="section-title">讨论会话</h3>
        <div class="section-actions">
          <button class="btn btn-primary btn-sm" @click="createNewSession">
            <i class="btn-icon plus-icon"></i>
            新建讨论
          </button>
          <button class="btn btn-secondary btn-sm" @click="refreshSessionList">
            <i class="btn-icon refresh-icon"></i>
            刷新
          </button>
          <button
            v-if="sessionList.length > 0"
            class="btn btn-outline btn-sm"
            @click="toggleSelectMode"
          >
            <i class="btn-icon" :class="isSelectMode ? 'close-icon' : 'select-icon'"></i>
            {{ isSelectMode ? '取消选择' : '批量删除' }}
          </button>
          <button
            v-if="isSelectMode && selectedSessions.length > 0"
            class="btn btn-danger btn-sm"
            @click="batchDeleteSessions"
          >
            <i class="btn-icon delete-icon"></i>
            删除选中 ({{ selectedSessions.length }})
          </button>
        </div>
      </div>

      <!-- 会话列表 -->
      <div v-if="sessionLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载会话列表...</p>
      </div>

      <div v-else-if="sessionList.length > 0" class="session-list">
        <div
          v-for="session in sessionList"
          :key="session.id"
          class="session-item"
          :class="{ 'selected': isSelectMode && selectedSessions.includes(session.id) }"
          @click="isSelectMode ? toggleSessionSelection(session.id) : viewSession(session)"
        >
          <div v-if="isSelectMode" class="session-checkbox" @click.stop="toggleSessionSelection(session.id)">
            <input
              type="checkbox"
              :checked="selectedSessions.includes(session.id)"
              @change="toggleSessionSelection(session.id)"
            />
          </div>
          <div class="session-info">
            <h4 class="session-name">{{ session.name || `会话 #${session.id}` }}</h4>
            <p class="session-remark" v-if="session.remark">{{ session.remark }}</p>
            <div class="session-meta">
              <span class="session-time">创建时间: {{ formatTime(session.createTime) }}</span>
              <span class="session-creator" v-if="session.createBy">创建者: {{ session.createBy }}</span>
            </div>
          </div>
          <div class="session-actions" v-if="!isSelectMode">
            <button class="btn btn-text btn-sm" @click.stop="editSession(session)">
              编辑
            </button>
            <button class="btn btn-text btn-sm text-danger" @click.stop="deleteSessionItem(session)">
              删除
            </button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon" aria-hidden="true">
          <WorkspaceIcon name="discussion" :size="34" />
        </div>
        <h3 class="empty-title">暂无会话</h3>
        <p class="empty-description">创建您的第一个讨论会话</p>
        <button class="btn btn-primary" @click="createNewSession">
          <i class="plus-icon"></i>
          新建讨论
        </button>
      </div>
    </div>

    <!-- 创建讨论模态框 -->
    <CreateSessionModal
      :visible="showCreateSessionModal"
      :course-id="courseId"
      @close="closeCreateSessionModal"
      @success="handleCreateSessionSuccess"
    />

    <!-- 删除会话模态框 -->
    <DeleteSessionModal
      :visible="showDeleteSessionModal"
      :sessions="deleteSessionData"
      :mode="deleteMode"
      @close="closeDeleteSessionModal"
      @success="handleDeleteSessionSuccess"
      @error="handleDeleteSessionError"
    />

    <!-- 编辑会话模态框 -->
    <EditSessionModal
      :visible="showEditSessionModal"
      :session="editSessionData"
      @close="closeEditSessionModal"
      @success="handleEditSessionSuccess"
      @error="handleEditSessionError"
    />

    <!-- 成功提示对话框 -->
    <SuccessDialog
      :visible="showSuccessDialog"
      :title="successDialogTitle"
      :message="successDialogMessage"
      :details="successDialogDetails"
      :show-navigate-button="false"
      @close="closeSuccessDialog"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getSessionListByCourse, getSessionList } from '@/api/session';
import { getStudentListByCourse, searchUsers } from '@/api/users';
import WorkspaceIcon from '@/ui/workspace/WorkspaceIcon.vue';
import CreateSessionModal from './CreateSessionModal.vue';
import DeleteSessionModal from './DeleteSessionModal.vue';
import EditSessionModal from './EditSessionModal.vue';
import SuccessDialog from './SuccessDialog.vue';

// 定义props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
});

// 定义emits
const emit = defineEmits(['refresh']);

// 路由实例
const router = useRouter();

// 响应式数据
const sessionList = ref([]);
const sessionLoading = ref(false);

// 批量删除相关数据
const selectedSessions = ref([]);
const isSelectMode = ref(false);

// 删除模态框相关数据
const showDeleteSessionModal = ref(false);
const deleteSessionData = ref(null);
const deleteMode = ref('single'); // 'single' | 'batch'

// 成功对话框相关数据
const showSuccessDialog = ref(false);
const successDialogTitle = ref('');
const successDialogMessage = ref('');
const successDialogDetails = ref('');

// 讨论统计
const discussionStats = ref({
  totalTopics: 0,
  totalReplies: 0,
  activeUsers: 0,
  todayPosts: 0
});

// 创建讨论相关数据
const showCreateSessionModal = ref(false);
const createSessionLoading = ref(false);
const newSessionForm = ref({
  name: '',
  remark: '',
  memberIds: []
});

// 成员选择相关数据
const availableMembers = ref([]);
const membersLoading = ref(false);
const memberSearchKeyword = ref('');

// 编辑会话相关数据
const showEditSessionModal = ref(false);
const editSessionData = ref(null);

// 计算属性
const isAllMembersSelected = computed(() => {
  return availableMembers.value.length > 0 &&
         newSessionForm.value.memberIds.length === availableMembers.value.length;
});

// 加载会话列表
const loadSessionList = async () => {
  if (!props.courseId) {
    console.warn('课程ID不存在，无法加载会话列表');
    return;
  }

  sessionLoading.value = true;
  try {
    console.log('正在加载课程会话列表，课程ID:', props.courseId);

    let response;

    try {
      // 首先尝试按课程ID获取会话列表
      response = await getSessionListByCourse(props.courseId);
      console.log('按课程ID获取会话列表成功:', response);
    } catch (error) {
      console.warn('按课程ID获取会话列表失败，尝试获取所有会话:', error);

      // 如果按课程ID获取失败，尝试获取所有会话然后过滤
      try {
        response = await getSessionList();
        console.log('获取所有会话成功，将在前端过滤:', response);
      } catch (allSessionsError) {
        console.error('获取所有会话也失败:', allSessionsError);
        throw allSessionsError;
      }
    }

    // 处理API响应
    if (response && typeof response === 'object') {
      let sessionData = [];
      let total = 0;

      // 检查不同的响应格式
      if (response.hasOwnProperty('rows') && response.hasOwnProperty('code')) {
        // TableDataInfo格式
        if (response.code === 0 || response.code === 200) {
          sessionData = response.rows || [];
          total = response.total || sessionData.length;
        } else {
          throw new Error(response.msg || '获取会话列表失败');
        }
      } else if (Array.isArray(response)) {
        // 直接数组格式
        sessionData = response;
        total = sessionData.length;
      } else if (response.data) {
        // 嵌套格式
        sessionData = Array.isArray(response.data) ? response.data : (response.data.rows || []);
        total = response.data.total || sessionData.length;
      } else {
        console.warn('未知的响应格式:', response);
        sessionData = [];
        total = 0;
      }

      // 如果获取的是所有会话，需要按课程ID过滤
      if (sessionData.length > 0) {
        // 尝试过滤与当前课程相关的会话
        const filteredSessions = sessionData.filter(session => {
          // 检查多种可能的课程ID字段
          return session.courseId == props.courseId ||
                 session.params?.courseId == props.courseId ||
                 (session.remark && session.remark.includes(`课程${props.courseId}`));
        });

        if (filteredSessions.length > 0) {
          sessionList.value = filteredSessions;
          console.log('过滤后的会话列表:', filteredSessions);
        } else {
          // 如果没有找到相关会话，显示所有会话（可能是数据结构不同）
          sessionList.value = sessionData;
          console.log('未找到课程相关会话，显示所有会话:', sessionData);
        }
      } else {
        sessionList.value = [];
      }

      // 更新讨论统计数据
      discussionStats.value = {
        totalTopics: sessionList.value.length,
        totalReplies: sessionList.value.reduce((sum, session) => sum + (session.replyCount || 0), 0),
        activeUsers: sessionList.value.reduce((sum, session) => sum + (session.memberCount || 0), 0),
        todayPosts: sessionList.value.filter(session => {
          if (!session.createTime) return false;
          const today = new Date().toDateString();
          const sessionDate = new Date(session.createTime).toDateString();
          return today === sessionDate;
        }).length
      };

      console.log('会话列表加载成功，共', sessionList.value.length, '个会话');
      console.log('统计数据:', discussionStats.value);

    } else {
      console.error('API响应为空或格式错误:', response);
      sessionList.value = [];
    }
  } catch (error) {
    console.error('加载会话列表时发生错误:', error);
    sessionList.value = [];

    // 显示用户友好的错误信息
    if (error.response?.status === 400) {
      console.warn('API参数错误，可能需要调整请求格式');
    } else if (error.response?.status === 404) {
      console.warn('API接口不存在，请检查接口地址');
    } else {
      console.warn('网络或服务器错误');
    }
  } finally {
    sessionLoading.value = false;
  }
};

// 刷新会话列表
const refreshSessionList = () => {
  console.log('刷新会话列表');
  loadSessionList();
};

// 格式化时间显示
const formatTime = (timeString) => {
  if (!timeString) return '未知时间';

  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) {
      return timeString; // 如果无法解析，返回原始字符串
    }

    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('时间格式化失败:', error);
    return timeString;
  }
};

// 创建新讨论
const createNewSession = () => {
  console.log('打开创建新讨论模态框');
  showCreateSessionModal.value = true;
};

// 关闭创建讨论模态框
const closeCreateSessionModal = () => {
  showCreateSessionModal.value = false;
};

// 处理创建讨论成功
const handleCreateSessionSuccess = async (response) => {
  console.log('会话创建成功，刷新列表:', response);

  // 刷新会话列表
  await loadSessionList();

  // 显示成功对话框
  successDialogTitle.value = '会话创建成功！';
  successDialogMessage.value = '新的讨论会话已成功创建，您可以开始邀请成员参与讨论。';
  successDialogDetails.value = '会话已添加到当前课程的讨论列表中，您可以在上方看到新创建的会话。';
  showSuccessDialog.value = true;
};

// 编辑会话 - 打开编辑模态框
const editSession = (session) => {
  console.log('编辑会话:', session);
  editSessionData.value = session;
  showEditSessionModal.value = true;
};

// 删除会话 - 打开删除确认模态框
const deleteSessionItem = (session) => {
  console.log('删除会话:', session);
  deleteSessionData.value = session;
  deleteMode.value = 'single';
  showDeleteSessionModal.value = true;
};

// 查看会话 - 跳转到讨论详情页面
const viewSession = (session) => {
  console.log('跳转到会话聊天:', session);
  router.push({
    name: 'discussion-detail',
    params: {
      courseId: props.courseId,
      sessionId: session.id
    }
  });
};

// 切换选择模式
const toggleSelectMode = () => {
  isSelectMode.value = !isSelectMode.value;
  if (!isSelectMode.value) {
    selectedSessions.value = [];
  }
};

// 切换会话选择状态
const toggleSessionSelection = (sessionId) => {
  const index = selectedSessions.value.indexOf(sessionId);
  if (index > -1) {
    selectedSessions.value.splice(index, 1);
  } else {
    selectedSessions.value.push(sessionId);
  }
};

// 批量删除会话 - 打开删除确认模态框
const batchDeleteSessions = () => {
  if (selectedSessions.value.length === 0) {
    alert('请先选择要删除的会话');
    return;
  }

  // 获取选中的会话对象
  const selectedSessionObjects = selectedSessions.value.map(id => {
    return sessionList.value.find(s => s.id === id);
  }).filter(Boolean);

  deleteSessionData.value = selectedSessionObjects;
  deleteMode.value = 'batch';
  showDeleteSessionModal.value = true;
};

// 关闭删除模态框
const closeDeleteSessionModal = () => {
  showDeleteSessionModal.value = false;
  deleteSessionData.value = null;
  deleteMode.value = 'single';
};

// 处理删除成功
const handleDeleteSessionSuccess = (result) => {
  console.log('删除会话成功:', result);

  // 从本地列表中移除删除的会话
  sessionList.value = sessionList.value.filter(session =>
    !result.sessionIds.includes(session.id)
  );

  // 更新统计数据
  discussionStats.value.totalTopics = sessionList.value.length;
  discussionStats.value.totalReplies = sessionList.value.reduce((sum, s) => sum + (s.replyCount || 0), 0);
  discussionStats.value.activeUsers = sessionList.value.reduce((sum, s) => sum + (s.memberCount || 0), 0);
  discussionStats.value.todayPosts = sessionList.value.filter(s => {
    if (!s.createTime) return false;
    const today = new Date().toDateString();
    const sessionDate = new Date(s.createTime).toDateString();
    return today === sessionDate;
  }).length;

  // 如果是批量删除，清空选择并退出选择模式
  if (result.mode === 'batch') {
    selectedSessions.value = [];
    isSelectMode.value = false;
  }

  // 关闭模态框
  closeDeleteSessionModal();

  // 显示成功对话框
  if (result.mode === 'batch') {
    successDialogTitle.value = '批量删除成功！';
    successDialogMessage.value = `成功删除 ${result.sessionNames.length} 个会话。`;
    successDialogDetails.value = `已删除的会话：${result.sessionNames.join('、')}`;
  } else {
    successDialogTitle.value = '删除成功！';
    successDialogMessage.value = `会话"${result.sessionNames[0]}"已成功删除。`;
    successDialogDetails.value = '该会话及其所有消息已从系统中永久删除。';
  }
  showSuccessDialog.value = true;
};

// 处理删除错误
const handleDeleteSessionError = (error) => {
  console.error('删除会话失败:', error);
  // 错误信息已经在模态框中显示，这里不需要额外处理
};

// 关闭编辑模态框
const closeEditSessionModal = () => {
  showEditSessionModal.value = false;
  editSessionData.value = null;
};

// 处理编辑成功
const handleEditSessionSuccess = (result) => {
  console.log('编辑会话成功:', result);

  // 更新本地列表中的会话数据
  const index = sessionList.value.findIndex(session => session.id === result.originalSession.id);
  if (index > -1) {
    // 合并更新的数据
    sessionList.value[index] = {
      ...sessionList.value[index],
      ...result.updatedSession
    };
  }

  // 关闭编辑模态框
  closeEditSessionModal();

  // 显示成功对话框
  successDialogTitle.value = '会话编辑成功！';
  successDialogMessage.value = `会话"${result.updatedSession.name}"的信息已成功更新。`;
  successDialogDetails.value = '会话的修改已保存，您可以在列表中看到更新后的信息。';
  showSuccessDialog.value = true;
};

// 处理编辑错误
const handleEditSessionError = (error) => {
  console.error('编辑会话失败:', error);
  // 错误信息已经在模态框中显示，这里不需要额外处理
};

// 关闭成功对话框
const closeSuccessDialog = () => {
  showSuccessDialog.value = false;
  successDialogTitle.value = '';
  successDialogMessage.value = '';
  successDialogDetails.value = '';
};

// 组件挂载时加载数据
onMounted(() => {
  console.log('CourseDiscussion组件已挂载，课程ID:', props.courseId);
  loadSessionList();
});
</script>

<style src="@/teacher/styles/course-discussion.css" scoped></style>
<style src="@/teacher/styles/course-discussion-modals.css" scoped></style>
