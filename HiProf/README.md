# HiProf 前端

HiProf 是教师备课与学习工作台前端，基于 Vue 3 + Vite，覆盖登录认证、教师工作台、学生工作台、知识图谱、大纲管理、AI 助手等模块。

## 技术栈

- Vue 3
- Vue Router
- Vite
- Axios
- Element Plus
- relation-graph-vue3

## 常用命令

```bash
npm install
npm run dev
npm run build
npm run preview
```

- 开发地址：`http://localhost:5173`
- 默认后端：`http://localhost:9090`

## 环境变量

- `.env.local`：本地开发配置
- `.env.production`：生产构建配置
- `.env.example`：示例模板

当前实际使用的变量：

- `VITE_API_BASE_URL`
- `VITE_DEEPSEEK_API_KEY`
- `VITE_DEEPSEEK_API_BASE`
- `VITE_DEEPSEEK_MODEL`
- `VITE_COZE_TOKEN`
- `VITE_COZE_BASE_URL`
- `VITE_COZE_BOT_ID`

## 目录结构

```text
HiProf/
├── public/                    # 公共静态资源
├── src/
│   ├── api/                   # 共享接口请求
│   ├── assets/                # 图片与基础样式资源
│   ├── composables/           # 组合式逻辑
│   ├── pages/                 # 通用路由页面
│   ├── router/                # 路由入口与分端路由模块
│   ├── services/              # WebSocket 等服务
│   ├── student/               # 学生端页面、组件、布局、样式
│   ├── styles/                # 共享样式
│   ├── teacher/               # 教师端页面、组件、布局、样式
│   ├── ui/                    # 通用 UI、首页、图谱、工作台组件
│   ├── utils/                 # 工具函数
│   └── main.js                # 应用入口
├── index.html                 # Vite 入口模板
├── package.json               # 依赖与脚本
├── vite.config.ts             # Vite 配置
├── nginx.conf                 # 线上 Nginx 代理示例
└── README.md
```

## 模块说明

- 教师端：课程、教案、AI 助手、资源管理等工作台模块
- 学生端：课程学习、AI 助手、个人学习空间
- 知识图谱：课程图谱展示、节点查看与编辑
- 大纲管理：课程章节树、节点操作与内容维护

## 部署说明

- `npm run build` 输出到 `dist/`
- `nginx.conf` 保留为当前部署配置，包含 `/api` 和 WebSocket `/channel/` 代理
