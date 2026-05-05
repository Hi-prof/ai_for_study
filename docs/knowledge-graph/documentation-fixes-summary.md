# 知识图谱生成文档修复总结

## 修复日期
2026-05-05

## 修复概述
对知识图谱生成的三份文档（PRD、Spec、Implementation Plan）进行了全面审查和修复，确保文档内容与实际代码实现一致，并修正了技术细节中的不准确描述。

## 修复的问题

### 1. Spec - Section 7.4 SSE 流式订阅

**问题**：
- 原文档混淆了当前实现路径和未来规划路径
- 没有明确说明 EventSource 需要使用绝对 URL
- 路径格式描述不够清晰

**修复内容**：
- 明确区分当前直接连接 Python Agent 的路径：`/tasks/{taskId}/stream`
- 明确未来通过 Java 代理的路径：`/core/zstp/agent/tasks/{taskId}/stream`
- 添加了 EventSource 必须使用绝对 URL 的技术要求
- 提供了具体的 URL 构建示例：`new EventSource('http://localhost:8001/tasks/{taskId}/stream')`

**修复位置**：`docs/knowledge-graph/knowledge-graph-generation-spec.md:200-212`

---

### 2. Implementation Plan - Task 3 Step 4 错误流处理

**问题**：
- 原代码直接调用 `readBody(connection.getErrorStream())`
- 当 HTTP 错误响应没有 body 时，`getErrorStream()` 可能返回 `null`
- 直接传递 `null` 给 `readBody` 会导致 `NullPointerException`

**修复内容**：
```java
// 修复前
String body = readBody(connection.getErrorStream());

// 修复后
InputStream errorStream = connection.getErrorStream();
String body = errorStream != null ? readBody(errorStream) : "无错误详情";
```

**修复位置**：`docs/knowledge-graph/knowledge-graph-generation-implementation-plan.md:458-501`

---

### 3. Implementation Plan - Task 4 Step 3 EventSource URL 构建

**问题**：
- 原代码直接使用 `getKnowledgeGraphGenerationTaskStreamUrl(taskId)` 返回的相对路径
- EventSource 不支持相对路径，必须使用绝对 URL
- 跨域场景下会导致连接失败

**修复内容**：
```js
// 修复前
stream.value = new EventSource(getKnowledgeGraphGenerationTaskStreamUrl(props.taskId));

// 修复后
const streamPath = getKnowledgeGraphGenerationTaskStreamUrl(props.taskId);
const streamUrl = streamPath.startsWith('http') ? streamPath : `${window.location.origin}${streamPath}`;
stream.value = new EventSource(streamUrl);
```

**修复位置**：`docs/knowledge-graph/knowledge-graph-generation-implementation-plan.md:587-671`

**额外说明**：
- 在 Step 3 的文档注释中明确要求"构建绝对 URL"
- 提供了兼容已有绝对 URL 和相对路径的处理逻辑

---

### 4. Implementation Plan - Task 5 Step 1 布局模式说明

**问题**：
- 原文档只说明了将 `layoutName` 从 `'tree'` 改为 `'fixed'`
- 没有解释为什么需要这样做
- 没有说明 `fixed` 布局的技术含义和实现要求

**修复内容**：
- 添加了技术背景说明：`relation-graph-vue3` 的 `tree` 布局不支持自动双向分支
- 明确了 `fixed` 布局的含义：允许通过 `x`、`y`、`fixed` 属性手动控制节点位置
- 添加了实现警告：使用 `fixed` 布局需要为每个节点手动计算坐标

**修复位置**：`docs/knowledge-graph/knowledge-graph-generation-implementation-plan.md:720-737`

---

## 未发现问题的部分

### PRD 文档
- 经过全面审查，PRD 文档内容准确，逻辑清晰
- 产品需求描述与技术实现方案一致
- 验收标准完整且可执行

### 代码引用验证
通过 grep 验证了以下关键引用：
- ✅ `_save_partial_result` 存在于 `agent.py` 的 5 个位置（lines 80, 99, 296, 344, 675）
- ✅ `relation-graph-vue3` 的 `JsonNode` 类型支持 `width`、`height`、`innerHTML` 等字段
- ✅ 后端 `ZstpGraphController.java` 已有任务创建和查询接口
- ✅ FastAPI `api.py` 已有 SSE stream 端点

---

## 修复影响范围

### 前端
- `KnowledgeGraphGenerationPreview.vue`（待创建）
- EventSource URL 构建逻辑

### 后端
- `KnowledgeAgentServiceImpl.java` 的 `streamGenerationTask` 方法
- 错误流处理逻辑

### 文档
- Spec 的 SSE 订阅说明
- Implementation Plan 的三个任务步骤

---

## 验证建议

### 1. 错误流处理验证
```bash
# 模拟后端返回 4xx/5xx 但无 response body
curl -X GET http://localhost:8001/tasks/invalid-task-id/stream
```
预期：Java 代理应返回 "无错误详情" 而不是抛出 NPE

### 2. EventSource URL 验证
```js
// 在浏览器控制台测试
const streamPath = '/core/zstp/agent/tasks/test-123/stream';
const streamUrl = streamPath.startsWith('http') ? streamPath : `${window.location.origin}${streamPath}`;
console.log(streamUrl); // 应输出完整的 http://... URL
```

### 3. 双向树布局验证
- 创建包含 4+ 个一级分支的知识图谱
- 切换到双向树布局
- 验证奇数序号分支在右侧，偶数序号分支在左侧

---

## 后续建议

### 短期
1. 在实现 Task 3 和 Task 4 时，严格按照修复后的代码编写
2. 添加单元测试覆盖 `errorStream == null` 的场景
3. 在前端添加 EventSource 连接失败的降级提示

### 长期
1. 考虑在 Java 后端实现完整的 SSE 代理后，统一前端 URL 构建逻辑
2. 评估是否需要为 `relation-graph-vue3` 贡献自动双向树布局算法
3. 建立文档与代码的自动化一致性检查流程

---

## 修复确认

- [x] Spec Section 7.4 SSE 路径和 URL 格式
- [x] Implementation Plan Task 3 Step 4 错误流空指针
- [x] Implementation Plan Task 4 Step 3 EventSource 绝对 URL
- [x] Implementation Plan Task 5 Step 1 布局模式说明
- [x] 验证所有代码引用的准确性
- [x] 确认 PRD 无需修改

所有修复已完成并保存到对应文档中。
