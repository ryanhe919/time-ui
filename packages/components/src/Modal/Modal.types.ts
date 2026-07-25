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

/** 缩放把手方位，按罗盘方位命名（n=上边、se=右下角，以此类推）。 */
export type ModalResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/** panel 相对视口左上角的位置与尺寸，单位 px。 */
export interface ModalRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * rect 变化来源：
 * - `init` 首次把 CSS 居中位置固化为显式坐标
 * - `drag` / `resize` 用户拖动或缩放
 * - `constrain` 视口尺寸变化后自动拉回可见区域
 */
export type ModalRectChangeReason = 'init' | 'drag' | 'resize' | 'constrain';

export interface ModalProps {
  /** 受控打开状态。 */
  isOpen?: boolean;
  /** 非受控初始打开状态。 */
  defaultOpen?: boolean;
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
  shouldBlockScroll?: boolean;
  /** 自动 focus 第一个可聚焦元素，默认 true。 */
  autoFocus?: boolean;
  /** 关闭后归还焦点到打开前的元素，默认 true。 */
  shouldReturnFocus?: boolean;

  /**
   * 允许拖动 panel，默认 false。
   *
   * 拖拽把手是内置 header（`title` 存在时），或 panel 内任意带
   * `data-timeui-modal-drag-handle` 属性的元素；把手内部的按钮、链接、输入框
   * 以及带 `data-timeui-modal-no-drag` 的元素不会触发拖动。
   * 键盘用户可用 `Ctrl/⌘ + 方向键` 移动。
   */
  isDraggable?: boolean;
  /**
   * 允许拖拽边缘 / 四角缩放 panel，默认 false。
   * 键盘用户可用 `Ctrl/⌘ + Shift + 方向键` 缩放。
   */
  isResizable?: boolean;
  /** 渲染哪些缩放把手，默认八个方位全开。 */
  resizeHandles?: ModalResizeHandle[];

  /** 受控的 panel 位置与尺寸。传入后需自行在 `onRectChange` 中更新。 */
  rect?: ModalRect;
  /** 非受控初始位置与尺寸；省略的字段回退为「按 size 档位居中」的实测值。 */
  defaultRect?: Partial<ModalRect>;
  /** 拖动 / 缩放 / 视口约束导致 rect 变化时触发。 */
  onRectChange?: (rect: ModalRect, meta: { reason: ModalRectChangeReason }) => void;

  /** 缩放下限（px），默认取自 token（240）。 */
  minWidth?: number;
  /** 缩放下限（px），默认取自 token（120）。 */
  minHeight?: number;
  /** 约束 panel 始终留在视口内，默认 true。 */
  shouldConstrainToViewport?: boolean;
  /** 关闭后丢弃拖动 / 缩放结果，下次打开重新居中，默认 true。 */
  shouldResetRectOnClose?: boolean;

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
