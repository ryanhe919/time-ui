/** @jsxImportSource @emotion/react */
/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 实现 ChatMarkdown：以流式友好的方式把 string 片段渲染为完整 markdown。
 *   面向 AI 对话场景：每次 children 变动都会重解析，react-markdown 对未闭合
 *   的代码块 / 标签自动降级，避免流式途中显示原始语法。
 *
 *   fenced code block 使用内嵌的 `CodeBlockInline`（本文件内定义，不外暴露）
 *   做语法高亮 + 复制按钮：shiki 动态 import，加载失败回退纯文本，配合
 *   `cancelled` 闭包处理流式异步覆盖顺序。不复用 `@timeui/react/code-block`，
 *   因为那会把主 bundle 反向拉进 `@timeui/react/chat-markdown` subpath。
 */

'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { css, useTheme } from '@emotion/react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useI18n } from '@timeui/core';

// 触发 @emotion/react 的 DefaultTheme augmentation 加载 —— 纯类型 import 不会
// 被 bundler 拖进 runtime，但 tsup 的 dts 构建会经此解析到 theme 扩展字段。
import type {} from '@timeui/themes';

export interface ChatMarkdownProps {
  /** 原始 markdown 字符串。流式时传累积文本即可，组件内部会重解析。 */
  children: string;
  className?: string;
  style?: CSSProperties;
  /**
   * 覆盖或扩展默认 `components` 映射（例如自定义代码块渲染器）。
   * 会与内部默认 components 浅合并，caller 的同名 key 优先。
   */
  components?: Components;
}

const Link = (props: ComponentPropsWithoutRef<'a'>): ReactNode => {
  const { href, children, ...rest } = props;
  const isExternal = typeof href === 'string' && /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer noopener' : undefined}
      {...rest}
    >
      {children}
    </a>
  );
};

/**
 * 从 react-markdown `code` 节点的 className（形如 `language-ts`）中提取语言名。
 */
function extractLanguage(className: string | undefined): string | undefined {
  if (!className) return undefined;
  const match = /language-([\w+-]+)/.exec(className);
  return match?.[1];
}

/**
 * 将任意 react children 平展回纯文本 —— react-markdown 对代码块的 children 通常
 * 就是一段字符串，但为了容错（例如 remark 插件拆分出多段文本节点）仍然递归一次。
 */
function toPlainText(children: ReactNode): string {
  if (children == null || children === false) return '';
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(toPlainText).join('');
  // React element：尝试读 props.children
  if (typeof children === 'object' && 'props' in children) {
    const el = children as { props?: { children?: ReactNode } };
    return toPlainText(el.props?.children);
  }
  return '';
}

interface CodeBlockInlineProps {
  code: string;
  language?: string;
}

/**
 * ChatMarkdown 专用的内嵌代码块：按需加载 shiki 高亮 + 右上角复制按钮。
 * 刻意内联实现而不 import `@timeui/react/code-block`，以保持 subpath 的独立性。
 */
