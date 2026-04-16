/** @jsxImportSource @emotion/react */
import {
  forwardRef,
  useCallback,
  useEffect,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { useTheme, css } from '@emotion/react';
import { useI18n } from '@timeui/core';

export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onCopy'> {
  /** Raw source. Rendered inside a `<pre><code>` block. */
  code: string;
  /** Language hint. Drives both the label and Shiki's grammar pick. */
  language?: string;
  /** Optional header title. */
  title?: ReactNode;
  /** Hide the copy button. Default `true` (shown). */
  copyable?: boolean;
  /** Fires after a successful copy. */
  onCopy?: (code: string) => void;
  /**
   * Disable syntax highlighting even if `shiki` is installed. Useful when the
   * caller wants the lightweight plain-text fallback explicitly.
   */
  noHighlight?: boolean;
}

/**
 * CodeBlock — read-only code display with optional syntax highlighting.
 *
 * **Highlighting is opt-in by installation.** If consumers install
 * [`shiki`](https://shiki.style) (declared as an *optional* peerDependency),
 * CodeBlock dynamically loads it at first render and renders highlighted HTML.
 * If `shiki` is absent, CodeBlock falls back to a plain `<pre><code>` —
 * importing `Button` (or any other TimeUI component) does **not** require
 * `shiki` in the consumer's dependency tree.
 *
 * The dynamic import lives inside `useEffect`, so the bundle that reaches the
 * browser before CodeBlock renders contains zero highlighter code. Combined
 * with the package's `sideEffects: false` declaration, callers who never
 * import `CodeBlock` ship zero highlighter bytes.
 */
export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(function CodeBlock(
  { code, language = 'tsx', title, copyable = true, noHighlight = false, onCopy, ...rest },
  ref,
) {
  const theme = useTheme();
  const i18n = useI18n();
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  /* Lazy-load the highlighter. Skipped entirely when `noHighlight` is true,
   * or when `shiki` is not installed in the consumer project. */
  useEffect(() => {
    if (noHighlight) {
      setHighlightedHtml(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // shiki is an OPTIONAL peer dependency. The dynamic import keeps
        // it out of the bundle until CodeBlock first renders; consumers
        // who don't use CodeBlock never pull shiki in.
        const shiki = await import('shiki');
        const highlighter = await shiki.getSingletonHighlighter({
          themes: ['github-light', 'github-dark'],
          langs: [language],
        });
        // Lazily load language if it wasn't in the singleton's preload set.
        const loaded = highlighter.getLoadedLanguages();
        if (!loaded.includes(language as never)) {
          await highlighter.loadLanguage(language as never);
        }
        const html = highlighter.codeToHtml(code, {
          lang: language,
          themes: { light: 'github-light', dark: 'github-dark' },
          defaultColor: theme.mode === 'dark' ? 'dark' : 'light',
        });
        if (!cancelled) setHighlightedHtml(html);
      } catch {
        /* shiki not installed, or grammar load failed — keep plain fallback */
        if (!cancelled) setHighlightedHtml(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, language, theme.mode, noHighlight]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopy?.(code);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — swallow silently */
    }
  }, [code, onCopy]);

  const isDark = theme.mode === 'dark';
  const bg = isDark ? '#0b0b11' : '#fafafa';
  const fg = isDark ? theme.colors.text.primary : '#111111';
  const border = theme.colors.border.subtle;

  return (
    <div
      ref={ref}
      {...rest}
      css={css`
        position: relative;
        margin: 16px 0;
        border-radius: 10px;
        border: 1px solid ${border};
        overflow: hidden;
        background: ${bg};
        font-family:
          ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;

        /* Style overrides for Shiki's emitted <pre> so it inherits our chrome */
        .shiki {
          margin: 0 !important;
          padding: 16px ${copyable ? 56 : 16}px 16px 16px;
          font-size: 13px !important;
          line-height: 1.7 !important;
          font-family: inherit !important;
          background: transparent !important;
          overflow: auto;
        }
        .shiki code {
          font-family: inherit;
        }
      `}
    >
      {title && (
        <div
          css={css`
            padding: 8px 14px;
            border-bottom: 1px solid ${border};
            font-size: 11px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: ${theme.colors.text.muted};
            display: flex;
            justify-content: space-between;
            align-items: center;
          `}
        >
          <span>{title}</span>
          <span>{language}</span>
        </div>
      )}

      {highlightedHtml ? (
        <div
          // shiki output is escaped; safe to inject.
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre
          css={css`
            margin: 0;
            padding: 16px ${copyable ? 56 : 16}px 16px 16px;
            font-size: 13px;
            line-height: 1.7;
            color: ${fg};
            overflow: auto;
            font-family: inherit;
          `}
        >
          <code>{code}</code>
        </pre>
      )}

      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={i18n.codeBlock.copyLabel}
          data-copied={copied || undefined}
          css={css`
            position: absolute;
            top: ${title ? 44 : 10}px;
            right: 10px;
            padding: 4px 10px;
            font-family: inherit;
            font-size: 10px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: ${theme.colors.text.muted};
            background: transparent;
            border: 1px solid ${border};
            border-radius: 6px;
            cursor: pointer;
            transition:
              background 150ms,
              color 150ms,
              border-color 150ms;
            @media (prefers-reduced-motion: reduce) {
              transition: none;
            }
            &:hover,
            &:focus-visible {
              background: ${theme.colors.bg.muted};
              color: ${theme.colors.text.primary};
              outline: none;
            }
            &:focus-visible {
              border-color: ${theme.colors.focus};
            }
          `}
        >
          {copied ? i18n.codeBlock.copied : i18n.codeBlock.copy}
        </button>
      )}
    </div>
  );
});
CodeBlock.displayName = 'CodeBlock';
