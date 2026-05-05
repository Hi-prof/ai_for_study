# 知识图谱视觉与布局优化技术规格说明

> **文档版本**：v1.0  
> **创建日期**：2026-05-05  
> **对应 PRD**：[knowledge-graph-visual-layout-optimization-prd.md](./knowledge-graph-visual-layout-optimization-prd.md)  
> **摘要**：本文档定义知识图谱视觉与布局优化的技术实现方案，包括共享视觉主题、各布局组件改造、交互状态管理、搜索筛选和验证方案。

---

## 1. 目标与范围

### 1.1 优化目标

在不更换图谱渲染库、不改变后端知识图谱数据结构的前提下，优化教师端和学生端知识图谱查看体验。

### 1.2 核心问题

- **视觉层**：默认布局可读性差、节点视觉层级不清晰、连线干扰阅读
- **交互层**：选中反馈不足、搜索定位缺失、工具栏用户语义不清

### 1.3 对应 PRD

本 Spec 对应 PRD：`docs/knowledge-graph-1/knowledge-graph-visual-layout-optimization-prd.md`

## 2. 现状分析

### 2.1 主要入口文件

| 类型 | 文件路径 | 职责 |
|-----|---------|------|
| **教师端容器** | `teacher/.../knowledgegraph/CourseKnowledgeGraph.vue` | 课程知识图谱容器，布局切换 |
| **教师端布局** | `teacher/.../knowledgegraph/CenterLayoutComponent.vue` | 中心布局（关系探索） |
| | `teacher/.../knowledgegraph/TreeLayoutComponent.vue` | 树形布局（结构阅读） |
| | `teacher/.../knowledgegraph/BidirectionalTreeLayoutComponent.vue` | 双向树布局（双向展开） |
| **教师端工具** | `teacher/.../knowledgegraph/graphRootUtils.ts` | 图谱根节点识别与分支计算 |
| | `teacher/.../knowledgegraph/useGraphFullscreen.ts` | 图谱全屏 composable |
| | `teacher/.../knowledgegraph/GraphFullscreenToggle.vue` | 全屏切换组件 |
| **学生端** | `student/.../knowledgegraph/StudentGraphViewer.vue` | 学生端图谱展示 |
| | `student/.../knowledgegraph/StudentKnowledgeGraph.vue` | 学生端图谱容器 |
| | `student/.../knowledgegraph/StudentGraphNodeList.vue` | 学生端节点列表 |
| **共享模块** | `shared/features/graph/components/graph/GraphView.vue` | 共享图谱视图组件 |
| | `shared/features/graph/utils/graphUtils.js` | 共享图谱数据处理 |
| | `shared/features/graph/utils/nodeTextLayout.js` | 共享节点文本布局 |
| | `shared/features/graph/utils/graphConfig.js` | 共享默认图谱配置 |

> **路径说明**：所有路径相对于 `HiProf/src/`，`teacher/...` = `teacher/features/course-detail/`，`student/...` = `student/components/modules/StudentCourses/`

### 2.2 当前已有能力

✓ **布局切换**：`CourseKnowledgeGraph.vue` 已支持 `center`、`tree`、`bidirectional-tree` 三种布局
✓ **默认布局**：教师端默认布局已设置为 `bidirectional-tree`
✓ **文本处理**：`nodeTextLayout.js` 已提供节点文本测量、HTML 构造、3 行省略和节点宽高计算
✓ **样式支持**：各布局组件已有 `.kg-node-label` 的 3 行截断样式
✓ **自定义节点**：`CenterLayoutComponent.vue` 已使用自定义节点 HTML 和图标
✓ **双向树计算**：`BidirectionalTreeLayoutComponent.vue` 已存在双向树固定布局计算和左右分支处理
✓ **根节点与树结构**：`graphRootUtils.ts` 已提供根节点识别、父子关系索引构建、节点可见性计算和虚拟根节点判断
✓ **全屏能力**：`useGraphFullscreen.ts` 和 `GraphFullscreenToggle.vue` 已提供图谱全屏能力

### 2.3 当前主要问题

❌ **样式分散**：样式分散在多个组件内，教师端三种布局和学生端图谱难以保持一致
❌ **配置不一致**：`graphConfig.js` 仍保留圆形节点和较强色块配置，与教师端新布局不完全一致
❌ **视觉过重**：树形布局使用高饱和青色节点，学习场景下视觉重量偏重
❌ **背景干扰**：双向树背景有径向渐变和较多深度效果，容易抢占节点阅读重心
❌ **文案技术化**：布局切换按钮使用”中心、树形、双向树”等技术文案，普通教师不一定理解
❌ **反馈不足**：点击节点后的图谱反馈主要依赖详情面板，图谱画布本身缺少明确聚焦态

## 3. 技术原则

### 3.1 核心约束

1. **保留现有库**：保留 `relation-graph-vue3`，不引入新的图谱渲染库
2. **复用优先**：优先复用已有组件，不重写图谱查看器
3. **样式统一**：样式统一优先于新增功能
4. **数据驱动尺寸**：节点尺寸必须由图谱数据层传入，不只靠 CSS 撑开
5. **非破坏性交互**：选中、悬停、筛选不应破坏原始图谱数据

### 3.2 设计原则

6. **共享视觉规则**：教师端和学生端共享同一套基础视觉规则
7. **明确错误反馈**：不做静默兜底，图谱渲染失败、数据异常、搜索无结果必须明确反馈
8. **渐进增强**：优先完成视觉层优化，再增加交互层功能

## 4. 总体架构

### 4.1 分层设计

将图谱查看体验拆成四层：

```
┌─────────────────────────────────────────────┐
│  交互层 (Interaction Layer)                 │
│  - 搜索、筛选、选中路径、详情面板           │
│  - 全屏、适配视图                           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  视觉层 (Visual Layer)                      │
│  - 节点 HTML、颜色、边框、连线              │
│  - 背景、状态样式                           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  布局层 (Layout Layer)                      │
│  - 中心布局、树形布局、双向树布局           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  数据层 (Data Layer)                        │
│  - 节点、连线、分类、父子关系、根节点       │
└─────────────────────────────────────────────┘
```

