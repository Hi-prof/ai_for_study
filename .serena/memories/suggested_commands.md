# 常用命令
- 前端开发：`cd HiProf && npm install && npm run dev:local`
- 前端构建：`cd HiProf && npm run build`
- 前端预览：`cd HiProf && npm run preview`
- 后端打包：`cd HiProf-master && mvn -pl hiprof-admin -am -DskipTests package`
- 后端运行：`cd HiProf-master && java -jar hiprof-admin/target/hiprof-admin.jar`
- 一键启动：根目录执行 `start-dev.bat`（前提是 MySQL / Redis 已准备好）
- 当前仓库未看到独立 lint / 单测脚本；前端改动后至少跑一次 `npm run build`。