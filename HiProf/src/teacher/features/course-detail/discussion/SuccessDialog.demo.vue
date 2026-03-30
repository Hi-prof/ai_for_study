<template>
  <div class="demo-container">
    <h2>成功对话框演示</h2>
    
    <div class="demo-section">
      <h3>测试按钮</h3>
      <div class="demo-buttons">
        <button class="btn btn-success" @click="showCreateSuccess">
          演示创建讨论成功
        </button>
        <button class="btn btn-danger" @click="showDeleteSuccess">
          演示删除会话成功
        </button>
        <button class="btn btn-warning" @click="showBatchDeleteSuccess">
          演示批量删除成功
        </button>
        <button class="btn btn-info" @click="showAutoCloseSuccess">
          演示自动关闭（3秒）
        </button>
      </div>
    </div>

    <div class="demo-section">
      <h3>当前状态</h3>
      <div class="status-info">
        <p><strong>对话框显示状态：</strong>{{ showDialog ? '显示中' : '隐藏' }}</p>
        <p><strong>标题：</strong>{{ dialogTitle }}</p>
        <p><strong>消息：</strong>{{ dialogMessage }}</p>
        <p><strong>详情：</strong>{{ dialogDetails }}</p>
      </div>
    </div>

    <!-- 成功提示对话框 -->
    <SuccessDialog
      :visible="showDialog"
      :title="dialogTitle"
      :message="dialogMessage"
      :details="dialogDetails"
      :auto-close="autoClose"
      :auto-close-delay="3000"
      @close="handleClose"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SuccessDialog from './SuccessDialog.vue';

// 响应式数据
const showDialog = ref(false);
const dialogTitle = ref('');
const dialogMessage = ref('');
const dialogDetails = ref('');
const autoClose = ref(false);

// 演示函数
const showCreateSuccess = () => {
  dialogTitle.value = '会话创建成功！';
  dialogMessage.value = '新的讨论会话已成功创建，您可以开始邀请成员参与讨论。';
  dialogDetails.value = '会话已添加到当前课程的讨论列表中，您可以在上方看到新创建的会话。';
  autoClose.value = false;
  showDialog.value = true;
};

const showDeleteSuccess = () => {
  dialogTitle.value = '删除成功！';
  dialogMessage.value = '会话"数学讨论组"已成功删除。';
  dialogDetails.value = '该会话及其所有消息已从系统中永久删除。';
  autoClose.value = false;
  showDialog.value = true;
};

const showBatchDeleteSuccess = () => {
  dialogTitle.value = '批量删除成功！';
  dialogMessage.value = '成功删除 3 个会话。';
  dialogDetails.value = '已删除的会话：数学讨论组、物理实验组、化学研究组';
  autoClose.value = false;
  showDialog.value = true;
};

const showAutoCloseSuccess = () => {
  dialogTitle.value = '操作成功！';
  dialogMessage.value = '此对话框将在3秒后自动关闭。';
  dialogDetails.value = '您也可以点击确定按钮手动关闭。';
  autoClose.value = true;
  showDialog.value = true;
};

// 事件处理
const handleClose = () => {
  showDialog.value = false;
  console.log('对话框已关闭');
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

.demo-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  text-decoration: none;
}

.btn-success {
  background-color: #059669;
  color: white;
  border-color: #059669;
}

.btn-success:hover {
  background-color: #047857;
  border-color: #047857;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
  border-color: #ef4444;
}

.btn-danger:hover {
  background-color: #dc2626;
  border-color: #dc2626;
}

.btn-warning {
  background-color: #f59e0b;
  color: white;
  border-color: #f59e0b;
}

.btn-warning:hover {
  background-color: #d97706;
  border-color: #d97706;
}

.btn-info {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn-info:hover {
  background-color: #2563eb;
  border-color: #2563eb;
}

.status-info {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
}

.status-info p {
  margin: 0.5rem 0;
  color: #374151;
  font-size: 0.875rem;
}

.status-info p:first-child {
  margin-top: 0;
}

.status-info p:last-child {
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .demo-container {
    margin: 1rem;
    padding: 1rem;
  }
  
  .demo-buttons {
    grid-template-columns: 1fr;
  }
  
  .demo-section {
    padding: 1rem;
  }
}
</style>
