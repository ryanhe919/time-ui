/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 tsup.config 模块。
 */

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'code-block': 'src/CodeBlock/index.ts',
    'chat-markdown': 'src/Chat/ChatMarkdown.tsx',
    'rich-text-editor': 'src/RichTextEditor/index.ts',
    'code-editor': 'src/CodeEditor/index.ts',
    'pdf-viewer': 'src/PdfViewer/index.ts',
    'markdown-viewer': 'src/MarkdownViewer/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  silent: true,
  treeshake: true,
  target: 'es2020',
  external: [
    'react',
    'react-dom',
    '@emotion/react',
    '@emotion/styled',
    'shiki',
    'react-markdown',
    'remark-gfm',
    /^@tiptap\//,
    /^@radix-ui\//,
    'codemirror',
    /^@codemirror\//,
    /^@lezer\//,
    'pdfjs-dist',
    /^pdfjs-dist\//,
  ],
});
