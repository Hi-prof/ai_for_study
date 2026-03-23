<template>
  <!-- 创建课程对话框 -->
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <!-- 对话框头部 -->
      <div class="dialog-header">
        <h3 class="dialog-title">{{ dialogTitle }}</h3>
        <button class="close-btn" @click="handleClose" :disabled="loading">
          <i class="close-icon">×</i>
        </button>
      </div>

      <!-- 对话框内容 -->
      <div class="dialog-content">
        <!-- 创建确认模式内容 -->
        <div v-if="mode === 'confirm'" class="confirm-content">
          <div class="form-group">
            <label class="form-label">课程名称 *</label>
            <input
              v-model="formData.name"
              type="text"
              class="form-input"
              placeholder="请输入课程名称"
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label class="form-label">课程描述</label>
            <textarea
              v-model="formData.description"
              class="form-textarea"
              placeholder="请输入课程描述"
              rows="3"
              :disabled="loading"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">选择学院 *</label>
            <div class="department-selection">
              <select
                v-model="formData.collegeId"
                class="form-select"
                :disabled="loading || collegesLoading"
                @change="onCollegeChange"
              >
                <option value="">请选择学院</option>
                <option
                  v-for="college in colleges"
                  :key="college.deptId"
                  :value="college.deptId"
                >
                  {{ college.deptName }}
                </option>
              </select>
              <div v-if="collegesLoading" class="loading-text">正在加载学院列表...</div>
              <div v-else-if="colleges.length === 0" class="no-departments-text">
                暂无可用学院，请联系管理员
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">选择专业 *</label>
            <div class="class-selection">
              <div class="existing-class-selection">
                <select
                  v-model="formData.majorId"
                  class="form-select"
                  :disabled="loading || majorsLoading || !formData.collegeId"
                >
                  <option value="">{{ !formData.collegeId ? '请先选择学院' : '请选择专业' }}</option>
                  <option
                    v-for="majorItem in majors"
                    :key="majorItem.deptId"
                    :value="majorItem.deptId"
                  >
                    {{ majorItem.deptName }}
                  </option>
                </select>
                <div v-if="majorsLoading" class="loading-text">正在加载专业列表...</div>
                <div v-else-if="formData.collegeId && majors.length === 0" class="no-classes-text">
                  该学院下暂无可用专业，请联系管理员维护专业数据
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">班级名称 *</label>
            <input
              v-model="formData.className"
              type="text"
              class="form-input"
              placeholder="请输入班级名称，如 2024级计算机1班"
              :disabled="loading"
            />
          </div>

          <!-- 创建进度 -->
          <div v-if="loading" class="progress-section">
            <div class="progress-header">
              <span class="progress-text">{{ progressText }}</span>
              <span class="progress-percentage">{{ Math.round(progress) }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
            </div>
          </div>
        </div>

        <!-- 成功提示模式内容 -->
        <div v-else-if="mode === 'success'" class="success-content">
          <div class="success-icon-container">
            <i class="success-icon">✅</i>
          </div>
          <div class="success-message">
            <h4 class="success-title">{{ successTitle || '课程创建成功！' }}</h4>
            <p class="success-description">{{ successMessage }}</p>
          </div>
          <div v-if="successDetails" class="success-details">
            <p>{{ successDetails }}</p>
          </div>
        </div>
      </div>

      <!-- 对话框底部 -->
      <div class="dialog-footer">
        <!-- 创建确认模式按钮 -->
        <template v-if="mode === 'confirm'">
          <button
            class="btn btn-secondary"
            @click="handleClose"
            :disabled="loading"
          >
            {{ loading ? '创建中...' : '取消' }}
          </button>
          <button
            class="btn btn-primary"
            @click="handleConfirm"
            :disabled="loading || !isFormValid"
          >
            <i v-if="loading" class="loading-icon"></i>
            <i v-else class="create-icon">➕</i>
            {{ loading ? '创建中...' : '确认创建' }}
          </button>
        </template>

        <!-- 成功提示模式按钮 -->
        <template v-else-if="mode === 'success'">
          <button
            class="btn btn-secondary"
            @click="handleClose"
          >
            确定
          </button>
          <button
            v-if="showNavigateButton"
            class="btn btn-primary"
            @click="handleNavigate"
          >
            <i class="navigate-icon">📚</i>
            {{ navigateButtonText || '查看课程' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from 'vue';
import { getDepartmentsList, getMajorsList } from '@/api/class';
import { getCurrentUser } from '@/api/auth';

// 定义组件属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'confirm', // 'confirm' | 'success'
    validator: (value) => ['confirm', 'success'].includes(value)
  },
  // 进度相关属性
  progress: {
    type: Number,
    default: 0
  },
  progressText: {
    type: String,
    default: '正在创建课程...'
  },
  // 成功模式相关属性
  successTitle: {
    type: String,
    default: ''
  },
  successMessage: {
    type: String,
    default: ''
  },
  successDetails: {
    type: String,
    default: ''
  },
  showNavigateButton: {
    type: Boolean,
    default: true
  },
  navigateButtonText: {
    type: String,
    default: '查看课程'
  }
});

