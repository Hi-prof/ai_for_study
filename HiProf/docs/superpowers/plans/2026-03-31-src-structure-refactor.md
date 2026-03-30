# Src Structure Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `src` so shared route pages, graph feature code, and teacher route/features have clear directory ownership without changing behavior.

**Architecture:** This refactor is structural only. Move route-entry files into `shared/pages` and `teacher/pages`, consolidate graph-related code under `shared/features/graph`, and move teacher business modules under `teacher/features` while preserving existing APIs, styles, and component internals. Keep alias imports stable and treat search queries plus the production build as the main regression harness.

**Tech Stack:** Vue 3, Vite, JavaScript, TypeScript, Vue Router, PowerShell, ripgrep

---

## File Structure Lock-In

**Create and use these directories in phase 1:**

- `src/shared/pages`
- `src/shared/pages/legacy`
- `src/shared/features/graph/pages`
- `src/shared/features/graph/components/graph`
- `src/shared/features/graph/components/outline`
- `src/shared/features/graph/utils`
- `src/teacher/pages`
- `src/teacher/features/home`
- `src/teacher/features/course-detail`
- `src/teacher/components`

**Keep these directories stable in phase 1:**

- `src/api`
- `src/utils`
- `src/styles`
- `src/ui/common`
- `src/ui/home`
- `src/ui/layouts`
- `src/ui/workspace`
- `src/teacher/styles`

### Task 1: Move Shared Route Pages And Clean Shared Router Imports

**Files:**
- Create: `src/shared/pages`
- Create: `src/shared/pages/legacy`
- Modify: `src/router/modules/shared.js`
- Move: `src/pages/AIAssistantPage.vue -> src/shared/pages/AIAssistantPage.vue`
- Move: `src/pages/ComingSoonPage.vue -> src/shared/pages/ComingSoonPage.vue`
- Move: `src/pages/LoginPage.vue -> src/shared/pages/LoginPage.vue`
- Move: `src/pages/RegisterPage.vue -> src/shared/pages/RegisterPage.vue`
- Move: `src/pages/ForgotPasswordPage.vue -> src/shared/pages/ForgotPasswordPage.vue`
- Move: `src/pages/ResetPasswordPage.vue -> src/shared/pages/ResetPasswordPage.vue`
- Move: `src/pages/MainHomePage.vue -> src/shared/pages/MainHomePage.vue`
- Move: `src/views/dev/DevTools.vue -> src/shared/pages/DevTools.vue`
- Move: `src/pages/KnowledgeGraphHomePage.vue -> src/shared/pages/legacy/KnowledgeGraphHomePage.vue`
- Modify: `src/shared/pages/ComingSoonPage.vue`
- Modify: `src/shared/pages/LoginPage.vue`
- Modify: `src/shared/pages/MainHomePage.vue`
- Modify: `src/shared/pages/legacy/KnowledgeGraphHomePage.vue`

- [ ] **Step 1: Capture the failing baseline for old shared page imports**

Run:

```powershell
rg -n "@/pages/MainHomePage|@/pages/AIAssistantPage|@/pages/ComingSoonPage|@/pages/LoginPage|@/pages/RegisterPage|@/pages/ForgotPasswordPage|@/pages/ResetPasswordPage|@/views/dev/DevTools" src/router/modules/shared.js
rg -n "@import '../assets/styles/glassmorphism.css'" src/pages/MainHomePage.vue src/pages/ComingSoonPage.vue src/pages/LoginPage.vue src/pages/KnowledgeGraphHomePage.vue
```

Expected: both commands return matches proving the old shared page paths and relative style imports still exist.

- [ ] **Step 2: Create the shared page directories and move the files**

Run:

```powershell
New-Item -ItemType Directory -Force -Path 'src/shared/pages'
New-Item -ItemType Directory -Force -Path 'src/shared/pages/legacy'
Move-Item -LiteralPath 'src/pages/AIAssistantPage.vue' -Destination 'src/shared/pages/AIAssistantPage.vue'
Move-Item -LiteralPath 'src/pages/ComingSoonPage.vue' -Destination 'src/shared/pages/ComingSoonPage.vue'
Move-Item -LiteralPath 'src/pages/LoginPage.vue' -Destination 'src/shared/pages/LoginPage.vue'
Move-Item -LiteralPath 'src/pages/RegisterPage.vue' -Destination 'src/shared/pages/RegisterPage.vue'
Move-Item -LiteralPath 'src/pages/ForgotPasswordPage.vue' -Destination 'src/shared/pages/ForgotPasswordPage.vue'
Move-Item -LiteralPath 'src/pages/ResetPasswordPage.vue' -Destination 'src/shared/pages/ResetPasswordPage.vue'
Move-Item -LiteralPath 'src/pages/MainHomePage.vue' -Destination 'src/shared/pages/MainHomePage.vue'
Move-Item -LiteralPath 'src/views/dev/DevTools.vue' -Destination 'src/shared/pages/DevTools.vue'
Move-Item -LiteralPath 'src/pages/KnowledgeGraphHomePage.vue' -Destination 'src/shared/pages/legacy/KnowledgeGraphHomePage.vue'
```

