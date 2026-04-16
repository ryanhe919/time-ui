/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 Playground 应用的 Vite 构建配置。
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: { plugins: ['@emotion/babel-plugin'] },
    }),
  ],
  server: { port: 5173, open: true },
});
