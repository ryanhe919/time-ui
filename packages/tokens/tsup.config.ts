/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 tsup.config 模块。
 */

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'es2020',
});
