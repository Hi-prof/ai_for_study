export const studentRoutes = [
  {
    path: '/student',
    name: 'student',
    component: () => import('@/student/layouts/StudentLayout.vue'),
    meta: { title: '学生学习平台', requiresAuth: true, role: 'student' },
    children: [
      { path: '', redirect: '/student/my' },
      {
        path: 'my',
        name: 'student-my',
        component: () => import('@/student/home/StudentHomePage.vue'),
        meta: { title: '学生个人中心' }
      },
      {
        path: 'course/:courseId',
        name: 'student-course-detail',
        component: () => import('@/student/course/StudentCoursePage.vue'),
        meta: { title: '课程详情' }
      },
      {
        path: 'course/:courseId/discussion/:sessionId',
        name: 'student-discussion-detail',
        component: () => import('@/student/components/modules/StudentCourses/discussions/StudentDiscussionDetail.vue'),
        meta: { title: '课程讨论' }
      }
    ]
  }
];
