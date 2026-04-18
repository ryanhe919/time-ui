/** @jsxImportSource @emotion/react */
/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 实现 ChatMarkdown：以流式友好的方式把 string 片段渲染为完整 markdown。
 *   面向 AI 对话场景：每次 children 变动都会重解析，react-markdown 对未闭合
 *   的代码块 / 标签自动降级，避免流式途中显示原始语法。
 */

'use client';

import {
  forwardRef,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { css, useTheme } from '@emotion/react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

    const baseComponents: Components = { a: Link };
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
