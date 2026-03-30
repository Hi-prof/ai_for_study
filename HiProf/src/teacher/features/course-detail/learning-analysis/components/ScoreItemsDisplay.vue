<template>
  <div class="items-list">
    <div
      v-for="item in scoreItems"
      :key="item.id"
      class="item-card"
      :class="getItemTypeClass(item.itemType)"
    >
      <div class="item-header">
        <span class="item-name">{{ item.itemName }}</span>
        <span class="item-type-badge" :class="item.itemType">
          {{ getItemTypeText(item.itemType) }}
        </span>
      </div>
      <div class="item-details">
        <div class="item-stat">
          <span class="stat-label">最高分:</span>
          <span class="stat-value">{{ item.maxScore }}</span>
        </div>
        <div class="item-stat">
          <span class="stat-label">权重:</span>
          <span class="stat-value">{{ item.itemWeight }}</span>
        </div>
        <div class="item-stat">
          <span class="stat-label">记录数:</span>
          <span class="stat-value">{{ getItemRecordCount(item.id) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import {
  getItemTypeText,
  getItemTypeClass,
  getItemRecordCount as getRecordCount
} from '../composables/useAnalyticsUtils'

const props = defineProps({
  scoreItems: {
    type: Array,
    default: () => []
  },
  scoreRecords: {
    type: Array,
    default: () => []
  }
})

const getItemRecordCount = (itemId) => {
  return getRecordCount(itemId, props.scoreRecords)
}
</script>