- [ ] **Step 3: Update the shared router to point the non-graph routes at `shared/pages`**

Update `src/router/modules/shared.js` to this import path layout:

```javascript
export const sharedRoutes = [
  { path: '/', name: 'home', component: () => import('@/shared/pages/MainHomePage.vue'), meta: { title: 'Hi Prof 智能教育平台' } },
  { path: '/ai-assistant', name: 'ai-assistant', component: () => import('@/shared/pages/AIAssistantPage.vue'), meta: { title: 'AI智能助手' } },
  { path: '/outline/:graphId', name: 'outline', component: () => import('@/pages/GraphPage/OutlinePage.vue'), meta: { title: '知识图谱大纲', requiresAuth: true } },
  { path: '/outline-edit/:id', name: 'outline-edit', component: () => import('@/pages/GraphPage/OutlinePage.vue'), meta: { title: '编辑知识图谱大纲', requiresAuth: true, isEditMode: true } },
  { path: '/graph', name: 'graph', component: () => import('@/pages/GraphPage/index.vue'), meta: { title: '知识图谱' } },
  { path: '/graph/:id', name: 'course-graph', component: () => import('@/pages/GraphPage/index.vue'), meta: { title: '课程知识图谱' } },
  { path: '/test/session-api', name: 'session-api-test', component: () => import('@/shared/pages/ComingSoonPage.vue'), meta: { title: '会话API测试' } },
  { path: '/login', name: 'login', component: () => import('@/shared/pages/LoginPage.vue'), meta: { title: '登录', hideForAuth: true } },
  { path: '/register', name: 'register', component: () => import('@/shared/pages/RegisterPage.vue'), meta: { title: '注册', hideForAuth: true } },
  { path: '/forgot-password', name: 'forgot-password', component: () => import('@/shared/pages/ForgotPasswordPage.vue'), meta: { title: '找回密码', hideForAuth: true } },
  { path: '/reset-password', name: 'reset-password', component: () => import('@/shared/pages/ResetPasswordPage.vue'), meta: { title: '重置密码', hideForAuth: true } },
  { path: '/dev-tools', name: 'dev-tools', component: () => import('@/shared/pages/DevTools.vue'), meta: { title: '开发工具' } }
];

export const fallbackRoutes = [
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/shared/pages/MainHomePage.vue'), meta: { title: '页面未找到' } }
];
```

- [ ] **Step 4: Replace fragile relative glassmorphism style imports with alias imports**

In these files, replace the same line:

```css
@import '../assets/styles/glassmorphism.css';
```

with:

```css
@import '@/assets/styles/glassmorphism.css';
```

Apply that change to:

- `src/shared/pages/MainHomePage.vue`
- `src/shared/pages/ComingSoonPage.vue`
- `src/shared/pages/LoginPage.vue`
- `src/shared/pages/legacy/KnowledgeGraphHomePage.vue`

- [ ] **Step 5: Verify the non-graph shared routes no longer point at legacy page locations**

Run:

```powershell
rg -n "@/pages/MainHomePage|@/pages/AIAssistantPage|@/pages/ComingSoonPage|@/pages/LoginPage|@/pages/RegisterPage|@/pages/ForgotPasswordPage|@/pages/ResetPasswordPage|@/views/dev" src/router/modules/shared.js
rg -n "@import '../assets/styles/glassmorphism.css'" src/shared/pages src/shared/pages/legacy
```

