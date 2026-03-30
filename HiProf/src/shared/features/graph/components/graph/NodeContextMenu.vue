<template>
  <div 
    v-if="visible" 
    class="node-context-menu"
    :style="{left: position.x + 'px', top: position.y + 'px'}"
  >
    <div class="menu-header">
      <span class="menu-title">{{ node?.text || '节点操作' }}</span>
      <button class="close-btn" @click="close">×</button>
    </div>
    <div class="menu-items">
      <div class="menu-item" @click="editNode">
        <i class="menu-icon">✏️</i>
        <span>编辑节点</span>
      </div>
      <div class="menu-item" @click="addChildNode">
        <i class="menu-icon">➕</i>
        <span>添加子节点</span>
      </div>
      <div class="menu-item" @click="deleteNode">
        <i class="menu-icon">🗑️</i>
        <span>删除节点</span>
      </div>
      <div class="menu-item" @click="setLearningStatus('not-started')">
        <i class="menu-icon">⚪</i>
        <span>标记为未学习</span>
      </div>
      <div class="menu-item" @click="setLearningStatus('in-progress')">
        <i class="menu-icon">🔵</i>
        <span>标记为学习中</span>
      </div>
      <div class="menu-item" @click="setLearningStatus('completed')">
        <i class="menu-icon">✅</i>
        <span>标记为已掌握</span>
      </div>
    </div>
  </div>
</template>

<script setup>

const props = defineProps({
  node: Object,
  visible: Boolean,
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  },
  userCanEdit: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'close',
  'edit',
  'add-child',
  'delete',
  'set-learning-status'
]);

const close = () => {
  emit('close');
};

const editNode = () => {
  if (props.userCanEdit) {
    emit('edit', props.node);
  }
  close();
};

const addChildNode = () => {
  if (props.userCanEdit) {
    emit('add-child', props.node);
  }
  close();
};

const deleteNode = () => {
  if (props.userCanEdit) {
    emit('delete', props.node);
  }
  close();
};

const setLearningStatus = (status) => {
  emit('set-learning-status', props.node, status);
  close();
};
</script>

<style scoped>
.node-context-menu {
  position: absolute;
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 200px;
  z-index: 1000;
  overflow: hidden;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--background-light);
  border-bottom: 1px solid var(--border-color);
}

.menu-title {
  font-weight: 600;
  font-size: var(--font-size-small);
  color: var(--text-color);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-medium);
  color: var(--text-light);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-items {
  padding: var(--spacing-xs) 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.menu-item:hover {
  background-color: var(--background-light);
}

.menu-icon {
  margin-right: var(--spacing-sm);
  font-size: var(--font-size-small);
}
</style> 