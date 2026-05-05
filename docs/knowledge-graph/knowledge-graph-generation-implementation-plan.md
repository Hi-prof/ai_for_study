# 知识图谱生成优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将教师端 AI 生成知识图谱改为单栏对话式入口，并新增流式草稿预览、确认替换、节点文本自适应和双向树左右展开能力。

**Architecture:** 入口页只负责采集文本和多文件解析结果，创建生成任务后跳转预览页。预览页通过 `taskId` 订阅任务流，只更新临时 `draftGraph`，教师确认后才调用持久化接口替换课程当前图谱。节点文本尺寸计算沉到共享图谱工具，教师端树形/双向树和学生端嵌入图谱统一复用。

**Tech Stack:** Vue 3、Vite、vue-router、relation-graph-vue3、Axios、EventSource、Spring Boot、SSE、FastAPI knowledge-agent。

---

## 已验证现状

- `HiProf/src/teacher/pages/AiKnowledgeGraphGenerator.vue` 仍使用 `ResizableLayout`、`InputPanel` 和 `ResultDisplay` 双栏布局。
- `HiProf/src/teacher/features/course-detail/knowledgegraph/refactored/AiGenerationService.vue` 当前在任务完成后自动调用 `persistKnowledgeGraphGenerationTask`，这与“确认后替换”冲突。
- `HiProf/src/api/graph.js` 已有创建任务、查询任务、解析文件、持久化任务接口，但没有前端 SSE stream URL/helper。
- 后端 `ZstpGraphController.java` 已暴露 `POST /core/zstp/agent/tasks`、`GET /core/zstp/agent/tasks/{taskId}` 和 `POST /core/zstp/agent/tasks/{taskId}/persist`，未暴露 `/stream` 代理。
- FastAPI `HiProf-master/hiprof-agent/knowledge-agent/app/api.py` 已有 `GET /api/v1/knowledge-agent/tasks/{task_id}/stream`。
- `relation-graph-vue3@2.2.10` 本地类型支持节点 `width`、`height`、`x`、`y`、`fixed`、`innerHTML`、`html`。
- `TreeLayoutComponent.vue`、`BidirectionalTreeLayoutComponent.vue` 和 `shared/features/graph/utils/graphUtils.js` 都会构造图谱节点，是节点文本修复的落点。

## 文件结构

- Create: `HiProf/src/teacher/features/course-detail/knowledgegraph/KnowledgeGraphChatInput.vue`
- Create: `HiProf/src/teacher/pages/KnowledgeGraphGenerationPreview.vue`
- Create: `HiProf/src/teacher/features/course-detail/knowledgegraph/generationTaskGraphMapper.js`
- Create: `HiProf/src/shared/features/graph/utils/nodeTextLayout.js`
- Modify: `HiProf/src/teacher/pages/AiKnowledgeGraphGenerator.vue`
- Modify: `HiProf/src/teacher/features/course-detail/knowledgegraph/refactored/AiGenerationService.vue`
- Modify: `HiProf/src/teacher/features/course-detail/knowledgegraph/TreeLayoutComponent.vue`
- Modify: `HiProf/src/teacher/features/course-detail/knowledgegraph/BidirectionalTreeLayoutComponent.vue`
- Modify: `HiProf/src/shared/features/graph/utils/graphUtils.js`
- Modify: `HiProf/src/shared/features/graph/components/graph/GraphView.vue`
- Modify: `HiProf/src/teacher/styles/ai-knowledge-graph-generator.css`
- Modify: `HiProf/src/api/graph.js`
- Modify: `HiProf/src/router/modules/teacher.js`
- Modify: `HiProf-master/hiprof-core/src/main/java/com/hiprof/core/controller/ZstpGraphController.java`
- Modify: `HiProf-master/hiprof-core/src/main/java/com/hiprof/core/service/IKnowledgeAgentService.java`
- Modify: `HiProf-master/hiprof-core/src/main/java/com/hiprof/core/service/impl/KnowledgeAgentServiceImpl.java`

## Task 1: 共享节点文本布局工具

