<template>
  <div class="bidirectional-tree-container" :class="layoutCssClass">
    <div ref="fullscreenContainerRef" class="bidirectional-tree-viewport">
      <GraphFullscreenToggle :active="isGraphFullscreen" @toggle="toggleGraphFullscreen" />
      <RelationGraph
        ref="bidirectionalTreeRef"
        :options="currentBidirectionalOptions"
        :on-node-click="onNodeClick"
        :on-line-click="onLineClick"
        :on-canvas-click="onCanvasClick"
        :on-fullscreen="handleRelationGraphFullscreen"
      >
        <template #graph-plug>
        </template>
      </RelationGraph>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import RelationGraph, { 
  RGJsonData, 
  RGOptions, 
  RGNode, 
  RGLine, 
  RGLink, 
  RGUserEvent, 
  RelationGraphComponent,
  RGTreeLayoutOptions 
} from 'relation-graph-vue3';
import { getKnowledgeGraphNodes, getNodeLines } from '@/api/node';
import {
  VIRTUAL_ROOT_NODE_ID,
  buildTreeChildrenByParentId,
  isVirtualRootNode,
  normalizeNodeId,
  resolveTreeAncestorNodeIds,
  resolveTopLevelNodeIds,
  resolveVisibleTreeNodeIds
} from './graphRootUtils';
import GraphFullscreenToggle from './GraphFullscreenToggle.vue';
import { useGraphFullscreen } from './useGraphFullscreen';
import {
  applyRelationGraphNodeTextLayout,
  escapeNodeHtml,
  getMaxRelationGraphNodeSize
} from '@/shared/features/graph/utils/nodeTextLayout';
import {
  applyGraphVisualLineStyle,
  applyGraphVisualNodeStyle,
  buildGraphVisualContext,
  getLineInteractionState,
  graphVisualTheme,
  searchGraphNodes
} from '@/shared/features/graph/utils/graphVisualTheme.js';

// 定义 props
interface Props {
  courseId?: string | number;
  graphId?: string | number;
  courseName?: string;
  settings?: {
    nodeStyle?: string;
    linkStyle?: string;
    layoutType?: string;
    treeDirection?: 'horizontal' | 'vertical';
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
    nodeStyle: 'rectangle',
    linkStyle: 'straight',
    layoutType: 'bidirectional-tree',
    treeDirection: 'horizontal',
    showLabels: true,
    enableZoom: true,
    enableDrag: true,
    maxNodes: 100,
    enableAnimation: true
  })
});

const collapsedBidirectionalNodeIds = ref<Set<string>>(new Set());
const rawBidirectionalNodes = ref<any[]>([]);
const rawBidirectionalProcessedNodes = ref<Array<Record<string, unknown>>>([]);
const rawBidirectionalProcessedLines = ref<Array<Record<string, unknown>>>([]);

const buildBidirectionalToggleHtml = (hasChildren: boolean, isCollapsed: boolean, position: 'left' | 'right') => {
  if (!hasChildren) {
    return '';
  }

  const toggleText = isCollapsed ? '+' : '-';
  const toggleLabel = isCollapsed ? '展开子节点' : '收起子节点';
  return `<button type="button" class="kg-tree-toggle kg-tree-toggle-${position}" aria-label="${toggleLabel}" title="${toggleLabel}">${toggleText}</button>`;
};

const buildBidirectionalNodeHtml = (
  text: string,
  hasChildren: boolean,
  isCollapsed: boolean,
  position: 'left' | 'right' = 'right'
) => {
  const safeText = escapeNodeHtml(text);
  return `<div class="kg-tree-node-shell">
    ${buildBidirectionalToggleHtml(hasChildren, isCollapsed, position)}
    <div class="kg-node-label" title="${safeText}">${safeText}</div>
  </div>`;
};

const applyBidirectionalToggleState = (
  node: Record<string, unknown>,
  childrenByParentId: Map<string, string[]>,
  visualContext: Record<string, unknown>
) => {
  const nodeId = normalizeNodeId(node.id);
  const hasChildren = Boolean(childrenByParentId.get(nodeId)?.length);
  const isCollapsed = collapsedBidirectionalNodeIds.value.has(nodeId);
  const text = String(node.text || '');

  return applyGraphVisualNodeStyle({
    ...node,
    expanded: !isCollapsed,
    expandHolderPosition: 'hide',
    innerHTML: buildBidirectionalNodeHtml(text, hasChildren, isCollapsed),
    data: {
      ...((node.data as Record<string, unknown>) || {}),
      hasTreeChildren: hasChildren,
      isTreeCollapsed: isCollapsed
    }
  }, visualContext);
};

