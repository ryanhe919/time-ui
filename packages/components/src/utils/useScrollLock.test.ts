/**
 * @author Ryan He
 * @date 2026-04-18
 * @description useScrollLock 单测：验证锁定 / 解锁的 overflow + padding-right 补偿、
 *   原值保留、嵌套 overlay 的 ref-count 行为。
 */

import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useScrollLock } from './useScrollLock';

const SCROLLBAR_WIDTH = 16;

function mockScrollbar(width: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
  Object.defineProperty(document.documentElement, 'clientWidth', {
    configurable: true,
    value: 1024 - width,
  });
}

describe('useScrollLock', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    mockScrollbar(SCROLLBAR_WIDTH);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // 强制复位，防止模块级 ref-count 污染后续用例（jsdom 单进程）。
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  it('locks overflow and adds padding-right equal to scrollbar width', () => {
    const { unmount } = renderHook(({ lock }: { lock: boolean }) => useScrollLock(lock), {
      initialProps: { lock: true },
    });
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.paddingRight).toBe(`${SCROLLBAR_WIDTH}px`);
    unmount();
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.paddingRight).toBe('');
  });

  it('does not add padding when there is no visible scrollbar (macOS overlay)', () => {
    mockScrollbar(0);
    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.paddingRight).toBe('');
    unmount();
  });

  it('preserves and restores pre-existing inline overflow / paddingRight', () => {
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '10px';
    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');
    // 已有 10px + 16px 滚动条 = 26px
    expect(document.body.style.paddingRight).toBe(`${10 + SCROLLBAR_WIDTH}px`);
    unmount();
    expect(document.body.style.overflow).toBe('auto');
    expect(document.body.style.paddingRight).toBe('10px');
  });

  it('ref-counts nested overlays — only outermost unmount restores', () => {
    const a = renderHook(() => useScrollLock(true));
    const b = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');
    b.unmount();
    expect(document.body.style.overflow).toBe('hidden'); // 还有 a
    a.unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('no-op when lock is false', () => {
    const { unmount } = renderHook(() => useScrollLock(false));
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.paddingRight).toBe('');
    unmount();
  });

  it('toggling lock on → off inside the same instance releases the lock', () => {
    const { rerender, unmount } = renderHook(({ lock }: { lock: boolean }) => useScrollLock(lock), {
      initialProps: { lock: true },
    });
    expect(document.body.style.overflow).toBe('hidden');
    act(() => rerender({ lock: false }));
    expect(document.body.style.overflow).toBe('');
    unmount();
  });
});
