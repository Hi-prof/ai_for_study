<template>
  <div class="student-outline-preview">
    <!-- 预览头部 -->
    <div class="preview-header">
      <h3 class="preview-title">知识大纲预览</h3>
      <div class="preview-stats">
        <span class="node-count">{{ nodes.length }} 个知识点</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载大纲...</p>
    </div>

    <!-- 大纲内容 -->
    <div v-else-if="nodes.length > 0" class="outline-content">
      <div class="outline-tree">
        <StudentOutlineNode
          v-for="(node, index) in rootNodes"
          :key="node.id"
          :node="node"
          :level="0"
          :index="index"
          :expanded-nodes="expandedNodes"
          @toggle="toggleNode"
          @select="selectNode"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-outline">
      <div class="empty-icon">📋</div>
      <h4 class="empty-title">暂无大纲内容</h4>
      <p class="empty-description">该知识图谱还没有创建知识节点</p>
    </div>

    <!-- 节点详情弹窗 -->
    <div v-if="selectedNode && showNodeDetail" class="node-detail-overlay" @click="closeNodeDetail">
      <div class="node-detail-modal" @click.stop>
        <div class="detail-header">
          <h3 class="detail-title">{{ selectedNode.name || '知识节点' }}</h3>
          <button class="close-btn" @click="closeNodeDetail">×</button>
        </div>
        <div class="detail-content">
          <div v-if="selectedNodeStructured" class="content-section card-section">
            <div class="section-header-line">
              <h4 class="section-title">知识卡片</h4>
              <span v-if="selectedNodeStructured.isFocus" class="focus-badge">重点节点</span>
            </div>
            <div v-if="selectedNodeCardItems.length > 0" class="card-block">
              <div v-for="item in selectedNodeCardItems" :key="item.label" class="card-item">
                <div class="card-label">{{ item.label }}</div>
                <div class="card-value">{{ item.value }}</div>
              </div>
            </div>
          </div>
          <div v-else-if="selectedNode.content" class="content-section">
            <h4 class="section-title">节点内容</h4>
            <p class="section-text">{{ selectedNode.content }}</p>
          </div>
          <div class="info-section">
            <h4 class="section-title">基本信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">创建时间</span>
                <span class="info-value">{{ formatDate(selectedNode.createTime) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">更新时间</span>
                <span class="info-value">{{ formatDate(selectedNode.updateTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { getKnowledgeGraphNodes } from '@/api/node';
import StudentOutlineNode from './StudentOutlineNode.vue';
import { buildUnifiedKnowledgeCardItems, parseStructuredKnowledgeContent } from './knowledgeCardUtils';

// 定义 props
const props = defineProps({
  graphId: {
    type: [String, Number],
    required: true
  }
});

// 响应式数据
const loading = ref(false);
const nodes = ref([]);
const expandedNodes = ref(new Set());
const selectedNode = ref(null);
const showNodeDetail = ref(false);

// 计算属性
const rootNodes = computed(() => {
  return buildNodeTree(nodes.value);
});

const selectedNodeStructured = computed(() => parseStructuredKnowledgeContent(selectedNode.value?.content));
const selectedNodeCardItems = computed(() => buildUnifiedKnowledgeCardItems(selectedNodeStructured.value));

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知时间';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  } catch (error) {
    return '未知时间';
  }
};

// 切换节点展开状态
const toggleNode = (nodeId) => {
  if (expandedNodes.value.has(nodeId)) {
    expandedNodes.value.delete(nodeId);
  } else {
    expandedNodes.value.add(nodeId);
  }
};

// 选择节点
const selectNode = (node) => {
  selectedNode.value = node;
  showNodeDetail.value = true;
};

// 关闭节点详情
const closeNodeDetail = () => {
  showNodeDetail.value = false;
  selectedNode.value = null;
};

// 构建节点树
const buildNodeTree = (nodeList) => {
  if (!nodeList || nodeList.length === 0) return [];

  // 创建节点映射
  const nodeMap = new Map();
  nodeList.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  // 构建树形结构
  const rootNodes = [];
  nodeList.forEach(node => {
    const treeNode = nodeMap.get(node.id);
    if (!node.parentId || node.parentId === null) {
      rootNodes.push(treeNode);
    } else {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        parent.children.push(treeNode);
      } else {
        // 如果找不到父节点，作为根节点处理
        rootNodes.push(treeNode);
      }
    }
  });

  return rootNodes;
};

// 加载节点数据
const loadNodes = async () => {
  if (!props.graphId) {
    console.warn('图谱ID为空，无法加载节点');
    return;
  }

  loading.value = true;
  try {
    console.log('正在加载知识节点，图谱ID:', props.graphId);
    
    const response = await getKnowledgeGraphNodes(props.graphId);
    console.log('获取知识节点响应:', response);

    if (response && response.rows && Array.isArray(response.rows)) {
      nodes.value = response.rows;
      console.log('知识节点加载成功:', nodes.value);
    } else {
      console.warn('知识节点响应格式异常:', response);
      nodes.value = [];
    }
  } catch (error) {
    console.error('获取知识节点失败:', error);
    nodes.value = [];
  } finally {
    loading.value = false;
  }
};

// 监听图谱ID变化
watch(() => props.graphId, (newGraphId) => {
  if (newGraphId) {
    loadNodes();
  }
}, { immediate: true });

// 组件挂载时加载数据
onMounted(() => {
  if (props.graphId) {
    loadNodes();
  }
});

// 暴露方法给父组件
defineExpose({
  loadNodes
});
</script>

<style scoped>
.student-outline-preview {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.preview-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.node-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.outline-content {
  max-height: 400px;
  overflow-y: auto;
}

.outline-tree {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.empty-outline {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1.5rem;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.empty-description {
  margin: 0;
  text-align: center;
}

/* 节点详情弹窗样式 */
.node-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.node-detail-modal {
  background: white;
  border-radius: 12px;
  width: 90vw;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.detail-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.content-section,
.info-section {
  margin-bottom: 1.5rem;
}

.section-header-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.focus-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 600;
}

.card-section {
  padding: 16px;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: #f8fbff;
}

.card-block + .card-block {
  margin-top: 16px;
}

.card-item + .card-item {
  margin-top: 10px;
}

.card-label {
  margin-bottom: 4px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
}

.card-value {
  color: #1e293b;
  line-height: 1.7;
  white-space: pre-wrap;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
}

.section-text {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
}

.info-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 0.875rem;
  color: #374151;
}
</style>