function CodeBlockInline({ code, language }: CodeBlockInlineProps): ReactNode {
  const theme = useTheme();
  const i18n = useI18n();
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 未指定语言时跳过 shiki，回退到纯 <pre><code>，避免无谓的异步加载。
    if (!language) {
      setHighlightedHtml(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const shiki = await import('shiki');
        const highlighter = await shiki.getSingletonHighlighter({
          themes: ['github-light', 'github-dark'],
          langs: [language],
        });
        const loaded = highlighter.getLoadedLanguages();
        if (!loaded.includes(language as never)) {
          await highlighter.loadLanguage(language as never);
        }
        if (cancelled) return;
        const html = highlighter.codeToHtml(code, {
          lang: language,
          themes: { light: 'github-light', dark: 'github-dark' },
          defaultColor: theme.mode === 'dark' ? 'dark' : 'light',
        });
        if (!cancelled) setHighlightedHtml(html);
      } catch (err) {
        // shiki 未安装 / 语言解析失败：降级纯文本，不阻塞渲染。
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            '[TimeUI] ChatMarkdown: syntax highlighting unavailable — falling back to plain text.',
            err,
          );
        }
        if (!cancelled) setHighlightedHtml(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, language, theme.mode]);

  const handleCopy = useCallback(async () => {
    // `navigator.clipboard` 在非 secure context / jsdom 默认环境可能不存在。
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // 静默降级：权限被拒或超时均不打断交互。
      void 0;
    }
  }, [code]);

  const border = theme.colors.border.subtle;
  const bg = theme.colors.bg.sunken ?? theme.colors.bg.muted;

  const wrapperCss = css`
    position: relative;
    margin: 0 0 0.65em;
    border-radius: 8px;
    border: 1px solid ${border};
    background: ${bg};
    overflow: hidden;
    font-size: 0.86em;
    line-height: 1.55;

    /* shiki 注入的 <pre class="shiki"> 使用自己的配色，这里只做容器 padding/滚动统一 */
    pre {
      margin: 0;
      padding: 10px 44px 10px 12px;
      background: transparent;
      overflow-x: auto;
      font-family: ${theme.typography.fontFamily.mono};
    }
    .shiki {
      background: transparent !important;
      font-family: ${theme.typography.fontFamily.mono} !important;
    }
    code {
      font-family: ${theme.typography.fontFamily.mono};
      background: transparent;
      padding: 0;
      border-radius: 0;
      font-size: inherit;
      white-space: pre;
      word-break: normal;
    }

    /* 悬停容器时显现复制按钮；键盘 focus / copied 状态也会显现（见 button 规则） */
    &:hover [data-timeui-copy-btn],
    &:focus-within [data-timeui-copy-btn] {
      opacity: 1;
    }
  `;

  const copyBtnCss = css`
    position: absolute;
    top: 6px;
    right: 6px;
    padding: 3px 8px;
    font-family: ${theme.typography.fontFamily.mono};
    font-size: 11px;
    letter-spacing: 0.02em;
    color: ${theme.colors.text.muted};
    background: ${theme.colors.bg.surface};
    border: 1px solid ${border};
    border-radius: 6px;
    cursor: pointer;
    opacity: 0;
    transition:
      opacity 150ms,
      background 150ms,
      color 150ms,
      border-color 150ms;
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
    /* 保持 a11y：键盘 focus 与"已复制"状态始终可见。 */
    &:focus-visible,
    &[data-copied] {
      opacity: 1;
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
  `;

  return (
    <div css={wrapperCss}>
      {highlightedHtml ? (
        <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      ) : (
        <pre>
          <code className={language ? `language-${language}` : undefined}>{code}</code>
        </pre>
      )}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={i18n.codeBlock.copyLabel}
        data-copied={copied || undefined}
        data-timeui-copy-btn=""
        css={copyBtnCss}
      >
        {copied ? i18n.codeBlock.copied : i18n.codeBlock.copy}
      </button>
    </div>
  );
}

/**
 * react-markdown 的 `pre` renderer：识别内部唯一 `code` 节点的语言并交给
 * `CodeBlockInline`；非 fenced 场景（理论上 markdown 不会命中）回落原样。
 */
const PreRenderer = (props: ComponentPropsWithoutRef<'pre'>): ReactNode => {
  const { children } = props;
  // react-markdown v9：`<pre>` 下通常是 `<code className="language-xxx">...</code>`
  const onlyChild = Array.isArray(children) ? children[0] : children;
  if (onlyChild && typeof onlyChild === 'object' && 'props' in onlyChild) {
    const codeEl = onlyChild as {
      props?: { className?: string; children?: ReactNode };
    };
    const language = extractLanguage(codeEl.props?.className);
    const codeText = toPlainText(codeEl.props?.children).replace(/\n$/, '');
    return <CodeBlockInline code={codeText} language={language} />;
  }
  return <pre {...props} />;
};

