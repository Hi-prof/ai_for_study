/**
 * 章节学习模块导出文件
 * 
 * 这个文件提供了章节学习模块的统一导出接口，
 * 方便其他组件导入和使用章节学习相关的组件。
 */

// 主要组件
export { default as ChapterLearningPage } from './ChapterLearningPage.vue';
export { default as ChapterTreeMap } from './ChapterTreeMap.vue';

// 演示组件
export { default as ChapterLearningPageDemo } from './ChapterLearningPage.demo.vue';

// 默认导出主组件
export { default } from './ChapterLearningPage.vue';

/**
 * 使用示例：
 * 
 * // 导入主组件
 * import ChapterLearningPage from './chapter-learning';
 * 
 * // 导入特定组件
 * import { ChapterTreeMap } from './chapter-learning';
 * 
 * // 导入多个组件
 * import { 
 *   ChapterLearningPage, 
 *   ChapterTreeMap,
 *   ChapterLearningPageDemo 
 * } from './chapter-learning';
 */
