<template>
  <div class="tree-layout-container" :class="layoutCssClass">
    <div ref="fullscreenContainerRef" class="tree-layout-viewport">
      <GraphFullscreenToggle :active="isGraphFullscreen" @toggle="toggleGraphFullscreen" />
      <RelationGraph
        ref="treeGraphRef"
        :options="currentTreeOptions"
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
import RelationGraph, { RGJsonData, RGOptions, RGNode, RGLine, RGLink, RGUserEvent, RelationGraphComponent } from 'relation-graph-vue3';
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
    layoutType: 'tree',
    treeDirection: 'horizontal',
    showLabels: true,
    enableZoom: true,
    enableDrag: true,
    maxNodes: 100,
    enableAnimation: true
  })
});

const collapsedTreeNodeIds = ref<Set<string>>(new Set());
const rawTreeNodes = ref<any[]>([]);
const rawTreeProcessedNodes = ref<Array<Record<string, unknown>>>([]);
const rawTreeProcessedLines = ref<Array<Record<string, unknown>>>([]);

const buildTreeToggleHtml = (hasChildren: boolean, isCollapsed: boolean) => {
  if (!hasChildren) {
    return '';
  }

  const toggleText = isCollapsed ? '+' : '-';
  const toggleLabel = isCollapsed ? '展开子节点' : '收起子节点';
  return `<button type="button" class="kg-tree-toggle kg-tree-toggle-right" aria-label="${toggleLabel}" title="${toggleLabel}">${toggleText}</button>`;
};

const buildTreeNodeHtml = (text: string, hasChildren: boolean, isCollapsed: boolean) => {
  const safeText = escapeNodeHtml(text);
  return `<div class="kg-tree-node-shell">
    ${buildTreeToggleHtml(hasChildren, isCollapsed)}
    <div class="kg-node-label" title="${safeText}">${safeText}</div>
  </div>`;
};

