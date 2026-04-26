/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 统一导出当前包的对外公共 API：索引加载器、数据类型与纯函数查询工具。
 */

export {
  loadIndex,
  initIndex,
  DEFAULT_REMOTE_INDEX_URL,
  __resetIndexCache,
  __setIndexCacheForTesting,
  type DocsIndex,
  type ComponentEntry,
  type ComponentTranslation,
  type PageTranslation,
  type GuideEntry,
  type CategoryEntry,
  type SectionEntry,
  type ExampleEntry,
  type InitIndexOptions,
  type Locale,
} from './data';

export {
  listCategories,
  listComponents,
  getComponent,
  searchComponents,
  listSections,
  listGuides,
  getGuide,
  searchGuides,
  type ToolLocale,
  type CategorySummary,
  type ComponentSummary,
  type ComponentDetail,
  type SearchHit,
  type SectionSummary,
  type GuideSummary,
  type GuideDetail,
  type GuideSearchHit,
} from './tools';

export { createServer } from './server';
