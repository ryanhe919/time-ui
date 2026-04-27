/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 Popover 组件的共享 TypeScript 类型。
 */

import type { CSSProperties, ReactElement, ReactNode, Ref } from 'react';

export type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export type PopoverTrigger = 'click' | 'hover' | 'focus' | 'manual';

/**
 * 基础方位（从 placement 解析得到）。
 */
export type PopoverSide = 'top' | 'bottom' | 'left' | 'right';

/**
 * anchor render-prop 接收的参数。
 */
export interface PopoverAnchorRenderProps {
  isOpen: boolean;
  ref: Ref<HTMLElement>;
}

export interface PopoverProps {
  /** 触发器节点（必需）。可以是 ReactElement（克隆注入事件 + ref）或 (props) => ReactNode 函数。 */
  anchor: ReactElement | ((opts: PopoverAnchorRenderProps) => ReactNode);
  /** 弹层内容。 */
  children: ReactNode;
  /** 受控开关。 */
  isOpen?: boolean;
  /** 非受控初始开关。 */
  defaultOpen?: boolean;
  /** 开关变化回调。 */
  onOpenChange?: (open: boolean) => void;
  /** 触发方式，默认 'click'。 */
  trigger?: PopoverTrigger;
  /** 弹层方位，默认 'bottom'。 */
  placement?: PopoverPlacement;
  /** anchor 与 popover 之间像素间距，默认读 theme.components.popover.offset。 */
  offset?: number;
  /** 显示箭头，默认 true。 */
  hasArrow?: boolean;
  /** 点击外部关闭，默认 true。 */
  closeOnBlur?: boolean;
  /** ESC 关闭，默认 true。 */
  closeOnEsc?: boolean;
  /** 顶部 header slot。 */
  header?: ReactNode;
  /** 底部 footer slot。 */
  footer?: ReactNode;
  /** hover 触发的进入延迟（ms），默认 0。 */
  openDelay?: number;
  /** hover 触发的离开延迟（ms），默认 100。 */
  closeDelay?: number;
  /** 透传到 panel 的 className。 */
  className?: string;
  /** 透传到 panel 的 inline style（会覆盖部分定位字段，请谨慎）。 */
  style?: CSSProperties;
  /** 透传到 panel 的 id。 */
  id?: string;
  /** A11y 标签。 */
  'aria-label'?: string;
}
