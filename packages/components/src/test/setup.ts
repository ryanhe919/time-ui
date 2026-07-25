/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Test 组件的核心渲染与交互逻辑。
 */

import '@testing-library/jest-dom/vitest';
import 'vitest-axe/extend-expect';
import * as axeMatchers from 'vitest-axe/matchers';
import { expect } from 'vitest';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
    ResizeObserverStub;
}

// jsdom 不实现 IntersectionObserver — MarkdownViewer 的 TOC 滚动监听用到。
class IntersectionObserverStub {
  constructor(_cb: unknown, _opts?: unknown) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): unknown[] {
    return [];
  }
}
if (typeof globalThis.IntersectionObserver === 'undefined') {
  (
    globalThis as unknown as { IntersectionObserver: typeof IntersectionObserverStub }
  ).IntersectionObserver = IntersectionObserverStub;
}

// jsdom 不实现 PointerEvent — Modal 的拖动 / 缩放交互基于 pointer 事件。
// MouseEvent 已带 clientX / clientY / button，足够替身之用。
if (typeof window !== 'undefined' && typeof window.PointerEvent === 'undefined') {
  Object.defineProperty(window, 'PointerEvent', {
    configurable: true,
    writable: true,
    value: MouseEvent,
  });
}

if (typeof globalThis.matchMedia === 'undefined') {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
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

if (typeof window !== 'undefined') {
  const originalGetComputedStyle = window.getComputedStyle.bind(window);
  Object.defineProperty(window, 'getComputedStyle', {
    configurable: true,
    value: (element: Element, pseudoElt?: string) => {
      if (pseudoElt) {
        return originalGetComputedStyle(element);
      }
      return originalGetComputedStyle(element);
    },
  });

  if (typeof window.Range !== 'undefined') {
    const emptyClientRects = () => [] as unknown as DOMRectList;
    const emptyBoundingRect = () =>
      ({
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    if (!window.Range.prototype.getClientRects) {
      Object.defineProperty(window.Range.prototype, 'getClientRects', {
        configurable: true,
        value: emptyClientRects,
      });
    }

    if (!window.Range.prototype.getBoundingClientRect) {
      Object.defineProperty(window.Range.prototype, 'getBoundingClientRect', {
        configurable: true,
        value: emptyBoundingRect,
      });
    }
  }
}

if (typeof HTMLCanvasElement !== 'undefined') {
  const canvasContextStub = {
    measureText: () => ({ width: 0 }),
    fillRect: () => {},
    clearRect: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: () => {},
    createImageData: () => ({ data: new Uint8ClampedArray(4) }),
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    fillText: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
  };

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: () => canvasContextStub,
  });
}

expect.extend(axeMatchers);
