#!/usr/bin/env node

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现图标源码生成脚本。
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, '..');
const SVG_DIR = resolve(PKG_ROOT, 'svg');
const OUT_DIR = resolve(PKG_ROOT, 'src/icons');
const BARREL = resolve(PKG_ROOT, 'src/index.ts');

// 一次性解析 monorepo 根的 .prettierrc，保证生成结果与 `pnpm format` 等价 ——
// 否则原始 SVG 内联 markup（如 `<line .../>` 紧贴、多 self-closing 同行）会与
// prettier 期望格式不一致，每次 prebuild 都把这些 .tsx 写出"未 prettier 化"的
// 内容，造成 git status 永远 dirty。
const prettierConfig = (await resolveConfig(OUT_DIR)) ?? {};

mkdirSync(OUT_DIR, { recursive: true });

const toPascal = (s) =>
  s
    .replace(/\.svg$/i, '')
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');

function extractInner(svg) {
  const match = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>\s*$/i);
  if (!match) throw new Error('Invalid SVG (no root <svg> element)');
  return match[1].trim();
}

function toJsxAttrs(inner) {
  return inner.replace(/\s([a-z]+)-([a-z]+)=/g, (_m, a, b) => ` ${a}${b.charAt(0).toUpperCase() + b.slice(1)}=`);
}

const files = readdirSync(SVG_DIR).filter((f) => f.endsWith('.svg')).sort();
const components = [];

for (const file of files) {
  const name = toPascal(file) + 'Icon';
  const raw = readFileSync(resolve(SVG_DIR, file), 'utf8');
  const inner = toJsxAttrs(extractInner(raw));

  const component = `import { forwardRef } from 'react';
import type { SVGProps } from 'react';

export interface ${name}Props extends Omit<SVGProps<SVGSVGElement>, 'color'> {
  size?: number | string;
  color?: string;
}

export const ${name} = forwardRef<SVGSVGElement, ${name}Props>(function ${name}(
  { size = 24, color = 'currentColor', ...rest },
  ref,
) {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={rest['aria-label'] ? undefined : true}
      focusable={false}
      {...rest}
    >
      ${inner}
    </svg>
  );
});

${name}.displayName = '${name}';
`;

  const outFile = resolve(OUT_DIR, `${name}.tsx`);
  const formatted = await format(component, { ...prettierConfig, filepath: outFile });
  writeFileSync(outFile, formatted);
  components.push(name);
}

const barrel = `/**
 * @timeui/icons — auto-generated barrel. Run \`pnpm --filter @timeui/icons generate\` to update.
 */

export interface IconProps {
  size?: number | string;
  color?: string;
  'aria-label'?: string;
}

${components.map((c) => `export { ${c} } from './icons/${c}';`).join('\n')}
${components.map((c) => `export type { ${c}Props } from './icons/${c}';`).join('\n')}
`;

const formattedBarrel = await format(barrel, { ...prettierConfig, filepath: BARREL });
writeFileSync(BARREL, formattedBarrel);
console.log(`✓ Generated ${components.length} icons → ${OUT_DIR}`);
console.log(`✓ Wrote barrel → ${BARREL}`);
