<template>
  <div class="student-graph-node-list">
    <!-- 节点列表头部 -->
    <div class="nodes-header">
      <h3 class="nodes-title">知识节点</h3>
      <div class="nodes-stats">
        <span class="node-count">共 {{ nodes.length }} 个节点</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载知识节点...</p>
    </div>

    <!-- 节点列表 -->
    <div v-else-if="nodes.length > 0" class="nodes-list">
      <div
        v-for="(node, index) in nodes"
        :key="node.id"
        class="node-item"
        @click="selectNode(node)"
        :class="{ active: selectedNode?.id === node.id }"
      >
        <div class="node-content">
          <div class="node-header">
            <div class="node-number">{{ index + 1 }}</div>
            <div class="node-info">
              <div class="node-name">{{ node.name || '未命名节点' }}</div>
              <div class="node-meta">
                <span class="node-type">知识节点</span>
                <span class="node-date">{{ formatDate(node.createTime) }}</span>
              </div>
            </div>
          </div>
          <div v-if="node.content" class="node-description">
            {{ getNodePreviewText(node) }}
          </div>
        </div>
        <div class="node-actions">
          <i class="view-icon">👁️</i>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📝</div>
      <h4 class="empty-title">暂无知识节点</h4>
      <p class="empty-description">该图谱还没有创建知识节点</p>
    </div>

    <!-- 节点详情模态框 -->
    <div v-if="showNodeModal" class="node-modal-overlay" @click="closeNodeModal">
      <div class="node-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ selectedNode?.name || '知识节点' }}</h3>
          <button class="close-btn" @click="closeNodeModal">×</button>
        </div>
        <div class="modal-content">
          <div class="node-details">
            <div v-if="selectedNodeStructured" class="detail-section card-section">
              <div class="section-header-line">
                <h4 class="detail-title">知识卡片</h4>
                <span v-if="selectedNodeStructured.isFocus" class="focus-badge">重点节点</span>
              </div>
              <div v-if="selectedNodeCardItems.length > 0" class="card-block">
                <div v-for="item in selectedNodeCardItems" :key="item.label" class="card-item">
                  <div class="card-label">{{ item.label }}</div>
                  <div class="card-value">{{ item.value }}</div>
                </div>
              </div>
            </div>
            <div v-else-if="selectedNode?.content" class="detail-section">
              <h4 class="detail-title">节点内容</h4>
              <p class="detail-content">{{ selectedNode.content }}</p>
            </div>
            <div class="detail-section">
              <h4 class="detail-title">节点信息</h4>
              <div class="detail-info">
                <div class="info-item">
                  <span class="info-label">创建时间：</span>
                  <span class="info-value">{{ formatDate(selectedNode?.createTime) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">更新时间：</span>
                  <span class="info-value">{{ formatDate(selectedNode?.updateTime) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { getKnowledgeGraphNodes } from '@/api/node';
import { buildKnowledgeCardPreviewText, buildUnifiedKnowledgeCardItems, parseStructuredKnowledgeContent } from './knowledgeCardUtils';

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
const selectedNode = ref(null);
const showNodeModal = ref(false);
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

const getNodePreviewText = (node) => {
  return buildKnowledgeCardPreviewText(node?.content);
};

// 选择节点
const selectNode = (node) => {
  selectedNode.value = node;
  showNodeModal.value = true;
  console.log('选择知识节点:', node);
};

// 关闭节点模态框
const closeNodeModal = () => {
  showNodeModal.value = false;
  selectedNode.value = null;
};

// 获取知识节点列表
const fetchNodes = async () => {
  if (!props.graphId) {
    console.warn('图谱ID为空，无法加载知识节点');
    return;
  }

  loading.value = true;
  try {
    console.log('正在加载知识节点列表，图谱ID:', props.graphId);
    
    const response = await getKnowledgeGraphNodes(props.graphId);
    console.log('获取知识节点列表响应:', response);

    if (response && response.rows && Array.isArray(response.rows)) {
      nodes.value = response.rows;
      console.log('知识节点列表加载成功:', nodes.value);
    } else {
      console.warn('知识节点列表响应格式异常:', response);
      nodes.value = [];
    }
  } catch (error) {
    console.error('获取知识节点列表失败:', error);
    nodes.value = [];
  } finally {
    loading.value = false;
  }
};

// 监听图谱ID变化
watch(() => props.graphId, (newGraphId) => {
  if (newGraphId) {
    fetchNodes();
  }
}, { immediate: true });

// 组件挂载时加载数据
onMounted(() => {
  if (props.graphId) {
    fetchNodes();
  }
});

// 暴露方法给父组件
defineExpose({
  fetchNodes
});
</script>

<style scoped>
.student-graph-node-list {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nodes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.nodes-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.node-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.loading-state {
  text-align: center;
  padding: 3rem;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.nodes-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.node-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.node-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.node-item.active {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.node-content {
  flex: 1;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.node-number {
  width: 2rem;
  height: 2rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
}

.node-info {
  flex: 1;
}

.node-name {
  font-size: 1rem;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.node-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.node-description {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
  margin-left: 3rem;
}

.node-actions {
  color: #6b7280;
  font-size: 1.25rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.empty-description {
  margin: 0;
}

/* 节点模态框样式 */
.node-modal-overlay {
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

.node-modal {
  background: white;
  border-radius: 12px;
  width: 90vw;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 1.25rem;
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

.modal-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.detail-section {
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

.detail-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
}

.detail-content {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  font-size: 0.875rem;
}

.info-label {
  color: #6b7280;
  min-width: 80px;
}

.info-value {
  color: #374151;
}
</style>
