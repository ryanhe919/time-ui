/**
 * @author Ryan He
 * @date 2026-04-28
 * @description One-shot static audit: walks every LiveDemo `code={...}` in mdx,
 *              runs the same transpile pipeline as the browser (sucrase +
 *              fragment-wrap + new Function), and flags any block that throws
 *              ParseError / ScopeError / RuntimeError when evaluated against a
 *              mock scope built from scope.ts + timeui-client.tsx.
 *
 *              Skips blocks that already declare `previewSource="children"`.
 *
 *              Properly handles multi-line `code={\`...\`}` by walking with a
 *              brace + template-literal balanced parser instead of a naive
 *              regex (the latter gets fooled by JSX `>` characters embedded
 *              inside the code template).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { transform } from 'sucrase';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(here, '..');
const repoRoot = resolve(docsRoot, '../..');

// ──────────────────────────────────────────────────────────────────────
// 1. Build the set of identifiers liveScope provides at runtime.
// ──────────────────────────────────────────────────────────────────────

const scopeSrc = readFileSync(resolve(docsRoot, 'src/components/mdx/live/scope.ts'), 'utf8');
const timeuiSrc = readFileSync(resolve(docsRoot, 'src/components/timeui-client.tsx'), 'utf8');

const scopeIds = new Set([
  'React',
  'Fragment',
  'useState',
  'useEffect',
  'useMemo',
  'useCallback',
  'useRef',
  'useId',
]);

// scope.ts named imports (demo wrappers + hooks)
for (const m of scopeSrc.matchAll(/import\s+\{([^}]+)\}\s+from/g)) {
  for (const raw of m[1].split(',')) {
    const name = raw.trim().split(/\s+as\s+/).pop()?.trim();
    if (name && /^[A-Za-z_$][\w$]*$/.test(name)) scopeIds.add(name);
  }
}

// timeui-client.tsx — `...TimeUI` spread surfaces every identifier exported
// here. Cover both `export { A, B }` and the namespace-export pattern used in
// timeui-client (which is just a barrel re-export).
for (const m of timeuiSrc.matchAll(/export\s+\{([^}]+)\}/g)) {
  for (const raw of m[1].split(',')) {
    const name = raw.trim().split(/\s+as\s+/).pop()?.trim();
    if (name && /^[A-Za-z_$][\w$]*$/.test(name)) scopeIds.add(name);
  }
}
// timeui-client uses a single `export { Foo, Bar, Baz, } from '@timeui/react'`
// where each name is on its own line — `export {` ... lines ... `}`.
// We've already covered that with the multiline-aware regex above.

// ──────────────────────────────────────────────────────────────────────
// 2. Mock scope: hooks return sane shapes; everything else is a no-op.
// ──────────────────────────────────────────────────────────────────────

const noop = () => null;
const noopHandler = () => {};
const mockReact = {
  createElement: () => null,
  Fragment: noop,
};
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

// ──────────────────────────────────────────────────────────────────────
// 3. Walk mdx
// ──────────────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────────────
// 4. Locate `<LiveDemo ... >` open-tag boundaries with a balanced scanner.
//    We track:
//      - template-literal state (`...`) — `>` and `{` inside a template are
//        treated as ordinary characters
//      - JSX-attribute brace depth (`={...}`) — `>` only counts when depth is 0
//    so multi-line `code={\`<Table\n.../>\`}>` resolves to the outer `>`.
// ──────────────────────────────────────────────────────────────────────

function findLiveDemoOpenTags(text) {
  const tags = [];
  let i = 0;
  while (true) {
    const idx = text.indexOf('<LiveDemo', i);
    if (idx === -1) break;
    // Word boundary check after `LiveDemo`
    const after = text[idx + '<LiveDemo'.length] ?? '';
    if (/[A-Za-z0-9_$]/.test(after)) {
      i = idx + 1;
      continue;
    }

    let j = idx + '<LiveDemo'.length;
    let braceDepth = 0;
    let inTemplate = false;
    let inString = null; // '"' or "'"
    let templateBraceStack = []; // remember braceDepth before each ${...}

    while (j < text.length) {
      const c = text[j];

      if (inTemplate) {
        if (c === '\\') { j += 2; continue; }
        if (c === '`') {
          inTemplate = false;
          j++;
          continue;
        }
        if (c === '$' && text[j + 1] === '{') {
          templateBraceStack.push(braceDepth);
          braceDepth++;
          j += 2;
          continue;
        }
        j++;
        continue;
      }

      if (inString) {
        if (c === '\\') { j += 2; continue; }
        if (c === inString) { inString = null; j++; continue; }
        j++;
        continue;
      }

      if (c === '`') {
        inTemplate = true;
        j++;
        continue;
      }
      if (c === '"' || c === "'") {
        inString = c;
        j++;
        continue;
      }
      if (c === '{') {
        braceDepth++;
        j++;
        continue;
      }
      if (c === '}') {
        braceDepth--;
        // If we just popped a template-${...}, return to template state
        if (templateBraceStack.length && braceDepth === templateBraceStack[templateBraceStack.length - 1]) {
          templateBraceStack.pop();
          inTemplate = true;
        }
        j++;
        continue;
      }
      if (c === '/' && text[j + 1] === '>' && braceDepth === 0) {
        // self-closing — also possible (no children) but in this codebase
        // LiveDemo always has children; still handle.
        tags.push({ start: idx, openEnd: j + 2, body: text.slice(idx + '<LiveDemo'.length, j) });
        j += 2;
        break;
      }
      if (c === '>' && braceDepth === 0) {
        tags.push({ start: idx, openEnd: j + 1, body: text.slice(idx + '<LiveDemo'.length, j) });
        j++;
        break;
      }

      j++;
    }
    i = j;
  }
  return tags;
}

// ──────────────────────────────────────────────────────────────────────
// 5. Within an open-tag body, extract `code={\`...\`}` template content.
//    The body comes from a balanced parse so we only need to walk it once
//    and pick out the template literal.
// ──────────────────────────────────────────────────────────────────────

function extractCodeTemplate(body) {
  // Find `code=` then `{`
  let i = 0;
  while (i < body.length) {
    const m = /\bcode\s*=\s*\{/g;
    m.lastIndex = i;
    const found = m.exec(body);
    if (!found) return null;
    let j = found.index + found[0].length;
    // Skip whitespace
    while (j < body.length && /\s/.test(body[j])) j++;
    // Expect a backtick
    if (body[j] !== '`') {
      i = j;
      continue;
    }
    // Walk template literal honoring \` escapes and ${...} interpolation
    let k = j + 1;
    let depth = 0;
    while (k < body.length) {
      const c = body[k];
      if (depth > 0) {
        // inside ${...}
        if (c === '{') depth++;
        else if (c === '}') depth--;
        k++;
        continue;
      }
      if (c === '\\') { k += 2; continue; }
      if (c === '`') {
        return body.slice(j + 1, k);
      }
      if (c === '$' && body[k + 1] === '{') {
        depth++;
        k += 2;
        continue;
      }
      k++;
    }
    return null;
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────
// 6. Audit
// ──────────────────────────────────────────────────────────────────────

const failures = [];

for (const file of mdxFiles) {
  const text = readFileSync(file, 'utf8');
  const tags = findLiveDemoOpenTags(text);
  for (const t of tags) {
    if (/previewSource\s*=\s*['"]children['"]/.test(t.body)) continue;
    const code = extractCodeTemplate(t.body);
    if (code == null || code.trim() === '') continue;

    const lineNo = text.slice(0, t.start).split('\n').length;

    // Mirror transpile.ts
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
    } catch (e) {
      failures.push({
        file: relative(repoRoot, file),
        line: lineNo,
        kind: 'parse',
        message: e.message,
        codePreview: code.split('\n')[0].slice(0, 80),
      });
      continue;
    }

    const fnBody = `"use strict"; return (\n${transpiled}\n);`;
    let factory;
    try {
      factory = new Function(...scopeKeys, fnBody);
    } catch (e) {
      failures.push({
        file: relative(repoRoot, file),
        line: lineNo,
        kind: 'parse',
        message: `[wrap] ${e.message}`,
        codePreview: code.split('\n')[0].slice(0, 80),
      });
      continue;
    }
    try {
      factory(...scopeValues);
    } catch (e) {
      const kind = e instanceof ReferenceError ? 'scope' : 'runtime';
      failures.push({
        file: relative(repoRoot, file),
        line: lineNo,
        kind,
        message: e.message,
        codePreview: code.split('\n')[0].slice(0, 80),
      });
    }
  }
}

if (failures.length === 0) {
  console.log('audit-livedemo: ✓ all blocks transpile + evaluate cleanly');
  process.exit(0);
}

console.log(`audit-livedemo: ✗ ${failures.length} block(s) fail\n`);
const byFile = new Map();
for (const f of failures) {
  if (!byFile.has(f.file)) byFile.set(f.file, []);
  byFile.get(f.file).push(f);
}
for (const [file, list] of byFile) {
  console.log(`${file}`);
  for (const f of list) {
    console.log(`  L${f.line}  [${f.kind}] ${f.message}`);
    console.log(`         ${f.codePreview}`);
  }
}
process.exit(1);
