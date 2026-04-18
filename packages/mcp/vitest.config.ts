/**
 * @author Ryan He
 * @date 2026-04-18
 * @description vitest 配置：纯 node 环境，覆盖 src 下的纯函数工具与 MCP server。
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      // http.ts / stdio.ts 是 transport 入口适配层，真跑会起网络/stdio 连接，
      // 不适合在纯单测里覆盖；留给 MCP inspector 手工验收或后续 e2e。
      exclude: [
        'src/**/*.test.ts',
        'src/index.ts',
        'src/**/index.ts',
        'src/http.ts',
        'src/stdio.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
});
