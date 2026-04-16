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

  outputFileTracingIncludes: {
    '*': ['node_modules/styled-jsx/**'],
  },

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
