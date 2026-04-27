/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 Table 模块的 TypeScript 类型约束。
 */

import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from 'react';

export type TableDensity = 'compact' | 'default' | 'comfortable';
export type SortDirection = 'asc' | 'desc';
export type SelectionMode = 'none' | 'single' | 'multiple';
export type TableAlign = 'left' | 'center' | 'right';
export type TableFixed = 'left' | 'right';
/**
 * 视觉风格变体。
 *
 * - `enclosed`（默认）：外圆角 + hairline 容器 + header muted bg，Apple Settings 卡片风格
 * - `divided`：无外框，header 仅保留底部 hairline strong，letter-spacing 强化，Apple Mail 列表风格
 * - `grid`：行列双向 hairline，Numbers / 报表风格，适合密集数据
 * - `quiet`：无边无线无 bg，仅靠 row hover 揭示分隔，适合文档/阅读场景
 */
export type TableVariant = 'enclosed' | 'divided' | 'grid' | 'quiet';

export interface SortDescriptor {
  columnKey: string;
  direction: SortDirection;
}

export interface TableColumn<T = unknown> {
  /** 唯一列 key */
  columnKey: string;
  /** 表头显示内容 */
  title: ReactNode;
  /** 列宽（数字 px 或 CSS 字符串） */
  width?: number | string;
  /** 列对齐 */
  align?: TableAlign;
  /** 是否可排序 */
  isSortable?: boolean;
  /** 自定义渲染单元格内容；默认显示 row[columnKey] */
  render?: (row: T, rowIndex: number) => ReactNode;
  /** 固定列；默认不固定 */
  fixed?: TableFixed;
  /** 单元格点击禁止冒泡到行选择 */
  isInteractive?: boolean;
}

export interface TableProps<T = unknown> {
  /** 列定义（必需） */
  columns: ReadonlyArray<TableColumn<T>>;
  /** 行数据（必需） */
  data: ReadonlyArray<T>;
  /** 每行 key：可以是字段名或 (row) => string */
  rowKey?: keyof T | ((row: T, index: number) => string);
  /** 默认 'default' */
  density?: TableDensity;
  /** 视觉风格，默认 `'enclosed'`。 */
  variant?: TableVariant;
  /** sticky 表头，默认 false */
  isStickyHeader?: boolean;
  /** 斑马纹，默认 false */
  isStriped?: boolean;
  /** 容器边框，**仅对 `variant="enclosed"` 生效**，默认 true */
  hasBorder?: boolean;
  /** 加载态 */
  isLoading?: boolean;
  loadingMessage?: ReactNode;
  /** 空态 */
  emptyMessage?: ReactNode;
  /** 排序 */
  sortDescriptor?: SortDescriptor;
  defaultSortDescriptor?: SortDescriptor;
  onSortChange?: (sort: SortDescriptor | undefined) => void;
  /** 行选择 */
  selectionMode?: SelectionMode;
  selectedKeys?: ReadonlyArray<string>;
  defaultSelectedKeys?: ReadonlyArray<string>;
  onSelectionChange?: (keys: ReadonlyArray<string>) => void;
  /** 哪些 key 不可选（disabled） */
  disabledKeys?: ReadonlyArray<string>;
  /** 行点击 */
  onRowClick?: (row: T, rowIndex: number, e: ReactMouseEvent) => void;
  /** 容器最大高度（启用滚动） */
  maxHeight?: number | string;
  /** className / style / id 透传到 .table-container */
  className?: string;
  style?: CSSProperties;
  id?: string;
  'aria-label'?: string;
}