const buildGraphData = (rawNodes: Array<Record<string, unknown>>, processedNodes: Array<Record<string, unknown>>, processedLines: Array<Record<string, unknown>>) => {
  const rootIds = resolveTopLevelNodeIds(rawNodes);
  const stableRootIds = rootIds.length > 0
    ? rootIds
    : (processedNodes[0]?.id ? [String(processedNodes[0].id)] : []);
  const childrenByParentId = buildTreeChildrenByParentId(rawNodes, processedLines);
  const visibleNodeIds = resolveVisibleTreeNodeIds(stableRootIds, childrenByParentId, collapsedBidirectionalNodeIds.value);
  const visibleProcessedLines = processedLines.filter(line => {
    return visibleNodeIds.has(normalizeNodeId(line.from)) && visibleNodeIds.has(normalizeNodeId(line.to));
  });
  const chapterNodeIds = new Set(stableRootIds.flatMap(rootId => childrenByParentId.get(rootId) || []));
  const visualContext = buildGraphVisualContext({
    rootIds: stableRootIds,
    chapterNodeIds,
    selectedNodeId: props.interactionState?.selectedNodeId,
    lines: visibleProcessedLines
  });
  const visibleProcessedNodes = processedNodes
    .filter(node => visibleNodeIds.has(normalizeNodeId(node.id)))
    .map(node => applyBidirectionalToggleState(node, childrenByParentId, visualContext));
  const visibleStyledLines = visibleProcessedLines.map(line => {
    return applyGraphVisualLineStyle(line, getLineInteractionState(line, visualContext.relationSets));
  });

  if (stableRootIds.length <= 1) {
    return {
      rootId: stableRootIds[0] || '',
      nodes: visibleProcessedNodes,
      links: visibleStyledLines
    };
  }

  const virtualRootNode = applyGraphVisualNodeStyle(applyRelationGraphNodeTextLayout({
    id: VIRTUAL_ROOT_NODE_ID,
    text: props.courseName || '课程知识图谱',
    borderColor: '#f59e0b',
    fontColor: '#000000',
    color: 'rgba(245, 158, 11, 0.16)',
    data: {
      content: '',
      category: 'virtual-root',
      isVirtualRoot: true
    }
  }), visualContext);

  const virtualLinks = stableRootIds.map((rootId, index) => ({
    from: VIRTUAL_ROOT_NODE_ID,
    to: rootId,
    text: '',
    id: `virtual_root_${index}`
  }));

  return {
    rootId: VIRTUAL_ROOT_NODE_ID,
    nodes: [virtualRootNode, ...visibleProcessedNodes],
    links: [
      ...virtualLinks.map(line => applyGraphVisualLineStyle(line)),
      ...visibleStyledLines
    ]
  };
};

// 定义 emits
const emit = defineEmits<{
  nodeClick: [node: RGNode, event: RGUserEvent];
  lineClick: [line: RGLine, link: RGLink, event: RGUserEvent];
  canvasClick: [event: RGUserEvent];
}>();

// 响应式数据
const bidirectionalTreeRef = ref<RelationGraphComponent | null>(null);
const {
  fullscreenContainerRef,
  handleRelationGraphFullscreen,
  isGraphFullscreen,
  syncNativeFullscreenState,
  toggleGraphFullscreen
} = useGraphFullscreen(bidirectionalTreeRef, 'BidirectionalTreeLayoutComponent');

// 动态CSS类 - 只使用水平双向树
const layoutCssClass = computed(() => 'layout-bidirectional-tree layout-horizontal');

// 水平双向树布局配置
const horizontalBidirectionalOptions: RGOptions = {
  'backgroundImageNoRepeat': true,
  'moveToCenterWhenRefresh': false,
  'zoomToFitWhenRefresh': false,
  'defaultNodeBorderWidth': 1,
  'defaultNodeShape': 1,
  'layout': {
    'label': '水平双向树',
    'layoutName': 'fixed',
    'layoutDirection': 'h',  // 水平方向
    'centerOffset_x': 0,
    'centerOffset_y': 0,
    'distance_coefficient': 1,
    'levelDistance': '',
    'min_per_width': 260,   // 最小宽度间距
    'max_per_width': 420,   // 最大宽度间距
    'min_per_height': 80,   // 最小高度间距
    'max_per_height': 140,   // 最大高度间距
    'maxLayoutTimes': 300,
    'force_node_repulsion': 1,
    'force_line_elastic': 1
  },
  'defaultLineMarker': {
    ...graphVisualTheme.lineMarker,
    'color': graphVisualTheme.line.default
  },
  // 移除重复的 defaultNodeShape，已在第80行定义
  'defaultNodeWidth': 150,  // 更长的节点宽度
  'defaultNodeHeight': 50,  // 保持较小的高度，形成3:1的长宽比
  'defaultLineShape': 4,  // 使用曲线连接，更适合双向树
  'defaultJunctionPoint': 'lr',  // 长方形节点使用左右连接点
  'defaultLineColor': '#111827',
  'defaultLineWidth': 2,
  'defaultNodeColor': '#ffffff',
  'defaultNodeFontColor': '#1e293b',
  'defaultExpandHolderPosition': 'hide',
  'defaultLineTextOffset_x': -8,
  'defaultLineTextOffset_y': -1,
  'allowShowFullscreenMenu': false,
  'allowShowMiniToolBar': true,
  'allowShowMiniView': true
  // 移除重复的 zoomToFitWhenRefresh，已在第78行定义
};