**Files:**
- Create: `HiProf/src/shared/features/graph/utils/nodeTextLayout.js`
- Modify: `HiProf/src/teacher/features/course-detail/knowledgegraph/TreeLayoutComponent.vue`
- Modify: `HiProf/src/teacher/features/course-detail/knowledgegraph/BidirectionalTreeLayoutComponent.vue`
- Modify: `HiProf/src/shared/features/graph/utils/graphUtils.js`
- Modify: `HiProf/src/shared/features/graph/components/graph/GraphView.vue`

- [ ] **Step 1: Create shared text layout helper**

Create `nodeTextLayout.js`:

```js
const DEFAULT_LIMITS = {
  minWidth: 140,
  maxWidth: 240,
  minHeight: 48,
  lineHeight: 20,
  verticalPadding: 16,
  horizontalPadding: 24,
  maxLines: 3
};

const getTextUnits = (text) => Array.from(String(text || '')).reduce((total, char) => {
  return total + (/[\u4e00-\u9fff]/.test(char) ? 1 : 0.6);
}, 0);

const getUnitsPerLine = (units) => {
  if (units <= 10) return 10;
  if (units <= 24) return 12;
  return 14;
};

export const escapeNodeHtml = (value) => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export const measureRelationGraphNodeText = (text, options = {}) => {
  const limits = { ...DEFAULT_LIMITS, ...options };
  const units = getTextUnits(text);
  const perLineUnits = getUnitsPerLine(units);
  const lineCount = Math.min(Math.max(Math.ceil(units / perLineUnits), 1), limits.maxLines);
  const width = Math.min(Math.max(Math.ceil(perLineUnits * 14 + limits.horizontalPadding), limits.minWidth), limits.maxWidth);
  const height = Math.max(limits.minHeight, lineCount * limits.lineHeight + limits.verticalPadding);
  return { width, height, lineCount, maxLines: limits.maxLines };
};

export const buildRelationGraphNodeHtml = (text) => {
  const safeText = escapeNodeHtml(text);
  return `<div class="kg-node-label" title="${safeText}">${safeText}</div>`;
};

export const applyRelationGraphNodeTextLayout = (node, options = {}) => {
  const displayText = String(node.text || node.name || node.label || '').trim();
  const metrics = measureRelationGraphNodeText(displayText, options);
  return {
    ...node,
    text: displayText,
    width: metrics.width,
    height: metrics.height,
    innerHTML: buildRelationGraphNodeHtml(displayText),
    html: buildRelationGraphNodeHtml(displayText),
    data: {
      ...(node.data || {}),
      fullText: displayText,
      textMetrics: metrics
    }
  };
};

export const getMaxRelationGraphNodeSize = (nodes) => {
  return nodes.reduce((result, node) => ({
    width: Math.max(result.width, Number(node.width || 0)),
    height: Math.max(result.height, Number(node.height || 0))
  }), { width: DEFAULT_LIMITS.minWidth, height: DEFAULT_LIMITS.minHeight });
};
```

- [ ] **Step 2: Apply helper in teacher tree layout**

In `TreeLayoutComponent.vue`, import:

```ts
import {
  applyRelationGraphNodeTextLayout,
  getMaxRelationGraphNodeSize
} from '@/shared/features/graph/utils/nodeTextLayout';
```

Change `processedNodes = nodes.map(...)` so every returned node is wrapped:

```ts
const processedNodes = nodes.map(node => applyRelationGraphNodeTextLayout({
  id: node.id.toString(),
  text: node.name || `节点${node.id}`,
  borderColor: 'rgba(0, 206, 209, 1)',
  fontColor: '#000000',
  color: 'rgba(0, 206, 209, 0.1)',
  data: {
    content: node.content || '',
    category: node.category || 'default'
  }
}));
```

In `renderTreeGraph`, merge text size into layout spacing:

```ts
const maxNodeSize = getMaxRelationGraphNodeSize(graphData.nodes || []);
updatedOptions.defaultNodeWidth = Math.max(dynamicParams.nodeWidth, maxNodeSize.width);
updatedOptions.defaultNodeHeight = Math.max(dynamicParams.nodeHeight, maxNodeSize.height);
updatedOptions.layout.min_per_width = Math.max(dynamicParams.minPerWidth, maxNodeSize.width + 80);
updatedOptions.layout.min_per_height = Math.max(dynamicParams.minPerHeight, maxNodeSize.height + 180);
```

