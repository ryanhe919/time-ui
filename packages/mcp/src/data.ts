/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 运行时加载静态 docs 索引并 memoize，供纯函数工具与 MCP server 复用。
 *
 * 索引来源（initIndex 时按优先级尝试）：
 *   1. opts.remoteUrl 或 env `TIMEUI_MCP_INDEX_URL`（除非显式 'off' / 'none' / 'local'）
 *   2. DEFAULT_REMOTE_INDEX_URL（http://aliyun.ryanstone.cn/mcp-index.json，与 docs 部署同步）
 *   3. 包内 bundled 的 data/index.json（始终可用，作为离线兜底）
 *
 * sync 路径 `loadIndex()` 始终走 bundled，不发网络请求；这是 docs API route 等同步上下文用的。
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

export interface PageTranslation {
  title: string;
  description: string;
  /** 去除 JSX 后的 markdown 正文；面向 LLM 检索。 */
  content: string;
  examples: ExampleEntry[];
  href: string;
}

/**
 * @deprecated 用 `PageTranslation`。保留别名是为了不破坏外部旧 import。
 */
export type ComponentTranslation = PageTranslation;

export interface ComponentEntry {
  slug: string;
  category: string;
  translations: Record<Locale, PageTranslation>;
}

/** 指南页（getting-started / chat 这类无 group section 下的页面）。 */
export interface GuideEntry {
  slug: string;
  section: string;
  translations: Record<Locale, PageTranslation>;
}

export interface CategoryEntry {
  slug: string;
  label: string;
}

/** Section 标签（与 categories 同结构，但描述的是顶层 section 而非组件分类）。 */
export type SectionEntry = CategoryEntry;

export interface DocsIndex {
  generatedAt: string;
  categories: Record<Locale, CategoryEntry[]>;
  /** 顶层 section 标签（getting-started / chat / ...），新加字段，老索引可能缺失。 */
  sections: Record<Locale, SectionEntry[]>;
  components: ComponentEntry[];
  /** 指南页清单，新加字段，老索引可能缺失。 */
  guides: GuideEntry[];
}

// 运行期定位 data/index.json：同时兼顾 ts 源码（src/data.ts）与 tsup 产物（dist/index.js/.cjs）
// 的位置 —— 两者与 data/ 都是兄弟关系，往上一层即可。
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_INDEX_PATH = path.resolve(__dirname, '..', 'data', 'index.json');

/** 默认远程索引 URL（docs 站点的部署位置，与 docs 同步发版后即时生效）。 */
export const DEFAULT_REMOTE_INDEX_URL = 'http://aliyun.ryanstone.cn/mcp-index.json';

const OFFLINE_SENTINELS = new Set(['off', 'none', 'local', 'bundled', 'false', '0']);

let cached: DocsIndex | null = null;

/** 把任意 JSON.parse 结果归一化为 DocsIndex；老索引可能缺 guides / sections，补空数组。 */
function normalizeIndex(raw: unknown): DocsIndex {
  const obj = (raw ?? {}) as Partial<DocsIndex>;
  return {
    generatedAt: obj.generatedAt ?? '',
    categories: obj.categories ?? { zh: [], en: [] },
    sections: obj.sections ?? { zh: [], en: [] },
    components: obj.components ?? [],
    guides: obj.guides ?? [],
  };
}

/**
 * 同步加载 bundled 索引并缓存。MCP server 启动时通常先调 initIndex（async）尝试远程刷新，
 * 失败时再走这条路；纯计算工具（searchComponents 等）后续都拿同一份缓存。
 */
export function loadIndex(indexPath: string = DEFAULT_INDEX_PATH): DocsIndex {
  if (cached) return cached;
  const raw = readFileSync(indexPath, 'utf8');
  cached = normalizeIndex(JSON.parse(raw));
  return cached;
}

/** 测试钩子：显式清缓存，强制下次 loadIndex / initIndex 重新解析。 */
export function __resetIndexCache(): void {
  cached = null;
}

/** 单测注入：强行写入指定 index 到缓存，跳过磁盘与网络。 */
export function __setIndexCacheForTesting(index: DocsIndex): void {
  cached = index;
}

export interface InitIndexOptions {
  /** 显式指定远程 URL；优先级高于 env。传 'off' / 'none' / 'local' 表示禁用网络。 */
  remoteUrl?: string;
  /** fetch 超时（ms），默认 3000。 */
  timeoutMs?: number;
  /** 失败时的日志通道，默认走 process.stderr.write；测试可注入静默函数。 */
  log?: (msg: string) => void;
  /** 单测注入：替换 fetch（默认用全局 fetch）。 */
  fetchImpl?: typeof fetch;
}

function defaultLog(msg: string): void {
  // stdio 模式下 stdout = MCP 帧，所有日志必须走 stderr。
  process.stderr.write(`[timeui-mcp] ${msg}\n`);
}

function resolveRemoteUrl(explicit?: string): string | null {
  const candidate = explicit ?? process.env.TIMEUI_MCP_INDEX_URL ?? DEFAULT_REMOTE_INDEX_URL;
  if (!candidate) return null;
  if (OFFLINE_SENTINELS.has(candidate.trim().toLowerCase())) return null;
  return candidate;
}

/**
 * 异步初始化索引：先尝试远程拉取，失败/禁用时回退 bundled。populates the same cache as
 * `loadIndex()` so that subsequent sync queries see the freshest data.
 */
export async function initIndex(opts: InitIndexOptions = {}): Promise<DocsIndex> {
  const url = resolveRemoteUrl(opts.remoteUrl);
  const log = opts.log ?? defaultLog;
  const timeoutMs = opts.timeoutMs ?? 3000;
  const doFetch = opts.fetchImpl ?? fetch;

  if (url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await doFetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const parsed = normalizeIndex(await res.json());
      cached = parsed;
      log(
        `fetched docs index from ${url} (components=${parsed.components.length}, guides=${parsed.guides.length})`,
      );
      return parsed;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log(`remote index fetch failed (${url}): ${message} — falling back to bundled snapshot`);
      // fall through to bundled
    } finally {
      clearTimeout(timer);
    }
  }

  return loadIndex();
}
