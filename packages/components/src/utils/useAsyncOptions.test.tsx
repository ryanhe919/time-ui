/**
 * @author Ryan He
 * @date 2026-07-25
 * @description 直接验证 useAsyncOptions 的边界分支：返回形态归一化、分页去重、
 *              关闭策略、不可序列化参数、未启用时的空转与卸载后的写回保护。
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsyncOptions, type AsyncOptionsRequest } from './useAsyncOptions';

interface Item {
  value: string;
  label: string;
}

const items = (...values: string[]): Item[] =>
  values.map((v) => ({ value: v, label: v.toUpperCase() }));

describe('useAsyncOptions — response normalization', () => {
  it('accepts a bare array and infers hasMore from pageSize', async () => {
    const loadOptions = vi.fn(async () => items('a', 'b'));
    const { result } = renderHook(() =>
      useAsyncOptions<Item>({ loadOptions, keyword: '', isOpen: true, pageSize: 2, debounceMs: 0 }),
    );

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    // 满页 → 推断还有下一页
    expect(result.current.hasMore).toBe(true);
  });

  it('infers hasMore=false from a short array', async () => {
    const loadOptions = vi.fn(async () => items('a'));
    const { result } = renderHook(() =>
      useAsyncOptions<Item>({ loadOptions, keyword: '', isOpen: true, pageSize: 5, debounceMs: 0 }),
    );

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.hasMore).toBe(false);
  });

  it('passes through total and an explicit hasMore', async () => {
    const loadOptions = vi.fn(async () => ({ items: items('a'), hasMore: true, total: 99 }));
    const { result } = renderHook(() =>
      useAsyncOptions<Item>({ loadOptions, keyword: '', isOpen: true, pageSize: 5, debounceMs: 0 }),
    );

    await waitFor(() => expect(result.current.total).toBe(99));
    expect(result.current.hasMore).toBe(true);
  });

  it('tolerates a page object without items', async () => {
    const loadOptions = vi.fn(async () => ({}) as { items: Item[] });
    const { result } = renderHook(() =>
      useAsyncOptions<Item>({ loadOptions, keyword: '', isOpen: true, debounceMs: 0 }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual([]);
  });
});

describe('useAsyncOptions — pagination', () => {
  it('drops duplicates when pages overlap', async () => {
    const loadOptions = vi.fn(async ({ page }: AsyncOptionsRequest) =>
      page === 1
        ? { items: items('a', 'b'), hasMore: true }
        : { items: items('b', 'c'), hasMore: false },
    );
    const { result } = renderHook(() =>
      useAsyncOptions<Item>({ loadOptions, keyword: '', isOpen: true, debounceMs: 0 }),
    );

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.hasMore).toBe(false));
    expect(result.current.items.map((i) => i.value)).toEqual(['a', 'b', 'c']);
  });

  it('ignores loadMore while a request is in flight or when exhausted', async () => {
    const loadOptions = vi.fn(async () => ({ items: items('a'), hasMore: false }));
    const { result } = renderHook(() =>
      useAsyncOptions<Item>({ loadOptions, keyword: '', isOpen: true, debounceMs: 0 }),
    );

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    act(() => result.current.loadMore());
    act(() => result.current.loadMore());

    expect(loadOptions).toHaveBeenCalledTimes(1);
  });

  it('retries the failed page and keeps earlier pages', async () => {
    const loadOptions = vi
      .fn<(req: AsyncOptionsRequest) => Promise<{ items: Item[]; hasMore: boolean }>>()
      .mockResolvedValueOnce({ items: items('a'), hasMore: true })
      .mockRejectedValueOnce(new Error('nope'))
      .mockResolvedValueOnce({ items: items('b'), hasMore: false });

    const { result } = renderHook(() =>
      useAsyncOptions<Item>({ loadOptions, keyword: '', isOpen: true, debounceMs: 0 }),
    );

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.items).toHaveLength(1);

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.error).toBeUndefined();
    expect(loadOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, reason: 'retry' }),
    );
  });

  it('falls back to a falsy rejection value with a generic error', async () => {
    const loadOptions = vi.fn(() => Promise.reject());
    const { result } = renderHook(() =>
      useAsyncOptions<Item>({ loadOptions, keyword: '', isOpen: true, debounceMs: 0 }),
    );

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
  });
});

describe('useAsyncOptions — open / close lifecycle', () => {
  it('clears everything on close by default', async () => {
    const loadOptions = vi.fn(async () => ({ items: items('a'), hasMore: false }));
    const { result, rerender } = renderHook(
      (props: { isOpen: boolean }) =>
        useAsyncOptions<Item>({ loadOptions, keyword: '', debounceMs: 0, ...props }),
      { initialProps: { isOpen: true } },
    );

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    rerender({ isOpen: false });
    expect(result.current.items).toHaveLength(0);

    rerender({ isOpen: true });
    await waitFor(() => expect(loadOptions).toHaveBeenCalledTimes(2));
  });

  it('reuses the previous session when resetOnClose=false', async () => {
    const loadOptions = vi.fn(async () => ({ items: items('a'), hasMore: false }));
    const { result, rerender } = renderHook(
      (props: { isOpen: boolean }) =>
        useAsyncOptions<Item>({
          loadOptions,
          keyword: '',
          debounceMs: 0,
          resetOnClose: false,
          ...props,
        }),
      { initialProps: { isOpen: true } },
    );

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    rerender({ isOpen: false });
    expect(result.current.items).toHaveLength(1);

    rerender({ isOpen: true });
    // 入参没变 → 不该重复请求
    expect(loadOptions).toHaveBeenCalledTimes(1);
  });

  it('does not write back a response that lands after unmount', async () => {
    let resolve!: (v: { items: Item[]; hasMore: boolean }) => void;
    const loadOptions = vi.fn(
      () =>
        new Promise<{ items: Item[]; hasMore: boolean }>((r) => {
          resolve = r;
        }),
    );
    const { unmount } = renderHook(() =>
      useAsyncOptions<Item>({ loadOptions, keyword: '', isOpen: true, debounceMs: 0 }),
    );

    unmount();
    // 不应抛出「在已卸载组件上 setState」之类的错误
    await act(async () => {
      resolve({ items: items('a'), hasMore: false });
    });
  });
});

describe('useAsyncOptions — params & disabled mode', () => {
  it('survives params that cannot be serialized', async () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const loadOptions = vi.fn(async () => ({ items: items('a'), hasMore: false }));

    const { result } = renderHook(() =>
      useAsyncOptions<Item, Record<string, unknown>>({
        loadOptions,
        keyword: '',
        params: circular,
        isOpen: true,
        debounceMs: 0,
      }),
    );

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(loadOptions).toHaveBeenCalledWith(expect.objectContaining({ params: circular }));
  });

  it('stays inert without loadOptions', () => {
    const { result } = renderHook(() =>
      useAsyncOptions<Item>({ keyword: '', isOpen: true, debounceMs: 0 }),
    );

    expect(result.current.isEnabled).toBe(false);
    act(() => result.current.loadMore());
    act(() => result.current.retry());
    expect(result.current.items).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
