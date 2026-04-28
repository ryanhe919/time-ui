/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 Playground 应用的 Vite 构建配置。
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: { plugins: ['@emotion/babel-plugin'] },
    }),
  ],
  resolve: {
    alias: {
      '@timeui/react': path.resolve(__dirname, '../../packages/components/src/index.ts'),
    },
  },
  server: { port: 5173, open: true },
});
