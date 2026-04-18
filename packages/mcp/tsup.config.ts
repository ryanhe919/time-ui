/**
 * @author Ryan He
 * @date 2026-04-18
 * @description tsup 构建配置：同时输出 barrel、stdio 入口、http 入口，保证两种 transport 可独立加载。
 */

import { defineConfig } from 'tsup';

export default defineConfig({
  // 三个 entry 之间相互独立，便于 bin 脚本只按需加载对应 transport 模块。
  entry: ['src/index.ts', 'src/stdio.ts', 'src/http.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'es2020',
});
