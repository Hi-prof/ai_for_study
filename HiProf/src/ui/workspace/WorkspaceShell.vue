<template>
  <div class="workspace-shell" :class="`workspace-shell--${tone}`">
    <div class="workspace-shell__glow workspace-shell__glow--one"></div>
    <div class="workspace-shell__glow workspace-shell__glow--two"></div>

    <section class="workspace-hero">
      <div class="workspace-hero__top">
        <button type="button" class="workspace-back-button" @click="$emit('back-home')">
          <WorkspaceIcon name="arrowLeft" :size="18" />
          <span>返回首页</span>
        </button>

        <div class="workspace-role-badge">
          <WorkspaceIcon :name="tone === 'teacher' ? 'teacher' : 'student'" :size="16" />
          <span>{{ roleLabel }}</span>
        </div>
      </div>

      <div class="workspace-hero__content">
        <div class="workspace-hero__copy">
          <p v-if="subtitle" class="workspace-hero__eyebrow">{{ subtitle }}</p>
          <h1>{{ title }}</h1>
          <p v-if="description" class="workspace-hero__description">{{ description }}</p>
        </div>
      </div>

    </section>

    <section class="workspace-main">
      <aside class="workspace-nav" aria-label="工作台导航">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="workspace-nav__item"
          :class="{ 'is-active': activeTab === tab.key }"
          :aria-current="activeTab === tab.key ? 'page' : undefined"
          @click="$emit('change-tab', tab.key)"
        >
          <span class="workspace-nav__icon">
            <WorkspaceIcon :name="tab.icon" :size="18" />
          </span>
          <span class="workspace-nav__text">
            <strong>{{ tab.label }}</strong>
            <span>{{ tab.description }}</span>
          </span>
          <span class="workspace-nav__state">
            <span v-if="activeTab === tab.key">当前</span>
            <WorkspaceIcon v-else name="arrowRight" :size="14" />
          </span>
        </button>
      </aside>

      <section class="workspace-panel">
        <header class="workspace-panel__header">
          <div class="workspace-panel__title-group">
            <h2>{{ activeTabMeta.label }}</h2>
            <p class="workspace-panel__description">{{ activeTabMeta.description }}</p>
          </div>

          <slot name="panel-actions"></slot>
        </header>

        <div class="workspace-panel__body">
          <slot></slot>
        </div>
      </section>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import WorkspaceIcon from '@/ui/workspace/WorkspaceIcon.vue';
import '@/teacher/styles/variables.css';
import '@/styles/workspace/workspace-shell.css';

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
  description: {
    type: String,
    default: ''
  },
  roleLabel: {
    type: String,
    required: true
  },
  tabs: {
    type: Array,
    default: () => []
  },
  activeTab: {
    type: String,
    required: true
  }
});

defineEmits(['back-home', 'change-tab']);

const activeTabMeta = computed(() => {
  return props.tabs.find(tab => tab.key === props.activeTab) || props.tabs[0] || {
    label: '工作台',
    description: '统一入口'
  };
});
</script>
