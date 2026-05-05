import { ref, type Ref } from 'vue';
import type { RelationGraphComponent } from 'relation-graph-vue3';

export function useGraphFullscreen(
  graphRef: Ref<RelationGraphComponent | null>,
  componentName: string
) {
  const fullscreenContainerRef = ref<HTMLElement | null>(null);
  const isGraphFullscreen = ref(false);

  function getGraphInstance() {
    return graphRef.value?.getInstance?.();
  }

  function syncRelationGraphFullscreenState(value: boolean) {
    isGraphFullscreen.value = value;

    const graphInstance = getGraphInstance();
    if (graphInstance) {
      graphInstance.options.fullscreen = value;
    }
  }

  function handleRelationGraphFullscreen(newValue: boolean) {
    syncRelationGraphFullscreenState(newValue);
  }

  function syncNativeFullscreenState() {
    syncRelationGraphFullscreenState(document.fullscreenElement === fullscreenContainerRef.value);
  }

  async function toggleGraphFullscreen() {
    const target = fullscreenContainerRef.value;
    if (!target) {
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await target.requestFullscreen();
      }
    } catch (error) {
      console.error(`${componentName}: 切换全屏失败:`, error);
    }
  }

  return {
    fullscreenContainerRef,
    getGraphInstance,
    handleRelationGraphFullscreen,
    isGraphFullscreen,
    syncNativeFullscreenState,
    toggleGraphFullscreen
  };
}
