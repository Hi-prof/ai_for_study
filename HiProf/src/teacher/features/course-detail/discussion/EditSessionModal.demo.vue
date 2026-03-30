<template>
  <div class="demo-container">
    <h2>编辑会话模态框演示</h2>
    
    <div class="demo-section">
      <h3>测试数据</h3>
      <div class="test-data">
        <h4>测试会话:</h4>
        <pre>{{ JSON.stringify(testSession, null, 2) }}</pre>
      </div>
    </div>

    <div class="demo-section">
      <h3>测试按钮</h3>
      <div class="demo-buttons">
        <button class="btn btn-primary" @click="openEditModal">
          打开编辑模态框
        </button>
        <button class="btn btn-secondary" @click="resetTestData">
          重置测试数据
        </button>
      </div>
    </div>

    <div class="demo-section">
      <h3>操作结果</h3>
      <div class="demo-results">
        <div v-if="lastResult" class="result-item">
          <h4>最后一次编辑结果:</h4>
          <pre>{{ JSON.stringify(lastResult, null, 2) }}</pre>
        </div>
        <div v-if="lastError" class="error-item">
          <h4>最后一次错误:</h4>
          <pre>{{ JSON.stringify(lastError, null, 2) }}</pre>
        </div>
        <div v-if="!lastResult && !lastError" class="no-result">
          暂无操作结果
        </div>
      </div>
    </div>

    <!-- 编辑会话模态框 -->
    <EditSessionModal
      :visible="showModal"
      :session="testSession"
      @close="handleClose"
      @success="handleSuccess"
      @error="handleError"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import EditSessionModal from './EditSessionModal.vue';

// 测试数据
const testSession = ref({
  id: 1,
  name: '数学讨论组',
  createTime: '2024-01-15T10:30:00',
  createBy: '张老师',
  updateTime: '2024-01-16T14:20:00',
  updateBy: '李老师',
  params: {
    courseId: 101,
    memberCount: 25
  }
});

// 响应式数据
const showModal = ref(false);
const lastResult = ref(null);
const lastError = ref(null);

// 测试函数
const openEditModal = () => {
  console.log('打开编辑模态框');
  showModal.value = true;
  lastResult.value = null;
  lastError.value = null;
};

const resetTestData = () => {
  console.log('重置测试数据');
  testSession.value = {
    id: 1,
    name: '数学讨论组',
    createTime: '2024-01-15T10:30:00',
    createBy: '张老师',
    updateTime: '2024-01-16T14:20:00',
    updateBy: '李老师',
    params: {
      courseId: 101,
      memberCount: 25
    }
  };
  lastResult.value = null;
  lastError.value = null;
};

// 事件处理
const handleClose = () => {
  console.log('模态框关闭');
  showModal.value = false;
};

const handleSuccess = (result) => {
  console.log('编辑成功:', result);
  lastResult.value = result;
  lastError.value = null;
  showModal.value = false;
  
  // 模拟更新测试数据
  testSession.value = {
    ...testSession.value,
    ...result.updatedSession
  };
};

const handleError = (error) => {
  console.log('编辑失败:', error);
  lastError.value = error;
  lastResult.value = null;
};
</script>

<style scoped>
.demo-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.demo-container h2 {
  color: #1f2937;
  margin: 0 0 2rem 0;
  text-align: center;
}

.demo-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.demo-section h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
}

.demo-section h4 {
  margin: 1rem 0 0.5rem 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 500;
}

.test-data pre {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.demo-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-primary {
  background-color: #6366f1;
  color: white;
  border-color: #6366f1;
}

.btn-primary:hover {
  background-color: #4f46e5;
  border-color: #4f46e5;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.demo-results {
  min-height: 100px;
}

.result-item {
  padding: 1rem;
  background-color: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
}

.error-item {
  padding: 1rem;
  background-color: #fef2f2;
  border: 1px solid #ef4444;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
}

.no-result {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

.result-item pre,
.error-item pre {
  background-color: transparent;
  border: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
  font-size: 0.8125rem;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .demo-container {
    margin: 1rem;
    padding: 1rem;
  }
  
  .demo-buttons {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .demo-section {
    padding: 1rem;
  }
}
</style>
