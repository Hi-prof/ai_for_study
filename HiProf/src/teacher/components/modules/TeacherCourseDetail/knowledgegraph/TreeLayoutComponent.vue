<template>
  <div class="tree-layout-container" :class="layoutCssClass">
    <div style="height:calc(100vh);">
      <RelationGraph
        ref="treeGraphRef"
        :options="currentTreeOptions"
        :on-node-click="onNodeClick"
        :on-line-click="onLineClick"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import RelationGraph, { RGJsonData, RGOptions, RGNode, RGLine, RGLink, RGUserEvent, RelationGraphComponent } from 'relation-graph-vue3';
import { getKnowledgeGraphNodes, getNodeLines } from '@/api/node';

// 定义 props
interface Props {
  courseId?: string | number;
  graphId?: string | number;
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

// 定义 emits
const emit = defineEmits<{
  nodeClick: [node: RGNode, event: RGUserEvent];
  lineClick: [line: RGLine, link: RGLink, event: RGUserEvent];
}>();

// 响应式数据
const treeGraphRef = ref<RelationGraphComponent | null>(null);
// 只保留水平布局
const currentTreeType = ref<'horizontal'>('horizontal');

// 动态CSS类 - 只使用水平树形布局
const layoutCssClass = computed(() => 'layout-horizontal-tree');

// 水平树形布局配置 - 真正的树形布局
const horizontalTreeOptions: RGOptions = {
  'backgroundImageNoRepeat': true,
  'moveToCenterWhenRefresh': false,
  'zoomToFitWhenRefresh': false,
  'defaultNodeBorderWidth': 0,
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
    'markerWidth': 12,
    'markerHeight': 12,
    'refX': 6,
    'refY': 6,
    'data': 'M2,2 L10,6 L2,10 L6,6 L2,2'
  },
  // 移除重复的 defaultNodeShape，已在第70行定义
  'defaultNodeWidth': 150,  // 更长的节点宽度，3:1比例
  'defaultNodeHeight': 50,  // 保持较小的高度，形成3:1的长宽比
  'defaultLineShape': 1,  // 使用直线连接
  'defaultJunctionPoint': 'lr',  // 长方形节点使用左右连接点
  // 移除重复的 defaultNodeBorderWidth，已在第69行定义
  'defaultLineColor': 'rgba(0, 186, 189, 1)',
  'defaultNodeColor': 'rgba(0, 206, 209, 1)',
  'defaultNodeFontColor': '#000000',  // 默认黑色字体
  'defaultNodeFontSize': 16,  // 增大字体到16px
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
    const processedNodes = nodes.map(node => ({
      id: node.id.toString(),
      text: node.name || `节点${node.id}`,
      borderColor: 'rgba(0, 206, 209, 1)',
      fontColor: '#000000',  // 黑色字体
      color: 'rgba(0, 206, 209, 0.1)',
      data: {
        content: node.content || '',
        category: node.category || 'default'
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

    // 5. 构建图谱数据
    const graphData = {
      rootId: nodes.length > 0 ? nodes[0].id.toString() : '',
      nodes: processedNodes,
      links: processedLines
    };

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
const renderTreeGraph = async (graphData: any) => {
  const graphInstance = treeGraphRef.value?.getInstance();
  if (graphInstance) {
    try {
      // 根据实际数据动态调整布局参数
      const nodeCount = graphData.nodes ? graphData.nodes.length : 0;
      const maxDepth = calculateMaxDepth(graphData);
      const dynamicParams = getDynamicLayoutOptions(nodeCount, maxDepth);

      // 更新布局配置
      const updatedOptions = { ...currentTreeOptions.value };
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
      await graphInstance.moveToCenter();
      await graphInstance.zoomToFit();
      console.log(`TreeLayoutComponent: 图谱渲染完成 (节点数: ${nodeCount}, 最大深度: ${maxDepth})`);
    } catch (error) {
      console.error('TreeLayoutComponent: 图谱渲染失败:', error);
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
  const rootId = graphData.rootId || (graphData.nodes[0]?.id);
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

// 注释：这个defineExpose将与下面的合并

// 处理节点点击
const onNodeClick = (nodeObject: RGNode, $event: RGUserEvent) => {
  console.log('TreeLayoutComponent: 节点点击:', nodeObject);
  emit('nodeClick', nodeObject, $event);
};

// 处理连线点击
const onLineClick = (lineObject: RGLine, linkObject: RGLink, $event: RGUserEvent) => {
  console.log('TreeLayoutComponent: 连线点击:', lineObject);
  emit('lineClick', lineObject, linkObject, $event);
};

// 监听设置变化
watch(() => props.settings.treeDirection, (newDirection) => {
  if (newDirection && newDirection !== currentTreeType.value) {
    console.log('TreeLayoutComponent: 设置中的树形方向变化:', newDirection);
    currentTreeType.value = newDirection;
    switchTreeLayout();
  }
}, { immediate: false });

// 组件挂载后加载数据
onMounted(() => {
  // 延迟加载以确保组件完全初始化
  setTimeout(() => {
    loadRealGraphData();
  }, 1000);
});

// 暴露方法给父组件
defineExpose({
  loadRealGraphData,
  switchTreeLayout,
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

::v-deep(.relation-graph) {
  .c-node-text {
    padding: 6px 10px !important;  /* 增加内边距 */
    place-items: center;
    justify-content: center;
    color: #000000 !important;  /* 强制黑色字体 */
    font-size: 16px !important;  /* 增大字体到16px */
    font-weight: 500 !important;  /* 增加字体粗细 */
    line-height: 1.2 !important;
  }

  /* 确保所有节点文本都是黑色且字体较大 */
  .rel-node-text,
  .rel-node .c-node-text,
  .rel-node text {
    fill: #000000 !important;
    color: #000000 !important;
    font-size: 16px !important;  /* 增大字体到16px */
    font-weight: 500 !important;  /* 增加字体粗细 */
  }
}


</style>
