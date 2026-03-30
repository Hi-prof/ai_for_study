<template>
  <div class="outline-tree">
    <div class="tree-container">
      <template v-if="nodes && nodes.length > 0">
        <div 
          v-for="node in nodes" 
          :key="node.id"
          class="tree-root-node"
        >
          <OutlineNode 
            :node="node" 
            :level="0"
            :selected-node="selectedNode"
            :search-keyword="searchKeyword"
            @node-select="onNodeSelect"
            @node-toggle="onNodeToggle"
            @node-add="onNodeAdd"
            @node-delete="onNodeDelete"
            @node-move="onNodeMove"
          />
        </div>
      </template>
      <div v-else class="empty-tree">
        <i class="empty-icon">📝</i>
        <p>暂无知识点，请添加根知识点开始构建</p>
        <button class="btn-add" @click="addRootNode">
          <i class="icon-plus">+</i>
          <span>添加根知识点</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, provide, defineExpose } from 'vue';
import OutlineNode from './OutlineNode.vue';

// 属性定义
const props = defineProps({
  nodes: {
    type: Array,
    default: () => []
  },
  selectedNode: {
    type: Object,
    default: null
  },
  searchKeyword: {
    type: String,
    default: ''
  }
});

// 事件定义
const emit = defineEmits([
  'node-select', 
  'node-toggle', 
  'node-add', 
  'node-delete', 
  'node-move'
]);

// 节点展开状态
const expandedNodes = ref(new Set());

// 向子组件提供expandedNodes状态
provide('expandedNodes', expandedNodes);

// 监听搜索关键词变化，如果有搜索词则自动展开所有节点
watch(() => props.searchKeyword, (newVal) => {
  if (newVal && newVal.trim() !== '') {
    expandAll();
  }
}, { immediate: true });

// 展开所有节点
const expandAll = () => {
  const nodeIds = getAllNodeIds(props.nodes);
  nodeIds.forEach(id => expandedNodes.value.add(id));
};

// 折叠所有节点
const collapseAll = () => {
  expandedNodes.value.clear();
};

// 递归获取所有节点ID
const getAllNodeIds = (nodes) => {
  let ids = [];
  if (!nodes || nodes.length === 0) return ids;
  
  nodes.forEach(node => {
    ids.push(node.id);
    if (node.children && node.children.length > 0) {
      ids = [...ids, ...getAllNodeIds(node.children)];
    }
  });
  
  return ids;
};

// 添加根节点
const addRootNode = () => {
  emit('node-add', null, 'end');
};

// 节点选择事件处理
const onNodeSelect = (node) => {
  emit('node-select', node);
};

// 节点展开/折叠事件处理
const onNodeToggle = (nodeId, expanded) => {
  if (expanded) {
    expandedNodes.value.add(nodeId);
  } else {
    expandedNodes.value.delete(nodeId);
  }
  emit('node-toggle', nodeId, expanded);
};

// 节点添加事件处理
const onNodeAdd = (parentId, position) => {
  emit('node-add', parentId, position);
};

// 节点删除事件处理
const onNodeDelete = (nodeId) => {
  emit('node-delete', nodeId);
};

// 节点移动事件处理
const onNodeMove = (nodeId, targetParentId, position) => {
  emit('node-move', nodeId, targetParentId, position);
};

// 导出方法供父组件调用
defineExpose({
  expandAll,
  collapseAll
});
</script>

<style scoped>
.outline-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: var(--font-family-sans, 'Arial', sans-serif);
}

.tree-container {
  flex: 1;
  overflow: auto;
  padding: 4px 8px;
}

.tree-root-node {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.tree-root-node:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.empty-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-light, #999);
  text-align: center;
  padding: 32px;
  gap: 16px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-tree p {
  margin: 0;
  font-style: italic;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--primary-color, #4a89dc);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 8px;
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.icon-plus {
  font-size: 16px;
  font-weight: bold;
}
</style> 