**本次改造重点**：视觉层和交互层
**布局层调整**：只调整默认策略、间距和双向树稳定性

### 4.2 模块职责

| 模块 | 职责 | 实现方式 |
|-----|------|---------|
| **视觉主题** | 定义颜色、状态、样式规则 | 新增 `graphVisualTheme.js` |
| **节点渲染** | 生成节点 HTML 和样式 | 复用 `nodeTextLayout.js`，扩展样式生成 |
| **布局计算** | 计算节点位置和间距 | 各布局组件内部，共享间距计算逻辑 |
| **交互状态** | 管理选中、搜索、筛选状态 | 容器组件维护，传递给布局组件 |
| **样式应用** | 统一 CSS 规则 | 扩展 `graph-overrides.css` |

### 4.3 共享视觉主题模块

**新增文件**：`HiProf/src/shared/features/graph/utils/graphVisualTheme.js`

**职责**：

1. 定义节点分类色
2. 定义根节点、章节节点、普通节点的视觉 token
3. 定义连线普通态、悬停态、选中态颜色
4. 提供根据节点类型和层级生成 style 字段的方法
5. 提供根据状态生成 `styleClass` 的方法

**设计目标**：避免三种布局组件继续各自硬编码颜色

**导出结构**：

```js
export const graphVisualTheme = {
  // 画布配置
  canvas: {
    background: '#f8fafc'
  },
  
  // 节点配置
  node: {
    root: { 
      color: '#0f766e',        // 背景色
      borderColor: '#0f766e',  // 边框色
      fontColor: '#ffffff'     // 文字色
    },
    chapter: { 
      color: '#ffffff', 
      borderColor: '#0ea5e9', 
      fontColor: '#0f172a' 
    },
    default: { 
      color: '#ffffff', 
      borderColor: '#cbd5e1', 
      fontColor: '#1e293b' 
    }
  },
  
  // 分类配置
  category: {
    concept: '#16a34a',      // 概念-绿色
    principle: '#7c3aed',    // 原理-紫色
    method: '#ea580c',       // 方法-橙色
    tool: '#0891b2',         // 工具-青色
    application: '#2563eb',  // 应用-蓝色
    structure: '#475569',    // 结构-灰色
    analysis: '#9333ea',     // 分析-紫色
    material: '#b45309'      // 材料-棕色
  },
  
  // 连线配置
  line: {
    default: '#cbd5e1',      // 默认状态
    hover: '#94a3b8',        // 悬停状态
    active: '#2563eb',       // 选中状态
    muted: '#e2e8f0'         // 弱化状态
  }
};

// 辅助方法
export function getNodeStyleByType(nodeType, category) { /* ... */ }
export function getNodeStyleClass(nodeType, state) { /* ... */ }
export function getLineStyleByState(state) { /* ... */ }
```

**注意**：具体颜色可以在实现阶段微调，但必须保持低饱和、可读和一致。

## 5. 组件改造方案

### 5.1 `CourseKnowledgeGraph.vue` - 容器组件

**改造目标**：统一管理交互状态，优化布局切换文案

#### 5.1.1 保留能力

- 现有布局切换逻辑
- 默认使用 `bidirectional-tree`

#### 5.1.2 文案优化

| 技术名 | 用户语义 | 使用场景 |
|-------|---------|---------|
| `center` | 关系探索 | 查看节点间复杂关系 |
| `tree` | 结构阅读 | 从左到右阅读课程结构 |
| `bidirectional-tree` | 双向展开 | 左右分支展开课程结构 |

#### 5.1.3 新增状态管理

在图谱容器上维护当前交互状态：

```typescript
interface GraphInteractionState {
  selectedNodeId: string | null;           // 当前选中节点
  focusedNodeIds: string[];                // 聚焦的节点集合
  focusedLineIds: string[];                // 聚焦的连线集合
  searchKeyword: string;                   // 搜索关键字
  activeCategoryFilters: string[];         // 激活的分类筛选
}
```

#### 5.1.4 Props 传递

将交互状态传给具体布局组件：

```vue
<BidirectionalTreeLayoutComponent
  :interaction-state="graphInteractionState"
  @node-click="handleTreeNodeClick"
  @canvas-click="clearGraphFocus"
/>
```

**实施策略**：第一阶段可以只实现 `selectedNodeId`，搜索和筛选后续再接入。

### 5.2 `TreeLayoutComponent.vue` - 树形布局

**改造目标**：从高饱和青色节点改为白底卡片，动态调整间距

#### 5.2.1 节点视觉改造

1. **节点样式**：节点默认改成白底卡片，分类色作为边框或左侧色条，不再大面积青色填充
2. **尺寸计算**：继续使用 `applyRelationGraphNodeTextLayout` 计算节点宽高
3. **动态间距**：根据最大节点宽高动态调整：
   - `defaultNodeWidth`
   - `defaultNodeHeight`
   - `layout.min_per_width`
   - `layout.min_per_height`

#### 5.2.2 样式类设置

为节点设置 `styleClass`：

```js
const styleClasses = [
  'kg-graph-node',                              // 基础节点
  node.isRoot && 'kg-graph-node-root',          // 根节点
  node.isChapter && 'kg-graph-node-chapter',    // 章节节点
  node.category && `kg-graph-node-category-${node.category}`,  // 分类
  isSelected && 'kg-graph-node-selected',       // 选中态
  isRelated && 'kg-graph-node-related',         // 相关态
  isMuted && 'kg-graph-node-muted'              // 弱化态
].filter(Boolean).join(' ');
```

#### 5.2.3 连线改造

- 连线改为浅灰蓝 `#cbd5e1`
- 选中路径单独加 class `kg-graph-line-active`