// 动态调整布局参数的函数
const getDynamicLayoutOptions = (nodeCount: number, maxDepth: number) => {
  let nodeWidth = 150;  // 更长的节点宽度，与配置保持一致
  let nodeHeight = 50;  // 保持较小的高度，形成3:1的长宽比
  let minPerWidth = 300;  // 增加最小宽度以适应更长的节点
  let maxPerWidth = 400;
  let minPerHeight = 60;
  let maxPerHeight = 80;

  // 根据节点数量调整尺寸 - 保持3:1长宽比
  if (nodeCount <= 10) {
    // 小规模图谱：节点较大，间距较大
    nodeWidth = 180;  // 3:1比例
    nodeHeight = 60;
    minPerWidth = 350;
    maxPerWidth = 450;
    minPerHeight = 80;
    maxPerHeight = 100;
  } else if (nodeCount <= 30) {
    // 中等规模图谱：标准大小
    nodeWidth = 150;  // 3:1比例
    nodeHeight = 50;
    minPerWidth = 300;
    maxPerWidth = 400;
    minPerHeight = 60;
    maxPerHeight = 80;
  } else {
    // 大规模图谱：节点较小，间距较小
    nodeWidth = 120;  // 3:1比例
    nodeHeight = 40;
    minPerWidth = 250;
    maxPerWidth = 350;
    minPerHeight = 50;
    maxPerHeight = 70;
  }

  return {
    nodeWidth,
    nodeHeight,
    minPerWidth,
    maxPerWidth,
    minPerHeight,
    maxPerHeight
  };
};

const BIDIRECTIONAL_DEPTH_GAP = 320;
const BIDIRECTIONAL_ROW_GAP = 120;

const getBidirectionalNodeId = (node: any) => String(node?.id || '');

const appendBranchNode = (childrenByParent: Map<string, any[]>, parentId: string, child: any) => {
  if (!parentId || !child) {
    return;
  }

  if (!childrenByParent.has(parentId)) {
    childrenByParent.set(parentId, []);
  }
  childrenByParent.get(parentId)!.push(child);
};

const buildDirectionalBranchMaps = (graphData: any, nodeById: Map<string, any>) => {
  const outgoingChildrenByParent = new Map<string, any[]>();
  const incomingChildrenByParent = new Map<string, any[]>();

  (graphData.links || []).forEach((link: any) => {
    const fromId = String(link.from || '');
    const toId = String(link.to || '');
    if (!fromId || !toId || fromId === toId) {
      return;
    }

    const fromNode = nodeById.get(fromId);
    const toNode = nodeById.get(toId);
    if (fromNode && toNode) {
      appendBranchNode(outgoingChildrenByParent, fromId, toNode);
      appendBranchNode(incomingChildrenByParent, toId, fromNode);
    }
  });

  return {
    outgoingChildrenByParent,
    incomingChildrenByParent
  };
};

const getUniqueBranchNodes = (nodes: any[], excludedNodeIds = new Set<string>()) => {
  const seenNodeIds = new Set<string>(excludedNodeIds);
  const uniqueNodes: any[] = [];

  nodes.forEach(node => {
    const nodeId = getBidirectionalNodeId(node);
    if (!nodeId || seenNodeIds.has(nodeId)) {
      return;
    }

    seenNodeIds.add(nodeId);
    uniqueNodes.push(node);
  });

  return uniqueNodes;
};

const getBranchWeight = (
  node: any,
  childrenByParent: Map<string, any[]>,
  visitedNodeIds = new Set<string>()
) => {
  const nodeId = getBidirectionalNodeId(node);
  if (!nodeId || visitedNodeIds.has(nodeId)) {
    return 0;
  }

  visitedNodeIds.add(nodeId);
  return 1 + (childrenByParent.get(nodeId) || [])
    .reduce((total, child) => total + getBranchWeight(child, childrenByParent, visitedNodeIds), 0);
};

