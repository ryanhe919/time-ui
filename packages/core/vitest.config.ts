/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 vitest.config 模块。
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@emotion/react',
  },
});
