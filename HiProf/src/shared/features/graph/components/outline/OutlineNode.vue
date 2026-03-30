<template>
  <div 
    class="outline-node" 
    :class="{ 
      'selected': isSelected,
      'has-children': hasChildren,
      'expanded': isExpanded,
      'highlighted': isHighlighted
    }"
    :style="{ paddingLeft: `${level * 24}px` }"
  >
    <div class="node-content">
      <!-- 展开/折叠图标 -->
      <div 
        class="toggle-icon"
        @click="toggleNode"
      >
        <i v-if="hasChildren" class="triangle-icon" :class="{'triangle-down': isExpanded, 'triangle-right': !isExpanded}"></i>
        <span v-else class="dot"></span>
      </div>
      
      <!-- 节点内容 -->
      <div class="node-title" @click="selectNode">
        <span v-if="!isHighlighted">{{ node.title }}</span>
        <span v-else v-html="highlightedTitle"></span>
      </div>
      
      <!-- 操作按钮 -->
      <div class="node-actions">
        <button 
          class="action-btn add-btn" 
          title="添加子节点"
          @click.stop="addChildNode"
        >
          <i class="icon-plus">+</i>
        </button>
        <button 
          class="action-btn delete-btn" 
          title="删除节点"
          @click.stop="deleteNode"
        >
          <i class="icon-trash">×</i>
        </button>
      </div>
    </div>
    
    <!-- 子节点 -->
    <div v-if="hasChildren && isExpanded" class="node-children">
      <OutlineNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :selected-node="selectedNode"
        :search-keyword="searchKeyword"
        @node-select="onNodeSelect"
        @node-toggle="onNodeToggle"
        @node-add="onNodeAdd"
        @node-delete="onNodeDelete"
        @node-move="onNodeMove"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref, onMounted } from 'vue';

// 属性定义
const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
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

// 从父组件注入展开节点集合，使用ref跟踪本地展开状态
const expandedNodesFromParent = inject('expandedNodes', null);
const localExpanded = ref(false);

// 计算属性
const isSelected = computed(() => {
  return props.selectedNode && props.selectedNode.id === props.node.id;
});

const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0;
});

const isExpanded = computed(() => {
  // 优先使用父组件提供的状态，如果没有则使用本地状态
  if (expandedNodesFromParent && typeof expandedNodesFromParent.has === 'function') {
    return expandedNodesFromParent.has(props.node.id);
  }
  return localExpanded.value;
});

const isHighlighted = computed(() => {
  if (!props.searchKeyword || props.searchKeyword.trim() === '') return false;
  return props.node.title.toLowerCase().includes(props.searchKeyword.toLowerCase());
});

const highlightedTitle = computed(() => {
  if (!isHighlighted.value) return props.node.title;
  
  const regex = new RegExp(`(${props.searchKeyword})`, 'gi');
  return props.node.title.replace(regex, '<span class="highlight">$1</span>');
});

// 节点操作方法
const selectNode = () => {
  emit('node-select', props.node);
};

const toggleNode = () => {
  const newExpandedState = !isExpanded.value;
  
  // 更新展开状态
  if (expandedNodesFromParent) {
    if (newExpandedState) {
      expandedNodesFromParent.add(props.node.id);
    } else {
      expandedNodesFromParent.delete(props.node.id);
    }
  } else {
    // 如果没有父组件提供的状态，就使用本地状态
    localExpanded.value = newExpandedState;
  }
  
  // 触发事件通知父组件
  emit('node-toggle', props.node.id, newExpandedState);
};

const addChildNode = () => {
  emit('node-add', props.node.id, 'end');
};

const deleteNode = () => {
  if (confirm(`确定要删除节点 "${props.node.title}" 及其所有子节点吗？`)) {
    emit('node-delete', props.node.id);
  }
};

// 转发子节点事件
const onNodeSelect = (node) => {
  emit('node-select', node);
};

const onNodeToggle = (nodeId, expanded) => {
  emit('node-toggle', nodeId, expanded);
};

const onNodeAdd = (parentId, position) => {
  emit('node-add', parentId, position);
};

const onNodeDelete = (nodeId) => {
  emit('node-delete', nodeId);
};

const onNodeMove = (nodeId, targetParentId, position) => {
  emit('node-move', nodeId, targetParentId, position);
};

// 页面加载时检查是否需要默认展开
onMounted(() => {
  // 如果有搜索关键词且当前节点匹配，就展开此节点
  if (props.searchKeyword && props.node.title.toLowerCase().includes(props.searchKeyword.toLowerCase())) {
    if (expandedNodesFromParent) {
      expandedNodesFromParent.add(props.node.id);
    } else {
      localExpanded.value = true;
    }
    emit('node-toggle', props.node.id, true);
  }
  
  // 如果节点本身设置了expanded属性为true，也展开它
  if (props.node.expanded) {
    if (expandedNodesFromParent) {
      expandedNodesFromParent.add(props.node.id);
    } else {
      localExpanded.value = true;
    }
  }
});
</script>

<style scoped>
.outline-node {
  position: relative;
  margin-bottom: 4px;
  transition: all 0.2s ease;
}

.node-content {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.node-content:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.selected > .node-content {
  background-color: rgba(74, 137, 220, 0.1);
  color: var(--primary-color, #4a89dc);
}

.toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
  color: var(--text-light, #999);
}

.toggle-icon:hover {
  color: var(--primary-color, #4a89dc);
}

.toggle-icon.empty {
  visibility: visible;
}

.triangle-icon {
  width: 0;
  height: 0;
  display: block;
  transition: transform 0.2s ease;
}

.triangle-right {
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left: 10px solid #999;
}

.triangle-down {
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 10px solid #999;
  border-top: none;
}

.dot {
  width: 6px;
  height: 6px;
  background-color: #ccc;
  border-radius: 50%;
}

.node-title {
  flex: 1;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 2px 0;
  transition: color 0.2s ease;
  font-size: 14px;
}

.has-children > .node-content > .node-title {
  font-weight: 500;
}

.node-actions {
  display: none;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.node-content:hover .node-actions {
  display: flex;
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s ease;
  font-size: 14px;
}

.add-btn {
  color: var(--primary-color, #4a89dc);
}

.delete-btn {
  color: #ff6b6b;
}

.action-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  transform: scale(1.1);
}

.node-children {
  margin-top: 2px;
  position: relative;
  transition: all 0.2s ease;
}

.node-children::before {
  content: "";
  position: absolute;
  left: 10px;
  top: 0;
  bottom: 12px;
  width: 1px;
  background-color: rgba(0, 0, 0, 0.08);
}

.highlight {
  background-color: rgba(255, 213, 79, 0.4);
  border-radius: 2px;
  padding: 0 2px;
}

.icon-plus, .icon-trash {
  font-size: 14px;
  font-weight: bold;
}
</style> 