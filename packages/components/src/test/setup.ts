import '@testing-library/jest-dom/vitest';
import 'vitest-axe/extend-expect';
import * as axeMatchers from 'vitest-axe/matchers';
import { expect } from 'vitest';

// jsdom doesn't implement ResizeObserver, which Radix primitives (Slider,
// Tooltip, …) reach for via @radix-ui/react-use-size. Stub it.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
    ResizeObserverStub;
}

// jsdom lacks DOMRect.fromRect / matchMedia in some Radix code paths.
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

// Register axe matchers globally so `expectA11y()` (and any direct
// `expect(results).toHaveNoViolations()`) just work in every test.
expect.extend(axeMatchers);
