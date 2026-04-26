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
    limit: '75 KB',
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
    limit: '5 KB',
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
    limit: '8 KB',
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
    name: '@timeui/tokens — full import',
    path: 'packages/tokens/dist/index.js',
    import: '*',
    limit: '6 KB',
  },
];