// 定义组件事件
const emit = defineEmits(['update:visible', 'confirm', 'cancel', 'navigate']);

// 当前用户信息
const currentUser = ref(getCurrentUser() || {});

// 表单数据
const formData = ref({
  name: '',
  description: '',
  collegeId: '',
  majorId: '',
  className: '',
  teacherId: 0,
  tpId: 0
});

// 加载状态
const loading = ref(false);
const collegesLoading = ref(false);
const majorsLoading = ref(false);

// 数据列表
const colleges = ref([]);
const majors = ref([]);

// 计算属性
const dialogTitle = computed(() => {
  if (props.mode === 'success') {
    return props.successTitle || '创建成功';
  }
  return '创建新课程';
});

const isFormValid = computed(() => {
  return formData.value.name.trim() &&
         formData.value.collegeId &&
         formData.value.majorId &&
         formData.value.className.trim();
});

// 监听对话框显示状态
watch(() => props.visible, (newVal) => {
  if (newVal && props.mode === 'confirm') {
    resetForm();
    loadColleges();
  }
});

// 重置表单
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    collegeId: '',
    majorId: '',
    className: '',
    teacherId: currentUser.value.id || 0,
    tpId: 0
  };
  majors.value = [];
};

// 加载学院列表
const loadColleges = async () => {
  collegesLoading.value = true;
  try {
    const response = await getDepartmentsList();

    // 检查多种可能的数据结构
    let departmentData = [];
    if (response && response.rows && Array.isArray(response.rows)) {
      departmentData = response.rows;
    } else if (response && response.data && Array.isArray(response.data)) {
      departmentData = response.data;
    } else if (Array.isArray(response)) {
      departmentData = response;
    }

    if (departmentData.length > 0) {
      colleges.value = departmentData.map(dept => ({
        deptId: dept.deptId,
        deptName: dept.deptName || '未命名学院'
      }));
    } else {
      colleges.value = [];
    }
  } catch (error) {
    colleges.value = [];
  } finally {
    collegesLoading.value = false;
  }
};

// 加载专业列表
const loadMajors = async (collegeId) => {
  if (!collegeId) {
    majors.value = [];
    return;
  }

  majorsLoading.value = true;
  try {
    const response = await getMajorsList(collegeId);

    // 检查多种可能的数据结构
    let majorData = [];
    if (response && response.rows && Array.isArray(response.rows)) {
      majorData = response.rows;
    } else if (response && response.data && Array.isArray(response.data)) {
      majorData = response.data;
    } else if (Array.isArray(response)) {
      majorData = response;
    }

    if (majorData.length > 0) {
      majors.value = majorData.map(majorItem => ({
        deptId: majorItem.deptId,
        deptName: majorItem.deptName || '未命名专业'
      }));
    } else {
      majors.value = [];
    }
  } catch (error) {
    majors.value = [];
  } finally {
    majorsLoading.value = false;
  }
};

// 处理学院变化
const onCollegeChange = async () => {
  formData.value.majorId = '';
  if (formData.value.collegeId) {
    await loadMajors(formData.value.collegeId);
  } else {
    majors.value = [];
  }
};

// 处理遮罩层点击
const handleOverlayClick = () => {
  if (!loading.value) {
    handleClose();
  }
};

// 处理关闭
const handleClose = () => {
  if (!loading.value) {
    emit('update:visible', false);
    emit('cancel');
  }
};

// 处理导航
const handleNavigate = () => {
  emit('navigate');
  handleClose();
};

// 处理确认
const handleConfirm = () => {
  // 验证表单
  if (!isFormValid.value) {
    if (!formData.value.name.trim()) {
      alert('请输入课程名称');
      return;
    }
    if (!formData.value.collegeId) {
      alert('请选择一个学院');
      return;
    }
    if (!formData.value.majorId) {
      alert('请选择一个专业');
      return;
    }
    if (!formData.value.className.trim()) {
      alert('请输入班级名称');
      return;
    }
  }

  const selectedCollege = colleges.value.find(item => item.deptId === Number(formData.value.collegeId));
  const selectedMajor = majors.value.find(item => item.deptId === Number(formData.value.majorId));

  // 构造课程数据
  const courseData = {
    name: formData.value.name,
    description: formData.value.description,
    majorId: parseInt(formData.value.majorId, 10),
    className: formData.value.className.trim(),
    teacherId: formData.value.teacherId,
    tpId: formData.value.tpId,
    createBy: currentUser.value.username || '',
    updateBy: currentUser.value.username || '',
    params: {
      collegeId: parseInt(formData.value.collegeId, 10),
      collegeName: selectedCollege?.deptName || '',
      majorName: selectedMajor?.deptName || ''
    }
  };

  // 触发确认事件，将数据传递给父组件处理
  emit('confirm', courseData);
};
</script>

<style scoped>
@import '@/teacher/styles/create-course.css';

/* 创建课程对话框特定样式 */
.confirm-content {
  padding: 0;
}


</style>
