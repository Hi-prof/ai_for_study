<template>
  <div class="node-item" :class="['level-' + level, {'search-result': node.isSearchResult}]">
    <div class="node-header" @click="$emit('toggle', node.id)">
      <span class="node-toggle" :class="{ expanded: node.expanded }" v-if="hasChildren">
        {{ node.expanded ? '▼' : '▶' }}
      </span>
      <span class="node-marker" v-else-if="level > 1">•</span>
      <span class="node-title">{{ node.name }}</span>
      <div class="node-actions" @click.stop v-if="editable">
        <button class="action-btn edit-btn" @click="$emit('edit', node)" title="修改节点">
          <i class="fas fa-edit"></i>编辑
        </button>
        <button class="action-btn add-btn" @click="$emit('add-child', node)" title="添加子节点">
          <i class="fas fa-plus"></i>添加
        </button>
        <button class="action-btn delete-btn" @click="$emit('delete', node)" title="删除节点">
          <i class="fas fa-trash"></i>删除
        </button>
      </div>
    </div>
    
    <div v-if="node.content" class="node-content-block" :class="{'child-content': level > 1}">
      {{ node.content }}
    </div>
    
    <div v-if="node.expanded && node.children && node.children.length > 0" class="node-children">
      <OutlineNodeItem
        v-for="childNode in node.children"
        :key="childNode.id"
        :node="childNode"
        :level="level + 1"
        :editable="editable"
        @toggle="$emit('toggle', $event)"
        @edit="$emit('edit', $event)"
        @add-child="$emit('add-child', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
    
    <div v-else-if="node.expanded && (!node.children || node.children.length === 0)" class="empty-children">
      <span>无子节点</span>
    </div>
  </div>
</template>

<script setup>
import { defineOptions } from 'vue';
import { computed } from 'vue';

defineOptions({
  name: 'OutlineNodeItem'
});

const props = defineProps({
  node: Object,
  level: {
    type: Number,
    default: 1
  },
  editable: {
    type: Boolean,
    default: false
  }
});

const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0;
});
</script>

<style scoped>
.node-item {
  margin-bottom: 0.5rem;
}

.node-item.search-result > .node-header {
  background-color: rgba(64, 158, 255, 0.1);
  border-left: 3px solid #409eff;
}

.node-header {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.node-header:hover {
  background-color: #f5f5f5;
}

.node-toggle {
  margin-right: 0.5rem;
  width: 16px;
  height: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  color: #666;
}

.node-title {
  font-weight: 500;
  color: #333;
  flex-grow: 1;
}

.node-marker {
  margin-right: 0.5rem;
  color: #666;
  width: 16px;
  display: inline-block;
  text-align: center;
}

.node-children {
  padding-left: 1rem;
  margin-top: 0.25rem;
}

.level-1 > .node-header {
  background-color: rgba(0, 0, 0, 0.03);
}

.level-2 .node-title {
  font-weight: normal;
}

.level-3 .node-title,
.level-4 .node-title,
.level-5 .node-title {
  font-weight: normal;
  font-size: 0.95em;
}

.level-3 {
  margin-left: 0.5rem;
}

.level-4 {
  margin-left: 1rem;
}

.level-5,
.level-n {
  margin-left: 1.5rem;
}

.empty-children {
  padding: 0.5rem 0.5rem 0.5rem 2.5rem;
  color: #999;
  font-style: italic;
  font-size: 0.9rem;
}

.node-content-block {
  padding: 0.5rem 1rem 1rem 2.5rem;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #555;
  border-left: 2px solid #eee;
  margin-left: 0.5rem;
  white-space: pre-line;
  max-height: 150px;
  overflow-y: auto;
  background-color: rgba(0, 0, 0, 0.01);
}

.child-content {
  padding-left: 3rem;
  margin-left: 1.5rem;
  background-color: rgba(0, 0, 0, 0.01);
}

/* 节点操作按钮样式 */
.node-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.node-header:hover .node-actions {
  opacity: 1;
}

.action-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s ease;
}

.edit-btn {
  background-color: #ecf5ff;
  color: #409eff;
}

.edit-btn:hover {
  background-color: #d9ecff;
}

.add-btn {
  background-color: #f0f9eb;
  color: #67c23a;
}

.add-btn:hover {
  background-color: #e1f3d8;
}

.delete-btn {
  background-color: #fef0f0;
  color: #f56c6c;
}

.delete-btn:hover {
  background-color: #fde2e2;
}
</style> 