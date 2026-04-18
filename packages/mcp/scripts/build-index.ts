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

// 第一段非空、非 JSX 的正文视作 description；最多裁到 240 字符，保留一个自然结尾。
function extractDescription(mdx: string): string {
  const normalized = mdx.replace(/\r\n/g, '\n');
  // 去掉第一个一级标题之后再找段落。
  const afterH1 = normalized.replace(/^#\s+.+?\n/, '');
  const blocks = afterH1.split(/\n\s*\n/);
  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;
    if (/^[#<>`]/.test(block)) continue; // 跳过下一个 heading / JSX / 代码块
    // 合并软换行并移除 markdown 反引号标记，保留其它字面。
    const collapsed = block.replace(/\s*\n\s*/g, ' ').replace(/`([^`]+)`/g, '$1');
    if (collapsed.length <= 240) return collapsed;
    const sliced = collapsed.slice(0, 240);
    const lastStop = Math.max(sliced.lastIndexOf('。'), sliced.lastIndexOf('. '));
    return lastStop > 120 ? `${sliced.slice(0, lastStop + 1).trim()}` : `${sliced.trim()}…`;
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
