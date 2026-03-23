<template>
  <div class="my-graph-list">
    <GraphList @select-graph="$emit('select-graph', $event)" />
  </div>
</template>

<script setup>
import GraphList from '@/ui/graph/GraphList.vue';

defineEmits(['select-graph']);
</script>

<style scoped>
.my-graph-list {
  height: 100%;
  width: 100%;
}
</style> 