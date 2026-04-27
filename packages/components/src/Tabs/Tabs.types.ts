/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 Tabs 模块的 TypeScript 类型约束。
 */

import type { ReactNode, CSSProperties } from 'react';

export type TabsVariant = 'underline' | 'pills' | 'bordered';
export type TabsSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TabsOrientation = 'horizontal' | 'vertical';

/** 数据驱动模式下单个 Tab 的描述。 */
export interface TabItem {
  /** 唯一 key，用于受控选中。 */
  itemKey: string;
  /** Tab 头显示内容（文本 / ReactNode）。 */
  label: ReactNode;
  /** 文本前的图标。 */
  icon?: ReactNode;
  /** 单独禁用该项。 */
  isDisabled?: boolean;
  /** 数据驱动模式下的面板内容。 */
  content?: ReactNode;
}

export interface TabsProps {
  /** 受控选中 key。 */
  selectedKey?: string;
  /** 非受控初始选中 key。 */
  defaultSelectedKey?: string;
  /** 选中变更回调。 */
  onSelectionChange?: (key: string) => void;

  /** 数据驱动模式（优先级高于 children）。 */
  items?: ReadonlyArray<TabItem>;
  /** 声明式：<Tab itemKey="x" label="..."><TabPanel>...</TabPanel></Tab>。 */
  children?: ReactNode;

  /** 视觉变体。默认 'underline'。 */
  variant?: TabsVariant;
  /** 尺寸。默认 'md'。 */
  size?: TabsSize;
  /** 排列方向。默认 'horizontal'。 */
  orientation?: TabsOrientation;

  /** 是否懒加载 panel（仅当前激活的 mount）。默认 false。 */
  isLazy?: boolean;
  /** 全局禁用所有 tabs。 */
  isDisabled?: boolean;
  /** 一组 key，禁用这些 tabs。 */
  disabledKeys?: ReadonlyArray<string>;

  className?: string;
  style?: CSSProperties;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export interface TabProps {
  /** 真正参与选择的 key（避免与 React key 冲突）。 */
  itemKey: string;
  label: ReactNode;
  icon?: ReactNode;
  isDisabled?: boolean;
  /** 内嵌 TabPanel 或其他面板内容。 */
  children?: ReactNode;
}

export interface TabPanelProps {
  itemKey: string;
  children?: ReactNode;
}
