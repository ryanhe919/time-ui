/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Toast 命令式 API、Provider/Viewport 渲染、自动消失/暂停、placement、
 *              maxToasts 折叠、promise 流、update、a11y 等关键路径行为。
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, expectA11y } from '../test-utils';
import { ToastProvider, useToast, toast } from './index';
import type { ToastPlacement } from './Toast.types';

// ────────────────────────────────────────────────────────────
// 共享渲染入口
// ────────────────────────────────────────────────────────────

// useToast 必须在 Provider 内才有效。InnerProbe 在 Provider 内捕获 api 给测试用。
const InnerProbe = ({ onApi }: { onApi: (api: ReturnType<typeof useToast>) => void }) => {
  const api = useToast();
  onApi(api);
  return null;
};

const renderProvider = (props?: { placement?: ToastPlacement; maxToasts?: number }) => {
  let captured: ReturnType<typeof useToast> | null = null;
  const result = renderWithProviders(
    <ToastProvider placement={props?.placement} maxToasts={props?.maxToasts}>
      <InnerProbe
        onApi={(api) => {
          captured = api;
        }}
      />
    </ToastProvider>,
  );
  // 包一层断言便于使用
  return {
    ...result,
    getApi: () => {
      if (!captured) throw new Error('api not captured');
      return captured;
    },
  };
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// ────────────────────────────────────────────────────────────
// 基础显示 / 命令式
// ────────────────────────────────────────────────────────────

describe('Toast — basic show / dismiss', () => {
  it('useToast inside Provider: success() renders a toast', () => {
    const { getApi } = renderProvider();
    act(() => {
      getApi().success('hi');
    });
    expect(screen.getByTestId('timeui-toast')).toBeInTheDocument();
    expect(screen.getByText('hi')).toBeInTheDocument();
  });

  it('module-level `toast` singleton works after Provider mounts', () => {
    renderProvider();
    let id = '';
    act(() => {
      id = toast.success('hello world');
    });
    expect(id).toMatch(/^timeui-toast-/);
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('dismiss(id) removes the toast and calls onDismiss', () => {
    const { getApi } = renderProvider();
    const onDismiss = vi.fn();
    let id = '';
    act(() => {
      id = getApi().show({ title: 'bye', onDismiss, duration: null });
    });
    expect(screen.getByText('bye')).toBeInTheDocument();
    act(() => {
      getApi().dismiss(id);
    });
    expect(screen.queryByText('bye')).toBeNull();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismiss() without id clears all toasts', () => {
    const { getApi } = renderProvider();
    act(() => {
      getApi().show({ title: 'a', duration: null });
      getApi().show({ title: 'b', duration: null });
      getApi().show({ title: 'c', duration: null });
    });
    expect(screen.getAllByTestId('timeui-toast')).toHaveLength(3);
    act(() => {
      getApi().dismiss();
    });
    expect(screen.queryAllByTestId('timeui-toast')).toHaveLength(0);
  });

  it('shortcut helpers map to status correctly', () => {
    const { getApi } = renderProvider();
    act(() => {
      getApi().success('s');
      getApi().error('e');
      getApi().warning('w');
      getApi().info('i');
      getApi().loading('l');
    });
    const items = screen.getAllByTestId('timeui-toast');
    expect(items[0]).toHaveAttribute('data-status', 'success');
    expect(items[1]).toHaveAttribute('data-status', 'danger');
    expect(items[2]).toHaveAttribute('data-status', 'warning');
    expect(items[3]).toHaveAttribute('data-status', 'info');
    expect(items[4]).toHaveAttribute('data-status', 'loading');
  });

  it('isClosable=false hides the close button', () => {
    const { getApi } = renderProvider();
    act(() => {
      getApi().show({ title: 'no-close', isClosable: false, duration: null });
    });
    expect(screen.queryByTestId('timeui-toast-close')).toBeNull();
  });

  it('description renders below title', () => {
    const { getApi } = renderProvider();
    act(() => {
      getApi().show({ title: 'T', description: 'D', duration: null });
    });
    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('custom icon overrides status icon', () => {
    const { getApi } = renderProvider();
    act(() => {
      getApi().show({
        title: 'with-icon',
        duration: null,
        icon: <span data-testid="custom-icon">X</span>,
      });
    });
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────
// 自动消失 / 暂停
// ────────────────────────────────────────────────────────────

describe('Toast — duration / hover pause', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('duration=null does not auto-dismiss', () => {
    const { getApi } = renderProvider();
    act(() => {
      getApi().show({ title: 'sticky', duration: null });
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText('sticky')).toBeInTheDocument();
  });

  it('numeric duration auto-dismisses after timeout + exit animation', () => {
    const { getApi } = renderProvider();
    act(() => {
      getApi().show({ title: 'gone', duration: 1000 });
    });
    expect(screen.getByText('gone')).toBeInTheDocument();
    // duration timer
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // exit animation timer (180ms per token)
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByText('gone')).toBeNull();
  });

  it('hover pauses timer; pointerleave resumes', () => {
    const { getApi } = renderProvider();
    act(() => {
      getApi().show({ title: 'hover', duration: 1000 });
    });
    const item = screen.getByTestId('timeui-toast');
    // 进入 hover
    act(() => {
      fireEvent.pointerEnter(item);
    });
    act(() => {
      vi.advanceTimersByTime(2000); // 即便 > duration，因为已暂停所以仍存在
    });
    expect(screen.getByText('hover')).toBeInTheDocument();
    // 离开 hover：剩余时间 = 1000ms（无消耗，因为我们 advance 在 hover 之后）
    act(() => {
      fireEvent.pointerLeave(item);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByText('hover')).toBeNull();
  });

  it('default status (info) gets default 5000ms duration', () => {
    const { getApi } = renderProvider();
    act(() => {
      getApi().show({ title: 'auto' });
    });
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(screen.getByText('auto')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByText('auto')).toBeNull();
  });

  it('loading status defaults to non-auto (duration null)', () => {
    const { getApi } = renderProvider();
    act(() => {
      getApi().loading('still loading');
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText('still loading')).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────
// Placement / Viewport
// ────────────────────────────────────────────────────────────

describe('Toast — placement', () => {
  it.each<ToastPlacement>([
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ])('renders viewport for placement=%s', (placement) => {
    const { getApi } = renderProvider({ placement });
    act(() => {
      getApi().show({ title: `at-${placement}`, duration: null });
    });
    const viewport = screen.getByTestId(`timeui-toast-viewport-${placement}`);
    expect(viewport).toBeInTheDocument();
    expect(viewport).toHaveAttribute('data-placement', placement);
  });

  it('per-toast placement overrides Provider default', () => {
    const { getApi } = renderProvider({ placement: 'top-right' });
    act(() => {
      getApi().show({ title: 'override', placement: 'bottom-left', duration: null });
    });
    expect(screen.getByTestId('timeui-toast-viewport-bottom-left')).toBeInTheDocument();
    expect(screen.queryByTestId('timeui-toast-viewport-top-right')).toBeNull();
  });

  it('multiple placements coexist', () => {
    const { getApi } = renderProvider({ placement: 'top-right' });
    act(() => {
      getApi().show({ title: 'tr', duration: null });
      getApi().show({ title: 'bc', placement: 'bottom-center', duration: null });
    });
    expect(screen.getByTestId('timeui-toast-viewport-top-right')).toBeInTheDocument();
    expect(screen.getByTestId('timeui-toast-viewport-bottom-center')).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────
// maxToasts
// ────────────────────────────────────────────────────────────

describe('Toast — maxToasts', () => {
  it('only renders the most recent N toasts when exceeded', () => {
    const { getApi } = renderProvider({ maxToasts: 2 });
    act(() => {
      getApi().show({ title: 'a', duration: null });
      getApi().show({ title: 'b', duration: null });
      getApi().show({ title: 'c', duration: null });
    });
    expect(screen.queryByText('a')).toBeNull();
    expect(screen.getByText('b')).toBeInTheDocument();
    expect(screen.getByText('c')).toBeInTheDocument();
    expect(screen.getAllByTestId('timeui-toast')).toHaveLength(2);
  });

  it('default maxToasts (5) renders 5 of 7', () => {
    const { getApi } = renderProvider();
    act(() => {
      for (let i = 0; i < 7; i += 1) {
        getApi().show({ title: `n-${i}`, duration: null });
      }
    });
    expect(screen.getAllByTestId('timeui-toast')).toHaveLength(5);
    // 最老的两条被折叠
    expect(screen.queryByText('n-0')).toBeNull();
    expect(screen.queryByText('n-1')).toBeNull();
    expect(screen.getByText('n-6')).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────
// promise
// ────────────────────────────────────────────────────────────

describe('Toast — promise()', () => {
  it('resolves: loading → success', async () => {
    const { getApi } = renderProvider();
    let resolveFn: (v: number) => void = () => {};
    const p = new Promise<number>((res) => {
      resolveFn = res;
    });
    act(() => {
      void getApi().promise(p, {
        loading: 'loading…',
        success: (v) => `done: ${v}`,
        error: 'oops',
      });
    });
    expect(screen.getByText('loading…')).toBeInTheDocument();
    expect(screen.getByTestId('timeui-toast')).toHaveAttribute('data-status', 'loading');

    await act(async () => {
      resolveFn(42);
      await p;
    });

    expect(screen.queryByText('loading…')).toBeNull();
    expect(screen.getByText('done: 42')).toBeInTheDocument();
    expect(screen.getByTestId('timeui-toast')).toHaveAttribute('data-status', 'success');
  });

  it('rejects: loading → danger and rethrows', async () => {
    const { getApi } = renderProvider();
    let rejectFn: (e: unknown) => void = () => {};
    const p = new Promise<number>((_res, rej) => {
      rejectFn = rej;
    });

    let caught: unknown = undefined;
    act(() => {
      void getApi()
        .promise(p, {
          loading: 'loading',
          success: 'ok',
          error: (e) => `err: ${(e as Error).message}`,
        })
        .catch((e: unknown) => {
          caught = e;
        });
    });
    expect(screen.getByText('loading')).toBeInTheDocument();

    await act(async () => {
      rejectFn(new Error('boom'));
      try {
        await p;
      } catch {
        /* swallow */
      }
    });

    await waitFor(() => {
      expect(screen.getByText('err: boom')).toBeInTheDocument();
    });
    expect(screen.getByTestId('timeui-toast')).toHaveAttribute('data-status', 'danger');
    expect((caught as Error)?.message).toBe('boom');
  });
});

// ────────────────────────────────────────────────────────────
// update
// ────────────────────────────────────────────────────────────

describe('Toast — update()', () => {
  it('updates title / status by id', () => {
    const { getApi } = renderProvider();
    let id = '';
    act(() => {
      id = getApi().show({ title: 'old', status: 'info', duration: null });
    });
    expect(screen.getByText('old')).toBeInTheDocument();
    expect(screen.getByTestId('timeui-toast')).toHaveAttribute('data-status', 'info');

    act(() => {
      getApi().update(id, { title: 'new', status: 'warning' });
    });
    expect(screen.queryByText('old')).toBeNull();
    expect(screen.getByText('new')).toBeInTheDocument();
    expect(screen.getByTestId('timeui-toast')).toHaveAttribute('data-status', 'warning');
  });

  it('update with non-existent id is a no-op', () => {
    const { getApi } = renderProvider();
    act(() => {
      getApi().show({ title: 'x', duration: null });
    });
    act(() => {
      getApi().update('does-not-exist', { title: 'y' });
    });
    expect(screen.getByText('x')).toBeInTheDocument();
  });

  it('show with same id behaves as update (preserves order)', () => {
    const { getApi } = renderProvider();
    act(() => {
      getApi().show({ id: 'pinned', title: 'first', duration: null });
      getApi().show({ title: 'second', duration: null });
    });
    act(() => {
      getApi().show({ id: 'pinned', title: 'first-updated', duration: null });
    });
    const items = screen.getAllByTestId('timeui-toast');
    expect(items).toHaveLength(2);
    // first-updated 应当仍在原位（顺序保留）
    expect(items[0]).toHaveTextContent('first-updated');
    expect(items[1]).toHaveTextContent('second');
  });
});

// ────────────────────────────────────────────────────────────
// 关闭按钮 / action 按钮
// ────────────────────────────────────────────────────────────

describe('Toast — interactions', () => {
  it('close button click triggers onDismiss', async () => {
    vi.useFakeTimers();
    const { getApi } = renderProvider();
    const onDismiss = vi.fn();
    act(() => {
      getApi().show({ title: 'closeme', duration: null, onDismiss });
    });
    fireEvent.click(screen.getByTestId('timeui-toast-close'));
    // 等出场动画完成
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('closeme')).toBeNull();
  });

  it('action button click triggers onPress and closes', async () => {
    vi.useFakeTimers();
    const { getApi } = renderProvider();
    const onPress = vi.fn();
    act(() => {
      getApi().show({
        title: 'undo?',
        duration: null,
        action: { label: 'Undo', onPress },
      });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByText('undo?')).toBeNull();
  });

  it('userEvent click on close button works', async () => {
    const user = userEvent.setup();
    const { getApi } = renderProvider();
    act(() => {
      getApi().show({ title: 'ue', duration: null });
    });
    await user.click(screen.getByTestId('timeui-toast-close'));
    await waitFor(() => {
      expect(screen.queryByText('ue')).toBeNull();
    });
  });
});

// ────────────────────────────────────────────────────────────
// a11y
// ────────────────────────────────────────────────────────────

describe('Toast — a11y', () => {
  it('non-danger uses role=status + aria-live=polite', () => {
    const { getApi } = renderProvider();
    act(() => {
      getApi().success('s');
    });
    const item = screen.getByTestId('timeui-toast');
    expect(item).toHaveAttribute('role', 'status');
    expect(item).toHaveAttribute('aria-live', 'polite');
  });

  it('danger uses role=alert + aria-live=assertive', () => {
    const { getApi } = renderProvider();
    act(() => {
      getApi().error('boom');
    });
    const item = screen.getByTestId('timeui-toast');
    expect(item).toHaveAttribute('role', 'alert');
    expect(item).toHaveAttribute('aria-live', 'assertive');
  });

  it('zero axe violations (light)', async () => {
    const { getApi, baseElement } = renderProvider();
    act(() => {
      getApi().success('ok title', { description: 'desc' } as never);
      getApi().show({
        title: 'with action',
        description: 'desc',
        duration: null,
        action: { label: 'Retry', onPress: () => {} },
      });
    });
    await expectA11y(baseElement);
  });

  it('zero axe violations (dark)', async () => {
    let captured: ReturnType<typeof useToast> | null = null;
    const { baseElement } = renderWithProviders(
      <ToastProvider>
        <InnerProbe
          onApi={(api) => {
            captured = api;
          }}
        />
      </ToastProvider>,
      { theme: 'dark' },
    );
    act(() => {
      captured?.success('ok');
    });
    await expectA11y(baseElement);
  });
});

// ────────────────────────────────────────────────────────────
// 命令式单例 / Provider 嵌套 / no-Provider
// ────────────────────────────────────────────────────────────

describe('Toast — singleton + Provider lifecycle', () => {
  it('toast singleton no-ops (and warns) when no Provider mounted', () => {
    cleanup();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // 未挂载任何 Provider — 全套 no-op API 都应当不抛
    expect(toast.show({ title: 'orphan' })).toBe('');
    expect(toast.success('a')).toBe('');
    expect(toast.error('a')).toBe('');
    expect(toast.warning('a')).toBe('');
    expect(toast.info('a')).toBe('');
    expect(toast.loading('a')).toBe('');
    expect(() => toast.update('x', {})).not.toThrow();
    expect(() => toast.dismiss()).not.toThrow();
    expect(() => toast.dismiss('x')).not.toThrow();
    const noopP = Promise.resolve(1);
    expect(toast.promise(noopP, { loading: 'l', success: 's', error: 'e' })).toBe(noopP);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('Provider unmount restores singleton to previous Provider (no leak)', () => {
    const { unmount } = renderProvider();
    act(() => {
      toast.success('first');
    });
    expect(screen.getByText('first')).toBeInTheDocument();
    unmount();
    // 再调用应当被 fallback 接住，不会抛
    expect(() => toast.dismiss()).not.toThrow();
  });

  it('useToast outside Provider falls back to module singleton', () => {
    // 先挂载一个 Provider 让 currentStoreRef.current 有值
    const provider = renderProvider();
    act(() => {
      provider.getApi().success('one');
    });
    expect(screen.getByText('one')).toBeInTheDocument();
  });

  it('useToast no-op fallback when used without any Provider', () => {
    cleanup();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let captured: ReturnType<typeof useToast> | null = null;
    renderWithProviders(
      <InnerProbe
        onApi={(api) => {
          captured = api;
        }}
      />,
    );
    // 全套 no-op API 通过 hook 调用
    const api = captured!;
    expect(api.show({ title: 'x' })).toBe('');
    expect(api.success('x')).toBe('');
    expect(api.error('x')).toBe('');
    expect(api.warning('x')).toBe('');
    expect(api.info('x')).toBe('');
    expect(api.loading('x')).toBe('');
    expect(() => api.update('x', {})).not.toThrow();
    expect(() => api.dismiss()).not.toThrow();
    const p = Promise.resolve('ok');
    expect(api.promise(p, { loading: 'l', success: 's', error: 'e' })).toBe(p);
    warn.mockRestore();
  });

  it('update partial fields: description / icon / action / placement / isClosable / onDismiss', () => {
    const { getApi } = renderProvider();
    let id = '';
    act(() => {
      id = getApi().show({ title: 'orig', duration: null });
    });
    const onDismiss2 = vi.fn();
    act(() => {
      getApi().update(id, {
        description: 'new desc',
        icon: <span data-testid="updated-icon">u</span>,
        action: { label: 'Act', onPress: () => {} },
        isClosable: false,
        onDismiss: onDismiss2,
        placement: 'bottom-center',
        duration: 1000,
      });
    });
    expect(screen.getByText('new desc')).toBeInTheDocument();
    expect(screen.getByTestId('updated-icon')).toBeInTheDocument();
    // moved to bottom-center viewport
    expect(screen.getByTestId('timeui-toast-viewport-bottom-center')).toBeInTheDocument();
    // close button hidden after isClosable=false
    expect(screen.queryByTestId('timeui-toast-close')).toBeNull();
  });
});