- [ ] **Step 3: Apply helper in bidirectional tree layout**

Use the same import and wrap `processedNodes` in `BidirectionalTreeLayoutComponent.vue`. In `renderBidirectionalTree`, use `getMaxRelationGraphNodeSize` before `setOptions`:

```ts
const maxNodeSize = getMaxRelationGraphNodeSize(graphData.nodes || []);
updatedOptions.defaultNodeWidth = Math.max(dynamicParams.nodeWidth, maxNodeSize.width);
updatedOptions.defaultNodeHeight = Math.max(dynamicParams.nodeHeight, maxNodeSize.height);
updatedOptions.layout.min_per_width = Math.max(dynamicParams.minPerWidth, maxNodeSize.width + 120);
updatedOptions.layout.min_per_height = Math.max(dynamicParams.minPerHeight, maxNodeSize.height + 40);
```

- [ ] **Step 4: Apply helper in shared student graph processing**

In `graphUtils.js`, import:

```js
import { applyRelationGraphNodeTextLayout } from './nodeTextLayout.js';
```

Wrap `processedNode` before returning:

```js
return applyRelationGraphNodeTextLayout(processedNode, {
  minWidth: 96,
  maxWidth: 180,
  minHeight: 64,
  horizontalPadding: 18
});
```

- [ ] **Step 5: Add shared clamp CSS**

Add to `TreeLayoutComponent.vue`, `BidirectionalTreeLayoutComponent.vue`, and `GraphView.vue` scoped styles:

```scss
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
```

- [ ] **Step 6: Verify build**

Run:

```powershell
cd "C:\Users\xuhuangbin\Desktop\aiforteach\HiProf"
npm run build
```

Expected: build completes without TypeScript or Vite errors.

- [ ] **Step 7: Commit**

```powershell
git add "HiProf/src/shared/features/graph/utils/nodeTextLayout.js" "HiProf/src/teacher/features/course-detail/knowledgegraph/TreeLayoutComponent.vue" "HiProf/src/teacher/features/course-detail/knowledgegraph/BidirectionalTreeLayoutComponent.vue" "HiProf/src/shared/features/graph/utils/graphUtils.js" "HiProf/src/shared/features/graph/components/graph/GraphView.vue"
git commit -m "fix: clamp knowledge graph node text"
```

## Task 2: 单栏 AI 对话式生成入口

**Files:**
- Create: `HiProf/src/teacher/features/course-detail/knowledgegraph/KnowledgeGraphChatInput.vue`
- Modify: `HiProf/src/teacher/pages/AiKnowledgeGraphGenerator.vue`
- Modify: `HiProf/src/teacher/styles/ai-knowledge-graph-generator.css`

- [ ] **Step 1: Create `KnowledgeGraphChatInput.vue`**

The component owns local input/files and emits a normalized generate payload:

```vue
<script setup>
import { computed, ref } from 'vue';
import { parseKnowledgeGraphSourceFile } from '@/api/graph.js';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.txt', '.pdf', '.docx', '.pptx'];

const props = defineProps({
  modelValue: { type: String, default: '' },
  isSubmitting: { type: Boolean, default: false },
  progressText: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue', 'generate', 'stop']);
const fileInput = ref(null);
const sourceFiles = ref([]);

const canGenerate = computed(() => {
  return props.modelValue.trim() || sourceFiles.value.some(file => file.status === 'success');
});

const handleFilesSelected = async (event) => {
  const files = Array.from(event.target.files || []);
  for (const file of files) {
    const extension = `.${String(file.name).split('.').pop().toLowerCase()}`;
    if (file.size > MAX_FILE_SIZE || !ALLOWED_EXTENSIONS.includes(extension)) {
      sourceFiles.value.push({ name: file.name, size: file.size, status: 'error', error: '文件类型或大小不符合要求' });
      continue;
    }
    const item = { name: file.name, size: file.size, status: 'parsing', text: '', error: '' };
    sourceFiles.value.push(item);
    try {
      const response = await parseKnowledgeGraphSourceFile(file);
      const parsedSource = response?.data || response || {};
      item.text = parsedSource.text || '';
      item.status = item.text.trim() ? 'success' : 'error';
      item.error = item.status === 'error' ? '文档内容为空或无法读取' : '';
    } catch (error) {
      item.status = 'error';
      item.error = error?.response?.data?.message || error?.message || '后端解析失败';
    }
  }
  event.target.value = '';
};

const submit = () => {
  const parsedText = sourceFiles.value
    .filter(file => file.status === 'success')
    .map(file => `【${file.name}】\n${file.text}`)
    .join('\n\n');
  emit('generate', {
    requirements: props.modelValue,
    sourceText: parsedText || props.modelValue,
    pdfPaths: [],
    sourceFiles: sourceFiles.value
  });
};
</script>
```

