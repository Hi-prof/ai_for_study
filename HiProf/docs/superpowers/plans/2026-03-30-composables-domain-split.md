# Composables Domain Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize composables into shared, teacher, and student folders without changing runtime behavior.

**Architecture:** Shared hooks move to `src/shared/composables`, teacher-only hooks move to `src/teacher/composables`, and `src/student/composables` remains available for future student-only hooks. Existing Vue files keep alias-based imports so the reorganization stays local to import paths rather than requiring deeper component rewrites.

**Tech Stack:** Vue 3, Vite, TypeScript, JavaScript, PowerShell, ripgrep

---

### Task 1: Create the new folder layout

**Files:**
- Create: `src/shared/composables/*`
- Create: `src/teacher/composables/*`
- Create: `src/student/composables/.gitkeep`

- [ ] **Step 1: Create the domain directories**

```powershell
New-Item -ItemType Directory -Force -Path 'src/shared/composables'
New-Item -ItemType Directory -Force -Path 'src/teacher/composables'
New-Item -ItemType Directory -Force -Path 'src/student/composables'
```

- [ ] **Step 2: Move shared composables**

```powershell
Move-Item -LiteralPath 'src/composables/useApi.js' -Destination 'src/shared/composables/useApi.js'
Move-Item -LiteralPath 'src/composables/useChapterFileUpload.js' -Destination 'src/shared/composables/useChapterFileUpload.js'
Move-Item -LiteralPath 'src/composables/useChatNonStream.ts' -Destination 'src/shared/composables/useChatNonStream.ts'
Move-Item -LiteralPath 'src/composables/useDeepSeekChat.ts' -Destination 'src/shared/composables/useDeepSeekChat.ts'
Move-Item -LiteralPath 'src/composables/useDialog.js' -Destination 'src/shared/composables/useDialog.js'
Move-Item -LiteralPath 'src/composables/useFormValidation.js' -Destination 'src/shared/composables/useFormValidation.js'
Move-Item -LiteralPath 'src/composables/useOfficePreview.js' -Destination 'src/shared/composables/useOfficePreview.js'
Move-Item -LiteralPath 'src/composables/useTokenManager.js' -Destination 'src/shared/composables/useTokenManager.js'
Move-Item -LiteralPath 'src/composables/useWorkspacePage.js' -Destination 'src/shared/composables/useWorkspacePage.js'
```

- [ ] **Step 3: Move teacher composables**

```powershell
Move-Item -LiteralPath 'src/composables/useChapterManagement.js' -Destination 'src/teacher/composables/useChapterManagement.js'
Move-Item -LiteralPath 'src/composables/useFileUpload.js' -Destination 'src/teacher/composables/useFileUpload.js'
Move-Item -LiteralPath 'src/composables/useTeacherData.js' -Destination 'src/teacher/composables/useTeacherData.js'
```

### Task 2: Update alias imports

**Files:**
- Modify: `src/pages/AIAssistantPage.vue`
- Modify: `src/student/home/StudentHomePage.vue`
- Modify: `src/teacher/home/TeacherHomePage.vue`
- Modify: `src/ui/graph/NodeEditDialog.vue`
- Modify: `src/ui/graph/NodeDetailPanel.vue`
- Modify: `src/ui/outline/NodeEditDialog.vue`
- Modify: `src/student/components/modules/StudentCourses/chapters/StudentChapterFileList.vue`
- Modify: `src/teacher/components/modules/TeacherCourseDetail/chapter/ChapterEditor.vue`
- Modify: `src/teacher/components/modules/TeacherCourseDetail/chapter/ChapterFileList.vue`
- Modify: `src/teacher/components/modules/TeacherCourseDetail/chapter/ChapterFileUploadDialog.vue`
- Modify: `src/teacher/components/modules/TeacherCourseDetail/chapter/CourseChapters.vue`
- Modify: `src/teacher/components/modules/TeacherCourseDetail/chapter/chapter-learning/ChapterLearningPage.vue`
- Modify: `src/teacher/components/modules/TeacherCourseDetail/materials/ChapterFilesIntegration.vue`
- Modify: `src/teacher/components/modules/TeacherCourseDetail/materials/MaterialsManager.vue`
- Modify: `src/teacher/composables/useTeacherData.js`

- [ ] **Step 1: Point shared imports to the new shared path**

```text
@/composables/useDeepSeekChat -> @/shared/composables/useDeepSeekChat
@/composables/useWorkspacePage -> @/shared/composables/useWorkspacePage
@/composables/useChapterFileUpload -> @/shared/composables/useChapterFileUpload
@/composables/useOfficePreview -> @/shared/composables/useOfficePreview
./useApi -> @/shared/composables/useApi
```

- [ ] **Step 2: Point teacher-only imports to the new teacher path**

```text
@/composables/useChapterManagement -> @/teacher/composables/useChapterManagement
@/composables/useFileUpload -> @/teacher/composables/useFileUpload
```

### Task 3: Verify the refactor

**Files:**
- Test: `src/**/*`

- [ ] **Step 1: Search for stale imports**

```powershell
rg -n "@/composables/" src
```

Expected: no matches

- [ ] **Step 2: Build the project**

```powershell
npm run build
```

Expected: Vite build completes successfully
