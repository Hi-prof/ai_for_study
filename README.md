# 八闽慧教项目

前后端分离项目，根目录下包含 `HiProf` 前端和 `HiProf-master` 后端。

## 项目结构

```text
八闽慧教项目/
├── HiProf/                # 前端：Vue 3 + Vite
├── HiProf-master/         # 后端：Spring Boot 多模块 Maven
├── start-dev.bat          # 一键启动脚本
└── README.md
```

## 前端架构

```text
HiProf/
├── src/
│   ├── api/               # 接口封装
│   ├── components/        # 通用/业务组件
│   ├── composables/       # 组合式逻辑
│   ├── layouts/           # 页面布局
│   ├── pages/             # 页面入口
│   ├── router/            # 路由配置
│   ├── services/          # 业务服务层
│   ├── styles/            # 全局样式
│   ├── utils/             # 工具方法
│   ├── App.vue            # 根组件
│   └── main.js            # 应用入口
├── public/                # 静态资源
├── vite.config.ts         # 构建配置
└── package.json           # 前端依赖与脚本
```

技术栈：`Vue 3`、`Vite`、`Vue Router`、`Pinia`、`Element Plus`、`Axios`。

## 后端架构

```text
HiProf-master/
├── hiprof-admin/          # Web 服务入口，应用启动模块
├── hiprof-framework/      # 安全、拦截、公共框架配置
├── hiprof-common/         # 通用工具与基础能力
├── hiprof-system/         # 系统管理模块
├── hiprof-quartz/         # 定时任务
├── hiprof-generator/      # 代码生成
├── hiprof-core/           # 核心业务能力
├── hiprof-portal/         # 公共/门户相关模块
├── hiprof-tp/             # 教案相关模块
├── pom.xml                # Maven 聚合工程
└── sql/                   # 初始化脚本
```

技术栈：`Java 17`、`Spring Boot 3`、`Spring Security`、`MyBatis`、`Maven`、`MySQL`、`Redis`。

## 启动说明

```bash
# 前端
cd HiProf
npm install
npm run dev:local

# 后端
cd HiProf-master
mvn -pl hiprof-admin -am -DskipTests package
java -jar hiprof-admin/target/hiprof-admin.jar
```

默认地址：
- 前端：`http://localhost:5173`
- 后端：`http://localhost:9090`

`start-dev.bat` 可以一起拉起前后端，但后端依赖 `MySQL` 和 `Redis`，没配好就别指望它自己通灵。
