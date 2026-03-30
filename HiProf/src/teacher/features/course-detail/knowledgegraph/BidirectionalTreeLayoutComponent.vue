<template>
  <div class="bidirectional-tree-container" :class="layoutCssClass">
    <div style="height:calc(100vh);">
      <RelationGraph
        ref="bidirectionalTreeRef"
        :options="currentBidirectionalOptions"
        :on-node-click="onNodeClick"
        :on-line-click="onLineClick"
      >
        <template #graph-plug>
        </template>
      </RelationGraph>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
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
import { VIRTUAL_ROOT_NODE_ID, isVirtualRootNode, resolveTopLevelNodeIds } from './graphRootUtils';

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

const buildGraphData = (rawNodes: Array<Record<string, unknown>>, processedNodes: Array<Record<string, unknown>>, processedLines: Array<Record<string, unknown>>) => {
  const rootIds = resolveTopLevelNodeIds(rawNodes);
  const stableRootIds = rootIds.length > 0
    ? rootIds
    : (processedNodes[0]?.id ? [String(processedNodes[0].id)] : []);

  if (stableRootIds.length <= 1) {
    return {
      rootId: stableRootIds[0] || '',
      nodes: processedNodes,
      links: processedLines
    };
  }

  const virtualRootNode = {
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
  };

  const virtualLinks = stableRootIds.map((rootId, index) => ({
    from: VIRTUAL_ROOT_NODE_ID,
    to: rootId,
    text: '',
    id: `virtual_root_${index}`
  }));

  return {
    rootId: VIRTUAL_ROOT_NODE_ID,
    nodes: [virtualRootNode, ...processedNodes],
    links: [...virtualLinks, ...processedLines]
  };
};

// 定义 emits
const emit = defineEmits<{
  nodeClick: [node: RGNode, event: RGUserEvent];
  lineClick: [line: RGLine, link: RGLink, event: RGUserEvent];
}>();

// 响应式数据
const bidirectionalTreeRef = ref<RelationGraphComponent | null>(null);

// 动态CSS类 - 只使用水平双向树
const layoutCssClass = computed(() => 'layout-bidirectional-tree layout-horizontal');

