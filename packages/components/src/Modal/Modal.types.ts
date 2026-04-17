/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 Modal 组件族的共享 TypeScript 类型。
 */

import type { CSSProperties, ReactNode } from 'react';

/** Modal 宽度档位。 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Modal 滚动行为：'inside' = body 区滚动；'outside' = panel 整体滚动。 */
export type ModalScrollBehavior = 'inside' | 'outside';

export interface ModalProps {
  /** 受控打开状态。 */
  isOpen?: boolean;
  /** 非受控初始打开状态。 */
  defaultIsOpen?: boolean;
  /** 打开 / 关闭回调。 */
  onOpenChange?: (open: boolean) => void;

  /** 宽度档位。默认 'md'。 */
  size?: ModalSize;
  /** 滚动行为。默认 'inside'。 */
  scrollBehavior?: ModalScrollBehavior;

  /** 内置 header 标题（含关闭按钮）；不传或传 false 时不渲染默认 header。 */
  title?: ReactNode;
  /** 底部按钮区。传 false 完全隐藏 footer；传 ReactNode 渲染。 */
  footer?: ReactNode | false;
  /** 是否显示关闭按钮，默认 true。 */
  showCloseButton?: boolean;

  /** ESC 关闭，默认 true。 */
  closeOnEsc?: boolean;
  /** 点击 overlay 关闭，默认 true。 */
  closeOnOverlayClick?: boolean;
  /** 锁定 body scroll，默认 true。 */
  blockScrollOnMount?: boolean;
  /** 自动 focus 第一个可聚焦元素，默认 true。 */
  autoFocus?: boolean;
  /** 关闭后归还焦点到打开前的元素，默认 true。 */
  returnFocusOnClose?: boolean;

  /** Modal 主体内容。 */
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

export interface ModalHeaderProps {
  children?: ReactNode;
  className?: string;
  id?: string;
}

export interface ModalBodyProps {
  children?: ReactNode;
  className?: string;
  id?: string;
}

export interface ModalFooterProps {
  children?: ReactNode;
  className?: string;
  id?: string;
}
