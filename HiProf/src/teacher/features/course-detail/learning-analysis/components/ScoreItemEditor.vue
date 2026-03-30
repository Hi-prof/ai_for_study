<template>
  <div class="score-item-editor">
    <button class="btn btn-primary" @click="openEditor">编辑评分项目</button>

    <div v-if="isEditorOpen" class="editor-modal-overlay">
      <div class="editor-modal">
        <!-- 标题和关闭按钮 -->
        <div class="modal-title-bar">
          <h3 class="modal-title">编辑评分项目</h3>
          <button class="close-btn" @click="closeEditor">&times;</button>
        </div>

        <!-- 主要内容区域 -->
        <div class="modal-main">
          <div class="item-grid">
            <!-- Grid Header -->
            <span class="header-name">评分项目名</span>
            <span class="header-type">项目类型</span>
            <span class="header-score">最高分</span>
            <span class="header-weight">权重</span>
            <span class="header-action">操作</span>

            <!-- Grid Rows -->
            <template v-for="item in editableItems" :key="item.id">
              <input type="text" v-model="item.itemName" placeholder="项目名称" class="form-input" />
              <select v-model="item.itemType" class="form-select">
                <option value="regular">常规评分</option>
                <option value="extra">额外加分</option>
                <option value="penalty">扣分项目</option>
              </select>
              <input type="number" v-model="item.maxScore" placeholder="最高分" class="form-input" />
              <div class="input-with-percent">
                <input
                  type="number"
                  :value="(item.itemWeight * 100).toFixed(1)"
                  @input="item.itemWeight = parseFloat($event.target.value) / 100"
                  placeholder="权重"
                  class="form-input"
                />
                <span>%</span>
              </div>
              <button class="btn btn-danger" @click="deleteItem(item)">删除</button>
            </template>
          </div>

          <!-- 底部操作区域 -->
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="addNewItem">新增项目</button>
            
            <div class="weight-summary">
              <span :class="{ 'invalid-weight': !isWeightSumValid }">
                权重总和: {{ (totalWeight * 100).toFixed(1) }}%
              </span>
              <span v-if="!isWeightSumValid" class="weight-warning">
                (必须等于 100%)
              </span>
            </div>

            <div class="action-buttons">
              <button class="btn btn-secondary" @click="closeEditor">取消</button>
              <button
                class="btn btn-primary"
                @click="saveChanges"
                :disabled="isSaving || !isWeightSumValid"
              >
                {{ isSaving ? '保存中...' : '保存更改' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, computed } from 'vue';
import {
  createScoreItem,
  updateScoreItem,
  deleteScoreItem,
  getScoreItemsByCourse
} from '@/api/summaries';

// 样式已整合到 teacher-course-analytics.css 中，无需单独导入

const props = defineProps({
  scoreItems: {
    type: Array,
    default: () => []
  },
  courseId: {
    type: [String, Number],
    required: true
  }
});

const emit = defineEmits(['save', 'loading']);

const isEditorOpen = ref(false);
const editableItems = ref([]);
const originalItems = ref([]);
const isSaving = ref(false);

// Computed property to calculate the sum of weights
const totalWeight = computed(() => {
  return editableItems.value.reduce((sum, item) => sum + parseFloat(item.itemWeight || 0), 0);
});

// Computed property to check if the total weight is valid (equals 1)
// Uses an epsilon to handle floating-point inaccuracies
const isWeightSumValid = computed(() => {
  return Math.abs(totalWeight.value - 1.0) < 0.001;
});

// Deep copy props to a local ref to avoid direct mutation
watch(() => props.scoreItems, (newItems) => {
  editableItems.value = JSON.parse(JSON.stringify(newItems));
  originalItems.value = JSON.parse(JSON.stringify(newItems));
}, { deep: true, immediate: true });

const openEditor = () => {
  // Reset local state from props every time the editor is opened
  editableItems.value = JSON.parse(JSON.stringify(props.scoreItems));
  originalItems.value = JSON.parse(JSON.stringify(props.scoreItems));
  isEditorOpen.value = true;
};

const closeEditor = () => {
  isEditorOpen.value = false;
};

const addNewItem = () => {
  editableItems.value.push({
    id: `new-${Date.now()}`,
    itemName: '',
    itemType: 'regular', // Default type
    maxScore: 100,
    itemWeight: 0,
    isNew: true // Flag to identify new items
  });
};

const deleteItem = (itemToDelete) => {
  editableItems.value = editableItems.value.filter(item => item.id !== itemToDelete.id);
};

/**
 * 比较两个数组，找出新增、修改、删除的项目
 */
const getDifferences = (original, current) => {
  const toCreate = current.filter(item => item.isNew);
  const toUpdate = current.filter(item => {
    if (item.isNew) return false;
    const originalItem = original.find(orig => orig.id === item.id);
    if (!originalItem) return false;

    return (
      originalItem.itemName !== item.itemName ||
      originalItem.itemType !== item.itemType ||
      originalItem.maxScore !== item.maxScore ||
      originalItem.itemWeight !== item.itemWeight
    );
  });
  const toDelete = original.filter(orig =>
    !current.some(curr => curr.id === orig.id)
  );

  return { toCreate, toUpdate, toDelete };
};

const saveChanges = async () => {
  try {
    isSaving.value = true;
    emit('loading', true);

    const { toCreate, toUpdate, toDelete } = getDifferences(originalItems.value, editableItems.value);

    // 执行删除操作
    for (const item of toDelete) {
      if (!item.isNew) {
        const result = await deleteScoreItem(item.id);
        if (result.code !== 200) {
          throw new Error(`删除项目失败: ${result.message}`);
        }
      }
    }

    // 执行新增操作
    for (const item of toCreate) {
      const itemData = {
        courseId: props.courseId,
        itemName: item.itemName,
        itemType: item.itemType,
        itemWeight: item.itemWeight,
        maxScore: item.maxScore
      };

      const result = await createScoreItem(itemData);
      if (result.code !== 200) {
        throw new Error(`新增项目失败: ${result.message}`);
      }
    }

    // 执行更新操作
    for (const item of toUpdate) {
      const itemData = {
        id: item.id,
        courseId: props.courseId,
        itemName: item.itemName,
        itemType: item.itemType,
        itemWeight: item.itemWeight,
        maxScore: item.maxScore
      };

      const result = await updateScoreItem(itemData);
      if (result.code !== 200) {
        throw new Error(`更新项目失败: ${result.message}`);
      }
    }

    // 重新获取最新数据
    const refreshResult = await getScoreItemsByCourse(props.courseId);
    if (refreshResult.code === 200) {
      emit('save', refreshResult.data || refreshResult.rows || []);
    }

    closeEditor();
  } catch (error) {
    console.error('保存评分项目失败:', error);
    alert(`保存失败: ${error.message}`);
  } finally {
    isSaving.value = false;
    emit('loading', false);
  }
};
</script>