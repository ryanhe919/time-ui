/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-28
 * @description LiveDemo v2 — 文档站 MDX 示例容器（spec v2）。
 *
 *              **核心契约（spec v2 §3）**：
 *              - `code` 字符串是 single source of truth；当 `editable=true`
 *                （默认）+ 客户端已挂载，文档作者写的 LiveDemo 会直接变成
 *                可编辑预览（用户拨字符 → 浏览器内 sucrase transpile → 实时
 *                重渲）。
 *              - 文档作者不需要改 mdx：原来 `<LiveDemo code={\`...\`}>{children}</LiveDemo>`
 *                的写法 100% 兼容。SSR 阶段渲染 `children` + 只读 `<CodeBlock>`，
 *                与 v1 视觉完全一样；客户端 mount 后再升级为 LiveEditor。
 *              - C 档示例（含 hooks / lambdas / 复杂结构、用 transpile 不便的）
 *                可以加 `previewSource="children"` 强制走 SSR 路径。
 *
 *              **本文件 = 路由切换器**。所有"昂贵的"客户端逻辑（sucrase /
 *              CodeMirror）都隔离在 `./live/LiveEditor`，通过
 *              `next/dynamic({ ssr: false })` 异步加载，**不进主路由 chunk**。
 *
 *              **hydration 合约**：
 *                1. server 输出   = `LiveDemoStaticShell`（children + readonly CodeBlock）
 *                2. client 第一次 = 同上（`mounted=false`）
 *                3. client mount 后第二次 → 替换为 `<LiveEditor>`
 *              第 1 / 2 步输出严格相同，没有 hydration mismatch。
 */

'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { css } from '@emotion/react';
import { CodeBlock } from '@timeui/react/code-block';

import { LiveEditorSkeleton } from './live/LiveEditor.skeleton';

/**
 * `next/dynamic` with `ssr: false` keeps sucrase + CodeMirror out of the main
 * route bundle (spec v2 §11 / §12 红线）。`loading` is the small Skeleton —
 * already in the main bundle, so the placeholder appears instantly.
 *
 * NOTE: `dynamic` requires a default-export module. `LiveEditor.tsx` exports
 * default — see that file's bottom.
 */
const LiveEditor = dynamic(() => import('./live/LiveEditor'), {
  ssr: false,
  loading: () => <LiveEditorSkeleton />,
});

/**
 * Public props (spec v2 §3). Keep stable — every mdx file in the repo binds
 * directly to this shape.
 */
export interface LiveDemoProps {
  /**
   * Source code string. Single source of truth in v2 — when present and
   * `previewSource='code'` (default), the rendered preview is derived from
   * this string at runtime. When omitted, falls back to v1 behaviour
   * (children + readonly code block; no editor).
   */
  code?: string;
  /** SSR fallback content; also used when `previewSource='children'`. */
  children?: ReactNode;
  /** Code language for highlighting. v2 editor always feeds CodeMirror 'typescript'. */
  language?: 'tsx' | 'jsx' | 'ts' | 'js';
  /** Choose whether the live preview comes from `code` (default) or `children`. */
  previewSource?: 'code' | 'children';
  /** Controls whether the CodeEditor accepts edits; default true. */
  editable?: boolean;
  /** Initial open/closed state of the code panel; default false (matches v1). */
  defaultCodeOpen?: boolean;
  /** Preview area minimum height in px; default 160. */
  previewMinHeight?: number;
  id?: string;
  className?: string;
  style?: CSSProperties;
}

