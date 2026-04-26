/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 Docs 应用的 Next.js 构建与安全头配置。
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reactSourceEntry = path.join(__dirname, '../../packages/components/src/index.ts');
const codeBlockSourceEntry = path.join(__dirname, '../../packages/components/src/CodeBlock/index.ts');
const chatMarkdownSourceEntry = path.join(
  __dirname,
  '../../packages/components/src/Chat/ChatMarkdown.tsx',
);
const richTextEditorSourceEntry = path.join(
  __dirname,
  '../../packages/components/src/RichTextEditor/index.ts',
);
const codeEditorSourceEntry = path.join(
  __dirname,
  '../../packages/components/src/CodeEditor/index.ts',
);

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
  },
});

const isDev = process.env.NODE_ENV !== 'production';

const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'";

const connectSrc = isDev
  ? "connect-src 'self' ws: wss:"
  : "connect-src 'self'";

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data: https://cdn.jsdelivr.net",
      connectSrc,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  output: 'standalone',
  poweredByHeader: false,

  outputFileTracingRoot: path.join(__dirname, '../..'),

  // @timeui/mcp reads its data/index.json at runtime via a dynamic
  // `path.resolve(__dirname, '..', 'data', 'index.json')`. If webpack bundles
  // the package, `__dirname` gets inlined to the BUILD machine's absolute path
  // (e.g. GitHub Actions `/home/runner/...`), which obviously doesn't exist on
  // the deploy target. Marking it external keeps the import resolved at runtime
  // against `node_modules/@timeui/mcp`.
  serverExternalPackages: ['@timeui/mcp'],

  outputFileTracingIncludes: {
    // standalone tracer follows import graphs only; the JSON index is loaded
    // via fs.readFileSync so we have to list it explicitly.
    '/api/assistant': [
      '../../packages/mcp/data/**',
      '../../packages/mcp/dist/**',
      '../../packages/mcp/package.json',
    ],
    '*': ['node_modules/styled-jsx/**'],
  },

  ...(isDev
    ? {
        turbopack: {
          resolveAlias: {
            '@timeui/react': reactSourceEntry,
            '@timeui/react/code-block': codeBlockSourceEntry,
            '@timeui/react/chat-markdown': chatMarkdownSourceEntry,
            '@timeui/react/rich-text-editor': richTextEditorSourceEntry,
            '@timeui/react/code-editor': codeEditorSourceEntry,
          },
        },
        webpack(config) {
          config.resolve ??= {};
          config.resolve.alias = {
            ...(config.resolve.alias ?? {}),
            '@timeui/react$': reactSourceEntry,
            '@timeui/react/code-block$': codeBlockSourceEntry,
            '@timeui/react/chat-markdown$': chatMarkdownSourceEntry,
            '@timeui/react/rich-text-editor$': richTextEditorSourceEntry,
            '@timeui/react/code-editor$': codeEditorSourceEntry,
          };
          return config;
        },
      }
    : {}),

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default withMDX(nextConfig);
