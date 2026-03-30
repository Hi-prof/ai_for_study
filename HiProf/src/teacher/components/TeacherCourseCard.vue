<template>
  <article class="teacher-course-card" :class="`teacher-course-card--${course.type || 'blue'}`">
    <button type="button" class="teacher-course-card__surface" @click="$emit('enter', course.id)">
      <div class="teacher-course-card__meta">
        <span class="teacher-course-card__badge">{{ course.semester }}</span>
        <span class="teacher-course-card__updated">{{ course.lastModified }} 更新</span>
      </div>

      <h3>{{ course.title }}</h3>
      <p>{{ summaryText }}</p>

      <div class="teacher-course-card__stats">
        <div class="teacher-course-card__stat">
          <span>学生人数</span>
          <strong>{{ course.studentCount }} 人</strong>
        </div>
        <div class="teacher-course-card__stat">
          <span>总课时</span>
          <strong>{{ course.totalHours }} 学时</strong>
        </div>
      </div>
    </button>

    <footer class="teacher-course-card__footer">
      <button type="button" class="teacher-course-card__action teacher-course-card__action--primary" @click.stop="$emit('enter', course.id)">
        <WorkspaceIcon name="arrowRight" :size="15" />
        <span>进入课程</span>
      </button>
      <button type="button" class="teacher-course-card__action teacher-course-card__action--secondary" @click.stop="$emit('edit', course)">
        编辑课程
      </button>
      <button type="button" class="teacher-course-card__action teacher-course-card__action--danger" @click.stop="$emit('delete', course)">
        删除
      </button>
    </footer>
  </article>
</template>

<script setup>
import { computed } from 'vue';
import WorkspaceIcon from '@/ui/workspace/WorkspaceIcon.vue';

const props = defineProps({
  course: {
    type: Object,
    required: true
  }
});

defineEmits(['enter', 'edit', 'delete']);

const summaryText = computed(() => {
  return props.course.description || '课程简介暂未补充，点击进入课程后继续完善教学内容与资料。';
});
</script>

<style scoped>
.teacher-course-card {
  --card-accent: #2563eb;
  --card-accent-alt: #60a5fa;
  --card-accent-soft: rgba(37, 99, 235, 0.12);
  --card-shadow: rgba(37, 99, 235, 0.22);
  display: flex;
  flex-direction: column;
  min-height: 280px;
  border-radius: 26px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.teacher-course-card:hover {
  transform: translateY(-5px);
  border-color: rgba(96, 165, 250, 0.7);
  box-shadow: 0 26px 56px rgba(15, 23, 42, 0.12);
}

.teacher-course-card--green {
  --card-accent: #059669;
  --card-accent-alt: #34d399;
  --card-accent-soft: rgba(5, 150, 105, 0.12);
  --card-shadow: rgba(5, 150, 105, 0.22);
}

.teacher-course-card__surface,
.teacher-course-card__action {
  border: none;
  font: inherit;
}

.teacher-course-card__surface {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  padding: 1.25rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96)),
    linear-gradient(135deg, var(--card-accent-soft), transparent 55%);
  text-align: left;
  cursor: pointer;
}

.teacher-course-card__meta,
.teacher-course-card__footer,
.teacher-course-card__stats {
  display: flex;
  align-items: center;
}

.teacher-course-card__meta {
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.teacher-course-card__badge {
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  background: var(--card-accent-soft);
  color: var(--card-accent);
  font-size: 0.78rem;
  font-weight: 700;
}

.teacher-course-card__updated,
.teacher-course-card__stat span,
.teacher-course-card p {
  color: #64748b;
}

.teacher-course-card h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #0f172a;
  line-height: 1.35;
}

.teacher-course-card p {
  margin: 0;
  line-height: 1.7;
}

.teacher-course-card__stats {
  gap: 0.85rem;
  margin-top: auto;
}

.teacher-course-card__stat {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.9rem;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(226, 232, 240, 0.9);
}

.teacher-course-card__stat strong {
  color: #0f172a;
  font-size: 1rem;
}

.teacher-course-card__footer {
  gap: 0.65rem;
  padding: 1rem 1.25rem 1.25rem;
  border-top: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.96);
}

.teacher-course-card__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 42px;
  padding: 0.7rem 0.95rem;
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.teacher-course-card__action:hover {
  transform: translateY(-1px);
}

.teacher-course-card__action--primary {
  flex: 1;
  background: linear-gradient(135deg, var(--card-accent), var(--card-accent-alt));
  color: #ffffff;
  box-shadow: 0 12px 24px var(--card-shadow);
}

.teacher-course-card__action--secondary {
  background: #eef2ff;
  color: #334155;
}

.teacher-course-card__action--danger {
  background: #fff1f2;
  color: #be123c;
}

@media (max-width: 640px) {
  .teacher-course-card__footer {
    flex-wrap: wrap;
  }

  .teacher-course-card__action {
    flex: 1 1 calc(50% - 0.35rem);
  }
}
</style>
