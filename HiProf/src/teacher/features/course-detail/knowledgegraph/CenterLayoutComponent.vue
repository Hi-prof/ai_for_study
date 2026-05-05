<template>
  <div class="center-layout-container" :class="layoutCssClass">
    <div ref="fullscreenContainerRef" class="center-layout-viewport">
      <GraphFullscreenToggle :active="isGraphFullscreen" @toggle="toggleGraphFullscreen" />
      <RelationGraph
        ref="centerGraphRef"
        :options="currentCenterOptions"
        :on-node-click="onNodeClick"
        :on-line-click="onLineClick"
        :on-canvas-click="onCanvasClick"
        :on-fullscreen="handleRelationGraphFullscreen"
      >
        <template #svg-defs>
          <marker
            :id="CENTER_ARROW_END_MARKER_ID"
            markerWidth="28"
            markerHeight="28"
            refX="11"
            refY="6"
            markerUnits="userSpaceOnUse"
            orient="auto"
            viewBox="0 0 12 12"
          >
            <path
              :d="CENTER_ARROW_MARKER_PATH"
              style="fill: #111827; fill: context-stroke;"
            />
          </marker>
        </template>
        <template #graph-plug>
        </template>
      </RelationGraph>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import RelationGraph, { RelationGraphComponent } from 'relation-graph-vue3';
