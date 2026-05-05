<template>
  <div class="center-layout-container" :class="layoutCssClass">
    <div ref="fullscreenContainerRef" class="center-layout-viewport">
      <button
        class="graph-fullscreen-toggle"
        type="button"
        :title="isGraphFullscreen ? '退出全屏' : '全屏'"
        :aria-label="isGraphFullscreen ? '退出全屏' : '全屏'"
        @click.stop="toggleGraphFullscreen"
      >
        <Close v-if="isGraphFullscreen" />
        <FullScreen v-else />
      </button>
      <RelationGraph
        ref="centerGraphRef"
        :options="currentCenterOptions"
        :on-node-click="onNodeClick"
        :on-line-click="onLineClick"
        :on-fullscreen="handleRelationGraphFullscreen"
      >
        <template #graph-plug>
        </template>
      </RelationGraph>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { Close, FullScreen } from '@element-plus/icons-vue';
import RelationGraph, { RelationGraphComponent } from 'relation-graph-vue3';
import { getKnowledgeGraphNodes, getNodeLines } from '@/api/node';
import { VIRTUAL_ROOT_NODE_ID, isVirtualRootNode, resolveTopLevelNodeIds } from './graphRootUtils';
import '@/assets/styles/layouts/layout-manager.css';

// 定义props
interface Props {
  courseId: string | number;
  graphId: string | number;
  courseName?: string;
  settings: {
    nodeStyle?: string;
    linkStyle?: string;
    layoutType?: string;
    showLabels?: boolean;
    enableZoom?: boolean;
    enableDrag?: boolean;
    maxNodes?: number;
    enableAnimation?: boolean;
  };
}

const props = withDefaults(defineProps<Props>(), {
  courseName: '课程知识图谱',
  settings: () => ({
    nodeStyle: 'circle',
    linkStyle: 'curve',
    layoutType: 'center',
    showLabels: true,
    enableZoom: true,
    enableDrag: true,
    maxNodes: 100,
    enableAnimation: true
  })
});

const CENTER_ROOT_NODE_SIZE = 84;
const CENTER_NORMAL_NODE_SIZE = 52;
const CENTER_LINE_COLOR = '#d5dee8';
const CENTER_LINE_TEXT_COLOR = '#94a3b8';
const collapsedCenterNodeIds = ref<Set<string>>(new Set());
const rawCenterNodes = ref<any[]>([]);
const rawCenterLines = ref<Array<Record<string, unknown>>>([]);

const CENTER_NODE_ICONS = [
  '<svg viewBox="0 0 24 24" class="kg-center-node-svg" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v14H7a3 3 0 0 0-3 3V6.5Z"></path><path d="M7 18h13"></path><path d="M7 8h8"></path></svg>',
  '<svg viewBox="0 0 24 24" class="kg-center-node-svg" aria-hidden="true"><rect x="4" y="5" width="16" height="11" rx="2"></rect><path d="M8 20h8"></path><path d="M12 16v4"></path></svg>',
  '<svg viewBox="0 0 24 24" class="kg-center-node-svg" aria-hidden="true"><path d="M9 3h6"></path><path d="M10 3v6l-4.2 7.3A3 3 0 0 0 8.4 21h7.2a3 3 0 0 0 2.6-4.7L14 9V3"></path><path d="M8 15h8"></path></svg>',
  '<svg viewBox="0 0 24 24" class="kg-center-node-svg" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v4"></path><path d="M12 18v4"></path><path d="m4.9 4.9 2.8 2.8"></path><path d="m16.3 16.3 2.8 2.8"></path><path d="M2 12h4"></path><path d="M18 12h4"></path></svg>',
  '<svg viewBox="0 0 24 24" class="kg-center-node-svg" aria-hidden="true"><path d="M6 4h12v16l-6-3-6 3V4Z"></path><path d="M9 8h6"></path><path d="M9 12h4"></path></svg>'
];

