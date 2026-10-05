/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-28
 * @description LiveDemo v2 客户端可编辑路径（spec v2 §6 / §7 / §8 / §9）。
 *
 *              **路径职责**：
 *                1. 把 `code` prop 当作 single source of truth。
 *                2. 把用户编辑（`onChange`）debounce 300ms 后喂给
 *                   `transpileLiveCode(pendingCode, liveScope)`。
 *                3. 用 `useMemo` 缓存 transpile 结果；result.ok 时更新
 *                   "lastGood" 引用，failed 时回退渲染 lastGood，**不闪屏**。
 *                4. parse-error / scope-error → 顶部 warning banner +
 *                   `aria-invalid` on CodeEditor + `aria-describedby` 串到 banner id。
 *                5. runtime-error → React Error Boundary 接住，整片 preview 替换为
 *                   红色 alert（spec §7）。
 *                6. CodeEditor 默认折叠（`defaultCodeOpen=false`），与 v1 LiveDemo 一致；
 *                   "Show code" 按钮带 `aria-expanded`。
 *                7. `editable=false` → CodeEditor 进入 readOnly。
 *
 *              **本文件是 dynamic({ ssr: false }) 的目标**：所以 sucrase + CodeMirror
 *              不会被打包进主路由 chunk。`LiveDemo.tsx` 的 fallback 路径只引 CodeBlock
 *              + children 静态 DOM，不会拖累首屏 JS 体积。
 *
 *              spec 红线：本文件**不**在 SSR 阶段被加载（`'use client'` + `dynamic`），
 *              `new Function` / sucrase 都只在浏览器执行。
 */

'use client';

import {
  Component,
  type CSSProperties,
  type ErrorInfo,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { css } from '@emotion/react';
import { CodeEditor } from '@timeui/react/code-editor';

import { liveScope } from './scope';
import { transpileLiveCode, type TranspileResult } from './transpile';

// ─────────────────────────────────────────────────────────────────────────────
//  Props
// ─────────────────────────────────────────────────────────────────────────────

export interface LiveEditorProps {
  /** Initial source code (single source of truth, see spec v2 §3). */
  code: string;
  /** CodeBlock-friendly language name; v2 always uses 'typescript' for editor. */
  language?: string;
  /** When false the CodeEditor goes read-only (spec §3). */
  editable?: boolean;
  /** Code panel's initial collapsed state (default false, matches v1 LiveDemo). */
  defaultCodeOpen?: boolean;
  /** Preview area minimum height in px (default 160). */
  previewMinHeight?: number;
  id?: string;
  className?: string;
  style?: CSSProperties;
}

const DEBOUNCE_MS = 300;

// ─────────────────────────────────────────────────────────────────────────────
//  PreviewErrorBoundary — catches RUNTIME errors thrown during render of the
//  transpiled element. Parse/scope errors live in `transpileLiveCode`; this
//  boundary only handles things that survive transpile but throw at render.
//
//  We pass a stable `key` (= `pendingCode`) from the parent so each successful
//  transpile re-mounts the boundary with a clean slate. That way "fix the bug
//  and re-render" automatically clears the error state without us threading
//  state down.
// ─────────────────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Bubbled up so the parent can flip the visible banner / aria-* state. */
  onError: (error: Error) => void;
  /** Bubbled up so the parent can flip back when the boundary resets. */
  onReset: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class PreviewErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError(error);
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      // Surface for debuggability; production stays silent.
      console.error('[LiveEditor] runtime error in preview:', error, info);
    }
  }

  componentDidMount(): void {
    // Each re-key gives us a fresh boundary; tell the parent so the red
    // banner clears.
    this.props.onReset();
  }

  render(): ReactNode {
    if (this.state.error) {
      return <RuntimeErrorAlert message={this.state.error.message} />;
    }
    return this.props.children;
  }
}

