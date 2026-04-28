/**
 * @author Ryan He
 * @date 2026-04-28
 * @description LiveDemo v2 scope 表的契约测试。
 *
 *              `liveScope` 是 `transpileLiveCode(code, scope)` 的右手参数；
 *              它必须满足以下不变量（spec v2 §5）：
 *                S1. 是冻结对象（runtime 改不动，避免 transpile 后用户代码污染）。
 *                S2. 暴露 `React` 命名空间（含 `Fragment` + `createElement`），
 *                    sucrase classic JSX 输出依赖此名。
 *                S3. 暴露常用 hooks（useState / useEffect / useMemo / useCallback / useRef / useId）
 *                    在顶层，让用户代码可以写 `useState(0)` 不必加 `React.` 前缀。
 *                S4. 至少包含一个 TimeUI 组件（`Button`）—— 验证 timeui-client
 *                    barrel 被正确 spread 进来。
 *                S5. 至少包含一个 docs 内部 demo wrapper（`InputFormDemo` /
 *                    `ChatOverviewDemo` 任一）—— 验证 C 档 `<XxxDemo />` 写法可用。
 *
 *              **不**测每个 demo 都在 scope 里 —— 同步规则在 CONTRIBUTING.md 里靠
 *              code review 守住，单测覆盖到"至少有一个"足够保证 spread 没断。
 */

import { describe, it, expect } from 'vitest';
import { isValidElement } from 'react';

import { liveScope } from '../scope';

describe('liveScope', () => {
  it('S1: is frozen at the top-level (cannot reassign keys at runtime)', () => {
    expect(Object.isFrozen(liveScope)).toBe(true);
  });

  it('S2: exposes a `React` namespace with Fragment + createElement', () => {
    const reactNs = (liveScope as Record<string, unknown>).React as
      | { Fragment?: unknown; createElement?: unknown }
      | undefined;
    expect(reactNs).toBeDefined();
    expect(typeof reactNs?.createElement).toBe('function');
    expect(reactNs?.Fragment).toBeDefined();
  });

  it('S3: exposes the React hook + Fragment helpers at the top level', () => {
    const flat = liveScope as Record<string, unknown>;
    for (const key of [
      'Fragment',
      'useState',
      'useEffect',
      'useMemo',
      'useCallback',
      'useRef',
      'useId',
    ]) {
      expect(flat[key], `missing scope key: ${key}`).toBeDefined();
    }
  });

  it('S4: contains the TimeUI Button (proxy for the timeui-client barrel)', () => {
    const flat = liveScope as Record<string, unknown>;
    // timeui Button is `forwardRef(...)` → object (not function); we accept
    // either, the point is "it's defined and renderable".
    expect(flat.Button).toBeDefined();
    expect(['function', 'object']).toContain(typeof flat.Button);
  });

  it('S5: contains at least one docs-internal `*Demo` wrapper', () => {
    const flat = liveScope as Record<string, unknown>;
    // We assert "at least one" — the actual list is enforced by code review.
    const demoKeys = Object.keys(flat).filter((k) => /Demo$/.test(k));
    expect(demoKeys.length).toBeGreaterThan(0);
    // Each demo should be a renderable component (function or forwardRef object).
    for (const key of demoKeys) {
      const v = flat[key];
      expect(v, `${key} should be defined`).toBeDefined();
      expect(['function', 'object']).toContain(typeof v);
    }
  });

  it('createElement from the namespace produces a valid React element', () => {
    // Smoke test that React.createElement injected through scope still works
    // (transpile depends on this for sucrase classic-runtime output).
    const reactNs = (liveScope as Record<string, unknown>).React as {
      createElement: (type: string, props: unknown, ...children: unknown[]) => unknown;
    };
    const el = reactNs.createElement('div', null, 'hi');
    expect(isValidElement(el as object)).toBe(true);
  });
});
