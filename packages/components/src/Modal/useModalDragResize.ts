/**
 * @author Ryan He
 * @date 2026-07-25
 * @description 承载 Modal 的拖动与缩放交互：首帧测量居中位置转成显式 rect，之后由
 *              pointer 事件 / 键盘增量驱动，并统一做最小尺寸与视口边界约束。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useIsomorphicLayoutEffect } from '../utils';
import type { ModalRect, ModalRectChangeReason, ModalResizeHandle } from './Modal.types';

/** 拖拽把手的标记属性：内置 header 自带，使用方也可给任意自定义 header 加上。 */
export const MODAL_DRAG_HANDLE_ATTR = 'data-timeui-modal-drag-handle';

/** 把手内部这些元素上按下时不启动拖拽，否则自定义 header 里的按钮/输入框会失灵。 */
const INTERACTIVE_SELECTOR =
  'button, a[href], input, select, textarea, [contenteditable="true"], [data-timeui-modal-no-drag]';

const RESIZE_CURSOR: Record<ModalResizeHandle, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
};

export interface UseModalDragResizeArgs {
  isOpen: boolean;
  isDraggable: boolean;
  isResizable: boolean;
  panelRef: { current: HTMLDivElement | null };
  rect?: ModalRect;
  defaultRect?: Partial<ModalRect>;
  onRectChange?: (rect: ModalRect, meta: { reason: ModalRectChangeReason }) => void;
  minWidth: number;
  minHeight: number;
  viewportPadding: number;
  shouldConstrainToViewport: boolean;
  shouldResetRectOnClose: boolean;
}

export interface UseModalDragResizeResult {
  /** null 表示尚未接管定位，panel 仍用 CSS 居中。 */
  rect: ModalRect | null;
  /** 拖拽 / 缩放进行中——用于停掉动画、屏蔽文本选中、给 overlay 套光标。 */
  isInteracting: boolean;
  /** 交互中应该覆盖到全屏的光标；idle 时为 undefined。 */
  interactionCursor?: string;
  onPanelPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  startResize: (handle: ModalResizeHandle, event: ReactPointerEvent<HTMLElement>) => void;
  /** 键盘移动（px 增量）。 */
  nudge: (dx: number, dy: number) => void;
  /** 键盘缩放（px 增量，作用于右下边）。 */
  resizeBy: (dw: number, dh: number) => void;
}

interface InteractionState {
  mode: 'drag' | ModalResizeHandle;
  startX: number;
  startY: number;
  startRect: ModalRect;
}