Expected: both commands return no matches.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/router/modules/shared.js src/shared/pages
git commit -m "refactor: move shared route pages into shared directory"
```

### Task 2: Consolidate Graph And Outline Code Under Shared Feature Graph

**Files:**
- Create: `src/shared/features/graph/pages`
- Create: `src/shared/features/graph/components/graph`
- Create: `src/shared/features/graph/components/outline`
- Create: `src/shared/features/graph/utils`
- Move: `src/pages/GraphPage/index.vue -> src/shared/features/graph/pages/index.vue`
- Move: `src/pages/GraphPage/OutlinePage.vue -> src/shared/features/graph/pages/OutlinePage.vue`
- Move: `src/pages/GraphPage/GraphView.vue -> src/shared/features/graph/components/graph/GraphView.vue`
- Move: `src/pages/GraphPage/CourseList.vue -> src/shared/features/graph/components/graph/CourseList.vue`
- Move: `src/ui/graph/GraphList.vue -> src/shared/features/graph/components/graph/GraphList.vue`
- Move: `src/ui/graph/NodeContextMenu.vue -> src/shared/features/graph/components/graph/NodeContextMenu.vue`
- Move: `src/ui/graph/NodeDetailPanel.vue -> src/shared/features/graph/components/graph/NodeDetailPanel.vue`
- Move: `src/ui/graph/NodeEditDialog.vue -> src/shared/features/graph/components/graph/NodeEditDialog.vue`
- Move: `src/ui/outline/CourseSelector.vue -> src/shared/features/graph/components/outline/CourseSelector.vue`
- Move: `src/ui/outline/NodeEditDialog.vue -> src/shared/features/graph/components/outline/NodeEditDialog.vue`
- Move: `src/ui/outline/NodeTableRow.vue -> src/shared/features/graph/components/outline/NodeTableRow.vue`
- Move: `src/ui/outline/NodeTreeView.vue -> src/shared/features/graph/components/outline/NodeTreeView.vue`
- Move: `src/ui/outline/OutlineEditor.vue -> src/shared/features/graph/components/outline/OutlineEditor.vue`
- Move: `src/ui/outline/OutlineImport.vue -> src/shared/features/graph/components/outline/OutlineImport.vue`
- Move: `src/ui/outline/OutlineList.vue -> src/shared/features/graph/components/outline/OutlineList.vue`
- Move: `src/ui/outline/OutlineNode.vue -> src/shared/features/graph/components/outline/OutlineNode.vue`
- Move: `src/ui/outline/OutlineNodeItem.vue -> src/shared/features/graph/components/outline/OutlineNodeItem.vue`
- Move: `src/ui/outline/OutlineToolbar.vue -> src/shared/features/graph/components/outline/OutlineToolbar.vue`
- Move: `src/ui/outline/OutlineTree.vue -> src/shared/features/graph/components/outline/OutlineTree.vue`
- Move: `src/pages/GraphPage/graphConfig.js -> src/shared/features/graph/utils/graphConfig.js`
- Move: `src/pages/GraphPage/graphUtils.js -> src/shared/features/graph/utils/graphUtils.js`
- Modify: `src/shared/features/graph/pages/index.vue`
- Modify: `src/shared/features/graph/pages/OutlinePage.vue`
- Modify: `src/shared/features/graph/components/graph/CourseList.vue`
- Modify: `src/shared/features/graph/components/graph/GraphView.vue`
- Modify: every file returned by `rg -l "@/ui/graph|@/ui/outline|@/pages/GraphPage" src`

- [ ] **Step 1: Capture the failing baseline for old graph paths and relative graph imports**

Run:

```powershell
rg -n "@/pages/GraphPage|@/ui/graph|@/ui/outline" src
rg -n "../../api/graph|../../api/node|./graphConfig.js|./graphUtils.js|../../styles/pages/GraphPage.css" src/pages/GraphPage
```

Expected: both commands return matches proving the graph feature still uses old directories and fragile relative imports.

- [ ] **Step 2: Create the graph feature directories and move the graph files**

Run:

```powershell
New-Item -ItemType Directory -Force -Path 'src/shared/features/graph/pages'
New-Item -ItemType Directory -Force -Path 'src/shared/features/graph/components/graph'
New-Item -ItemType Directory -Force -Path 'src/shared/features/graph/components/outline'
New-Item -ItemType Directory -Force -Path 'src/shared/features/graph/utils'
Move-Item -LiteralPath 'src/pages/GraphPage/index.vue' -Destination 'src/shared/features/graph/pages/index.vue'
Move-Item -LiteralPath 'src/pages/GraphPage/OutlinePage.vue' -Destination 'src/shared/features/graph/pages/OutlinePage.vue'
Move-Item -LiteralPath 'src/pages/GraphPage/GraphView.vue' -Destination 'src/shared/features/graph/components/graph/GraphView.vue'
Move-Item -LiteralPath 'src/pages/GraphPage/CourseList.vue' -Destination 'src/shared/features/graph/components/graph/CourseList.vue'
Move-Item -LiteralPath 'src/ui/graph/GraphList.vue' -Destination 'src/shared/features/graph/components/graph/GraphList.vue'
Move-Item -LiteralPath 'src/ui/graph/NodeContextMenu.vue' -Destination 'src/shared/features/graph/components/graph/NodeContextMenu.vue'
Move-Item -LiteralPath 'src/ui/graph/NodeDetailPanel.vue' -Destination 'src/shared/features/graph/components/graph/NodeDetailPanel.vue'
Move-Item -LiteralPath 'src/ui/graph/NodeEditDialog.vue' -Destination 'src/shared/features/graph/components/graph/NodeEditDialog.vue'
Move-Item -LiteralPath 'src/ui/outline/CourseSelector.vue' -Destination 'src/shared/features/graph/components/outline/CourseSelector.vue'
Move-Item -LiteralPath 'src/ui/outline/NodeEditDialog.vue' -Destination 'src/shared/features/graph/components/outline/NodeEditDialog.vue'
Move-Item -LiteralPath 'src/ui/outline/NodeTableRow.vue' -Destination 'src/shared/features/graph/components/outline/NodeTableRow.vue'
Move-Item -LiteralPath 'src/ui/outline/NodeTreeView.vue' -Destination 'src/shared/features/graph/components/outline/NodeTreeView.vue'
Move-Item -LiteralPath 'src/ui/outline/OutlineEditor.vue' -Destination 'src/shared/features/graph/components/outline/OutlineEditor.vue'
Move-Item -LiteralPath 'src/ui/outline/OutlineImport.vue' -Destination 'src/shared/features/graph/components/outline/OutlineImport.vue'
Move-Item -LiteralPath 'src/ui/outline/OutlineList.vue' -Destination 'src/shared/features/graph/components/outline/OutlineList.vue'
Move-Item -LiteralPath 'src/ui/outline/OutlineNode.vue' -Destination 'src/shared/features/graph/components/outline/OutlineNode.vue'
Move-Item -LiteralPath 'src/ui/outline/OutlineNodeItem.vue' -Destination 'src/shared/features/graph/components/outline/OutlineNodeItem.vue'
Move-Item -LiteralPath 'src/ui/outline/OutlineToolbar.vue' -Destination 'src/shared/features/graph/components/outline/OutlineToolbar.vue'
Move-Item -LiteralPath 'src/ui/outline/OutlineTree.vue' -Destination 'src/shared/features/graph/components/outline/OutlineTree.vue'
Move-Item -LiteralPath 'src/pages/GraphPage/graphConfig.js' -Destination 'src/shared/features/graph/utils/graphConfig.js'
Move-Item -LiteralPath 'src/pages/GraphPage/graphUtils.js' -Destination 'src/shared/features/graph/utils/graphUtils.js'
```

- [ ] **Step 3: Patch the moved graph page imports to use aliases and the new split component folders**

Update `src/shared/features/graph/pages/index.vue` imports to:

```javascript
import CourseList from '@/shared/features/graph/components/graph/CourseList.vue';
import GraphView from '@/shared/features/graph/components/graph/GraphView.vue';
import '@/styles/pages/GraphPage.css';
```

Update `src/shared/features/graph/pages/OutlinePage.vue` imports to:

```javascript
import OutlineToolbar from '@/shared/features/graph/components/outline/OutlineToolbar.vue';
import OutlineList from '@/shared/features/graph/components/outline/OutlineList.vue';
import NodeTreeView from '@/shared/features/graph/components/outline/NodeTreeView.vue';
import NodeEditDialog from '@/shared/features/graph/components/outline/NodeEditDialog.vue';
```

Update `src/shared/features/graph/components/graph/CourseList.vue` to:

```javascript
import { getKnowledgeGraphList } from '@/api/graph';
```

Update `src/shared/features/graph/components/graph/GraphView.vue` to:

```javascript
import { getKnowledgeGraphNodes, getNodeLines, getNodeStyle, getNodeDetail, updateNode as updateNodeApi } from '@/api/node';
import { graphOptions, getCategoryName } from '@/shared/features/graph/utils/graphConfig.js';
import { processNodeData, processLineData, buildGraphData } from '@/shared/features/graph/utils/graphUtils.js';
```

- [ ] **Step 4: Update every external consumer and shared graph route to the new graph feature aliases**

Search:

```powershell
rg -l "@/ui/graph|@/ui/outline|@/pages/GraphPage" src
```

For each returned file, replace old imports with the new feature aliases. These are the minimum required replacements:

```javascript
import NodeDetailPanel from '@/shared/features/graph/components/graph/NodeDetailPanel.vue';
import GraphList from '@/shared/features/graph/components/graph/GraphList.vue';
import OutlineList from '@/shared/features/graph/components/outline/OutlineList.vue';
import NodeTreeView from '@/shared/features/graph/components/outline/NodeTreeView.vue';
import NodeEditDialog from '@/shared/features/graph/components/outline/NodeEditDialog.vue';
```

Also patch the graph routes in `src/router/modules/shared.js` to:

```javascript
{ path: '/outline/:graphId', name: 'outline', component: () => import('@/shared/features/graph/pages/OutlinePage.vue'), meta: { title: '知识图谱大纲', requiresAuth: true } },
{ path: '/outline-edit/:id', name: 'outline-edit', component: () => import('@/shared/features/graph/pages/OutlinePage.vue'), meta: { title: '编辑知识图谱大纲', requiresAuth: true, isEditMode: true } },
{ path: '/graph', name: 'graph', component: () => import('@/shared/features/graph/pages/index.vue'), meta: { title: '知识图谱' } },
{ path: '/graph/:id', name: 'course-graph', component: () => import('@/shared/features/graph/pages/index.vue'), meta: { title: '课程知识图谱' } },
```

- [ ] **Step 5: Verify the graph feature has no stale directory imports and still builds**

Run:

```powershell
rg -n "@/pages/GraphPage|@/ui/graph|@/ui/outline" src
npm run build
```

Expected: the `rg` command returns no matches, and the Vite build finishes successfully.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/shared/features/graph src/router/modules/shared.js src/styles/pages/GraphPage.css src/ui/my src/teacher src/shared/pages
git commit -m "refactor: group graph and outline code under shared feature"
```

