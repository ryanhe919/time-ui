/**
 * @author Ryan He
 * @date 2026-07-25
 * @description 托管式远程选项加载：把「搜索词 debounce → 请求后端 → 分页累积 → 竞态丢弃 → 失败重试」
 *              这套下拉类组件通用逻辑收敛成一个 hook，供 Select / MultiSelect 共用。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useDebouncedValue } from './useDebouncedValue';

/** 下拉类组件 item 的最小形态；Select / MultiSelect 的 item 类型都是它的超集。 */
export interface AsyncOptionLike {
  value: string;
  label: ReactNode;
  isDisabled?: boolean;
}

/** 触发一次远程加载的原因，透传给使用方便于埋点或分支处理。 */
export type AsyncOptionsReason = 'open' | 'search' | 'params' | 'loadMore' | 'retry';

export interface AsyncOptionsRequest<P = Record<string, unknown>> {
  /** 当前搜索词（已 debounce）。 */
  keyword: string;
  /** 页码，从 1 开始。 */
  page: number;
  /** 每页条数。 */
  pageSize: number;
  /** 调用方透传的额外后端参数。 */
  params?: P;
  /** 本次加载的触发原因。 */
  reason: AsyncOptionsReason;
  /** 组件在请求过期时会 abort；转发给 fetch 即可自动取消。 */
  signal: AbortSignal;
}

/** loader 的完整返回形态；只回数组时按 `items.length >= pageSize` 推断是否还有下一页。 */
export interface AsyncOptionsPage<T> {
  items: T[];
  hasMore?: boolean;
  total?: number;
}

export type AsyncOptionsLoader<T extends AsyncOptionLike, P = Record<string, unknown>> = (
  request: AsyncOptionsRequest<P>,
) => Promise<AsyncOptionsPage<T> | T[]>;

export interface UseAsyncOptionsArgs<T extends AsyncOptionLike, P = Record<string, unknown>> {
  /** 未提供时 hook 全程空转（`isEnabled: false`），组件走原有本地数据路径。 */
  loadOptions?: AsyncOptionsLoader<T, P>;
  /** 当前搜索词（未 debounce 的原始值）。 */
  keyword: string;
  /** 透传给后端的额外参数；变化时会丢弃当前结果并从第一页重新搜索。 */
  params?: P;
  /** 每页条数，默认 20。 */
  pageSize?: number;
  /** 搜索 debounce 毫秒，默认 300。 */
  debounceMs?: number;
  /** 下拉是否展开；收起时不发请求。 */
  isOpen: boolean;
  /** 收起后是否丢弃已加载数据，默认 true（下次展开重新拉第一页）。 */
  resetOnClose?: boolean;
}

export interface UseAsyncOptionsResult<T extends AsyncOptionLike> {
  /** 已累积的所有页的 items。 */
  items: T[];
  /** 是否处于托管远程模式（即调用方提供了 loadOptions）。 */
  isEnabled: boolean;
  /** 首屏 / 重新搜索中（列表应显示 loading 占位）。 */
  isLoading: boolean;
  /** 追加下一页中（列表底部应显示 loading 行）。 */
  isLoadingMore: boolean;
  /** 是否还有下一页。 */
  hasMore: boolean;
  /** 最近一次加载失败的错误；成功后清空。 */
  error: unknown;
  /** 后端返回的总数（若提供）。 */
  total?: number;
  /** 触底时调用；内部自带并发与 hasMore 保护，可安全重复调用。 */
  loadMore: () => void;
  /** 失败后重试当前页。 */
  retry: () => void;
}

/**
 * 下拉类组件「接入后端搜索」的公共 props 契约。
 *
 * Select / MultiSelect 都 extends 它，保证两个组件的远程搜索 API 同名同义。
 * 三种用法互不冲突，按需选择：
 * 1. 默认（都不传）——纯前端过滤，行为与历史版本完全一致；
 * 2. 托管远程——只传 `loadOptions`，组件自管 loading / 分页 / 竞态 / 重试；
 * 3. 受控远程——传 `searchMode="remote"` + 自己维护 `items`，配合
 *    `onSearch` / `isLoading` / `hasMore` / `onLoadMore` 等 props 完全掌控请求。
 */
export interface AsyncSearchProps<T extends AsyncOptionLike> {
  /** 'local'（默认）前端过滤；'remote' 跳过本地过滤，直接展示 `items`。 */
  searchMode?: 'local' | 'remote';

