# 知识图谱生成优化技术 Spec

## 1. 目标

将教师端 `AI生成知识图谱` 页面从当前双栏生成页改为单栏 AI 对话式生成页。页面只承载输入、上传、生成状态和生成完成入口，不再承载右侧结果预览编辑区。

## 2. 现状依据

当前生成页入口为 `HiProf/src/teacher/pages/AiKnowledgeGraphGenerator.vue`。

该页面当前结构包括：

1. `ResizableLayout`：左右分栏容器。
2. `InputPanel`：左侧输入和上传区域。
3. `ResultDisplay`：右侧生成结果展示区域。
4. `AiGenerationService`：生成任务服务组件。
5. `KnowledgeGraphManager`：课程知识图谱管理组件。
6. 样式文件 `HiProf/src/teacher/styles/ai-knowledge-graph-generator.css`。

当前可复用的 AI 对话样式参考：

1. `HiProf/src/teacher/styles/chat-discussion.css`
2. `HiProf/src/student/components/modules/StudentAIAssistant/StudentAIAssistant.vue`

## 3. 改造原则

1. 最小化改动：优先改造现有生成页和输入组件，不改后端接口。
2. 保留业务链路：生成、停止、文件解析、生成完成后查看图谱能力不丢失。
3. 移除无效展示：生成页不再显示大面积只读结果文本框。
4. 样式复用优先：尽量沿用已有 AI 对话、聊天输入、文件卡片相关视觉语言。
5. 不做静默降级：文件解析或生成失败必须明确展示错误。

## 4. 前端改造范围

### 4.1 页面结构

修改 `HiProf/src/teacher/pages/AiKnowledgeGraphGenerator.vue`：

1. 移除 `ResizableLayout` 引入和模板使用。
2. 移除右侧 `ResultDisplay` 区域。
3. 保留顶部返回按钮和标题。
4. 主体改为单个 AI 对话式容器。
5. 保留 `AiGenerationService` 和 `KnowledgeGraphManager` 服务组件。

### 4.2 输入区域

技术检查结论：`InputPanel` 当前只在 `HiProf/src/teacher/pages/AiKnowledgeGraphGenerator.vue` 中引用，没有发现其他页面复用。

实现决策：

1. 新增 `KnowledgeGraphChatInput.vue` 组件，只服务知识图谱生成入口页。
2. 不直接改造成旧 `InputPanel`，避免把旧表单式结构和新 AI 对话式结构耦合在一起。
3. 新组件负责多文件上传、输入框、任务创建按钮和任务创建成功后的跳转。
4. 旧 `InputPanel` 在页面切换完成后可不再被生成页引用，是否删除由实现阶段根据引用结果决定。

## 5. 节点文字溢出修复

### 5.1 问题定位

截图中的问题发生在知识图谱树形展示区域。当前相关组件为 `HiProf/src/teacher/features/course-detail/knowledgegraph/TreeLayoutComponent.vue`。

代码中存在固定节点尺寸配置：

1. `getDynamicLayoutOptions` 根据节点数量返回固定 `nodeWidth` 和 `nodeHeight`。
2. 小图谱节点约为 `180 x 60`。
3. 中等图谱节点约为 `150 x 50`。
4. 大图谱节点约为 `120 x 40`。
5. 节点文本直接使用 `node.name` 写入 `text` 字段。

根因假设：节点框尺寸主要由节点数量决定，没有根据节点文本长度和换行行数计算尺寸；当节点名称较长时，渲染库仍按固定宽高绘制节点，导致文字超出节点框。

### 5.2 修复策略

1. 在传入图谱渲染库前，对节点文本进行长度评估。
2. 根据最长节点文本、中文字符数、英文字符数和预期每行字符数计算推荐节点宽高。
3. 节点宽度设置最小值和最大值，避免个别超长节点把整体布局撑坏。
4. 节点高度根据换行行数增加，保证多行文本在框内可读。
5. 布局间距同步根据节点宽高调整，避免节点扩大后互相覆盖。
6. 技术检查确认 `relation-graph-vue3` 的 `JsonNode` 支持 `width`、`height`、`html`、`innerHTML`、`styleClass` 字段，优先使用单节点独立宽高和自定义节点 HTML。
7. 节点 HTML 内使用 3 行文本截断样式，超过 3 行显示省略号，完整文本保留在节点数据中供详情面板展示。

