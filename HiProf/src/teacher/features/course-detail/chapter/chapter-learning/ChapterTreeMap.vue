<template>
  <div class="chapter-tree-map">
    <!-- 树形图谱容器 -->
    <div class="tree-container" ref="treeContainer">
      <svg 
        :width="svgWidth" 
        :height="svgHeight" 
        class="tree-svg"
        @click="handleSvgClick"
      >
        <!-- 连接线 -->
        <g class="links-group">
          <path
            v-for="link in links"
            :key="`link-${link.source.id}-${link.target.id}`"
            :d="link.path"
            class="tree-link"
          />
        </g>
        
        <!-- 节点 -->
        <g class="nodes-group">
          <g
            v-for="node in nodes"
            :key="node.id"
            :transform="`translate(${node.x}, ${node.y})`"
            class="tree-node"
            :class="{ 
              'active': node.id === currentChapterId,
              'completed': node.progress === 100 
            }"
            @click="handleNodeClick(node)"
          >
            <!-- 节点圆圈 -->
            <circle
              :r="nodeRadius"
              class="node-circle"
            />
            
            <!-- 节点编号 -->
            <text
              class="node-number"
              text-anchor="middle"
              dy="0.35em"
            >
              {{ node.index + 1 }}
            </text>
            
            <!-- 节点标题 -->
            <text
              :y="nodeRadius + 20"
              class="node-title"
              text-anchor="middle"
            >
              {{ truncateText(node.title, 12) }}
            </text>
            
            <!-- 进度指示器 -->
            <circle
              v-if="node.progress > 0"
              :r="nodeRadius + 3"
              class="progress-ring"
              :stroke-dasharray="progressCircumference"
              :stroke-dashoffset="progressCircumference - (progressCircumference * node.progress / 100)"
            />
            
            <!-- 状态图标 -->
            <g v-if="node.progress === 100" class="status-icon completed">
              <circle r="8" fill="var(--success-color, #2ecc71)" />
              <text text-anchor="middle" dy="0.35em" fill="white" font-size="10">✓</text>
            </g>
            <g v-else-if="node.id === currentChapterId" class="status-icon current">
              <circle r="8" fill="var(--primary-color, #3498db)" />
              <text text-anchor="middle" dy="0.35em" fill="white" font-size="10">●</text>
            </g>
          </g>
        </g>
      </svg>
    </div>
    
    <!-- 控制面板 -->
    <div class="tree-controls">
      <button class="control-btn" @click="zoomIn">
        <i class="icon">+</i>
      </button>
      <button class="control-btn" @click="zoomOut">
        <i class="icon">-</i>
      </button>
      <button class="control-btn" @click="resetZoom">
        <i class="icon">⌂</i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';

// Props
const props = defineProps({
  chapters: {
    type: Array,
    default: () => []
  },
  currentChapterId: {
    type: [String, Number],
    default: null
  }
});

// Emits
const emit = defineEmits(['chapter-select']);

// 响应式数据
const treeContainer = ref(null);
const svgWidth = ref(400);
const svgHeight = ref(600);
const nodeRadius = ref(20);
const zoomLevel = ref(1);
const panX = ref(0);
const panY = ref(0);

// 计算属性
const progressCircumference = computed(() => 2 * Math.PI * (nodeRadius.value + 3));

const nodes = computed(() => {
  if (!props.chapters.length) return [];
  
  const nodeSpacing = 80;
  const startY = 50;
  
  return props.chapters.map((chapter, index) => ({
    ...chapter,
    index,
    x: svgWidth.value / 2,
    y: startY + index * nodeSpacing
  }));
});

const links = computed(() => {
  if (nodes.value.length < 2) return [];
  
  const links = [];
  for (let i = 0; i < nodes.value.length - 1; i++) {
    const source = nodes.value[i];
    const target = nodes.value[i + 1];
    
    // 创建连接路径
    const path = createLinkPath(source, target);
    
    links.push({
      source,
      target,
      path
    });
  }
  
  return links;
});