function round(rect: ModalRect): ModalRect {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

export function useModalDragResize(args: UseModalDragResizeArgs): UseModalDragResizeResult {
  const {
    isOpen,
    isDraggable,
    isResizable,
    panelRef,
    rect: rectProp,
    defaultRect,
    onRectChange,
    minWidth,
    minHeight,
    viewportPadding,
    shouldConstrainToViewport,
    shouldResetRectOnClose,
  } = args;

  const isEnabled = isDraggable || isResizable;
  const isControlled = rectProp !== undefined;

  const [internalRect, setInternalRect] = useState<ModalRect | null>(null);
  const rect = isControlled ? rectProp : internalRect;

  const rectRef = useRef<ModalRect | null>(rect);
  rectRef.current = rect;

  const onRectChangeRef = useRef(onRectChange);
  onRectChangeRef.current = onRectChange;

  const [interaction, setInteraction] = useState<InteractionState | null>(null);
  const interactionRef = useRef<InteractionState | null>(null);
  interactionRef.current = interaction;

  /**
   * 统一收口的边界约束：先夹最小尺寸，再夹视口。
   * 缩放时靠 `anchor` 指明哪条边是固定的——拖左边界时被夹住的应该是左边而不是右边。
   */
  const clampRect = useCallback(
    (next: ModalRect, anchor?: { right: boolean; bottom: boolean }): ModalRect => {
      let { x, y, width, height } = next;

      if (width < minWidth) {
        if (anchor?.right) x = next.x + next.width - minWidth;
        width = minWidth;
      }
      if (height < minHeight) {
        if (anchor?.bottom) y = next.y + next.height - minHeight;
        height = minHeight;
      }

      if (shouldConstrainToViewport && typeof window !== 'undefined') {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const maxWidth = Math.max(minWidth, vw - viewportPadding * 2);
        const maxHeight = Math.max(minHeight, vh - viewportPadding * 2);

        if (width > maxWidth) {
          if (anchor?.right) x = next.x + next.width - maxWidth;
          width = maxWidth;
        }
        if (height > maxHeight) {
          if (anchor?.bottom) y = next.y + next.height - maxHeight;
          height = maxHeight;
        }

        x = Math.min(
          Math.max(x, viewportPadding),
          Math.max(viewportPadding, vw - width - viewportPadding),
        );
        y = Math.min(
          Math.max(y, viewportPadding),
          Math.max(viewportPadding, vh - height - viewportPadding),
        );
      }

      return round({ x, y, width, height });
    },
    [minWidth, minHeight, shouldConstrainToViewport, viewportPadding],
  );

  const applyRect = useCallback(
    (next: ModalRect, reason: ModalRectChangeReason) => {
      const prev = rectRef.current;
      if (
        prev &&
        prev.x === next.x &&
        prev.y === next.y &&
        prev.width === next.width &&
        prev.height === next.height
      ) {
        return;
      }
      rectRef.current = next;
      if (!isControlled) setInternalRect(next);
      onRectChangeRef.current?.(next, { reason });
    },
    [isControlled],
  );

  // ── 首帧把 CSS 居中的实际位置固化成 rect ──
  // layout effect 在 paint 前完成，用户不会看到"居中 → 显式定位"的切换。
  useIsomorphicLayoutEffect(() => {
    if (!isEnabled || !isOpen) return;
    if (rect) return;
    const el = panelRef.current;
    if (!el) return;
    const measured = el.getBoundingClientRect();
    const width = defaultRect?.width ?? measured.width;
    const height = defaultRect?.height ?? measured.height;
    const initial = clampRect({
      width,
      height,
      // 未指定坐标时按新尺寸重新居中，避免 defaultRect 只给 width 却沿用旧的居中偏移。
      x:
        defaultRect?.x ??
        (typeof window !== 'undefined' ? (window.innerWidth - width) / 2 : measured.left),
      y:
        defaultRect?.y ??
        (typeof window !== 'undefined' ? (window.innerHeight - height) / 2 : measured.top),
    });
    applyRect(initial, 'init');
    // defaultRect 刻意不入依赖：它只在首次测量时读一次，
    // 后续变化不该把用户已经拖过的窗口拽回原位。
  }, [isEnabled, isOpen, rect, clampRect, applyRect]);

  // ── 关闭后复位，下次打开重新居中 ──
  useEffect(() => {
    if (isOpen) return;
    setInteraction(null);
    if (shouldResetRectOnClose && !isControlled) {
      rectRef.current = null;
      setInternalRect(null);
    }
  }, [isOpen, shouldResetRectOnClose, isControlled]);

  // ── 视口尺寸变化时把 panel 拉回可见区域 ──
  useEffect(() => {
    if (!isEnabled || !isOpen || !shouldConstrainToViewport) return;
    if (typeof window === 'undefined') return;
    const onResize = () => {
      const current = rectRef.current;
      if (!current) return;
      applyRect(clampRect(current), 'constrain');
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isEnabled, isOpen, shouldConstrainToViewport, clampRect, applyRect]);

  // ── 拖拽 / 缩放进行中的全局指针监听 ──
  useEffect(() => {
    if (!interaction) return;
    if (typeof window === 'undefined') return;

    const onMove = (event: PointerEvent) => {
      const active = interactionRef.current;
      if (!active) return;
      // 全程以「起始 rect + 累计位移」计算，避免逐帧累加带来的漂移。
      const dx = event.clientX - active.startX;
      const dy = event.clientY - active.startY;
      const start = active.startRect;

      if (active.mode === 'drag') {
        applyRect(clampRect({ ...start, x: start.x + dx, y: start.y + dy }), 'drag');
        return;
      }

      const handle = active.mode;
      let { x, y, width, height } = start;
      if (handle.includes('e')) width = start.width + dx;
      if (handle.includes('s')) height = start.height + dy;
      if (handle.includes('w')) {
        width = start.width - dx;
        x = start.x + dx;
      }
      if (handle.includes('n')) {
        height = start.height - dy;
        y = start.y + dy;
      }
      applyRect(
        clampRect(
          { x, y, width, height },
          { right: handle.includes('w'), bottom: handle.includes('n') },
        ),
        'resize',
      );
    };

    const onEnd = () => setInteraction(null);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
  }, [interaction, applyRect, clampRect]);

  /** 交互开始前保证 rect 已就绪（受控模式下消费者可能还没给初值）。 */
  const resolveStartRect = useCallback((): ModalRect | null => {
    if (rectRef.current) return rectRef.current;
    const el = panelRef.current;
    if (!el) return null;
    const measured = el.getBoundingClientRect();
    return round({
      x: measured.left,
      y: measured.top,
      width: measured.width,
      height: measured.height,
    });
  }, [panelRef]);

  const onPanelPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDraggable || event.button !== 0) return;
      const target = event.target as HTMLElement | null;
      if (!target?.closest?.(`[${MODAL_DRAG_HANDLE_ATTR}]`)) return;
      if (target.closest(INTERACTIVE_SELECTOR)) return;
      const startRect = resolveStartRect();
      if (!startRect) return;
      event.preventDefault();
      setInteraction({
        mode: 'drag',
        startX: event.clientX,
        startY: event.clientY,
        startRect,
      });
    },
    [isDraggable, resolveStartRect],
  );

  const startResize = useCallback(
    (handle: ModalResizeHandle, event: ReactPointerEvent<HTMLElement>) => {
      if (!isResizable || event.button !== 0) return;
      const startRect = resolveStartRect();
      if (!startRect) return;
      event.preventDefault();
      event.stopPropagation();
      setInteraction({
        mode: handle,
        startX: event.clientX,
        startY: event.clientY,
        startRect,
      });
    },
    [isResizable, resolveStartRect],
  );

  const nudge = useCallback(
    (dx: number, dy: number) => {
      const current = resolveStartRect();
      if (!current) return;
      applyRect(clampRect({ ...current, x: current.x + dx, y: current.y + dy }), 'drag');
    },
    [resolveStartRect, applyRect, clampRect],
  );

  const resizeBy = useCallback(
    (dw: number, dh: number) => {
      const current = resolveStartRect();
      if (!current) return;
      applyRect(
        clampRect({ ...current, width: current.width + dw, height: current.height + dh }),
        'resize',
      );
    },
    [resolveStartRect, applyRect, clampRect],
  );

  return {
    rect: isEnabled ? (rect ?? null) : null,
    isInteracting: interaction !== null,
    interactionCursor: interaction
      ? interaction.mode === 'drag'
        ? 'move'
        : RESIZE_CURSOR[interaction.mode]
      : undefined,
    onPanelPointerDown,
    startResize,
    nudge,
    resizeBy,
  };
}
