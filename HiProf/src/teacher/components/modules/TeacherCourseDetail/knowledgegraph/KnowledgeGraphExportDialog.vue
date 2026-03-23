<template>
  <div v-if="isVisible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <!-- 对话框头部 -->
      <div class="dialog-header">
        <h3 class="dialog-title">{{ title }}</h3>
        <button class="close-btn" @click="closeDialog" :disabled="isLoading">
          <i class="close-icon">×</i>
        </button>
      </div>

      <!-- 对话框内容 -->
      <div class="dialog-content">
        <!-- 创建确认模式内容 -->
        <div v-if="mode === 'confirm'" class="confirm-content">
          <div class="export-info">
            <div class="info-item">
              <i class="info-icon">🧠</i>
              <span class="info-text">即将创建包含 {{ nodeCount }} 个知识节点的知识图谱</span>
            </div>
            <div class="info-item">
              <i class="info-icon">📚</i>
              <span class="info-text">目标课程：{{ courseName || '当前课程' }}</span>
            </div>
          </div>

          <!-- 知识图谱配置选项 -->
          <div class="option-section">
            <div class="form-group">
              <label class="form-label">知识图谱名称</label>
              <input
                type="text"
                v-model="graphName"
                :disabled="true"
                class="form-input"
                placeholder="将使用课程名称作为知识图谱名称"
                readonly
              >
            </div>

            <!-- 描述信息已注释掉，知识图谱将使用默认描述 -->
            <!--
            <div class="form-group">
              <label class="form-label">描述信息（可选）</label>
              <textarea
                v-model="graphDescription"
                :disabled="isLoading"
                class="form-textarea"
                rows="3"
                placeholder="请输入知识图谱的描述信息"
              ></textarea>
            </div>
            -->

            <div class="option-item">
              <label class="checkbox-container">
                <input 
                  type="checkbox" 
                  v-model="replaceExisting" 
                  :disabled="isLoading"
                  class="checkbox-input"
                >
                <span class="checkbox-mark"></span>
                <span class="checkbox-label">替换现有知识图谱</span>
              </label>
              <p class="option-description">
                勾选此项将替换课程中现有的同名知识图谱。
                <span class="warning-text">此操作不可撤销，请谨慎选择。</span>
              </p>
            </div>
          </div>
        </div>

        <!-- 成功提示模式内容 -->
        <div v-else-if="mode === 'success'" class="success-content">
          <div class="success-icon-container">
            <i class="success-icon">✅</i>
          </div>
          <div class="success-message">
            <h4 class="success-title">{{ successTitle || '创建成功！' }}</h4>
            <p class="success-description">{{ successMessage }}</p>
          </div>
          <div v-if="successDetails" class="success-details">
            <p>{{ successDetails }}</p>
          </div>
        </div>

        <!-- 创建进度 -->
        <div v-if="isLoading && mode === 'confirm'" class="progress-section">
          <div class="progress-header">
            <span class="progress-text">{{ progressText }}</span>
            <span class="progress-percentage">{{ Math.round(progress) }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>
      </div>

      <!-- 对话框底部 -->
      <div class="dialog-footer">
        <!-- 创建确认模式按钮 -->
        <template v-if="mode === 'confirm'">
          <button 
            class="btn btn-secondary" 
            @click="closeDialog"
            :disabled="isLoading"
          >
            {{ isLoading ? '创建中...' : '取消' }}
          </button>
          <button
            class="btn btn-primary"
            @click="confirmCreate"
            :disabled="isLoading"
          >
            <i v-if="isLoading" class="loading-icon"></i>
            <i v-else class="create-icon">🧠</i>
            {{ isLoading ? '创建中...' : '确认创建' }}
          </button>
        </template>

        <!-- 成功提示模式按钮 -->
        <template v-else-if="mode === 'success'">
          <button 
            class="btn btn-secondary" 
            @click="closeDialog"
          >
            关闭
          </button>
          <button 
            v-if="showNavigateButton"
            class="btn btn-primary" 
            @click="navigateToGraph"
          >
            <i class="navigate-icon">🔗</i>
            查看知识图谱
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

// 定义props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'confirm', // 'confirm' | 'success'
    validator: (value) => ['confirm', 'success'].includes(value)
  },
  nodeCount: {
    type: Number,
    default: 0
  },
  courseName: {
    type: String,
    default: ''
  },
  progress: {
    type: Number,
    default: 0
  },
  progressText: {
    type: String,
    default: ''
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  // 成功模式相关props
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
    default: false
  }
});

// 定义emits
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel', 'navigate']);

// 响应式数据
const graphName = ref('');
// const graphDescription = ref(''); // 已注释掉，不再需要描述信息
const replaceExisting = ref(false);

// 计算属性
const isVisible = computed(() => props.modelValue);

const title = computed(() => {
  if (props.mode === 'success') {
    return props.successTitle || '创建完成';
  }
  return '创建知识图谱确认';
});

// 监听课程名称变化，自动设置图谱名称为课程名称
watch(() => props.courseName, (newCourseName) => {
  if (newCourseName) {
    graphName.value = newCourseName; // 直接使用课程名称，不添加后缀
  }
}, { immediate: true });

// 方法
const closeDialog = () => {
  emit('update:modelValue', false);
  emit('cancel');
};

const handleOverlayClick = () => {
  if (!props.isLoading) {
    closeDialog();
  }
};

const confirmCreate = () => {
  console.log('confirmCreate 被调用');
  console.log('graphName.value:', graphName.value);
  console.log('props.courseName:', props.courseName);
  console.log('props.isLoading:', props.isLoading);

  const options = {
    name: graphName.value.trim() || props.courseName || '知识图谱', // 提供多层后备名称
    // description: graphDescription.value.trim(), // 已注释掉，不再传递描述信息
    replaceExisting: replaceExisting.value
  };

  console.log('发送的选项:', options);
  emit('confirm', options);
};

const navigateToGraph = () => {
  emit('navigate');
};

// 重置表单数据
const resetForm = () => {
  graphName.value = props.courseName || ''; // 直接使用课程名称
  // graphDescription.value = ''; // 已注释掉，不再需要重置描述信息
  replaceExisting.value = false;
};

// 监听对话框显示状态，重置表单
watch(isVisible, (visible) => {
  if (visible && props.mode === 'confirm') {
    resetForm();
  }
});
</script>

<style scoped>
@import '@/teacher/styles/export-confirm-dialog.css';

/* 知识图谱特定样式 */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input:disabled,
.form-textarea:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.create-icon {
  font-size: 1rem;
}

.navigate-icon {
  font-size: 1rem;
}
</style>