#### 5.2.4 关键验收

- 节点不重叠
- 文本不溢出
- 选中态清晰可见

### 5.3 `BidirectionalTreeLayoutComponent.vue` - 双向树布局

**改造目标**：保留双向坐标计算，优化背景和视觉，确保左右分支稳定

#### 5.3.1 保留能力

- 现有双向坐标计算能力
- 根节点居中，左右分支使用相同视觉规则

#### 5.3.2 背景改造

- 背景改为纯浅色或极弱点阵
- 不使用明显径向渐变
- 避免深度效果抢占节点阅读重心

#### 5.3.3 节点视觉

- 节点视觉与树形布局一致
- 区别只体现在空间布局（左右分支）
- 左侧分支连线文本位置继续保持可读，不能倒置或贴边

#### 5.3.4 分支策略

- **单分支**：根节点只有一个一级分支时允许单侧展开
- **多分支**：两个及以上一级分支必须左右都有节点

#### 5.3.5 关键验收

| 场景 | 验收标准 |
|-----|---------|
| **小图谱** (≤10 节点) | 节点不重叠，布局清晰 |
| **中图谱** (10-30 节点) | 节点不重叠，左右分支平衡 |
| **大图谱** (>30 节点) | 节点不重叠，`zoomToFit` 后根节点和左右分支都在可视区域 |
| **连线方向** | 左侧分支连线从根节点左侧出发，右侧分支从根节点右侧出发 |

#### 5.3.6 间距计算

根据最大节点尺寸动态调整：

```js
const depthGap = Math.max(320, maxNodeWidth + 180);  // 深度间距
const rowGap = Math.max(96, maxNodeHeight + 48);     // 行间距
```

### 5.4 `CenterLayoutComponent.vue` - 中心布局

**改造目标**：定位为”关系探索”，降低装饰感，保留圆形和图标

#### 5.4.1 定位调整

- 中心布局定位为”关系探索”
- 不再承担默认课程结构阅读

#### 5.4.2 视觉优化

| 元素 | 优化方向 |
|-----|---------|
| **根节点** | 明显大于普通节点 |
| **普通节点** | 只展示短标题，详情通过点击面板查看 |
| **圆形和图标** | 保留但降低装饰感 |
| **连线标签** | 默认跟随 `showLabels`，但视觉上弱化 |
| **选中态** | 与其他布局共享选中态、相关态和弱化态 |

#### 5.4.3 设计原则

- 保持图标但弱化色块
- 避免过度装饰
- 聚焦关系而非层级

### 5.5 `GraphView.vue` 和 `graphUtils.js` - 共享模块

**改造目标**：统一共享图谱默认样式，支持学生端和其他场景

#### 5.5.1 样式统一

- 将共享图谱默认节点样式调整为卡片式
- 避免继续使用旧圆形默认
- `.kg-node-label` 样式与教师端保持一致

#### 5.5.2 文本处理

- 学生端或共享图谱处理继续调用 `applyRelationGraphNodeTextLayout`
- 确保 3 行省略规则一致

#### 5.5.3 交互增强

- 点击节点后支持高亮当前节点和相关连线
- 与教师端共享选中态逻辑

### 5.6 学生端图谱组件

**改造目标**：同步教师端视觉优化，简化工具栏

#### 5.6.1 重点检查文件

1. `HiProf/src/student/components/modules/StudentCourses/knowledgegraph/StudentGraphViewer.vue`
2. `HiProf/src/student/components/modules/StudentCourses/knowledgegraph/StudentKnowledgeGraph.vue`
3. `HiProf/src/student/components/modules/StudentCourses/knowledgegraph/StudentGraphNodeList.vue`

#### 5.6.2 必须同步的能力

| 能力 | 要求 |
|-----|------|
| **节点卡片样式** | 与教师端一致 |
| **3 行省略** | 与教师端一致 |
| **点击反馈** | 选中态、相关态、弱化态 |
| **搜索定位** | 支持搜索并定位到节点 |
| **视图适配** | 全屏或适配视图能力 |

#### 5.6.3 学生端工具栏

学生端不需要完整教师端工具栏，只保留：

1. 搜索
2. 适配视图
3. 只看相关（可选）
4. 全屏

**不出现**：布局技术配置、生成和编辑入口

## 6. 节点结构和样式规则

### 6.1 节点层级判断

按以下顺序判断节点类型：

```js
function getNodeType(node, graphRoot) {
  // 1. 虚拟根节点
  if (node.data?.isVirtualRoot) {
    return 'virtual-root';  // 不展示或使用弱视觉
  }
  
  // 2. 根节点
  if (!node.parentId || node.parentId === '0' || node.parentId === graphRoot) {
    return 'root';
  }
  
  // 3. 一级章节节点
  if (node.parentId === rootNodeId) {
    return 'chapter';
  }
  
  // 4. 分类知识点
  if (node.category) {
    return 'category';
  }
  
  // 5. 其他：普通知识点
  return 'default';
}
```

### 6.2 节点 HTML 生成

#### 6.2.1 方案选择

**第一阶段**：继续复用 `buildRelationGraphNodeHtml`，只通过外层 `styleClass` 和 CSS 完成视觉升级

**第二阶段**（可选）：新增共享方法生成更丰富的节点 HTML

```js
export const buildKnowledgeGraphNodeHtml = ({ 
  text, 
  category, 
  level, 
  selected 
}) => {
  // 生成包含标题、可选分类标签、状态 class 的 HTML
  return `
    <div class="kg-node-content">
      ${category ? `<span class="kg-node-category-tag">${category}</span>` : ''}
      <div class="kg-node-label">${text}</div>
    </div>
  `;
};
```

### 6.3 CSS 规则

#### 6.3.1 样式文件位置

**推荐方案**：扩展已有 `HiProf/src/assets/styles/graph-overrides.css`