export function LiveDemo({
  code,
  children,
  language = 'tsx',
  previewSource = 'code',
  editable = true,
  defaultCodeOpen = false,
  previewMinHeight = 160,
  id,
  className,
  style,
}: LiveDemoProps) {
  // ─── Hydration-safe path selector ───────────────────────────────────────
  // server + first client render → mounted=false → static shell
  // first effect ticks → mounted=true → replace with LiveEditor
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const useStatic = !mounted || !code || previewSource === 'children' || !editable;
  // ↑ `editable=false` also lands in static path: the only difference between
  // editable=false and the static shell is the toolbar; v1's read-only
  // CodeBlock is already a faithful representation, no need to spin up sucrase.

  if (useStatic) {
    return (
      <LiveDemoStaticShell
        id={id}
        className={className}
        style={style}
        previewMinHeight={previewMinHeight}
      >
        <StaticPreview minHeight={previewMinHeight}>{children}</StaticPreview>
        {code ? (
          <ReadOnlyCodePanel code={code} language={language} defaultOpen={defaultCodeOpen} />
        ) : null}
      </LiveDemoStaticShell>
    );
  }

  // Client-side editable path. `code` is guaranteed non-undefined here
  // (the static branch handles !code).
  return (
    <LiveEditor
      code={code as string}
      language={language}
      editable={editable}
      defaultCodeOpen={defaultCodeOpen}
      previewMinHeight={previewMinHeight}
      id={id}
      className={className}
      style={style}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Static shell (SSR fallback path) — pure DOM, no client deps. Mirrors v1
//  LiveDemo's visual contract so server-rendered HTML hydrates without
//  mismatch when client takes over and replaces with LiveEditor.
// ─────────────────────────────────────────────────────────────────────────────

interface LiveDemoStaticShellProps {
  id?: string;
  className?: string;
  style?: CSSProperties;
  previewMinHeight?: number;
  children?: ReactNode;
}

function LiveDemoStaticShell({ id, className, style, children }: LiveDemoStaticShellProps) {
  return (
    <div
      id={id}
      className={className}
      style={style}
      data-livedemo="static"
      css={css`
        margin: 32px 0;
        border-radius: var(--r-card);
        overflow: hidden;
        background: var(--c-bg);
        border: 1px solid var(--c-hairline);
        box-shadow: var(--c-shadow-card);
        font-family: var(--docs-sans);
      `}
    >
      {children}
    </div>
  );
}

function StaticPreview({ children, minHeight }: { children?: ReactNode; minHeight: number }) {
  return (
    <div
      data-live-preview=""
      role="region"
      aria-label="Preview"
      css={css`
        padding: 56px 32px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 16px;
        min-height: ${minHeight}px;
        background: var(--c-bg-secondary);
      `}
    >
      {children}
    </div>
  );
}

/**
 * Read-only code panel used in the SSR fallback. Closed by default (mirrors v1
 * `<LiveDemo>`'s "Show code" toggle). Tiny client-side state so the toggle
 * works even on the static shell (e.g., when `previewSource='children'`).
 */
function ReadOnlyCodePanel({
  code,
  language,
  defaultOpen,
}: {
  code: string;
  language: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <div
        css={css`
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          border-top: 1px solid var(--c-hairline);
          background: var(--c-bg);
        `}
      >
        <span
          css={css`
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: var(--c-text-tertiary);
          `}
        >
          Preview
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          css={css`
            font-family: var(--docs-sans);
            font-size: 12px;
            font-weight: 500;
            color: var(--c-accent);
            background: transparent;
            border: none;
            padding: 4px 10px;
            cursor: pointer;
            border-radius: var(--r-cta);
            transition:
              background 200ms,
              color 200ms;
            &:hover {
              background: var(--c-accent-hover-bg);
              color: var(--c-accent-hover);
            }
            &:focus-visible {
              outline: 2px solid var(--c-accent);
              outline-offset: 2px;
            }
            @media (prefers-reduced-motion: reduce) {
              transition: none;
            }
          `}
        >
          {open ? 'Hide code' : 'Show code'}
        </button>
      </div>
      {open ? (
        <div
          css={css`
            border-top: 1px solid var(--c-hairline);
          `}
        >
          <CodeBlock code={code.trim()} language={language} />
        </div>
      ) : null}
    </>
  );
}
