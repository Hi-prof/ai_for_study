# 代码风格与约定
- 前端以 Vue SFC 为主，常见写法是 `<script setup>` + Composition API。
- JavaScript / Vue 文件普遍使用单引号、分号，变量命名采用语义化英文，中文仅用于注释和界面文案。
- API 封装集中在 `src/api/*.js`，组件层通常直接 `await` 这些接口函数，并在组件里处理加载态与异常。
- 修改现有功能时优先沿用当前文件结构和命名，不额外引入无关抽象。
- 后端使用 Spring Boot + MyBatis，SQL 主要写在 XML Mapper 中，实体与 Mapper 命名保持业务前缀一致。