const splitBranchesByWeight = (nodes: any[], childrenByParent: Map<string, any[]>) => {
  const leftBranches: any[] = [];
  const rightBranches: any[] = [];
  let leftWeight = 0;
  let rightWeight = 0;

  nodes.forEach(node => {
    const branchWeight = getBranchWeight(node, childrenByParent);
    if (rightWeight <= leftWeight) {
      rightBranches.push(node);
      rightWeight += branchWeight;
      return;
    }

    leftBranches.push(node);
    leftWeight += branchWeight;
  });

  return {
    leftBranches,
    rightBranches
  };
};

const resolveBidirectionalBranches = (
  rootId: string,
  outgoingChildrenByParent: Map<string, any[]>,
  incomingChildrenByParent: Map<string, any[]>
) => {
  const excludedRootIds = new Set([rootId]);
  const incomingRootBranches = getUniqueBranchNodes(incomingChildrenByParent.get(rootId) || [], excludedRootIds);
  const incomingRootBranchIds = new Set(incomingRootBranches.map(getBidirectionalNodeId));
  const outgoingRootBranches = getUniqueBranchNodes(outgoingChildrenByParent.get(rootId) || [], excludedRootIds)
    .filter(node => !incomingRootBranchIds.has(getBidirectionalNodeId(node)));

  if (incomingRootBranches.length > 0 && outgoingRootBranches.length > 0) {
    return {
      leftBranches: incomingRootBranches,
      rightBranches: outgoingRootBranches,
      leftChildrenByParent: incomingChildrenByParent,
      rightChildrenByParent: outgoingChildrenByParent
    };
  }

  const sourceBranches = incomingRootBranches.length > 0 ? incomingRootBranches : outgoingRootBranches;
  const sourceChildrenByParent = incomingRootBranches.length > 0
    ? incomingChildrenByParent
    : outgoingChildrenByParent;
  const branchGroups = splitBranchesByWeight(sourceBranches, sourceChildrenByParent);

  return {
    ...branchGroups,
    leftChildrenByParent: sourceChildrenByParent,
    rightChildrenByParent: sourceChildrenByParent
  };
};

const applyBidirectionalPositions = (graphData: any) => {
  if (!graphData?.nodes?.length) return graphData;

  const nodeById = new Map<string, any>();
  graphData.nodes.forEach((node: any) => {
    nodeById.set(String(node.id), node);
  });

  const {
    outgoingChildrenByParent,
    incomingChildrenByParent
  } = buildDirectionalBranchMaps(graphData, nodeById);

  const rootId = String(graphData.rootId || graphData.nodes[0]?.id || '');
  const root = nodeById.get(rootId);
  if (root) {
    root.x = 0;
    root.y = 0;
    root.fixed = true;
    root.data = { ...(root.data || {}), branchSide: 'root' };
    if (root.data.hasTreeChildren === true) {
      root.innerHTML = buildBidirectionalNodeHtml(
        String(root.text || ''),
        true,
        root.data.isTreeCollapsed === true,
        'right'
      );
    }
  }

  const {
    leftBranches,
    rightBranches,
    leftChildrenByParent,
    rightChildrenByParent
  } = resolveBidirectionalBranches(rootId, outgoingChildrenByParent, incomingChildrenByParent);

  let rightRow = 0;
  rightBranches.forEach((node) => {
    rightRow = placeBranch(node, 1, 1, rightRow, rightChildrenByParent, new Set([rootId]));
  });

  let leftRow = 0;
  leftBranches.forEach((node) => {
    leftRow = placeBranch(node, -1, 1, leftRow, leftChildrenByParent, new Set([rootId]));
  });

  return graphData;
};

const placeBranch = (
  node: any,
  side: number,
  depth: number,
  row: number,
  childrenByParent: Map<string, any[]>,
  visitedNodeIds: Set<string>
) => {
  const nodeId = getBidirectionalNodeId(node);
  if (!nodeId || visitedNodeIds.has(nodeId)) {
    return row;
  }

  visitedNodeIds.add(nodeId);
  const children = (childrenByParent.get(nodeId) || [])
    .filter(child => {
      const childId = getBidirectionalNodeId(child);
      return childId && !visitedNodeIds.has(childId);
    });
  const startRow = row;
  let nextRow = row;

  children.forEach((child) => {
    nextRow = placeBranch(child, side, depth + 1, nextRow, childrenByParent, visitedNodeIds);
  });

  const childRows = children
    .map(child => Number(child.y))
    .filter(value => Number.isFinite(value));
  const y = childRows.length
    ? childRows.reduce((total, value) => total + value, 0) / childRows.length
    : getBranchY(side, startRow);

  node.x = side * depth * BIDIRECTIONAL_DEPTH_GAP;
  node.y = y;
  node.fixed = true;
  node.data = {
    ...(node.data || {}),
    branchSide: side === 1 ? 'right' : 'left'
  };
  if (node.data.hasTreeChildren === true) {
    node.innerHTML = buildBidirectionalNodeHtml(
      String(node.text || ''),
      true,
      node.data.isTreeCollapsed === true,
      side === 1 ? 'right' : 'left'
    );
  }

  return children.length ? nextRow : nextRow + 1;
};

