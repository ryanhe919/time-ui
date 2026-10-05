/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-27
 * @description 文档站 MDX 示例组件 MarkdownViewerTocDemo（启用右侧目录 + 多级标题）。
 */

'use client';

import { css } from '@emotion/react';
import { MarkdownViewer } from '@timeui/react/markdown-viewer';

const SAMPLE = `# Getting started

Welcome to the long-form documentation. The TOC on the right tracks the heading
that's currently visible.

## Installation

Install the package alongside the optional markdown peers.

\`\`\`bash
pnpm add @timeui/react react-markdown remark-gfm
\`\`\`

## Configuration

### Source modes

\`MarkdownViewer\` accepts either a markdown string (\`sourceType="content"\`, default)
or a URL (\`sourceType="url"\`).

### Toolbar

The default toolbar exposes copy / download / refresh. Pass \`toolbar={{ refresh: false }}\`
to hide individual buttons or \`showToolbar={false}\` to drop the header entirely.

## Reading layout

The body uses a 72ch column by default to keep line lengths comfortable.

### Anchors

Every heading gets a deterministic slug id. Click any TOC item — the viewer
scrolls within its own scroll container, so the page URL stays unchanged.

## Notes

> Use the refresh button when \`sourceType="url"\` to re-fetch the document.
`;

export function MarkdownViewerTocDemo() {
  return (
    <div
      data-livedemo="custom"
      data-live-preview=""
      css={css`
        width: min(900px, 100%);
        height: 460px;
        display: flex;

        & > * {
          height: 100%;
        }
      `}
    >
      <MarkdownViewer
        source={SAMPLE}
        aria-label="Markdown viewer with TOC"
        showToc
        tocPosition="right"
      />
    </div>
  );
}
