# Composables Domain Split Design

**Date:** 2026-03-30

## Goal

Reorganize `src/composables` so shared hooks live in `src/shared/composables`, teacher-only hooks live in `src/teacher/composables`, and `src/student/composables` is reserved for future student-only hooks.

## Classification

- Shared composables:
  - `useApi.js`
  - `useChapterFileUpload.js`
  - `useChatNonStream.ts`
  - `useDeepSeekChat.ts`
  - `useDialog.js`
  - `useFormValidation.js`
  - `useOfficePreview.js`
  - `useTokenManager.js`
  - `useWorkspacePage.js`
- Teacher-only composables:
  - `useChapterManagement.js`
  - `useFileUpload.js`
  - `useTeacherData.js`
- Student-only composables:
  - none yet

## Design Decisions

- Keep domain-neutral composables under `src/shared/composables` so both teacher and student code can import them through the same alias path.
- Move teacher-specific course management hooks under `src/teacher/composables` to make ownership explicit.
- Create `src/student/composables` now even though it is empty so future student-only hooks have a predictable home.
- Update all `@/composables/...` imports to point at their new domain-specific locations.

## Verification Strategy

- Search the codebase for stale `@/composables/` imports after the move.
- Run the production build to confirm Vite resolves the new paths correctly.