**备选方案**：新增 `HiProf/src/assets/styles/graph-visual-theme.css`（仅当样式量明显增大时）

#### 6.3.2 核心 CSS 类

```css
/* 基础节点 */
.kg-graph-node {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

/* 根节点 */
.kg-graph-node-root {
  background: #0f766e;
  border-color: #0f766e;
  color: #ffffff;
  font-weight: 600;
}

/* 章节节点 */
.kg-graph-node-chapter {
  border-color: #0ea5e9;
  border-width: 2px;
  border-left-width: 4px;
}

/* 选中态 */
.kg-graph-node-selected {
  border-color: #2563eb;
  border-width: 2px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  transform: scale(1.02);
}

/* 相关态 */
.kg-graph-node-related {
  border-color: #60a5fa;
  opacity: 1;
}

/* 弱化态 */
.kg-graph-node-muted {
  opacity: 0.3;
}

/* 连线 */
.kg-graph-line {
  stroke: #cbd5e1;
  stroke-width: 1px;
}

.kg-graph-line-active {
  stroke: #2563eb;
  stroke-width: 2px;
}

/* 节点文本 */
.kg-node-label {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
}
```

## 7. 连线和路径高亮

### 7.1 数据准备

渲染图谱后维护以下索引：

```js
// 在图谱加载完成后构建索引
const graphIndexes = {
  nodeById: new Map(),              // nodeId -> node
  lineById: new Map(),              // lineId -> line
  neighborNodeIdsByNodeId: new Map(), // nodeId -> [neighborNodeId]
  lineIdsByNodeId: new Map()        // nodeId -> [lineId]
};

function buildGraphIndexes(nodes, lines) {
  nodes.forEach(node => {
    graphIndexes.nodeById.set(node.id, node);
  });
  
  lines.forEach(line => {
    graphIndexes.lineById.set(line.id, line);
    
    // 建立邻接关系
    if (!graphIndexes.neighborNodeIdsByNodeId.has(line.from)) {
      graphIndexes.neighborNodeIdsByNodeId.set(line.from, []);
    }
    graphIndexes.neighborNodeIdsByNodeId.get(line.from).push(line.to);
    
    // 建立连线关系
    if (!graphIndexes.lineIdsByNodeId.has(line.from)) {
      graphIndexes.lineIdsByNodeId.set(line.from, []);
    }
    graphIndexes.lineIdsByNodeId.get(line.from).push(line.id);
  });
}
```

### 7.2 点击节点时的状态更新

```js
function handleNodeClick(node) {
  // 1. 设置选中节点
  selectedNodeId = node.id;
  
  // 2. 获取相关节点
  relatedNodeIds = graphIndexes.neighborNodeIdsByNodeId.get(node.id) || [];
  
  // 3. 获取相关连线
  activeLineIds = graphIndexes.lineIdsByNodeId.get(node.id) || [];
  
  // 4. 更新图谱视觉状态
  updateGraphVisualState();
}
```

### 7.3 图谱状态更新策略

#### 7.3.1 推荐方案：运行时更新 class

优先运行时更新 class 或节点字段，不重建图谱：

```js
function updateGraphVisualState() {
  nodes.forEach(node => {
    if (node.id === selectedNodeId) {
      node.styleClass = 'kg-graph-node kg-graph-node-selected';
    } else if (relatedNodeIds.includes(node.id)) {
      node.styleClass = 'kg-graph-node kg-graph-node-related';
    } else {
      node.styleClass = 'kg-graph-node kg-graph-node-muted';
    }
  });
  
  lines.forEach(line => {
    if (activeLineIds.includes(line.id)) {
      line.styleClass = 'kg-graph-line kg-graph-line-active';
    } else {
      line.styleClass = 'kg-graph-line kg-graph-line-muted';
    }
  });
}
```

#### 7.3.2 备选方案：重建图谱数据

如果 `relation-graph-vue3` 对运行时 class 更新支持有限，可以重新构造图谱数据并调用 `setJsonData`：

**注意**：必须保留当前缩放和中心位置，避免用户视角跳动

```js
function updateGraphVisualState() {
  // 1. 记录当前状态
  const currentZoom = graphInstance.getZoom();
  const currentCenter = graphInstance.getCenter();
  
  // 2. 更新数据
  const updatedData = buildGraphDataWithState();
  
  // 3. 重新设置数据
  graphInstance.setJsonData(updatedData, () => {
    // 4. 恢复视图状态
    graphInstance.setZoom(currentZoom);
    graphInstance.setCenter(currentCenter);
  });
}
```

### 7.4 状态定义

| 状态 | 应用对象 | 视觉效果 |
|-----|---------|---------|
| **selected** | 当前节点 | 边框加粗、阴影增强、背景变化 |
| **related** | 邻接节点 | 边框或背景轻微高亮 |
| **active** | 当前相关连线 | 颜色变为主色、加粗 |
| **muted** | 其他节点和连线 | 透明度降低至 20-40% |

## 8. 搜索和筛选

### 8.1 搜索功能

#### 8.1.1 第一阶段：节点名称搜索

**匹配逻辑**：

```js
function searchNodes(keyword, nodes) {
  const lowerKeyword = keyword.toLowerCase();
  
  return nodes.filter(node => {
    const text = node.text?.toLowerCase() || '';
    const name = node.name?.toLowerCase() || '';
    const fullText = node.data?.fullText?.toLowerCase() || '';
    
    return text.includes(lowerKeyword) || 
           name.includes(lowerKeyword) || 
           fullText.includes(lowerKeyword);
  });
}
```

**交互流程**：

1. **输入关键字** → 实时匹配（可加防抖）
2. **显示结果数量** → “找到 3 个结果” 或 “未找到相关知识点”
3. **点击结果** → 执行以下操作：
   - 设置选中节点 `selectedNodeId = result.id`
   - 调用图谱实例定位 `graphInstance.focusNodeById(result.id)`
   - 打开详情面板 `showNodeDetail(result)`
