# Src Structure Refactor Design

**Date:** 2026-03-31

## Goal

Refactor the `src` directory so shared route pages, graph-related code, and teacher business modules have clear ownership and import boundaries without changing runtime behavior.

## Scope

This design covers the first high-priority structural refactor only.

Included:

- Reorganize shared route pages into `src/shared/pages`
- Reorganize graph and outline code into `src/shared/features/graph`
- Reorganize teacher route targets into `src/teacher/pages`
- Reorganize teacher business modules into `src/teacher/features`
- Reorganize reusable teacher-only presentation components into `src/teacher/components`
- Update router imports and internal alias imports to match the new structure
- Keep existing behavior, APIs, and component internals unchanged

Excluded:

- Splitting large Vue files such as `NodeDetailPanel.vue`
- Refactoring logic inside `TeacherCourseDetail` feature files
- Moving `src/api/graph.js` or `src/api/node.js`
- Reorganizing `src/utils`
- Reorganizing `src/teacher/styles`
- Deleting legacy pages or example files unless they become fully unused and are separately approved

## Problems In The Current Structure

### 1. Route targets are split across unrelated directories

Shared routes currently import from both `src/pages` and `src/views`, while teacher routes import from a mix of `src/teacher/home`, `src/teacher/course`, `src/teacher/pages`, and `src/teacher/components/modules`.

This makes it hard to answer a simple question: which files are pages, and which files are feature components?

### 2. Graph functionality is split by historical directory names instead of feature boundaries

Graph and outline code is currently spread across:

- `src/pages/GraphPage`
- `src/ui/graph`
- `src/ui/outline`
- `src/api/graph.js`
- `src/api/node.js`

The runtime feature is cohesive, but the filesystem layout is not.

### 3. Teacher business modules mix route pages and nested feature components

`src/teacher/components/modules` currently contains:

- route-entry pages
- page-level feature containers
- reusable teacher components
- deeply nested business modules under `TeacherCourseDetail`

That makes routing and ownership harder to understand and encourages new files to be placed wherever they fit locally instead of where they belong conceptually.

## Target Directory Design

### Shared

```text
src/shared/
  pages/
  components/
  composables/
  features/
    graph/
      pages/
      components/
      utils/
```

Rules:

- `shared/pages` contains only files directly referenced by shared routes
- `shared/components` contains cross-feature reusable components
- `shared/features/graph` contains graph and outline feature code, including feature pages
- `shared/composables` remains the location for cross-role composables

### Teacher

```text
src/teacher/
  pages/
  components/
  composables/
  features/
    home/
    course-detail/
      chapter/
      discussion/
      homework/
      knowledgegraph/
      learning-analysis/
      lessonplan/
      materials/
      textparser/
```

Rules:

- `teacher/pages` contains only files directly referenced by teacher routes
- `teacher/features` contains teacher business features and page-level containers
- `teacher/components` contains reusable teacher-only components that are not route entry pages
- `teacher/composables` remains the location for teacher-only composables

## Phase 1 File Moves

### A. Shared route pages

Move these files into `src/shared/pages`:

- `src/pages/AIAssistantPage.vue`
- `src/pages/ComingSoonPage.vue`
- `src/pages/LoginPage.vue`
- `src/pages/RegisterPage.vue`
- `src/pages/ForgotPasswordPage.vue`
- `src/pages/ResetPasswordPage.vue`
- `src/pages/MainHomePage.vue`
- `src/views/dev/DevTools.vue`

Move this file into `src/shared/pages/legacy` for retention without active promotion:

- `src/pages/KnowledgeGraphHomePage.vue`

### B. Shared graph feature

Move these files into `src/shared/features/graph/pages`:

- `src/pages/GraphPage/index.vue`
- `src/pages/GraphPage/OutlinePage.vue`

Move these files into `src/shared/features/graph/components`:

- `src/pages/GraphPage/GraphView.vue`
- `src/pages/GraphPage/CourseList.vue`
- `src/ui/graph/GraphList.vue`
- `src/ui/graph/NodeContextMenu.vue`
- `src/ui/graph/NodeDetailPanel.vue`
- `src/ui/graph/NodeEditDialog.vue`
- all Vue files under `src/ui/outline`

Move these files into `src/shared/features/graph/utils`:

- `src/pages/GraphPage/graphConfig.js`
- `src/pages/GraphPage/graphUtils.js`

Keep the existing graph APIs in place for this phase:

- `src/api/graph.js`
- `src/api/node.js`

### C. Teacher route pages

Move these files into `src/teacher/pages`:

- `src/teacher/home/TeacherHomePage.vue`
- `src/teacher/course/TeacherCoursePage.vue`
- `src/teacher/pages/HomeworkGradingPage.vue`
- `src/teacher/components/modules/TeacherMyLessons.vue`
- `src/teacher/components/modules/TeacherCourseDetail/chapter/AiChapterGenerator.vue`
- `src/teacher/components/modules/TeacherCourseDetail/chapter/chapter-learning/ChapterLearningPage.vue`
- `src/teacher/components/modules/TeacherCourseDetail/knowledgegraph/refactored/AiKnowledgeGraphGenerator.vue`
- `src/teacher/components/modules/TeacherCourseDetail/lessonplan/AiLessonPlanGenerator.vue`
- `src/teacher/components/modules/TeacherCourseDetail/homework/HomeworkSubmissions.vue`
- `src/teacher/components/modules/TeacherCourseDetail/discussion/DiscussionDetail.vue`
- `src/teacher/components/modules/TeacherCourseDetail/textparser/TextNodeParserTest.vue`

### D. Teacher business features

Move the current `TeacherCourseDetail` tree into `src/teacher/features/course-detail`.

Move these teacher home/business modules into feature folders:

- `TeacherCourses.vue` -> `src/teacher/features/home`
- `TeacherSettings.vue` -> `src/teacher/features/home`
- `TeacherAIAssistant.vue` -> `src/teacher/features/home`
- `TeacherHomeworkDiscussion.vue` -> `src/teacher/features/home`

Move this reusable teacher-only component into `src/teacher/components`:

- `TeacherCourseCard.vue`

## Router Rules After Phase 1

### Shared router

`src/router/modules/shared.js` may import only from:

- `@/shared/pages/...`
- `@/shared/features/*/pages/...`

It must not import from:

- `@/pages/...`
- `@/views/...`
- `@/ui/...`

### Teacher router

`src/router/modules/teacher.js` may import only from:

- `@/teacher/pages/...`

It must not import from:

- `@/teacher/components/...`
- `@/teacher/features/...`

Teacher pages are allowed to compose teacher feature modules internally.

## Implementation Order

1. Create the new directories without deleting old ones
2. Move shared route pages and update shared route imports
3. Move teacher route pages and update teacher route imports
4. Move graph feature files and update all feature imports
5. Move teacher business modules into `teacher/features` and `teacher/components`
6. Remove now-empty legacy directories after all references are updated

## Import Policy

- Use alias imports such as `@/shared/pages/...` and `@/teacher/features/...`
- Avoid introducing deep relative imports during the refactor
- Route modules should depend only on page directories
- Pages may depend on features, shared components, shared composables, and API modules
- Features may depend on shared components, shared composables, utils, and API modules

## Error Handling Strategy

This refactor is structural, so the main risk is broken imports rather than broken business logic.

Risk controls:

- Move one directory class at a time
- Update imports immediately after each move
- Keep old API and util locations stable during phase 1
- Delete legacy directories only after verification passes

## Verification Strategy

After the refactor:

1. Search for stale import paths:
   - `@/pages/GraphPage`
   - `@/ui/graph`
   - `@/ui/outline`
   - `@/views/dev`
   - `@/teacher/components/modules`
2. Search router modules for forbidden imports from `ui`, `views`, or teacher module directories
3. Run `npm run build`
4. Perform manual smoke checks for:
   - home page
   - login page
   - AI assistant page
   - graph page
   - outline page
   - teacher home page
   - teacher course page
   - homework grading page

## Rollback Strategy

- Do not combine structural relocation with logic refactors in the same phase
- Keep changes grouped by migration step so a failed step can be reverted cleanly
- Delay deletion of old directories until path verification and build verification succeed

## Future Work After Phase 1

After structure stabilization, the next safe refactor wave is:

- split oversized graph and teacher feature files
- reorganize graph-related API files under a feature-aware API layout
- reorganize `src/utils` so feature-specific helpers move closer to their features
- co-locate teacher feature styles closer to feature files where appropriate
