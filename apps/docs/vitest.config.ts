/**
 * @author Ryan He
 * @date 2026-04-28
 * @description docs 站的 vitest 配置。
 *              docs 主体是 Next.js App Router + MDX；这里只针对
 *              `src/components/mdx/` 下的辅助组件做单测。
 *
 *              环境策略：
 *              - 默认 jsdom（LiveDemo / LiveEditor 等 React 容器测试需要 DOM）。
 *              - 纯函数测试（如 live/transpile）在 jsdom 下也能跑，无副作用。
 *                如果未来引入纯 Node-only 的脚本测试，可用
 *                `// @vitest-environment node` 文件级 pragma 切回。
 *
 *              覆盖率门禁：lines/functions/statements ≥ 85%、branches ≥ 80%
 *              （与 monorepo 整体一致）。`coverage.include` 把度量范围限定在
 *              LiveDemo / LiveEditor 相关代码，不让 39 组件的 demo .tsx 文件污染分母。
 */

import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 让 .tsx 测试文件用 React 17+ 的 automatic runtime（无需手写 `import React`）。
  // 控件源文件自身用 emotion 的 jsxImportSource pragma，不受这里影响。
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: [
      'src/components/mdx/live/**/*.{test,spec}.{ts,tsx}',
      'src/components/mdx/**/__tests__/**/*.{test,spec}.{ts,tsx}',
      'scripts/__tests__/**/*.{test,spec}.{ts,mjs}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/components/mdx/live/**/*.{ts,tsx}', 'src/components/mdx/LiveDemo.tsx'],
      exclude: [
        '**/__tests__/**',
        '**/*.test.{ts,tsx,mjs}',
        '**/*.spec.{ts,tsx,mjs}',
        '**/index.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        statements: 85,
        branches: 80,
      },
    },
  },
});
