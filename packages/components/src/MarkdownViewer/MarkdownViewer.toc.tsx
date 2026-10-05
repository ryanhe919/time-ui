/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @description MarkdownViewer 的目录侧栏 + 滚动监听。
 *
 *   设计要点：
 *   - TOC 节点直接由 markdown 源解析得出，不依赖 DOM —— 这样在 SSR / 首次
 *     paint 都能正确呈现，避免 "TOC 闪烁" 的问题。
 *   - 滚动高亮通过 IntersectionObserver 监听内容容器内的 `<h*>`，root 即
 *     滚动容器（由 caller 传入）。
 *   - 点击 TOC 项使用平滑滚动到对应 heading；honor `prefers-reduced-motion`。
 */

import { useEffect, useState, type MutableRefObject, type ReactElement } from 'react';
import { css, useTheme } from '@emotion/react';
import type {} from '@timeui/themes';

import type { MarkdownTocItem } from './MarkdownViewer.types';
import { getMarkdownAnchorTarget, scrollToMarkdownHeading } from './MarkdownViewer.scroll';

// ─── slug ─────────────────────────────────────────────────────────────────────

/**
 * Github-flavored 简化 slugger：保留 unicode 字母数字与连字符，空白合并为 `-`。
 *
 * 与 react-markdown 的 `<h*>` 自定义渲染器使用的 slug 生成必须保持一致，
 * 才能让点击 TOC 找到正确的滚动目标 id。
 */
export function baseSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]+/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 创建一个带去重计数的 slugger —— 同名 heading 会得到 `foo`、`foo-1`、`foo-2`...
 * 渲染端与目录端各自调一次（按相同顺序遍历），结果保证一致。
 */
export function createSlugger(): (text: string) => string {
  const counts = new Map<string, number>();
  return (text: string): string => {
    const base = baseSlug(text) || 'section';
    const used = counts.get(base) ?? 0;
    counts.set(base, used + 1);
    return used === 0 ? base : `${base}-${used}`;
  };
}

// ─── parse ────────────────────────────────────────────────────────────────────

/**
 * 从 markdown 源中扫出标题。会跳过：
 *   - fenced 代码块 (``` ... ```)
 *   - YAML frontmatter (`---` ... `---`，仅当出现在第一行)
 *
 * 故意只用正则而不引入 remark：TOC 列表只关心标题文本，不需要完整 AST，
 * 减少 SSR / 浏览器路径的开销。
 */
export function extractHeadings(markdown: string, maxDepth: number): MarkdownTocItem[] {
  const lines = markdown.split('\n');
  const slugger = createSlugger();
  const items: MarkdownTocItem[] = [];

  let fence: { marker: string; length: number } | null = null;
  let inFrontmatter = false;

  /** 清洗 markdown 标题里常见的 inline 装饰（不影响 slug 与展示文本）。 */
  const cleanInline = (raw: string) =>
    raw
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/~~([^~]+)~~/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .trim();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';

    // YAML frontmatter（仅在文件最开头，由 `---` 包围）
    if (i === 0 && /^---\s*$/.test(line)) {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter) {
      if (/^---\s*$/.test(line)) inFrontmatter = false;
      continue;
    }

    // fenced code block
    const fenceMatch = /^\s{0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      if (
        fenceMatch &&
        fenceMatch[1]![0] === fence.marker &&
        fenceMatch[1]!.length >= fence.length &&
        fenceMatch[2]!.trim() === ''
      ) {
        fence = null;
      }
      continue;
    }
    if (fenceMatch && !(fenceMatch[1]![0] === '`' && fenceMatch[2]!.includes('`'))) {
      fence = { marker: fenceMatch[1]![0]!, length: fenceMatch[1]!.length };
      continue;
    }

    // ATX 标题（# / ## / ...）
    const atx = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (atx) {
      const level = atx[1]!.length;
      if (level > maxDepth) continue;
      const text = cleanInline(atx[2]!);
      items.push({ id: slugger(text), level, text, line: i + 1 });
      continue;
    }

    // setext 标题：当前行为非空文本，下一行为 `===` (h1) 或 `---` (h2)。
    // CommonMark：`---` 紧跟非空文本视作 setext，不再视作 thematic break。
    const next = lines[i + 1] ?? '';
    const isSetextH1 = /^\s{0,3}=+\s*$/.test(next);
    const isSetextH2 = /^\s{0,3}-+\s*$/.test(next);
    if ((isSetextH1 || isSetextH2) && line.trim() !== '') {
      const level = isSetextH1 ? 1 : 2;
      if (level <= maxDepth) {
        const text = cleanInline(line.trim());
        items.push({ id: slugger(text), level, text, line: i + 1 });
      }
      i += 1; // 吃掉 underline 行
      continue;
    }
  }

  return items;
}

