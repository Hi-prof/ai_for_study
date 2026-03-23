<template>
  <div 
    class="section-node" 
    :class="{ 
      'has-children': hasChildren,
      'expanded': isExpanded
    }"
    :style="{ paddingLeft: `${level * 20}px` }"
  >
    <div class="section-content">
      <!-- 展开/折叠图标 -->
      <div 
        class="toggle-icon"
        @click="toggleNode"
      >
        <i v-if="hasChildren" class="triangle-icon" :class="{'triangle-down': isExpanded, 'triangle-right': !isExpanded}">▶</i>
        <span v-else class="dot">•</span>
      </div>
      
      <!-- 节点编号和标题 -->
      <div class="section-info">
        <span class="section-number">{{ sectionNumber }}</span>
        <span class="section-title">{{ section.title || section.name }}</span>
      </div>
      
    </div>
    
    <!-- 子节点 -->
    <div v-if="hasChildren && isExpanded" class="section-children">
      <SectionNode
        v-for="(child, childIndex) in section.children"
        :key="child.id"
        :section="child"
        :level="level + 1"
        :parent-number="sectionNumber"
        :index="childIndex"
        :expanded-nodes="expandedNodes"
        @toggle="onToggle"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Props
const props = defineProps({
  section: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  },
  parentNumber: {
    type: String,
    default: ''
  },
  index: {
    type: Number,
    required: true
  },
  expandedNodes: {
    type: Set,
    required: true
  }
});

// Emits
const emit = defineEmits(['toggle']);

// 计算属性
const hasChildren = computed(() => {
  return props.section.children && props.section.children.length > 0;
});

const isExpanded = computed(() => {
  return props.expandedNodes.has(props.section.id);
});

const sectionNumber = computed(() => {
  if (props.level === 0) {
    return `${props.index + 1}`;
  } else {
    return `${props.parentNumber}.${props.index + 1}`;
  }
});

// 方法
const toggleNode = () => {
  emit('toggle', props.section.id);
};

// 转发子节点事件
const onToggle = (nodeId) => {
  emit('toggle', nodeId);
};
</script>

<style scoped>
.section-node {
  margin-bottom: 4px;
  transition: all 0.2s ease;
}

.section-content {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

.section-content:hover {
  background-color: #e9ecef;
}

.toggle-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-right: 8px;
}

.triangle-icon {
  font-size: 12px;
  color: #6c757d;
  transition: transform 0.2s ease;
  font-style: normal;
}

.triangle-down {
  transform: rotate(90deg);
}

.triangle-right {
  transform: rotate(0deg);
}

.dot {
  color: #6c757d;
  font-size: 14px;
}

.section-info {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 8px;
}

.section-number {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  background-color: #6366f1;
  padding: 2px 6px;
  border-radius: 4px;
  min-width: 24px;
  text-align: center;
}

.section-title {
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 500;
}



.section-children {
  margin-top: 4px;
}
</style>
