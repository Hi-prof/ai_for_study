export const teacherWorkspaceTabs = [
  {
    key: 'courses',
    label: '课程管理',
    description: '课程、班级与资源统一查看',
    icon: 'courses'
  },
  {
    key: 'ai-assistant',
    label: 'AI 教学助手',
    description: '教案生成、课件创作与教学答疑',
    icon: 'sparkles'
  },
  {
    key: 'settings',
    label: '账号设置',
    description: '个人偏好与基础配置维护',
    icon: 'settings'
  }
];

export const studentWorkspaceTabs = [
  {
    key: 'courses',
    label: '我的课程',
    description: '课程进度、资料与学习入口',
    icon: 'courses'
  },
  {
    key: 'ai-assistant',
    label: 'AI 学习助手',
    description: '问答辅导、学习规划与练习支持',
    icon: 'sparkles'
  },
  {
    key: 'settings',
    label: '学习设置',
    description: '账号信息与学习偏好管理',
    icon: 'settings'
  }
];

export const teacherAssistantItems = [
  {
    key: 'lesson-plan',
    title: 'AI 生成教案',
    description: '围绕课程目标快速生成结构清晰的教案，减少重复备课时间。',
    icon: 'lessonPlan',
    buttonText: '开始生成',
    tag: '教学设计',
    tone: 'primary'
  },
  {
    key: 'slides',
    title: 'AI 生成 PPT',
    description: '基于教学内容输出演示骨架和课件思路，统一课堂呈现风格。',
    icon: 'presentation',
    buttonText: '开始制作',
    tag: '课件创作',
    tone: 'success'
  },
  {
    key: 'chat',
    title: 'AI 智能问答',
    description: '提供教学策略、课堂组织和资源整理建议，减少来回试错。',
    icon: 'chat',
    buttonText: '开始对话',
    tag: '即时辅助',
    tone: 'warning'
  },
  {
    key: 'my-lessons',
    title: '我的教案',
    description: '集中管理已产出的教案内容，便于复用、整理和后续迭代。',
    icon: 'folder',
    buttonText: '查看教案',
    tag: '成果管理',
    tone: 'accent'
  }
];

export const studentAssistantItems = [
  {
    key: 'chat',
    title: 'AI 学习助手',
    description: '随时解答课程中的疑问，让提问和回顾都能更顺手。',
    icon: 'chat',
    buttonText: '开始对话',
    tag: '即时答疑',
    tone: 'primary'
  },
  {
    key: 'tutor',
    title: 'AI 学习指导',
    description: '结合当前学习节奏，给出更清晰的复习顺序和方法建议。',
    icon: 'brain',
    buttonText: '获取指导',
    tag: '个性辅导',
    tone: 'success'
  },
  {
    key: 'practice',
    title: 'AI 练习生成',
    description: '按知识点自动补足训练内容，方便巩固薄弱环节。',
    icon: 'practice',
    buttonText: '开始练习',
    tag: '巩固训练',
    tone: 'warning'
  }
];
