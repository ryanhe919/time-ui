/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 统一导出当前包的对外公共 API：索引加载器、数据类型与纯函数查询工具。
 */

export {
  loadIndex,
  __resetIndexCache,
  type DocsIndex,
  type ComponentEntry,
  type ComponentTranslation,
  type CategoryEntry,
  type ExampleEntry,
  type Locale,
} from './data';

export {
  listCategories,
  listComponents,
  getComponent,
  searchComponents,
  type ToolLocale,
  type CategorySummary,
  type ComponentSummary,
  type ComponentDetail,
  type SearchHit,
} from './tools';

export { createServer } from './server';