### 5.3 建议算法

新增节点尺寸计算方法，例如 `calculateNodeTextMetrics(nodes)`：

1. 读取每个节点的 `name` 或 `text`。
2. 按字符宽度估算文本长度：中文字符按 1 个单位，英文和数字按 0.6 个单位。
3. 根据布局规模确定每行最大单位数：小图谱可更宽，大图谱更紧凑。
4. 计算每个节点需要的行数。
5. 得出全局 `nodeWidth` 和 `nodeHeight`，或在渲染库支持时为单节点设置独立尺寸。

推荐初始约束：

1. `minNodeWidth`: `140`
2. `maxNodeWidth`: `240`
3. `minNodeHeight`: `48`
4. `lineHeight`: `20`
5. `verticalPadding`: `16`
6. `maxLines`: `3`

### 5.4 文本处理规则

1. 普通长度：单行居中显示。
2. 中等长度：自动拆成 2 到 3 行，节点高度随行数增加。
3. 超长长度：最多展示 3 行，超过 3 行显示省略号。
4. 不允许文字直接画出节点框。
5. 完整节点名称保留在节点原始数据中，点击节点后由详情面板展示完整内容。

### 5.5 布局影响

节点尺寸变化后，需要同步调整：

1. `defaultNodeWidth`
2. `defaultNodeHeight`
3. `layout.min_per_width`
4. `layout.max_per_width`
5. `layout.min_per_height`
6. `layout.max_per_height`

技术检查结论：`relation-graph-vue3@2.2.10` 类型定义中的 `JsonNode` 已支持单节点 `width` 和 `height`，因此不需要只依赖全局 `defaultNodeWidth` 和 `defaultNodeHeight`。

修复点应优先放在 `TreeLayoutComponent.vue`、`BidirectionalTreeLayoutComponent.vue` 和学生端图谱展示组件的数据渲染前：

1. 为每个节点计算 `width`、`height`、`html` 或 `innerHTML`。
2. 保留全局 `defaultNodeWidth` 和 `defaultNodeHeight` 作为兜底默认值。
3. 布局间距仍需根据本批节点的最大宽高同步调整，避免节点扩大后重叠。
4. 不采用纯 CSS 强行撑大节点，因为这可能导致连线仍按旧节点尺寸计算。
5. 学生端知识图谱展示组件也需要同步采用同一套 3 行省略和详情查看规则。

## 6. 双向树方向修复

### 6.1 问题定位

当前双向树组件为 `HiProf/src/teacher/features/course-detail/knowledgegraph/BidirectionalTreeLayoutComponent.vue`。

现有实现中，双向树配置仍使用 `layoutName: 'tree'`，并设置 `from: 'left'` 和 `layoutDirection: 'h'`。代码注释期望“自动双向”，但从截图看实际节点几乎全部向同一方向展开。

根因假设：当前传给图谱库的数据仍是普通父子树结构，布局配置只指定了水平树，不足以让一级分支自动分配到左右两侧；因此渲染结果退化成单向树。

### 6.2 修复策略

1. 在 `BidirectionalTreeLayoutComponent.vue` 构建图谱数据后，为根节点的一级子节点做左右分组。
2. 按一级节点顺序交替分配左右两侧，默认规则为：第 1、3、5 个分支在右侧，第 2、4、6 个分支在左侧。
3. 如果图谱库支持节点 `lot.level`、固定坐标或布局方向字段，优先使用库支持的方式表达左右侧。
4. 如果图谱库不支持自动双向树，则构建一个虚拟双向结构或在渲染后调整左侧分支坐标。
5. 左侧分支的子节点继续向左展开，右侧分支的子节点继续向右展开。
6. 保持点击节点、详情面板、连线点击等现有交互不变。

### 6.3 分支分配规则

第一阶段采用稳定、可预测的平均分配规则：

1. 找到根节点的直接子节点。
2. 按当前图谱数据顺序排序。
3. 奇数序号分到右侧，偶数序号分到左侧。
4. 每个一级节点的后代跟随该一级节点所在侧。
5. 如果只有一个一级分支，允许只显示一侧，因为没有可平衡的第二分支。

### 6.4 验收规则

1. 当根节点有 2 个及以上一级分支时，左右两侧都必须有节点。
2. 左侧节点不能与右侧节点重叠。
3. 左侧分支连线应从根节点左侧出发，右侧分支连线应从根节点右侧出发。
4. 双向树与普通树形布局有明显区别。
5. 缩放到适屏后，左右两侧分支都在可视范围内。

