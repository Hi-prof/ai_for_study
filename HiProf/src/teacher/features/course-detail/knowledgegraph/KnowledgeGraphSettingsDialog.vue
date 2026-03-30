<template>
  <BaseDialog
    :model-value="modelValue"
    title="知识图谱设置"
    width="90%"
    max-width="600px"
    :loading="loading"
    @update:model-value="$emit('update:modelValue', $event)"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <div class="settings-content">
      <!-- 显示设置 -->
      <div class="settings-section">
        <h4 class="section-title">显示设置</h4>
        <div class="form-group">
          <label class="form-label">节点样式</label>
          <div class="radio-group">
            <label class="radio-item">
              <input
                v-model="formData.nodeStyle"
                type="radio"
                value="circle"
                class="radio-input"
              />
              <span class="radio-label">圆形</span>
            </label>
            <label class="radio-item">
              <input
                v-model="formData.nodeStyle"
                type="radio"
                value="rect"
                class="radio-input"
              />
              <span class="radio-label">矩形</span>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">连线样式</label>
          <div class="radio-group">
            <label class="radio-item">
              <input
                v-model="formData.linkStyle"
                type="radio"
                value="straight"
                class="radio-input"
              />
              <span class="radio-label">直线</span>
            </label>
            <label class="radio-item">
              <input
                v-model="formData.linkStyle"
                type="radio"
                value="curve"
                class="radio-input"
              />
              <span class="radio-label">曲线</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 布局设置 -->
      <div class="settings-section">
        <h4 class="section-title">布局设置</h4>
        <div class="form-group">
          <label class="form-label">布局算法</label>
          <select v-model="formData.layoutType" class="form-select">
            <option value="center">中心布局</option>
            <option value="real-tree">树形布局</option>
            <option value="bidirectional-tree">双向树布局</option>
          </select>
        </div>

        <!-- 树形布局子选项 -->
        <div v-if="formData.layoutType === 'real-tree'" class="form-group">
          <label class="form-label">树形方向</label>
          <div class="radio-group">
            <label class="radio-item">
              <input
                v-model="formData.treeDirection"
                type="radio"
                value="horizontal"
                class="radio-input"
              />
              <span class="radio-label">水平树形</span>
            </label>
            <label class="radio-item">
              <input
                v-model="formData.treeDirection"
                type="radio"
                value="vertical"
                class="radio-input"
              />
              <span class="radio-label">垂直树形</span>
            </label>
          </div>
        </div>

        <!-- 双向树布局说明 -->
        <div v-if="formData.layoutType === 'bidirectional-tree'" class="form-group">
          <div class="layout-description">
            <span class="description-text">双向树布局：从中心节点向左右两侧展开的水平树形结构</span>
          </div>
        </div>
        <div class="form-group">
          <div class="checkbox-group">
            <label class="checkbox-item">
              <input
                v-model="formData.showLabels"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-label">显示节点标签</span>
            </label>
            <label class="checkbox-item">
              <input
                v-model="formData.enableZoom"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-label">启用缩放功能</span>
            </label>
            <label class="checkbox-item">
              <input
                v-model="formData.enableDrag"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-label">启用拖拽功能</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 高级设置 -->
      <div class="settings-section">
        <h4 class="section-title">高级设置</h4>
        <div class="form-group">
          <label class="form-label">最大显示节点数</label>
          <input
            v-model.number="formData.maxNodes"
            type="number"
            class="form-input"
            min="10"
            max="1000"
            placeholder="100"
          />
          <small class="form-hint">建议不超过500个节点以保证性能</small>
        </div>
        <div class="form-group">
          <label class="form-label">动画效果</label>
          <div class="checkbox-group">
            <label class="checkbox-item">
              <input
                v-model="formData.enableAnimation"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-label">启用动画效果</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </BaseDialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import BaseDialog from '@/teacher/components/shared/BaseDialog.vue';
import '@/teacher/styles/knowledge-graph-settings-dialog.css';

// 定义props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  courseId: {
    type: [String, Number],
    required: true
  },
  knowledgeGraph: {
    type: Object,
    default: null
  }
});

// 定义emits
const emit = defineEmits(['update:modelValue', 'settings-updated']);

// 响应式数据
const loading = ref(false);

// 表单数据
const formData = reactive({
  nodeStyle: 'rectangle',
  linkStyle: 'straight',
  layoutType: 'tree',
  treeDirection: 'horizontal', // 新增：树形方向
  showLabels: true,
  enableZoom: true,
  enableDrag: true,
  maxNodes: 100,
  enableAnimation: true
});

// 监听知识图谱变化，初始化表单数据
watch(() => props.knowledgeGraph, (newGraph) => {
  if (newGraph) {
    // 这些设置项目前是模拟的，后续会从实际的配置中读取
    formData.nodeStyle = 'rectangle';
    formData.linkStyle = 'straight';
    formData.layoutType = 'tree';
    formData.treeDirection = 'horizontal';
    formData.showLabels = true;
    formData.enableZoom = true;
    formData.enableDrag = true;
    formData.maxNodes = 100;
    formData.enableAnimation = true;
  }
}, { immediate: true });

// 确认保存设置
const handleConfirm = async () => {
  if (!props.knowledgeGraph) {
    return;
  }

  loading.value = true;
  
  try {
    // TODO: 这里后续需要调用实际的API来保存设置
    console.log('保存知识图谱设置:', {
      graphId: props.knowledgeGraph.id,
      settings: { ...formData }
    });
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 触发设置更新事件，传递设置数据
    emit('settings-updated', { ...formData });

    // 关闭对话框
    emit('update:modelValue', false);
    
  } catch (error) {
    console.error('保存设置失败:', error);
    alert('保存设置失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 取消操作
const handleCancel = () => {
  // 重置表单数据到默认值
  formData.nodeStyle = 'circle';
  formData.linkStyle = 'curve';
  formData.layoutType = 'center';
  formData.treeDirection = 'horizontal';
  formData.showLabels = true;
  formData.enableZoom = true;
  formData.enableDrag = true;
  formData.maxNodes = 100;
  formData.enableAnimation = true;

  emit('update:modelValue', false);
};
</script>