### Task 3: Extract Teacher Home Modules Into Teacher Features And Components

**Files:**
- Create: `src/teacher/features/home`
- Create: `src/teacher/components`
- Move: `src/teacher/components/modules/TeacherAIAssistant.vue -> src/teacher/features/home/TeacherAIAssistant.vue`
- Move: `src/teacher/components/modules/TeacherCourses.vue -> src/teacher/features/home/TeacherCourses.vue`
- Move: `src/teacher/components/modules/TeacherSettings.vue -> src/teacher/features/home/TeacherSettings.vue`
- Move: `src/teacher/components/modules/TeacherHomeworkDiscussion.vue -> src/teacher/features/home/TeacherHomeworkDiscussion.vue`
- Move: `src/teacher/components/modules/TeacherCourseCard.vue -> src/teacher/components/TeacherCourseCard.vue`
- Modify: `src/teacher/home/TeacherHomePage.vue`
- Modify: `src/teacher/features/home/TeacherCourses.vue`

- [ ] **Step 1: Capture the failing baseline for teacher home modules still living under components/modules**

Run:

```powershell
rg -n "@/teacher/components/modules/TeacherAIAssistant|@/teacher/components/modules/TeacherCourses|@/teacher/components/modules/TeacherSettings|@/teacher/components/modules/TeacherCourseCard" src/teacher
```