4. **无结果处理** → 显示空状态，提供清空搜索入口

### 8.2 筛选功能

#### 8.2.1 第二阶段：分类筛选

**筛选维度**：按 `category`（知识类型）多选

**交互流程**：

```js
// 1. 初始化：默认全选
const activeCategoryFilters = ref(new Set(allCategories));

// 2. 切换筛选
function toggleCategoryFilter(category) {
  if (activeCategoryFilters.has(category)) {
    activeCategoryFilters.delete(category);
  } else {
    activeCategoryFilters.add(category);
  }
  applyFilter();
}

// 3. 应用筛选
function applyFilter() {
  nodes.forEach(node => {
    if (!node.category || activeCategoryFilters.has(node.category)) {
      node.styleClass = 'kg-graph-node';  // 正常显示
    } else {
      node.styleClass = 'kg-graph-node kg-graph-node-muted';  // 弱化
    }
  });
}

// 4. 清除筛选
function clearFilter() {
  activeCategoryFilters = new Set(allCategories);
  applyFilter();
}
```

**连线处理**：

- **第一版**：优先采用弱化，不直接删除节点
- **原因**：如果隐藏节点会导致连线断裂，影响图谱完整性

### 8.3 只看相关路径

#### 8.3.1 交互设计

**触发方式**：点击节点后提供”只看相关路径”选项

**视觉效果**：

| 元素 | 状态 |
|-----|------|
| 当前节点 | 正常显示 + 选中态 |
| 邻接节点 | 正常显示 |
| 相关连线 | 正常显示 + 高亮 |
| 其他节点 | 透明度降低至 20-30% |
| 其他连线 | 透明度降低至 20-30% |

**退出聚焦**：

- 提供”退出聚焦”按钮
- 或点击空白区域恢复完整视图

```js
function focusRelatedPath(nodeId) {
  const relatedNodeIds = getRelatedNodeIds(nodeId);
  const relatedLineIds = getRelatedLineIds(nodeId);
  
  nodes.forEach(node => {
    if (node.id === nodeId || relatedNodeIds.includes(node.id)) {
      node.styleClass = 'kg-graph-node';
    } else {
      node.styleClass = 'kg-graph-node kg-graph-node-muted';
    }
  });
  
  lines.forEach(line => {
    if (relatedLineIds.includes(line.id)) {
      line.styleClass = 'kg-graph-line kg-graph-line-active';
    } else {
      line.styleClass = 'kg-graph-line kg-graph-line-muted';
    }
  });
}
```

## 9. 工具栏设计

### 9.1 教师端工具栏

#### 9.1.1 推荐布局顺序

```
┌─────────────────────────────────────────────────────────┐
│ [搜索框] [结构阅读] [双向展开] [关系探索]               │
│          [筛选] [适配视图] [全屏]                        │
└─────────────────────────────────────────────────────────┘
```

**功能优先级**：

1. **搜索框** - 快速定位节点（高频）
2. **布局切换** - 结构阅读、双向展开、关系探索（中频）
3. **筛选** - 按分类筛选（中频）
4. **适配视图** - 一键缩放到合适大小（高频）
5. **全屏** - 沉浸式查看（低频）

#### 9.1.2 页面级操作

保留在工具栏外部，作为页面级操作：

- **进入大纲编辑** - 编辑课程大纲
- **AI 生成知识图谱** - 触发 AI 生成流程

**原因**：这些是内容创建操作，不是图谱查看操作

### 9.2 学生端工具栏

#### 9.2.1 推荐布局顺序

```
┌─────────────────────────────────────────────────────────┐
│ [搜索框] [适配视图] [只看相关] [全屏]                   │
└─────────────────────────────────────────────────────────┘
```

**功能说明**：

1. **搜索** - 快速定位知识点
2. **适配视图** - 自动缩放到合适大小
3. **只看相关** - 聚焦当前节点的上下文（可选）
4. **全屏** - 全屏查看

#### 9.2.2 不展示功能

- 布局切换（学生端固定使用默认布局）
- 生成和编辑入口
- 开发配置项

### 9.3 文案对照表

| 原技术文案 | 新用户文案 | 说明 |
|-----------|-----------|------|
| center | 关系探索 | 强调探索节点间关系 |
| tree | 结构阅读 | 强调从左到右阅读结构 |
| bidirectional-tree | 双向展开 | 强调左右分支展开 |
| zoom to fit | 适配视图 | 更易理解的缩放操作 |
| filter by category | 筛选 | 简化表达 |

## 10. relation-graph 配置建议

### 10.1 通用配置

所有布局共享的基础配置：

```js
const commonGraphConfig = {
  // 画布配置
  backgroundColor: '#f8fafc',
  
  // 连线配置
  defaultLineColor: '#cbd5e1',
  defaultLineWidth: 1,
  defaultLineShape: 4,              // 贝塞尔曲线
  defaultShowLineLabel: false,      // 默认不显示连线标签
  defaultJunctionPoint: 'border',   // 连线从边框出发
  
  // 工具栏配置
  allowShowMiniToolBar: true,       // 允许显示小工具栏
  allowShowMiniView: true,          // 允许显示缩略图
  allowShowSettingPanel: false,     // 不显示设置面板（开发工具）
  
  // 刷新行为
  moveToCenterWhenRefresh: false,   // 刷新时不自动居中
  zoomToFitWhenRefresh: false,      // 刷新时不自动缩放
  useAnimationWhenRefresh: true,    // 使用动画
  animationTime: 240                // 动画时长 240ms
};
```

### 10.2 树形布局配置

```js
const treeLayoutConfig = {
  ...commonGraphConfig,
  
  layout: {
    layoutName: 'tree',
    from: 'left',                   // 从左到右
    layoutDirection: 'h',           // 水平方向
    
    // 动态间距（根据节点尺寸计算）
    min_per_width: Math.max(
      dynamicMinWidth, 
      maxNodeWidth + 96
    ),
    min_per_height: Math.max(
      dynamicMinHeight, 
      maxNodeHeight + 64
    )
  }
};
```

