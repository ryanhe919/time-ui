/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 Drawer 组件族的共享 TypeScript 类型。
 */

import type { CSSProperties, ReactNode } from 'react';

/** Drawer 贴边方向。 */
export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';

/** Drawer 尺寸档位（横向用 width 系列、纵向用 height 系列）。 */
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Drawer 滚动行为：'inside' = body 区滚动；'outside' = panel 整体滚动。 */
export type DrawerScrollBehavior = 'inside' | 'outside';

export interface DrawerProps {
  /** 受控打开状态。 */
  isOpen?: boolean;
  /** 非受控初始打开状态。 */
  defaultIsOpen?: boolean;
  /** 打开 / 关闭回调。 */
  onOpenChange?: (open: boolean) => void;

  /** 贴边方向。默认 'right'。 */
  placement?: DrawerPlacement;
  /** 尺寸档位。默认 'md'。 */
  size?: DrawerSize;

  /** 点击 overlay 是否关闭，默认 true。 */
  isDismissable?: boolean;
  /** 禁用 ESC 关闭，默认 false。 */
  isKeyboardDismissDisabled?: boolean;
  /** 隐藏右上角关闭按钮，默认 false。 */
  hideCloseButton?: boolean;

  /** 滚动行为，默认 'inside'。 */
  scrollBehavior?: DrawerScrollBehavior;

  /** Portal 容器，默认 document.body。 */
  portalContainer?: HTMLElement;

  /** 顶部 header 内容。 */
  header?: ReactNode;
  /** 底部 footer 内容。 */
  footer?: ReactNode;

  /** Drawer 主体内容。 */
  children?: ReactNode;
  /** 透传到 panel 的 className。 */
  className?: string;
  /** 透传到 panel 的 style。 */
  style?: CSSProperties;
  /** 自定义 id（默认自动生成）。 */
  id?: string;

  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export interface DrawerHeaderProps {
  children?: ReactNode;
  className?: string;
}

export interface DrawerBodyProps {
  children?: ReactNode;
  className?: string;
}

export interface DrawerFooterProps {
  children?: ReactNode;
  className?: string;
}
