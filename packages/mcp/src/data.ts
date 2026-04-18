/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 运行时加载静态 docs 索引并 memoize，供纯函数工具与未来的 MCP server 复用。
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** 支持的文档语言枚举。保持与 docs 站点同步。 */
export type Locale = 'zh' | 'en';

export interface ExampleEntry {
  /** LiveDemo code 属性的原始源码，可直接塞进 sandbox 渲染。 */
  code: string;
}

export interface ComponentTranslation {
  title: string;
  description: string;
  /** 去除 JSX 后的 markdown 正文；面向 LLM 检索。 */
  content: string;
  examples: ExampleEntry[];
  href: string;
}

export interface ComponentEntry {
  slug: string;
  category: string;
  translations: Record<Locale, ComponentTranslation>;
}

export interface CategoryEntry {
  slug: string;
  label: string;
}

export interface DocsIndex {
  generatedAt: string;
  categories: Record<Locale, CategoryEntry[]>;
  components: ComponentEntry[];
}

// 运行期定位 data/index.json：同时兼顾 ts 源码（src/data.ts）与 tsup 产物（dist/index.js/.cjs）
// 的位置 —— 两者与 data/ 都是兄弟关系，往上一层即可。
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_INDEX_PATH = path.resolve(__dirname, '..', 'data', 'index.json');

let cached: DocsIndex | null = null;

/**
 * 读取并缓存索引。使用同步 IO 是为了兼容 stdio MCP server 的启动路径（避免 top-level await）。
 */
export function loadIndex(indexPath: string = DEFAULT_INDEX_PATH): DocsIndex {
  if (cached) return cached;
  const raw = readFileSync(indexPath, 'utf8');
  const parsed = JSON.parse(raw) as DocsIndex;
  cached = parsed;
  return parsed;
}

/** 测试钩子：显式清缓存，强制下次 loadIndex 重读磁盘。 */
export function __resetIndexCache(): void {
  cached = null;
}
