<template>
  <div class="homework-discussion-panel">
    <!-- 作业与讨论模块网格 -->
    <div class="homework-modules-grid">
      <div class="module-card homework-card" @click="handleHomeworkManagement">
        <div class="module-header">
          <div class="module-icon homework-icon">
            <i class="icon-assignment"></i>
          </div>
        </div>
        <div class="module-content">
          <h3 class="module-title">作业管理</h3>
          <p class="module-desc">发布作业、批改作业、查看提交进度和成绩统计</p>
        </div>
        <div class="module-footer">
          <button class="module-btn btn-blue">管理作业</button>
        </div>
      </div>
      
      <div class="module-card discussion-card" @click="handleDiscussionManagement">
        <div class="module-header">
          <div class="module-icon discussion-icon">
            <i class="icon-chat"></i>
          </div>
        </div>
        <div class="module-content">
          <h3 class="module-title">讨论管理</h3>
          <p class="module-desc">创建讨论话题、管理学生回复、维护讨论秩序</p>
        </div>
        <div class="module-footer">
          <button class="module-btn btn-green">管理讨论</button>
        </div>
      </div>
      
      <div class="module-card analysis-card" @click="handleLearningAnalysis">
        <div class="module-header">
          <div class="module-icon analysis-icon">
            <i class="icon-analytics"></i>
          </div>
        </div>
        <div class="module-content">
          <h3 class="module-title">学习分析</h3>
          <p class="module-desc">分析学生学习数据、生成学习报告和改进建议</p>
        </div>
        <div class="module-footer">
          <button class="module-btn btn-purple">查看分析</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 导入样式文件
import '@/teacher/styles/teacher-homework-discussion.css';

// 作业与讨论模块处理方法
const handleHomeworkManagement = () => {
  console.log('管理作业');
  // TODO: 跳转到作业管理页面
};

const handleDiscussionManagement = () => {
  console.log('管理讨论');
  // TODO: 跳转到讨论管理页面
};

const handleLearningAnalysis = () => {
  console.log('查看分析');
  // TODO: 跳转到学习分析页面
};
</script>