Expected: matches exist in `TeacherHomePage.vue`, `TeacherCourses.vue`, or related files.

- [ ] **Step 2: Create the teacher home feature directories and move the files**

Run:

```powershell
New-Item -ItemType Directory -Force -Path 'src/teacher/features/home'
New-Item -ItemType Directory -Force -Path 'src/teacher/components'
Move-Item -LiteralPath 'src/teacher/components/modules/TeacherAIAssistant.vue' -Destination 'src/teacher/features/home/TeacherAIAssistant.vue'
Move-Item -LiteralPath 'src/teacher/components/modules/TeacherCourses.vue' -Destination 'src/teacher/features/home/TeacherCourses.vue'
Move-Item -LiteralPath 'src/teacher/components/modules/TeacherSettings.vue' -Destination 'src/teacher/features/home/TeacherSettings.vue'
Move-Item -LiteralPath 'src/teacher/components/modules/TeacherHomeworkDiscussion.vue' -Destination 'src/teacher/features/home/TeacherHomeworkDiscussion.vue'
Move-Item -LiteralPath 'src/teacher/components/modules/TeacherCourseCard.vue' -Destination 'src/teacher/components/TeacherCourseCard.vue'
```

- [ ] **Step 3: Update `TeacherHomePage.vue` to compose teacher home features from their new locations**

In `src/teacher/home/TeacherHomePage.vue`, replace the top-level feature imports with:

```javascript
import TeacherAIAssistant from '@/teacher/features/home/TeacherAIAssistant.vue';
import TeacherCourses from '@/teacher/features/home/TeacherCourses.vue';
import TeacherSettings from '@/teacher/features/home/TeacherSettings.vue';
```

- [ ] **Step 4: Update `TeacherCourses.vue` to use the new teacher component location**

In `src/teacher/features/home/TeacherCourses.vue`, replace:

```javascript
import TeacherCourseCard from '@/teacher/components/modules/TeacherCourseCard.vue';
```

with:

```javascript
import TeacherCourseCard from '@/teacher/components/TeacherCourseCard.vue';
```

- [ ] **Step 5: Verify the old teacher home module paths are gone**

Run:

```powershell
rg -n "@/teacher/components/modules/TeacherAIAssistant|@/teacher/components/modules/TeacherCourses|@/teacher/components/modules/TeacherSettings|@/teacher/components/modules/TeacherCourseCard" src/teacher
```

