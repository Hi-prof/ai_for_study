<template>
  <div class="center-layout-container" :class="layoutCssClass">
    <div style="height:calc(100vh);">
      <RelationGraph
        ref="centerGraphRef"
        :options="currentCenterOptions"
        :on-node-click="onNodeClick"
        :on-line-click="onLineClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import RelationGraph, { RelationGraphComponent } from 'relation-graph-vue3';
import { getKnowledgeGraphNodes, getNodeLines } from '@/api/node';
import '@/assets/styles/layouts/layout-manager.css';

// 定义props
interface Props {
  courseId: string | number;
  graphId: string | number;
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

// 定义emits
const emit = defineEmits(['node-click', 'line-click']);

// 响应式数据
const centerGraphRef = ref<RelationGraphComponent | null>(null);

// 动态CSS类
const layoutCssClass = computed(() => 'layout-center');

// 中心布局配置 - 根据您提供的示例配置
const centerLayoutOptions: any = {
  'backgroundImageNoRepeat': true,
  'moveToCenterWhenRefresh': false,
  'zoomToFitWhenRefresh': false,
  'defaultNodeBorderWidth': 0,
  'defaultNodeShape': 1 as any,  // 使用您示例配置中的长方形节点
  'layout': {
    'label': '中心',
    'layoutName': 'center',
    'centerOffset_x': 0,
    'centerOffset_y': 0,
    'distance_coefficient': 0.8,  // 减小距离系数，让线段更短
    'from': 'top',
    'levelDistance': '',
    'min_per_width': 80,   // 减小最小宽度间距
    'max_per_width': 200,  // 减小最大宽度间距
    'min_per_height': 80,  // 减小最小高度间距
    'max_per_height': 200, // 减小最大高度间距
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
  'defaultNodeWidth': 80,
  'defaultNodeHeight': 80,
  'defaultLineShape': 1 as any,  // 使用直线连接
  'defaultJunctionPoint': 'border',  // 节点边界连接点
  'defaultLineColor': 'rgba(52, 152, 219, 0.8)',
  'defaultNodeColor': 'rgba(52, 152, 219, 0.8)',
  'defaultNodeFontColor': '#000000',  // 默认黑色字体
  'allowShowMiniToolBar': true,
  'allowShowMiniView': true as any
  // 移除重复的 zoomToFitWhenRefresh，已在第62行定义为false
};

// 动态调整布局参数的函数
const getDynamicLayoutOptions = (nodeCount: number) => {
  // 中心布局：长方形节点（根据您的示例配置）
  let nodeWidth = 120;
  let nodeHeight = 60;

  if (nodeCount <= 10) {
    // 小规模图谱：节点较大
    nodeWidth = 140;
    nodeHeight = 70;
  } else if (nodeCount <= 30) {
    // 中等规模图谱：标准大小
    nodeWidth = 120;
    nodeHeight = 60;
  } else {
    // 大规模图谱：节点较小
    nodeWidth = 100;
    nodeHeight = 50;
  }

  return {
    nodeWidth,
    nodeHeight,
    minPerWidth: 80,   // 更小的间距，让线段更短
    maxPerWidth: 200,  // 限制最大间距
    minPerHeight: 80,  // 更小的间距
    maxPerHeight: 200  // 限制最大间距
  };
};

// 计算当前中心布局配置
const currentCenterOptions = computed(() => {
  const dynamicParams = getDynamicLayoutOptions(50); // 默认参数
  
  const options = {
    ...centerLayoutOptions,
    defaultNodeShape: 1 as any, // 使用长方形节点（根据您的示例配置）
    defaultNodeWidth: dynamicParams.nodeWidth,
    defaultNodeHeight: dynamicParams.nodeHeight,
    defaultLineShape: 1 as any, // 使用直线连接
    allowShowMiniToolBar: props.settings.enableZoom,
    allowShowMiniView: props.settings.enableZoom as any,
    useAnimationWhenExpanded: props.settings.enableAnimation,
    useAnimationWhenRefresh: props.settings.enableAnimation
  };

  // 更新布局参数以控制线段长度
  if (options.layout) {
    (options.layout as any).min_per_width = dynamicParams.minPerWidth;
    (options.layout as any).max_per_width = dynamicParams.maxPerWidth;
    (options.layout as any).min_per_height = dynamicParams.minPerHeight;
    (options.layout as any).max_per_height = dynamicParams.maxPerHeight;
  }

  return options;
});

// 节点点击处理
const onNodeClick = (nodeObject: any, nodeElement: any) => {
  console.log('CenterLayoutComponent: 节点点击', nodeObject);
  emit('node-click', nodeObject, nodeElement);
};

// 连线点击处理
const onLineClick = (lineObject: any, lineElement: any) => {
  console.log('CenterLayoutComponent: 连线点击', lineObject);
  emit('line-click', lineObject, lineElement);
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

    // 2. 处理节点数据
    const processedNodes = nodes.map((node: any) => ({
      id: node.id?.toString() || '',
      text: node.name || node.title || '未命名节点',
      borderColor: 'rgba(52, 152, 219, 1)',
      fontColor: '#000000',  // 黑色字体
      color: 'rgba(52, 152, 219, 0.1)',
      data: node
    }));

    // 3. 获取连线数据
    const linePromises = nodes.map((node: any) => {
      return getNodeLines(node.id).catch((error: any) => {
        console.warn(`CenterLayoutComponent: 获取节点${node.id}连线失败:`, error);
        return [];
      });
    });

    const linesArrays = await Promise.all(linePromises);

    // 4. 处理连线数据
    const allLines = linesArrays.flat();
    const processedLines = allLines.map((line: any, index: number) => ({
      from: line.nodeId?.toString() || '',
      to: line.targetId?.toString() || '',
      text: line.content || '',
      id: line.id ? line.id.toString() : `line_${index}`
    })).filter((line: any) => line.from && line.to);

    // 5. 构建图谱数据
    const graphData = {
      rootId: processedNodes[0]?.id || '',
      nodes: processedNodes,
      lines: processedLines
    };

    console.log(`CenterLayoutComponent: 图谱数据构建完成`, {
      nodeCount: processedNodes.length,
      lineCount: processedLines.length
    });

    // 6. 更新动态参数
    const dynamicParams = getDynamicLayoutOptions(processedNodes.length);
    const updatedOptions = {
      ...currentCenterOptions.value,
      defaultNodeWidth: dynamicParams.nodeWidth,
      defaultNodeHeight: dynamicParams.nodeHeight
    };

    // 7. 渲染图谱
    const graphInstance = centerGraphRef.value;
    if (graphInstance) {
      await (graphInstance as any).setOptions(updatedOptions);
      await (graphInstance as any).setJsonData(graphData);
      await (graphInstance as any).moveToCenter();
      await (graphInstance as any).zoomToFit();
      console.log(`CenterLayoutComponent: 图谱渲染完成 (节点数: ${processedNodes.length})`);
    } else {
      console.error('CenterLayoutComponent: 图谱实例未找到');
    }

  } catch (error) {
    console.error('CenterLayoutComponent: 加载图谱数据失败:', error);
  }
};

// 监听props变化
watch(() => [props.courseId, props.graphId], () => {
  loadGraphData();
}, { immediate: false });

// 组件挂载后加载数据
onMounted(async () => {
  console.log('CenterLayoutComponent: 组件已挂载');
  console.log('CenterLayoutComponent: centerGraphRef.value:', centerGraphRef.value);
  await nextTick();
  console.log('CenterLayoutComponent: nextTick完成，开始加载数据');
  await loadGraphData();
});

// 暴露方法给父组件
defineExpose({
  refresh: loadGraphData,
  getGraphInstance: () => centerGraphRef.value
});
</script>

<style scoped>
.center-layout-container {
  width: 100%;
  height: 100%;
  position: relative;
}

::v-deep(.relation-graph) {
  .c-node-text {
    padding: 0px;
    place-items: center;
    justify-content: center;
    color: #000000 !important;  /* 强制黑色字体 */
  }

  /* 确保所有节点文本都是黑色 */
  .rel-node-text,
  .rel-node .c-node-text,
  .rel-node text {
    fill: #000000 !important;
    color: #000000 !important;
  }
}
</style>
