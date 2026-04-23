/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 构建 docs 下所有组件 mdx 的静态索引，输出到 data/index.json 与 apps/docs/public/assistant-index.json。
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 直接复用 docs 中的单一事实源，避免在 mcp 包里镜像一份分类定义出现 drift。
// docs-i18n 里对 Locale 只是 `import type`，tsx 擦除后无运行时引用，
// 所以不需要让 `@timeui/mcp` 依赖 `@timeui/react`。
import * as navigationMod from '../../../apps/docs/src/lib/navigation.ts';
import * as i18nMod from '../../../apps/docs/src/lib/docs-i18n.ts';

type Locale = 'zh' | 'en';
const LOCALES: readonly Locale[] = ['zh', 'en'] as const;

interface NavigationModule {
  getNavigation: (locale: string) => {
    sections: {
      slug: string;
      groups?: { slug: string; items: { slug: string }[] }[];
    }[];
  };
}

interface DocsI18nModule {
  getDocsMessages: (locale: Locale) => {
    groups: Record<string, string>;
    pages: Record<string, string>;
  };
}

// tsx 对 apps/docs 下的 .ts（无 "type":"module"）按 CJS 加载，
// ESM 侧 namespace 仅暴露 `default`，命名导出全在 default 下面。
// 这里做 CJS/ESM 双兼容 interop。
const navResolved = (navigationMod as { default?: unknown }).default ?? navigationMod;
const i18nResolved = (i18nMod as { default?: unknown }).default ?? i18nMod;
const { getNavigation } = navResolved as NavigationModule;
const { getDocsMessages } = i18nResolved as DocsI18nModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// packages/mcp/scripts → packages/mcp → packages → repo root
const PKG_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PKG_ROOT, '..', '..');
const DOCS_COMPONENTS_ROOT = path.resolve(REPO_ROOT, 'apps/docs/src/app/[locale]/docs/components');
const OUT_FULL = path.resolve(PKG_ROOT, 'data/index.json');
const OUT_PUBLIC = path.resolve(REPO_ROOT, 'apps/docs/public/assistant-index.json');

interface ExampleEntry {
  code: string;
}

interface ComponentTranslation {
  title: string;
  description: string;
  content: string;
  examples: ExampleEntry[];
  href: string;
}

interface ComponentEntry {
  slug: string;
  category: string;
  translations: Record<Locale, ComponentTranslation>;
}

interface CategoryEntry {
  slug: string;
  label: string;
}

interface DocsIndex {
  generatedAt: string;
  categories: Record<Locale, CategoryEntry[]>;
  components: ComponentEntry[];
}

// 通过 navigation 的 groups 建 slug→category + 保留 groups 的顺序。
function buildComponentsLayout(): {
  categories: { slug: string; slugs: string[] }[];
  slugToCategory: Map<string, string>;
} {
  const nav = getNavigation('zh');
  const components = nav.sections.find((s) => s.slug === 'components');
  const categories: { slug: string; slugs: string[] }[] = [];
  const slugToCategory = new Map<string, string>();
  if (!components?.groups) return { categories, slugToCategory };
  for (const g of components.groups) {
    const slugs = g.items.map((it) => it.slug);
    categories.push({ slug: g.slug, slugs });
    for (const s of slugs) slugToCategory.set(s, g.slug);
  }
  return { categories, slugToCategory };
}

// 提取第一个一级标题行（`# ...`），作为页面标题；缺失时回落到 docs-i18n.pages。
function extractTitle(mdx: string, fallback: string): string {
  const lines = mdx.split(/\r?\n/);
  for (const line of lines) {
    const m = /^#\s+(.+?)\s*$/.exec(line);
    if (m && m[1]) return m[1].trim();
  }
  return fallback;
}

// 第一段非空、非 JSX / 非 import / 非代码块的正文视作 description。
// 最多裁到 240 字符；会尝试把"后接列表的引导句"与第一条列表项合并，避免以冒号截断。
const DESC_MAX = 240;

