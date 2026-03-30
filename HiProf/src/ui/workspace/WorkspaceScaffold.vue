<template>
  <main class="workspace-scaffold" :class="toneClass">
    <header class="workspace-scaffold__topbar">
      <div class="workspace-scaffold__brand-group">
        <button
          type="button"
          class="workspace-scaffold__return-button"
          @click="$emit('back')"
        >
          <WorkspaceIcon :name="backIcon" :size="16" />
          <span>{{ backLabel }}</span>
        </button>

        <div class="workspace-scaffold__brand">
          <span class="workspace-scaffold__brand-copy">
            <strong>{{ title }}</strong>
            <small v-if="subtitle">{{ subtitle }}</small>
          </span>
        </div>
      </div>

      <div class="workspace-scaffold__user">
        <slot name="topbar-extra">
          <span class="workspace-scaffold__user-copy">
            <strong>{{ resolvedUserName }}</strong>
            <small v-if="roleLabel">{{ roleLabel }}</small>
          </span>
        </slot>
      </div>
    </header>

    <div class="workspace-scaffold__shell">
      <aside class="workspace-scaffold__sidebar" :aria-label="navAriaLabel">
        <div class="workspace-scaffold__sidebar-header">
          <h1>{{ sidebarTitle || title }}</h1>
          <p v-if="sidebarDescription">{{ sidebarDescription }}</p>
        </div>

        <nav class="workspace-scaffold__nav">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="workspace-scaffold__nav-item"
            :class="{ 'is-active': activeTab === tab.key }"
            :aria-current="activeTab === tab.key ? 'page' : undefined"
            @click="$emit('change-tab', tab.key)"
          >
            <span class="workspace-scaffold__nav-icon">
              <WorkspaceIcon :name="tab.icon" :size="18" />
            </span>
            <span class="workspace-scaffold__nav-copy">
              <strong>{{ tab.label }}</strong>
              <small v-if="showNavDescriptions && tab.description">{{ tab.description }}</small>
            </span>
          </button>
        </nav>
      </aside>

      <section class="workspace-scaffold__panel">
        <div class="workspace-scaffold__panel-body">
          <slot />
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed } from 'vue';
import WorkspaceIcon from '@/ui/workspace/WorkspaceIcon.vue';
import '@/teacher/styles/variables.css';
import '@/styles/workspace/workspace-scaffold.css';

const props = defineProps({
  tone: {
    type: String,
    default: 'teacher'
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  sidebarTitle: {
    type: String,
    default: ''
  },
  sidebarDescription: {
    type: String,
    default: ''
  },
  roleLabel: {
    type: String,
    default: ''
  },
  userName: {
    type: String,
    default: ''
  },
  backLabel: {
    type: String,
    default: '返回'
  },
  backIcon: {
    type: String,
    default: 'arrowLeft'
  },
  navAriaLabel: {
    type: String,
    default: '工作台导航'
  },
  tabs: {
    type: Array,
    default: () => []
  },
  activeTab: {
    type: String,
    default: ''
  },
  showNavDescriptions: {
    type: Boolean,
    default: false
  }
});

defineEmits(['back', 'change-tab']);

const toneClass = computed(() => `workspace-scaffold--${props.tone}`);

const resolvedUserName = computed(() => {
  return props.userName || props.roleLabel || '当前用户';
});
</script>