**间距计算说明**：

- `min_per_width`：节点间水平间距 = 最大节点宽度 + 96px 边距
- `min_per_height`：节点间垂直间距 = 最大节点高度 + 64px 边距

### 10.3 双向树布局配置

#### 10.3.1 使用固定坐标

如果继续使用固定坐标布局：

```js
const bidirectionalTreeConfig = {
  ...commonGraphConfig,
  
  layout: {
    layoutName: 'fixed'  // 使用固定布局
  }
};

// 坐标计算
const BIDIRECTIONAL_DEPTH_GAP = Math.max(320, maxNodeWidth + 180);
const BIDIRECTIONAL_ROW_GAP = Math.max(96, maxNodeHeight + 48);

function calculateNodePosition(node, depth, rowIndex, isLeftBranch) {
  const x = isLeftBranch 
    ? -depth * BIDIRECTIONAL_DEPTH_GAP 
    : depth * BIDIRECTIONAL_DEPTH_GAP;
  const y = rowIndex * BIDIRECTIONAL_ROW_GAP;
  
  return { x, y, fixed: true };  // fixed: true 避免自动布局覆盖
}
```

#### 10.3.2 关键规则

1. **根节点**：固定在 `(0, 0)`
2. **左侧分支**：`x` 为负数
3. **右侧分支**：`x` 为正数
4. **节点固定**：设置 `fixed: true`，避免自动布局覆盖坐标

#### 10.3.3 间距建议

```js
// 深度间距（节点间水平距离）
const depthGap = Math.max(320, maxNodeWidth + 180);

// 行间距（节点间垂直距离）
const rowGap = Math.max(96, maxNodeHeight + 48);
```

### 10.4 中心布局配置

```js
const centerLayoutConfig = {
  ...commonGraphConfig,
  
  layout: {
    layoutName: 'center',
    centerId: rootNodeId,           // 中心节点 ID
    distance_coefficient: 1.2       // 距离系数
  },
  
  // 中心布局可以显示连线标签
  defaultShowLineLabel: true
};
```

## 11. 实施步骤

### Task 1: 建立共享视觉 token

**目标**：建立统一的视觉规范，避免样式分散

**文件**：

1. `HiProf/src/shared/features/graph/utils/graphVisualTheme.js` - 新增
2. `HiProf/src/assets/styles/graph-overrides.css` - 扩展

**内容**：

- [ ] 定义主题色、节点状态色、连线色
- [ ] 定义共享 CSS class
- [ ] 在入口样式中确保该 CSS 已被加载
- [ ] 导出辅助方法：`getNodeStyleByType`、`getNodeStyleClass`、`getLineStyleByState`

**验收**：

- 三种布局可以引入并使用共享主题
- CSS 类在浏览器中生效

---

### Task 2: 优化教师端双向树布局

**目标**：优化背景、接入共享视觉、调整间距

**文件**：

1. `HiProf/src/teacher/features/course-detail/knowledgegraph/BidirectionalTreeLayoutComponent.vue`

**内容**：

- [ ] 调整背景为纯浅色或极弱点阵
- [ ] 接入共享节点和连线视觉（使用 `graphVisualTheme`）
- [ ] 根据最大节点尺寸调整深度间距和行距
- [ ] 验证左右分支稳定性

**验收**：

- 小图谱（≤10 节点）、中图谱（10-30 节点）、大图谱（>30 节点）都不重叠
- `zoomToFit` 后根节点和左右分支都在可视区域
- 左侧分支连线从根节点左侧出发，右侧分支从根节点右侧出发

---

### Task 3: 优化教师端树形布局

**目标**：改为卡片节点，接入共享视觉

**文件**：

1. `HiProf/src/teacher/features/course-detail/knowledgegraph/TreeLayoutComponent.vue`

**内容**：

- [ ] 改成卡片节点（白底、浅边框、低阴影）
- [ ] 接入共享连线视觉
- [ ] 根据节点尺寸调整布局间距
- [ ] 设置节点 `styleClass`

**验收**：

- 节点呈现卡片风格
- 节点不重叠
- 与双向树视觉一致

---

### Task 4: 优化中心布局

**目标**：降低装饰感，接入共享状态

**文件**：

1. `HiProf/src/teacher/features/course-detail/knowledgegraph/CenterLayoutComponent.vue`

**内容**：

- [ ] 降低装饰感（保持图标但弱化色块）
- [ ] 接入共享选中态和相关态
- [ ] 根节点明显大于普通节点

**验收**：

- 视觉更轻量
- 选中态与其他布局一致

---

### Task 5: 整理教师端工具栏

**目标**：优化文案，整理工具栏布局

**文件**：

1. `HiProf/src/teacher/features/course-detail/knowledgegraph/CourseKnowledgeGraph.vue`
2. `HiProf/src/teacher/styles/course-knowledge-graph.css`（如果存在）

**内容**：

- [ ] 调整布局切换文案（center → 关系探索，tree → 结构阅读，bidirectional-tree → 双向展开）
- [ ] 增加搜索入口（UI 占位，功能在 Task 6 实现）
- [ ] 增加适配视图入口
- [ ] 保留页面级编辑和生成按钮

**验收**：

- 工具栏文案使用用户语义
- 布局清晰，不拥挤

---

### Task 6: 增加选中路径高亮

**目标**：点击节点后高亮节点和相关连线

**文件**：

1. `HiProf/src/teacher/features/course-detail/knowledgegraph/CourseKnowledgeGraph.vue`
2. 三个布局组件

**内容**：

- [ ] 维护选中节点和邻接索引（`buildGraphIndexes`）
- [ ] 传入布局组件（`interaction-state` prop）
- [ ] 更新节点和连线 class（`updateGraphVisualState`）
- [ ] 点击空白区域退出聚焦