const escapeCenterNodeHtml = (value: unknown) => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const getCenterIconHtml = (seed: string) => {
  const hash = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  return CENTER_NODE_ICONS[hash % CENTER_NODE_ICONS.length];
};

const normalizeCenterNodeId = (value: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
};

const isEmptyCenterParentId = (value: unknown) => {
  const normalized = normalizeCenterNodeId(value);
  return normalized === '' || normalized === '0';
};

const buildCenterToggleHtml = (hasChildren: boolean, isCollapsed: boolean) => {
  if (!hasChildren) {
    return '';
  }

  const toggleText = isCollapsed ? '+' : '-';
  const toggleLabel = isCollapsed ? '展开子节点' : '收起子节点';

  return `<button type="button" class="kg-center-toggle" aria-label="${toggleLabel}" title="${toggleLabel}">${toggleText}</button>`;
};

const buildCenterNodeHtml = (text: string, isRoot: boolean, seed: string, hasChildren = false, isCollapsed = false) => {
  const safeText = escapeCenterNodeHtml(text);
  const toggleHtml = buildCenterToggleHtml(hasChildren, isCollapsed);

  if (isRoot) {
    return `<div class="kg-center-node-shell kg-center-root-shell" title="${safeText}">
      ${toggleHtml}
      <div class="kg-center-root-label">${safeText}</div>
    </div>`;
  }

  return `<div class="kg-center-node-shell kg-center-normal-shell" title="${safeText}">
    ${toggleHtml}
    <span class="kg-center-icon">${getCenterIconHtml(seed)}</span>
    <span class="kg-center-node-label">${safeText}</span>
  </div>`;
};

const buildCenterGraphNode = ({
  id,
  text,
  data,
  isRoot = false,
  hasChildren = false,
  isCollapsed = false
}: {
  id: string;
  text: string;
  data: Record<string, unknown>;
  isRoot?: boolean;
  hasChildren?: boolean;
  isCollapsed?: boolean;
}) => {
  const nodeSize = isRoot ? CENTER_ROOT_NODE_SIZE : CENTER_NORMAL_NODE_SIZE;

  return {
    id,
    text,
    nodeShape: 0 as any,
    width: nodeSize,
    height: nodeSize,
    borderWidth: 0,
    borderColor: 'transparent',
    fontColor: 'transparent',
    color: 'transparent',
    expanded: !isCollapsed,
    styleClass: [
      'kg-center-node',
      isRoot ? 'kg-center-root-node' : 'kg-center-normal-node',
      hasChildren ? 'kg-center-has-children' : '',
      isCollapsed ? 'kg-center-collapsed' : ''
    ].filter(Boolean).join(' '),
    innerHTML: buildCenterNodeHtml(text, isRoot, `${id}-${text}`, hasChildren, isCollapsed),
    data: {
      ...data,
      isCenterRoot: isRoot,
      hasCenterChildren: hasChildren,
      isCenterCollapsed: isCollapsed
    }
  };
};

const buildCenterLine = (line: Record<string, unknown>) => ({
  ...line,
  color: CENTER_LINE_COLOR,
  fontColor: CENTER_LINE_TEXT_COLOR,
  lineWidth: 1,
  useTextPath: true,
  styleClass: 'kg-center-line'
});

const getCenterNodeText = (node: Record<string, unknown>) => {
  return String(node.name || node.title || '未命名节点');
};

const buildCenterHierarchy = (rawNodes: Array<Record<string, unknown>>) => {
  const existingIds = new Set(
    rawNodes
      .map(node => normalizeCenterNodeId(node.id))
      .filter(Boolean)
  );

  const childrenByParentId = new Map<string, string[]>();
  const childCountByParentId = new Map<string, number>();

  rawNodes.forEach(node => {
    const nodeId = normalizeCenterNodeId(node.id);
    const parentId = normalizeCenterNodeId(node.parentId);
    if (!nodeId || isEmptyCenterParentId(node.parentId) || !existingIds.has(parentId)) {
      return;
    }

    if (!childrenByParentId.has(parentId)) {
      childrenByParentId.set(parentId, []);
    }
    childrenByParentId.get(parentId)!.push(nodeId);
    childCountByParentId.set(parentId, (childCountByParentId.get(parentId) || 0) + 1);
  });

  return {
    childrenByParentId,
    childCountByParentId
  };
};