Template must contain one AI welcome message, one textarea/input area, a multi-file `<input multiple>`, file cards with remove buttons, a generate button, and a stop button while submitting. Do not render history messages beyond current status.

- [ ] **Step 2: Replace generator page template**

In `AiKnowledgeGraphGenerator.vue`, remove `ResizableLayout`, `InputPanel`, and `ResultDisplay`. Use:

```vue
<KnowledgeGraphChatInput
  v-model="graphRequirements"
  :is-submitting="isSubmitting"
  :progress-text="generationProgressText"
  @generate="handleGenerate"
  @stop="handleStop"
/>
```

Keep header return button and `KnowledgeGraphManager` for course name loading.

- [ ] **Step 3: Route to preview after task creation**

In `AiKnowledgeGraphGenerator.vue`, make `handleGenerate` create the task and navigate:

```js
import { createKnowledgeGraphGenerationTask } from '@/api/graph';

const isSubmitting = ref(false);

const handleGenerate = async (payload) => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  generationProgressText.value = '正在创建知识图谱生成任务...';
  try {
    const response = await createKnowledgeGraphGenerationTask({
      courseId: props.courseId,
      courseName: courseName.value || `课程-${props.courseId}`,
      teacherRequirements: payload.requirements,
      sourceText: payload.sourceText,
      pdfPaths: payload.pdfPaths || [],
      graphType: '0'
    });
    const data = response?.data || response || {};
    const taskId = data.taskId || data.task?.taskId;
    if (!taskId) throw new Error('未获取到知识图谱任务ID');
    router.push(`/teacher/course/${props.courseId}/ai-knowledge-graph/preview/${taskId}`);
  } catch (error) {
    generationProgressText.value = error?.message || '创建知识图谱生成任务失败';
    alert(generationProgressText.value);
  } finally {
    isSubmitting.value = false;
  }
};
```

- [ ] **Step 4: Replace page CSS with single-column layout**

In `ai-knowledge-graph-generator.css`, remove dependence on `.content-container`, `.left-panel`, `.right-panel`, and `.resizer` for this page. Add:

```css
.ai-chat-shell {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: stretch;
  padding: 32px 20px;
  overflow: auto;
}

.kg-chat-card {
  width: min(100%, 980px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kg-chat-input {
  min-height: 132px;
  resize: vertical;
}

.kg-file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
```

- [ ] **Step 5: Verify entry page acceptance**

Run:

```powershell
cd "C:\Users\xuhuangbin\Desktop\aiforteach\HiProf"
npm run build
```

Manual check in browser:
- `/teacher/course/<courseId>/ai-knowledge-graph` has no `ResizableLayout` divider.
- no right result panel appears.
- text-only, file-only, and text+file all enable generate.

- [ ] **Step 6: Commit**

```powershell
git add "HiProf/src/teacher/features/course-detail/knowledgegraph/KnowledgeGraphChatInput.vue" "HiProf/src/teacher/pages/AiKnowledgeGraphGenerator.vue" "HiProf/src/teacher/styles/ai-knowledge-graph-generator.css"
git commit -m "feat: add chat-style knowledge graph entry"
```

## Task 3: 任务流 API 和后端 SSE 代理

**Files:**
- Modify: `HiProf/src/api/graph.js`
- Modify: `HiProf-master/hiprof-core/src/main/java/com/hiprof/core/controller/ZstpGraphController.java`
- Modify: `HiProf-master/hiprof-core/src/main/java/com/hiprof/core/service/IKnowledgeAgentService.java`
- Modify: `HiProf-master/hiprof-core/src/main/java/com/hiprof/core/service/impl/KnowledgeAgentServiceImpl.java`

