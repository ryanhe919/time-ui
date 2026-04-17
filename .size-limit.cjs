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
    limit: '45 KB',
    ignore: ['react', 'react-dom', '@emotion/react', '@emotion/styled'],
  },
  {
    name: '@timeui/react — Button only',
    path: 'packages/components/dist/index.js',
    import: '{ Button }',
    limit: '40 KB',
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
    name: '@timeui/tokens — full import',
    path: 'packages/tokens/dist/index.js',
    import: '*',
    limit: '4 KB',
  },
];