const getBranchY = (side: number, row: number) => {
  const offsetRow = row + 1;
  return side === 1 ? offsetRow * BIDIRECTIONAL_ROW_GAP : -offsetRow * BIDIRECTIONAL_ROW_GAP;
};

// 计算当前双向树布局配置 - 只使用水平布局
const currentBidirectionalOptions = computed(() => {
  // 获取动态参数（这里先使用默认值，实际会在数据加载后更新）
  const dynamicParams = getDynamicLayoutOptions(50, 5); // 默认参数

  // 根据设置调整配置
  const options = {
    ...horizontalBidirectionalOptions,
    defaultNodeWidth: dynamicParams.nodeWidth,
    defaultNodeHeight: dynamicParams.nodeHeight,
    allowShowMiniToolBar: props.settings.enableZoom,
    allowShowMiniView: props.settings.enableZoom,
    useAnimationWhenExpanded: props.settings.enableAnimation,
    useAnimationWhenRefresh: props.settings.enableAnimation
  };

  // 更新布局参数
  if (options.layout) {
    options.layout.min_per_width = dynamicParams.minPerWidth;
    options.layout.max_per_width = dynamicParams.maxPerWidth;
    options.layout.min_per_height = dynamicParams.minPerHeight;
    options.layout.max_per_height = dynamicParams.maxPerHeight;
  }

  return options;
});

// 加载真实的知识图谱数据
const loadRealGraphData = async () => {
  const targetId = props.graphId || props.courseId;
  if (!targetId) {
    console.warn('BidirectionalTreeLayoutComponent: 缺少targetId，无法加载数据');
    return;
  }

  try {
    console.log('BidirectionalTreeLayoutComponent: 开始加载真实数据，targetId:', targetId);

    // 1. 获取节点数据
    const nodesResponse = await getKnowledgeGraphNodes(String(targetId));
    
    let nodes: any[] = [];
    if (nodesResponse && nodesResponse.rows) {
      nodes = nodesResponse.rows;
    } else if (Array.isArray(nodesResponse)) {
      nodes = nodesResponse;
    }

    if (!nodes || nodes.length === 0) {
      console.warn('BidirectionalTreeLayoutComponent: 没有找到节点数据');
      // 显示空状态
      const emptyData = {
        rootId: 'empty',
        nodes: [{ id: 'empty', text: '暂无知识图谱数据' }],
        links: []
      };
      await renderBidirectionalTree(emptyData);
      return;
    }

    console.log('BidirectionalTreeLayoutComponent: 获取到节点数据，数量:', nodes.length);

    // 2. 处理节点数据
    const processedNodes = nodes.map(node => applyRelationGraphNodeTextLayout({
      id: node.id.toString(),
      text: node.name || `节点${node.id}`,
      borderColor: '#cbd5e1',
      fontColor: '#1e293b',
      color: '#ffffff',
      data: {
        content: node.content || '',
        category: node.category || 'default',
        originalData: node
      }
    }));

    // 3. 获取连线数据
    const linePromises = nodes.map((node: any) => {
      return getNodeLines(node.id).catch(error => {
        console.warn(`BidirectionalTreeLayoutComponent: 获取节点${node.id}连线失败:`, error);
        return [];
      });
    });
    const linesArrays = await Promise.all(linePromises);

    // 4. 处理连线数据
    const allLines = linesArrays.flat();
    const processedLines = allLines.map((line, index) => ({
      from: line.nodeId?.toString() || '',
      to: line.targetId?.toString() || '',
      text: line.content || '',
      id: line.id ? line.id.toString() : `line_${index}`
    })).filter(line => line.from && line.to);

    collapsedBidirectionalNodeIds.value = new Set();
    rawBidirectionalNodes.value = nodes;
    rawBidirectionalProcessedNodes.value = processedNodes;
    rawBidirectionalProcessedLines.value = processedLines;

    // 5. 构建图谱数据
    const graphData = applyBidirectionalPositions(buildGraphData(nodes, processedNodes, processedLines));

    console.log('BidirectionalTreeLayoutComponent: 真实数据构建完成:', graphData);

    // 6. 渲染图谱
    await renderBidirectionalTree(graphData);

  } catch (error) {
    console.error('BidirectionalTreeLayoutComponent: 加载真实数据失败:', error);
    // 显示错误状态
    const emptyData = {
      rootId: 'empty',
      nodes: [{ id: 'empty', text: '暂无数据' }],
      links: []
    };
    await renderBidirectionalTree(emptyData);
  }
};

