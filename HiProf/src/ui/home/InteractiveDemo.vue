<template>
  <div class="interactive-demo glass-morphic-bg">
    <div class="container">
      <h2 class="section-title">知识图谱体验</h2>
      <p class="section-description">
        交互式探索知识结构，体验图谱的动态连接与关系可视化。
      </p>
      
      <div class="interactive-demo-container">
        <div class="demo-graph glass-card" ref="graphContainer">
          <!-- 开始体验覆盖层 -->
          <div v-if="!isStarted" class="start-overlay">
            <div class="start-content">
              <div class="start-icon">
                <div class="icon-background" @click="startExperience">
                  <div class="icon-pulse"></div>
                  <div class="icon-content">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 5v14l11-7z" fill="currentColor"/>
                    </svg>
                  </div>
                </div>
              </div>
              <button class="start-button" @click="startExperience">
                <span class="button-text">开始体验</span>
                <svg class="button-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- 知识图谱组件 -->
          <RelationGraph 
            ref="relationGraph$" 
            :options="graphOptions" 
            :on-node-click="onNodeClick"
          >
            <template #node="{node}">
              <div class="custom-node" :class="[node.category]" :style="{ backgroundColor: getNodeColor(node.category) || '#3498db' }">
                <span class="node-text">{{ node.text }}</span>
              </div>
            </template>
          </RelationGraph>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import RelationGraph from 'relation-graph-vue3';

const relationGraph$ = ref(null);
const graphContainer = ref(null);
const selectedNode = ref(null);
const isStarted = ref(false);

// 图谱配置
const graphOptions = {
  defaultNodeBorderWidth: 0,
  defaultNodeBorderColor: 'transparent',
  defaultNodeColor: '#3498db',
  allowSwitchLineShape: true,
  allowSwitchJunctionPoint: true,
  defaultLineShape: 1, // 使用曲线
  defaultLineWidth: 2,
  defaultLineColor: '#8395a7',
  defaultLineHoverColor: '#3498db',
  defaultJunctionPoint: 'border',
  // 设置节点形状为圆形
  defaultNodeShape: 0, // 0表示圆形，1表示方形
  nodeShapeStrokeWidth: 0,
  nodeShapeStrokeColor: '#0000',
  defaultNodeWidth: 100,
  defaultNodeHeight: 100,
  // 设置节点文本样式
  defaultNodeFontColor: '#ffffff',
  defaultNodeFontSize: 14,
  defaultNodeFontFamily: '"Noto Sans SC", sans-serif',
  // 设置线条文本样式
  defaultLineTextColor: '#34495e',
  defaultLineTextFontSize: 12,
  defaultLineTextFontFamily: '"Noto Sans SC", sans-serif',
  // 设置动画效果
  animateTime: 800,
  // 设置背景
  backgrounImageNoRepeat: true,
  backgroundColor: '#ffffff',
  // 移除节点外围边框
  hideNodeReactionBorder: true,
  layouts: [
    {
      label: '力导向布局',
      layoutName: 'force',
      layoutClassName: 'ForceDirectedLayout',
      layoutParams: {
        repulsion: 1200, // 增加排斥力
        attractive: 6,   // 增加吸引力
        iterations: 500, // 增加迭代次数以获得更稳定的布局
        center: {x: 0.5, y: 0.45} // 调整中心点位置
      }
    }
  ]
};

// 土木工程概论知识图谱数据
const demoGraphData = {
  rootId: '1',
  nodes: [
    { 
      id: '1', 
      text: '土木工程概述',
      content: '介绍土木工程的定义、历史发展和现代土木工程的范畴。',
      category: 'root'
    },
    { 
      id: '2', 
      text: '土木工程的定义与分类',
      content: '土木工程的基本定义、主要分支及其在国民经济中的地位和作用。',
      category: 'concept'
    },
    { 
      id: '3', 
      text: '土木工程发展简史',
      content: '从古至今土木工程的发展历程、重要里程碑及杰出代表人物。',
      category: 'history'
    },
    { 
      id: '4', 
      text: '现代土木工程的特点',
      content: '现代土木工程的跨学科特点、创新趋势及面临的挑战。',
      category: 'concept'
    },
    { 
      id: '5', 
      text: '结构工程基础',
      content: '介绍结构工程的基本概念、结构类型及其设计原则。',
      category: 'branch'
    },
    { 
      id: '6', 
      text: '建筑材料基础',
      content: '介绍土木工程中常用的建筑材料及其性能特点。',
      category: 'branch'
    },
    { 
      id: '7', 
      text: '岩土工程基础',
      content: '介绍岩土工程的基本概念、土壤性质及基础类型。',
      category: 'branch'
    },
    { 
      id: '8', 
      text: '水利工程基础',
      content: '介绍水利工程的基本概念、常见水工建筑物及防洪工程。',
      category: 'branch'
    },
    { 
      id: '9', 
      text: '交通工程基础',
      content: '介绍道路、桥梁、隧道等交通工程的基本知识。',
      category: 'branch'
    },
    { 
      id: '10', 
      text: '施工技术与管理',
      content: '介绍土木工程施工的基本技术和项目管理知识。',
      category: 'application'
    },
    { 
      id: '11', 
      text: '土木工程与可持续发展',
      content: '介绍土木工程与可持续发展的关系及绿色建筑理念。',
      category: 'application'
    }
  ],
  lines: [
    { from: '1', to: '2', text: '定义' },
    { from: '1', to: '3', text: '历史' },
    { from: '1', to: '4', text: '特点' },
    { from: '1', to: '5', text: '分支' },
    { from: '1', to: '6', text: '分支' },
    { from: '1', to: '7', text: '分支' },
    { from: '1', to: '8', text: '分支' },
    { from: '1', to: '9', text: '分支' },
    { from: '5', to: '10', text: '应用' },
    { from: '6', to: '10', text: '应用' },
    { from: '7', to: '10', text: '应用' },
    { from: '8', to: '10', text: '应用' },
    { from: '9', to: '10', text: '应用' },
    { from: '5', to: '11', text: '影响' },
    { from: '6', to: '11', text: '影响' },
    { from: '7', to: '11', text: '影响' },
    { from: '8', to: '11', text: '影响' },
    { from: '9', to: '11', text: '影响' }
  ]
};

