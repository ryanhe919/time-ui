/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 Toast 的内部 store、useToast hook 以及 module-level 的命令式 `toast` 单例。
 *
 * 设计：
 * - 每个 ToastProvider 独立持有一个 store（createToastStore）。
 * - ToastProvider 挂载时把自己的 store 写入 module-level 的 `currentStoreRef`，
 *   useToast hook 优先从 context 取，若组件树内没有 Provider（极少数场景，如命令式
 *   `toast.show(...)` 从非 React 环境调用），则退化为 `currentStoreRef`。
 * - `toast` 单例是一个对外 facade，内部一律走 `currentStoreRef.current?.getApi()`。
 *   没有任何 Provider 时调用会在 dev 下 warn 且 no-op，保持线上无异常。
 */

'use client';

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { isDev } from '../utils/env';
import type {
  ToastApi,
  ToastInstance,
  ToastOptions,
  ToastPlacement,
  ToastPromiseMessages,
  ToastStatus,
} from './Toast.types';

// ────────────────────────────────────────────────────────────
// Store
// ────────────────────────────────────────────────────────────

export interface ToastStore {
  /** React 订阅点（useSyncExternalStore） */
  subscribe: (cb: () => void) => () => void;
  getSnapshot: () => ReadonlyArray<ToastInstance>;
  /** 命令式 API */
  getApi: () => ToastApi;
  /** Provider 传入的默认 placement（动态） */
  setDefaults: (defaults: { placement: ToastPlacement }) => void;
}

let idCounter = 0;
const genId = (): string => {
  idCounter += 1;
  return `timeui-toast-${Date.now().toString(36)}-${idCounter}`;
};

let createCounter = 0;
const nextCreatedAt = () => {
  createCounter += 1;
  return createCounter;
};

export function createToastStore(initial?: { placement?: ToastPlacement }): ToastStore {
  let state: ReadonlyArray<ToastInstance> = [];
  const listeners = new Set<() => void>();
  const defaults = { placement: initial?.placement ?? ('top-right' as ToastPlacement) };

  const emit = () => {
    listeners.forEach((l) => l());
  };

  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  };

  const getSnapshot = () => state;

  const setDefaults = (next: { placement: ToastPlacement }) => {
    defaults.placement = next.placement;
  };

  const resolveOptions = (opts: ToastOptions): ToastInstance => {
    const status: ToastStatus = opts.status ?? 'info';
    const defaultDuration: number | null = status === 'loading' ? null : 5000;
    // 允许 duration=null 显式关闭自动消失。undefined 走默认。
    const duration: number | null = opts.duration === undefined ? defaultDuration : opts.duration;
    return {
      id: opts.id ?? genId(),
      title: opts.title,
      description: opts.description,
      status,
      duration,
      isClosable: opts.isClosable ?? true,
      icon: opts.icon,
      action: opts.action,
      onDismiss: opts.onDismiss,
      placement: opts.placement ?? defaults.placement,
      createdAt: nextCreatedAt(),
    };
  };

  const show = (opts: ToastOptions): string => {
    const inst = resolveOptions(opts);
    const existing = state.find((t) => t.id === inst.id);
    if (existing) {
      // 同 id 等价于 update（保留 createdAt 稳定排序）
      state = state.map((t) => (t.id === inst.id ? { ...inst, createdAt: existing.createdAt } : t));
    } else {
      state = [...state, inst];
    }
    emit();
    return inst.id;
  };

  const update = (id: string, opts: Partial<ToastOptions>) => {
    const existing = state.find((t) => t.id === id);
    if (!existing) return;
    const merged: ToastInstance = {
      ...existing,
      ...('title' in opts ? { title: opts.title } : null),
      ...('description' in opts ? { description: opts.description } : null),
      ...('status' in opts && opts.status ? { status: opts.status } : null),
      ...('duration' in opts ? { duration: opts.duration ?? null } : null),
      ...('isClosable' in opts && opts.isClosable !== undefined
        ? { isClosable: opts.isClosable }
        : null),
      ...('icon' in opts ? { icon: opts.icon } : null),
      ...('action' in opts ? { action: opts.action } : null),
      ...('onDismiss' in opts ? { onDismiss: opts.onDismiss } : null),
      ...('placement' in opts && opts.placement ? { placement: opts.placement } : null),
    };
    state = state.map((t) => (t.id === id ? merged : t));
    emit();
  };

  const dismiss = (id?: string) => {
    if (id === undefined) {
      const toClose = state;
      state = [];
      emit();
      toClose.forEach((t) => t.onDismiss?.());
      return;
    }
    const target = state.find((t) => t.id === id);
    if (!target) return;
    state = state.filter((t) => t.id !== id);
    emit();
    target.onDismiss?.();
  };

  const shortcut =
    (status: ToastStatus) =>
    (msg: ReactNode, opts?: Omit<ToastOptions, 'status' | 'description'>): string =>
      show({ ...opts, status, title: msg });

  const promise = <T>(p: Promise<T>, msgs: ToastPromiseMessages<T>): Promise<T> => {
    const id = show({ status: 'loading', title: msgs.loading, duration: null });
    return p.then(
      (value) => {
        update(id, {
          status: 'success',
          title: typeof msgs.success === 'function' ? msgs.success(value) : msgs.success,
          duration: 5000,
        });
        return value;
      },
      (err: unknown) => {
        update(id, {
          status: 'danger',
          title: typeof msgs.error === 'function' ? msgs.error(err) : msgs.error,
          duration: 5000,
        });
        throw err;
      },
    );
  };

  const api: ToastApi = {
    show,
    success: shortcut('success'),
    error: shortcut('danger'),
    warning: shortcut('warning'),
    info: shortcut('info'),
    loading: shortcut('loading'),
    update,
    dismiss,
    promise,
  };

  return {
    subscribe,
    getSnapshot,
    getApi: () => api,
    setDefaults,
  };
}

