/**
 * @author Ryan He
 * @date 2026-04-28
 * @description docs 站 vitest 全局 setup。
 *
 *              - `@testing-library/jest-dom` 的 matcher 扩展，让测试可以
 *                用 `toBeInTheDocument` / `toHaveAttribute` 等读起来更顺眼的断言。
 *              - `vitest-axe` 的 `toHaveNoViolations` matcher（LiveDemo 等组件的
 *                a11y 测试都依赖它）。`@timeui/react/test-utils` 的 `expectA11y`
 *                内部直接调 `expect(...).toHaveNoViolations()`，所以必须在 setup
 *                阶段把 matcher 注册进 vitest 的 chai 实例。
 *              - `matchMedia` jsdom 没实现，docs 内部组件常用它判断视口断点；
 *                未提供 stub 时部分测试会 throw。
 *              - `ResizeObserver` / `IntersectionObserver` 也补 stub —— timeui
 *                的 Slider / Select trigger 在 mount 阶段会调 `.observe()`。
 */

import '@testing-library/jest-dom/vitest';
import 'vitest-axe/extend-expect';
import * as axeMatchers from 'vitest-axe/matchers';
import { expect } from 'vitest';

expect.extend(axeMatchers);

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
    ResizeObserverStub;
}

class IntersectionObserverStub {
  constructor(_cb?: unknown, _opts?: unknown) {
    void _cb;
    void _opts;
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): unknown[] {
    return [];
  }
}
if (typeof globalThis.IntersectionObserver === 'undefined') {
  (
    globalThis as unknown as { IntersectionObserver: typeof IntersectionObserverStub }
  ).IntersectionObserver = IntersectionObserverStub;
}

if (typeof globalThis.matchMedia === 'undefined') {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