- [ ] **Step 1: Add frontend stream URL helper**

In `graph.js`, add:

```js
export const getKnowledgeGraphGenerationTaskStreamUrl = (taskId) => {
  if (!taskId) {
    throw new Error('任务ID不能为空');
  }
  return `/core/zstp/agent/tasks/${encodeURIComponent(taskId)}/stream`;
};
```

- [ ] **Step 2: Add service interface method**

In `IKnowledgeAgentService.java`:

```java
void streamGenerationTask(String taskId, java.io.OutputStream outputStream);
```

- [ ] **Step 3: Add Spring controller stream endpoint**

In `ZstpGraphController.java`, import `MediaType`, `ResponseEntity`, and `StreamingResponseBody`. Add:

```java
@Operation(summary = "流式查询知识图谱生成任务")
@GetMapping(value = "/agent/tasks/{taskId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public ResponseEntity<StreamingResponseBody> streamGenerationTask(@PathVariable String taskId)
{
    StreamingResponseBody body = outputStream -> knowledgeAgentService.streamGenerationTask(taskId, outputStream);
    return ResponseEntity.ok()
            .contentType(MediaType.TEXT_EVENT_STREAM)
            .body(body);
}
```

- [ ] **Step 4: Proxy FastAPI SSE in service implementation**

In `KnowledgeAgentServiceImpl.java`, add:

```java
@Override
public void streamGenerationTask(String taskId, OutputStream outputStream)
{
    if (StringUtils.isBlank(taskId))
    {
        throw new ServiceException("任务ID不能为空");
    }
    HttpURLConnection connection = null;
    try
    {
        connection = (HttpURLConnection) new URL(buildTaskUrl(taskId) + "/stream").openConnection();
        connection.setRequestMethod(HttpMethod.GET.name());
        connection.setConnectTimeout(knowledgeAgentProperties.getConnectTimeout());
        connection.setReadTimeout(0);
        connection.setRequestProperty("Accept", "text/event-stream");
        int responseCode = connection.getResponseCode();
        if (responseCode < 200 || responseCode >= 300)
        {
            InputStream errorStream = connection.getErrorStream();
            String body = errorStream != null ? readBody(errorStream) : "无错误详情";
            throw new ServiceException("知识图谱任务流调用失败: " + responseCode + " " + body);
        }
        try (InputStream inputStream = connection.getInputStream())
        {
            inputStream.transferTo(outputStream);
            outputStream.flush();
        }
    }
    catch (IOException e)
    {
        throw new ServiceException("知识图谱任务流调用异常: " + e.getMessage());
    }
    finally
    {
        if (connection != null)
        {
            connection.disconnect();
        }
    }
}
```

- [ ] **Step 5: Verify backend compile**

Run:

```powershell
cd "C:\Users\xuhuangbin\Desktop\aiforteach\HiProf-master"
mvn -pl hiprof-admin -am -DskipTests package
```

Expected: Maven package succeeds.

- [ ] **Step 6: Commit**

```powershell
git add "HiProf/src/api/graph.js" "HiProf-master/hiprof-core/src/main/java/com/hiprof/core/controller/ZstpGraphController.java" "HiProf-master/hiprof-core/src/main/java/com/hiprof/core/service/IKnowledgeAgentService.java" "HiProf-master/hiprof-core/src/main/java/com/hiprof/core/service/impl/KnowledgeAgentServiceImpl.java"
git commit -m "feat: proxy knowledge graph generation stream"
```

## Task 4: 生成预览页和确认替换

**Files:**
- Create: `HiProf/src/teacher/pages/KnowledgeGraphGenerationPreview.vue`
- Create: `HiProf/src/teacher/features/course-detail/knowledgegraph/generationTaskGraphMapper.js`
- Modify: `HiProf/src/router/modules/teacher.js`
- Modify: `HiProf/src/teacher/features/course-detail/knowledgegraph/refactored/AiGenerationService.vue`

- [ ] **Step 1: Add preview route**

In `teacher.js`, add after `ai-knowledge-graph-generator`:

