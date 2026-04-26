/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 CodeBlock 组件的核心渲染与交互逻辑。
 */

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
  code: string;
  language?: string;
  title?: ReactNode;
  copyable?: boolean;
  onCopy?: (code: string) => void;
  noHighlight?: boolean;
}

export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(function CodeBlock(
  { code, language = 'tsx', title, copyable = true, noHighlight = false, onCopy, ...rest },
  ref,
) {
  const theme = useTheme();
  const i18n = useI18n();
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  useEffect(() => {
    if (noHighlight) {
      setHighlightedHtml(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // 按需加载 shiki，避免未使用 CodeBlock 的场景引入高亮开销。
        const shiki = await import('shiki');
        const highlighter = await shiki.getSingletonHighlighter({
          themes: ['github-light', 'github-dark'],
          langs: [language],
        });
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
      } catch (err) {
        // 高亮失败时回退到纯文本，保证内容可读且不阻塞渲染。
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            '[TimeUI] CodeBlock: syntax highlighting unavailable — falling back to plain text.',
            err,
          );
        }
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
      // 忽略剪贴板不可用或权限受限场景，避免打断页面交互。
      void 0;
    }
  }, [code, onCopy]);

  const bg = theme.colors.bg.sunken;
  const fg = theme.colors.text.primary;
  const border = theme.colors.border.subtle;
  const fastDuration = theme.motion.duration.fast;
  const monoFont = theme.typography.fontFamily.mono;

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
        font-family: ${monoFont};

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
        <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
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
              background ${fastDuration},
              color ${fastDuration},
              border-color ${fastDuration};
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
