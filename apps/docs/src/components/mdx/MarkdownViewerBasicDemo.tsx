/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-27
 * @description 文档站 MDX 示例组件 MarkdownViewerBasicDemo（content 模式 + GFM 表格 + fenced code）。
 */

'use client';

import { css } from '@emotion/react';
import { MarkdownViewer } from '@timeui/react/markdown-viewer';

const SAMPLE = `# Welcome to TimeUI

The **MarkdownViewer** renders a full document with reading-friendly typography,
fenced code blocks (delegated to \`CodeBlock\` with shiki highlighting), and GFM features.

## Features

- Inline \`code\` and **bold** / *italic*
- Lists, tables, blockquotes
- Fenced code blocks with syntax highlighting
- Auto-generated heading anchors

## Code

\`\`\`tsx
import { MarkdownViewer } from '@timeui/react/markdown-viewer';

export function Doc() {
  return <MarkdownViewer source={markdown} />;
}
\`\`\`

## Table (GFM)

| Component       | Source         | Highlight |
| --------------- | -------------- | --------- |
| MarkdownViewer  | string / URL   | shiki     |
| ChatMarkdown    | streaming chunk| shiki     |

> Tip: pass \`showToc\` to surface a sticky table of contents on the right.
`;

export function MarkdownViewerBasicDemo() {
  return (
    <div
      css={css`
        width: min(820px, 100%);
      `}
    >
      <MarkdownViewer source={SAMPLE} aria-label="Basic markdown viewer demo" />
    </div>
  );
}