const getVisibleCenterNodeIds = (rootIds: string[], childrenByParentId: Map<string, string[]>) => {
  const visibleNodeIds = new Set<string>();
  const visitedNodeIds = new Set<string>();

  const visit = (nodeId: string) => {
    if (!nodeId || visitedNodeIds.has(nodeId)) {
      return;
    }

    visitedNodeIds.add(nodeId);
    visibleNodeIds.add(nodeId);

    if (collapsedCenterNodeIds.value.has(nodeId)) {
      return;
    }

    (childrenByParentId.get(nodeId) || []).forEach(visit);
  };

  rootIds.forEach(visit);
  return visibleNodeIds;
};

const getStableCenterRootIds = (rawNodes: Array<Record<string, unknown>>) => {
  const rootIds = resolveTopLevelNodeIds(rawNodes);
  if (rootIds.length > 0) {
    return rootIds;
  }

  const fallbackRootId = normalizeCenterNodeId(rawNodes[0]?.id);
  return fallbackRootId ? [fallbackRootId] : [];
};

const buildVirtualRootLines = (
  rootIds: string[],
  visibleNodeIds: Set<string>,
  isVirtualRootCollapsed: boolean
) => {
  if (isVirtualRootCollapsed) {
    return [];
  }

  return rootIds
    .filter(rootId => visibleNodeIds.has(rootId))
    .map((rootId, index) => ({
      from: VIRTUAL_ROOT_NODE_ID,
      to: rootId,
      text: '',
      id: `virtual_root_${index}`
    }))
    .map(buildCenterLine);
};

const buildGraphData = (rawNodes: Array<Record<string, unknown>>, processedLines: Array<Record<string, unknown>>) => {
  const stableRootIds = getStableCenterRootIds(rawNodes);
  const hierarchy = buildCenterHierarchy(rawNodes);
  const isVirtualRootVisible = stableRootIds.length > 1;
  const isVirtualRootCollapsed = collapsedCenterNodeIds.value.has(VIRTUAL_ROOT_NODE_ID);
  const visibleNodeIds = isVirtualRootVisible && isVirtualRootCollapsed
    ? new Set<string>()
    : getVisibleCenterNodeIds(stableRootIds, hierarchy.childrenByParentId);
  const processedNodes = rawNodes
    .filter(node => visibleNodeIds.has(normalizeCenterNodeId(node.id)))
    .map(node => {
      const id = normalizeCenterNodeId(node.id);
      return buildCenterGraphNode({
        id,
        text: getCenterNodeText(node),
        data: node,
        isRoot: !isVirtualRootVisible && stableRootIds.length === 1 && id === stableRootIds[0],
        hasChildren: Boolean(hierarchy.childCountByParentId.get(id)),
        isCollapsed: collapsedCenterNodeIds.value.has(id)
      });
    });
  const visibleLines = processedLines.filter((line: any) => {
    return visibleNodeIds.has(normalizeCenterNodeId(line.from)) && visibleNodeIds.has(normalizeCenterNodeId(line.to));
  });

  if (stableRootIds.length <= 1) {
    return {
      rootId: stableRootIds[0] || '',
      nodes: processedNodes,
      lines: visibleLines
    };
  }

  const virtualRootNode = buildCenterGraphNode({
    id: VIRTUAL_ROOT_NODE_ID,
    text: props.courseName || '课程知识图谱',
    data: {
      content: '',
      category: 'virtual-root',
      isVirtualRoot: true
    },
    isRoot: true,
    hasChildren: stableRootIds.length > 0,
    isCollapsed: isVirtualRootCollapsed
  });

  const virtualLines = buildVirtualRootLines(stableRootIds, visibleNodeIds, isVirtualRootCollapsed);

  return {
    rootId: VIRTUAL_ROOT_NODE_ID,
    nodes: [virtualRootNode, ...processedNodes],
    lines: [...virtualLines, ...visibleLines]
  };
};