```js
{
  path: '/teacher/course/:courseId/ai-knowledge-graph/preview/:taskId',
  name: 'knowledge-graph-generation-preview',
  component: () => import('@/teacher/pages/KnowledgeGraphGenerationPreview.vue'),
  meta: { title: '知识图谱生成预览', requiresAuth: true, role: 'teacher' },
  props: true
}
```

- [ ] **Step 2: Create draft graph mapper**

Create `generationTaskGraphMapper.js`:

```js
import { applyRelationGraphNodeTextLayout } from '@/shared/features/graph/utils/nodeTextLayout.js';

const normalizeParentId = (value) => {
  if (value === null || value === undefined || value === '' || value === 0 || value === '0') return 'root';
  return String(value);
};

export const mapTaskResultToDraftGraph = (result, courseName = '课程知识图谱') => {
  const rawNodes = Array.isArray(result?.nodes) ? result.nodes : [];
  const rootNode = applyRelationGraphNodeTextLayout({
    id: 'draft-root',
    text: result?.graphTitle || courseName,
    color: 'rgba(245, 158, 11, 0.16)',
    borderColor: '#f59e0b',
    fontColor: '#111827',
    data: { content: result?.summary || '', category: 'draft-root' }
  });
  const nodes = rawNodes.map(node => applyRelationGraphNodeTextLayout({
    id: String(node.id),
    text: node.title || node.name || node.label || `节点${node.id}`,
    color: 'rgba(0, 206, 209, 0.1)',
    borderColor: 'rgba(0, 206, 209, 1)',
    fontColor: '#111827',
    data: { content: node.content || node.description || '', originalData: node }
  }));
  const nodeIdSet = new Set(nodes.map(node => String(node.id)));
  const links = rawNodes.map((node, index) => {
    const parentId = normalizeParentId(node.parentId);
    return {
      id: `draft_line_${index}`,
      from: parentId === 'root' || !nodeIdSet.has(parentId) ? 'draft-root' : parentId,
      to: String(node.id),
      text: ''
    };
  });
  return { rootId: 'draft-root', nodes: [rootNode, ...nodes], links };
};
```

- [ ] **Step 3: Create preview page**

`KnowledgeGraphGenerationPreview.vue` must:
- read `courseId` and `taskId` props;
- construct absolute URL for EventSource using `window.location.origin` or configured base URL;
- open `EventSource` with the absolute URL;
- update `taskDetail`, `draftGraph`, and stage text on `task`, `completed`, and `failed` events;
- close EventSource on unmount, completion, failure, cancel, and task switch;
- call `persistKnowledgeGraphGenerationTask(taskId)` only after user clicks confirm.

Core script:

```js
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import RelationGraph from 'relation-graph-vue3';
import {
  getKnowledgeGraphGenerationTask,
  getKnowledgeGraphGenerationTaskStreamUrl,
  persistKnowledgeGraphGenerationTask
} from '@/api/graph';
import { mapTaskResultToDraftGraph } from '@/teacher/features/course-detail/knowledgegraph/generationTaskGraphMapper.js';

const props = defineProps({ courseId: [String, Number], taskId: String });
const router = useRouter();
const graphRef = ref(null);
const taskDetail = ref(null);
const draftGraph = ref({ rootId: 'draft-root', nodes: [], links: [] });
const stream = ref(null);
const isPersisting = ref(false);
const errorMessage = ref('');

const canConfirm = computed(() => taskDetail.value?.status === 'completed' && draftGraph.value.nodes.length > 1);

const closeStream = () => {
  if (stream.value) {
    stream.value.close();
    stream.value = null;
  }
};

const applyTask = async (task) => {
  taskDetail.value = task;
  if (task?.result?.nodes?.length) {
    draftGraph.value = mapTaskResultToDraftGraph(task.result);
    await nextTick();
    await graphRef.value?.getInstance()?.setJsonData(draftGraph.value);
  }
};

const openStream = async () => {
  closeStream();
  const initial = await getKnowledgeGraphGenerationTask(props.taskId);
  await applyTask(initial?.data || initial);
  const streamPath = getKnowledgeGraphGenerationTaskStreamUrl(props.taskId);
  const streamUrl = streamPath.startsWith('http') ? streamPath : `${window.location.origin}${streamPath}`;
  stream.value = new EventSource(streamUrl);
  stream.value.addEventListener('task', event => applyTask(JSON.parse(event.data)));
  stream.value.addEventListener('completed', event => {
    applyTask(JSON.parse(event.data));
    closeStream();
  });
  stream.value.addEventListener('failed', event => {
    const task = JSON.parse(event.data);
    applyTask(task);
    errorMessage.value = task.error || task.message || '知识图谱生成失败';
    closeStream();
  });
  stream.value.onerror = () => {
    errorMessage.value = '任务流连接中断,请刷新页面恢复进度';
    closeStream();
  };
};

const confirmPersist = async () => {
  if (!canConfirm.value || isPersisting.value) return;
  isPersisting.value = true;
  try {
    await persistKnowledgeGraphGenerationTask(props.taskId);
    router.push(`/teacher/course/${props.courseId}`);
  } finally {
    isPersisting.value = false;
  }
};

onMounted(openStream);
onBeforeUnmount(closeStream);
```

