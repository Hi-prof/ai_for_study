<template>
  <div 
    class="student-section-node" 
    :class="{ 
      'has-children': hasChildren,
      'expanded': isExpanded,
      'completed': section.completed
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
      
      <!-- 学习状态 -->
      <div class="section-status">
        <span 
          class="status-badge" 
          :class="section.completed ? 'completed' : 'pending'"
        >
          {{ section.completed ? '✓ 已完成' : '○ 未完成' }}
        </span>
        <div v-if="section.progress !== undefined" class="progress-indicator">
          <span class="progress-text">{{ section.progress }}%</span>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="`width: ${section.progress}%`"
            ></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 节点描述 -->
    <div v-if="section.content && isExpanded" class="section-description">
      {{ section.content }}
    </div>

    <!-- 节点文件列表 -->
    <div v-if="isExpanded && section.id && courseId" class="section-files">
      <StudentChapterFileList
        :course-id="courseId"
        :node-name="section.title || section.name"
        :node-id="section.id"
        @file-change="handleSectionFileChange"
      />
    </div>

    <!-- 子节点 -->
    <div v-if="hasChildren && isExpanded" class="section-children">
      <StudentSectionNode
        v-for="(child, childIndex) in section.children"
        :key="child.id"
        :section="child"
        :level="level + 1"
        :parent-number="sectionNumber"
        :index="childIndex"
        :expanded-nodes="expandedNodes"
        :course-id="courseId"
        @toggle="onToggle"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import StudentChapterFileList from './StudentChapterFileList.vue';

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
  },
  courseId: {
    type: [String, Number],
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
  if (hasChildren.value) {
    emit('toggle', props.section.id);
  }
};

// 转发子节点事件
const onToggle = (nodeId) => {
  emit('toggle', nodeId);
};

// 处理节点文件变化
const handleSectionFileChange = () => {
  console.log('节点文件列表已更新:', props.section.title || props.section.name);
};
</script>

<style scoped>
.student-section-node {
  margin-bottom: 6px;
  transition: all 0.2s ease;
}

.section-content {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

.section-content:hover {
  background-color: #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.student-section-node.completed .section-content {
  background-color: #f0f9ff;
  border-color: #bfdbfe;
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
  padding: 3px 8px;
  border-radius: 4px;
  min-width: 28px;
  text-align: center;
}

.student-section-node.completed .section-number {
  background-color: #10b981;
}

.section-title {
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 500;
}

.section-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
}

.status-badge.completed {
  background-color: #dcfce7;
  color: #166534;
}

.status-badge.pending {
  background-color: #fef3c7;
  color: #92400e;
}

.progress-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.progress-text {
  font-size: 0.75rem;
  color: #6b7280;
  min-width: 32px;
}

.progress-bar {
  width: 60px;
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #10b981;
  transition: width 0.3s ease;
}

.section-description {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #f9fafb;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
  margin-left: 28px;
}

.section-files {
  margin-top: 8px;
  margin-left: 28px;
}

.section-children {
  margin-top: 6px;
}
</style>
