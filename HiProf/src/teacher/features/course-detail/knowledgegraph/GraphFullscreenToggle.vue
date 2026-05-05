<template>
  <button
    class="graph-fullscreen-toggle"
    type="button"
    :title="toggleLabel"
    :aria-label="toggleLabel"
    @click.stop="emitToggle"
  >
    <Close v-if="active" />
    <FullScreen v-else />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Close, FullScreen } from '@element-plus/icons-vue';

const props = defineProps<{
  active: boolean;
}>();

const emit = defineEmits<{
  (event: 'toggle'): void;
}>();

const toggleLabel = computed(() => props.active ? '退出全屏' : '全屏');

function emitToggle() {
  emit('toggle');
}
</script>

<style scoped>
.graph-fullscreen-toggle {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.92);
  color: #1f2937;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
}

.graph-fullscreen-toggle:hover {
  border-color: #0e7490;
  color: #0e7490;
  background: #ffffff;
}

.graph-fullscreen-toggle:focus-visible {
  outline: 2px solid #0e7490;
  outline-offset: 2px;
}

.graph-fullscreen-toggle svg {
  width: 18px;
  height: 18px;
}
</style>
