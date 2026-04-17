/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 Menu / Dropdown 模块的共享 TypeScript 类型。
 */

import type { CSSProperties, ReactElement, ReactNode, Ref } from 'react';
import type { PopoverPlacement } from '../Popover';

/**
 * 数据驱动模式下单个菜单项的描述。
 *
 * 注意：本轮不实现 submenu 的浮层渲染，但保留 `children` 字段作为类型占位，
 * 以便后续无破坏性升级。
 */
export interface MenuItemDescriptor {
  /** 唯一标识。selection / onAction 都基于它。 */
  key: string;
  /** 主标签内容。 */
  label: ReactNode;
  /** 左侧图标。 */
  icon?: ReactNode;
  /** 右侧快捷键提示（如 ⌘K）。 */
  shortcut?: ReactNode;
  /** 二级描述文本（在 label 下方）。 */
  description?: ReactNode;
  /** 是否禁用：键盘跳过、点击不触发。 */
  isDisabled?: boolean;
  /** 危险项：文字与 hover bg 走 danger 色板。 */
  isDanger?: boolean;
  /** 渲染为 `<a>` 而非 `<button>`。 */
  href?: string;
  /** submenu 子项（占位 — 本轮不渲染浮层）。 */
  children?: MenuItemDescriptor[];
}

/**
 * 数据驱动模式下的分组：包含一个可选 label 与一组 items。
 */
export interface MenuSectionDescriptor {
  type: 'section';
  key: string;
  label?: ReactNode;
  items: MenuItemDescriptor[];
}

/** items 数组中允许的元素类型。 */
export type MenuItemsEntry = MenuItemDescriptor | MenuSectionDescriptor;

export type MenuSelectionMode = 'none' | 'single' | 'multiple';

/**
 * 触发器 render-prop 接收的参数。
 */
export interface MenuTriggerRenderProps {
  isOpen: boolean;
  ref: Ref<HTMLElement>;
}

export interface MenuProps {
  /** 触发器（必需）。可以是 ReactElement 或 render prop。 */
  trigger: ReactElement | ((opts: MenuTriggerRenderProps) => ReactNode);

  /** 数据驱动模式：传入扁平 items / sections 混合数组。优先级高于 children。 */
  items?: ReadonlyArray<MenuItemsEntry>;
  /** 声明式：<Menu.Item> / <Menu.Section> / <Menu.Divider> 子节点。 */
  children?: ReactNode;

  /** 受控开关。 */
  isOpen?: boolean;
  /** 非受控初始开关。 */
  defaultIsOpen?: boolean;
  /** 开关变化回调。 */
  onOpenChange?: (open: boolean) => void;

  /** 复用 Popover 的 12 种 placement。默认 'bottom-start'。 */
  placement?: PopoverPlacement;

  /** 选择模式。默认 'none'。 */
  selectionMode?: MenuSelectionMode;
  /** 受控选中集合。 */
  selectedKeys?: Iterable<string>;
  /** 非受控初始选中集合。 */
  defaultSelectedKeys?: Iterable<string>;
  /** 选中变更回调（始终接收新 Set）。 */
  onSelectionChange?: (keys: Set<string>) => void;

  /** 点击任意 item 触发，携带 key。 */
  onAction?: (key: string) => void;

  /**
   * 选中后是否关闭菜单。默认：single → true，multiple → false，none → true。
   */
  closeOnSelect?: boolean;

  /** 整个菜单禁用（trigger 仍可见但不打开）。 */
  isDisabled?: boolean;

  /** 自定义 portal 容器（透传给 Popover 时由 Popover 决定，本组件直接渲染在 Popover 内）。 */
  portalContainer?: HTMLElement;

  className?: string;
  style?: CSSProperties;
  id?: string;
  'aria-label'?: string;
}

/**
 * 复合子组件 `<Menu.Item>` 的 props。
 */
export interface MenuItemProps {
  /** 唯一标识。selection / onAction 都基于它。 */
  itemKey: string;
  icon?: ReactNode;
  shortcut?: ReactNode;
  description?: ReactNode;
  isDisabled?: boolean;
  isDanger?: boolean;
  href?: string;
  /** 此项专属的 onAction 回调（优先于 Menu 顶层 onAction 触发，但都会被调用）。 */
  onAction?: () => void;
  /** 主标签内容。 */
  children?: ReactNode;
}

/**
 * 复合子组件 `<Menu.Section>` 的 props。
 */
export interface MenuSectionProps {
  /** 分组 key（用于 React key；可选）。 */
  sectionKey?: string;
  label?: ReactNode;
  children?: ReactNode;
}

/**
 * 复合子组件 `<Menu.Divider>` 的 props。
 */
export interface MenuDividerProps {
  /** 透传 className。 */
  className?: string;
}