  /** 受控搜索词。 */
  searchValue?: string;
  /** 每次击键即触发（未 debounce），用于同步受控搜索词。 */
  onSearchChange?: (keyword: string) => void;
  /** debounce 后触发；受控远程模式下在这里发请求。展开时也会带空串触发一次。 */
  onSearch?: (keyword: string) => void;
  /** 搜索 debounce 毫秒，默认 300。设为 0 可关闭。 */
  searchDebounce?: number;
  /** 自定义本地过滤规则；remote 模式下不生效。 */
  filterOption?: (input: string, item: T) => boolean;

  /** 托管远程加载器。提供后由组件接管 items、loading、分页、竞态与重试。 */
  loadOptions?: AsyncOptionsLoader<T>;
  /** 透传给 `loadOptions` 的额外后端参数；变化时自动回到第一页重新搜索。 */
  searchParams?: Record<string, unknown>;
  /** 托管模式每页条数，默认 20。 */
  pageSize?: number;
  /** 收起后丢弃远程结果，默认 true。设为 false 可在重新展开时复用已翻的页。 */
  resetOnClose?: boolean;

  /** 首屏 / 重新搜索加载态（受控远程模式）。 */
  isLoading?: boolean;
  loadingMessage?: ReactNode;
  /** 追加下一页的加载态（受控远程模式）。 */
  isLoadingMore?: boolean;
  loadingMoreMessage?: ReactNode;

  /** 是否还有下一页（受控远程模式）。 */
  hasMore?: boolean;
  /** 列表滚动触底时调用（受控远程模式）。 */
  onLoadMore?: () => void;
  /** 触底判定阈值（px），默认 48。 */
  loadMoreThreshold?: number;

  /** 加载失败提示；托管模式下内部出错会自动展示，可用它覆盖文案。 */
  loadError?: ReactNode;
  /** 点击重试按钮时调用；托管模式下还会自动重发当前请求。 */
  onRetry?: () => void;
  /** 重试按钮文案，默认 'Retry'。 */
  retryText?: ReactNode;
}

interface AsyncOptionsState<T> {
  items: T[];
  /** 已成功加载到的最大页码；0 表示尚未拿到任何一页。 */
  page: number;
  hasMore: boolean;
  total?: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: unknown;
}

const INITIAL_STATE: AsyncOptionsState<never> = {
  items: [],
  page: 0,
  hasMore: false,
  total: undefined,
  isLoading: false,
  isLoadingMore: false,
  error: undefined,
};

function normalizePage<T extends AsyncOptionLike>(
  raw: AsyncOptionsPage<T> | T[],
  pageSize: number,
): AsyncOptionsPage<T> {
  if (Array.isArray(raw)) {
    return { items: raw, hasMore: raw.length >= pageSize };
  }
  const items = raw.items ?? [];
  return {
    items,
    hasMore: raw.hasMore ?? items.length >= pageSize,
    total: raw.total,
  };
}

/** 按 value 去重地把新页追加到已有列表后面，避免后端分页重叠导致 React key 重复。 */
function appendUnique<T extends AsyncOptionLike>(prev: T[], next: T[]): T[] {
  if (prev.length === 0) return next;
  const seen = new Set(prev.map((it) => it.value));
  const fresh = next.filter((it) => !seen.has(it.value));
  return fresh.length === 0 ? prev : [...prev, ...fresh];
}

/** params 变化检测用的稳定 key；不可序列化时回退为「每次都算变化」。 */
function serializeParams(params: unknown): string {
  if (params === undefined) return '';
  try {
    return JSON.stringify(params) ?? '';
  } catch {
    return String(params);
  }
}

