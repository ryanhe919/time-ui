/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @description MarkdownViewer —— 完整 markdown 文档查看器（区别于 ChatMarkdown 的流式片段渲染器）。
 *
 *   职责矩阵：
 *   - 输入：原文字符串（默认） 或 URL（带 AbortController）。
 *   - 渲染：react-markdown + remark-gfm；fenced code 转交内置 `CodeBlock`，
 *     带 shiki 高亮 + 复制按钮（CodeBlock 内部已包办）。
 *   - 排版：阅读型样式集中在 MarkdownViewer.theme.ts。
 *   - 工具条：复制全文 / 下载 .md / URL 模式下的刷新。
 *   - 目录：可选侧栏，TOC 节点直接由源解析（SSR 友好），滚动高亮通过
 *     IntersectionObserver。
 *   - 链接：外链按 `linkTarget` 打开；站内 `#anchor` 在容器内平滑滚动。
 */

import type {} from '@timeui/themes';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { css, useTheme } from '@emotion/react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { CodeBlock } from '../CodeBlock';
import { createMarkdownViewerTypography } from './MarkdownViewer.theme';
import { MarkdownViewerToolbar, DEFAULT_TOOLBAR_LABELS } from './MarkdownViewer.toolbar';
import { MarkdownViewerToc, baseSlug, extractHeadings } from './MarkdownViewer.toc';
import type { MarkdownViewerProps, MarkdownViewerToolbarLabels } from './MarkdownViewer.types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function isExternalHref(href: string): boolean {
  return /^(https?:|mailto:|tel:|ftp:)/i.test(href);
}

function isAnchorHref(href: string): boolean {
  return href.startsWith('#');
}

/**
 * 把 react children 平展回纯文本 —— 给 heading 渲染器用：根据文本生成稳定的
 * slug id。与 ChatMarkdown 中的 `toPlainText` 保持一致行为。
 */
function childrenToText(children: ReactNode): string {
  if (children == null || children === false) return '';
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(childrenToText).join('');
  if (typeof children === 'object' && 'props' in children) {
    const el = children as { props?: { children?: ReactNode } };
    return childrenToText(el.props?.children);
  }
  return '';
}

