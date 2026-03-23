# 八闽慧教项目概览
- 根目录包含前端 `HiProf` 和后端 `HiProf-master`，属于前后端分离项目。
- 前端是 `Vue 3 + Vite` 应用，核心目录包括 `src/api`、`src/pages`、`src/router`、`src/services`、`src/utils`、`src/teacher`、`src/student`。
- 后端是 `Spring Boot` 多模块 Maven 工程，`hiprof-admin` 为启动模块，`hiprof-core` 承载核心业务，MyBatis XML 位于各模块 `src/main/resources/mapper`。
- 知识图谱相关前端接口在 `HiProf/src/api/graph.js`，教师端页面在 `HiProf/src/teacher/components/modules/TeacherCourseDetail/knowledgegraph/`，后端对应 Mapper 在 `HiProf-master/hiprof-core/src/main/resources/mapper/core/ZstpGraphMapper.xml`。
- 项目运行依赖 MySQL 与 Redis。