import { getKnowledgeGraphNodes, getNodeLines } from '@/api/node';
import { VIRTUAL_ROOT_NODE_ID, isVirtualRootNode, resolveTopLevelNodeIds, resolveTreeAncestorNodeIds } from './graphRootUtils';
import GraphFullscreenToggle from './GraphFullscreenToggle.vue';
import { useGraphFullscreen } from './useGraphFullscreen';
import '@/assets/styles/layouts/layout-manager.css';
import {
  applyGraphVisualLineStyle,
  buildGraphRelationSets,
  getLineInteractionState,
  getNodeInteractionState,
  searchGraphNodes
} from '@/shared/features/graph/utils/graphVisualTheme.js';

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
  interactionState?: {
    selectedNodeId?: string | number | null;
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
const CENTER_LINE_COLOR = '#111827';
const CENTER_LINE_TEXT_COLOR = '#374151';
const CENTER_LINE_WIDTH = 3;
const CENTER_LINE_ACTIVE_WIDTH = 4.25;
const CENTER_LINE_MUTED_WIDTH = 2;
const CENTER_ARROW_END_MARKER_ID = 'kg-center-arrow-end';
const CENTER_ARROW_MARKER_PATH = 'M1,1 L11,6 L1,11 L4,6 Z';
// relation-graph-vue3 的 marker viewBox 固定为 0 0 12 12。
const CENTER_LINE_MARKER = {
  markerWidth: 20,
  markerHeight: 20,
  refX: 11,
  refY: 6,
  data: CENTER_ARROW_MARKER_PATH
};
const collapsedCenterNodeIds = ref<Set<string>>(new Set());
const rawCenterNodes = ref<any[]>([]);
const rawCenterLines = ref<Array<Record<string, unknown>>>([]);
const FOCUS_ANIMATION_MS = 420;

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

const getCenterNodeStyleClass = (isRoot: boolean, hasChildren: boolean, isCollapsed: boolean, state = 'default') => [
  'kg-center-node',
  isRoot ? 'kg-center-root-node' : 'kg-center-normal-node',
  hasChildren ? 'kg-center-has-children' : '',
  isCollapsed ? 'kg-center-collapsed' : '',
  state && state !== 'default' ? `kg-graph-node-${state}` : ''
].filter(Boolean).join(' ');

const buildCenterGraphNode = ({
  id,
  text,
  data,
  isRoot = false,
  hasChildren = false,
  isCollapsed = false,
  state = 'default'
}: {
  id: string;
  text: string;
  data: Record<string, unknown>;
  isRoot?: boolean;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  state?: string;
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
    styleClass: getCenterNodeStyleClass(isRoot, hasChildren, isCollapsed, state),
    innerHTML: buildCenterNodeHtml(text, isRoot, `${id}-${text}`, hasChildren, isCollapsed),
    data: {
      ...data,
      isCenterRoot: isRoot,
      hasCenterChildren: hasChildren,
      isCenterCollapsed: isCollapsed
    }
  };
};

const getCenterLineWidth = (state = 'default') => {
  if (state === 'active') {
    return CENTER_LINE_ACTIVE_WIDTH;
  }

  if (state === 'muted') {
    return CENTER_LINE_MUTED_WIDTH;
  }

  return CENTER_LINE_WIDTH;
};

const buildCenterLine = (line: Record<string, unknown>, state = 'default') => ({
  ...applyGraphVisualLineStyle(line, state),
  endMarkerId: CENTER_ARROW_END_MARKER_ID,
  color: state === 'active' ? '#000000' : CENTER_LINE_COLOR,
  fontColor: state === 'active' ? '#000000' : CENTER_LINE_TEXT_COLOR,
  lineWidth: getCenterLineWidth(state),
  useTextPath: false,
  styleClass: ['kg-center-line', state && state !== 'default' ? `kg-graph-line-${state}` : ''].filter(Boolean).join(' ')
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

const getStableCenterRootIds = (rawNodes: Array<Record<string, unknown>>) => {
  const rootIds = resolveTopLevelNodeIds(rawNodes);
  if (rootIds.length > 0) {
    return rootIds;
  }

  const fallbackRootId = normalizeCenterNodeId(rawNodes[0]?.id);
  return fallbackRootId ? [fallbackRootId] : [];
};

const buildVirtualRootLines = (rootIds: string[]) => {
  return rootIds
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
  const relationSets = buildGraphRelationSets(props.interactionState?.selectedNodeId, processedLines);
  const processedNodes = rawNodes
    .map(node => {
      const id = normalizeCenterNodeId(node.id);
      const state = getNodeInteractionState(id, relationSets);
      return buildCenterGraphNode({
        id,
        text: getCenterNodeText(node),
        data: node,
        isRoot: !isVirtualRootVisible && stableRootIds.length === 1 && id === stableRootIds[0],
        hasChildren: Boolean(hierarchy.childCountByParentId.get(id)),
        isCollapsed: collapsedCenterNodeIds.value.has(id),
        state
      });
    });
  const styledLines = processedLines.map((line: any) => buildCenterLine(line, getLineInteractionState(line, relationSets)));

  if (stableRootIds.length <= 1) {
    return {
      rootId: stableRootIds[0] || '',
      nodes: processedNodes,
      lines: styledLines
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
    isCollapsed: isVirtualRootCollapsed,
    state: getNodeInteractionState(VIRTUAL_ROOT_NODE_ID, relationSets)
  });

  const virtualLines = buildVirtualRootLines(stableRootIds);

  return {
    rootId: VIRTUAL_ROOT_NODE_ID,
    nodes: [virtualRootNode, ...processedNodes],
    lines: [...virtualLines, ...styledLines]
  };
};

// 定义emits
const emit = defineEmits(['node-click', 'line-click', 'canvas-click']);

// 响应式数据
const centerGraphRef = ref<RelationGraphComponent | null>(null);
const {
  fullscreenContainerRef,
  getGraphInstance: getCenterGraphInstance,
  handleRelationGraphFullscreen,
  isGraphFullscreen,
  syncNativeFullscreenState,
  toggleGraphFullscreen
} = useGraphFullscreen(centerGraphRef, 'CenterLayoutComponent');

// 动态CSS类
const layoutCssClass = computed(() => 'layout-center');

// 关系探索使用力导图，节点保持圆形图标按钮样式。
const centerLayoutOptions: any = {
  'backgroundImageNoRepeat': true,
  'moveToCenterWhenRefresh': false,
  'zoomToFitWhenRefresh': false,
  'defaultNodeBorderWidth': 0,
  'defaultNodeShape': 0 as any,
  'layout': {
    'label': '关系探索',
    'layoutName': 'force',
    'centerOffset_x': 0,
    'centerOffset_y': 0,
    'fixedRootNode': true,
    'byNode': true,
    'byLine': true,
    'fastStart': false,
    'maxLayoutTimes': 420,
    'force_node_repulsion': 1.25,
    'force_line_elastic': 0.62
  },
  'defaultLineMarker': {
    ...CENTER_LINE_MARKER,
    'color': CENTER_LINE_COLOR,
  },
  'defaultNodeWidth': CENTER_NORMAL_NODE_SIZE,
  'defaultNodeHeight': CENTER_NORMAL_NODE_SIZE,
  'defaultLineShape': 1 as any,
  'defaultJunctionPoint': 'border',
  'defaultLineColor': CENTER_LINE_COLOR,
  'defaultLineWidth': CENTER_LINE_WIDTH,
  'defaultLineFontColor': CENTER_LINE_TEXT_COLOR,
  'defaultNodeColor': 'transparent',
  'defaultNodeFontColor': 'transparent',
  'defaultExpandHolderPosition': 'hide',
  'defaultShowLineLabel': false,
  'lineUseTextPath': false,
  'lineTextMaxLength': 16,
  'disableZoom': false,
  'allowShowMiniToolBar': true,
  'allowShowMiniView': true,
  'allowShowFullscreenMenu': false
};

// 动态调整布局参数的函数
const getDynamicLayoutOptions = (nodeCount: number) => {
  let forceNodeRepulsion = 1.25;
  let forceLineElastic = 0.62;
  let maxLayoutTimes = 420;

  if (nodeCount <= 10) {
    forceNodeRepulsion = 1.12;
    forceLineElastic = 0.7;
    maxLayoutTimes = 320;
  } else if (nodeCount <= 30) {
    forceNodeRepulsion = 1.28;
    forceLineElastic = 0.62;
    maxLayoutTimes = 420;
  } else {
    forceNodeRepulsion = 1.45;
    forceLineElastic = 0.56;
    maxLayoutTimes = 520;
  }

  return {
    nodeWidth: CENTER_NORMAL_NODE_SIZE,
    nodeHeight: CENTER_NORMAL_NODE_SIZE,
    forceNodeRepulsion,
    forceLineElastic,
    maxLayoutTimes
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
    defaultShowLineLabel: false,
    lineUseTextPath: false,
    disableZoom: !enableZoom,
    allowShowFullscreenMenu: false,
    allowShowMiniToolBar: enableZoom,
    allowShowMiniView: enableZoom,
    useAnimationWhenExpanded: enableAnimation,
    useAnimationWhenRefresh: enableAnimation
  };

  if (options.layout) {
    (options.layout as any).force_node_repulsion = dynamicParams.forceNodeRepulsion;
    (options.layout as any).force_line_elastic = dynamicParams.forceLineElastic;
    (options.layout as any).maxLayoutTimes = dynamicParams.maxLayoutTimes;
  }

  return options;
});

// 节点点击处理
const onNodeClick = (nodeObject: any, event: any) => {
  const target = event?.target as HTMLElement | undefined;
  if (target?.closest?.('.kg-center-toggle')) {
    event?.preventDefault?.();
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

const onCanvasClick = (event: any) => {
  emit('canvas-click', event);
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

  const graphInstance = getCenterGraphInstance();
  const graphNode = graphInstance?.getNodeById?.(nodeId) || nodeObject;
  if (graphInstance && typeof graphInstance.expandOrCollapseNode === 'function') {
    await graphInstance.expandOrCollapseNode(graphNode);
    if (graphNode.expanded === false) {
      nextCollapsedNodeIds.add(nodeId);
    } else {
      nextCollapsedNodeIds.delete(nodeId);
    }
    collapsedCenterNodeIds.value = nextCollapsedNodeIds;
    syncCenterVisualState();
    return;
  }

  collapsedCenterNodeIds.value = nextCollapsedNodeIds;
  await refreshCenterVisualState();
};

const renderCenterGraph = async (
  nodes: any[],
  processedLines: Array<Record<string, unknown>>,
  options: { resetView?: boolean } = {}
) => {
  const { resetView = true } = options;
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
    updatedOptions.layout.force_node_repulsion = dynamicParams.forceNodeRepulsion;
    updatedOptions.layout.force_line_elastic = dynamicParams.forceLineElastic;
    updatedOptions.layout.maxLayoutTimes = dynamicParams.maxLayoutTimes;
  }

  const graphInstance = getCenterGraphInstance();
  if (graphInstance) {
    await graphInstance.setOptions(updatedOptions);
    await graphInstance.setJsonData(graphData);
    if (resetView) {
      await graphInstance.moveToCenter();
      await graphInstance.zoomToFit();
    }
    console.log(`CenterLayoutComponent: 图谱渲染完成 (节点数: ${graphData.nodes.length})`);
  } else {
    console.error('CenterLayoutComponent: 图谱实例未找到');
  }
};

const getCenterGraphLineKey = (line: any) => {
  return normalizeCenterNodeId(line?.id) || `${normalizeCenterNodeId(line?.from)}__${normalizeCenterNodeId(line?.to)}`;
};

const applyCenterNodeVisualState = (targetNode: any, sourceNode: any) => {
  targetNode.expanded = sourceNode.expanded;
  targetNode.innerHTML = sourceNode.innerHTML;
  targetNode.styleClass = sourceNode.styleClass;
  targetNode.className = sourceNode.className;
  targetNode.color = sourceNode.color;
  targetNode.borderColor = sourceNode.borderColor;
  targetNode.borderWidth = sourceNode.borderWidth;
  targetNode.fontColor = sourceNode.fontColor;
  targetNode.opacity = sourceNode.opacity;
  targetNode.data = {
    ...(targetNode.data || {}),
    ...(sourceNode.data || {})
  };
};

const applyCenterLineVisualState = (targetLine: any, sourceLine: any) => {
  targetLine.color = sourceLine.color;
  targetLine.fontColor = sourceLine.fontColor;
  targetLine.lineWidth = sourceLine.lineWidth;
  targetLine.showStartArrow = sourceLine.showStartArrow;
  targetLine.showEndArrow = sourceLine.showEndArrow;
  targetLine.startMarkerId = sourceLine.startMarkerId;
  targetLine.endMarkerId = sourceLine.endMarkerId;
  targetLine.isHideArrow = sourceLine.isHideArrow;
  targetLine.useTextPath = sourceLine.useTextPath;
  targetLine.styleClass = sourceLine.styleClass;
};

const syncCenterVisualState = () => {
  if (!rawCenterNodes.value.length) {
    return;
  }

  const graphInstance = getCenterGraphInstance();
  if (!graphInstance) {
    return;
  }

  const graphData = buildGraphData(rawCenterNodes.value, rawCenterLines.value);
  const nextNodeById = new Map((graphData.nodes || []).map((node: any) => [normalizeCenterNodeId(node.id), node]));
  const nextLineByKey = new Map((graphData.lines || []).map((line: any) => [getCenterGraphLineKey(line), line]));

  graphInstance.getNodes().forEach((node: any) => {
    const nextNode = nextNodeById.get(normalizeCenterNodeId(node.id));
    if (nextNode) {
      applyCenterNodeVisualState(node, nextNode);
    }
  });

  graphInstance.getLinks().forEach((link: any) => {
    link.relations.forEach((line: any) => {
      const nextLine = nextLineByKey.get(getCenterGraphLineKey(line));
      if (nextLine) {
        applyCenterLineVisualState(line, nextLine);
      }
    });
  });

  graphInstance.updateElementLines?.();
  graphInstance.dataUpdated?.();
};

const refreshCenterVisualState = async () => {
  syncCenterVisualState();
};

const searchNodes = (keyword: string) => {
  return searchGraphNodes(keyword, rawCenterNodes.value.map(node => ({
    id: node.id,
    text: getCenterNodeText(node),
    name: node.name,
    data: {
      content: node.content || '',
      fullText: getCenterNodeText(node),
      originalData: node
    }
  })));
};

const revealCenterNodePath = async (nodeId: string) => {
  const ancestorNodeIds = resolveTreeAncestorNodeIds(nodeId, rawCenterNodes.value, rawCenterLines.value);
  const nextCollapsedNodeIds = new Set(collapsedCenterNodeIds.value);
  let hasChanged = false;

  if (getStableCenterRootIds(rawCenterNodes.value).length > 1 && nextCollapsedNodeIds.delete(VIRTUAL_ROOT_NODE_ID)) {
    hasChanged = true;
  }

  ancestorNodeIds.forEach(ancestorNodeId => {
    if (nextCollapsedNodeIds.delete(ancestorNodeId)) {
      hasChanged = true;
    }
  });

  if (!hasChanged) {
    return;
  }

  collapsedCenterNodeIds.value = nextCollapsedNodeIds;
  const graphInstance = getCenterGraphInstance();
  if (graphInstance) {
    const nodesToReveal = [VIRTUAL_ROOT_NODE_ID, ...ancestorNodeIds];
    for (const ancestorNodeId of nodesToReveal) {
      const ancestorNode = graphInstance.getNodeById?.(ancestorNodeId);
      if (ancestorNode?.expanded === false && typeof graphInstance.expandNode === 'function') {
        await graphInstance.expandNode(ancestorNode);
      }
    }
  }

  syncCenterVisualState();
  await nextTick();
};

const getCenterNodeCenteredOffset = (graphInstance: any, targetNode: any) => {
  graphInstance.resetViewSize?.(false);
  const graphOptions = graphInstance.options || {};
  const zoom = Number(graphOptions.canvasZoom || 100) / 100;
  const viewWidth = Number(graphOptions.viewSize?.width || 0);
  const viewHeight = Number(graphOptions.viewSize?.height || 0);
  const canvasWidth = Number(graphOptions.canvasSize?.width || 0);
  const canvasHeight = Number(graphOptions.canvasSize?.height || 0);
  const nodeWidth = Number(targetNode.width || targetNode.el?.offsetWidth || currentCenterOptions.value.defaultNodeWidth || 0);
  const nodeHeight = Number(targetNode.height || targetNode.el?.offsetHeight || currentCenterOptions.value.defaultNodeHeight || 0);
  const nodeCenterX = Number(targetNode.x || 0) + nodeWidth / 2;
  const nodeCenterY = Number(targetNode.y || 0) + nodeHeight / 2;

  return {
    x: viewWidth / 2 - nodeCenterX * zoom - canvasWidth / 2 + canvasWidth * zoom / 2 + Number(graphOptions.graphOffset_x || 0),
    y: viewHeight / 2 - nodeCenterY * zoom - canvasHeight / 2 + canvasHeight * zoom / 2 + Number(graphOptions.graphOffset_y || 0)
  };
};

const smoothFocusCenterNodeById = async (graphInstance: any, nodeId: string) => {
  const targetNode = graphInstance.getNodeById?.(nodeId);
  if (!targetNode) {
    return false;
  }

  const nextOffset = getCenterNodeCenteredOffset(graphInstance, targetNode);
  if (typeof graphInstance.animateGoto === 'function') {
    await graphInstance.animateGoto(nextOffset.x, nextOffset.y, FOCUS_ANIMATION_MS);
  }
  graphInstance.setCanvasOffset?.(nextOffset.x, nextOffset.y);
  graphInstance.setCheckedNode?.(nodeId);
  graphInstance.refreshNVAnalysisInfo?.();
  graphInstance.dataUpdated?.();
  return true;
};

const focusNodeById = async (nodeId: string) => {
  const normalizedNodeId = normalizeCenterNodeId(nodeId);
  if (!normalizedNodeId) {
    return;
  }

  await revealCenterNodePath(normalizedNodeId);

  const graphInstance = getCenterGraphInstance();
  if (!graphInstance) {
    return;
  }

  await nextTick();
  if (await smoothFocusCenterNodeById(graphInstance, normalizedNodeId)) {
    return;
  }

  if (typeof (graphInstance as any).focusNodeById === 'function') {
    await (graphInstance as any).focusNodeById(normalizedNodeId);
  }
};

const fitView = async () => {
  const graphInstance = getCenterGraphInstance();
  if (!graphInstance) {
    return;
  }

  await graphInstance.moveToCenter();
  await graphInstance.zoomToFit();
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

watch(() => props.interactionState?.selectedNodeId, () => {
  void refreshCenterVisualState();
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
  getGraphInstance: getCenterGraphInstance,
  searchNodes,
  focusNodeById,
  fitView
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
