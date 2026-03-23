<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">创建新讨论</h3>
        <button type="button" class="modal-close" @click="closeModal">×</button>
      </div>
      
      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <!-- 讨论名称 -->
          <div class="form-group">
            <label for="sessionName" class="form-label">
              讨论名称 <span class="required">*</span>
            </label>
            <input
              id="sessionName"
              v-model="formData.name"
              type="text"
              class="form-input"
              placeholder="请输入讨论名称"
              required
            />
          </div>

          <!-- 成员选择 -->
          <div class="form-group">
            <label class="form-label">
              选择成员 <span class="required">*</span>
            </label>
            <div class="member-selection">
              <!-- 搜索框 -->
              <div class="search-box">
                <input
                  v-model="searchKeyword"
                  type="text"
                  class="form-input"
                  placeholder="搜索成员..."
                  @input="handleSearch"
                />
              </div>

              <!-- 成员列表 -->
              <div class="member-list">
                <!-- 全选选项 -->
                <div class="member-list-header">
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :checked="isAllSelected"
                      @change="toggleSelectAll"
                    />
                    全选 ({{ filteredMembers.length }}人)
                  </label>
                </div>

                <!-- 成员项 -->
                <div v-if="membersLoading" class="loading-members">
                  <div class="loading-spinner-small"></div>
                  正在加载成员列表...
                </div>
                
                <div v-else-if="filteredMembers.length === 0" class="no-members">
                  暂无成员数据
                </div>
                
                <div v-else class="member-items">
                  <div
                    v-for="member in filteredMembers"
                    :key="member.userId"
                    class="member-item"
                    @click="toggleMember(member.userId)"
                  >
                    <input
                      type="checkbox"
                      :checked="selectedMemberIds.includes(member.userId)"
                      @change="toggleMember(member.userId)"
                    />
                    <div class="member-info">
                      <div class="member-name">{{ member.userName || `用户${member.userId}` }}</div>
                      <div class="member-detail">
                        {{ member.memberRole === '0' ? '教师' : '学生' }} | ID: {{ member.userId }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 已选择统计 -->
                <div v-if="selectedMemberIds.length > 0" class="selected-count">
                  已选择 {{ selectedMemberIds.length }} 人
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="closeModal">
          取消
        </button>
        <button 
          type="button" 
          class="btn btn-primary" 
          @click="handleSubmit"
          :disabled="loading || !canSubmit"
        >
          <span v-if="loading">创建中...</span>
          <span v-else>创建讨论</span>
        </button>
      </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { getCourseMembers } from '@/api/coursemembers';
import { createSession } from '@/api/session';

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  courseId: {
    type: [String, Number],
    required: true
  }
});

// Emits
const emit = defineEmits(['close', 'success']);

// 响应式数据
const loading = ref(false);
const membersLoading = ref(false);
const searchKeyword = ref('');
const members = ref([]);
const selectedMemberIds = ref([]);

// 表单数据
const formData = ref({
  name: ''
});

// 计算属性
const filteredMembers = computed(() => {
  if (!searchKeyword.value) return members.value;
  
  const keyword = searchKeyword.value.toLowerCase();
  return members.value.filter(member => {
    const userName = member.userName || `用户${member.userId}`;
    return userName.toLowerCase().includes(keyword) ||
           member.userId.toString().includes(keyword);
  });
});

const isAllSelected = computed(() => {
  return filteredMembers.value.length > 0 && 
         filteredMembers.value.every(member => selectedMemberIds.value.includes(member.userId));
});

const canSubmit = computed(() => {
  return formData.value.name.trim() && selectedMemberIds.value.length > 0;
});

// 方法
const loadCourseMembers = async () => {
  if (!props.courseId) return;
  
  membersLoading.value = true;
  try {
    const params = {
      courseId: props.courseId
    };
    
    console.log('加载课程成员，参数:', params);
    const response = await getCourseMembers(params);
    console.log('课程成员响应:', response);
    
    if (response && response.rows) {
      members.value = response.rows;
      console.log('课程成员加载成功，共', members.value.length, '人');
    } else {
      console.warn('课程成员响应格式异常:', response);
      members.value = [];
    }
  } catch (error) {
    console.error('加载课程成员失败:', error);
    members.value = [];
  } finally {
    membersLoading.value = false;
  }
};

const toggleMember = (userId) => {
  const index = selectedMemberIds.value.indexOf(userId);
  if (index > -1) {
    selectedMemberIds.value.splice(index, 1);
  } else {
    selectedMemberIds.value.push(userId);
  }
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // 取消全选
    selectedMemberIds.value = selectedMemberIds.value.filter(
      id => !filteredMembers.value.some(member => member.userId === id)
    );
  } else {
    // 全选
    filteredMembers.value.forEach(member => {
      if (!selectedMemberIds.value.includes(member.userId)) {
        selectedMemberIds.value.push(member.userId);
      }
    });
  }
};

const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
};

const resetForm = () => {
  formData.value = {
    name: ''
  };
  selectedMemberIds.value = [];
  searchKeyword.value = '';
};

const closeModal = () => {
  resetForm();
  emit('close');
};

const handleOverlayClick = () => {
  closeModal();
};

const handleSubmit = async () => {
  if (!canSubmit.value) return;

  loading.value = true;
  try {
    const sessionData = {
      name: formData.value.name.trim(),
      memberIds: selectedMemberIds.value,
      courseId: props.courseId // 传递课程ID
    };

    console.log('创建讨论数据:', sessionData);
    const response = await createSession(sessionData);
    console.log('创建讨论成功:', response);

    emit('success', response);
    closeModal();
  } catch (error) {
    console.error('创建讨论失败:', error);
    alert('创建讨论失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 监听器
watch(() => props.visible, (newVal) => {
  if (newVal) {
    loadCourseMembers();
  }
});

// 生命周期
onMounted(() => {
  if (props.visible) {
    loadCourseMembers();
  }
});
</script>

<style src="@/teacher/styles/course-discussion-modals.css" scoped></style>
