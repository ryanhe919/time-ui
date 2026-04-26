#!/usr/bin/env node
/**
 * Copy `pdfjs-dist/build/pdf.worker.min.mjs` into apps/docs/public/ so the
 * PdfViewer demos can resolve `workerSrc="/pdf.worker.min.mjs"` at dev / build
 * time. Runs from `predev` and `prebuild` scripts.
 *
 * The worker is intentionally NOT committed (1.3 MB and version-tied to whatever
 * pdfjs-dist resolves under node_modules), so this script is the single source
 * of truth for keeping it in sync with the installed peer.
 */

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const docsRoot = join(here, '..');
const repoRoot = join(docsRoot, '..', '..');
const dst = join(docsRoot, 'public', 'pdf.worker.min.mjs');

// pnpm hoists differently per layout — try docs-local then workspace-root.
const candidates = [
  join(docsRoot, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
  join(repoRoot, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
];

const found = candidates.find((p) => existsSync(p));
if (!found) {
  console.error(
    '[copy-pdf-worker] pdf.worker.min.mjs not found in node_modules.\n' +
      '  Tried:\n' +
      candidates.map((c) => `    - ${c}`).join('\n') +
      '\n  Run `pnpm install` first.',
  );
  process.exit(1);
}

mkdirSync(dirname(dst), { recursive: true });
copyFileSync(found, dst);
console.log(`[copy-pdf-worker] copied ${found} -> ${dst}`);
