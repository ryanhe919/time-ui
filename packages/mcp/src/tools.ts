/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 纯函数工具集：面向 MCP server 与前端 API route 的共享查询接口。无副作用、不依赖 MCP SDK。
 */

import { loadIndex, type GuideEntry, type PageTranslation, type Locale } from './data';

export interface ToolLocale {
  locale?: Locale;
}

export interface CategorySummary {
  slug: string;
  label: string;
  componentCount: number;
}

export interface ComponentSummary {
  slug: string;
  title: string;
  description: string;
  category: string;
  href: string;
}

export interface ComponentDetail {
  slug: string;
  title: string;
  category: string;
  description: string;
  content: string;
  examples: { code: string }[];
  href: string;
}

export interface SearchHit {
  slug: string;
  title: string;
  description: string;
  /** 命中关键词附近的上下文片段，便于 LLM 决定是否展开详情。 */
  snippet: string;
  score: number;
  href: string;
}

const DEFAULT_LOCALE: Locale = 'zh';

function resolveLocale(opts: ToolLocale | undefined): Locale {
  return opts?.locale ?? DEFAULT_LOCALE;
}

function translationOf(
  entry: { translations: Record<Locale, PageTranslation> },
  locale: Locale,
): PageTranslation {
  // 缺失 locale 时回落到 zh，避免出现 undefined。
  return entry.translations[locale] ?? entry.translations.zh;
}

/** 列出所有分类 + 每个分类下的组件数（按声明顺序返回）。 */
export function listCategories(opts?: ToolLocale): CategorySummary[] {
  const locale = resolveLocale(opts);
  const index = loadIndex();
  const counts = new Map<string, number>();
  for (const c of index.components) {
    counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  }
  return index.categories[locale].map((cat) => ({
    slug: cat.slug,
    label: cat.label,
    componentCount: counts.get(cat.slug) ?? 0,
  }));
}

/** 列出组件简介；支持按 category 过滤。 */
export function listComponents(opts?: ToolLocale & { category?: string }): ComponentSummary[] {
  const locale = resolveLocale(opts);
  const index = loadIndex();
  const filtered = opts?.category
    ? index.components.filter((c) => c.category === opts.category)
    : index.components;
  return filtered.map((entry) => {
    const t = translationOf(entry, locale);
    return {
      slug: entry.slug,
      title: t.title,
      description: t.description,
      category: entry.category,
      href: t.href,
    };
  });
}

/** 读取单个组件的详情；未找到返回 null。 */
export function getComponent(opts: ToolLocale & { slug: string }): ComponentDetail | null {
  const locale = resolveLocale(opts);
  const index = loadIndex();
  const entry = index.components.find((c) => c.slug === opts.slug);
  if (!entry) return null;
  const t = translationOf(entry, locale);
  return {
    slug: entry.slug,
    title: t.title,
    category: entry.category,
    description: t.description,
    content: t.content,
    examples: t.examples.map((e) => ({ code: e.code })),
    href: t.href,
  };
}

