/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 useChatStream hook 的累积、生命周期回调与取消行为。
 */

import { describe, it, expect, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useChatStream } from '../useChatStream';

async function* chunks(...parts: string[]) {
  for (const p of parts) yield p;
}

/** 受控的 async iterable：每个 yield 等待外部 release()。 */
function gatedSource() {
  type Resolver = (v: IteratorResult<string>) => void;
  const queue: Array<IteratorResult<string>> = [];
  const waiters: Resolver[] = [];

  function push(result: IteratorResult<string>) {
    const w = waiters.shift();
    if (w) w(result);
    else queue.push(result);
  }

  return {
    push: (chunk: string) => push({ value: chunk, done: false }),
    end: () => push({ value: undefined as unknown as string, done: true }),
    iter: {
      [Symbol.asyncIterator]() {
        return {
          next(): Promise<IteratorResult<string>> {
            const ready = queue.shift();
            if (ready) return Promise.resolve(ready);
            return new Promise<IteratorResult<string>>((resolve) => {
              waiters.push(resolve);
            });
          },
        };
      },
    } as AsyncIterable<string>,
  };
}

describe('useChatStream — basic accumulation', () => {
  it('accumulates yielded chunks into the text state', async () => {
    const { result } = renderHook(() => useChatStream());
    let final = '';
    await act(async () => {
      final = await result.current.start(chunks('hello', ', ', 'world'));
    });
    expect(final).toBe('hello, world');
    expect(result.current.text).toBe('hello, world');
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns empty string if the iterable is empty', async () => {
    const { result } = renderHook(() => useChatStream());
    let final = 'sentinel';
    await act(async () => {
      final = await result.current.start(chunks());
    });
    expect(final).toBe('');
    expect(result.current.text).toBe('');
  });
});

describe('useChatStream — lifecycle callbacks', () => {
  it('fires onStart, onUpdate (per chunk), then onComplete in order', async () => {
    const calls: string[] = [];
    const onStart = vi.fn(() => calls.push('start'));
    const onUpdate = vi.fn((t: string) => calls.push(`update:${t}`));
    const onComplete = vi.fn((t: string) => calls.push(`complete:${t}`));
    const onError = vi.fn();
    const { result } = renderHook(() => useChatStream({ onStart, onUpdate, onComplete, onError }));
    await act(async () => {
      await result.current.start(chunks('a', 'b'));
    });
    expect(calls).toEqual(['start', 'update:a', 'update:ab', 'complete:ab']);
    expect(onError).not.toHaveBeenCalled();
  });

  it('latest callbacks win across re-renders (callbacks held by ref)', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(
      ({ cb }: { cb: (t: string) => void }) => useChatStream({ onUpdate: cb }),
      { initialProps: { cb: first } },
    );
    rerender({ cb: second });
    await act(async () => {
      await result.current.start(chunks('x'));
    });
    expect(second).toHaveBeenCalledWith('x');
    expect(first).not.toHaveBeenCalled();
  });
});

describe('useChatStream — error handling', () => {
  it('sets error state and calls onError when the generator throws', async () => {
    const onError = vi.fn();
    const onComplete = vi.fn();
    async function* boom() {
      yield 'partial';
      throw new Error('boom');
    }
    const { result } = renderHook(() => useChatStream({ onError, onComplete }));
    await act(async () => {
      await result.current.start(boom());
    });
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('boom');
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.text).toBe('partial');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('clears previous error on the next start', async () => {
    // eslint-disable-next-line require-yield
    async function* boom() {
      throw new Error('x');
    }
    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      await result.current.start(boom());
    });
    expect(result.current.error).not.toBeNull();
    await act(async () => {
      await result.current.start(chunks('ok'));
    });
    expect(result.current.error).toBeNull();
    expect(result.current.text).toBe('ok');
  });
});