**验收**：

- 点击节点后，当前节点、邻接节点、相关连线有明确视觉反馈
- 其他节点和连线弱化但仍可见
- 点击空白区域恢复默认状态

---

### Task 7: 实现搜索功能

**目标**：支持搜索并定位节点

**文件**：

1. `HiProf/src/teacher/features/course-detail/knowledgegraph/CourseKnowledgeGraph.vue`

**内容**：

- [ ] 实现搜索匹配逻辑（`searchNodes`）
- [ ] 显示搜索结果数量
- [ ] 点击结果定位到节点并打开详情面板
- [ ] 无结果时显示空状态

**验收**：

- 搜索能匹配节点名称
- 点击结果能定位到节点
- 无结果时有明确提示

---

### Task 8: 学生端同步

**目标**：学生端同步视觉优化

**文件**：

1. `HiProf/src/student/components/modules/StudentCourses/knowledgegraph/StudentGraphViewer.vue`
2. `HiProf/src/student/components/modules/StudentCourses/knowledgegraph/StudentKnowledgeGraph.vue`
3. `HiProf/src/shared/features/graph/components/graph/GraphView.vue`
4. `HiProf/src/shared/features/graph/utils/graphUtils.js`

**内容**：

- [ ] 复用共享节点样式
- [ ] 同步 3 行省略
- [ ] 增加搜索和选中反馈
- [ ] 简化学生端工具栏

**验收**：

- 学生端节点样式与教师端一致
- 学生端支持搜索和选中反馈
- 学生端工具栏简洁清晰

## 12. 验证方案

### 12.1 静态验证

**目标**：确保代码编译通过，无类型错误

**命令**：

```powershell
cd “C:\Users\xuhuangbin\Desktop\aiforteach\HiProf”
npm run build
```

**预期结果**：

- ✓ Vite 构建通过
- ✓ 不出现 Vue SFC 编译错误
- ✓ 不出现 TypeScript 类型错误
- ✓ 不出现 ESLint 错误

---

### 12.2 手动页面验证

#### 12.2.1 教师端验证

**测试路径**：课程详情 → 知识图谱

**验收清单**：

| 序号 | 验收项 | 预期结果 |
|-----|-------|---------|
| 1 | 默认布局 | 显示”双向展开”布局 |
| 2 | 布局切换 | 可切换到”结构阅读”和”关系探索” |
| 3 | 节点样式 | 节点呈现卡片风格，根节点、章节节点、普通节点有明显层级 |
| 4 | 点击节点 | 详情面板打开，图谱高亮当前节点和相关连线 |
| 5 | 搜索存在的节点 | 能定位到节点并高亮 |
| 6 | 搜索不存在的节点 | 显示”未找到相关知识点” |
| 7 | 全屏 | 开启全屏，再退出全屏，布局不错乱 |
| 8 | 适配视图 | 点击后图谱缩放到合适大小 |

#### 12.2.2 学生端验证

**测试路径**：课程学习页 → 知识图谱

**验收清单**：

| 序号 | 验收项 | 预期结果 |
|-----|-------|---------|
| 1 | 节点样式 | 与教师端一致 |
| 2 | 文本省略 | 节点文本最多 3 行，超出省略 |
| 3 | 点击节点 | 查看详情，图谱有选中反馈 |
| 4 | 搜索 | 能搜索并定位节点 |
| 5 | 工具栏 | 只显示搜索、适配视图、全屏，不显示布局切换和编辑入口 |

---

### 12.3 视觉验收

**目标**：确保不同规模图谱都能正常显示

#### 12.3.1 测试数据分类

| 类型 | 节点数量 | 测试重点 |
|-----|---------|---------|
| **小图谱** | ≤10 节点 | 布局清晰，不过度分散 |
| **中图谱** | 10-50 节点 | 节点不重叠，连线不混乱 |
| **大图谱** | >50 节点 | 性能可接受，适配视图有效 |

#### 12.3.2 每类数据验收标准

- ✓ 节点不重叠
- ✓ 连线不明显穿过节点正文
- ✓ 根节点可识别（尺寸最大、颜色明显）
- ✓ 一级分支可识别（边框或色条明显）
- ✓ 选中态明显（边框加粗、阴影增强）
- ✓ 非选中态不影响阅读（弱化但仍可见）

---

### 12.4 浏览器兼容性验证

**测试浏览器**：

- Chrome（最新版）
- Edge（最新版）
- Firefox（最新版）
- Safari（如果支持 macOS）

**验收标准**：

- 节点样式一致
- 动画流畅
- 交互正常

---

### 12.5 性能验证

**测试场景**：大图谱（>50 节点）

**验收指标**：

| 操作 | 预期性能 |
|-----|---------|
| 初始加载 | <2 秒 |
| 布局切换 | <1 秒 |
| 搜索响应 | <500ms |
| 选中节点 | <300ms |
| 缩放操作 | 流畅，无明显卡顿 |

## 13. 风险和处理

### 13.1 自定义节点 HTML 与图谱库样式冲突

**风险描述**：自定义节点 HTML 可能与 relation-graph-vue3 内置样式冲突

**影响范围**：节点样式、文本布局

**处理策略**：

1. **优先使用 `styleClass`** + scoped deep CSS，而非完全自定义 HTML
2. **避免过宽选择器**：不直接覆盖 `.rel-node > *` 等过宽选择器
3. **充分测试**：每次改样式后检查中心、树形、双向树三种布局
4. **降级方案**：如果冲突严重，回退到只使用 `styleClass` 而不修改 HTML 结构

**验证方法**：在三种布局下测试节点样式是否一致

---

### 13.2 选中态导致图谱重新渲染跳动

**风险描述**：更新选中态时，如果重新调用 `setJsonData`，可能导致视图跳动

**影响范围**：用户体验、交互流畅度

**处理策略**：