// ─── render ───────────────────────────────────────────────────────────────────

export interface MarkdownViewerTocProps {
  items: MarkdownTocItem[];
  /** 滚动容器 ref —— 用作 IntersectionObserver 的 root，也用作 `scrollTo` 目标。 */
  scrollContainerRef: MutableRefObject<HTMLDivElement | null>;
  /** 内容根 ref —— heading 元素都在它里面。 */
  contentRef: MutableRefObject<HTMLDivElement | null>;
  ariaLabel?: string;
  className?: string;
}

export function MarkdownViewerToc(props: MarkdownViewerTocProps): ReactElement | null {
  const {
    items,
    scrollContainerRef,
    contentRef,
    ariaLabel = 'Table of contents',
    className,
  } = props;
  const theme = useTheme();
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  // 当 items 变化（即 markdown 内容变化）时，重置 activeId 到首项
  useEffect(() => {
    setActiveId(items[0]?.id ?? null);
  }, [items]);

  // IntersectionObserver — 监视所有 TOC 关心的 heading；root 用滚动容器。
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    const container = contentRef.current;
    if (!container) return;
    if (items.length === 0) return;

    const headings = items
      .map((it) => container.querySelector<HTMLElement>(`#${CSS.escape(it.id)}`))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    // 维护"当前已交叉"集合，按文档顺序选取最靠前的一项作为 active —— 比"取
    // 第一个 entry.isIntersecting" 更稳定（多项同时进入 / 离开视口时不抖动）。
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        const firstVisible = headings.find((h) => visible.has(h.id));
        if (firstVisible) {
          setActiveId(firstVisible.id);
        }
      },
      {
        root: scrollContainerRef.current,
        // 把 viewport 顶部 10%、底部 60% 排除在外 —— 让"中段可见"的标题胜出。
        rootMargin: '-10% 0px -60% 0px',
        threshold: [0, 1],
      },
    );

    for (const h of headings) observer.observe(h);
    return () => observer.disconnect();
  }, [items, contentRef, scrollContainerRef]);

  if (items.length === 0) return null;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    const target = getMarkdownAnchorTarget(contentRef.current, id);
    if (!target) return;

    setActiveId(id);

    scrollToMarkdownHeading(scrollContainerRef.current, target);
  };

  // Find the shallowest level so we anchor depth 0 at it (h2-only docs still
  // start flush left; mixed h1/h2 docs get an additional indent step).
  const minLevel = items.reduce((acc, it) => Math.min(acc, it.level), 6);

  const isDark = theme.mode === 'dark';
  const scrollbarThumbIdle = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.18)';
  const scrollbarThumbHover = isDark ? 'rgba(255, 255, 255, 0.32)' : 'rgba(0, 0, 0, 0.32)';

  // Defensive resets via `!important` —— TOC may live inside a host that
  // sprays prose styles onto every `<ul>` / `<li>` / `<a>` (Tailwind prose,
  // docs editorial CSS, etc.). The component must look correct regardless.
  // Narrow readers keep a bounded TOC above the independently scrolling body.
  const navCss = css`
    flex: 0 0 220px;
    min-width: 0;
    align-self: flex-start;
    position: sticky;
    top: 0;
    max-height: 100%;
    overflow-y: auto;
    padding: 4px 0 4px 16px;
    border-inline-start: 1px solid ${theme.colors.border.subtle};
    font-family: ${theme.typography.fontFamily.sans};
    font-size: ${theme.typography.fontSize.sm};
    color: ${theme.colors.text.secondary};

    @container timeui-markdown-viewer (max-width: 640px) {
      order: -1;
      flex: 0 0 auto;
      align-self: stretch;
      max-height: ${theme.spacing[40]};
      padding: ${theme.spacing[3]} ${theme.spacing[4]};
      border-inline-start: 0;
      border-bottom: 1px solid ${theme.colors.border.subtle};
    }

    /* hover-only thin scrollbar，与正文滚动区一致。 */
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
    transition: scrollbar-color 200ms ease;
    &:hover,
    &:focus-within {
      scrollbar-color: ${scrollbarThumbIdle} transparent;
    }
    &::-webkit-scrollbar {
      width: 8px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: transparent;
      border-radius: 999px;
      border: 2px solid transparent;
      background-clip: content-box;
      transition: background-color 200ms ease;
    }
    &:hover::-webkit-scrollbar-thumb,
    &:focus-within::-webkit-scrollbar-thumb {
      background-color: ${scrollbarThumbIdle};
    }
    &::-webkit-scrollbar-thumb:hover {
      background-color: ${scrollbarThumbHover};
    }
    @media (prefers-reduced-motion: reduce) {
      transition: none;
      &::-webkit-scrollbar-thumb {
        transition: none;
      }
    }

    /* host-style isolation —— neutralise outer ul/li/a treatments. */
    ul,
    ol,
    li {
      list-style: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    li {
      position: static !important;
    }
    li::before,
    li::after {
      content: none !important;
      display: none !important;
    }
    a {
      background: none !important;
      background-image: none !important;
      padding-bottom: 0 !important;
      text-decoration: none !important;
    }
  `;

  const headingCss = css`
    font-size: 11px;
    font-weight: ${theme.typography.fontWeight.semibold};
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${theme.colors.text.muted};
    margin: 0 0 8px;
    padding: 0 8px;
    line-height: 1.4;
  `;

  const itemAnchorCss = (isActive: boolean, depth: number) => {
    const indentStep = Math.max(0, depth - minLevel);
    return css`
      position: relative;
      display: block;
      padding: 5px 10px 5px ${10 + indentStep * 12}px;
      color: ${isActive ? theme.colors.text.primary : theme.colors.text.secondary};
      font-weight: ${isActive
        ? theme.typography.fontWeight.semibold
        : theme.typography.fontWeight.regular};
      line-height: 1.45;
      border-radius: ${theme.radius.sm};
      transition:
        color 120ms ease,
        background 120ms ease;
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }

      /* Active accent bar — sits flush against nav's inline-start border.
         Use logical property so RTL flips with the layout. -17px = 16px nav
         padding + 1px border width. */
      &::before {
        content: '';
        position: absolute;
        inset-inline-start: -17px;
        top: 6px;
        bottom: 6px;
        width: 2px;
        border-radius: 1px;
        background: ${isActive ? theme.colors.primary[500] : 'transparent'};
        transition: background 120ms ease;
      }

      &:hover {
        color: ${theme.colors.text.primary};
        background: ${theme.colors.bg.muted};
      }
      &:focus-visible {
        outline: 2px solid ${theme.colors.focus};
        outline-offset: -2px;
      }
    `;
  };

  return (
    <nav aria-label={ariaLabel} className={className} css={navCss}>
      {/* aria-hidden: nav already exposes ariaLabel — avoid double announcement. */}
      <div css={headingCss} aria-hidden>
        {ariaLabel}
      </div>
      <ul>
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                aria-current={isActive ? 'location' : undefined}
                css={itemAnchorCss(isActive, item.level)}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

MarkdownViewerToc.displayName = 'MarkdownViewerToc';
