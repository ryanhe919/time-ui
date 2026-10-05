'use client';

/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 Popover 组件：基于 Portal 的浮层，支持 click / hover / focus / manual 触发，
 *              基础放置（不做溢出翻转），可选 arrow / header / footer，受控 + 非受控双轨。
 */

import {
  cloneElement,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  version as reactVersion,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type Ref,
} from 'react';
import { createPortal } from 'react-dom';
import { css, useTheme } from '@emotion/react';
import { mergeRefs, useControllableState } from '../utils';
import { useIsomorphicLayoutEffect } from '../utils/useIsomorphicLayoutEffect';
import type { PopoverPlacement, PopoverProps, PopoverSide } from './Popover.types';

// ────────────────────────────────────────────────────────────
// 内部工具
// ────────────────────────────────────────────────────────────

interface PositionResult {
  top: number;
  left: number;
  side: PopoverSide;
  align: 'start' | 'center' | 'end';
}

const parseOffsetToken = (raw: string | number | undefined, fallback: number): number => {
  if (raw === undefined) return fallback;
  if (typeof raw === 'number') return raw;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
};

const splitPlacement = (
  placement: PopoverPlacement,
): { side: PopoverSide; align: 'start' | 'center' | 'end' } => {
  const [side, alignSuffix] = placement.split('-') as [PopoverSide, 'start' | 'end' | undefined];
  return { side, align: alignSuffix ?? 'center' };
};

const OPPOSITE_SIDE: Record<PopoverSide, PopoverSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/**
 * 主轴方向上某 side 是否容得下整张 popover（含 offset 与 viewport 安全留白）。
 */
const sideHasRoom = (
  side: PopoverSide,
  anchorRect: { top: number; left: number; width: number; height: number },
  popoverSize: { width: number; height: number },
  offset: number,
  viewport: { width: number; height: number },
  padding: number,
): boolean => {
  if (side === 'top') return anchorRect.top - offset - padding >= popoverSize.height;
  if (side === 'bottom')
    return (
      viewport.height - (anchorRect.top + anchorRect.height) - offset - padding >=
      popoverSize.height
    );
  if (side === 'left') return anchorRect.left - offset - padding >= popoverSize.width;
  return (
    viewport.width - (anchorRect.left + anchorRect.width) - offset - padding >= popoverSize.width
  );
};

/**
 * 基础放置定位算法。
 *
 * 输入：anchor + popover 的 client rect、placement、像素 offset。
 * 当传入 `viewport` 时，额外做：
 *   - **Flip**：当前 side 主轴方向放不下且对侧更宽时，翻转到对侧（top↔bottom / left↔right）。
 *     避免气泡越过视口边缘被遮挡的常见 bug。
 *   - **Shift**：沿次轴 clamp 到视口内（top/bottom 时是水平 clamp；left/right 时是垂直 clamp），
 *     防止远离 anchor 的 align（start/end）让气泡飘出可视区域。
 * 不传 `viewport` 时保持纯定位行为，便于纯函数单测。
 *
 * 输出：popover 的 viewport top/left（fixed 定位用），以及解析后的 side/align（给 arrow 用）。
 */
export const computePopoverPosition = (
  anchorRect: { top: number; left: number; width: number; height: number },
  popoverSize: { width: number; height: number },
  placement: PopoverPlacement,
  offset: number,
  viewport?: { width: number; height: number },
  padding = 8,
): PositionResult => {
  let { side, align } = splitPlacement(placement);

  // ── Flip primary axis ──
  if (viewport) {
    const fits = sideHasRoom(side, anchorRect, popoverSize, offset, viewport, padding);
    const opposite = OPPOSITE_SIDE[side];
    const oppositeFits = sideHasRoom(opposite, anchorRect, popoverSize, offset, viewport, padding);
    if (!fits && oppositeFits) {
      side = opposite;
    }
  }

  let top = 0;
  let left = 0;

  if (side === 'top') {
    top = anchorRect.top - popoverSize.height - offset;
  } else if (side === 'bottom') {
    top = anchorRect.top + anchorRect.height + offset;
  } else if (side === 'left') {
    left = anchorRect.left - popoverSize.width - offset;
  } else {
    left = anchorRect.left + anchorRect.width + offset;
  }

  if (side === 'top' || side === 'bottom') {
    if (align === 'start') {
      left = anchorRect.left;
    } else if (align === 'end') {
      left = anchorRect.left + anchorRect.width - popoverSize.width;
    } else {
      left = anchorRect.left + anchorRect.width / 2 - popoverSize.width / 2;
    }
  } else {
    if (align === 'start') {
      top = anchorRect.top;
    } else if (align === 'end') {
      top = anchorRect.top + anchorRect.height - popoverSize.height;
    } else {
      top = anchorRect.top + anchorRect.height / 2 - popoverSize.height / 2;
    }
  }

  // ── Shift / clamp 次轴（top/bottom 水平，left/right 垂直）──
  if (viewport) {
    if (side === 'top' || side === 'bottom') {
      const minLeft = padding;
      const maxLeft = viewport.width - popoverSize.width - padding;
      if (maxLeft >= minLeft) {
        left = Math.min(Math.max(left, minLeft), maxLeft);
      }
    } else {
      const minTop = padding;
      const maxTop = viewport.height - popoverSize.height - padding;
      if (maxTop >= minTop) {
        top = Math.min(Math.max(top, minTop), maxTop);
      }
    }
  }

  return { top, left, side, align };
};

