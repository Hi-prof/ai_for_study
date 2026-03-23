<template>
  <div class="node-table-row-container">
    <!-- 当前节点行 -->
    <div class="table-row" :class="{ 'search-result': node.isSearchResult }">
      <div class="table-col col-level">
        <div class="level-indicator">
          <span class="level-indent" :style="{ width: `${(level - 1) * 12}px` }"></span>
          <span v-if="hasChildren" class="expand-toggle" @click="toggleNode">
            {{ node.expanded ? '▼' : '▶' }}
          </span>
          <span v-else class="level-dot">•</span>
          <span class="level-text">L{{ level }}</span>
        </div>
      </div>
      
      <div class="table-col col-name">
        <div class="node-name-container">
          <span class="node-name">{{ node.name || '未命名节点' }}</span>
        </div>
      </div>
      
      <div class="table-col col-content">
        <div class="node-content-preview">
          {{ node.content || '暂无内容' }}
        </div>
      </div>
      
      <div class="table-col col-expand" v-if="editable">
        <button
          v-if="hasChildren"
          class="btn btn-sm btn-outline expand-btn"
          @click="toggleNode"
          :title="node.expanded ? '收起子节点' : '展开子节点'"
        >
          {{ node.expanded ? '收起' : '展开' }}
        </button>
      </div>
      
      <div class="table-col col-actions" v-if="editable">
        <button
          class="btn btn-sm btn-outline edit-btn"
          @click="editNode"
          title="编辑节点"
        >
          编辑
        </button>
        <button
          class="btn btn-sm btn-secondary add-btn"
          @click="addChildNode"
          title="添加子节点"
        >
          添加子节点
        </button>
        <button
          class="btn btn-sm btn-danger delete-btn"
          @click="deleteNode"
          title="删除节点"
        >
          删除
        </button>
      </div>
    </div>

    <!-- 子节点 -->
    <template v-if="node.expanded && hasChildren">
      <NodeTableRow
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :editable="editable"
        @toggle="$emit('toggle', $event)"
        @edit="$emit('edit', $event)"
        @add-child="$emit('add-child', $event)"
        @delete="$emit('delete', $event)"
      />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Props
const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 1
  },
  editable: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['toggle', 'edit', 'add-child', 'delete']);

// Computed
const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0;
});

// Methods
const toggleNode = () => {
  emit('toggle', props.node.id);
};

const editNode = () => {
  emit('edit', props.node);
};

const addChildNode = () => {
  emit('add-child', props.node);
};

const deleteNode = () => {
  if (confirm(`确定要删除节点 "${props.node.name}" 及其所有子节点吗？`)) {
    emit('delete', props.node);
  }
};
</script>

<style scoped>
.node-table-row-container {
  width: 100%;
}

.table-row {
  display: grid;
  grid-template-columns: 120px 250px 1fr 120px 200px;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  align-items: center;
  transition: background-color 0.2s;
  min-height: 60px;
}

.table-row:hover {
  background-color: #f8fafc;
}

.table-row.search-result {
  background-color: #fef3c7;
}

.table-col {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: 0.5rem 0;
}

.col-level {
  justify-content: center;
}

.col-name {
  justify-content: center;
}

.col-content {
  justify-content: center;
}

.col-expand {
  justify-content: center;
  align-items: center;
}

.col-actions {
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.level-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  width: 100%;
}

.level-indent {
  height: 1px;
  background-color: transparent;
  flex-shrink: 0;
}

.expand-toggle {
  cursor: pointer;
  color: #6366f1;
  font-weight: bold;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.expand-toggle:hover {
  background-color: #e0e7ff;
}

.level-dot {
  color: #9ca3af;
  font-size: 1rem;
}

.level-text {
  font-size: 0.75rem;
  color: #6b7280;
  background-color: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.node-name-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.node-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
  line-height: 1.25rem;
  text-align: center;
}

.node-content-preview {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.25rem;
  max-height: 2.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-align: center;
  width: 100%;
}



.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  text-decoration: none;
  white-space: nowrap;
}

.btn-sm {
  padding: 0.125rem 0.375rem;
  font-size: 0.75rem;
}

.btn-outline {
  background-color: transparent;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline:hover {
  background-color: #f3f4f6;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
  border: 1px solid #dc2626;
}

.btn-danger:hover {
  background-color: #dc2626;
}

.expand-btn {
  min-width: 80px;
}

.edit-btn {
  color: #3b82f6;
  border-color: #3b82f6;
}

.edit-btn:hover {
  background-color: #dbeafe;
}

.add-btn {
  color: #059669;
  border-color: #059669;
}

.add-btn:hover {
  background-color: #d1fae5;
}

.delete-btn {
  font-size: 0.75rem;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .table-row {
    grid-template-columns: 100px 200px 1fr 100px 180px;
    gap: 0.5rem;
    padding: 0.5rem;
    min-height: 50px;
  }

  .col-actions {
    gap: 0.25rem;
  }

  .btn {
    padding: 0.125rem 0.25rem;
    font-size: 0.625rem;
  }

  .expand-btn {
    min-width: 60px;
  }
}

@media (max-width: 768px) {
  .table-row {
    grid-template-columns: 80px 150px 1fr 80px 120px;
    gap: 0.25rem;
    padding: 0.5rem;
    min-height: 45px;
  }

  .level-indicator {
    gap: 0.25rem;
  }

  .level-text {
    font-size: 0.625rem;
    padding: 0.0625rem 0.25rem;
  }

  .node-name {
    font-size: 0.75rem;
  }

  .node-content-preview {
    font-size: 0.75rem;
    -webkit-line-clamp: 1;
  }

  .col-actions {
    flex-direction: column;
    gap: 0.125rem;
  }

  .btn {
    padding: 0.0625rem 0.25rem;
    font-size: 0.625rem;
    min-width: auto;
  }

  .expand-btn {
    min-width: 50px;
  }
}
</style>