function RuntimeErrorAlert({ message }: { message: string }): ReactElement {
  return (
    <div role="alert" css={runtimeErrorAlertCss}>
      <strong css={runtimeErrorTitleCss}>Runtime error</strong>
      <span css={runtimeErrorMessageCss}>{message}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  LiveEditor
// ─────────────────────────────────────────────────────────────────────────────

function LiveEditor({
  code: initialCode,
  language: _language = 'tsx', // spec §8: editor always feeds CodeMirror 'typescript'
  editable = true,
  defaultCodeOpen = false,
  previewMinHeight = 160,
  id,
  className,
  style,
}: LiveEditorProps): ReactElement {
  // ─── Code state: raw vs debounced (pending) ──────────────────────────────
  const [code, setCode] = useState(initialCode);
  const [pendingCode, setPendingCode] = useState(initialCode);
  // If the *initial* code prop changes (rare; would happen if MDX re-renders
  // a different example into the same DOM slot), reset our local state too.
  // We compare via ref to avoid clobbering ongoing user edits in the common
  // case where MDX re-renders with the same code prop.
  const initialCodeRef = useRef(initialCode);
  useEffect(() => {
    if (initialCodeRef.current !== initialCode) {
      initialCodeRef.current = initialCode;
      setCode(initialCode);
      setPendingCode(initialCode);
    }
  }, [initialCode]);

  // ─── Debounce raw → pending (spec §9) ────────────────────────────────────
  useEffect(() => {
    if (code === pendingCode) return;
    const t = setTimeout(() => setPendingCode(code), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [code, pendingCode]);

  // ─── Transpile ───────────────────────────────────────────────────────────
  // `transpileLiveCode` (live/transpile.ts) returns a `render: () => Element`
  // factory in the success case (already eager-invoked + cached internally).
  // We call render() exactly once per result and stash the element so the
  // rest of the render pipeline can treat it as data, not a function.
  const result: TranspileResult = useMemo(
    () => transpileLiveCode(pendingCode, liveScope),
    [pendingCode],
  );

  // ─── Last-good cache (spec §7: keep showing previous success on parse/scope
  // errors so user doesn't see flicker / blank). Refs are safe to mutate
  // during render here because the update is idempotent within one render
  // (only writes when result.ok is true and contents changed).
  // ────────────────────────────────────────────────────────────────────────
  const lastGoodCodeRef = useRef(initialCode);
  const lastGoodElementRef = useRef<ReactElement | null>(null);
  if (result.ok) {
    lastGoodCodeRef.current = pendingCode;
    lastGoodElementRef.current = result.render();
  }

  // ─── Runtime error tracking (set by PreviewErrorBoundary) ────────────────
  // Independent of `result` because runtime errors happen at render time,
  // *after* a successful transpile. We surface this only to render the red
  // boundary alert — `aria-invalid` on the editor stays false (spec §7 table).
  const [runtimeError, setRuntimeError] = useState<Error | null>(null);

  // ─── Code panel open/close ───────────────────────────────────────────────
  const [codeOpen, setCodeOpen] = useState<boolean>(defaultCodeOpen);

  // ─── ids for a11y wiring ─────────────────────────────────────────────────
  const reactId = useId();
  const safeId = reactId.replace(/[^a-zA-Z0-9-]/g, '');
  const rootId = id ?? `livedemo-${safeId}`;
  const bannerId = `${rootId}-banner`;
  const codePanelId = `${rootId}-code`;

  // ─── Banner state derivation ─────────────────────────────────────────────
  const isParseScopeError =
    !result.ok && (result.error.kind === 'parse' || result.error.kind === 'scope');
  const isTranspileRuntimeError = !result.ok && result.error.kind === 'runtime';
  const bannerText = isParseScopeError ? formatBannerText(result) : '';

  // The banner appears for parse/scope errors only. Runtime errors render
  // their own full-area danger alert via the boundary or the transpile result.
  const showBanner = bannerText.length > 0;

  // ─── Element to render in the preview ────────────────────────────────────
  // Successful transpile → its render() (already cached, see live/transpile).
  // Failed transpile → the most recent good element (no flicker).
  // Boundary key = pendingCode → a successful re-transpile remounts the
  // boundary (clearing any prior runtime error), and a stale-replay still
  // re-uses the cached good element under the same key so React skips
  // unnecessary work.
  const elementToShow: ReactElement | null = result.ok
    ? result.render()
    : lastGoodElementRef.current;

  // ─── Restore last-good code ──────────────────────────────────────────────
  const handleRestore = () => {
    setCode(lastGoodCodeRef.current);
    // Also flush the debounced state so the editor immediately reflects the
    // restored code without waiting for the 300ms timer.
    setPendingCode(lastGoodCodeRef.current);
  };

  return (
    <div id={rootId} className={className} style={style} data-livedemo="editable" css={shellCss}>
      {/* ─── Top banner (parse / scope errors only — guardian §7) ──────── */}
      {showBanner && (
        <div id={bannerId} role="alert" aria-live="polite" css={bannerCss}>
          <span
            css={css`
              flex: 1 1 auto;
              min-width: 0;
              font-size: 12px;
              line-height: 1.5;
              color: var(--c-text-primary);
              overflow-wrap: anywhere;
            `}
          >
            <strong
              css={css`
                font-weight: 600;
                margin-right: 6px;
                color: var(--c-status-warning-text);
              `}
            >
              {!result.ok && result.error.kind === 'parse' ? 'ParseError' : 'ScopeError'}
              {!result.ok && result.error.kind === 'parse' && result.error.line !== undefined
                ? ` · line ${result.error.line}`
                : ''}
              :
            </strong>
            {bannerText}
          </span>
          <button
            type="button"
            onClick={handleRestore}
            aria-label="Restore last good code"
            css={ghostButtonCss}
          >
            Restore
          </button>
        </div>
      )}

      {/* ─── Preview ───────────────────────────────────────────────────── */}
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
          min-height: ${previewMinHeight}px;
          background: var(--c-bg-secondary);
          min-width: 0;
          overflow-x: auto;
          @media (max-width: 959px) {
            padding: 32px 16px;
          }
        `}
      >
        {isTranspileRuntimeError ? (
          <RuntimeErrorAlert message={result.error.message} />
        ) : (
          <PreviewErrorBoundary
            key={pendingCode}
            onError={setRuntimeError}
            onReset={() => setRuntimeError(null)}
          >
            {elementToShow}
          </PreviewErrorBoundary>
        )}
      </div>

      {/* ─── Header bar (Preview · Editable │ Show code) ───────────────── */}
      <div css={headerCss}>
        <span css={headerLabelCss}>
          Preview
          <span
            css={css`
              color: var(--c-accent);
              font-weight: 600;
            `}
          >
            · {editable ? 'Editable' : 'Read-only'}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setCodeOpen((v) => !v)}
          aria-controls={codePanelId}
          aria-expanded={codeOpen}
          css={accentButtonCss}
        >
          {codeOpen ? 'Hide code' : 'Show code'}
        </button>
      </div>

      {/* ─── Code editor panel ─────────────────────────────────────────── */}
      {/* Scoped CodeMirror polish for the docs live editor. */}
      <div
        id={codePanelId}
        hidden={!codeOpen}
        css={css`
          --livedemo-code-active-line-bg: rgba(244, 244, 245, 0.68);

          border-top: 1px solid var(--c-hairline);

          html[data-theme='dark'] & {
            --livedemo-code-active-line-bg: rgba(39, 39, 42, 0.72);
          }

          /*
           * Do not force .cm-content to 100% width. In CodeMirror the gutter
           * and content sit next to each other inside .cm-scroller; content
           * min-width: 100% makes gutter + content wider than the viewport and
           * creates a horizontal scrollbar even when every line fits.
           */
          .cm-content {
            min-width: 0;
          }

          /*
           * Extend only the active-line paint, not the layout box. This fills
           * the right side of short active lines without increasing scrollWidth.
           */
          .cm-activeLine {
            background-color: var(--livedemo-code-active-line-bg);
            box-shadow: 100vw 0 0 var(--livedemo-code-active-line-bg);
          }

          /*
           * LiveDemo's shell uses --r-card (18px) and clips its children. The
           * shared CodeEditor uses a smaller control radius (12px), so its
           * lower focus arc can be visibly cut off by the parent. Match the
           * embedded editor radius to the shell and draw the focus ring inside
           * the clipped area.
           */
          [role='group'] {
            border-radius: var(--r-card);
          }

          [role='group']:focus-within {
            border-color: var(--c-accent);
            box-shadow:
              inset 0 0 0 1px var(--c-accent),
              inset 0 0 0 3px rgba(0, 113, 227, 0.1);
          }
        `}
      >
        <CodeEditor
          value={code}
          onChange={setCode}
          language="typescript"
          variant="bordered"
          size="sm"
          isReadOnly={!editable}
          isInvalid={isParseScopeError}
          aria-label="Live demo code editor"
          aria-describedby={isParseScopeError ? bannerId : undefined}
          toolbar={{ showCopy: true, showLineWrap: true, showLineNumbers: true }}
          minHeight={120}
          maxHeight={480}
        />
      </div>

      {/*
        sr-only fallback announcement when runtime error fires. The boundary's
        own role="alert" + aria-live polite already handles SR; this is just a
        belt-and-suspenders region in case the boundary's `key` re-mount races.
      */}
      {runtimeError ? (
        <span css={visuallyHiddenCss}>Runtime error: {runtimeError.message}</span>
      ) : null}
    </div>
  );
}

export default LiveEditor;

// ─────────────────────────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────────────────────────

const shellCss = css`
  margin: 32px 0;
  border-radius: var(--r-card);
  overflow: hidden;
  background: var(--c-bg);
  border: 1px solid var(--c-hairline);
  box-shadow: var(--c-shadow-card);
  font-family: var(--docs-sans);
`;

const runtimeErrorAlertCss = css`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 20px;
  border-radius: var(--r-card);
  background: var(--c-status-danger-bg);
  color: var(--c-text-primary);
  font-family: var(--docs-sans);
  font-size: 13px;
  line-height: 1.5;
  max-width: min(480px, 100%);
`;

const runtimeErrorTitleCss = css`
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--c-status-danger-text);
`;

const runtimeErrorMessageCss = css`
  color: var(--c-text-secondary);
`;

const bannerCss = css`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 14px 10px 16px;
  background: var(--c-status-warning-bg);
  border-bottom: 1px solid var(--c-hairline);
  font-family: var(--docs-sans);
`;

const headerCss = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-top: 1px solid var(--c-hairline);
  background: var(--c-bg);
`;

const headerLabelCss = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--c-text-tertiary);
`;

const accentButtonCss = css`
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
`;

const ghostButtonCss = css`
  flex: 0 0 auto;
  font-family: var(--docs-sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--c-text-primary);
  background: var(--c-bg);
  border: 1px solid var(--c-hairline);
  padding: 4px 10px;
  cursor: pointer;
  border-radius: var(--r-cta);
  transition: background 150ms;
  &:hover {
    background: var(--c-bg-secondary);
  }
  &:focus-visible {
    outline: 2px solid var(--c-accent);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const visuallyHiddenCss = css`
  position: absolute !important;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Trim `Error: ` prefix and any trailing source-map junk from sucrase / runtime
 * messages so the visible banner stays readable. We keep this best-effort —
 * unrecognised shapes pass through untouched.
 */
function formatBannerText(result: Extract<TranspileResult, { ok: false }>): string {
  let msg = result.error.message;
  msg = msg.replace(/^Error:\s+/, '');
  // sucrase / Babel often append "(line:col)" — already shown in the strong
  // prefix; trim it from the body so we don't double-print.
  msg = msg.replace(/\s*\(\d+:\d+\)\s*$/, '');
  return msg;
}