## 7. 流式生成预览与确认替换

### 7.1 现有能力判断

后端 `knowledge-agent` 已存在任务式生成和 SSE 流接口：

1. `POST /api/v1/knowledge-agent/tasks` 创建生成任务。
2. `GET /api/v1/knowledge-agent/tasks/{task_id}` 查询任务状态。
3. `GET /api/v1/knowledge-agent/tasks/{task_id}/stream` 通过 `text/event-stream` 推送任务变化。
4. `TaskRecord.result` 支持保存部分结果。
5. `agent.py` 在一级主题、下级节点分批扩展、轻卡片生成过程中都会调用 `_save_partial_result`。

这说明“边生成边渲染”不需要等最终完成才开始，技术上可以基于任务阶段性 `result.nodes` 做增量渲染。

### 7.2 新页面模型

新增或改造生成流程为两段式：

1. 生成入口页：AI 对话式输入和文件上传。
2. 生成预览页：承载临时图谱任务，显示空白图谱面板，并订阅任务流。

生成入口页先创建任务，拿到 `taskId` 后再跳转生成预览页。生成预览页不读取当前课程已保存图谱作为初始数据，而是从空图谱开始。收到任务阶段性结果后，使用 `task.result.nodes` 构建临时图谱数据并渲染。

### 7.3 数据状态

前端需要区分三类图谱状态：

1. `currentGraph`：课程当前已保存图谱。
2. `draftGraph`：本次生成任务的临时图谱。
3. `confirmedGraph`：教师确认替换后持久化的新图谱。

生成过程中只能更新 `draftGraph`，不能写入 `currentGraph`。

### 7.4 流式订阅

推荐前端使用 `EventSource` 订阅后端 SSE：

1. 当前对话页创建任务成功后拿到 `taskId`。
2. 跳转到生成预览页并携带 `taskId`。
3. 生成预览页刷新时继续从路由或本地状态读取 `taskId`，并恢复订阅。
4. 预览页使用绝对 URL 打开 `EventSource`，例如 `new EventSource('http://localhost:8001/tasks/{taskId}/stream')`。当前直接连接 Python Agent 的 `/tasks/{taskId}/stream` 端点。
5. 收到 `task` 事件时更新进度和 `draftGraph`。
6. 收到 `completed` 事件时关闭连接，显示”确认替换当前图谱”。
7. 收到 `failed` 事件时关闭连接，显示错误、重新生成入口，并保留已经返回的部分 `draftGraph` 供查看。

**注意**：当前 Java 后端尚未实现 SSE 代理端点 `/core/zstp/agent/tasks/{taskId}/stream`。待 Java 端实现后，前端将切换到代理路径。前端必须使用绝对 URL 构建 EventSource 连接，因为 EventSource 不支持相对路径跨域。

### 7.5 渲染策略

生成预览页使用空白图谱容器，按阶段增量渲染：

1. `submitted` 或 `loading_sources`：空白面板 + 状态文字。
2. `generating_skeleton` 且已有一级节点：渲染根节点和一级节点。
3. `generating_skeleton` 下级批次返回：合并节点并刷新图谱布局。
4. `generating_light_cards`：节点结构保持，节点可显示卡片生成状态。
5. `completed`：锁定草稿图谱，等待用户确认。

每次接收节点更新时，按节点 `id` 做 upsert，避免重复创建节点对象。

### 7.6 确认替换

确认替换必须是显式动作：

1. 用户点击“确认替换当前图谱”。
2. 前端调用持久化接口，例如 `persistKnowledgeGraphGenerationTask(taskId)`。
3. 后端完全删除课程旧图谱节点、连线和相关映射，再写入任务最终结果。
4. 持久化成功后跳转回课程知识图谱页并刷新当前图谱。
5. 持久化失败时保留草稿预览和错误提示，不修改当前图谱。

现有 `AiGenerationService.vue` 当前会在任务完成后自动调用 `persistKnowledgeGraphGenerationTask`，这与新需求冲突。实现时必须移除自动持久化，改为用户确认后再调用。

### 7.7 闭环检查

本流程闭环成立的条件：