describe('useChatStream — cancel', () => {
  it('cancel mid-stream stops further updates and sets isStreaming=false', async () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const src = gatedSource();
    const { result } = renderHook(() => useChatStream({ onUpdate, onComplete }));

    let started!: Promise<string>;
    act(() => {
      started = result.current.start(src.iter);
    });

    // First chunk → text becomes 'a'
    await act(async () => {
      src.push('a');
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.text).toBe('a'));
    expect(result.current.isStreaming).toBe(true);

    // Cancel.
    act(() => {
      result.current.cancel();
    });
    expect(result.current.isStreaming).toBe(false);

    // Push more after cancel: state should NOT update further.
    await act(async () => {
      src.push('b');
      src.end();
      await started;
    });
    expect(result.current.text).toBe('a');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('calling cancel when no stream is in flight is a no-op', () => {
    const { result } = renderHook(() => useChatStream());
    act(() => {
      result.current.cancel();
    });
    expect(result.current.isStreaming).toBe(false);
  });
});

describe('useChatStream — reset', () => {
  it('reset clears text without canceling an in-flight stream', async () => {
    const src = gatedSource();
    const { result } = renderHook(() => useChatStream());

    let started!: Promise<string>;
    act(() => {
      started = result.current.start(src.iter);
    });
    await act(async () => {
      src.push('a');
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.text).toBe('a'));
    expect(result.current.isStreaming).toBe(true);

    act(() => {
      result.current.reset();
    });
    expect(result.current.text).toBe('');
    // Still streaming after reset.
    expect(result.current.isStreaming).toBe(true);

    await act(async () => {
      src.push('b');
      src.end();
      await started;
    });
    // After 'b' arrives the accumulated text continues from the running closure (which still
    // has 'a' + 'b'); reset only flushes the displayed state.
    expect(result.current.text).toBe('ab');
    expect(result.current.isStreaming).toBe(false);
  });
});

describe('useChatStream — repeated start', () => {
  it('start() called again resets text and aborts the previous run', async () => {
    const src = gatedSource();
    const { result } = renderHook(() => useChatStream());

    let firstPromise!: Promise<string>;
    act(() => {
      firstPromise = result.current.start(src.iter);
    });
    await act(async () => {
      src.push('first');
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.text).toBe('first'));

    // Start a second stream while the first is still alive.
    let second = '';
    await act(async () => {
      second = await result.current.start(chunks('second'));
    });
    expect(second).toBe('second');
    expect(result.current.text).toBe('second');
    expect(result.current.isStreaming).toBe(false);

    // Allow the first stream to complete; it should NOT clobber state.
    await act(async () => {
      src.push('LATE');
      src.end();
      await firstPromise;
    });
    expect(result.current.text).toBe('second');
  });
});

describe('useChatStream — abort edge cases', () => {
  it('cancel after the iterator has fully drained does not double-fire onComplete', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useChatStream({ onComplete }));
    await act(async () => {
      await result.current.start(chunks('a'));
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    act(() => {
      result.current.cancel();
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('cancel while the generator is awaiting a chunk swallows the post-loop completion', async () => {
    const onComplete = vi.fn();
    const onError = vi.fn();
    const src = gatedSource();
    const { result } = renderHook(() => useChatStream({ onComplete, onError }));
    let started!: Promise<string>;
    act(() => {
      started = result.current.start(src.iter);
    });
    // Cancel before any chunk arrives.
    act(() => {
      result.current.cancel();
    });
    // Then end the iterator to let the for-await loop reach its post-loop check.
    await act(async () => {
      src.end();
      await started;
    });
    expect(onComplete).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.isStreaming).toBe(false);
  });

  it('cancel while the generator throws swallows the error path', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useChatStream({ onError }));
    let resolveLater!: () => void;
    async function* slowBoom() {
      yield 'partial';
      await new Promise<void>((r) => {
        resolveLater = r;
      });
      throw new Error('post-cancel error');
    }
    let started!: Promise<string>;
    act(() => {
      started = result.current.start(slowBoom());
    });
    await waitFor(() => expect(result.current.text).toBe('partial'));
    act(() => {
      result.current.cancel();
    });
    await act(async () => {
      resolveLater();
      await started;
    });
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });
});

describe('useChatStream — unmount', () => {
  it('unmount aborts any in-flight stream without throwing', async () => {
    const src = gatedSource();
    const { result, unmount } = renderHook(() => useChatStream());
    let started!: Promise<string>;
    act(() => {
      started = result.current.start(src.iter);
    });
    await act(async () => {
      src.push('hi');
      await Promise.resolve();
    });
    unmount();
    // Push after unmount should not throw.
    await act(async () => {
      src.push('more');
      src.end();
      await started;
    });
  });
});
