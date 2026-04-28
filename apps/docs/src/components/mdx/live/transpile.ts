/**
 * @author Ryan He
 * @date 2026-04-28
 * @description LiveDemo v2 的浏览器端 transpile + 求值。
 *
 *              spec v2 §4 + team-lead task #12 directive：把用户输入的 JSX/TSX
 *              字符串变成"成功后可重复 render() 的 ReactElement 工厂"，所有失败
 *              路径都打成结构化 `error`，函数本体**绝不**抛异常（v2 §12 红线）。
 *
 *              四步算法（**必须**这个顺序）：
 *                1. STRIP IMPORTS    —— 用户 demo 里常带 `import { Button } from ...`。
 *                                       浏览器没有真实 import 解析，必须在 sucrase 之前剥掉，
 *                                       否则 sucrase 会保留为字面 `import` 语句，
 *                                       new Function 一执行就 SyntaxError。
 *                2. SUCRASE TRANSFORM —— jsx + ts + 泛型 → `React.createElement(...)`，
 *                                       classic runtime（避免 automatic runtime 的 import "react/jsx-runtime"）。
 *                                       **production: true 必需**：non-production 会注入
 *                                       `const _jsxFileName = "";` 顶层 statement，
 *                                       它无法塞进我们后续 step 3 的 `return ( ... );` wrap。
 *                3. WRAP AS RETURN    —— `return ( <transpiled> );` 让 factory 返回最后一个表达式。
 *                4. NEW Function + EVAL —— `new Function(...scopeKeys, body)` 把 scope 以位置参数
 *                                          注入；先 eager invoke 一次"试探"是否抛错（用于错误分类），
 *                                          成功后把 `() => factory(...scopeValues)` 包成 render。
 *
 *              错误分类：
 *                - parse   : sucrase 抛 SyntaxError；或 wrap 后 `new Function` 抛（顶层 await 这种）
 *                - scope   : factory 调用时 ReferenceError（scope 里没有该标识）
 *                - runtime : factory 调用时其它 throw（element-creation 内联表达式 `(null).x` 等）
 */

import { transform as sucraseTransform } from 'sucrase';
import { isValidElement, type ReactElement } from 'react';

/**
 * transpileLiveCode 的统一返回结构。
 *
 * 成功路径返回 `render: () => ReactElement | null` 而非直接 `element`：
 * - 调用方可以在每次 React 重渲染时 `result.render()` 重新构造新的 element 引用，
 *   方便嵌入到 LiveEditor 的状态机中（哪怕底层 element 内容相同，新引用也会触发
 *   diff，规避旧 hook subtree 残留的极少数边界 case）。
 * - 但因为我们在 transpile 阶段已经 eager invoke 过一次拿到了 cached element，
 *   render() 实际上只是返回缓存值，**不会重复执行用户代码**（避免 side-effect 复发）。
 *
 * `error.kind` 三档对应 spec v2 §7 的视觉分流：
 * - `'parse'`   → warning banner，preview 保留上一次成功结果
 * - `'scope'`   → warning banner，preview 保留上一次成功结果
 * - `'runtime'` → danger alert
 *
 * `line` / `column` 是 best-effort：能从 sucrase 错误消息里抽就给，
 * 抽不到 undefined（CodeMirror 会回退到不标行号）。
 */
export type TranspileResult =
  | { ok: true; render: () => ReactElement | null }
  | {
      ok: false;
      error: {
        kind: 'parse' | 'scope' | 'runtime';
        message: string;
        line?: number;
        column?: number;
      };
    };

/**
 * 把用户输入的 JSX/TSX 源码转译并求值成可 render 的 ReactElement 工厂。
 *
 * **绝不抛异常**：所有失败路径都打成 `{ ok: false, error: ... }`。
 *
 * @param code   JSX/TSX 字符串。空白只 / 空字符串 → `{ ok: true, render: () => null }`，
 *               让 SSR fallback / 编辑器清空时不报红。
 * @param scope  闭包注入的命名空间（来自 `./scope.ts` 的 `liveScope`）。
 *
 * @example
 *   const result = transpileLiveCode('<Button>OK</Button>', liveScope)
 *   if (result.ok) return result.render()
 *   else showBanner(result.error.kind, result.error.message)
 */