Expected: no matches.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/teacher/home/TeacherHomePage.vue src/teacher/features/home src/teacher/components
git commit -m "refactor: separate teacher home features from components modules"
```

### Task 4: Move Teacher Course Detail Tree Into Teacher Features

**Files:**
- Create: `src/teacher/features/course-detail`
- Move directory contents: `src/teacher/components/modules/TeacherCourseDetail/* -> src/teacher/features/course-detail/*`
- Modify: `src/teacher/course/TeacherCoursePage.vue`
- Modify: every file returned by `rg -l "@/teacher/components/modules/TeacherCourseDetail" src/teacher`

- [ ] **Step 1: Capture the failing baseline for course detail imports**

Run:

```powershell
rg -n "@/teacher/components/modules/TeacherCourseDetail" src/teacher
```

Expected: matches exist in `TeacherCoursePage.vue` and any other teacher files still pointing at the old directory.

- [ ] **Step 2: Create the teacher course-detail feature root and move the current tree into it**

Run:

```powershell
New-Item -ItemType Directory -Force -Path 'src/teacher/features/course-detail'
Get-ChildItem -LiteralPath 'src/teacher/components/modules/TeacherCourseDetail' | Move-Item -Destination 'src/teacher/features/course-detail'
```

- [ ] **Step 3: Update `TeacherCoursePage.vue` to compose course-detail features from the new feature tree**

Replace the course-detail imports in `src/teacher/course/TeacherCoursePage.vue` with:

```javascript
import CourseChapters from '@/teacher/features/course-detail/chapter/CourseChapters.vue';
import CourseKnowledgeGraph from '@/teacher/features/course-detail/knowledgegraph/CourseKnowledgeGraph.vue';
import CourseHomework from '@/teacher/features/course-detail/homework/CourseHomework.vue';
import CourseDiscussion from '@/teacher/features/course-detail/discussion/CourseDiscussion.vue';
import CourseMaterials from '@/teacher/features/course-detail/CourseMaterials.vue';
import CourseAnalytics from '@/teacher/features/course-detail/learning-analysis/WCourseAnalytics.vue';
```

- [ ] **Step 4: Update every remaining direct import of the old `TeacherCourseDetail` path**

Search:

```powershell
rg -l "@/teacher/components/modules/TeacherCourseDetail" src/teacher
```

For each returned file, replace `@/teacher/components/modules/TeacherCourseDetail/...` with `@/teacher/features/course-detail/...`.

Use this exact replacement pattern:

```text
@/teacher/components/modules/TeacherCourseDetail/chapter/... -> @/teacher/features/course-detail/chapter/...
@/teacher/components/modules/TeacherCourseDetail/discussion/... -> @/teacher/features/course-detail/discussion/...
@/teacher/components/modules/TeacherCourseDetail/homework/... -> @/teacher/features/course-detail/homework/...
@/teacher/components/modules/TeacherCourseDetail/knowledgegraph/... -> @/teacher/features/course-detail/knowledgegraph/...
@/teacher/components/modules/TeacherCourseDetail/learning-analysis/... -> @/teacher/features/course-detail/learning-analysis/...
@/teacher/components/modules/TeacherCourseDetail/lessonplan/... -> @/teacher/features/course-detail/lessonplan/...
@/teacher/components/modules/TeacherCourseDetail/materials/... -> @/teacher/features/course-detail/materials/...
@/teacher/components/modules/TeacherCourseDetail/textparser/... -> @/teacher/features/course-detail/textparser/...
```

- [ ] **Step 5: Verify the old course detail directory is no longer imported**

Run:

```powershell
rg -n "@/teacher/components/modules/TeacherCourseDetail" src/teacher
```

Expected: no matches.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/teacher/course/TeacherCoursePage.vue src/teacher/features/course-detail src/teacher/components/modules
git commit -m "refactor: move teacher course detail modules into feature tree"
```

### Task 5: Relocate Teacher Route Pages Into Teacher Pages And Lock The Router Boundary

**Files:**
- Move: `src/teacher/home/TeacherHomePage.vue -> src/teacher/pages/TeacherHomePage.vue`
- Move: `src/teacher/course/TeacherCoursePage.vue -> src/teacher/pages/TeacherCoursePage.vue`
- Move: `src/teacher/components/modules/TeacherMyLessons.vue -> src/teacher/pages/TeacherMyLessons.vue`
- Move: `src/teacher/features/course-detail/chapter/AiChapterGenerator.vue -> src/teacher/pages/AiChapterGenerator.vue`
- Move: `src/teacher/features/course-detail/chapter/chapter-learning/ChapterLearningPage.vue -> src/teacher/pages/ChapterLearningPage.vue`
- Move: `src/teacher/features/course-detail/knowledgegraph/refactored/AiKnowledgeGraphGenerator.vue -> src/teacher/pages/AiKnowledgeGraphGenerator.vue`
- Move: `src/teacher/features/course-detail/lessonplan/AiLessonPlanGenerator.vue -> src/teacher/pages/AiLessonPlanGenerator.vue`
- Move: `src/teacher/features/course-detail/homework/HomeworkSubmissions.vue -> src/teacher/pages/HomeworkSubmissions.vue`
- Move: `src/teacher/features/course-detail/discussion/DiscussionDetail.vue -> src/teacher/pages/DiscussionDetail.vue`
- Move: `src/teacher/features/course-detail/textparser/TextNodeParserTest.vue -> src/teacher/pages/TextNodeParserTest.vue`
- Modify: `src/router/modules/teacher.js`
- Modify: `src/teacher/pages/TeacherHomePage.vue`
- Modify: `src/teacher/pages/TeacherCoursePage.vue`
- Modify: `src/teacher/pages/ChapterLearningPage.vue`
- Modify: `src/teacher/pages/AiKnowledgeGraphGenerator.vue`
- Modify: `src/teacher/pages/HomeworkSubmissions.vue`
- Modify: `src/teacher/pages/DiscussionDetail.vue`
- Modify: `src/teacher/pages/TextNodeParserTest.vue`

- [ ] **Step 1: Capture the failing baseline for route pages still imported from mixed teacher directories**

Run:

```powershell
rg -n "@/teacher/home/|@/teacher/course/|@/teacher/components/modules/|@/teacher/features/" src/router/modules/teacher.js
```

Expected: matches exist because the teacher router still imports from mixed locations instead of only `teacher/pages`.

- [ ] **Step 2: Move all teacher route-entry pages into `src/teacher/pages`**

Run:

```powershell
Move-Item -LiteralPath 'src/teacher/home/TeacherHomePage.vue' -Destination 'src/teacher/pages/TeacherHomePage.vue'
Move-Item -LiteralPath 'src/teacher/course/TeacherCoursePage.vue' -Destination 'src/teacher/pages/TeacherCoursePage.vue'
Move-Item -LiteralPath 'src/teacher/components/modules/TeacherMyLessons.vue' -Destination 'src/teacher/pages/TeacherMyLessons.vue'
Move-Item -LiteralPath 'src/teacher/features/course-detail/chapter/AiChapterGenerator.vue' -Destination 'src/teacher/pages/AiChapterGenerator.vue'
Move-Item -LiteralPath 'src/teacher/features/course-detail/chapter/chapter-learning/ChapterLearningPage.vue' -Destination 'src/teacher/pages/ChapterLearningPage.vue'
Move-Item -LiteralPath 'src/teacher/features/course-detail/knowledgegraph/refactored/AiKnowledgeGraphGenerator.vue' -Destination 'src/teacher/pages/AiKnowledgeGraphGenerator.vue'
Move-Item -LiteralPath 'src/teacher/features/course-detail/lessonplan/AiLessonPlanGenerator.vue' -Destination 'src/teacher/pages/AiLessonPlanGenerator.vue'
Move-Item -LiteralPath 'src/teacher/features/course-detail/homework/HomeworkSubmissions.vue' -Destination 'src/teacher/pages/HomeworkSubmissions.vue'
Move-Item -LiteralPath 'src/teacher/features/course-detail/discussion/DiscussionDetail.vue' -Destination 'src/teacher/pages/DiscussionDetail.vue'
Move-Item -LiteralPath 'src/teacher/features/course-detail/textparser/TextNodeParserTest.vue' -Destination 'src/teacher/pages/TextNodeParserTest.vue'
```

- [ ] **Step 3: Update the moved route pages so their local feature dependencies use aliases instead of broken relative imports**

Use these exact replacements:

In `src/teacher/pages/TeacherHomePage.vue`:

```javascript
import TeacherAIAssistant from '@/teacher/features/home/TeacherAIAssistant.vue';
import TeacherCourses from '@/teacher/features/home/TeacherCourses.vue';
import TeacherSettings from '@/teacher/features/home/TeacherSettings.vue';
```

In `src/teacher/pages/TeacherCoursePage.vue`:

```javascript
import CourseChapters from '@/teacher/features/course-detail/chapter/CourseChapters.vue';
import CourseKnowledgeGraph from '@/teacher/features/course-detail/knowledgegraph/CourseKnowledgeGraph.vue';
import CourseHomework from '@/teacher/features/course-detail/homework/CourseHomework.vue';
import CourseDiscussion from '@/teacher/features/course-detail/discussion/CourseDiscussion.vue';
import CourseMaterials from '@/teacher/features/course-detail/CourseMaterials.vue';
import CourseAnalytics from '@/teacher/features/course-detail/learning-analysis/WCourseAnalytics.vue';
```

In `src/teacher/pages/ChapterLearningPage.vue`:

```javascript
import ChapterFileList from '@/teacher/features/course-detail/chapter/ChapterFileList.vue';
```

In `src/teacher/pages/AiKnowledgeGraphGenerator.vue`:

```javascript
import InputPanel from '@/teacher/features/course-detail/knowledgegraph/InputPanel.vue';
import ResultDisplay from '@/teacher/features/course-detail/knowledgegraph/ResultDisplay.vue';
import ResizableLayout from '@/teacher/features/course-detail/knowledgegraph/ResizableLayout.vue';
import AiGenerationService from '@/teacher/features/course-detail/knowledgegraph/refactored/AiGenerationService.vue';
import KnowledgeGraphManager from '@/teacher/features/course-detail/knowledgegraph/refactored/KnowledgeGraphManager.vue';
```

In `src/teacher/pages/HomeworkSubmissions.vue`:

```javascript
import GradingDialog from '@/teacher/features/course-detail/homework/GradingDialog.vue';
```

In `src/teacher/pages/DiscussionDetail.vue`:

```javascript
import ChatDiscussion from '@/teacher/features/course-detail/discussion/ChatDiscussion.vue';
```

In `src/teacher/pages/TextNodeParserTest.vue`:

```javascript
import TextNodeParser from '@/teacher/features/course-detail/textparser/TextNodeParser.vue';
```

- [ ] **Step 4: Rewrite the teacher router so it imports route targets only from `teacher/pages`**

Update `src/router/modules/teacher.js` to this path pattern:

```javascript
import TeacherCoursePage from '@/teacher/pages/TeacherCoursePage.vue';

export const teacherRoutes = [
  {
    path: '/teacher',
    name: 'teacher',
    component: () => import('@/teacher/layouts/TeacherLayout.vue'),
    meta: { title: '教师教学助手', requiresAuth: true, role: 'teacher' },
    children: [{ path: '', redirect: '/teacher/my' }]
  },
  {
    path: '/teacher/my',
    name: 'teacher-my',
    component: () => import('@/teacher/pages/TeacherHomePage.vue'),
    meta: { title: '教师个人中心', requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/my-lessons',
    name: 'teacher-my-lessons',
    component: () => import('@/teacher/pages/TeacherMyLessons.vue'),
    meta: { title: '我的教案', requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/class/:id',
    name: 'teacher-class-detail',
    component: () => import('@/teacher/pages/TeacherHomePage.vue'),
    meta: { title: '班级详情', requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/course/:courseId',
    name: 'teacher-course-detail',
    component: TeacherCoursePage,
    meta: { title: '课程详情', requiresAuth: true, role: 'teacher' },
    props: true
  },
  {
    path: '/teacher/course/:courseId/ai-chapter-generator',
    name: 'ai-chapter-generator',
    component: () => import('@/teacher/pages/AiChapterGenerator.vue'),
    meta: { title: 'AI智能生成章节', requiresAuth: true, role: 'teacher' },
    props: true
  },
  {
    path: '/teacher/course/:courseId/chapter-learning/:chapterId?',
    name: 'teacher-chapter-learning',
    component: () => import('@/teacher/pages/ChapterLearningPage.vue'),
    meta: { title: '章节学习', requiresAuth: true, role: 'teacher' },
    props: true
  },
  {
    path: '/teacher/course/:courseId/ai-knowledge-graph',
    name: 'ai-knowledge-graph-generator',
    component: () => import('@/teacher/pages/AiKnowledgeGraphGenerator.vue'),
    meta: { title: 'AI生成知识图谱', requiresAuth: true, role: 'teacher' },
    props: true
  },
  {
    path: '/teacher/course/:courseId/ai-lesson-plan-generator',
    name: 'ai-lesson-plan-generator',
    component: () => import('@/teacher/pages/AiLessonPlanGenerator.vue'),
    meta: { title: 'AI智能生成教案', requiresAuth: true, role: 'teacher' },
    props: true
  },
  {
    path: '/teacher/course/:courseId/homework-grading',
    name: 'homework-grading',
    component: () => import('@/teacher/pages/HomeworkGradingPage.vue'),
    meta: { title: '作业批改', requiresAuth: true, role: 'teacher' },
    props: true
  },
  {
    path: '/teacher/course/:courseId/homework/:homeworkId/submissions',
    name: 'HomeworkSubmissions',
    component: () => import('@/teacher/pages/HomeworkSubmissions.vue'),
    meta: { title: '作业提交记录', requiresAuth: true, role: 'teacher' },
    props: true
  },
  {
    path: '/teacher/course/:courseId/discussion/:sessionId',
    name: 'discussion-detail',
    component: () => import('@/teacher/pages/DiscussionDetail.vue'),
    meta: { title: '讨论详情', requiresAuth: true, role: 'teacher' },
    props: true
  },
  {
    path: '/teacher/text-node-parser-test',
    name: 'text-node-parser-test',
    component: () => import('@/teacher/pages/TextNodeParserTest.vue'),
    meta: { title: '文本节点解析器测试', requiresAuth: false }
  }
];
```

- [ ] **Step 5: Verify the teacher router boundary is locked**

Run:

```powershell
rg -n "@/teacher/home/|@/teacher/course/|@/teacher/components/modules/|@/teacher/features/" src/router/modules/teacher.js
```

Expected: no matches.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/router/modules/teacher.js src/teacher/pages src/teacher/features
git commit -m "refactor: move teacher route targets into teacher pages"
```

### Task 6: Remove Empty Legacy Directories And Run Final Verification

**Files:**
- Delete if empty: `src/pages/GraphPage`
- Delete if empty: `src/views/dev`
- Delete if empty: `src/ui/graph`
- Delete if empty: `src/ui/outline`
- Delete if empty: `src/teacher/home`
- Delete if empty: `src/teacher/course`
- Delete if empty: `src/teacher/components/modules/TeacherCourseDetail`
- Modify if needed: any file still returned by the verification searches

- [ ] **Step 1: Capture the final failing baseline before cleanup**

Run:

```powershell
rg -n "@/pages/GraphPage|@/views/dev|@/ui/graph|@/ui/outline|@/teacher/home/|@/teacher/course/|@/teacher/components/modules" src
```

Expected: if this still returns matches, stop and fix those imports before deleting directories.

- [ ] **Step 2: Delete only the directories that are now empty**

Run:

```powershell
$dirs = @(
  'src/pages/GraphPage',
  'src/views/dev',
  'src/ui/graph',
  'src/ui/outline',
  'src/teacher/home',
  'src/teacher/course',
  'src/teacher/components/modules/TeacherCourseDetail'
)
foreach ($dir in $dirs) {
  if (Test-Path $dir) {
    $items = Get-ChildItem -LiteralPath $dir -Force
    if ($items.Count -eq 0) {
      Remove-Item -LiteralPath $dir
    }
  }
}
```

- [ ] **Step 3: Run the full import regression search**

Run:

```powershell
rg -n "@/pages/GraphPage|@/views/dev|@/ui/graph|@/ui/outline|@/teacher/home/|@/teacher/course/|@/teacher/components/modules" src
rg -n "@/pages/|@/views/|@/ui/" src/router/modules/shared.js
rg -n "@/teacher/home/|@/teacher/course/|@/teacher/components/|@/teacher/features/" src/router/modules/teacher.js
```

Expected:

- first command returns no matches
- second command returns no matches
- third command returns no matches

- [ ] **Step 4: Run the production build**

Run:

```powershell
npm run build
```

Expected: Vite completes successfully with exit code 0.

- [ ] **Step 5: Perform the manual smoke checklist**

Verify these routes in the browser:

```text
/
/login
/ai-assistant
/graph
/outline/<graphId>?courseId=<courseId>
/teacher/my
/teacher/course/<courseId>
/teacher/course/<courseId>/homework-grading
```

Expected: each page loads without a blank screen or missing-module error.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/router/modules src/shared src/teacher src/views src/pages src/ui
git commit -m "refactor: normalize src structure around pages and features"
```
