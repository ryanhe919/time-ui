/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 vitest.config 模块。
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/test-utils/**',
        'src/index.ts',
        'src/**/index.ts',
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        statements: 75,
        branches: 50,
      },
    },
  },
});