1. 创建任务后能拿到稳定 `taskId`。
2. 预览页能通过 `taskId` 订阅或轮询到阶段性 `TaskRecord`。
3. 刷新预览页后能继续用同一个 `taskId` 恢复生成进度和草稿图谱。
4. 后端在一级节点生成后写入 `task.result.nodes`。
5. 前端能把 `task.result.nodes` 转成图谱组件数据。
6. 生成完成前不调用持久化替换接口。
7. 用户确认后才持久化。
8. 持久化采用完全替换策略：删除旧图谱后写入新图谱。
9. 持久化成功后刷新课程当前图谱。
10. 失败、取消、离开页面都不会修改当前图谱。
11. 失败时可以保留部分草稿图谱供查看，但不能进入确认替换流程。

### 7.8 内存泄露风险与防护

需要重点防护以下风险：

1. `EventSource` 未关闭：页面卸载、任务完成、任务失败、用户取消时必须调用 `eventSource.close()`。
2. `AbortController` 未释放：每次生成结束后置空 controller，并在页面卸载时 abort。
3. 定时器未清理：当前树图组件存在 `setTimeout`，后续实现应保存 timer id，并在 `onUnmounted` 中 `clearTimeout`。
4. 重复订阅：同一个页面只能存在一个当前任务订阅，切换任务前必须关闭旧订阅。
5. 图谱实例残留：预览页卸载时应清空图谱数据或调用图谱库销毁方法，避免大图谱节点对象被闭包引用。
6. 事件监听残留：所有手动注册的 `addEventListener` 必须在完成或卸载时移除。
7. 草稿数据无限增长：只保留当前任务的 `draftGraph`，重新生成前清空旧草稿。

### 7.9 降级策略

如果 SSE 代理短期内不可用，可以临时继续使用轮询，但轮询也必须满足：

1. 轮询间隔统一管理。
2. 页面卸载时停止轮询。
3. 任务完成、失败、取消后停止轮询。
4. 每次轮询使用阶段性 `result.nodes` 更新草稿图谱。

SSE 是推荐方案，轮询只作为实现过渡方案。

## 8. 组件设计

### 8.1 `KnowledgeGraphChatInput`

职责：渲染 AI 对话式输入界面，管理本地输入态和文件选择态，并向父页面抛出生成或停止事件。

建议 props：

1. `modelValue`：教师输入的生成要求。
2. `isGenerating`：是否正在生成。
3. `generationProgressText`：当前生成阶段文案。
4. `uploadedFiles`：已上传文件列表，支持多文件上传。

建议 emits：

1. `update:modelValue`
2. `upload-file`
3. `remove-file`
4. `generate`
5. `stop`
6. `reset`

### 8.2 页面状态

`AiKnowledgeGraphGenerator.vue` 继续维护以下关键状态：

1. `graphRequirements`
2. `generationProgress`
3. `generationProgressText`
4. `latestTaskId`
5. `latestGraphId`
6. `latestTaskResult`

`generatedResult` 和 `originalResult` 如果只服务右侧文本结果区，应评估是否删除；如果 `AiGenerationService` 仍依赖它们，可先保留为内部状态，但不再渲染为右侧文本框。

## 9. 交互状态

### 9.1 空状态

显示 AI 欢迎语：

“请告诉我你希望生成什么样的课程知识图谱。你可以描述课程重点、章节范围、知识点层级，也可以上传课程资料。”

### 9.2 已输入状态

输入框展示教师文本，生成按钮可用。

如果没有文本但已有文件，生成按钮也可用。

### 9.3 文件状态

支持多文件上传。文件上传后显示文件卡片列表：

1. 文件名。
2. 文件大小。
3. 文件类型。
4. 解析中、解析成功、解析失败状态。
5. 删除按钮。

每个文件独立展示解析状态；生成时合并所有已解析文件内容和教师输入要求。

### 9.4 生成中状态

1. 输入框禁用或只读。
2. 生成按钮切换为停止按钮。
3. 消息区展示当前阶段文案。
4. 禁止重复提交。

### 9.5 完成状态

1. 显示“知识图谱生成完成”。
2. 显示“查看知识图谱”按钮。
3. 显示"查看知识图谱"按钮，点击后跳转至课程详情的知识图谱页面。

### 9.6 失败状态

1. 显示失败原因。
2. 恢复输入和生成按钮。
3. 保留用户输入和已上传文件，便于重试。

## 10. 接口边界

本次默认不修改后端接口。

