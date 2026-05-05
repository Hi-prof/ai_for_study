// 图谱配置文件
import { graphVisualTheme } from './graphVisualTheme.js';

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
  defaultNodeColor: graphVisualTheme.node.default.color,
  defaultNodeBorderWidth: 1,
  defaultNodeBorderColor: graphVisualTheme.node.default.borderColor,
  defaultNodeWidth: 160,
  defaultNodeHeight: 56,
  defaultNodeShape: 1,
  defaultNodeBorderRadius: 8,
  defaultNodeFontSize: 13,
  defaultNodeFontColor: graphVisualTheme.node.default.fontColor,

  // 强制节点尺寸设置
  allowAutoLayoutIfSupport: false, // 禁用自动布局以保持固定尺寸
  defaultShowLineLabel: false, // 隐藏连线标签避免干扰
  defaultNodeTextMaxWidth: 160,
  defaultNodeTextMaxHeight: 60,

  // 默认连线配置
  defaultLineColor: graphVisualTheme.line.default,
  defaultLineWidth: 2,
  defaultLineShape: 1,
  defaultJunctionPoint: 'border',
  lineUseTextPath: true, // 连线使用文本路径

  // 连线标记配置
  defaultLineMarker: {
    ...graphVisualTheme.lineMarker,
    color: graphVisualTheme.line.default
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
      distance_coefficient: 1.05,
      from: "top",
      levelDistance: "",
      min_per_width: 180,
      max_per_width: 500,
      min_per_height: 180,
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
    strokeWidth: 1,
    strokeColor: graphVisualTheme.node.default.borderColor,
    fillColor: graphVisualTheme.node.default.color,
    textColor: graphVisualTheme.node.default.fontColor,
    fontSize: 13,
    lineHeight: 20,
    borderRadius: 8,
    padding: 10,
    width: 160,
    height: 56
  },

  // 连线样式配置
  lineStyle: {
    strokeWidth: 2,
    strokeColor: graphVisualTheme.line.default,
    fontSize: 12,
    fontColor: '#666666'
  },

  // 不同类型节点的样式
  nodeStyles: {
    default: {
      strokeColor: graphVisualTheme.node.default.borderColor,
      fillColor: graphVisualTheme.node.default.color,
      textColor: graphVisualTheme.node.default.fontColor,
      fontSize: 13,
      width: 160,
      height: 56,
      borderRadius: 8
    },
    root: {
      strokeColor: graphVisualTheme.node.root.borderColor,
      fillColor: graphVisualTheme.node.root.color,
      textColor: graphVisualTheme.node.root.fontColor,
      fontSize: 14,
      fontWeight: 'bold',
      width: 190,
      height: 64,
      borderRadius: 8
    },
    concept: {
      strokeColor: graphVisualTheme.category.concept,
      fillColor: '#ffffff',
      textColor: '#276749',
      width: 160,
      height: 56,
      borderRadius: 8
    },
    principle: {
      strokeColor: graphVisualTheme.category.principle,
      fillColor: '#ffffff',
      textColor: '#553c9a',
      width: 160,
      height: 56,
      borderRadius: 8
    },
    method: {
      strokeColor: graphVisualTheme.category.method,
      fillColor: '#ffffff',
      textColor: '#975a16',
      width: 160,
      height: 56,
      borderRadius: 8
    },
    tool: {
      strokeColor: graphVisualTheme.category.tool,
      fillColor: '#ffffff',
      textColor: '#164e63',
      width: 160,
      height: 56,
      borderRadius: 8
    },
    application: {
      strokeColor: graphVisualTheme.category.application,
      fillColor: '#ffffff',
      textColor: '#2c5282',
      width: 160,
      height: 56,
      borderRadius: 8
    }
  },

  // 图谱交互配置
  allowShowMiniToolBar: true,
  allowShowMiniView: true,
  allowShowSettingPanel: false,

  // 性能优化配置
  useAnimationWhenExpanded: true,
  useAnimationWhenRefresh: true,
  animationTime: 300
};

// 导出配置
export { graphOptions, getCategoryName, categoryNames };