// 水平双向树布局配置
const horizontalBidirectionalOptions: RGOptions = {
  'backgroundImageNoRepeat': true,
  'moveToCenterWhenRefresh': false,
  'zoomToFitWhenRefresh': false,
  'defaultNodeBorderWidth': 0,
  'defaultNodeShape': 1,
  'layout': {
    'label': '水平双向树',
    'layoutName': 'tree',
    'from': 'left',  // 从左侧开始展开，但会自动双向
    'layoutDirection': 'h',  // 水平方向
    'centerOffset_x': 0,
    'centerOffset_y': 0,
    'distance_coefficient': 1,
    'levelDistance': '',
    'min_per_width': 200,   // 最小宽度间距
    'max_per_width': 300,   // 最大宽度间距
    'min_per_height': 60,   // 最小高度间距
    'max_per_height': 80,   // 最大高度间距
    'maxLayoutTimes': 300,
    'force_node_repulsion': 1,
    'force_line_elastic': 1
  },
  'defaultLineMarker': {
    'markerWidth': 12,
    'markerHeight': 12,
    'refX': 6,
    'refY': 6,
    'data': 'M2,2 L10,6 L2,10 L6,6 L2,2'
  },
  // 移除重复的 defaultNodeShape，已在第80行定义
  'defaultNodeWidth': 150,  // 更长的节点宽度
  'defaultNodeHeight': 50,  // 保持较小的高度，形成3:1的长宽比
  'defaultLineShape': 4,  // 使用曲线连接，更适合双向树
  'defaultJunctionPoint': 'lr',  // 长方形节点使用左右连接点
  'defaultLineColor': '#95a5a6',
  'defaultNodeColor': '#e2e8f0',  // 默认浅灰色
  'defaultNodeFontColor': '#1f2937',  // 深灰色字体，确保在浅色背景上可读
  'defaultLineTextOffset_x': -8,
  'defaultLineTextOffset_y': -1,
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
    const processedNodes = nodes.map(node => ({
      id: node.id.toString(),
      text: node.name || `节点${node.id}`,
      borderColor: '#94a3b8',
      fontColor: '#1f2937',  // 深灰色字体，确保可读性
      color: '#e2e8f0',  // 默认浅灰色
      data: {
        content: node.content || '',
        category: node.category || 'default'
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

    // 5. 构建图谱数据
    const graphData = buildGraphData(nodes, processedNodes, processedLines);

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
const renderBidirectionalTree = async (graphData: any) => {
  const graphInstance = bidirectionalTreeRef.value?.getInstance();
  if (graphInstance) {
    try {
      // 根据实际数据动态调整布局参数
      const nodeCount = graphData.nodes ? graphData.nodes.length : 0;
      const maxDepth = calculateMaxDepth(graphData);
      const dynamicParams = getDynamicLayoutOptions(nodeCount, maxDepth);

      // 更新布局配置
      const updatedOptions = { ...currentBidirectionalOptions.value };
      if (updatedOptions.layout) {
        updatedOptions.layout.min_per_width = dynamicParams.minPerWidth;
        updatedOptions.layout.max_per_width = dynamicParams.maxPerWidth;
        updatedOptions.layout.min_per_height = dynamicParams.minPerHeight;
        updatedOptions.layout.max_per_height = dynamicParams.maxPerHeight;
      }
      updatedOptions.defaultNodeWidth = dynamicParams.nodeWidth;
      updatedOptions.defaultNodeHeight = dynamicParams.nodeHeight;

      await graphInstance.setOptions(updatedOptions);
      await graphInstance.setJsonData(graphData);

      // 处理双向树的特殊样式 - 简化版本，先确保颜色能改变
      const leftNodes: RGNode[] = [];
      console.log('BidirectionalTreeLayoutComponent: 开始设置节点颜色，节点总数:', graphInstance.getNodes().length);

      for (const node of graphInstance.getNodes()) {
        const oldColor = node.color;
        if (node.lot && node.lot.level! < 0) {
          // 左侧节点：红色系
          node.color = '#fecaca'; // 浅红色
          node.borderColor = '#ef4444';
          console.log(`左侧节点 ${node.id}: ${oldColor} -> ${node.color}`);
          leftNodes.push(node);
        } else if (node.lot && node.lot.level! > 0) {
          // 右侧节点：蓝色系
          node.color = '#bfdbfe'; // 浅蓝色
          node.borderColor = '#3b82f6';
          console.log(`右侧节点 ${node.id}: ${oldColor} -> ${node.color}`);
        } else {
          // 根节点：金色
          node.color = '#fde68a';
          node.borderColor = '#f59e0b';
          console.log(`根节点 ${node.id}: ${oldColor} -> ${node.color}`);
        }
      }

      // 刷新图谱以应用颜色变化
      console.log('BidirectionalTreeLayoutComponent: 刷新图谱以应用颜色变化');
      await graphInstance.refresh();

      // 处理左侧连线的文本位置
      const leftLines = graphInstance.getLinks()
        .filter(link => leftNodes.includes(link.fromNode) || leftNodes.includes(link.toNode))
        .reduce((currentLines: RGLine[], link: RGLink) => currentLines.concat(...link.relations), []);

      for (const line of leftLines) {
        line.placeText = 'start';  // 左侧连线文本放在起始位置
      }

      await graphInstance.moveToCenter();
      await graphInstance.zoomToFit();
      console.log(`BidirectionalTreeLayoutComponent: 双向树渲染完成 (节点数: ${nodeCount}, 最大深度: ${maxDepth})`);
    } catch (error) {
      console.error('BidirectionalTreeLayoutComponent: 图谱渲染失败:', error);
    }
  }
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
  if (isVirtualRootNode(nodeObject)) {
    return;
  }
  console.log('BidirectionalTreeLayoutComponent: 节点点击:', nodeObject);
  emit('nodeClick', nodeObject, $event);
};

// 处理连线点击
const onLineClick = (lineObject: RGLine, linkObject: RGLink, $event: RGUserEvent) => {
  console.log('BidirectionalTreeLayoutComponent: 连线点击:', lineObject);
  emit('lineClick', lineObject, linkObject, $event);
};



// 组件挂载后加载数据
onMounted(() => {
  // 延迟加载以确保组件完全初始化
  setTimeout(() => {
    loadRealGraphData();
  }, 1000);
});

watch(() => [props.courseId, props.graphId, props.courseName], () => {
  loadRealGraphData();
}, { immediate: false });

// 暴露方法给父组件
defineExpose({
  loadRealGraphData
});
</script>

<style lang="scss" scoped>
.bidirectional-tree-container {
  width: 100%;
  height: 100%;
  position: relative;
}



/* 双向树布局样式 - 内联版本 */
.layout-bidirectional-tree {
  background-color: #fafafa;
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
  width: 150px !important;  /* 更长的节点宽度，3:1比例 */
  height: 50px !important;
  border-radius: 8px !important;
  border: 2px solid #94a3b8 !important;
  background-color: #bfdbfe !important; /* 强制浅蓝色背景，测试是否生效 */
  background: #bfdbfe !important; /* 双重保险 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  transition: all 0.3s ease !important;
}

/* 节点悬停效果 - 增强渐变色的交互体验 */
::v-deep(.layout-bidirectional-tree .rel-node:hover),
::v-deep(.layout-bidirectional-tree .rel-node-peel:hover),
::v-deep(.layout-bidirectional-tree .rel-nodediv:hover) {
  border-color: #4f46e5 !important;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2) !important;
  transform: translateY(-2px) scale(1.02) !important;
  filter: brightness(1.05) !important;
}

/* 连线样式 */
::v-deep(.layout-bidirectional-tree .rel-line) {
  stroke: #9ca3af !important;
  stroke-width: 1px !important;
  transition: all 0.2s ease !important;
}

::v-deep(.layout-bidirectional-tree .rel-line:hover) {
  stroke: #6b7280 !important;
  stroke-width: 2px !important;
}

/* 节点文本样式 - 优化渐变背景上的可读性 */
::v-deep(.layout-bidirectional-tree .c-node-text),
::v-deep(.layout-bidirectional-tree .rel-node-text),
::v-deep(.layout-bidirectional-tree .rel-node .c-node-text),
::v-deep(.layout-bidirectional-tree .rel-node text) {
  fill: #1f2937 !important;
  color: #1f2937 !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 1.2 !important;
  padding: 4px !important;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8) !important; /* 添加白色文字阴影增强可读性 */
}

/* 连线文本样式 */
::v-deep(.layout-bidirectional-tree .rel-line-text) {
  fill: #6b7280 !important;
  font-size: 10px !important;
  font-weight: normal !important;
}


</style>