export function transpileLiveCode(code: string, scope: Record<string, unknown>): TranspileResult {
  // ─── 边界：空字符串 / 仅空白 → render() 返回 null（不当作错误） ──────────
  if (code.trim() === '') {
    return { ok: true, render: () => null };
  }

  // ─── 1. STRIP IMPORTS ────────────────────────────────────────────────
  //
  // 匹配每行起始的 `import ... ;`。多行 import（带换行的 destructuring）也能命中
  // 因为 `[^;]+?` 是 lazy 但跨行——`.` 默认不跨行，但 `[^;]` 会跨行。
  // 不处理 `import "side-effect-only";`（命中同正则）。也不处理 `import()` dynamic
  // —— 那是 expression，不会出现在行首。
  const stripped = code.replace(/^[ \t]*import\s+[^;]+?;[\r\n]?/gm, '');

  // ─── 2. SUCRASE TRANSFORM ────────────────────────────────────────────
  let transpiled: string;
  try {
    const out = sucraseTransform(stripped, {
      transforms: ['jsx', 'typescript'],
      jsxRuntime: 'classic', // 关键：classic → React.createElement / React.Fragment
      production: true, // 必需：见文件头注释
    });
    transpiled = out.code;
  } catch (e) {
    return parseFail(e);
  }

  // ─── 3. WRAP AS RETURN EXPRESSION ────────────────────────────────────
  //
  // sucrase 输出的是顶层表达式（也可能多行）；我们要把它放进 `return ( ... );` 里
  // 喂给 new Function。`use strict` 让赋值 / 重复声明等错误在 runtime 阶段早发现。
  const fnBody = `"use strict"; return (\n${transpiled}\n);`;

  // ─── 4. NEW Function + EVAL ──────────────────────────────────────────
  //
  // 以"位置参数"形式注入 scope（team-lead task #12 directive）：
  //   new Function('React', 'Fragment', 'Button', ..., body)
  //   → factory(React, Fragment, Button, ...)
  //
  // 比 `__scope` 解构方案少一次解构，但要求 scope key 是合法 JS 标识符
  // （我们的全是 PascalCase 组件名 / camelCase hook 名，安全）。
  const scopeKeys = Object.keys(scope);
  const scopeValues = scopeKeys.map((k) => scope[k]);

  let factory: (...args: unknown[]) => unknown;
  try {
    factory = new Function(...scopeKeys, fnBody) as (...args: unknown[]) => unknown;
  } catch (e) {
    // sucrase 通过了但 wrap 后语法错（罕见，比如用户写了顶层 `return` / `await`）→
    // 仍归为 parse，因为本质上是源码语法问题。
    return parseFail(e);
  }

  // 先 eager invoke 一次确认它不抛异常，并缓存结果。
  // 之所以不 lazy（render 时才调）：v2 §12 红线"不允许抛出"，意味着 render() 也不能 throw。
  // 把"是否抛"放到 transpile 阶段决定，render() 只返回 cached element（可能 null）。
  let cached: ReactElement | null;
  try {
    const result = factory(...scopeValues);
    if (result == null) {
      cached = null;
    } else if (isValidElement(result)) {
      cached = result;
    } else {
      // 用户写了 `'just a string'` 或数字这种"不是 React element"的表达式
      return {
        ok: false,
        error: {
          kind: 'scope',
          message: 'Code did not return a React element',
        },
      };
    }
  } catch (e) {
    const kind: 'scope' | 'runtime' = e instanceof ReferenceError ? 'scope' : 'runtime';
    return {
      ok: false,
      error: {
        kind,
        message: e instanceof Error ? e.message : String(e),
      },
    };
  }

  return { ok: true, render: () => cached };
}

// ──────────────────────────────────────────────────────────────────────
// 内部 helpers
// ──────────────────────────────────────────────────────────────────────

function parseFail(e: unknown): {
  ok: false;
  error: { kind: 'parse'; message: string; line?: number; column?: number };
} {
  const message = e instanceof Error ? e.message : String(e);
  const { line, column } = extractLineCol(message);
  return {
    ok: false,
    error: { kind: 'parse', message, line, column },
  };
}

/**
 * 从 sucrase 抛出的异常消息里提取 line / column。
 *
 * sucrase 错误消息一般形如 `"Unexpected token (3:5)"` 或 `"... at line 3, column 5"`，
 * 我们尽量两种格式都兼容；提不到就返回 `{}`，让调用方默认不带行号。
 */
function extractLineCol(msg: string): { line?: number; column?: number } {
  // 形如 `(3:5)`
  const paren = /\((\d+):(\d+)\)/.exec(msg);
  if (paren) {
    const line = Number(paren[1]);
    const column = Number(paren[2]);
    return {
      line: Number.isFinite(line) ? line : undefined,
      column: Number.isFinite(column) ? column : undefined,
    };
  }

  // 形如 `at line 3, column 5` / `line 3 column 5`
  const verbose = /line\s+(\d+)(?:[,\s]+column\s+(\d+))?/i.exec(msg);
  if (verbose) {
    const line = Number(verbose[1]);
    const column = verbose[2] !== undefined ? Number(verbose[2]) : undefined;
    return {
      line: Number.isFinite(line) ? line : undefined,
      column: column !== undefined && Number.isFinite(column) ? column : undefined,
    };
  }

  return {};
}
