常用命令（Windows）：
1. 后端编译：`mvn -pl hiprof-admin -am -DskipTests compile`
2. 后端打包：`mvn -pl hiprof-admin -am -DskipTests package`
3. 前端开发：在 `hiprof-ui` 目录执行 `npm run dev`
4. 前端生产构建：在 `hiprof-ui` 目录执行 `npm run build:prod`
5. 前端预览：在 `hiprof-ui` 目录执行 `npm run preview`
6. 查看 Git 状态：`git status --short`
7. 查看改动：`git diff -- <path>`
数据库默认连接串：`jdbc:mysql://127.0.0.1:3600/hp_db...`，用户名 `root`。如需核对运行库权限或数据，先确认本地 MySQL 在 3600 端口可访问。