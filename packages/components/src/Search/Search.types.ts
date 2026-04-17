/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 Search 组件族的共享 TypeScript 类型。
 */

import type { ReactNode, CSSProperties } from 'react';

/** 单条搜索结果。 */
export interface SearchDialogItem {
  /** 唯一标识。 */
  id: string;
  /** 主标签。 */
  label: ReactNode;
  /** 右侧辅助文本（如 URL、快捷键）。 */
  hint?: ReactNode;
  /** 左侧图标。 */
  icon?: ReactNode;
  /** 链接地址（提供时点击会优先走 onSelect，但消费方可基于此做导航）。 */
  href?: string;
  /** 单项禁用。 */
  isDisabled?: boolean;
  /** 用户自定义的额外字段（透传到 onSelect）。 */
  [key: string]: unknown;
}

/** 一组带标题的搜索结果。 */
export interface SearchDialogSection {
  id: string;
  /** 区段标题（缺省则只渲染条目）。 */
  title?: ReactNode;
  items: ReadonlyArray<SearchDialogItem>;
}

export interface SearchDialogCommonStyleProps {
  className?: string;
  style?: CSSProperties;
  id?: string;
}

export interface SearchDialogProps extends SearchDialogCommonStyleProps {
  // ── 开关 ─────────────────────────────────────────────────
  /** 受控打开状态。 */
  isOpen?: boolean;
  /** 非受控初始打开状态。 */
  defaultIsOpen?: boolean;
  /** 打开 / 关闭回调。 */
  onOpenChange?: (open: boolean) => void;

  // ── 数据 ─────────────────────────────────────────────────
  /** 扁平列表。`sections` 优先于 `items`。 */
  items?: ReadonlyArray<SearchDialogItem>;
  /** 分组列表。 */
  sections?: ReadonlyArray<SearchDialogSection>;

  // ── 查询 ─────────────────────────────────────────────────
  /** 受控查询字符串（用于异步搜索的常见场景）。 */
  query?: string;
  /** 非受控初始查询。 */
  defaultQuery?: string;
  /** 查询变化回调。 */
  onQueryChange?: (query: string) => void;
  /**
   * 自定义过滤函数。默认对 `label`（字符串化后）做大小写无关的子串匹配。
   * 当父组件已经做了远端过滤时返回 `() => true` 即可禁用本地过滤。
   */
  filter?: (item: SearchDialogItem, query: string) => boolean;

  // ── 行为 ─────────────────────────────────────────────────
  /** 选中条目时触发（点击或 Enter）。 */
  onSelect?: (item: SearchDialogItem) => void;
  /** 选中后是否自动关闭对话框。默认 true。 */
  closeOnSelect?: boolean;
  /**
   * 全局快捷键，组件内置监听并切换 isOpen。
   * 支持简单语法：`mod+k`（mac=⌘ / 其它=Ctrl）/ `ctrl+k` / `alt+/` / `escape` 等。
   * 不传则不绑定。
   */
  shortcut?: string;

  // ── 文案 ─────────────────────────────────────────────────
  placeholder?: string;
  emptyMessage?: ReactNode;
  /** 是否显示加载状态。 */
  isLoading?: boolean;
  loadingMessage?: ReactNode;
  /** 是否在输入框右侧显示 ESC chip。默认 true。 */
  showEscapeKey?: boolean;
  /** 自定义 ESC chip 文本。默认 'ESC'。 */
  escapeKeyLabel?: ReactNode;
  /** 底部状态栏。传入 false 隐藏；传入 ReactNode 替换默认快捷键提示。 */
  footer?: ReactNode | false;

  // ── 渲染 ─────────────────────────────────────────────────
  /** 自定义条目渲染。覆盖默认 (icon + label + hint) 布局。 */
  renderItem?: (
    item: SearchDialogItem,
    options: { isHighlighted: boolean; isDisabled: boolean },
  ) => ReactNode;

  // ── 尺寸 ─────────────────────────────────────────────────
  /** 对话框宽度。默认 'min(620px, 92vw)'。 */
  width?: string | number;
  /** 结果列表最大高度（超过滚动）。默认 'min(420px, 52vh)'。 */
  maxListHeight?: string | number;
  /** 距离视口顶部的距离；不传时默认垂直居中，传入后切换为顶部偏移定位。 */
  topOffset?: string | number;

  // ── A11y ────────────────────────────────────────────────
  'aria-label'?: string;
}
