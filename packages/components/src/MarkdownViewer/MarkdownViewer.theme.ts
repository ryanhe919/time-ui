/**
 * @author Ryan He
 * @description MarkdownViewer 的排版样式工厂。
 *
 *   把所有 block / inline 元素的样式集中产出为单个 emotion `SerializedStyles`，
 *   挂在内容根节点上，避免对每个标签生成独立的 emotion className。
 *   全部颜色 / 间距 / 字号都来自 theme token，禁止硬编码。
 */

import { css, type SerializedStyles } from '@emotion/react';
import type { TimeUITheme } from '@timeui/themes';

/**
 * 阅读型完整文档排版 —— 与 ChatMarkdown（紧凑、用于聊天气泡）刻意区分：
 *   - 字号 / 行高更舒展
 *   - 标题更醒目，带上下间距
 *   - 链接 hover 颜色变化（聊天气泡里没有）
 *   - 表格含 hover 行高亮
 *   - blockquote 更厚重
 */
export function createMarkdownViewerTypography(theme: TimeUITheme): SerializedStyles {
  const isDark = theme.mode === 'dark';

  // 表格隔行底色：dark 模式下用 surface 之上的 raised；light 模式下用 sunken/muted。
  const tableStripe = isDark ? theme.colors.bg.raised : theme.colors.bg.sunken;
  const tableHover = theme.colors.bg.muted;

  return css`
    color: ${theme.colors.text.primary};
    font-family: ${theme.typography.fontFamily.sans};
    font-size: ${theme.typography.fontSize.md};
    line-height: ${theme.typography.lineHeight.relaxed};
    word-break: break-word;

    /* :first-of-type 而非 :first-child —— Emotion SSR 会在内容前注入 <style>，
       :first-child 会先匹配到 <style> 触发 dev 警告。与 ChatMarkdown 保持一致。 */
    & > :first-of-type {
      margin-top: 0;
    }
    & > :last-child {
      margin-bottom: 0;
    }

    p {
      margin: 0 0 1em;
    }

    strong {
      font-weight: ${theme.typography.fontWeight.bold};
    }
    em {
      font-style: italic;
    }
    del {
      text-decoration: line-through;
      color: ${theme.colors.text.muted};
    }

    a {
      color: ${theme.colors.text.link};
      text-decoration: underline;
      text-underline-offset: 2px;
      text-decoration-thickness: 1px;
      transition: color 150ms ease;
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
      &:hover {
        color: ${theme.colors.primary[600]};
        text-decoration-thickness: 2px;
      }
      &:focus-visible {
        outline: 2px solid ${theme.colors.focus};
        outline-offset: 2px;
        border-radius: 2px;
      }
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin: 1.6em 0 0.6em;
      font-weight: ${theme.typography.fontWeight.bold};
      line-height: 1.3;
      color: ${theme.colors.text.primary};
      scroll-margin-top: 1em;
    }
    :is(h1, h2, h3, h4, h5, h6):first-of-type {
      margin-top: 0;
    }
    h1 {
      font-size: 2em;
      padding-bottom: 0.3em;
      border-bottom: 1px solid ${theme.colors.border.subtle};
    }
    h2 {
      font-size: 1.5em;
      padding-bottom: 0.25em;
      border-bottom: 1px solid ${theme.colors.border.subtle};
    }
    h3 {
      font-size: 1.25em;
    }
    h4 {
      font-size: 1.1em;
    }
    h5 {
      font-size: 1em;
    }
    h6 {
      font-size: 0.9em;
      color: ${theme.colors.text.secondary};
    }

    ul,
    ol {
      margin: 0 0 1em;
      padding-left: 1.6em;
    }
    li {
      margin: 0.25em 0;
    }
    li > p {
      margin: 0;
    }
    li > p + p {
      margin-top: 0.4em;
    }
    /* GFM task list 视觉更紧凑，复选框对齐文字基线。 */
    li.task-list-item,
    li:has(> input[type='checkbox']) {
      list-style: none;
      margin-left: -1.2em;
    }
    li > input[type='checkbox'] {
      margin-right: 0.5em;
      vertical-align: middle;
    }

    blockquote {
      margin: 0 0 1em;
      padding: 0.6em 1em;
      border-left: 4px solid ${theme.colors.border.default};
      color: ${theme.colors.text.secondary};
      background: ${theme.colors.bg.sunken};
      border-radius: 0 ${theme.radius.md} ${theme.radius.md} 0;
    }
    blockquote > :last-child {
      margin-bottom: 0;
    }

    hr {
      border: 0;
      border-top: 1px solid ${theme.colors.border.subtle};
      margin: 2em 0;
    }

    /* 行内 code；fenced code 由自定义 pre/code renderer 接管为 CodeBlock。 */
    :not(pre) > code {
      font-family: ${theme.typography.fontFamily.mono};
      font-size: 0.9em;
      background: ${theme.colors.bg.sunken};
      color: ${theme.colors.text.primary};
      padding: 0.15em 0.4em;
      border-radius: ${theme.radius.sm};
      border: 1px solid ${theme.colors.border.subtle};
      word-break: break-all;
    }

    /* fallback：caller 用自定义 components 覆盖了 pre/code 时的回落路径。 */
    pre {
      margin: 0 0 1em;
      padding: 1em;
      background: ${theme.colors.bg.sunken};
      border: 1px solid ${theme.colors.border.subtle};
      border-radius: ${theme.radius.md};
      overflow-x: auto;
      font-family: ${theme.typography.fontFamily.mono};
      font-size: 0.9em;
      line-height: 1.6;
    }
    pre code {
      background: transparent;
      padding: 0;
      border: 0;
      border-radius: 0;
      font-size: inherit;
      white-space: pre;
      word-break: normal;
    }

    table {
      margin: 0 0 1em;
      width: 100%;
      border-collapse: collapse;
      border: 1px solid ${theme.colors.border.subtle};
      border-radius: ${theme.radius.md};
      overflow: hidden;
      font-size: 0.95em;
    }
    th,
    td {
      padding: 0.55em 0.85em;
      border-bottom: 1px solid ${theme.colors.border.subtle};
      text-align: left;
      vertical-align: top;
    }
    th {
      font-weight: ${theme.typography.fontWeight.semibold};
      background: ${theme.colors.bg.muted};
      color: ${theme.colors.text.primary};
    }
    tbody tr:nth-of-type(even) td {
      background: ${tableStripe};
    }
    tbody tr:hover td {
      background: ${tableHover};
    }
    tr:last-child td {
      border-bottom: 0;
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: ${theme.radius.md};
      margin: 0.5em 0;
    }

    /* 内嵌的 CodeBlock 上下间距与正文段落对齐。 */
    [data-slot='markdown-codeblock'] {
      margin: 0 0 1em;
    }
  `;
}