// ────────────────────────────────────────────────────────────
// Context + hook
// ────────────────────────────────────────────────────────────

export const ToastStoreContext = createContext<ToastStore | null>(null);

/** 最近一次挂载的 Provider 对应 store —— 供 module-level `toast` 单例使用。 */
export const currentStoreRef: { current: ToastStore | null } = { current: null };

/**
 * 订阅 hook：仅供 ToastViewport 内部使用。返回当前 toast 列表。
 * 声明为 export 以便于测试 / 高级消费者。
 */
export function useToastStoreSnapshot(store: ToastStore): ReadonlyArray<ToastInstance> {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

export function useToast(): ToastApi {
  const fromCtx = useContext(ToastStoreContext);
  // module-level fallback 保证命令式调用在 Provider 外也能 work（线上罕见）
  const ref = useRef<ToastApi | null>(null);
  return useMemo<ToastApi>(() => {
    const resolve = () =>
      fromCtx?.getApi() ??
      currentStoreRef.current?.getApi() ??
      makeNoopApi('useToast called outside <ToastProvider>');
    // 薄代理：即便 Provider 晚挂载，后续调用也会拿到最新 store。
    const api: ToastApi = {
      show: (o) => resolve().show(o),
      success: (m, o) => resolve().success(m, o),
      error: (m, o) => resolve().error(m, o),
      warning: (m, o) => resolve().warning(m, o),
      info: (m, o) => resolve().info(m, o),
      loading: (m, o) => resolve().loading(m, o),
      update: (id, o) => resolve().update(id, o),
      dismiss: (id) => resolve().dismiss(id),
      promise: (p, msgs) => resolve().promise(p, msgs),
    };
    ref.current = api;
    return api;
    // fromCtx 改变（Provider 卸载/重新挂载）时重建代理
  }, [fromCtx]);
}

// ────────────────────────────────────────────────────────────
// 命令式单例
// ────────────────────────────────────────────────────────────

let warnedMissingProvider = false;
function makeNoopApi(reason: string): ToastApi {
  const warnOnce = () => {
    if (!isDev) return;
    if (warnedMissingProvider) return;
    warnedMissingProvider = true;
    console.warn(`[TimeUI] ${reason}. Wrap your app with <ToastProvider/>.`);
  };
  return {
    show: () => {
      warnOnce();
      return '';
    },
    success: () => {
      warnOnce();
      return '';
    },
    error: () => {
      warnOnce();
      return '';
    },
    warning: () => {
      warnOnce();
      return '';
    },
    info: () => {
      warnOnce();
      return '';
    },
    loading: () => {
      warnOnce();
      return '';
    },
    update: () => {
      warnOnce();
    },
    dismiss: () => {
      warnOnce();
    },
    promise: <T>(p: Promise<T>) => {
      warnOnce();
      return p;
    },
  };
}

/** module-level 单例：代理到最近一次挂载的 Provider 的 store。 */
export const toast: ToastApi = {
  show: (o) => (currentStoreRef.current ?? fallback()).getApi().show(o),
  success: (m, o) => (currentStoreRef.current ?? fallback()).getApi().success(m, o),
  error: (m, o) => (currentStoreRef.current ?? fallback()).getApi().error(m, o),
  warning: (m, o) => (currentStoreRef.current ?? fallback()).getApi().warning(m, o),
  info: (m, o) => (currentStoreRef.current ?? fallback()).getApi().info(m, o),
  loading: (m, o) => (currentStoreRef.current ?? fallback()).getApi().loading(m, o),
  update: (id, o) => (currentStoreRef.current ?? fallback()).getApi().update(id, o),
  dismiss: (id) => (currentStoreRef.current ?? fallback()).getApi().dismiss(id),
  promise: (p, msgs) => (currentStoreRef.current ?? fallback()).getApi().promise(p, msgs),
};

// 无 Provider 时的 no-op store（返回 ToastStore 形状以复用 getApi() 路径）
function fallback(): ToastStore {
  return {
    subscribe: () => () => {},
    getSnapshot: () => [],
    setDefaults: () => {},
    getApi: () => makeNoopApi('`toast` called before any <ToastProvider> mounted'),
  };
}