- [ ] **Step 4: Remove auto-persist from `AiGenerationService.vue`**

Remove `persistKnowledgeGraphGenerationTask` import and the block that calls it inside `generateKnowledgeGraph`. When `pollGenerationTask` returns completed task, emit success with:

```js
emit('generation-success', {
  result: completedPreviewText,
  original: completedPreviewText,
  taskId: currentTaskId.value,
  graphId: '',
  taskResult: completedTask.result,
  taskDetail: completedTask,
  partial: false,
  autoPersisted: false
});
```

Set the progress message to `知识图谱内容已生成，等待确认替换当前图谱` instead of `正在保存到课程图谱`.

- [ ] **Step 5: Verify preview lifecycle**

Run:

```powershell
cd "C:\Users\xuhuangbin\Desktop\aiforteach\HiProf"
npm run build
```

Manual check:
- preview page starts from empty graph panel;
- `task.result.nodes` appears incrementally without persisting;
- refresh with same `taskId` restores current task result;
- confirm calls `/core/zstp/agent/tasks/{taskId}/persist`;
- failed task shows partial draft and no confirm button.

- [ ] **Step 6: Commit**

```powershell
git add "HiProf/src/teacher/pages/KnowledgeGraphGenerationPreview.vue" "HiProf/src/teacher/features/course-detail/knowledgegraph/generationTaskGraphMapper.js" "HiProf/src/router/modules/teacher.js" "HiProf/src/teacher/features/course-detail/knowledgegraph/refactored/AiGenerationService.vue"
git commit -m "feat: preview generated knowledge graph before persist"
```

## Task 5: 双向树左右展开

**Files:**
- Modify: `HiProf/src/teacher/features/course-detail/knowledgegraph/BidirectionalTreeLayoutComponent.vue`

- [ ] **Step 1: Replace tree auto-layout with fixed bidirectional coordinates**

In `BidirectionalTreeLayoutComponent.vue`, change `horizontalBidirectionalOptions.layout.layoutName` from `'tree'` to `'fixed'`. This is necessary because `relation-graph-vue3` does not automatically split tree branches to left and right sides. The `fixed` layout allows manual control of node positions via `x`, `y`, and `fixed` properties.

```ts
'layout': {
  'label': '水平双向树',
  'layoutName': 'fixed',
  'layoutDirection': 'h',
  'centerOffset_x': 0,
  'centerOffset_y': 0,
  'min_per_width': 260,
  'max_per_width': 420,
  'min_per_height': 80,
  'max_per_height': 140
}
```

**Note**: Using `fixed` layout requires manually calculating and assigning `x`, `y`, and `fixed: true` to each node. This approach gives full control over branch placement but requires more implementation work than automatic layouts.

- [ ] **Step 2: Add branch side assignment**

Before `renderBidirectionalTree(graphData)`, transform graph data:

