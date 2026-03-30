<template>
  <div class="course-materials">
    <!-- 使用新的课程资料管理器组件 -->
    <MaterialsManager
      :course-id="courseId"
      @refresh="handleRefresh"
    />
  </div>
</template>

<script setup>
import MaterialsManager from './materials/MaterialsManager.vue';

// 定义props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
});

// 定义emits
const emit = defineEmits(['refresh']);

// 处理刷新事件
const handleRefresh = () => {
  console.log('课程资料已刷新');
  emit('refresh');
};


</script>

<style scoped>
/* 课程资料容器样式 - 使用新的组件化架构 */
.course-materials {
  /* 所有样式由子组件处理 */
}


</style>