继续复用 `HiProf/src/api/graph.js` 中知识图谱生成相关能力：

1. `parseKnowledgeGraphSourceFile`
2. `createKnowledgeGraphGenerationTask`
3. `getKnowledgeGraphGenerationTask`
4. `persistKnowledgeGraphGenerationTask`
5. `generateKnowledgeGraphAndPersist`，若当前链路仍使用同步生成。

具体采用同步还是任务式生成，以现有 `AiGenerationService` 实际调用为准。

## 11. 样式要求

1. 页面主体居中，最大宽度建议控制在 `900px` 到 `1080px`。
2. 对话容器参考 DeepSeek 官网或同类 AI 对话官网的简洁输入体验：大面积留白、居中输入、轻量边框、圆角输入框、低干扰工具按钮。
3. 该页面只采用 AI 对话视觉样式，不保留历史会话，不实现真正多轮对话。
4. 底部输入区固定在容器底部或页面底部，避免长内容时按钮消失。
5. 上传按钮放在输入框左侧或下方工具栏，支持多个文件卡片横向或换行排列。
6. 主按钮使用当前平台主色，不再使用整屏底部大按钮。
7. 移动端窄屏下输入区和文件卡片纵向排列。

## 12. 验证清单

1. 打开 AI 生成知识图谱页面，页面只显示单栏对话式生成区域。
2. 页面不存在 `ResizableLayout` 的拖拽分隔条。
3. 页面不存在 `ResultDisplay` 的大文本结果预览区。
4. 输入文字后可以发起生成。
5. 上传文件后可以发起生成。
6. 文字和文件同时存在时可以发起生成。
7. 生成中按钮状态正确，不能重复提交。
8. 停止生成按钮仍可工作。
9. 生成失败能显示错误信息，并可重试。
10. 生成成功后能跳转或进入已有知识图谱查看页面。
11. 使用长节点名称测试，文字不能超出节点框。
12. 使用 1 行、2 行、3 行及更长节点名称测试，节点宽高应随内容变化。
13. 切换树形和双向树布局后，节点文字仍在框内。
14. 节点尺寸变化后连线端点仍贴合节点边缘，不出现明显穿字或错位。
15. 大图谱场景下节点不会因为自适应尺寸产生严重重叠。
16. 双向树布局下，根节点有 2 个及以上一级分支时，左右两侧都显示分支。
17. 双向树的左侧分支继续向左展开，右侧分支继续向右展开。
18. 双向树切换、缩放、居中后仍能保持左右分区。
19. 生成预览页进入时显示空白图谱面板。
20. 一级节点生成后，不等待全量完成即可渲染根节点和一级节点。
21. 下级节点分批返回时，图谱持续增量更新。
22. 生成完成前不会调用替换当前图谱的持久化接口。
23. 点击确认替换后才持久化并刷新课程当前图谱。
24. 取消、失败、离开页面不会覆盖当前图谱。
25. 页面卸载、任务完成、任务失败、取消时没有遗留 SSE 连接、轮询定时器或图谱实例引用。
26. 学生端知识图谱节点文字同样最多显示 3 行并显示省略号。
27. 当前对话页创建任务成功并拿到 `taskId` 后才跳转生成预览页。
28. 刷新生成预览页后能通过同一个 `taskId` 恢复生成进度。
29. 确认替换时后端完全删除旧图谱再写入新图谱。
30. 生成失败时保留部分草稿图谱供查看，但不允许确认替换。
31. 支持一次上传多个文件，并合并文件解析结果参与生成。
32. 单文件大小继续限制为最大 50MB。
33. 不保留明显的“重置”按钮，使用输入框清空和文件卡片删除完成重置类操作。
34. AI 对话区只作为视觉样式，不保留历史会话。

## 13. 技术检查结论

1. `InputPanel` 当前只在 `AiKnowledgeGraphGenerator.vue` 中引用，但仍采用新增 `KnowledgeGraphChatInput.vue` 的方案，避免旧表单组件和新 AI 对话式入口耦合。
2. `relation-graph-vue3@2.2.10` 的 `JsonNode` 支持单节点 `width`、`height`、`html`、`innerHTML` 和 `styleClass` 字段，节点文字溢出修复优先采用单节点独立宽高和自定义 HTML。
3. 全局 `defaultNodeWidth`、`defaultNodeHeight` 仅作为兜底默认值，布局间距需按当前节点最大尺寸同步调整。
