import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
  },
});

// Security headers applied to every route. CodeBlock renders Shiki's HTML via
// dangerouslySetInnerHTML — Shiki's output is trusted (it's our own server-side
// tokenizer), but a conservative CSP still makes sense as defense-in-depth.
//
// Dev mode needs 'unsafe-eval' for Next.js Fast Refresh / React Refresh runtime
// and a websocket connect-src for HMR. Prod keeps the stricter baseline.
const isDev = process.env.NODE_ENV !== 'production';

// `'wasm-unsafe-eval'` is required in prod so Shiki's vscode-oniguruma
// WebAssembly regex engine can instantiate its wasm module. Without it,
// `WebAssembly.instantiate(...)` throws silently, the CodeBlock falls back
// to plain text, and you see unhighlighted code in prod. In dev we keep
// the broader `'unsafe-eval'` which covers WASM + React Refresh's runtime
// eval.
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
    // Next.js App Router requires 'unsafe-inline' for its inline bootstrap
    // scripts, and Emotion streams inline <style> blocks for SSR. We keep
    // those open but block everything else.
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  output: 'standalone',
  poweredByHeader: false,
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
