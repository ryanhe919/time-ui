#!/usr/bin/env node

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现组件模板文件生成命令行工具。
 */

import { mkdirSync, existsSync, writeFileSync, readFileSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');
const COMPONENTS_SRC = resolve(REPO_ROOT, 'packages/components/src');
const DOCS_COMPONENTS_DIR = resolve(
  REPO_ROOT,
  'apps/docs/src/app/[locale]/docs/components',
);

const rawName = process.argv[2];
if (!rawName) {
  console.error('Usage: pnpm new:component <ComponentName>');
  process.exit(1);
}

if (!/^[A-Z][A-Za-z0-9]*$/.test(rawName)) {
  console.error(`Component name must be PascalCase (got "${rawName}")`);
  process.exit(1);
}

const Name = rawName;
const name = Name.charAt(0).toLowerCase() + Name.slice(1);
// PascalCase → kebab-case，兼容连续大写（XMLParser → xml-parser）
const kebab = Name.replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .toLowerCase();

const componentDir = resolve(COMPONENTS_SRC, Name);
const docsDir = resolve(DOCS_COMPONENTS_DIR, kebab);

if (existsSync(componentDir)) {
  console.error(`Component directory already exists: ${componentDir}`);
  process.exit(1);
}
if (existsSync(docsDir)) {
  console.error(`Docs directory already exists: ${docsDir}`);
  process.exit(1);
}

mkdirSync(componentDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });

const componentFiles = {
  [`${Name}.types.ts`]: `import type { HTMLAttributes, ReactNode } from 'react';

export interface ${Name}Props extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}
`,

  [`${Name}.tsx`]: `/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @description 实现 ${Name} 组件的核心渲染与交互逻辑。
 */

import { forwardRef } from 'react';
import { useTheme, css } from '@emotion/react';
import type { ${Name}Props } from './${Name}.types';

export const ${Name} = forwardRef<HTMLDivElement, ${Name}Props>(function ${Name}(
  { children, ...rest },
  ref,
) {
  const theme = useTheme();
  return (
    <div
      ref={ref}
      {...rest}
      css={css\`
        display: block;
        color: \${theme.colors.text.primary};
        font-family: \${theme.typography.fontFamily.sans};
      \`}
    >
      {children}
    </div>
  );
});

${Name}.displayName = '${Name}';
`,

  [`${Name}.test.tsx`]: `import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { ${Name} } from './${Name}';

describe('${Name}', () => {
  it('renders children', () => {
    renderWithProviders(<${Name}>hello</${Name}>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('forwards refs and arbitrary attributes', () => {
    const ref = createRef<HTMLDivElement>();
    renderWithProviders(
      <${Name} ref={ref} role="region" aria-label="${name}-region">
        x
      </${Name}>,
    );
    expect(ref.current).not.toBeNull();
    expect(screen.getByRole('region', { name: '${name}-region' })).toBeInTheDocument();
  });
});
`,

  [`${Name}.a11y.test.tsx`]: `import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../test-utils';
import { ${Name} } from './${Name}';

describe('${Name} — a11y', () => {
  it('has no axe violations in default render', async () => {
    const { container } = renderWithProviders(
      <${Name} aria-label="${name}-region">content</${Name}>,
    );
    await expectA11y(container);
  });
});
`,

  'index.ts': `export * from './${Name}';
export * from './${Name}.types';
`,
};

const docsFiles = {
  'en.mdx': `# ${Name}

> Brief one-line description of what ${Name} does.

## Basic usage

<LiveDemo code={\`<${Name}>Hello ${Name}</${Name}>\`}>
  <${Name}>Hello ${Name}</${Name}>
</LiveDemo>

## Props

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| \`children\` | \`ReactNode\` | — | The content to render. |
`,

  'zh.mdx': `# ${Name}

> 一句话描述 ${Name} 的用途。

## 基础用法

<LiveDemo code={\`<${Name}>Hello ${Name}</${Name}>\`}>
  <${Name}>Hello ${Name}</${Name}>
</LiveDemo>

## API

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| \`children\` | \`ReactNode\` | — | 渲染内容 |
`,

  'page.tsx': `/**
 * @author Ryan He
 * @description 实现当前路由页面的渲染逻辑。
 */

import ZhContent from './zh.mdx';
import EnContent from './en.mdx';

export default async function ${Name}DocPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return locale === 'en' ? <EnContent /> : <ZhContent />;
}
`,
};

for (const [file, contents] of Object.entries(componentFiles)) {
  writeFileSync(resolve(componentDir, file), contents);
}
for (const [file, contents] of Object.entries(docsFiles)) {
  writeFileSync(resolve(docsDir, file), contents);
}

const barrelPath = resolve(COMPONENTS_SRC, 'index.ts');
const barrel = readFileSync(barrelPath, 'utf8');
const exportLine = `export * from './${Name}';`;
if (!barrel.includes(exportLine)) {
  const needsNewline = barrel.endsWith('\n') ? '' : '\n';
  appendFileSync(barrelPath, `${needsNewline}${exportLine}\n`);
}

console.log(`✓ Created component  ${componentDir}`);
console.log(`✓ Created docs       ${docsDir}`);
console.log(`✓ Registered export  packages/components/src/index.ts`);
console.log('');
console.log('Next steps:');
console.log(`  1. Add "${kebab}" to the appropriate group in apps/docs/src/lib/navigation.ts`);
console.log('  2. Rebuild the MCP docs index:  pnpm --filter @timeui/mcp build:index');
console.log(`  3. pnpm --filter @timeui/react test -- ${Name}`);