// 粗粒度 token 切分：按空白与标点拆；保留 CJK 字符作为独立单字 token（匹配"按钮"这类词根）。
function tokenize(input: string): string[] {
  const lowered = input.toLowerCase();
  const words = lowered.split(/[\s,.;:!?()[\]{}<>"'`/\\|+*=~@#$%^&…—–-]+/u).filter(Boolean);
  // 进一步将长 CJK 段落打散为单字，让中英混合 query 能命中中文标题。
  const out: string[] = [];
  for (const w of words) {
    if (/[\u4e00-\u9fff]/.test(w)) {
      for (const ch of w) out.push(ch);
    } else {
      out.push(w);
    }
  }
  return out;
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  let count = 0;
  let from = 0;
  while (true) {
    const idx = h.indexOf(n, from);
    if (idx < 0) break;
    count += 1;
    from = idx + n.length;
  }
  return count;
}

// 围绕第一个命中位置切出 ~140 字符窗口，避免 LLM 读整篇 content。
function buildSnippet(content: string, tokens: string[]): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  const lower = normalized.toLowerCase();
  let hitAt = -1;
  for (const tk of tokens) {
    const idx = lower.indexOf(tk);
    if (idx >= 0) {
      hitAt = idx;
      break;
    }
  }
  const window = 140;
  if (hitAt < 0) return normalized.slice(0, window);
  const start = Math.max(0, hitAt - Math.floor(window / 2));
  const end = Math.min(normalized.length, start + window);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < normalized.length ? '…' : '';
  return `${prefix}${normalized.slice(start, end)}${suffix}`;
}

/**
 * 简单 token 计分：title +10、description +5、content +1，大小写不敏感。
 * 不引第三方搜索库，保持包足够小、可随 npm 静态发布。
 */
export function searchComponents(
  opts: ToolLocale & { query: string; limit?: number },
): SearchHit[] {
  const locale = resolveLocale(opts);
  const index = loadIndex();
  const tokens = tokenize(opts.query);
  if (tokens.length === 0) return [];
  const limit = Math.max(1, Math.min(opts.limit ?? 10, 50));

  const hits: SearchHit[] = [];
  for (const entry of index.components) {
    const t = translationOf(entry, locale);
    let score = 0;
    for (const tk of tokens) {
      score += countOccurrences(t.title, tk) * 10;
      score += countOccurrences(t.description, tk) * 5;
      score += countOccurrences(t.content, tk) * 1;
    }
    if (score <= 0) continue;
    hits.push({
      slug: entry.slug,
      title: t.title,
      description: t.description,
      snippet: buildSnippet(t.content || t.description, tokens),
      score,
      href: t.href,
    });
  }

  // 分数相同时 title 字典序稳定排序，便于测试。
  hits.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
  return hits.slice(0, limit);
}

// =============================================================================
// Guides 工具集（getting-started / chat 等顶层 section 下的指南页）。结构镜像
// 上面的 components 4 件套；之所以拆开，是为了让 LLM 在用户描述意图时能选择
// 更窄的工具：问"按钮怎么用"走 search_components，问"怎么安装"走 search_guides。
// =============================================================================

export interface SectionSummary {
  slug: string;
  label: string;
  guideCount: number;
}

export interface GuideSummary {
  slug: string;
  title: string;
  description: string;
  section: string;
  href: string;
}

export interface GuideDetail extends GuideSummary {
  content: string;
  examples: { code: string }[];
}

export interface GuideSearchHit extends GuideSummary {
  snippet: string;
  score: number;
}

/** 列出所有指南 section（getting-started / chat / ...）+ 每个 section 下的 guide 数量。 */
export function listSections(opts?: ToolLocale): SectionSummary[] {
  const locale = resolveLocale(opts);
  const index = loadIndex();
  const counts = new Map<string, number>();
  for (const g of index.guides) {
    counts.set(g.section, (counts.get(g.section) ?? 0) + 1);
  }
  return index.sections[locale].map((s) => ({
    slug: s.slug,
    label: s.label,
    guideCount: counts.get(s.slug) ?? 0,
  }));
}

/** 列出所有指南页；可选按 section 过滤（slug，例如 'getting-started' / 'chat'）。 */
export function listGuides(opts?: ToolLocale & { section?: string }): GuideSummary[] {
  const locale = resolveLocale(opts);
  const index = loadIndex();
  const filtered: GuideEntry[] = opts?.section
    ? index.guides.filter((g) => g.section === opts.section)
    : index.guides;
  return filtered.map((entry) => {
    const t = translationOf(entry, locale);
    return {
      slug: entry.slug,
      title: t.title,
      description: t.description,
      section: entry.section,
      href: t.href,
    };
  });
}

/** 读取单个指南页的全文与示例；slug 不命中返回 null。 */
export function getGuide(opts: ToolLocale & { slug: string }): GuideDetail | null {
  const locale = resolveLocale(opts);
  const index = loadIndex();
  const entry = index.guides.find((g) => g.slug === opts.slug);
  if (!entry) return null;
  const t = translationOf(entry, locale);
  return {
    slug: entry.slug,
    section: entry.section,
    title: t.title,
    description: t.description,
    content: t.content,
    examples: t.examples.map((e) => ({ code: e.code })),
    href: t.href,
  };
}

/** 仅在 guides 集合内做 token 打分；评分模型与 searchComponents 一致。 */
export function searchGuides(
  opts: ToolLocale & { query: string; limit?: number },
): GuideSearchHit[] {
  const locale = resolveLocale(opts);
  const index = loadIndex();
  const tokens = tokenize(opts.query);
  if (tokens.length === 0) return [];
  const limit = Math.max(1, Math.min(opts.limit ?? 10, 50));

  const hits: GuideSearchHit[] = [];
  for (const entry of index.guides) {
    const t = translationOf(entry, locale);
    let score = 0;
    for (const tk of tokens) {
      score += countOccurrences(t.title, tk) * 10;
      score += countOccurrences(t.description, tk) * 5;
      score += countOccurrences(t.content, tk) * 1;
    }
    if (score <= 0) continue;
    hits.push({
      slug: entry.slug,
      title: t.title,
      description: t.description,
      section: entry.section,
      snippet: buildSnippet(t.content || t.description, tokens),
      score,
      href: t.href,
    });
  }

  hits.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
  return hits.slice(0, limit);
}