// 把一段 markdown 文字里的常见语法剥干净，保留对 LLM 的自然可读性。
// - 反引号 `foo` → foo
// - 粗体 **foo** / __foo__ → foo
// - 斜体 *foo* / _foo_ → foo（仅在两侧都是非空白时，避免把列表项的 "- " 当斜体处理）
// - 链接 [text](url) → text
// - 图片 ![alt](url) → alt
// - 行内 JSX 标签（尖括号包围的单个 token）全部移除，保留其间文字。
function stripInlineMarkdown(text: string): string {
  let s = text;
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  s = s.replace(/`([^`]+)`/g, '$1');
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/__([^_]+)__/g, '$1');
  s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, '$1$2');
  s = s.replace(/(^|[^_\w])_([^_\s][^_]*?)_(?!_)/g, '$1$2');
  // 合并多空格并裁剪（保留内联尖括号文字，如 <select> / <FormField> 作为字面量上下文）。
  return s.replace(/\s+/g, ' ').trim();
}

// 把一段话在预算内截到最后一个句末标点；否则加省略号。
// 优先选择**预算内**最靠后的完整句末，哪怕只是第一句——完整句子永远比半截词+"…"更可读。
function clampToSentence(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const sliced = text.slice(0, limit);
  const lastStop = Math.max(
    sliced.lastIndexOf('。'),
    sliced.lastIndexOf('！'),
    sliced.lastIndexOf('？'),
    sliced.lastIndexOf('. '),
    sliced.lastIndexOf('! '),
    sliced.lastIndexOf('? '),
  );
  if (lastStop > 0) {
    return sliced.slice(0, lastStop + 1).trim();
  }
  return `${sliced.trim()}…`;
}

function endsWithColon(text: string): boolean {
  const t = text.trimEnd();
  return t.endsWith(':') || t.endsWith('：');
}

// 回退策略：当引导句无法与列表合并时，把正文回退到**冒号之前**最近一个完整句末标点。
function trimToLastSentenceBefore(text: string): string | null {
  const t = text.trimEnd().replace(/[:：]\s*$/, '');
  const lastStop = Math.max(
    t.lastIndexOf('。'),
    t.lastIndexOf('！'),
    t.lastIndexOf('？'),
    t.lastIndexOf('. '),
    t.lastIndexOf('! '),
    t.lastIndexOf('? '),
    t.endsWith('.') ? t.length - 1 : -1,
  );
  if (lastStop <= 0) return null;
  const ch = t.charAt(lastStop);
  if (ch === '。' || ch === '！' || ch === '？') return t.slice(0, lastStop + 1).trim();
  return t.slice(0, lastStop + 1).trim();
}

// 把 "- item" / "* item" / "1. item" 的所有顶层条目抽出来做正文补齐用。
function listItemTexts(block: string): string[] {
  const lines = block.split('\n');
  const out: string[] = [];
  for (const line of lines) {
    const m = /^(?:[-*+]|\d+\.)\s+(.+)$/.exec(line);
    if (m && m[1]) out.push(m[1].trim());
  }
  return out;
}

// 判断一个 block 是否为"内容段落"（不是 heading / fenced code / JSX / import / 列表 / 表格等）。
function isProseBlock(block: string): boolean {
  if (!block) return false;
  if (/^#{1,6}\s/.test(block)) return false; // heading
  if (/^```/.test(block)) return false; // fenced code
  if (/^<[A-Za-z]/.test(block)) return false; // JSX 起始
  if (/^(?:import|export)\s/.test(block)) return false;
  if (/^>\s/.test(block)) return false; // blockquote
  if (/^\s*(?:[-*+]|\d+\.)\s/.test(block)) return false; // 列表
  if (/^\s*\|/.test(block)) return false; // 表格
  return true;
}