```ts
const applyBidirectionalPositions = (graphData: any) => {
  const childrenByParent = new Map<string, any[]>();
  graphData.links.forEach((link: any) => {
    const key = String(link.from);
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key)!.push(graphData.nodes.find((node: any) => String(node.id) === String(link.to)));
  });
  const rootId = String(graphData.rootId);
  const root = graphData.nodes.find((node: any) => String(node.id) === rootId);
  if (root) {
    root.x = 0;
    root.y = 0;
    root.fixed = true;
  }
  const firstLevel = (childrenByParent.get(rootId) || []).filter(Boolean);
  firstLevel.forEach((node, index) => {
    const side = index % 2 === 0 ? 1 : -1;
    const branchIndex = Math.floor(index / 2);
    placeBranch(node, side, 1, branchIndex, childrenByParent);
  });
  return graphData;
};

const placeBranch = (node: any, side: number, depth: number, row: number, childrenByParent: Map<string, any[]>) => {
  node.x = side * depth * 320;
  node.y = (side === 1 ? row : -row - 1) * 110;
  node.fixed = true;
  node.data = { ...(node.data || {}), branchSide: side === 1 ? 'right' : 'left' };
  const children = (childrenByParent.get(String(node.id)) || []).filter(Boolean);
  children.forEach((child, index) => placeBranch(child, side, depth + 1, row + index, childrenByParent));
};
```

- [ ] **Step 3: Use branchSide for colors**

Replace `node.lot.level < 0` checks with:

```ts
if (node.data?.branchSide === 'left') {
  node.color = '#fecaca';
  node.borderColor = '#ef4444';
} else if (node.data?.branchSide === 'right') {
  node.color = '#bfdbfe';
  node.borderColor = '#3b82f6';
} else {
  node.color = '#fde68a';
  node.borderColor = '#f59e0b';
}
```

- [ ] **Step 4: Verify bidirectional acceptance**

Manual check with a graph containing at least four first-level branches:
- branch 1 and 3 appear on the right;
- branch 2 and 4 appear on the left;
- descendants stay on their parent branch side;
- zoom-to-fit shows both sides.

Run:

```powershell
cd "C:\Users\xuhuangbin\Desktop\aiforteach\HiProf"
npm run build
```

- [ ] **Step 5: Commit**

```powershell
git add "HiProf/src/teacher/features/course-detail/knowledgegraph/BidirectionalTreeLayoutComponent.vue"
git commit -m "fix: split bidirectional tree branches"
```

## Task 6: End-to-End Verification

**Files:**
- No code changes unless a verification failure identifies a defect in the files above.

- [ ] **Step 1: Frontend build**

```powershell
cd "C:\Users\xuhuangbin\Desktop\aiforteach\HiProf"
npm run build
```

Expected: Vite production build succeeds.

- [ ] **Step 2: Backend package**

```powershell
cd "C:\Users\xuhuangbin\Desktop\aiforteach\HiProf-master"
mvn -pl hiprof-admin -am -DskipTests package
```

Expected: Maven package succeeds.

- [ ] **Step 3: Manual browser checks**

Use a real course id:

```powershell
cd "C:\Users\xuhuangbin\Desktop\aiforteach"
.\start-knowledge-agent.bat
.\start-dev.bat
```

Check:
- `/teacher/course/<courseId>/ai-knowledge-graph` is single-column and has no right preview area.
- multiple supported files can be selected and parsed independently.
- task creation navigates to `/teacher/course/<courseId>/ai-knowledge-graph/preview/<taskId>`.
- preview page recovers after refresh using the same `taskId`.
- current course graph is unchanged until confirm.
- failed generation preserves partial draft and disables confirm.
- teacher tree and bidirectional-tree layouts clamp long labels to three lines.
- student embedded graph clamps long labels to three lines.

- [ ] **Step 4: Final commit**

```powershell
git status --short
git commit --allow-empty -m "test: verify knowledge graph generation flow"
```

Only use the empty commit if all earlier changes were already committed and this project wants a visible verification checkpoint.

## Self-Review

- Spec coverage: covered single-column entry, multi-file parsing, streaming preview, refresh recovery, no auto-persist, confirm replacement, failure handling, node text clamp, teacher/student coverage, and bidirectional left/right split.
- Placeholder scan: this plan contains no unfinished placeholder markers and no open-ended implementation instructions without target files.
- Type consistency: generated task uses `taskId`; draft rendering uses `result.nodes`; persistence remains `persistKnowledgeGraphGenerationTask(taskId)`; graph node sizing uses `width`/`height`/`innerHTML` fields verified in local dependency types.