export function useAsyncOptions<T extends AsyncOptionLike, P = Record<string, unknown>>(
  args: UseAsyncOptionsArgs<T, P>,
): UseAsyncOptionsResult<T> {
  const {
    loadOptions,
    keyword,
    params,
    pageSize = 20,
    debounceMs = 300,
    isOpen,
    resetOnClose = true,
  } = args;

  const isEnabled = typeof loadOptions === 'function';

  const [state, setState] = useState<AsyncOptionsState<T>>(INITIAL_STATE as AsyncOptionsState<T>);

  // loader / params 放 ref，避免调用方每次渲染新建的内联函数与对象把加载 effect 打成死循环。
  const loaderRef = useRef(loadOptions);
  loaderRef.current = loadOptions;
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const pageSizeRef = useRef(pageSize);
  pageSizeRef.current = pageSize;

  /** 请求序号：只有序号等于最新值的响应才允许写回 state，天然丢弃乱序返回。 */
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  /** 记录最近一次请求的入参，供 retry 复用。 */
  const lastRequestRef = useRef<{ keyword: string; page: number } | null>(null);
  const lastParamsKeyRef = useRef<string | null>(null);
  const openedRef = useRef(false);
  const mountedRef = useRef(true);

  // 镜像 state 供事件回调同步读取——在 setState 更新函数里发副作用会被 StrictMode 双调用。
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const debouncedKeyword = useDebouncedValue(keyword, debounceMs);
  const paramsKey = useMemo(() => serializeParams(params), [params]);

  const fetchPage = useCallback(
    (page: number, reason: AsyncOptionsReason, activeKeyword: string) => {
      const loader = loaderRef.current;
      if (!loader) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      requestIdRef.current += 1;
      const requestId = requestIdRef.current;
      const isAppend = page > 1;
      lastRequestRef.current = { keyword: activeKeyword, page };

      setState((prev) => ({
        ...prev,
        // 重新搜索时立刻清空旧结果，避免"上一次搜索的选项"在新关键词下短暂可选。
        items: isAppend ? prev.items : [],
        page: isAppend ? prev.page : 0,
        isLoading: !isAppend,
        isLoadingMore: isAppend,
        error: undefined,
      }));

      const currentPageSize = pageSizeRef.current;

      Promise.resolve(
        loader({
          keyword: activeKeyword,
          page,
          pageSize: currentPageSize,
          params: paramsRef.current,
          reason,
          signal: controller.signal,
        }),
      ).then(
        (raw) => {
          if (!mountedRef.current || requestId !== requestIdRef.current) return;
          const normalized = normalizePage(raw, currentPageSize);
          setState((prev) => ({
            items: isAppend ? appendUnique(prev.items, normalized.items) : normalized.items,
            page,
            hasMore: normalized.hasMore ?? false,
            total: normalized.total,
            isLoading: false,
            isLoadingMore: false,
            error: undefined,
          }));
        },
        (err: unknown) => {
          if (!mountedRef.current || requestId !== requestIdRef.current) return;
          // 主动取消不是错误，静默丢弃即可（新请求已经接管 loading 态）。
          if (controller.signal.aborted) return;
          setState((prev) => ({
            ...prev,
            isLoading: false,
            isLoadingMore: false,
            error: err ?? new Error('Failed to load options'),
          }));
        },
      );
    },
    [],
  );

  // 展开 / 搜索词 / 后端参数变化 → 回到第一页重新加载；收起 → 中断并按需清空。
  useEffect(() => {
    if (!isEnabled) return;

    if (!isOpen) {
      openedRef.current = false;
      abortRef.current?.abort();
      abortRef.current = null;
      // 使序号失效，防止收起后到达的响应写回已清空的列表。
      requestIdRef.current += 1;
      if (resetOnClose) {
        lastRequestRef.current = null;
        lastParamsKeyRef.current = null;
        setState(INITIAL_STATE as AsyncOptionsState<T>);
      } else {
        setState((prev) => ({ ...prev, isLoading: false, isLoadingMore: false }));
      }
      return;
    }

    const justOpened = !openedRef.current;
    openedRef.current = true;

    const keywordChanged = lastRequestRef.current?.keyword !== debouncedKeyword;
    const paramsChanged = lastParamsKeyRef.current !== paramsKey;
    lastParamsKeyRef.current = paramsKey;

    // resetOnClose=false 时重新展开：入参没变就沿用上次会话已翻到的页，不做多余请求。
    if (justOpened && !keywordChanged && !paramsChanged && stateRef.current.page > 0) return;

    const reason: AsyncOptionsReason = justOpened ? 'open' : keywordChanged ? 'search' : 'params';
    fetchPage(1, reason, debouncedKeyword);
    // 依赖里放 paramsKey 而不是 params 本体：调用方每次渲染都可能传新对象引用，
    // 只有序列化结果变了才算「后端参数真的变了」。
  }, [isEnabled, isOpen, debouncedKeyword, paramsKey, resetOnClose, fetchPage]);

  const loadMore = useCallback(() => {
    if (!loaderRef.current) return;
    const snapshot = stateRef.current;
    if (snapshot.isLoading || snapshot.isLoadingMore) return;
    if (!snapshot.hasMore || snapshot.error !== undefined) return;
    fetchPage(snapshot.page + 1, 'loadMore', debouncedKeyword);
  }, [fetchPage, debouncedKeyword]);

  const retry = useCallback(() => {
    const last = lastRequestRef.current;
    fetchPage(last?.page ?? 1, 'retry', last?.keyword ?? debouncedKeyword);
  }, [fetchPage, debouncedKeyword]);

  return {
    items: state.items,
    isEnabled,
    isLoading: state.isLoading,
    isLoadingMore: state.isLoadingMore,
    hasMore: state.hasMore,
    error: state.error,
    total: state.total,
    loadMore,
    retry,
  };
}
