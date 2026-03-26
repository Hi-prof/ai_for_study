<template>
  <div class="student-graph-viewer">
    <!-- 图谱信息头部 -->
    <div class="graph-header">
      <div class="graph-info">
        <h3 class="graph-title">{{ graph?.name || '知识图谱' }}</h3>
        <div class="graph-meta">
          <span class="node-count">{{ nodeCount }} 个节点</span>
          <span class="link-count">{{ linkCount }} 个连接</span>
        </div>
      </div>
      <div class="view-controls">
        <button 
          class="control-btn" 
          :class="{ active: viewMode === 'graph' }"
          @click="viewMode = 'graph'"
        >
          图谱视图
        </button>
        <button 
          class="control-btn" 
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          列表视图
        </button>
      </div>
    </div>

    <!-- 图谱内容 -->
    <div class="graph-content">
      <!-- 图谱可视化视图 -->
      <div v-if="viewMode === 'graph'" class="graph-view">
        <iframe
          v-if="graph"
          :key="iframeKey"
          :src="getGraphUrl()"
          class="graph-iframe"
          frameborder="0"
          @load="onIframeLoad"
          @error="onIframeError"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
        ></iframe>
        <div v-else class="graph-placeholder">
          <div class="placeholder-icon">🕸️</div>
          <p class="placeholder-text">知识图谱加载中...</p>
        </div>
      </div>

      <!-- 节点列表视图 -->
      <div v-else-if="viewMode === 'list'" class="list-view">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p class="loading-text">正在加载节点列表...</p>
        </div>
        <div v-else-if="nodes.length > 0" class="nodes-grid">
          <div
            v-for="(node, index) in nodes"
            :key="node.id"
            class="node-card"
            @click="selectNode(node)"
          >
            <div class="node-header">
              <div class="node-number">{{ index + 1 }}</div>
              <div class="node-name">{{ node.name || '未命名节点' }}</div>
            </div>
            <div v-if="node.content" class="node-content">
              {{ truncateText(getNodePreviewText(node), 100) }}
            </div>
            <div class="node-footer">
              <span class="node-date">{{ formatDate(node.createTime) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-nodes">
          <div class="empty-icon">📝</div>
          <p class="empty-text">暂无知识节点</p>
        </div>
      </div>
    </div>

    <!-- 节点详情模态框 -->
    <div v-if="showNodeDetail" class="node-detail-overlay" @click="closeNodeDetail">
      <div class="node-detail-modal" @click.stop>
        <div class="detail-header">
          <h3 class="detail-title">{{ selectedNode?.name || '知识节点' }}</h3>
          <button class="close-btn" @click="closeNodeDetail">×</button>
        </div>
        <div class="detail-content">
          <div v-if="selectedNodeStructured" class="content-section card-section">
            <div v-if="selectedNodeStructured.isFocus" class="card-focus-row">
              <span class="focus-badge">重点节点</span>
            </div>
            <div v-if="selectedNodeCardItems.length > 0" class="card-block">
              <div v-for="item in selectedNodeCardItems" :key="item.label" class="card-item">
                <div class="card-label">{{ item.label }}</div>
                <div class="card-value">{{ item.value }}</div>
              </div>
            </div>
          </div>
          <div v-else-if="selectedNode?.content" class="content-section">
            <h4 class="section-title">节点内容</h4>
            <p class="section-text">{{ selectedNode.content }}</p>
          </div>
          <div class="info-section">
            <h4 class="section-title">基本信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">创建时间</span>
                <span class="info-value">{{ formatDate(selectedNode?.createTime) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">更新时间</span>
                <span class="info-value">{{ formatDate(selectedNode?.updateTime) }}</span>
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
import { buildKnowledgeCardPreviewText, buildUnifiedKnowledgeCardItems, parseStructuredKnowledgeContent } from './knowledgeCardUtils';

// 定义 props
const props = defineProps({
  graph: {
    type: Object,
    required: true
  },
  courseId: {
    type: [String, Number],
    required: true
  }
});

// 响应式数据
const viewMode = ref('graph');
const loading = ref(false);
const nodes = ref([]);
const selectedNode = ref(null);
const showNodeDetail = ref(false);
const iframeKey = ref(0);

// 计算属性
const nodeCount = computed(() => nodes.value.length);
const linkCount = computed(() => Math.floor(nodeCount.value * 0.6)); // 简化计算
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

// 截断文本
const truncateText = (text, maxLength) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const getNodePreviewText = (node) => {
  return buildKnowledgeCardPreviewText(node?.content);
};

// 获取图谱URL
const getGraphUrl = () => {
  if (!props.graph) return '';
  
  const hostname = window.location.hostname;
  const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '0.0.0.0';
  
  const baseUrl = isProduction ? '/#/graph' : '/graph';
  const params = `embedded=true&courseId=${props.courseId}&graphId=${props.graph.id}&readonly=true&t=${Date.now()}`;
  
  return `${baseUrl}?${params}`;
};

// iframe事件处理
const onIframeLoad = () => {
  console.log('知识图谱iframe加载完成');
};

const onIframeError = (error) => {
  console.error('知识图谱iframe加载失败:', error);
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

// 获取节点列表
const fetchNodes = async () => {
  if (!props.graph?.id) return;

  loading.value = true;
  try {
    const response = await getKnowledgeGraphNodes(props.graph.id);
    if (response && response.rows) {
      nodes.value = response.rows;
    } else {
      nodes.value = [];
    }
  } catch (error) {
    console.error('获取节点列表失败:', error);
    nodes.value = [];
  } finally {
    loading.value = false;
  }
};

// 监听图谱变化
watch(() => props.graph, (newGraph) => {
  if (newGraph) {
    fetchNodes();
  }
}, { immediate: true });

// 监听视图模式变化
watch(viewMode, (newMode) => {
  if (newMode === 'list' && nodes.value.length === 0) {
    fetchNodes();
  }
});

// 组件挂载
onMounted(() => {
  if (props.graph) {
    fetchNodes();
  }
});
</script>

<style scoped>
.student-graph-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.graph-info {
  flex: 1;
}

.graph-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.graph-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.view-controls {
  display: flex;
  gap: 0.5rem;
}

.control-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  background-color: #f3f4f6;
}

.control-btn.active {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.graph-content {
  flex: 1;
  position: relative;
}

.graph-view {
  height: 100%;
}

.graph-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.graph-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.placeholder-text {
  font-size: 1.125rem;
  margin: 0;
}

.list-view {
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
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
  margin: 0;
}

.nodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.node-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.node-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.node-number {
  width: 1.5rem;
  height: 1.5rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.node-name {
  font-weight: 500;
  color: #1f2937;
}

.node-content {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.node-footer {
  font-size: 0.75rem;
  color: #9ca3af;
}

.empty-nodes {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-text {
  margin: 0;
}

/* 节点详情模态框 */
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
  max-width: 600px;
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

.detail-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.content-section,
.info-section {
  margin-bottom: 1.5rem;
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

.card-focus-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
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
