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
const targetDir = resolve(COMPONENTS_SRC, Name);

if (existsSync(targetDir)) {
  console.error(`Directory already exists: ${targetDir}`);
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });

const files = {
  [`${Name}.types.ts`]: `import type { HTMLAttributes, ReactNode } from 'react';

export interface ${Name}Props extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}
`,

  [`${Name}.tsx`]: `import styled from '@emotion/styled';
import { forwardRef } from 'react';
import type { ${Name}Props } from './${Name}.types';

const Styled${Name} = styled.div\`
  display: block;
  color: \${({ theme }) => theme.colors.text};
  font-family: \${({ theme }) => theme.tokens.typography.fontFamilyBase};
\`;

export const ${Name} = forwardRef<HTMLDivElement, ${Name}Props>(function ${Name}(
  { children, ...rest },
  ref,
) {
  return (
    <Styled${Name} ref={ref} {...rest}>
      {children}
    </Styled${Name}>
  );
});

${Name}.displayName = '${Name}';
`,

  [`${Name}.test.tsx`]: `import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '@timeui/core';
import { lightTheme } from '@timeui/themes';
import { ${Name} } from './${Name}';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>);

describe('${Name}', () => {
  it('renders children', () => {
    renderWithTheme(<${Name}>hello</${Name}>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('forwards refs and arbitrary attributes (a11y smoke)', () => {
    const ref = { current: null as HTMLDivElement | null };
    renderWithTheme(
      <${Name} ref={ref} role="region" aria-label="${name}-region">
        x
      </${Name}>,
    );
    expect(ref.current).not.toBeNull();
    expect(screen.getByRole('region', { name: '${name}-region' })).toBeInTheDocument();
  });
});
`,

  [`${Name}.stories.tsx`]: `import type { Meta, StoryObj } from '@storybook/react';
import { ${Name} } from './${Name}';

const meta: Meta<typeof ${Name}> = {
  title: 'Components/${Name}',
  component: ${Name},
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ${Name}>;

export const Default: Story = {
  args: {
    children: '${Name} content',
  },
};

export const Playground: Story = {
  args: {
    children: 'Tweak me in the Controls panel',
  },
};
`,

  'index.ts': `export * from './${Name}';
export * from './${Name}.types';
`,
};

for (const [file, contents] of Object.entries(files)) {
  writeFileSync(resolve(targetDir, file), contents);
}

const barrelPath = resolve(COMPONENTS_SRC, 'index.ts');
const barrel = readFileSync(barrelPath, 'utf8');
const exportLine = `export * from './${Name}';`;
if (!barrel.includes(exportLine)) {
  const needsNewline = barrel.endsWith('\n') ? '' : '\n';
  appendFileSync(barrelPath, `${needsNewline}${exportLine}\n`);
}

console.log(`✓ Created component ${Name} at ${targetDir}`);
console.log(`✓ Registered export in packages/components/src/index.ts`);