1. **优先方案**：运行时更新 class 或节点字段，不重建图谱
   ```js
   node.styleClass = 'kg-graph-node kg-graph-node-selected';
   ```

2. **备选方案**：如必须 `setJsonData`，记录并恢复当前缩放和画布中心
   ```js
   const currentZoom = graphInstance.getZoom();
   const currentCenter = graphInstance.getCenter();
   
   graphInstance.setJsonData(updatedData, () => {
     graphInstance.setZoom(currentZoom);
     graphInstance.setCenter(currentCenter);
   });
   ```

**验证方法**：快速连续点击多个节点，检查视图是否跳动

---

### 13.3 大图谱性能下降

**风险描述**：节点数量增多后，搜索、筛选、选中操作可能变慢

**影响范围**：大图谱场景（>50 节点）

**处理策略**：

1. **索引优化**：搜索和筛选索引在数据加载后一次性构建
   ```js
   const graphIndexes = buildGraphIndexes(nodes, lines);  // 只构建一次
   ```

2. **增量更新**：聚焦状态只更新必要节点和连线，不全量遍历
   ```js
   // 只更新相关节点，不遍历所有节点
   [selectedNode, ...relatedNodes].forEach(node => {
     node.styleClass = getUpdatedClass(node);
   });
   ```

3. **防抖优化**：搜索输入使用防抖，避免每次输入都重建图谱
   ```js
   const debouncedSearch = debounce(searchNodes, 300);
   ```

4. **虚拟化（可选）**：如果节点数量超过 100，考虑只渲染可视区域节点

**验证方法**：在 100+ 节点图谱上测试搜索和选中响应时间

---

### 13.4 教师端和学生端再次样式分叉

**风险描述**：如果不统一管理样式，后续维护时容易再次出现不一致

**影响范围**：长期维护成本

**处理策略**：

1. **单一数据源**：分类色和状态色只在共享主题模块 `graphVisualTheme.js` 维护
2. **样式继承**：`kg-node-label` 规则只保留一套基础定义，各组件继承
3. **职责分离**：组件内只允许写布局差异（间距、位置），不重复写主题色
4. **代码审查**：PR 时检查是否有硬编码颜色值

**验证方法**：定期对比教师端和学生端样式，确保一致性

---

### 13.5 relation-graph-vue3 版本升级风险

**风险描述**：未来升级 relation-graph-vue3 可能导致 API 变化或样式冲突

**影响范围**：所有图谱组件

**处理策略**：

1. **锁定版本**：在 `package.json` 中锁定当前可用版本
2. **隔离适配层**：将 relation-graph 的调用封装在适配层，减少直接依赖
3. **充分测试**：升级前在测试环境充分验证
4. **文档记录**：记录当前使用的 API 和配置，便于升级时对比

**验证方法**：升级前后对比三种布局的渲染结果

## 14. 不做项

为了保持项目范围可控，以下内容明确不纳入本次优化：

### 14.1 技术架构变更

- ❌ 不接入新的图谱库（保留 `relation-graph-vue3`）
- ❌ 不重写后端接口
- ❌ 不改变后端知识图谱数据结构
- ❌ 不引入新的 UI 框架

### 14.2 功能扩展

- ❌ 不重写 AI 生成页
- ❌ 不做复杂路径推荐算法
- ❌ 不实现跨课程知识图谱合并
- ❌ 不新增知识点编辑表单字段
- ❌ 不实现协作编辑功能

### 14.3 开发工具暴露

- ❌ 不把 relation-graph 配置工具暴露给终端用户
- ❌ 不在学生端显示开发配置项
- ❌ 不提供图谱数据导出/导入功能（除非已有）

### 14.4 高级交互

- ❌ 不实现拖拽调整节点位置（保留自动布局）
- ❌ 不实现节点分组折叠（可作为第三阶段扩展）
- ❌ 不实现时间轴或版本历史查看

---

## 15. 完成定义

当以下所有条件满足时，本次优化视为完成：

### 15.1 PRD 验收标准

- ✓ PRD 中 15 条验收标准全部可验证通过

### 15.2 视觉一致性

- ✓ 教师端三种布局（中心、树形、双向树）视觉一致
- ✓ 学生端基础查看体验与教师端同步
- ✓ 节点、连线、背景使用统一的视觉规范

### 15.3 代码质量

- ✓ 构建通过（`npm run build` 无错误）
- ✓ 无新增明显控制台错误或警告
- ✓ 无未清理的调试样式或开发工具入口
- ✓ 代码符合项目现有规范（Vue 3 `<script setup>`、TypeScript）

### 15.4 文档完整性

- ✓ 本 Spec 文档与实际实现一致
- ✓ 如有重大偏差，已更新文档说明原因
- ✓ 关键决策和权衡已记录

### 15.5 功能完整性

- ✓ 不影响现有知识图谱数据读取
- ✓ 不影响节点详情查看和编辑保存链路
- ✓ 不影响 AI 生成知识图谱功能
- ✓ 全屏、适配视图等已有功能正常工作

### 15.6 性能要求

- ✓ 小图谱（≤10 节点）加载 <1 秒
- ✓ 中图谱（10-50 节点）加载 <2 秒
- ✓ 大图谱（>50 节点）加载 <3 秒
- ✓ 交互操作（搜索、选中、切换布局）响应流畅

---

## 16. 后续优化方向

本次优化完成后，可以考虑的后续方向：

### 16.1 第三阶段功能

- 分类筛选功能
- "只看相关路径"功能
- 大图谱自动折叠和局部展开

### 16.2 高级功能

- 知识点学习进度标记
- 知识点难度可视化
- 学习路径推荐
- 知识图谱分享和导出

### 16.3 性能优化

- 虚拟化渲染（节点数 >100 时）
- Web Worker 处理大图谱布局计算
- 图谱数据增量更新

### 16.4 用户体验

- 图谱引导教程（首次使用）
- 布局切换动画优化
- 移动端适配
- 无障碍访问优化