// 根据节点类别返回颜色
const getNodeColor = (category) => {
  const colors = {
    'root': 'rgba(59, 130, 246, 0.8)',
    'concept': 'rgba(16, 185, 129, 0.8)',
    'history': 'rgba(139, 92, 246, 0.8)',
    'branch': 'rgba(239, 68, 68, 0.8)',
    'application': 'rgba(249, 115, 22, 0.8)',
    'tool': 'rgba(20, 184, 166, 0.8)',
    'method': 'rgba(124, 58, 237, 0.8)'
  };
  return colors[category] || 'rgba(59, 130, 246, 0.8)';
};

// 获取类别中文名称
const getCategoryName = (category) => {
  const categories = {
    'root': '核心概念',
    'concept': '基本概念',
    'history': '历史发展',
    'branch': '学科分支',
    'application': '应用领域',
    'tool': '工具方法',
    'method': '研究方法'
  };
  return categories[category] || category;
};

// 节点点击事件
const onNodeClick = (node) => {
  selectedNode.value = node;
  // 为选中节点添加关联节点数量信息
  const relatedLines = demoGraphData.lines.filter(
    line => line.from === node.id || line.to === node.id
  );
  selectedNode.value.relatedCount = relatedLines.length;
  return true;
};

// 图谱控制方法
const zoomIn = () => {
  if (relationGraph$.value && relationGraph$.value.zoom) {
    relationGraph$.value.zoom(1.2);
  }
};

const zoomOut = () => {
  if (relationGraph$.value && relationGraph$.value.zoom) {
    relationGraph$.value.zoom(0.8);
  }
};

const resetView = () => {
  if (relationGraph$.value) {
    if (relationGraph$.value.setZoom) {
      relationGraph$.value.setZoom(1);
    }
    if (relationGraph$.value.moveToCenter) {
      relationGraph$.value.moveToCenter();
    }
  }
};

// 开始体验
const startExperience = () => {
  isStarted.value = true;
};

// 初始化图谱
onMounted(() => {
  setTimeout(() => {
    if (relationGraph$.value && relationGraph$.value.setJsonData) {
      relationGraph$.value.setJsonData(demoGraphData);
      setTimeout(() => {
        if (relationGraph$.value && relationGraph$.value.moveToCenter) {
          relationGraph$.value.moveToCenter();
        }
      }, 300);
    }
  }, 100);
});
</script>

<style scoped>
@import '../../assets/styles/glassmorphism.css';

.interactive-demo {
  padding: 0;
  position: relative;
  z-index: 5;
  color: rgba(0, 0, 0, 0.8);
}

.section-title {
  font-size: var(--font-size-xxlarge);
  margin-bottom: var(--spacing-xs);
  text-align: center;
  color: rgba(0, 0, 0, 0.85);
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.5);
}

.section-description {
  font-size: var(--font-size-medium);
  color: rgba(0, 0, 0, 0.7);
  text-align: center;
  max-width: 800px;
  margin: 0 auto var(--spacing-sm);
}

.interactive-demo-container {
  display: grid;
  grid-template-columns: 1fr;
}

.demo-graph {
  height: 700px; /* 从500px增加到700px，更大 */
  max-width: 1800px; /* 限制最大宽度，使其更方正 */
  width: 100%;
  margin: 0 auto; /* 居中显示 */
  aspect-ratio: 16/7; /* 接近方正的宽高比 */
  overflow: hidden;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  position: relative; /* 为覆盖层提供定位上下文 */
}

