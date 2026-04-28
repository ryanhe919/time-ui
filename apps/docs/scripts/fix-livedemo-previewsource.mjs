/**
 * @author Ryan He
 * @date 2026-04-28
 * @description Auto-fixer for LiveDemo blocks that the audit reports as
 *              non-evaluable. Inserts `previewSource="children"` right after
 *              `<LiveDemo` for every block whose `code={\`...\`}` cannot be
 *              transpiled or whose evaluation throws.
 *
 *              Reuses the same balanced parser as audit-livedemo.mjs.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { transform } from 'sucrase';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(here, '..');

// ── scope set (same logic as audit-livedemo.mjs) ──────────────────────
const scopeSrc = readFileSync(resolve(docsRoot, 'src/components/mdx/live/scope.ts'), 'utf8');
const timeuiSrc = readFileSync(resolve(docsRoot, 'src/components/timeui-client.tsx'), 'utf8');
const scopeIds = new Set([
  'React','Fragment','useState','useEffect','useMemo','useCallback','useRef','useId',
]);
for (const m of scopeSrc.matchAll(/import\s+\{([^}]+)\}\s+from/g)) {
  for (const raw of m[1].split(',')) {
    const name = raw.trim().split(/\s+as\s+/).pop()?.trim();
    if (name && /^[A-Za-z_$][\w$]*$/.test(name)) scopeIds.add(name);
  }
}
for (const m of timeuiSrc.matchAll(/export\s+\{([^}]+)\}/g)) {
  for (const raw of m[1].split(',')) {
    const name = raw.trim().split(/\s+as\s+/).pop()?.trim();
    if (name && /^[A-Za-z_$][\w$]*$/.test(name)) scopeIds.add(name);
  }
}

const noop = () => null;
const noopHandler = () => {};
const mockReact = { createElement: () => null, Fragment: noop };
const hookImpls = {
  useState: (init) => [typeof init === 'function' ? init() : init, noopHandler],
  useEffect: noopHandler,
  useMemo: (fn) => (typeof fn === 'function' ? fn() : null),
  useCallback: (fn) => fn,
  useRef: (v) => ({ current: v }),
  useId: () => 'mock-id',
};
const scopeKeys = Array.from(scopeIds);
const scopeValues = scopeKeys.map((k) => {
  if (k === 'React') return mockReact;
  if (k in hookImpls) return hookImpls[k];
  return noop;
});

// ── balanced LiveDemo open-tag finder (same as audit) ─────────────────
function findLiveDemoOpenTags(text) {
  const tags = [];
  let i = 0;
  while (true) {
    const idx = text.indexOf('<LiveDemo', i);
    if (idx === -1) break;
    const after = text[idx + '<LiveDemo'.length] ?? '';
    if (/[A-Za-z0-9_$]/.test(after)) { i = idx + 1; continue; }
    let j = idx + '<LiveDemo'.length;
    let braceDepth = 0;
    let inTemplate = false;
    let inString = null;
    let templateBraceStack = [];
    while (j < text.length) {
      const c = text[j];
      if (inTemplate) {
        if (c === '\\') { j += 2; continue; }
        if (c === '`') { inTemplate = false; j++; continue; }
        if (c === '$' && text[j + 1] === '{') {
          templateBraceStack.push(braceDepth); braceDepth++; j += 2; continue;
        }
        j++; continue;
      }
      if (inString) {
        if (c === '\\') { j += 2; continue; }
        if (c === inString) { inString = null; j++; continue; }
        j++; continue;
      }
      if (c === '`') { inTemplate = true; j++; continue; }
      if (c === '"' || c === "'") { inString = c; j++; continue; }
      if (c === '{') { braceDepth++; j++; continue; }
      if (c === '}') {
        braceDepth--;
        if (templateBraceStack.length && braceDepth === templateBraceStack[templateBraceStack.length - 1]) {
          templateBraceStack.pop(); inTemplate = true;
        }
        j++; continue;
      }
      if (c === '/' && text[j + 1] === '>' && braceDepth === 0) {
        tags.push({ start: idx, openEnd: j + 2, body: text.slice(idx + '<LiveDemo'.length, j) });
        j += 2; break;
      }
      if (c === '>' && braceDepth === 0) {
        tags.push({ start: idx, openEnd: j + 1, body: text.slice(idx + '<LiveDemo'.length, j) });
        j++; break;
      }
      j++;
    }
    i = j;
  }
  return tags;
}

function extractCodeTemplate(body) {
  let i = 0;
  while (i < body.length) {
    const m = /\bcode\s*=\s*\{/g;
    m.lastIndex = i;
    const found = m.exec(body);
    if (!found) return null;
    let j = found.index + found[0].length;
    while (j < body.length && /\s/.test(body[j])) j++;
    if (body[j] !== '`') { i = j; continue; }
    let k = j + 1;
    let depth = 0;
    while (k < body.length) {
      const c = body[k];
      if (depth > 0) {
        if (c === '{') depth++;
        else if (c === '}') depth--;
        k++; continue;
      }
      if (c === '\\') { k += 2; continue; }
      if (c === '`') return body.slice(j + 1, k);
      if (c === '$' && body[k + 1] === '{') { depth++; k += 2; continue; }
      k++;
    }
    return null;
  }
  return null;
}

function blockFails(code) {
  if (code.trim() === '') return false;
  const stripped = code.replace(/^[ \t]*import\s+[^;]+?;[\r\n]?/gm, '');
  const trimStart = stripped.replace(/^\s+/, '').charAt(0);
  const wrapped = trimStart === '<' ? `<>\n${stripped}\n</>` : stripped;
  let transpiled;
  try {
    transpiled = transform(wrapped, {
      transforms: ['jsx', 'typescript'],
      jsxRuntime: 'classic',
      production: true,
    }).code;
  } catch { return true; }
  const fnBody = `"use strict"; return (\n${transpiled}\n);`;
  let factory;
  try { factory = new Function(...scopeKeys, fnBody); } catch { return true; }
  try { factory(...scopeValues); return false; } catch { return true; }
}

// ── walk + rewrite ─────────────────────────────────────────────────────
function walkMdx(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walkMdx(p));
    else if (f.endsWith('.mdx')) out.push(p);
  }
  return out;
}
const mdxFiles = walkMdx(resolve(docsRoot, 'src/app/[locale]/docs/components'));

let totalEdits = 0;
for (const file of mdxFiles) {
  const original = readFileSync(file, 'utf8');
  const tags = findLiveDemoOpenTags(original);
  // Process tags right-to-left so earlier offsets stay valid as we rewrite.
  const ordered = [...tags].sort((a, b) => b.start - a.start);

  let text = original;
  let edits = 0;
  for (const t of ordered) {
    if (/previewSource\s*=\s*['"]children['"]/.test(t.body)) continue;
    const code = extractCodeTemplate(t.body);
    if (code == null) continue;
    if (!blockFails(code)) continue;
    // Insert `previewSource="children"` right after `<LiveDemo`
    const insertAt = t.start + '<LiveDemo'.length;
    text = text.slice(0, insertAt) + ' previewSource="children"' + text.slice(insertAt);
    edits++;
  }
  if (edits > 0) {
    writeFileSync(file, text, 'utf8');
    console.log(`fixed ${edits} block(s) in ${file.replace(docsRoot, 'apps/docs')}`);
    totalEdits += edits;
  }
}

console.log(`\ntotal: ${totalEdits} edits across ${mdxFiles.length} mdx files`);
