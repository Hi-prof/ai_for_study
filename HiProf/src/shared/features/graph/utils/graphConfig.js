// 图谱配置文件
// 知识点分类名称映射
const categoryNames = {
  'root': '根节点',
  'concept': '概念',
  'principle': '原理',
  'method': '方法',
  'tool': '工具',
  'application': '应用',
  'branch': '分支',
  'history': '历史',
  'structure': '结构',
  'analysis': '分析',
  'property': '性质',
  'material': '材料'
};

// 获取分类名称
const getCategoryName = (category) => {
  return categoryNames[category] || category;
};

// 图谱配置选项
const graphOptions = {
  debug: false, // 关闭调试模式，减少控制台噪音
  allowSwitchLineShape: true,
  allowSwitchJunctionPoint: true,

  // 背景配置
  backgroundImageNoRepeat: true,

  // 刷新行为配置
  moveToCenterWhenRefresh: false,
  zoomToFitWhenRefresh: false,

  // 默认节点配置
  defaultNodeColor: 'rgba(66, 153, 225, 0.8)',
  defaultNodeBorderWidth: 0, // 无边框
  defaultNodeBorderColor: 'rgba(66, 153, 225, 1)',
  defaultNodeWidth: 75, // 固定宽度，确保圆形
  defaultNodeHeight: 75, // 固定高度，与宽度相等
  defaultNodeShape: 0, // 0: 圆形, 1: 矩形
  defaultNodeBorderRadius: 50, // 50% 边框半径，确保圆形
  defaultNodeFontSize: 12, // 减小字体避免文本撑大节点
  defaultNodeFontColor: '#333333',

  // 强制节点尺寸设置
  allowAutoLayoutIfSupport: false, // 禁用自动布局以保持固定尺寸
  defaultShowLineLabel: false, // 隐藏连线标签避免干扰
  defaultNodeTextMaxWidth: 60, // 限制节点文本最大宽度
  defaultNodeTextMaxHeight: 60, // 限制节点文本最大高度

  // 默认连线配置
  defaultLineColor: 'rgba(128, 128, 128, 0.8)',
  defaultLineWidth: 2,
  defaultLineShape: 1,
  defaultJunctionPoint: 'border',
  lineUseTextPath: true, // 连线使用文本路径

  // 连线标记配置
  defaultLineMarker: {
    markerWidth: 15,
    markerHeight: 15,
    refX: 30,
    refY: 7,
    data: "M 14 7 L 1 .3 L 4 7 L .4 13 L 14 7, Z"
  },

  layoutName: 'center', // 默认布局

  // 布局配置
  layouts: [
    {
      label: "中心",
      layoutName: "center",
      layoutClassName: 'RelationGraphCenterLayout',
      centerOffset_x: 0,
      centerOffset_y: 0,
      distance_coefficient: 0.6,
      from: "top",
      levelDistance: "",
      min_per_width: 100,
      max_per_width: 500,
      min_per_height: 300,
      max_per_height: 500,
      maxLayoutTimes: 300,
      force_node_repulsion: 1,
      force_line_elastic: 1
    },
    {
      layoutName: 'force',
      layoutClassName: 'RelationGraphForceLayout',
      options: {
        strength: -1600,
        distance: 200,
        nodeStrength: -800,
        collide: 100
      }
    }
  ],

  // 节点样式配置
  nodeStyle: {
    strokeWidth: 2,
    strokeColor: '#4299e1',
    fillColor: '#ffffff',
    textColor: '#333333',
    fontSize: 14,
    lineHeight: 20,
    borderRadius: 50, // 圆形边框
    padding: 10,
    width: 75, // 固定宽度
    height: 75 // 固定高度
  },

  // 连线样式配置
  lineStyle: {
    strokeWidth: 2,
    strokeColor: '#999999',
    fontSize: 12,
    fontColor: '#666666'
  },

  // 不同类型节点的样式
  nodeStyles: {
    default: {
      strokeColor: '#4299e1',
      fillColor: '#ffffff',
      textColor: '#333333',
      fontSize: 14,
      width: 75,
      height: 75,
      borderRadius: 50
    },
    root: {
      strokeColor: '#4299e1',
      fillColor: 'rgba(66, 153, 225, 0.1)',
      textColor: '#2b6cb0',
      fontSize: 16,
      fontWeight: 'bold',
      width: 75, // 与其他节点保持一致
      height: 75,
      borderRadius: 50
    },
    concept: {
      strokeColor: '#38a169',
      fillColor: 'rgba(56, 161, 105, 0.1)',
      textColor: '#276749',
      width: 75,
      height: 75,
      borderRadius: 50
    },
    principle: {
      strokeColor: '#805ad5',
      fillColor: 'rgba(128, 90, 213, 0.1)',
      textColor: '#553c9a',
      width: 75,
      height: 75,
      borderRadius: 50
    },
    method: {
      strokeColor: '#d69e2e',
      fillColor: 'rgba(214, 158, 46, 0.1)',
      textColor: '#975a16',
      width: 75,
      height: 75,
      borderRadius: 50
    },
    tool: {
      strokeColor: '#dd6b20',
      fillColor: 'rgba(221, 107, 32, 0.1)',
      textColor: '#9c4221',
      width: 75,
      height: 75,
      borderRadius: 50
    },
    application: {
      strokeColor: '#3182ce',
      fillColor: 'rgba(49, 130, 206, 0.1)',
      textColor: '#2c5282',
      width: 75,
      height: 75,
      borderRadius: 50
    }
  },

  // 图谱交互配置
  allowShowMiniToolBar: true,
  allowShowMiniView: true,
  allowShowSettingPanel: false,
  allowAutoLayoutIfSupport: true,

  // 性能优化配置
  useAnimationWhenExpanded: true,
  useAnimationWhenRefresh: true,
  animationTime: 300
};

// 导出配置
export { graphOptions, getCategoryName, categoryNames };