// 定义emits
const emit = defineEmits(['node-click', 'line-click']);

// 响应式数据
const centerGraphRef = ref<RelationGraphComponent | null>(null);
const fullscreenContainerRef = ref<HTMLElement | null>(null);
const isGraphFullscreen = ref(false);

// 动态CSS类
const layoutCssClass = computed(() => 'layout-center');

const getCenterGraphInstance = () => {
  return centerGraphRef.value?.getInstance?.();
};

const syncRelationGraphFullscreenState = (value: boolean) => {
  isGraphFullscreen.value = value;
  const graphInstance = getCenterGraphInstance();
  if (graphInstance) {
    graphInstance.options.fullscreen = value;
  }
};

const handleRelationGraphFullscreen = (newValue: boolean) => {
  syncRelationGraphFullscreenState(newValue);
};

const syncNativeFullscreenState = () => {
  syncRelationGraphFullscreenState(document.fullscreenElement === fullscreenContainerRef.value);
};

const toggleGraphFullscreen = async () => {
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
    console.error('CenterLayoutComponent: 切换全屏失败:', error);
  }
};

// 中心布局配置
const centerLayoutOptions: any = {
  'backgroundImageNoRepeat': true,
  'moveToCenterWhenRefresh': false,
  'zoomToFitWhenRefresh': false,
  'defaultNodeBorderWidth': 0,
  'defaultNodeShape': 0 as any,
  'layout': {
    'label': '中心',
    'layoutName': 'center',
    'centerOffset_x': 0,
    'centerOffset_y': 0,
    'distance_coefficient': 1.05,
    'maxLayoutTimes': 300,
    'force_node_repulsion': 1.25,
    'force_line_elastic': 0.85
  },
  'defaultLineMarker': {
    'markerWidth': 10,
    'markerHeight': 10,
    'refX': 5,
    'refY': 5,
    'color': CENTER_LINE_COLOR,
    'data': 'M2,2 L8,5 L2,8 L4.5,5 L2,2'
  },
  'defaultNodeWidth': CENTER_NORMAL_NODE_SIZE,
  'defaultNodeHeight': CENTER_NORMAL_NODE_SIZE,
  'defaultLineShape': 1 as any,
  'defaultJunctionPoint': 'border',
  'defaultLineColor': CENTER_LINE_COLOR,
  'defaultLineWidth': 1,
  'defaultLineFontColor': CENTER_LINE_TEXT_COLOR,
  'defaultNodeColor': 'transparent',
  'defaultNodeFontColor': 'transparent',
  'defaultExpandHolderPosition': 'hide',
  'defaultShowLineLabel': true,
  'lineUseTextPath': true,
  'lineTextMaxLength': 16,
  'disableZoom': false,
  'allowShowMiniToolBar': true,
  'allowShowMiniView': true,
  'allowShowFullscreenMenu': false
};

// 动态调整布局参数的函数
const getDynamicLayoutOptions = (nodeCount: number) => {
  let distanceCoefficient = 1.05;
  let forceNodeRepulsion = 1.25;
  let forceLineElastic = 0.85;

  if (nodeCount <= 10) {
    distanceCoefficient = 1.2;
    forceNodeRepulsion = 1.35;
  } else if (nodeCount <= 30) {
    distanceCoefficient = 1.05;
  } else {
    distanceCoefficient = 0.9;
    forceNodeRepulsion = 1.05;
    forceLineElastic = 0.95;
  }

  return {
    nodeWidth: CENTER_NORMAL_NODE_SIZE,
    nodeHeight: CENTER_NORMAL_NODE_SIZE,
    distanceCoefficient,
    forceNodeRepulsion,
    forceLineElastic
  };
};