// 渲染双向树图谱
const renderBidirectionalTree = async (graphData: any, options: { resetView?: boolean } = {}) => {
  const { resetView = true } = options;
  const graphInstance = bidirectionalTreeRef.value?.getInstance();
  if (graphInstance) {
    try {
      const positionedGraphData = applyBidirectionalPositions(graphData);
      // 根据实际数据动态调整布局参数
      const nodeCount = positionedGraphData.nodes ? positionedGraphData.nodes.length : 0;
      const maxDepth = calculateMaxDepth(positionedGraphData);
      const dynamicParams = getDynamicLayoutOptions(nodeCount, maxDepth);
      const maxNodeSize = getMaxRelationGraphNodeSize(positionedGraphData.nodes || []);

      // 更新布局配置
      const updatedOptions = { ...currentBidirectionalOptions.value };
      if (updatedOptions.layout) {
        updatedOptions.layout.min_per_width = Math.max(dynamicParams.minPerWidth, maxNodeSize.width + 120);
        updatedOptions.layout.max_per_width = dynamicParams.maxPerWidth;
        updatedOptions.layout.min_per_height = Math.max(dynamicParams.minPerHeight, maxNodeSize.height + 40);
        updatedOptions.layout.max_per_height = dynamicParams.maxPerHeight;
      }
      updatedOptions.defaultNodeWidth = Math.max(dynamicParams.nodeWidth, maxNodeSize.width);
      updatedOptions.defaultNodeHeight = Math.max(dynamicParams.nodeHeight, maxNodeSize.height);

      await graphInstance.setOptions(updatedOptions);
      await graphInstance.setJsonData(positionedGraphData);

      const leftNodes: RGNode[] = [];

      for (const node of graphInstance.getNodes()) {
        if (node.data?.branchSide === 'left') {
          leftNodes.push(node);
        }
      }

      // 处理左侧连线的文本位置
      const leftLines = graphInstance.getLinks()
        .filter(link => leftNodes.includes(link.fromNode) || leftNodes.includes(link.toNode))
        .reduce((currentLines: RGLine[], link: RGLink) => currentLines.concat(...link.relations), []);

      for (const line of leftLines) {
        line.placeText = 'start';  // 左侧连线文本放在起始位置
      }

      if (resetView) {
        await graphInstance.refresh();
        await graphInstance.moveToCenter();
        await graphInstance.zoomToFit();
      } else {
        (graphInstance as any).updateElementLines?.();
        (graphInstance as any).dataUpdated?.();
      }
      console.log(`BidirectionalTreeLayoutComponent: 双向树渲染完成 (节点数: ${nodeCount}, 最大深度: ${maxDepth})`);
    } catch (error) {
      console.error('BidirectionalTreeLayoutComponent: 图谱渲染失败:', error);
    }
  }
};

const refreshBidirectionalVisualState = async () => {
  if (!rawBidirectionalNodes.value.length || !rawBidirectionalProcessedNodes.value.length) {
    return;
  }

  const graphData = applyBidirectionalPositions(buildGraphData(
    rawBidirectionalNodes.value,
    rawBidirectionalProcessedNodes.value,
    rawBidirectionalProcessedLines.value
  ));
  await renderBidirectionalTree(graphData, { resetView: false });
};

const searchNodes = (keyword: string) => {
  return searchGraphNodes(keyword, rawBidirectionalProcessedNodes.value);
};

const revealBidirectionalNodePath = async (nodeId: string) => {
  const ancestorNodeIds = resolveTreeAncestorNodeIds(
    nodeId,
    rawBidirectionalNodes.value,
    rawBidirectionalProcessedLines.value
  );
  if (ancestorNodeIds.length === 0) {
    return;
  }

  const nextCollapsedNodeIds = new Set(collapsedBidirectionalNodeIds.value);
  let hasChanged = false;
  ancestorNodeIds.forEach(ancestorNodeId => {
    if (nextCollapsedNodeIds.delete(ancestorNodeId)) {
      hasChanged = true;
    }
  });

  if (!hasChanged) {
    return;
  }

  collapsedBidirectionalNodeIds.value = nextCollapsedNodeIds;
  const graphData = applyBidirectionalPositions(buildGraphData(
    rawBidirectionalNodes.value,
    rawBidirectionalProcessedNodes.value,
    rawBidirectionalProcessedLines.value
  ));
  await renderBidirectionalTree(graphData, { resetView: false });
  await nextTick();
};

