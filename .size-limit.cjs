/**
 * TimeUI bundle budgets.
 *
 * Run: `pnpm size`
 *
 * Two entries:
 *   1. Main entry (`@timeui/react`) — Button, Callout, Search, Typography, Layout
 *   2. CodeBlock sub-entry (`@timeui/react/code-block`) — separated so shiki
 *      doesn't inflate the main bundle check
 */
module.exports = [
  {
    name: '@timeui/react — full import (no CodeBlock)',
    path: 'packages/components/dist/index.js',
    import: '*',
    limit: '76 KB',
    ignore: ['react', 'react-dom', '@emotion/react', '@emotion/styled'],
  },
  {
    name: '@timeui/react — Button only',
    path: 'packages/components/dist/index.js',
    import: '{ Button }',
    // tree-shake 健康检查的容忍值，不是 Button 真实大小(Button alone ~5KB)。
    // 现行方案里多数组件都用 `(X as unknown as {...}).displayName = ...`,
    // 这类副作用会被保留。预算随组件数量线性增长即可,超过就按此节奏上调。
    limit: '67 KB',
    ignore: ['react', 'react-dom', '@emotion/react', '@emotion/styled'],
  },
  {
    name: '@timeui/react/code-block',
    path: 'packages/components/dist/code-block.js',
    import: '*',
    limit: '5 KB',
    ignore: ['react', 'react-dom', '@emotion/react', '@emotion/styled', 'shiki'],
  },
  {
    name: '@timeui/react/chat-markdown',
    path: 'packages/components/dist/chat-markdown.js',
    import: '*',
    // 初始 5 KB 是只跑 markdown 渲染时的预算；现在已包含内嵌 fenced code
    // block 高亮 + 复制按钮（见 CodeBlockInline），shiki 仍走动态 import 不计入。
    limit: '6 KB',
    ignore: [
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled',
      'react-markdown',
      'remark-gfm',
    ],
  },
  {
    name: '@timeui/react/rich-text-editor',
    path: 'packages/components/dist/rich-text-editor.js',
    import: '*',
    // 所有 @tiptap/* 都是 optional peer dep，调用方各装各的；这里只衡量我们自己的代码。
    // 包含 Toolbar（含 Tooltip 包装、useI18n 标签、内联 SVG 图标）以及 Editor wrapper。
    limit: '12 KB',
    ignore: [
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled',
      '@tiptap/core',
      '@tiptap/react',
      '@tiptap/pm',
      '@tiptap/starter-kit',
      '@tiptap/extension-underline',
      '@tiptap/extension-link',
      '@tiptap/extension-placeholder',
    ],
  },
  {
    name: '@timeui/react/code-editor',
    path: 'packages/components/dist/code-editor.js',
    import: '*',
    // 所有 @codemirror/* 都是 optional peer dep，调用方各装各的；这里只衡量我们自己的代码。
    // 包含 Toolbar（含 Tooltip 包装、useI18n 标签、内联 SVG 图标、language 选择器）+ Editor wrapper（含 Compartment 重配置）。
    // 与 RichTextEditor 的 12 KB 同量级。
    limit: '12 KB',
    ignore: [
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled',
      'codemirror',
      '@codemirror/view',
      '@codemirror/state',
      '@codemirror/commands',
      '@codemirror/language',
      '@codemirror/autocomplete',
      '@codemirror/search',
      '@codemirror/lint',
      '@codemirror/lang-javascript',
      '@codemirror/lang-python',
      '@codemirror/lang-css',
      '@codemirror/lang-html',
      '@codemirror/lang-json',
      '@lezer/highlight',
    ],
  },
  {
    name: '@timeui/react/pdf-viewer',
    path: 'packages/components/dist/pdf-viewer.js',
    import: '*',
    // pdfjs-dist 是 optional peer，动态 import，调用方各装各的；这里只衡量我们的 wrapper + toolbar。
    limit: '10 KB',
    ignore: [
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled',
      'pdfjs-dist',
    ],
  },
  {
    name: '@timeui/react/markdown-viewer',
    path: 'packages/components/dist/markdown-viewer.js',
    import: '*',
    // react-markdown / remark-gfm 是 optional peer；这里只衡量 viewer + toolbar + toc 自身。
    // CodeBlock 通过 import 链拉进来，但 shiki 已 ignore。比 rich-text-editor / code-editor
    // 略大，因为额外带了 reading-typography 排版样式 + TOC IntersectionObserver 联动。
    limit: '14 KB',
    ignore: [
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled',
      'react-markdown',
      'remark-gfm',
      'shiki',
    ],
  },
  {
    name: '@timeui/tokens — full import',
    path: 'packages/tokens/dist/index.js',
    import: '*',
    limit: '6 KB',
  },
];
