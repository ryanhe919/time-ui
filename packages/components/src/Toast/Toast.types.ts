/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 Toast / Notification 组件的对外类型契约（命令式 API）。
 */

import type { ReactNode } from 'react';

export type ToastPlacement =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type ToastStatus = 'info' | 'success' | 'warning' | 'danger' | 'loading';

export interface ToastAction {
  /** 按钮文案（可为任意 ReactNode） */
  label: ReactNode;
  /** 点击回调；回调返回后 toast 会被关闭 */
  onPress: () => void;
}

export interface ToastOptions {
  /** 显式 id，便于 update / dismiss；不传则内部自增 */
  id?: string;
  /** 标题（粗体行） */
  title?: ReactNode;
  /** 正文描述（次级行） */
  description?: ReactNode;
  /** 决定 icon + 强调色，默认 'info' */
  status?: ToastStatus;
  /** ms；null = 不自动关；默认 5000 */
  duration?: number | null;
  /** 是否显示关闭按钮，默认 true */
  isClosable?: boolean;
  /** 覆盖默认 status icon */
  icon?: ReactNode;
  /** 操作按钮 */
  action?: ToastAction;
  /** toast 关闭时回调（无论原因） */
  onDismiss?: () => void;
  /** 覆盖 Provider 默认 placement */
  placement?: ToastPlacement;
}

export interface ToastProviderProps {
  /** 默认 'top-right' */
  placement?: ToastPlacement;
  /** 默认 5；超出折叠（仅渲染最新 N 条，其余保留在队列） */
  maxToasts?: number;
  children: ReactNode;
}

/** 用户传给 promise 的消息字段 */
export interface ToastPromiseMessages<T> {
  loading: ReactNode;
  success: ReactNode | ((value: T) => ReactNode);
  error: ReactNode | ((error: unknown) => ReactNode);
}

export interface ToastApi {
  /** 通用入口 */
  show: (opts: ToastOptions) => string;
  success: (msg: ReactNode, opts?: Omit<ToastOptions, 'status' | 'description'>) => string;
  error: (msg: ReactNode, opts?: Omit<ToastOptions, 'status' | 'description'>) => string;
  warning: (msg: ReactNode, opts?: Omit<ToastOptions, 'status' | 'description'>) => string;
  info: (msg: ReactNode, opts?: Omit<ToastOptions, 'status' | 'description'>) => string;
  loading: (msg: ReactNode, opts?: Omit<ToastOptions, 'status' | 'description'>) => string;
  /** 局部更新一条 toast */
  update: (id: string, opts: Partial<ToastOptions>) => void;
  /** 关闭：不传 id 全清 */
  dismiss: (id?: string) => void;
  /** Promise 流：loading → success / error 自动切换 */
  promise: <T>(p: Promise<T>, msgs: ToastPromiseMessages<T>) => Promise<T>;
}

/** 内部 store 中保存的 toast 实例（已归一化） */
export interface ToastInstance extends Required<
  Pick<ToastOptions, 'id' | 'status' | 'isClosable'>
> {
  title?: ReactNode;
  description?: ReactNode;
  duration: number | null;
  icon?: ReactNode;
  action?: ToastAction;
  onDismiss?: () => void;
  placement: ToastPlacement;
  /** 内部递增计数，用于稳定排序（先进先出） */
  createdAt: number;
}