.demo-controls {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.control-section {
  margin-bottom: var(--spacing-md);
}

.control-title {
  font-size: var(--font-size-medium);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-xs);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(0, 0, 0, 0.8);
}

.control-buttons {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.node-info {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
}

.node-title {
  font-size: var(--font-size-medium);
  margin-bottom: var(--spacing-sm);
  color: rgba(0, 0, 0, 0.85);
}

.node-description {
  font-size: var(--font-size-small);
  margin-bottom: var(--spacing-md);
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.6;
}

.node-relations {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  font-size: var(--font-size-small);
  color: rgba(0, 0, 0, 0.7);
}

.node-info-placeholder {
  padding: var(--spacing-lg);
  text-align: center;
  color: rgba(0, 0, 0, 0.5);
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
}

.custom-node {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.node-text {
  padding: 5px;
  text-align: center;
  font-size: 12px;
  max-width: 80px;
  overflow-wrap: break-word;
  line-height: 1.2;
}

@media (max-width: 1024px) {
  .demo-graph {
    max-width: 90%;
    height: 650px;
  }
}

/* 开始体验覆盖层样式 */
.start-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: var(--border-radius-md);
}

.start-content {
  text-align: center;
  padding: var(--spacing-xl);
  max-width: 400px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--border-radius-lg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.start-icon {
  margin-bottom: var(--spacing-lg);
  display: flex;
  justify-content: center;
  position: relative;
}

.icon-background {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 8px 32px rgba(102, 126, 234, 0.4),
    0 0 0 0 rgba(102, 126, 234, 0.1);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  overflow: hidden;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.icon-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  animation: pulse-effect 2s ease-in-out infinite;
}

.icon-content {
  position: relative;
  z-index: 2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
}

.icon-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s;
}

.icon-background:hover {
  transform: scale(1.1);
  box-shadow: 
    0 12px 40px rgba(102, 126, 234, 0.5),
    0 0 0 4px rgba(102, 126, 234, 0.1);
}

.icon-background:hover::before {
  left: 100%;
}

.icon-background:hover .icon-content {
  transform: scale(1.1);
}

.icon-background:active {
  transform: scale(1.05);
  box-shadow: 
    0 6px 24px rgba(102, 126, 234, 0.4),
    0 0 0 2px rgba(102, 126, 234, 0.1);
}

@keyframes pulse-effect {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.3;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
}

.start-title {
  font-size: var(--font-size-xlarge);
  margin-bottom: var(--spacing-md);
  color: rgba(0, 0, 0, 0.85);
  font-weight: 600;
}

.start-description {
  font-size: var(--font-size-medium);
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
}

.start-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 
    0 8px 25px -8px rgba(102, 126, 234, 0.4),
    0 0 0 0 rgba(102, 126, 234, 0);
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 1px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.button-text {
  transition: transform 0.3s ease;
}

.button-icon {
  transition: transform 0.3s ease;
  opacity: 0.9;
}

.start-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s;
}

.start-button:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 
    0 15px 35px -8px rgba(102, 126, 234, 0.5),
    0 0 0 3px rgba(102, 126, 234, 0.1);
}

.start-button:hover::before {
  left: 100%;
}

.start-button:hover .button-icon {
  transform: translateX(4px);
  opacity: 1;
}

.start-button:hover .button-text {
  transform: translateX(-2px);
}

.start-button:active {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 
    0 8px 20px -8px rgba(102, 126, 234, 0.4),
    0 0 0 2px rgba(102, 126, 234, 0.1);
  transition: all 0.2s ease;
}

.start-button:focus {
  outline: none;
  box-shadow: 
    0 8px 25px -8px rgba(102, 126, 234, 0.4),
    0 0 0 3px rgba(102, 126, 234, 0.3);
}

@media (max-width: 768px) {
  .interactive-demo-container {
    grid-template-columns: 1fr;
  }
  
  .demo-graph {
    height: 600px; /* 移动端也增大，从450px到600px */
    max-width: 95%; /* 移动端宽度稍微减小 */
    aspect-ratio: 4/1; /* 移动端使用正方形比例 */
  }
  
  .start-content {
    padding: var(--spacing-lg);
    max-width: 300px;
    background: rgba(255, 255, 255, 0.85);
  }
  
  .start-title {
    font-size: var(--font-size-large);
  }
  
  .start-description {
    font-size: var(--font-size-small);
  }
  
  .start-button {
    padding: 14px 28px;
    font-size: 14px;
    border-radius: 40px;
    letter-spacing: 0.5px;
  }
  
  .start-button:hover {
    transform: translateY(-2px) scale(1.03);
  }
  
  .start-button:active {
    transform: translateY(-1px) scale(1.01);
  }
  
  .icon-background {
    width: 70px;
    height: 70px;
  }
  
  .icon-background:hover {
    transform: scale(1.08);
  }
  
  .icon-background:active {
    transform: scale(1.03);
  }
}
</style> 