// 方法
const createLinkPath = (source, target) => {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const dr = Math.sqrt(dx * dx + dy * dy);
  
  // 创建弯曲的连接线
  return `M${source.x},${source.y + nodeRadius.value}A${dr},${dr} 0 0,1 ${target.x},${target.y - nodeRadius.value}`;
};

const truncateText = (text, maxLength) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const handleNodeClick = (node) => {
  emit('chapter-select', node.id);
};

const handleSvgClick = (event) => {
  // 点击空白区域时的处理
  if (event.target.tagName === 'svg') {
    // 可以添加一些交互逻辑
  }
};

const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.2, 3);
  updateTransform();
};

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.5);
  updateTransform();
};

const resetZoom = () => {
  zoomLevel.value = 1;
  panX.value = 0;
  panY.value = 0;
  updateTransform();
};

const updateTransform = () => {
  // 这里可以添加平移和缩放的逻辑
  // 由于我们使用的是简单的SVG，暂时保持简单
};

const updateDimensions = () => {
  if (treeContainer.value) {
    const rect = treeContainer.value.getBoundingClientRect();
    svgWidth.value = rect.width;
    svgHeight.value = Math.max(600, props.chapters.length * 80 + 100);
  }
};

// 监听章节变化
watch(() => props.chapters, () => {
  nextTick(() => {
    updateDimensions();
  });
}, { deep: true });

// 组件挂载
onMounted(() => {
  updateDimensions();
  
  // 监听窗口大小变化
  window.addEventListener('resize', updateDimensions, { passive: true });
});
</script>

<style scoped>
.chapter-tree-map {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.tree-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.tree-svg {
  width: 100%;
  height: 100%;
  background: var(--background-color, #ffffff);
}

/* 连接线样式 */
.tree-link {
  fill: none;
  stroke: var(--border-color, #e0e0e0);
  stroke-width: 2;
  transition: stroke 0.3s ease;
}

.tree-link:hover {
  stroke: var(--primary-color, #3498db);
  stroke-width: 3;
}

/* 节点样式 */
.tree-node {
  cursor: pointer;
  transition: all 0.3s ease;
}

.tree-node:hover {
  transform: scale(1.1);
}

.node-circle {
  fill: var(--background-color, #ffffff);
  stroke: var(--border-color, #e0e0e0);
  stroke-width: 2;
  transition: all 0.3s ease;
}

.tree-node.active .node-circle {
  fill: var(--primary-color, #3498db);
  stroke: var(--primary-color, #3498db);
}

.tree-node.completed .node-circle {
  fill: var(--success-color, #2ecc71);
  stroke: var(--success-color, #2ecc71);
}

.node-number {
  font-size: 12px;
  font-weight: 600;
  fill: var(--text-color, #333);
}

.tree-node.active .node-number,
.tree-node.completed .node-number {
  fill: white;
}

.node-title {
  font-size: 10px;
  fill: var(--text-color, #333);
  font-weight: 500;
}

/* 进度环 */
.progress-ring {
  fill: none;
  stroke: var(--primary-color, #3498db);
  stroke-width: 2;
  transform: rotate(-90deg);
  transform-origin: center;
  transition: stroke-dashoffset 0.3s ease;
}

.tree-node.completed .progress-ring {
  stroke: var(--success-color, #2ecc71);
}

/* 状态图标 */
.status-icon {
  transform: translate(15px, -15px);
}

/* 控制面板 */
.tree-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: white;
  border-radius: 0.375rem;
  padding: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 0.25rem;
  background: white;
  color: var(--text-color, #333);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn:hover {
  background: var(--primary-color, #3498db);
  color: white;
  border-color: var(--primary-color, #3498db);
}

.icon {
  font-size: 14px;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tree-controls {
    flex-direction: row;
    top: auto;
    bottom: 10px;
    right: 10px;
    left: 10px;
    justify-content: center;
  }
  
  .node-title {
    font-size: 8px;
  }
  
  .node-number {
    font-size: 10px;
  }
}
</style>