const centerBidirectionalNodeById = (graphInstance: any, nodeId: string) => {
  const targetNode = graphInstance.getNodeById?.(nodeId);
  if (!targetNode) {
    return false;
  }

  graphInstance.resetViewSize?.(false);
  const nodeWidth = Number(targetNode.width || currentBidirectionalOptions.value.defaultNodeWidth || 0);
  const nodeHeight = Number(targetNode.height || currentBidirectionalOptions.value.defaultNodeHeight || 0);
  graphInstance.setCanvasCenter(
    Number(targetNode.x || 0) + nodeWidth / 2,
    Number(targetNode.y || 0) + nodeHeight / 2
  );
  graphInstance.setCheckedNode?.(nodeId);
  graphInstance.refreshNVAnalysisInfo?.();
  return true;
};

const focusNodeById = async (nodeId: string) => {
  const normalizedNodeId = normalizeNodeId(nodeId);
  if (!normalizedNodeId) {
    return;
  }

  await revealBidirectionalNodePath(normalizedNodeId);

  const graphInstance = bidirectionalTreeRef.value?.getInstance();
  if (!graphInstance) {
    return;
  }

  await nextTick();
  if (centerBidirectionalNodeById(graphInstance, normalizedNodeId)) {
    return;
  }

  if (typeof (graphInstance as any).focusNodeById === 'function') {
    await (graphInstance as any).focusNodeById(normalizedNodeId);
  }
};

const fitView = async () => {
  const graphInstance = bidirectionalTreeRef.value?.getInstance();
  if (!graphInstance) {
    return;
  }

  await graphInstance.moveToCenter();
  await graphInstance.zoomToFit();
};

// 计算图谱的最大深度
const calculateMaxDepth = (graphData: any): number => {
  if (!graphData.nodes || !graphData.links) return 1;

  // 构建邻接表
  const adjacencyList: { [key: string]: string[] } = {};
  graphData.nodes.forEach((node: any) => {
    adjacencyList[node.id] = [];
  });

  graphData.links.forEach((link: any) => {
    if (adjacencyList[link.from]) {
      adjacencyList[link.from].push(link.to);
    }
  });

  // 从根节点开始BFS计算最大深度
  const rootId = graphData.rootId;
  if (!rootId) return 1;

  let maxDepth = 1;
  const visited = new Set();
  const queue = [{ id: rootId, depth: 1 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (visited.has(id)) continue;

    visited.add(id);
    maxDepth = Math.max(maxDepth, depth);

    if (adjacencyList[id]) {
      adjacencyList[id].forEach(childId => {
        if (!visited.has(childId)) {
          queue.push({ id: childId, depth: depth + 1 });
        }
      });
    }
  }

  return maxDepth;
};



// 处理节点点击
const onNodeClick = (nodeObject: RGNode, $event: RGUserEvent) => {
  const target = $event?.target as HTMLElement | undefined;
  if (target?.closest?.('.kg-tree-toggle')) {
    void toggleBidirectionalNode(nodeObject, $event).catch((error) => {
      console.error('BidirectionalTreeLayoutComponent: 切换节点展开状态失败:', error);
    });
    return false;
  }

  if (isVirtualRootNode(nodeObject)) {
    return;
  }
  console.log('BidirectionalTreeLayoutComponent: 节点点击:', nodeObject);
  emit('nodeClick', nodeObject, $event);
};

const toggleBidirectionalNode = async (nodeObject: RGNode, event?: Event) => {
  event?.preventDefault?.();
  event?.stopPropagation?.();

  const nodeId = normalizeNodeId(nodeObject?.id);
  if (!nodeId || isVirtualRootNode(nodeObject) || nodeObject.data?.hasTreeChildren !== true) {
    return;
  }

  const nextCollapsedNodeIds = new Set(collapsedBidirectionalNodeIds.value);
  if (nextCollapsedNodeIds.has(nodeId)) {
    nextCollapsedNodeIds.delete(nodeId);
  } else {
    nextCollapsedNodeIds.add(nodeId);
  }
  collapsedBidirectionalNodeIds.value = nextCollapsedNodeIds;

  const graphData = applyBidirectionalPositions(buildGraphData(
    rawBidirectionalNodes.value,
    rawBidirectionalProcessedNodes.value,
    rawBidirectionalProcessedLines.value
  ));
  await renderBidirectionalTree(graphData, { resetView: false });
};

// 处理连线点击
const onLineClick = (lineObject: RGLine, linkObject: RGLink, $event: RGUserEvent) => {
  console.log('BidirectionalTreeLayoutComponent: 连线点击:', lineObject);
  emit('lineClick', lineObject, linkObject, $event);
};

const onCanvasClick = ($event: RGUserEvent) => {
  emit('canvasClick', $event);
};



// 组件挂载后加载数据
onMounted(() => {
  document.addEventListener('fullscreenchange', syncNativeFullscreenState);

  // 延迟加载以确保组件完全初始化
  setTimeout(() => {
    loadRealGraphData();
  }, 1000);
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncNativeFullscreenState);
});

