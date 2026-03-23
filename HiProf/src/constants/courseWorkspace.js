export const defaultTeacherCourseWorkspaceTab = 'chapters';

export const teacherCourseWorkspaceTabs = [
  {
    key: 'chapters',
    label: '章节管理',
    description: '课程结构与学习入口。',
    icon: 'chapters'
  },
  {
    key: 'knowledge-graph',
    label: '知识图谱',
    description: '知识点关系与图谱预览。',
    icon: 'knowledgeGraph'
  },
  {
    key: 'homework',
    label: '作业管理',
    description: '布置作业并跟进批改。',
    icon: 'homework'
  },
  {
    key: 'discussion',
    label: '课程讨论',
    description: '发起讨论并查看会话动态。',
    icon: 'discussion'
  },
  {
    key: 'materials',
    label: '课程资料',
    description: '课件文档与资料归档。',
    icon: 'materials'
  },
  {
    key: 'analytics',
    label: '学情分析',
    description: '学习进度与表现概览。',
    icon: 'analytics'
  }
];

export function getTeacherCourseWorkspaceTab(tabKey) {
  return (
    teacherCourseWorkspaceTabs.find(tab => tab.key === tabKey) ||
    teacherCourseWorkspaceTabs[0]
  );
}