function extractDescription(mdx: string): string {
  const normalized = mdx.replace(/\r\n/g, '\n');
  // 1) 过滤顶部的 import / export 行，直到遇到第一个非 import 行。
  const lines = normalized.split('\n');
  let startIdx = 0;
  for (; startIdx < lines.length; startIdx += 1) {
    const l = lines[startIdx]!.trim();
    if (l === '') continue;
    if (/^(?:import|export)\s/.test(l)) continue;
    break;
  }
  // 2) 跳过第一个一级标题。
  while (startIdx < lines.length && lines[startIdx]!.trim() === '') startIdx += 1;
  if (startIdx < lines.length && /^#\s+/.test(lines[startIdx]!)) startIdx += 1;

  // 3) 剥离 fenced code block，避免内部 ``` 里的文字混入。
  const body: string[] = [];
  let inFence = false;
  for (let i = startIdx; i < lines.length; i += 1) {
    const l = lines[i]!;
    if (/^```/.test(l.trim())) {
      inFence = !inFence;
      body.push('');
      continue;
    }
    if (inFence) continue;
    body.push(l);
  }

  const blocks = body.join('\n').split(/\n\s*\n/);
  for (let i = 0; i < blocks.length; i += 1) {
    const raw = blocks[i]!.trim();
    if (!isProseBlock(raw)) continue;
    // 合并软换行 → 单行。
    const collapsedRaw = raw.replace(/\s*\n\s*/g, ' ');
    const cleaned = stripInlineMarkdown(collapsedRaw);
    if (!cleaned) continue;

    // 以冒号结尾且下一块是列表 → 这是引导句，尝试合并后续列表项。
    if (endsWithColon(cleaned)) {
      const next = blocks[i + 1]?.trim() ?? '';
      const items = /^(?:[-*+]|\d+\.)\s/.test(next) ? listItemTexts(next) : [];
      if (items.length > 0) {
        let merged = cleaned;
        let appended = 0;
        for (const it of items) {
          const candidate = `${merged} ${stripInlineMarkdown(it)}`.trim();
          if (candidate.length > DESC_MAX) break;
          merged = candidate;
          appended += 1;
        }
        if (appended > 0) return clampToSentence(merged, DESC_MAX);
      }
      // 没列表可借 / 条目塞不进预算：退而求其次，回退到冒号前最近的句末标点。
      const trimmedBack = trimToLastSentenceBefore(cleaned);
      if (trimmedBack) return clampToSentence(trimmedBack, DESC_MAX);
      // 实在找不到完整句子，继续找下一个真正的 prose 段落。
      continue;
    }

    return clampToSentence(cleaned, DESC_MAX);
  }
  return '';
}

// 匹配 <LiveDemo ... code={` ... `} ... >，抓出反引号内的源码。
// 反引号内可能包含 JSX、嵌套花括号与换行，但不会有未转义的反引号。
function extractExamples(mdx: string): ExampleEntry[] {
  const out: ExampleEntry[] = [];
  const re = /<LiveDemo\b[^>]*?\bcode=\{`([\s\S]*?)`\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(mdx)) !== null) {
    const raw = match[1] ?? '';
    // 反转义常见 \` 与 \\ 为字面形式，保持对 LLM 友好。
    const code = raw.replace(/\\`/g, '`').replace(/\\\\/g, '\\');
    out.push({ code });
  }
  return out;
}

// 去除所有 JSX 标签与 LiveDemo 的 code 属性，保留 markdown 正文（供 LLM 检索）。
function extractContent(mdx: string): string {
  let s = mdx.replace(/\r\n/g, '\n');
  // 1) 彻底删掉 LiveDemo 成对块（含内部 code 属性与子节点）。
  s = s.replace(/<LiveDemo\b[\s\S]*?<\/LiveDemo>/g, '');
  // 2) 删掉自闭合的大写标签（例如 <PropsTable ... />）。
  s = s.replace(/<[A-Z][A-Za-z0-9]*\b[^>]*\/>/g, '');
  // 3) 删掉其它成对的大写标签（例如 <Callout>...</Callout>）。
  s = s.replace(/<([A-Z][A-Za-z0-9]*)\b[\s\S]*?<\/\1>/g, '');
  // 4) 压缩连续空行。
  s = s.replace(/\n{3,}/g, '\n\n').trim();
  return s;
}

async function readMdxIfExists(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

function emptyTranslation(slug: string, locale: Locale): ComponentTranslation {
  return {
    title: slug,
    description: '',
    content: '',
    examples: [],
    href: `/${locale}/docs/components/${slug}`,
  };
}

async function main(): Promise<void> {
  const { categories: catLayout, slugToCategory } = buildComponentsLayout();
  if (catLayout.length === 0) {
    throw new Error('navigation: `components` section missing groups');
  }

  const componentSlugs: string[] = [];
  for (const c of catLayout) {
    for (const s of c.slugs) componentSlugs.push(s);
  }

  const components: ComponentEntry[] = [];
  for (const slug of componentSlugs) {
    const category = slugToCategory.get(slug) ?? 'uncategorized';
    const translations: Record<Locale, ComponentTranslation> = {
      zh: emptyTranslation(slug, 'zh'),
      en: emptyTranslation(slug, 'en'),
    };

    for (const locale of LOCALES) {
      const file = path.join(DOCS_COMPONENTS_ROOT, slug, `${locale}.mdx`);
      const mdx = await readMdxIfExists(file);
      if (!mdx) {
        // 没有对应 locale 文档时保留 empty shell，页面标题回落到 i18n 词典。
        continue;
      }
      const fallbackTitle = getDocsMessages(locale).pages[slug] ?? slug;
      translations[locale] = {
        title: extractTitle(mdx, fallbackTitle),
        description: extractDescription(mdx),
        content: extractContent(mdx),
        examples: extractExamples(mdx),
        href: `/${locale}/docs/components/${slug}`,
      };
    }

    components.push({ slug, category, translations });
  }

  // 分类清单按每个 locale 独立构造，顺序沿用 navigation 的声明顺序。
  const categories: Record<Locale, CategoryEntry[]> = { zh: [], en: [] };
  for (const c of catLayout) {
    for (const locale of LOCALES) {
      const messages = getDocsMessages(locale);
      const label = messages.groups[c.slug] ?? c.slug;
      categories[locale].push({ slug: c.slug, label });
    }
  }

  const index: DocsIndex = {
    generatedAt: new Date().toISOString(),
    categories,
    components,
  };

  await fs.mkdir(path.dirname(OUT_FULL), { recursive: true });
  await fs.mkdir(path.dirname(OUT_PUBLIC), { recursive: true });
  const fullJson = JSON.stringify(index, null, 2);
  await fs.writeFile(OUT_FULL, fullJson, 'utf8');

  // 精简版：去掉冗长的 content 字段以减小前端加载体积；详情仍由 API route 从完整 index 取。
  const lite: DocsIndex = {
    ...index,
    components: index.components.map((c) => ({
      ...c,
      translations: {
        zh: { ...c.translations.zh, content: '' },
        en: { ...c.translations.en, content: '' },
      },
    })),
  };
  const liteJson = JSON.stringify(lite);
  await fs.writeFile(OUT_PUBLIC, liteJson, 'utf8');

  const fullBytes = Buffer.byteLength(fullJson, 'utf8');
  const liteBytes = Buffer.byteLength(liteJson, 'utf8');
  console.log(
    [
      `[build-index] components: ${components.length}`,
      `categories: ${categories.zh.length}`,
      `full: ${OUT_FULL} (${fullBytes} B)`,
      `lite: ${OUT_PUBLIC} (${liteBytes} B)`,
    ].join(' | '),
  );
}

main().catch((err) => {
  console.error('[build-index] failed:', err);
  process.exit(1);
});