watch(() => [props.courseId, props.graphId, props.courseName], () => {
  loadRealGraphData();
}, { immediate: false });

watch(() => props.interactionState?.selectedNodeId, () => {
  void refreshBidirectionalVisualState();
}, { immediate: false });

// 暴露方法给父组件
defineExpose({
  loadRealGraphData,
  searchNodes,
  focusNodeById,
  fitView
});
</script>

<style lang="scss" scoped>
.bidirectional-tree-container {
  width: 100%;
  height: 100%;
  position: relative;
}



.bidirectional-tree-viewport {
  position: relative;
  width: 100%;
  height: calc(100vh);
  background: #f8fafc;
}

/* 双向树布局样式 - 内联版本 */
.layout-bidirectional-tree {
  background-color: #f8fafc;
}

/* 节点基础样式 - 强制覆盖白色背景 */
::v-deep(.layout-bidirectional-tree .rel-node),
::v-deep(.layout-bidirectional-tree .rel-node-peel),
::v-deep(.layout-bidirectional-tree .rel-node-peel-checked),
::v-deep(.layout-bidirectional-tree .rel-nodediv),
::v-deep(.layout-bidirectional-tree .rel-node > *),
::v-deep(.layout-bidirectional-tree .rel-node-peel > *),
::v-deep(.layout-bidirectional-tree .rel-nodediv > *),
::v-deep(.layout-bidirectional-tree .rel-node > div),
::v-deep(.layout-bidirectional-tree .rel-node-peel > div),
::v-deep(.layout-bidirectional-tree .rel-nodediv > div) {
  box-sizing: border-box !important;
  border-radius: 8px !important;
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 8px 18px rgba(15, 23, 42, 0.07) !important;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease !important;
}

/* 节点悬停效果 */
::v-deep(.layout-bidirectional-tree .rel-node:hover),
::v-deep(.layout-bidirectional-tree .rel-node-peel:hover),
::v-deep(.layout-bidirectional-tree .rel-nodediv:hover) {
  border-color: #0e7490 !important;
  box-shadow:
    0 2px 5px rgba(15, 23, 42, 0.06),
    0 12px 24px rgba(15, 76, 117, 0.12) !important;
  transform: translateY(-1px) scale(1.01) !important;
  filter: brightness(1.02) !important;
}

/* 连线样式 */
::v-deep(.layout-bidirectional-tree .rel-line) {
  stroke: #c8d2de !important;
  stroke-width: 1.1px !important;
  transition: stroke 0.2s ease, stroke-width 0.2s ease, opacity 0.2s ease !important;
}

::v-deep(.layout-bidirectional-tree .rel-line:hover) {
  stroke: #8fb1c7 !important;
  stroke-width: 1.7px !important;
}

/* 节点文本样式 */
::v-deep(.layout-bidirectional-tree .c-node-text),
::v-deep(.layout-bidirectional-tree .rel-node-text),
::v-deep(.layout-bidirectional-tree .rel-node .c-node-text),
::v-deep(.layout-bidirectional-tree .rel-node text) {
  fill: #1e293b !important;
  color: #1e293b !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 1.2 !important;
  padding: 4px !important;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.85) !important;
}

/* 连线文本样式 */
::v-deep(.layout-bidirectional-tree .rel-line-text) {
  fill: #64748b !important;
  font-size: 10px !important;
  font-weight: normal !important;
}

::v-deep(.kg-node-label) {
  box-sizing: border-box;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  height: 100%;
  padding: 4px 8px;
  line-height: 20px;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  text-align: center;
}

::v-deep(.kg-tree-node-shell) {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

::v-deep(.kg-tree-toggle) {
  position: absolute;
  top: 50%;
  width: 18px;
  height: 18px;
  border: 1px solid #2563eb;
  border-radius: 50%;
  background: #2563eb;
  color: #ffffff;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  line-height: 16px;
  padding: 0;
  transform: translateY(-50%);
  z-index: 5;
}

::v-deep(.kg-tree-toggle-left) {
  left: -20px;
}

::v-deep(.kg-tree-toggle-right) {
  right: -20px;
}

::v-deep(.kg-tree-toggle:hover) {
  background: #1d4ed8;
  border-color: #1d4ed8;
}


</style>
