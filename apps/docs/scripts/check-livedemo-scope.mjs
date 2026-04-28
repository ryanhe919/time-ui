/**
 * @author Ryan He
 * @date 2026-04-28
 * @description Ensures LiveDemo's runtime scope stays in sync with MDX demo imports.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const mdxComponents = readFileSync(resolve(root, 'src/mdx-components.tsx'), 'utf8');
const liveScope = readFileSync(resolve(root, 'src/components/mdx/live/scope.ts'), 'utf8');

function extractDemoImports(source, modulePattern) {
  const names = new Set();
  const importRe = new RegExp(
    String.raw`import\s+\{([^}]+)\}\s+from\s+['"]${modulePattern}['"];?`,
    'g',
  );

  for (const match of source.matchAll(importRe)) {
    for (const rawName of match[1].split(',')) {
      const name = rawName.trim().split(/\s+as\s+/)[0]?.trim();
      if (name?.endsWith('Demo') && name !== 'LiveDemo') {
        names.add(name);
      }
    }
  }

  return [...names].sort();
}

const mdxDemoImports = extractDemoImports(
  mdxComponents,
  String.raw`@/components/mdx/[^'"]+`,
);
const scopeDemoImports = extractDemoImports(liveScope, String.raw`\.\./[^'"]+`);

const missingFromScope = mdxDemoImports.filter((name) => !scopeDemoImports.includes(name));
const extraInScope = scopeDemoImports.filter((name) => !mdxDemoImports.includes(name));

if (missingFromScope.length > 0 || extraInScope.length > 0) {
  console.error('LiveDemo scope imports are out of sync with mdx-components.tsx.');
  if (missingFromScope.length > 0) {
    console.error(`Missing from scope.ts: ${missingFromScope.join(', ')}`);
  }
  if (extraInScope.length > 0) {
    console.error(`Extra in scope.ts: ${extraInScope.join(', ')}`);
  }
  process.exit(1);
}