const applyTreeNodeToggleState = (
  node: Record<string, unknown>,
  childrenByParentId: Map<string, string[]>,
  visualContext: Record<string, unknown>
) => {
  const nodeId = normalizeNodeId(node.id);
  const hasChildren = Boolean(childrenByParentId.get(nodeId)?.length);
  const isCollapsed = collapsedTreeNodeIds.value.has(nodeId);
  const text = String(node.text || '');

  return applyGraphVisualNodeStyle({
    ...node,
    expanded: !isCollapsed,
    expandHolderPosition: 'hide',
    innerHTML: buildTreeNodeHtml(text, hasChildren, isCollapsed),
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
  const visibleNodeIds = resolveVisibleTreeNodeIds(stableRootIds, childrenByParentId, collapsedTreeNodeIds.value);
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
    .map(node => applyTreeNodeToggleState(node, childrenByParentId, visualContext));
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

  const virtualRootNode = applyRelationGraphNodeTextLayout({
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
  });
  const styledVirtualRootNode = applyGraphVisualNodeStyle(
    applyTreeNodeToggleState(virtualRootNode, childrenByParentId, visualContext),
    visualContext
  );

  const virtualLinks = stableRootIds.map((rootId, index) => ({
    from: VIRTUAL_ROOT_NODE_ID,
    to: rootId,
    text: '',
    id: `virtual_root_${index}`
  }));

  return {
    rootId: VIRTUAL_ROOT_NODE_ID,
    nodes: [styledVirtualRootNode, ...visibleProcessedNodes],
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
const treeGraphRef = ref<RelationGraphComponent | null>(null);
const {
  fullscreenContainerRef,
  handleRelationGraphFullscreen,
  isGraphFullscreen,
  syncNativeFullscreenState,
  toggleGraphFullscreen
} = useGraphFullscreen(treeGraphRef, 'TreeLayoutComponent');
// 只保留水平布局
const currentTreeType = ref<'horizontal'>('horizontal');

// 动态CSS类 - 只使用水平树形布局
const layoutCssClass = computed(() => 'layout-horizontal-tree');

// 水平树形布局配置 - 真正的树形布局
const horizontalTreeOptions: RGOptions = {
  'backgroundImageNoRepeat': true,
  'moveToCenterWhenRefresh': false,
  'zoomToFitWhenRefresh': false,
  'defaultNodeBorderWidth': 1,
  'defaultNodeShape': 1,
  'layout': {
    'label': '水平树形',
    'layoutName': 'tree',
    'from': 'left',  // 从左侧开始展开
    'layoutDirection': 'h',  // 水平方向
    'centerOffset_x': 0,
    'centerOffset_y': 0,
    'distance_coefficient': 1,
    'levelDistance': '',
    'min_per_width': 100,   // 最小宽度间距
    'max_per_width': 500,   // 最大宽度间距
    'min_per_height': 300,  // 最小高度间距
    'max_per_height': 500,  // 最大高度间距
    'maxLayoutTimes': 300,
    'force_node_repulsion': 1,
    'force_line_elastic': 1
  },
  'defaultLineMarker': {
    ...graphVisualTheme.lineMarker,
    'color': graphVisualTheme.line.default
  },
  // 移除重复的 defaultNodeShape，已在第70行定义
  'defaultNodeWidth': 150,  // 更长的节点宽度，3:1比例
  'defaultNodeHeight': 50,  // 保持较小的高度，形成3:1的长宽比
  'defaultLineShape': 1,  // 使用直线连接
  'defaultJunctionPoint': 'lr',  // 长方形节点使用左右连接点
  // 移除重复的 defaultNodeBorderWidth，已在第69行定义
  'defaultLineColor': '#111827',
  'defaultLineWidth': 2,
  'defaultNodeColor': '#ffffff',
  'defaultNodeFontColor': '#1e293b',
  'defaultNodeFontSize': 13,
  'defaultExpandHolderPosition': 'hide',
  'allowShowFullscreenMenu': false,
  'allowShowMiniToolBar': true,
  'allowShowMiniView': true
  // 移除重复的 zoomToFitWhenRefresh，已在第68行定义
};





// 动态调整布局参数的函数 - 只处理水平树形布局
const getDynamicLayoutOptions = (nodeCount: number, maxDepth: number) => {
  // 水平树形：水平长方形节点，3:1比例
  let nodeWidth = 150;  // 更长的节点宽度
  let nodeHeight = 50;  // 保持较小的高度，形成3:1的长宽比
  let minPerWidth = 200;  // 增加最小宽度以适应更长的节点
  let maxPerWidth = 600;
  let minPerHeight = 300;
  let maxPerHeight = 500;

  // 根据节点数量调整尺寸 - 保持3:1长宽比
  if (nodeCount <= 10) {
    // 小规模图谱：节点较大，间距较大
    nodeWidth = 180;  // 3:1比例
    nodeHeight = 60;
    minPerWidth = 250;
    maxPerWidth = 700;
    minPerHeight = 350;
    maxPerHeight = 550;
  } else if (nodeCount <= 30) {
    // 中等规模图谱：标准大小
    nodeWidth = 150;  // 3:1比例
    nodeHeight = 50;
    minPerWidth = 200;
    maxPerWidth = 600;
    minPerHeight = 300;
    maxPerHeight = 500;
  } else {
    // 大规模图谱：节点较小，间距较小
    nodeWidth = 120;  // 3:1比例
    nodeHeight = 40;
    minPerWidth = 150;
    maxPerWidth = 500;
    minPerHeight = 250;
    maxPerHeight = 400;
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

// 计算当前树形布局配置 - 只使用水平布局
const currentTreeOptions = computed(() => {
  const baseOptions = horizontalTreeOptions;

  // 获取动态参数（这里先使用默认值，实际会在数据加载后更新）
  const dynamicParams = getDynamicLayoutOptions(50, 5); // 默认参数

  // 根据设置调整配置
  const options = {
    ...baseOptions,
    // 树形布局使用长方形节点
    defaultNodeShape: 1,
    defaultNodeWidth: dynamicParams.nodeWidth,
    defaultNodeHeight: dynamicParams.nodeHeight,
    // 树形布局使用直线连接
    defaultLineShape: 1,
    allowShowFullscreenMenu: false,
    allowShowMiniToolBar: props.settings.enableZoom,
    allowShowMiniView: props.settings.enableZoom,
    useAnimationWhenExpanded: props.settings.enableAnimation,
    useAnimationWhenRefresh: props.settings.enableAnimation
  };

  // 更新树形布局参数
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
    console.warn('TreeLayoutComponent: 缺少targetId，无法加载数据');
    return;
  }

  try {
    console.log('TreeLayoutComponent: 开始加载真实数据，targetId:', targetId);

    // 1. 获取节点数据
    const nodesResponse = await getKnowledgeGraphNodes(String(targetId));
    
    let nodes: any[] = [];
    if (nodesResponse && nodesResponse.rows) {
      nodes = nodesResponse.rows;
    } else if (Array.isArray(nodesResponse)) {
      nodes = nodesResponse;
    }

    if (!nodes || nodes.length === 0) {
      console.warn('TreeLayoutComponent: 没有找到节点数据');
      // 显示空状态
      const emptyData = {
        rootId: 'empty',
        nodes: [{ id: 'empty', text: '暂无知识图谱数据' }],
        links: []
      };
      await renderTreeGraph(emptyData);
      return;
    }

    console.log('TreeLayoutComponent: 获取到节点数据，数量:', nodes.length);

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
      return getNodeLines(String(node.id)).catch(error => {
        console.warn(`TreeLayoutComponent: 获取节点${node.id}连线失败:`, error);
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

    collapsedTreeNodeIds.value = new Set();
    rawTreeNodes.value = nodes;
    rawTreeProcessedNodes.value = processedNodes;
    rawTreeProcessedLines.value = processedLines;

    // 5. 构建图谱数据
    const graphData = buildGraphData(nodes, processedNodes, processedLines);

    console.log('TreeLayoutComponent: 真实数据构建完成:', graphData);

    // 6. 渲染图谱
    await renderTreeGraph(graphData);

  } catch (error) {
    console.error('TreeLayoutComponent: 加载真实数据失败:', error);
    // 显示错误状态，不再回退到示例数据
    const emptyData = {
      rootId: 'empty',
      nodes: [{ id: 'empty', text: '暂无数据' }],
      links: []
    };
    await renderTreeGraph(emptyData);
  }
};



// 渲染树形图谱
const renderTreeGraph = async (graphData: any, options: { resetView?: boolean } = {}) => {
  const { resetView = true } = options;
  const graphInstance = treeGraphRef.value?.getInstance();
  if (graphInstance) {
    try {
      // 根据实际数据动态调整布局参数
      const nodeCount = graphData.nodes ? graphData.nodes.length : 0;
      const maxDepth = calculateMaxDepth(graphData);
      const dynamicParams = getDynamicLayoutOptions(nodeCount, maxDepth);
      const maxNodeSize = getMaxRelationGraphNodeSize(graphData.nodes || []);

      // 更新布局配置
      const updatedOptions = { ...currentTreeOptions.value };
      if (updatedOptions.layout) {
        updatedOptions.layout.min_per_width = Math.max(dynamicParams.minPerWidth, maxNodeSize.width + 80);
        updatedOptions.layout.max_per_width = dynamicParams.maxPerWidth;
        updatedOptions.layout.min_per_height = Math.max(dynamicParams.minPerHeight, maxNodeSize.height + 180);
        updatedOptions.layout.max_per_height = dynamicParams.maxPerHeight;
      }
      updatedOptions.defaultNodeWidth = Math.max(dynamicParams.nodeWidth, maxNodeSize.width);
      updatedOptions.defaultNodeHeight = Math.max(dynamicParams.nodeHeight, maxNodeSize.height);

      await graphInstance.setOptions(updatedOptions);
      await graphInstance.setJsonData(graphData);
      if (resetView) {
        await graphInstance.moveToCenter();
        await graphInstance.zoomToFit();
      }
      console.log(`TreeLayoutComponent: 图谱渲染完成 (节点数: ${nodeCount}, 最大深度: ${maxDepth})`);
    } catch (error) {
      console.error('TreeLayoutComponent: 图谱渲染失败:', error);
    }
  }
};

const refreshTreeVisualState = async () => {
  if (!rawTreeNodes.value.length || !rawTreeProcessedNodes.value.length) {
    return;
  }

  const graphData = buildGraphData(rawTreeNodes.value, rawTreeProcessedNodes.value, rawTreeProcessedLines.value);
  await renderTreeGraph(graphData, { resetView: false });
};

const searchNodes = (keyword: string) => {
  return searchGraphNodes(keyword, rawTreeProcessedNodes.value);
};

const revealTreeNodePath = async (nodeId: string) => {
  const ancestorNodeIds = resolveTreeAncestorNodeIds(
    nodeId,
    rawTreeNodes.value,
    rawTreeProcessedLines.value
  );
  if (ancestorNodeIds.length === 0) {
    return;
  }

  const nextCollapsedNodeIds = new Set(collapsedTreeNodeIds.value);
  let hasChanged = false;
  ancestorNodeIds.forEach(ancestorNodeId => {
    if (nextCollapsedNodeIds.delete(ancestorNodeId)) {
      hasChanged = true;
    }
  });

  if (!hasChanged) {
    return;
  }

  collapsedTreeNodeIds.value = nextCollapsedNodeIds;
  const graphData = buildGraphData(rawTreeNodes.value, rawTreeProcessedNodes.value, rawTreeProcessedLines.value);
  await renderTreeGraph(graphData, { resetView: false });
  await nextTick();
};

const focusNodeById = async (nodeId: string) => {
  const normalizedNodeId = normalizeNodeId(nodeId);
  if (!normalizedNodeId) {
    return;
  }

  await revealTreeNodePath(normalizedNodeId);

  const graphInstance = treeGraphRef.value?.getInstance();
  if (!graphInstance) {
    return;
  }

  if (typeof (graphInstance as any).focusNodeById === 'function') {
    await (graphInstance as any).focusNodeById(normalizedNodeId);
  }
};

const fitView = async () => {
  const graphInstance = treeGraphRef.value?.getInstance();
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

// 切换树形布局
const switchTreeLayout = async (newLayoutType?: 'horizontal' | 'vertical') => {
  if (newLayoutType) {
    currentTreeType.value = newLayoutType;
  }

  console.log('TreeLayoutComponent: 切换树形布局到:', currentTreeType.value);

  const graphInstance = treeGraphRef.value?.getInstance();
  if (graphInstance) {
    try {
      // 获取当前数据
      const currentData = graphInstance.getJsonData();

      // 更新配置
      await graphInstance.setOptions(currentTreeOptions.value);

      // 重新设置数据以应用新布局
      await graphInstance.setJsonData(currentData);

      // 居中和适配
      setTimeout(() => {
        graphInstance.moveToCenter();
        graphInstance.zoomToFit();
      }, 300);

    } catch (error) {
      console.error('TreeLayoutComponent: 切换布局失败:', error);
    }
  }
};

// 处理节点点击
const onNodeClick = (nodeObject: RGNode, $event: RGUserEvent) => {
  const target = $event?.target as HTMLElement | undefined;
  if (target?.closest?.('.kg-tree-toggle')) {
    void toggleTreeNode(nodeObject, $event).catch((error) => {
      console.error('TreeLayoutComponent: 切换节点展开状态失败:', error);
    });
    return false;
  }

  if (isVirtualRootNode(nodeObject)) {
    return;
  }
  console.log('TreeLayoutComponent: 节点点击:', nodeObject);
  emit('nodeClick', nodeObject, $event);
};

const toggleTreeNode = async (nodeObject: RGNode, event?: Event) => {
  event?.preventDefault?.();
  event?.stopPropagation?.();

  const nodeId = normalizeNodeId(nodeObject?.id);
  if (!nodeId || isVirtualRootNode(nodeObject) || nodeObject.data?.hasTreeChildren !== true) {
    return;
  }

  const nextCollapsedNodeIds = new Set(collapsedTreeNodeIds.value);
  if (nextCollapsedNodeIds.has(nodeId)) {
    nextCollapsedNodeIds.delete(nodeId);
  } else {
    nextCollapsedNodeIds.add(nodeId);
  }
  collapsedTreeNodeIds.value = nextCollapsedNodeIds;

  const graphData = buildGraphData(rawTreeNodes.value, rawTreeProcessedNodes.value, rawTreeProcessedLines.value);
  await renderTreeGraph(graphData, { resetView: false });
};

// 处理连线点击
const onLineClick = (lineObject: RGLine, linkObject: RGLink, $event: RGUserEvent) => {
  console.log('TreeLayoutComponent: 连线点击:', lineObject);
  emit('lineClick', lineObject, linkObject, $event);
};

const onCanvasClick = ($event: RGUserEvent) => {
  emit('canvasClick', $event);
};

// 监听设置变化
watch(() => props.settings.treeDirection, (newDirection) => {
  if (newDirection && newDirection !== currentTreeType.value) {
    console.log('TreeLayoutComponent: 设置中的树形方向变化:', newDirection);
    currentTreeType.value = newDirection;
    switchTreeLayout();
  }
}, { immediate: false });

watch(() => [props.courseId, props.graphId, props.courseName], () => {
  loadRealGraphData();
}, { immediate: false });

watch(() => props.interactionState?.selectedNodeId, () => {
  void refreshTreeVisualState();
}, { immediate: false });

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

// 暴露方法给父组件
defineExpose({
  loadRealGraphData,
  switchTreeLayout,
  searchNodes,
  focusNodeById,
  fitView,
  getCurrentTreeType: () => currentTreeType.value,
  setTreeType: (type: 'horizontal' | 'vertical') => {
    currentTreeType.value = type;
    switchTreeLayout();
  }
});
</script>

<style lang="scss" scoped>
.tree-layout-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.tree-layout-viewport {
  position: relative;
  width: 100%;
  height: calc(100vh);
}

::v-deep(.relation-graph) {
  .c-node-text {
    padding: 4px 8px !important;
    place-items: center;
    justify-content: center;
    color: inherit !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    line-height: 1.2 !important;
  }

  /* 确保所有节点文本都是黑色且字体较大 */
  .rel-node-text,
  .rel-node .c-node-text,
  .rel-node text {
    fill: currentColor !important;
    color: inherit !important;
    font-size: 13px !important;
    font-weight: 600 !important;
  }
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

::v-deep(.kg-tree-toggle-right) {
  right: -20px;
}

::v-deep(.kg-tree-toggle:hover) {
  background: #1d4ed8;
  border-color: #1d4ed8;
}


</style>
