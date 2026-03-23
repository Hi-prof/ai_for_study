<template>
  <div class="workspace-feature-grid">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="workspace-feature-card"
      :class="`workspace-feature-card--${item.tone || 'primary'}`"
      @click="$emit('select', item.key)"
    >
      <div class="workspace-feature-card__head">
        <span class="workspace-feature-card__icon">
          <WorkspaceIcon :name="item.icon" :size="22" />
        </span>
        <span class="workspace-feature-card__tag">{{ item.tag }}</span>
      </div>

      <div class="workspace-feature-card__body">
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
      </div>

      <div class="workspace-feature-card__footer">
        <span>{{ item.buttonText }}</span>
        <WorkspaceIcon name="arrowRight" :size="16" />
      </div>
    </button>
  </div>
</template>

<script setup>
import WorkspaceIcon from '@/ui/workspace/WorkspaceIcon.vue';
import '@/styles/workspace/feature-grid.css';

defineProps({
  items: {
    type: Array,
    default: () => []
  }
});

defineEmits(['select']);
</script>
