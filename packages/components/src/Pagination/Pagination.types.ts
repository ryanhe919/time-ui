/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 Pagination 模块的 TypeScript 类型约束。
 */

import type { CSSProperties, ReactNode } from 'react';

export type PaginationVariant = 'default' | 'simple' | 'mini';
export type PaginationSize = 'sm' | 'md' | 'lg';

export interface PaginationLabels {
  prev?: string;
  next?: string;
  jumperLabel?: string;
  sizeChangerLabel?: string;
  /** "{n} / {total}" 模板，simple/mini 用 */
  summary?: (page: number, totalPages: number) => ReactNode;
}

export interface PaginationProps {
  /** 总条数（必需） */
  total: number;

  /** 每页条数 */
  pageSize?: number;
  defaultPageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: ReadonlyArray<number>;

  /** 当前页（1-based） */
  page?: number;
  defaultPage?: number;
  onChange?: (page: number) => void;

  /** 默认 'default' */
  variant?: PaginationVariant;
  /** 默认 'md'；mini 强制 sm */
  size?: PaginationSize;

  /** 当前页两侧显示的页码数，默认 1 */
  siblingCount?: number;

  /** 显示页面跳转输入，默认 false */
  showQuickJumper?: boolean;
  /** 显示 pageSize 切换器，默认 false */
  showSizeChanger?: boolean;

  /** 是否禁用 */
  isDisabled?: boolean;
  /** 隐藏 prev/next 按钮 */
  hideControls?: boolean;

  /** 文案自定义（i18n） */
  labels?: PaginationLabels;

  /** className / style / id 透传到根 nav */
  className?: string;
  style?: CSSProperties;
  id?: string;
  'aria-label'?: string;
}

export type PaginationItem = { type: 'page'; page: number } | { type: 'ellipsis'; key: string };