// 计算当前中心布局配置
const currentCenterOptions = computed(() => {
  const dynamicParams = getDynamicLayoutOptions(50); // 默认参数
  const enableZoom = props.settings.enableZoom !== false;
  const enableAnimation = props.settings.enableAnimation !== false;
  
  const options = {
    ...centerLayoutOptions,
    layout: {
      ...(centerLayoutOptions.layout || {})
    },
    defaultLineMarker: {
      ...(centerLayoutOptions.defaultLineMarker || {})
    },
    defaultNodeShape: 0 as any,
    defaultNodeWidth: dynamicParams.nodeWidth,
    defaultNodeHeight: dynamicParams.nodeHeight,
    defaultLineShape: 1 as any,
    defaultShowLineLabel: props.settings.showLabels !== false,
    disableZoom: !enableZoom,
    allowShowFullscreenMenu: false,
    allowShowMiniToolBar: enableZoom,
    allowShowMiniView: enableZoom,
    useAnimationWhenExpanded: enableAnimation,
    useAnimationWhenRefresh: enableAnimation
  };

  if (options.layout) {
    (options.layout as any).distance_coefficient = dynamicParams.distanceCoefficient;
    (options.layout as any).force_node_repulsion = dynamicParams.forceNodeRepulsion;
    (options.layout as any).force_line_elastic = dynamicParams.forceLineElastic;
  }

  return options;
});

// 节点点击处理
const onNodeClick = (nodeObject: any, event: any) => {
  const target = event?.target as HTMLElement | undefined;
  if (target?.closest?.('.kg-center-toggle')) {
    event?.stopPropagation?.();
    void toggleCenterNode(nodeObject).catch((error) => {
      console.error('CenterLayoutComponent: 切换节点展开状态失败:', error);
    });
    return false;
  }

  if (isVirtualRootNode(nodeObject)) {
    return;
  }
  console.log('CenterLayoutComponent: 节点点击', nodeObject);
  emit('node-click', nodeObject, event);
};

// 连线点击处理
const onLineClick = (lineObject: any, lineElement: any) => {
  console.log('CenterLayoutComponent: 连线点击', lineObject);
  emit('line-click', lineObject, lineElement);
};

const toggleCenterNode = async (nodeObject: any) => {
  const nodeId = normalizeCenterNodeId(nodeObject?.id);
  if (!nodeId || nodeObject?.data?.hasCenterChildren !== true) {
    return;
  }

  const nextCollapsedNodeIds = new Set(collapsedCenterNodeIds.value);
  if (nextCollapsedNodeIds.has(nodeId)) {
    nextCollapsedNodeIds.delete(nodeId);
  } else {
    nextCollapsedNodeIds.add(nodeId);
  }
  collapsedCenterNodeIds.value = nextCollapsedNodeIds;

  await renderCenterGraph(rawCenterNodes.value, rawCenterLines.value);
};

const renderCenterGraph = async (nodes: any[], processedLines: Array<Record<string, unknown>>) => {
  const graphData = buildGraphData(nodes, processedLines);

  console.log(`CenterLayoutComponent: 图谱数据构建完成`, {
    nodeCount: graphData.nodes.length,
    lineCount: graphData.lines.length
  });

  const dynamicParams = getDynamicLayoutOptions(graphData.nodes.length);
  const updatedOptions = {
    ...currentCenterOptions.value,
    layout: {
      ...(currentCenterOptions.value.layout || {})
    },
    defaultNodeWidth: dynamicParams.nodeWidth,
    defaultNodeHeight: dynamicParams.nodeHeight
  };

  if (updatedOptions.layout) {
    updatedOptions.layout.distance_coefficient = dynamicParams.distanceCoefficient;
    updatedOptions.layout.force_node_repulsion = dynamicParams.forceNodeRepulsion;
    updatedOptions.layout.force_line_elastic = dynamicParams.forceLineElastic;
  }

  const graphInstance = getCenterGraphInstance();
  if (graphInstance) {
    await graphInstance.setOptions(updatedOptions);
    await graphInstance.setJsonData(graphData);
    await graphInstance.moveToCenter();
    await graphInstance.zoomToFit();
    console.log(`CenterLayoutComponent: 图谱渲染完成 (节点数: ${graphData.nodes.length})`);
  } else {
    console.error('CenterLayoutComponent: 图谱实例未找到');
  }
};

