<template>
  <span class="workspace-icon" :style="iconStyle" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <template v-if="name === 'arrowLeft'">
        <path d="M15 6L9 12L15 18" />
        <path d="M9 12H20" />
      </template>

      <template v-else-if="name === 'arrowRight'">
        <path d="M9 6L15 12L9 18" />
        <path d="M4 12H15" />
      </template>

      <template v-else-if="name === 'plus'">
        <path d="M12 5V19" />
        <path d="M5 12H19" />
      </template>

      <template v-else-if="name === 'teacher'">
        <path d="M4 7.5L12 4L20 7.5L12 11L4 7.5Z" />
        <path d="M8 10.5V14.5C8 16.433 9.79 18 12 18C14.21 18 16 16.433 16 14.5V10.5" />
        <path d="M20 8V14" />
      </template>

      <template v-else-if="name === 'student'">
        <path d="M3 8L12 4L21 8L12 12L3 8Z" />
        <path d="M7 11.5V15C7 16.933 9.239 18.5 12 18.5C14.761 18.5 17 16.933 17 15V11.5" />
        <path d="M21 9V14" />
      </template>

      <template v-else-if="name === 'courses'">
        <path d="M5 5.5C5 4.672 5.672 4 6.5 4H18V18.5H6.5C5.672 18.5 5 19.172 5 20" />
        <path d="M6.5 4C5.672 4 5 4.672 5 5.5V20" />
        <path d="M8.5 8H14.5" />
        <path d="M8.5 11.5H15.5" />
      </template>

      <template v-else-if="name === 'chapters'">
        <path d="M6 5H18V17H6C4.895 17 4 16.105 4 15V7C4 5.895 4.895 5 6 5Z" />
        <path d="M8.5 8.5H14.5" />
        <path d="M8.5 12H14.5" />
        <path d="M6 5V17" />
      </template>

      <template v-else-if="name === 'knowledgeGraph'">
        <circle cx="6.5" cy="7" r="2" />
        <circle cx="17.5" cy="7" r="2" />
        <circle cx="12" cy="17" r="2" />
        <path d="M8.2 8.1L10.3 15" />
        <path d="M15.8 8.1L13.7 15" />
        <path d="M8.5 7H15.5" />
      </template>

      <template v-else-if="name === 'homework'">
        <path d="M8 4.5H16L19 7.5V19.5H5V7.5L8 4.5Z" />
        <path d="M8 4.5V7.5H5" />
        <path d="M9 11H15" />
        <path d="M9 14.5H15" />
        <path d="M9 18H13" />
      </template>

      <template v-else-if="name === 'discussion'">
        <path d="M5 6.5C5 5.672 5.672 5 6.5 5H16.5C17.328 5 18 5.672 18 6.5V12.5C18 13.328 17.328 14 16.5 14H11L7 17V14H6.5C5.672 14 5 13.328 5 12.5V6.5Z" />
        <path d="M8.5 8.5H14.5" />
        <path d="M8.5 11H12.5" />
      </template>

      <template v-else-if="name === 'materials'">
        <path d="M4 7.5C4 6.672 4.672 6 5.5 6H9L10.6 7.5H18.5C19.328 7.5 20 8.172 20 9V16.5C20 17.328 19.328 18 18.5 18H5.5C4.672 18 4 17.328 4 16.5V7.5Z" />
        <path d="M4 10H20" />
      </template>

      <template v-else-if="name === 'analytics'">
        <path d="M5 19V11" />
        <path d="M10 19V7" />
        <path d="M15 19V13" />
        <path d="M20 19V5" />
      </template>

      <template v-else-if="name === 'sparkles'">
        <path d="M12 3L13.4 7.1L17.5 8.5L13.4 9.9L12 14L10.6 9.9L6.5 8.5L10.6 7.1L12 3Z" />
        <path d="M18.5 14L19.3 16.2L21.5 17L19.3 17.8L18.5 20L17.7 17.8L15.5 17L17.7 16.2L18.5 14Z" />
        <path d="M5.5 14L6.1 15.7L7.8 16.3L6.1 16.9L5.5 18.6L4.9 16.9L3.2 16.3L4.9 15.7L5.5 14Z" />
      </template>

      <template v-else-if="name === 'settings'">
        <path d="M10.6 3H13.4L14.2 5.2C14.61 5.34 15.01 5.51 15.38 5.72L17.6 4.8L19.6 6.8L18.68 9.02C18.89 9.39 19.06 9.79 19.2 10.2L21.4 11V13.8L19.2 14.6C19.06 15.01 18.89 15.41 18.68 15.78L19.6 18L17.6 20L15.38 19.08C15.01 19.29 14.61 19.46 14.2 19.6L13.4 21.8H10.6L9.8 19.6C9.39 19.46 8.99 19.29 8.62 19.08L6.4 20L4.4 18L5.32 15.78C5.11 15.41 4.94 15.01 4.8 14.6L2.6 13.8V11L4.8 10.2C4.94 9.79 5.11 9.39 5.32 9.02L4.4 6.8L6.4 4.8L8.62 5.72C8.99 5.51 9.39 5.34 9.8 5.2L10.6 3Z" />
        <circle cx="12" cy="12.4" r="2.5" />
      </template>

      <template v-else-if="name === 'lessonPlan'">
        <path d="M7 4.5H17C18.105 4.5 19 5.395 19 6.5V17.5C19 18.605 18.105 19.5 17 19.5H7C5.895 19.5 5 18.605 5 17.5V6.5C5 5.395 5.895 4.5 7 4.5Z" />
        <path d="M8.5 8H15.5" />
        <path d="M8.5 11.5H15.5" />
        <path d="M8.5 15H12.5" />
      </template>

      <template v-else-if="name === 'presentation'">
        <path d="M5 5H19V14H5V5Z" />
        <path d="M9 19L12 14L15 19" />
        <path d="M12 14V21" />
        <path d="M8 9H16" />
      </template>

      <template v-else-if="name === 'chat'">
        <path d="M5 6.5C5 5.672 5.672 5 6.5 5H17.5C18.328 5 19 5.672 19 6.5V13.5C19 14.328 18.328 15 17.5 15H10L6 18V15H6.5C5.672 15 5 14.328 5 13.5V6.5Z" />
        <path d="M8.5 9.5H15.5" />
        <path d="M8.5 12H13.5" />
      </template>

      <template v-else-if="name === 'folder'">
        <path d="M4 7.5C4 6.672 4.672 6 5.5 6H9L10.4 7.5H18.5C19.328 7.5 20 8.172 20 9V16.5C20 17.328 19.328 18 18.5 18H5.5C4.672 18 4 17.328 4 16.5V7.5Z" />
        <path d="M4 10H20" />
      </template>

      <template v-else-if="name === 'brain'">
        <path d="M9 5.5C7.343 5.5 6 6.843 6 8.5C6 9.435 6.427 10.273 7.1 10.823C6.427 11.373 6 12.211 6 13.146C6 14.803 7.343 16.146 9 16.146C9.305 16.146 9.599 16.1 9.875 16.014C10.228 17.17 11.303 18 12.5 18C13.697 18 14.772 17.17 15.125 16.014C15.401 16.1 15.695 16.146 16 16.146C17.657 16.146 19 14.803 19 13.146C19 12.211 18.573 11.373 17.9 10.823C18.573 10.273 19 9.435 19 8.5C19 6.843 17.657 5.5 16 5.5C15.695 5.5 15.401 5.546 15.125 5.632C14.772 4.476 13.697 3.646 12.5 3.646C11.303 3.646 10.228 4.476 9.875 5.632C9.599 5.546 9.305 5.5 9 5.5Z" />
        <path d="M12.5 8V14" />
        <path d="M9.5 10.5H12.5" />
        <path d="M12.5 10.5H15.5" />
      </template>

      <template v-else-if="name === 'practice'">
        <path d="M8 4H16L19 7V20H5V7L8 4Z" />
        <path d="M8 4V7H5" />
        <path d="M9 11H15" />
        <path d="M9 14H15" />
        <path d="M9 17H13" />
      </template>

      <template v-else-if="name === 'calendar'">
        <path d="M6 5H18C19.105 5 20 5.895 20 7V18C20 19.105 19.105 20 18 20H6C4.895 20 4 19.105 4 18V7C4 5.895 4.895 5 6 5Z" />
        <path d="M8 3V7" />
        <path d="M16 3V7" />
        <path d="M4 10H20" />
      </template>

      <template v-else-if="name === 'users'">
        <path d="M9 20V18C9 16.895 8.105 16 7 16H5C3.895 16 3 16.895 3 18V20" />
        <circle cx="6" cy="11.5" r="3" />
        <path d="M21 20V18C21 16.895 20.105 16 19 16H17C15.895 16 15 16.895 15 18V20" />
        <circle cx="18" cy="11.5" r="3" />
      </template>

      <template v-else-if="name === 'clock'">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12L15.2 14" />
      </template>

      <template v-else-if="name === 'progress'">
        <path d="M4 17.5C5.447 14.325 8.653 12 12.4 12C15.846 12 18.84 13.962 20 16.8" />
        <path d="M6.5 9.5C7.945 6.405 10.834 4.5 14 4.5C17.314 4.5 20.306 6.61 21.5 9.8" />
        <path d="M3 18.5H21" />
      </template>

      <template v-else>
        <path d="M12 3L13.4 7.1L17.5 8.5L13.4 9.9L12 14L10.6 9.9L6.5 8.5L10.6 7.1L12 3Z" />
        <path d="M18.5 14L19.3 16.2L21.5 17L19.3 17.8L18.5 20L17.7 17.8L15.5 17L17.7 16.2L18.5 14Z" />
      </template>
    </svg>
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  name: {
    type: String,
    default: 'sparkles'
  },
  size: {
    type: Number,
    default: 20
  }
});

const iconStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`
}));
</script>

<style scoped>
.workspace-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: currentColor;
}

.workspace-icon svg {
  width: 100%;
  height: 100%;
}

.workspace-icon path,
.workspace-icon circle {
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