export const ChatMarkdown = forwardRef<HTMLDivElement, ChatMarkdownProps>(
  function ChatMarkdown(props, forwardedRef) {
    const { children, className, style, components: overrides } = props;
    const theme = useTheme();

    // 所有 block 级元素的样式集中在 root css —— 避免对每个 element 多余 emotion className。
    // 第一/最后元素去掉外 margin，保证气泡内部紧贴气泡边。
    const rootCss = css`
      font-size: inherit;
      line-height: ${theme.components.chat.contentLineHeight};
      color: inherit;
      word-break: break-word;

      & > :first-of-type {
        margin-top: 0;
      }
      & > :last-child {
        margin-bottom: 0;
      }

      p {
        margin: 0 0 0.65em;
      }
      p:last-child {
        margin-bottom: 0;
      }

      strong {
        font-weight: 600;
      }
      em {
        font-style: italic;
      }

      a {
        color: ${theme.colors.text.link ?? theme.colors.primary?.[500] ?? 'inherit'};
        text-decoration: underline;
        text-underline-offset: 2px;
        text-decoration-thickness: 1px;
        &:hover {
          text-decoration-thickness: 2px;
        }
      }

      ul,
      ol {
        margin: 0 0 0.65em;
        padding-left: 1.4em;
      }
      li {
        margin: 0.12em 0;
      }
      li > p {
        margin: 0;
      }
      ul ul,
      ul ol,
      ol ul,
      ol ol {
        margin: 0.2em 0 0.2em;
      }

      blockquote {
        margin: 0 0 0.65em;
        padding: 4px 12px;
        border-left: 3px solid ${theme.colors.border.default};
        color: ${theme.colors.text.secondary};
        background: ${theme.colors.bg.sunken ?? theme.colors.bg.muted};
        border-radius: 0 6px 6px 0;
      }

      hr {
        border: 0;
        border-top: 1px solid ${theme.colors.border.subtle};
        margin: 0.9em 0;
      }

      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        margin: 0.9em 0 0.4em;
        line-height: 1.3;
        font-weight: 600;
      }
      h1 {
        font-size: 1.25em;
      }
      h2 {
        font-size: 1.15em;
      }
      h3 {
        font-size: 1.05em;
      }
      h4,
      h5,
      h6 {
        font-size: 1em;
      }

      /* 行内 code 保持原有视觉；fenced code block 由 CodeBlockInline 接管，
         所以这里的 pre 规则仅对 caller 透过 components prop 覆盖后的回落路径生效。 */
      code {
        font-family: ${theme.typography.fontFamily.mono};
        font-size: 0.88em;
        background: ${theme.colors.bg.sunken ?? theme.colors.bg.muted};
        padding: 1px 5px;
        border-radius: 4px;
        word-break: break-all;
      }

      pre {
        margin: 0 0 0.65em;
        padding: 10px 12px;
        background: ${theme.colors.bg.sunken ?? theme.colors.bg.muted};
        border: 1px solid ${theme.colors.border.subtle};
        border-radius: 8px;
        overflow-x: auto;
        font-size: 0.86em;
        line-height: 1.55;
      }
      pre code {
        background: transparent;
        padding: 0;
        border-radius: 0;
        font-size: inherit;
        word-break: normal;
        white-space: pre;
      }

      table {
        margin: 0 0 0.65em;
        border-collapse: collapse;
        border: 1px solid ${theme.colors.border.subtle};
        border-radius: 6px;
        overflow: hidden;
        font-size: 0.95em;
      }
      th,
      td {
        padding: 6px 10px;
        border-bottom: 1px solid ${theme.colors.border.subtle};
        text-align: left;
        vertical-align: top;
      }
      th {
        font-weight: 600;
        background: ${theme.colors.bg.muted};
      }
      tr:last-child td {
        border-bottom: 0;
      }

      img {
        max-width: 100%;
        height: auto;
        border-radius: 6px;
      }
    `;

    const baseComponents: Components = { a: Link, pre: PreRenderer };
    const merged: Components = { ...baseComponents, ...(overrides ?? {}) };

    return (
      <div ref={forwardedRef} className={className} style={style} css={rootCss}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={merged}>
          {children}
        </ReactMarkdown>
      </div>
    );
  },
);

(ChatMarkdown as unknown as { displayName: string }).displayName = 'ChatMarkdown';