// 加载图谱数据
const loadGraphData = async () => {
  try {
    console.log(`CenterLayoutComponent: 开始加载图谱数据 (courseId: ${props.courseId}, graphId: ${props.graphId})`);
    console.log('CenterLayoutComponent: 当前props.settings:', props.settings);
    
    // 1. 获取节点数据
    const nodesResponse = await getKnowledgeGraphNodes(String(props.graphId));

    let nodes: any[] = [];
    if (nodesResponse && (nodesResponse as any).rows) {
      nodes = (nodesResponse as any).rows;
    } else if (Array.isArray(nodesResponse)) {
      nodes = nodesResponse;
    } else {
      console.warn('CenterLayoutComponent: 未获取到有效的节点数据', nodesResponse);
      return;
    }

    console.log(`CenterLayoutComponent: 获取到 ${nodes.length} 个节点`);

    if (nodes.length === 0) {
      console.warn('CenterLayoutComponent: 没有找到节点数据');
      return;
    }
    collapsedCenterNodeIds.value = new Set();

    // 2. 获取连线数据
    const linePromises = nodes.map((node: any) => {
      return getNodeLines(node.id).catch((error: any) => {
        console.warn(`CenterLayoutComponent: 获取节点${node.id}连线失败:`, error);
        return [];
      });
    });

    const linesArrays = await Promise.all(linePromises);

    // 3. 处理连线数据
    const allLines = linesArrays.flat();
    const processedLines = allLines.map((line: any, index: number) => buildCenterLine({
      from: line.nodeId?.toString() || '',
      to: line.targetId?.toString() || '',
      text: props.settings.showLabels === false ? '' : (line.content || ''),
      id: line.id ? line.id.toString() : `line_${index}`
    })).filter((line: any) => line.from && line.to);

    rawCenterNodes.value = nodes;
    rawCenterLines.value = processedLines;
    await renderCenterGraph(nodes, processedLines);

  } catch (error) {
    console.error('CenterLayoutComponent: 加载图谱数据失败:', error);
  }
};

// 监听props变化
watch(() => [props.courseId, props.graphId, props.courseName], () => {
  loadGraphData();
}, { immediate: false });

// 组件挂载后加载数据
onMounted(async () => {
  document.addEventListener('fullscreenchange', syncNativeFullscreenState);
  console.log('CenterLayoutComponent: 组件已挂载');
  console.log('CenterLayoutComponent: centerGraphRef.value:', centerGraphRef.value);
  await nextTick();
  console.log('CenterLayoutComponent: nextTick完成，开始加载数据');
  await loadGraphData();
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncNativeFullscreenState);
});

// 暴露方法给父组件
defineExpose({
  refresh: loadGraphData,
  getGraphInstance: getCenterGraphInstance
});
</script>

<style scoped>
.center-layout-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.center-layout-viewport {
  position: relative;
  width: 100%;
  height: calc(100vh);
}

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

::v-deep(.relation-graph) {
  .c-node-text {
    padding: 0;
    place-items: center;
    justify-content: center;
    overflow: visible;
    color: inherit;
  }

  .rel-node-text,
  .rel-node .c-node-text,
  .rel-node text {
    fill: currentColor;
    color: inherit;
  }
}
</style>