/**
 * 入场动画 transform 起点：把 popover 从远离 anchor 的方向滑入。
 * top → translateY(+t)，bottom → translateY(-t)，left → translateX(+t)，right → translateX(-t)。
 */
const enterTransformStart = (side: PopoverSide, distance: string): string => {
  if (side === 'top') return `translateY(${distance})`;
  if (side === 'bottom') return `translateY(-${distance})`;
  if (side === 'left') return `translateX(${distance})`;
  return `translateX(-${distance})`;
};

// ────────────────────────────────────────────────────────────
// 组件本体
// ────────────────────────────────────────────────────────────

export const Popover = forwardRef<HTMLDivElement, PopoverProps>(
  function Popover(props, forwardedRef) {
    const {
      anchor,
      children,
      isOpen,
      defaultOpen = false,
      onOpenChange,
      trigger = 'click',
      placement = 'bottom',
      offset,
      hasArrow = true,
      closeOnBlur = true,
      closeOnEsc = true,
      portalContainer,
      header,
      footer,
      openDelay = 0,
      closeDelay = 100,
      className,
      style,
      id,
      'aria-label': ariaLabel,
    } = props;

    const theme = useTheme();
    const popoverTokens = theme.components.popover;

    const autoId = useId();
    const safeAutoId = autoId.replace(/:/g, '');
    const baseId = id ?? `timeui-popover-${safeAutoId}`;
    const headerId = header ? `${baseId}-header` : undefined;

    // 受控 / 非受控
    const [open, setOpen] = useControllableState<boolean>({
      value: isOpen,
      defaultValue: (isOpen !== undefined ? undefined : defaultOpen) as boolean,
      onChange: onOpenChange,
      name: 'Popover',
    });

    const isManual = trigger === 'manual';

    // ── refs ──
    const anchorRef = useRef<HTMLElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearHoverTimer = useCallback(() => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    }, []);

    useEffect(
      () => () => {
        clearHoverTimer();
      },
      [clearHoverTimer],
    );

    // ── 定位状态 ──
    const [position, setPosition] = useState<PositionResult | null>(null);
    // 仅在客户端 mount 后才允许 portal，避免 SSR 出错。
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
      setIsMounted(true);
    }, []);

    const offsetPx = useMemo(
      () => parseOffsetToken(offset, parseOffsetToken(popoverTokens.offset, 8)),
      [offset, popoverTokens.offset],
    );

    const { side: placementSide, align: placementAlign } = useMemo(
      () => splitPlacement(placement),
      [placement],
    );

    const updatePosition = useCallback(() => {
      const anchorEl = anchorRef.current;
      const panelEl = panelRef.current;
      if (!anchorEl || !panelEl) return;
      const aRect = anchorEl.getBoundingClientRect();
      const pRect = panelEl.getBoundingClientRect();
      const next = computePopoverPosition(
        { top: aRect.top, left: aRect.left, width: aRect.width, height: aRect.height },
        { width: pRect.width, height: pRect.height },
        placement,
        offsetPx,
        { width: window.innerWidth, height: window.innerHeight },
      );
      setPosition((prev) => {
        // 浅比较防止无意义重渲染。
        if (
          prev &&
          prev.top === next.top &&
          prev.left === next.left &&
          prev.side === next.side &&
          prev.align === next.align
        ) {
          return prev;
        }
        return next;
      });
    }, [placement, offsetPx]);

    useIsomorphicLayoutEffect(() => {
      if (!open || !isMounted) {
        setPosition(null);
        return;
      }
      updatePosition();
      const onScrollResize = () => updatePosition();
      const observer =
        typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(updatePosition);
      if (anchorRef.current) observer?.observe(anchorRef.current);
      if (panelRef.current) observer?.observe(panelRef.current);
      window.addEventListener('scroll', onScrollResize, { passive: true, capture: true });
      window.addEventListener('resize', onScrollResize, { passive: true });
      return () => {
        observer?.disconnect();
        window.removeEventListener('scroll', onScrollResize, true);
        window.removeEventListener('resize', onScrollResize);
      };
    }, [open, isMounted, updatePosition]);

    // ── ESC 关闭 ──
    useEffect(() => {
      if (!open || !closeOnEsc || isManual) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          setOpen(false);
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [open, closeOnEsc, isManual, setOpen]);

    // ── 点击外部关闭 ──
    useEffect(() => {
      if (!open || !closeOnBlur || isManual) return;
      const onMouseDown = (e: MouseEvent) => {
        const target = e.target as Node | null;
        if (!target) return;
        if (anchorRef.current?.contains(target)) return;
        if (panelRef.current?.contains(target)) return;
        setOpen(false);
      };
      document.addEventListener('mousedown', onMouseDown);
      return () => document.removeEventListener('mousedown', onMouseDown);
    }, [open, closeOnBlur, isManual, setOpen]);

    // ── trigger handlers ──
    const handleAnchorClick = useCallback(
      (e: ReactMouseEvent<HTMLElement>) => {
        if (isManual || trigger !== 'click') return;
        e.preventDefault();
        setOpen(!open);
      },
      [isManual, trigger, open, setOpen],
    );

    const openWithDelay = useCallback(
      (delay: number) => {
        clearHoverTimer();
        if (delay <= 0) {
          setOpen(true);
          return;
        }
        hoverTimerRef.current = setTimeout(() => setOpen(true), delay);
      },
      [clearHoverTimer, setOpen],
    );

    const closeWithDelay = useCallback(
      (delay: number) => {
        clearHoverTimer();
        if (delay <= 0) {
          setOpen(false);
          return;
        }
        hoverTimerRef.current = setTimeout(() => setOpen(false), delay);
      },
      [clearHoverTimer, setOpen],
    );

    const handleAnchorMouseEnter = useCallback(() => {
      if (isManual || trigger !== 'hover') return;
      openWithDelay(openDelay);
    }, [isManual, trigger, openDelay, openWithDelay]);

    const handleAnchorMouseLeave = useCallback(() => {
      if (isManual || trigger !== 'hover') return;
      closeWithDelay(closeDelay);
    }, [isManual, trigger, closeDelay, closeWithDelay]);

    const handleAnchorFocus = useCallback(() => {
      if (isManual || trigger !== 'focus') return;
      setOpen(true);
    }, [isManual, trigger, setOpen]);

    const handleAnchorBlur = useCallback(() => {
      if (isManual || trigger !== 'focus') return;
      setOpen(false);
    }, [isManual, trigger, setOpen]);

    // panel 的 hover 持续 → 取消即将到来的关闭定时器。
    const handlePanelMouseEnter = useCallback(() => {
      if (isManual || trigger !== 'hover') return;
      clearHoverTimer();
    }, [isManual, trigger, clearHoverTimer]);

    const handlePanelMouseLeave = useCallback(() => {
      if (isManual || trigger !== 'hover') return;
      closeWithDelay(closeDelay);
    }, [isManual, trigger, closeDelay, closeWithDelay]);

    // ── anchor 渲染 ──
    const anchorEventProps = {
      onClick: handleAnchorClick,
      onMouseEnter: handleAnchorMouseEnter,
      onMouseLeave: handleAnchorMouseLeave,
      onFocus: handleAnchorFocus,
      onBlur: handleAnchorBlur,
      'aria-expanded': trigger === 'click' ? open : undefined,
      'aria-haspopup': trigger === 'click' ? ('dialog' as const) : undefined,
      'aria-controls': open ? baseId : undefined,
    };

    const renderAnchor = () => {
      if (typeof anchor === 'function') {
        return anchor({ isOpen: open, ref: anchorRef as Ref<HTMLElement> });
      }
      if (!isValidElement(anchor)) return null;
      const element = anchor as ReactElement<Record<string, unknown>> & {
        ref?: Ref<HTMLElement>;
      };
      const existingProps = (element.props ?? {}) as Record<string, unknown> & {
        onClick?: (e: ReactMouseEvent<HTMLElement>) => void;
        onMouseEnter?: () => void;
        onMouseLeave?: () => void;
        onFocus?: (e: ReactFocusEvent<HTMLElement>) => void;
        onBlur?: (e: ReactFocusEvent<HTMLElement>) => void;
      };
      const majorReactVersion = Number.parseInt(reactVersion.split('.')[0] ?? '18', 10);
      const existingRef =
        majorReactVersion >= 19
          ? (element.props as { ref?: Ref<HTMLElement> }).ref
          : (element as unknown as { ref?: Ref<HTMLElement> }).ref;
      const composed = {
        onClick: (e: ReactMouseEvent<HTMLElement>) => {
          existingProps.onClick?.(e);
          if (!e.defaultPrevented) anchorEventProps.onClick(e);
        },
        onMouseEnter: () => {
          existingProps.onMouseEnter?.();
          anchorEventProps.onMouseEnter();
        },
        onMouseLeave: () => {
          existingProps.onMouseLeave?.();
          anchorEventProps.onMouseLeave();
        },
        onFocus: (e: ReactFocusEvent<HTMLElement>) => {
          existingProps.onFocus?.(e);
          anchorEventProps.onFocus();
        },
        onBlur: (e: ReactFocusEvent<HTMLElement>) => {
          existingProps.onBlur?.(e);
          anchorEventProps.onBlur();
        },
        'aria-expanded': anchorEventProps['aria-expanded'],
        'aria-haspopup': anchorEventProps['aria-haspopup'],
        'aria-controls': anchorEventProps['aria-controls'],
        // React 19 puts ref on props; React 18 warns if props.ref is read.
        ref: mergeRefs<HTMLElement>(anchorRef, existingRef),
      };
      return cloneElement(element, composed as unknown as Record<string, unknown>);
    };

    // ── panel 内部 ESC 处理（兜底，焦点位于 panel 时也能捕获）──
    const handlePanelKeyDown = useCallback(
      (e: ReactKeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape' && closeOnEsc && !isManual) {
          e.stopPropagation();
          setOpen(false);
        }
      },
      [closeOnEsc, isManual, setOpen],
    );

    // ── styles ──
    const surfaceBg = theme.colors.bg.surface ?? theme.colors.bg.canvas;
    const hairline = theme.colors.border.subtle;
    const textPrimary = theme.colors.text.primary;
    const textSecondary = theme.colors.text.secondary;
    const motionEasing = theme.motion.easing as {
      emphasized?: string;
      standard?: string;
      easeInOut: string;
    };
    const easing = motionEasing.emphasized ?? motionEasing.standard ?? motionEasing.easeInOut;

    const enterTransform = enterTransformStart(
      position?.side ?? placementSide,
      popoverTokens.enterTranslate,
    );

    const panelCss = css`
      position: fixed;
      z-index: ${theme.zIndex.popover};
      min-width: ${popoverTokens.minWidth};
      max-width: ${popoverTokens.maxWidth};
      background: ${surfaceBg};
      color: ${textPrimary};
      border-radius: ${popoverTokens.radius};
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.12),
        0 0 0 1px ${hairline};
      font-family: inherit;
      font-size: ${popoverTokens.bodyFontSize};
      line-height: ${popoverTokens.bodyLineHeight};
      box-sizing: border-box;
      outline: none;
      animation: timeui-popover-in ${popoverTokens.enterDuration} ${easing};
      @keyframes timeui-popover-in {
        from {
          opacity: 0;
          transform: ${enterTransform};
        }
        to {
          opacity: 1;
          transform: translate(0, 0);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        animation: none;
        transition: none;
        transform: none !important;
      }
    `;

    const headerCss = css`
      padding: ${popoverTokens.headerPaddingY} ${popoverTokens.paddingX};
      font-size: ${popoverTokens.headerFontSize};
      font-weight: ${popoverTokens.headerFontWeight};
      color: ${textPrimary};
      border-bottom: 1px solid ${hairline};
    `;

    const bodyCss = css`
      padding: ${popoverTokens.paddingY} ${popoverTokens.paddingX};
      color: ${textPrimary};
    `;

    const footerCss = css`
      padding: ${popoverTokens.footerPaddingY} ${popoverTokens.paddingX};
      border-top: 1px solid ${hairline};
      color: ${textSecondary};
    `;

    // arrow 8px 方块旋转 45°，根据 side 贴到 panel 对侧边缘。
    const arrowSize = popoverTokens.arrowSize;
    const arrowInset = popoverTokens.arrowInset;
    const arrowSidePos = useMemo(() => {
      const side = position?.side ?? placementSide;
      const align = position?.align ?? placementAlign;
      const baseStyle: CSSProperties = {
        position: 'absolute',
        width: arrowSize,
        height: arrowSize,
        background: surfaceBg,
        transform: 'rotate(45deg)',
        boxShadow: `1px 1px 0 0 ${hairline}`,
        pointerEvents: 'none',
      };
      // 偏移：arrow 中心 = panel 边缘上的某点，使一半进入 panel、一半在外。
      const centerOffset = `calc(${arrowSize} / -2)`;
      if (side === 'top') {
        baseStyle.bottom = centerOffset;
        // 旋转 45° 后阴影方向也旋转：top side 的 arrow 阴影应朝下右。
        baseStyle.boxShadow = `1px 1px 0 0 ${hairline}`;
      } else if (side === 'bottom') {
        baseStyle.top = centerOffset;
        baseStyle.boxShadow = `-1px -1px 0 0 ${hairline}`;
      } else if (side === 'left') {
        baseStyle.right = centerOffset;
        baseStyle.boxShadow = `1px -1px 0 0 ${hairline}`;
      } else {
        baseStyle.left = centerOffset;
        baseStyle.boxShadow = `-1px 1px 0 0 ${hairline}`;
      }
      if (side === 'top' || side === 'bottom') {
        if (align === 'start') {
          baseStyle.left = arrowInset;
        } else if (align === 'end') {
          baseStyle.right = arrowInset;
        } else {
          baseStyle.left = `calc(50% - ${arrowSize} / 2)`;
        }
      } else {
        if (align === 'start') {
          baseStyle.top = arrowInset;
        } else if (align === 'end') {
          baseStyle.bottom = arrowInset;
        } else {
          baseStyle.top = `calc(50% - ${arrowSize} / 2)`;
        }
      }
      return baseStyle;
    }, [position, placementSide, placementAlign, arrowSize, arrowInset, surfaceBg, hairline]);

    // ── 组合 inline style：定位 + 用户传入。 ──
    // user style 在后面，允许消费者覆盖；但 top/left 需要先注入定位结果。
    const positionStyle: CSSProperties = position
      ? { top: position.top, left: position.left }
      : { top: -9999, left: -9999, visibility: 'hidden' };
    const mergedStyle: CSSProperties = { ...positionStyle, ...style };

    // role：有 header 时按 dialog 处理（语义更强），hover 模式下退化为 tooltip。
    const role = trigger === 'hover' ? 'tooltip' : 'dialog';
    const ariaModal = role === 'dialog' ? false : undefined;

    const renderPanel = () => (
      <div
        ref={mergeRefs(panelRef, forwardedRef)}
        id={baseId}
        role={role}
        aria-modal={ariaModal}
        aria-label={ariaLabel}
        aria-labelledby={!ariaLabel && headerId ? headerId : undefined}
        data-placement={placement}
        data-side={position?.side ?? placementSide}
        data-align={position?.align ?? placementAlign}
        tabIndex={-1}
        className={className}
        style={mergedStyle}
        css={panelCss}
        onKeyDown={handlePanelKeyDown}
        onMouseEnter={handlePanelMouseEnter}
        onMouseLeave={handlePanelMouseLeave}
      >
        {header ? (
          <div id={headerId} css={headerCss}>
            {header}
          </div>
        ) : null}
        <div css={bodyCss}>{children}</div>
        {footer ? <div css={footerCss}>{footer}</div> : null}
        {hasArrow ? <span aria-hidden data-popover-arrow="" style={arrowSidePos} /> : null}
      </div>
    );

    return (
      <>
        {renderAnchor()}
        {open && isMounted && typeof document !== 'undefined'
          ? createPortal(renderPanel(), portalContainer ?? document.body)
          : null}
      </>
    );
  },
);

(Popover as unknown as { displayName: string }).displayName = 'TimeUI.Popover';