/** 提取 react-markdown 给 `<code>` 节点的 className 中的语言名（如 `language-ts`）。 */
function extractLanguage(className: string | undefined): string | undefined {
  if (!className) return undefined;
  const m = /language-([\w+#-]+)/.exec(className);
  return m?.[1];
}

function toCssLength(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

// ─── component ────────────────────────────────────────────────────────────────

export const MarkdownViewer = forwardRef<HTMLDivElement, MarkdownViewerProps>(
  function MarkdownViewer(props, forwardedRef): ReactElement {
    const {
      source,
      sourceType = 'content',
      fetchOptions,
      showToolbar = true,
      toolbar,
      toolbarLabels: toolbarLabelOverrides,
      showToc = false,
      tocPosition = 'right',
      tocMaxDepth = 3,
      gfm = true,
      linkTarget = '_blank',
      onLinkClick,
      components: componentOverrides,
      onLoad,
      onError,
      loadingFallback,
      errorFallback,
      maxWidth = '72ch',
      className,
      style,
      id,
      'aria-label': ariaLabel,
      ...rest
    } = props;

    const theme = useTheme();

    // ─── state: markdown / loading / error / refresh nonce ──────────────────
    const [markdown, setMarkdown] = useState<string>(sourceType === 'content' ? source : '');
    const [isLoading, setIsLoading] = useState<boolean>(sourceType === 'url');
    const [error, setError] = useState<Error | null>(null);
    // 递增以触发 url 模式 re-fetch（刷新按钮）。
    const [refreshNonce, setRefreshNonce] = useState(0);

    // 把最新 onLoad / onError 存 ref，避免它们的引用变化重启 fetch。
    const onLoadRef = useRef(onLoad);
    const onErrorRef = useRef(onError);
    useEffect(() => {
      onLoadRef.current = onLoad;
    }, [onLoad]);
    useEffect(() => {
      onErrorRef.current = onError;
    }, [onError]);

    // 内容根 ref（供 TOC 查询 heading 元素）+ 滚动容器 ref（IntersectionObserver root）。
    const contentRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(forwardedRef, () => scrollContainerRef.current as HTMLDivElement, []);

    // ─── effect: content 模式同步 source；url 模式 fetch ─────────────────────
    useEffect(() => {
      if (sourceType !== 'url') {
        setMarkdown(source);
        setIsLoading(false);
        setError(null);
        // content 模式 onLoad 也触发，便于上层统计
        onLoadRef.current?.(source);
        return;
      }
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
      let cancelled = false;
      setIsLoading(true);
      setError(null);

      (async () => {
        try {
          const resp = await fetch(source, { ...fetchOptions, signal: controller?.signal });
          if (!resp.ok) {
            throw new Error(`Failed to fetch markdown (${resp.status} ${resp.statusText})`);
          }
          const text = await resp.text();
          if (cancelled) return;
          setMarkdown(text);
          setIsLoading(false);
          onLoadRef.current?.(text);
        } catch (err) {
          if (cancelled) return;
          // AbortError 在 source / refreshNonce 切换时是预期行为，不暴露给上层。
          if (err instanceof DOMException && err.name === 'AbortError') return;
          if (typeof err === 'object' && err && 'name' in err && err.name === 'AbortError') return;
          const e = err instanceof Error ? err : new Error(String(err));
          setError(e);
          setIsLoading(false);
          onErrorRef.current?.(e);
        }
      })();

      return () => {
        cancelled = true;
        controller?.abort();
      };
      // fetchOptions 故意不进依赖：调用方常以新对象传入会触发 thrash。
      // 上层若需要 header 切换，可改 source 或 sourceType 触发刷新，或用 refresh 按钮。
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source, sourceType, refreshNonce]);

    const handleRefresh = useCallback(() => {
      setRefreshNonce((n) => n + 1);
    }, []);

    // ─── derived: heading id table ───────────────────────────────────────────
    // 一份完整的 (line → id) 映射，由 markdown 源同步推导。SSR / 客户端 hydrate /
    // 后续 re-render 都按行号查表，**绝不**依赖运行时计数器闭包，从根上避免
    // 严格模式 / 并发渲染下"counter 多增一次"导致的 hydration mismatch。
    const allHeadings = useMemo(() => extractHeadings(markdown, 6), [markdown]);
    const headingIdByLine = useMemo(() => {
      const m = new Map<number, string>();
      for (const h of allHeadings) m.set(h.line, h.id);
      return m;
    }, [allHeadings]);

    // ─── derived: TOC items ──────────────────────────────────────────────────
    const tocItems = useMemo(
      () => (showToc ? allHeadings.filter((h) => h.level >= 1 && h.level <= tocMaxDepth) : []),
      [allHeadings, tocMaxDepth, showToc],
    );

    const handleAnchorClick = useCallback(
      (event: MouseEvent<HTMLAnchorElement>) => {
        const a = event.currentTarget;
        const href = a.getAttribute('href') ?? '';
        // 上层拦截器优先：上层调用 preventDefault 即可阻止内置行为。
        onLinkClick?.(href, event);
        if (event.defaultPrevented) return;
        if (!isAnchorHref(href)) return;

        // 站内锚点：阻止默认（避免修改 location.hash），改在内容容器内 scrollIntoView。
        event.preventDefault();
        const targetId = href.slice(1);
        const target = contentRef.current?.querySelector<HTMLElement>(`#${CSS.escape(targetId)}`);
        if (!target) return;

        const reduced =
          typeof window !== 'undefined' &&
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      },
      [onLinkClick],
    );

    const components: Components = useMemo(() => {
      const Heading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
        const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        const HeadingComp = ({
          children,
          node,
          ...rest
        }: ComponentPropsWithoutRef<typeof Tag> & {
          node?: { position?: { start?: { line?: number } } };
        }): ReactElement => {
          // react-markdown 透传的 mdast `node` 携带源码位置信息；按行号查表
          // 拿到与 extractHeadings 一致的 slug id（同一份算法、同一次执行结果）。
          const line = node?.position?.start?.line ?? 0;
          const id = headingIdByLine.get(line);
          // 兜底：如果上层用 `components.h*` 覆盖结构 / 自己塞了 children 又
          // 没有 node 信息，退回到 children 文本生成基础 slug（无去重后缀）。
          const fallbackId = id ?? (baseSlug(childrenToText(children)) || undefined);
          return (
            <Tag id={id ?? fallbackId} {...rest}>
              {children}
            </Tag>
          );
        };
        HeadingComp.displayName = `MarkdownHeading${level}`;
        return HeadingComp;
      };

      const Anchor = ({ href, children, ...rest }: ComponentPropsWithoutRef<'a'>) => {
        const safeHref = href ?? '';
        const external = isExternalHref(safeHref);
        const anchor = isAnchorHref(safeHref);
        const target = anchor ? '_self' : external ? linkTarget : '_self';
        const rel = external && target === '_blank' ? 'noreferrer noopener' : undefined;
        return (
          <a
            href={safeHref}
            target={target === '_self' ? undefined : target}
            rel={rel}
            onClick={handleAnchorClick}
            {...rest}
          >
            {children}
          </a>
        );
      };

      // pre / code 组合：fenced code → CodeBlock；行内 code 走默认 <code>。
      const Pre = ({ children, ...rest }: ComponentPropsWithoutRef<'pre'>): ReactElement => {
        const only = Array.isArray(children) ? children[0] : children;
        if (only && typeof only === 'object' && 'props' in only) {
          const codeEl = only as {
            props?: { className?: string; children?: ReactNode };
          };
          const language = extractLanguage(codeEl.props?.className) ?? 'text';
          const codeText = childrenToText(codeEl.props?.children).replace(/\n$/, '');
          return (
            <CodeBlock
              code={codeText}
              language={language}
              data-slot="markdown-codeblock"
              disableHighlight={language === 'text'}
            />
          );
        }
        return <pre {...rest}>{children}</pre>;
      };

      const base: Components = {
        a: Anchor,
        pre: Pre,
        h1: Heading(1),
        h2: Heading(2),
        h3: Heading(3),
        h4: Heading(4),
        h5: Heading(5),
        h6: Heading(6),
      };
      return { ...base, ...(componentOverrides ?? {}) };
    }, [componentOverrides, linkTarget, handleAnchorClick, headingIdByLine]);

    // ─── labels ──────────────────────────────────────────────────────────────
    const labels: MarkdownViewerToolbarLabels = useMemo(
      () => ({ ...DEFAULT_TOOLBAR_LABELS, ...(toolbarLabelOverrides ?? {}) }),
      [toolbarLabelOverrides],
    );

    // ─── styles ──────────────────────────────────────────────────────────────
    const typographyCss = useMemo(() => createMarkdownViewerTypography(theme), [theme]);

    const wrapperCss = css`
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      border: 1px solid ${theme.colors.border.subtle};
      border-radius: ${theme.componentRadius.md};
      background: ${theme.colors.bg.surface};
      color: ${theme.colors.text.primary};
      overflow: hidden;
    `;

    const bodyCss = css`
      display: flex;
      flex-direction: ${tocPosition === 'left' ? 'row-reverse' : 'row'};
      min-height: 0;
      flex: 1 1 auto;
    `;

    // 细滚动条：默认透明，hover / 滚动期内才浮现；theme-aware；Firefox 走标准属性。
    const isDark = theme.mode === 'dark';
    const scrollbarThumbIdle = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.18)';
    const scrollbarThumbHover = isDark ? 'rgba(255, 255, 255, 0.32)' : 'rgba(0, 0, 0, 0.32)';

    const scrollCss = css`
      flex: 1 1 auto;
      min-width: 0;
      overflow: auto;
      padding: 1.25em 1.5em;

      /* Firefox：细条 + 半透明色，无 hover state，但视觉一致。 */
      scrollbar-width: thin;
      scrollbar-color: transparent transparent;
      transition: scrollbar-color 200ms ease;

      &:hover,
      &:focus-within {
        scrollbar-color: ${scrollbarThumbIdle} transparent;
      }

      /* WebKit：默认完全隐藏轨道；hover 时浮现 thumb，悬停在 thumb 上加深。 */
      &::-webkit-scrollbar {
        width: 8px;
        height: 8px;
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
      &::-webkit-scrollbar-corner {
        background: transparent;
      }

      @media (prefers-reduced-motion: reduce) {
        transition: none;
        &::-webkit-scrollbar-thumb {
          transition: none;
        }
      }
    `;

    const innerMaxWidthCss = css`
      max-width: ${toCssLength(maxWidth) ?? '72ch'};
      margin: 0 auto;
    `;

    // ─── content body: loading / error / markdown ────────────────────────────
    const renderBody = (): ReactElement => {
      if (isLoading) {
        if (loadingFallback !== undefined) {
          return <div data-slot="markdown-loading">{loadingFallback}</div>;
        }
        return (
          <div
            data-slot="markdown-loading"
            css={css`
              display: flex;
              align-items: center;
              gap: 8px;
              color: ${theme.colors.text.muted};
              padding: 0.5em 0;
              font-size: ${theme.typography.fontSize.sm};
            `}
          >
            <span
              aria-hidden
              css={css`
                width: 14px;
                height: 14px;
                border-radius: 50%;
                border: 2px solid ${theme.colors.border.default};
                border-top-color: ${theme.colors.primary[500]};
                animation: timeui-md-spin 0.7s linear infinite;
                @media (prefers-reduced-motion: reduce) {
                  animation: none;
                }
                @keyframes timeui-md-spin {
                  to {
                    transform: rotate(360deg);
                  }
                }
              `}
            />
            <span>Loading…</span>
          </div>
        );
      }
      if (error) {
        if (typeof errorFallback === 'function') {
          return <div data-slot="markdown-error">{errorFallback(error)}</div>;
        }
        if (errorFallback !== undefined) {
          return <div data-slot="markdown-error">{errorFallback}</div>;
        }
        return (
          <div
            data-slot="markdown-error"
            role="alert"
            css={css`
              padding: 1em;
              border: 1px solid ${theme.colors.danger[500]};
              border-radius: ${theme.radius.md};
              background: ${theme.colors.status.dangerBg};
              color: ${theme.colors.status.danger};
            `}
          >
            {error.message}
          </div>
        );
      }
      return (
        <div ref={contentRef} data-slot="markdown-content" css={typographyCss}>
          <ReactMarkdown remarkPlugins={gfm ? [remarkGfm] : []} components={components}>
            {markdown}
          </ReactMarkdown>
        </div>
      );
    };

    return (
      <div
        id={id}
        role="article"
        aria-label={ariaLabel}
        aria-busy={isLoading || undefined}
        className={className}
        style={style}
        css={wrapperCss}
        data-loading={isLoading || undefined}
        data-error={error ? '' : undefined}
        data-toc-position={showToc ? tocPosition : undefined}
        {...rest}
      >
        {showToolbar && (
          <MarkdownViewerToolbar
            getMarkdown={() => markdown}
            config={toolbar ?? {}}
            labels={labels}
            canRefresh={sourceType === 'url'}
            onRefresh={handleRefresh}
          />
        )}

        <div css={bodyCss}>
          <div ref={scrollContainerRef} css={scrollCss}>
            <div css={innerMaxWidthCss}>{renderBody()}</div>
          </div>

          {showToc && tocItems.length > 0 && !isLoading && !error && (
            <MarkdownViewerToc
              items={tocItems}
              scrollContainerRef={scrollContainerRef}
              contentRef={contentRef}
            />
          )}
        </div>
      </div>
    );
  },
);

(MarkdownViewer as unknown as { displayName: string }).displayName = 'MarkdownViewer';
