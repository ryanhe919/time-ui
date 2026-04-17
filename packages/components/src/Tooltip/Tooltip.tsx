'use client';

/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 Tooltip 组件：基于 Portal 的轻量浮层提示。
 *              与 Popover 的核心区别：
 *                - 触发只支持 hover + focus（不支持 click）；触摸屏自动隐藏。
 *                - 配色硬编码反色：light 模式深底白字 / dark 模式浅底深字，不走 theme.colors。
 *                - 无 hairline border / 无 elevation 阴影，仅使用 token 内简短 shadow。
 *                - 无 header / footer / closeButton 支持。
 *                - 实现 warm-up：上一个 tooltip 关闭后 warmThreshold 内打开下一个则跳过 enterDelay。
 *                - role="tooltip"，通过 aria-describedby 与 anchor 关联。
 *                - 复用 Popover 的纯函数 computePopoverPosition 完成定位算法。
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
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type ReactElement,
  type Ref,
} from 'react';
import { createPortal } from 'react-dom';
import { css, useTheme } from '@emotion/react';
import { mergeRefs, useControllableState } from '../utils';
import { useIsomorphicLayoutEffect } from '../utils/useIsomorphicLayoutEffect';
import { computePopoverPosition } from '../Popover/Popover';
import type { PopoverSide } from '../Popover/Popover.types';
import type { TooltipPlacement, TooltipProps } from './Tooltip.types';

// ────────────────────────────────────────────────────────────
// 模块级 warm-up 时间戳
// ────────────────────────────────────────────────────────────
// 仅在本模块内可见的可变变量；用于跨实例追踪"最近一个 tooltip 关闭于何时"。
// 当一个 tooltip 关闭时写入 Date.now()；下一次 enter 时若 (Date.now() - lastClosedAt) < warmThreshold
// 则跳过 enterDelay，立即显示。这个全局状态范围已经被刻意限制在模块内，
// 不会污染 window / globalThis。

let lastClosedAt = 0;

/** 测试钩子：仅供单测重置，避免 fake timers 残留状态污染下个 case。 */
export const __resetTooltipWarmupForTests = () => {
  lastClosedAt = 0;
};

// ────────────────────────────────────────────────────────────
// 内部工具
// ────────────────────────────────────────────────────────────

interface PositionResult {
  top: number;
  left: number;
  side: PopoverSide;
  align: 'start' | 'center' | 'end';
}

const parseToken = (raw: string | number | undefined, fallback: number): number => {
  if (raw === undefined) return fallback;
  if (typeof raw === 'number') return raw;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
};

const splitPlacement = (
  placement: TooltipPlacement,
): { side: PopoverSide; align: 'start' | 'center' | 'end' } => {
  const [side, alignSuffix] = placement.split('-') as [PopoverSide, 'start' | 'end' | undefined];
  return { side, align: alignSuffix ?? 'center' };
};

/**
 * 入场动画 transform 起点：把 tooltip 从远离 anchor 的方向滑入。
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

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  function Tooltip(props, forwardedRef) {
    const {
      content,
      children,
      placement = 'top',
      offset,
      withArrow = true,
      isDisabled = false,
      enterDelay,
      exitDelay,
      isOpen,
      defaultIsOpen = false,
      onOpenChange,
      className,
      style,
      id,
    } = props;

    const theme = useTheme();
    const tooltipTokens = theme.components.tooltip;
    const isDark = theme.mode === 'dark';

    // ── 受控 / 非受控 ──
    const [open, setOpen] = useControllableState<boolean>({
      value: isOpen,
      defaultValue: (isOpen !== undefined ? undefined : defaultIsOpen) as boolean,
      onChange: onOpenChange,
      name: 'Tooltip',
    });

    // 受控模式标志：一旦消费者传入 isOpen，就完全跳过内部 hover/focus 逻辑。
    const isControlled = isOpen !== undefined;

    // ── id ──
    const autoId = useId();
    const safeAutoId = autoId.replace(/:/g, '');
    const baseId = id ?? `timeui-tooltip-${safeAutoId}`;

    // ── refs ──
    const anchorRef = useRef<HTMLElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearEnterTimer = useCallback(() => {
      if (enterTimerRef.current) {
        clearTimeout(enterTimerRef.current);
        enterTimerRef.current = null;
      }
    }, []);

    const clearExitTimer = useCallback(() => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    }, []);

    // 卸载时清理所有定时器。
    useEffect(
      () => () => {
        clearEnterTimer();
        clearExitTimer();
      },
      [clearEnterTimer, clearExitTimer],
    );

    // ── token 解析 ──
    const offsetPx = useMemo(
      () => parseToken(offset, parseToken(tooltipTokens.offset, 6)),
      [offset, tooltipTokens.offset],
    );
    const enterDelayMs = useMemo(
      () => parseToken(enterDelay, parseToken(tooltipTokens.enterDelay, 120)),
      [enterDelay, tooltipTokens.enterDelay],
    );
    const exitDelayMs = useMemo(
      () => parseToken(exitDelay, parseToken(tooltipTokens.exitDelay, 80)),
      [exitDelay, tooltipTokens.exitDelay],
    );
    const warmThresholdMs = useMemo(
      () => parseToken(undefined, parseToken(tooltipTokens.warmThreshold, 500)),
      [tooltipTokens.warmThreshold],
    );

    const { side: placementSide, align: placementAlign } = useMemo(
      () => splitPlacement(placement),
      [placement],
    );

    // ── 定位状态 ──
    const [position, setPosition] = useState<PositionResult | null>(null);
    // 仅在客户端 mount 后才允许 portal，避免 SSR 出错。
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
      setIsMounted(true);
    }, []);

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
      );
      setPosition((prev) => {
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
      if (!open || !isMounted || isDisabled) {
        setPosition(null);
        return;
      }
      updatePosition();
      const onScrollResize = () => updatePosition();
      window.addEventListener('scroll', onScrollResize, { passive: true, capture: true });
      window.addEventListener('resize', onScrollResize, { passive: true });
      return () => {
        window.removeEventListener('scroll', onScrollResize, true);
        window.removeEventListener('resize', onScrollResize);
      };
    }, [open, isMounted, isDisabled, updatePosition]);

    // ── enter / leave handlers ──

    /** 计算实际生效的 enterDelay：处于 warm 窗口期则跳过延迟。 */
    const computeEffectiveEnterDelay = useCallback((): number => {
      const now = Date.now();
      if (lastClosedAt > 0 && now - lastClosedAt < warmThresholdMs) {
        return 0;
      }
      return enterDelayMs;
    }, [enterDelayMs, warmThresholdMs]);

    const scheduleOpen = useCallback(() => {
      // 若已开启 / 受控 / 禁用 / 已有定时器：跳过。
      if (isControlled || isDisabled) return;
      clearExitTimer();
      clearEnterTimer();
      const delay = computeEffectiveEnterDelay();
      if (delay <= 0) {
        setOpen(true);
        return;
      }
      enterTimerRef.current = setTimeout(() => {
        enterTimerRef.current = null;
        setOpen(true);
      }, delay);
    }, [
      isControlled,
      isDisabled,
      clearExitTimer,
      clearEnterTimer,
      computeEffectiveEnterDelay,
      setOpen,
    ]);

    const scheduleClose = useCallback(() => {
      if (isControlled || isDisabled) return;
      clearEnterTimer();
      clearExitTimer();
      const doClose = () => {
        lastClosedAt = Date.now();
        setOpen(false);
      };
      if (exitDelayMs <= 0) {
        doClose();
        return;
      }
      exitTimerRef.current = setTimeout(() => {
        exitTimerRef.current = null;
        doClose();
      }, exitDelayMs);
    }, [isControlled, isDisabled, clearEnterTimer, clearExitTimer, exitDelayMs, setOpen]);

    // ── anchor 渲染 ──
    const renderAnchor = (): ReactElement | null => {
      if (!isValidElement(children)) return null;
      const element = children as ReactElement<Record<string, unknown>> & {
        ref?: Ref<HTMLElement>;
      };
      const existingProps = (element.props ?? {}) as Record<string, unknown> & {
        onMouseEnter?: (e: unknown) => void;
        onMouseLeave?: (e: unknown) => void;
        onFocus?: (e: ReactFocusEvent<HTMLElement>) => void;
        onBlur?: (e: ReactFocusEvent<HTMLElement>) => void;
        'aria-describedby'?: string;
      };
      // 合并已有 aria-describedby（保证不覆盖消费者已设置的 a11y 关系）。
      const composedDescribedBy = [existingProps['aria-describedby'], baseId]
        .filter(Boolean)
        .join(' ');

      const composed = {
        onMouseEnter: (e: unknown) => {
          existingProps.onMouseEnter?.(e);
          scheduleOpen();
        },
        onMouseLeave: (e: unknown) => {
          existingProps.onMouseLeave?.(e);
          scheduleClose();
        },
        onFocus: (e: ReactFocusEvent<HTMLElement>) => {
          existingProps.onFocus?.(e);
          scheduleOpen();
        },
        onBlur: (e: ReactFocusEvent<HTMLElement>) => {
          existingProps.onBlur?.(e);
          scheduleClose();
        },
        'aria-describedby': composedDescribedBy,
        ref: mergeRefs<HTMLElement>(anchorRef, element.ref as Ref<HTMLElement> | undefined),
      };
      return cloneElement(element, composed as unknown as Record<string, unknown>);
    };

    // ── styles ──
    const bg = isDark ? tooltipTokens.bgDark : tooltipTokens.bgLight;
    const fg = isDark ? tooltipTokens.fgDark : tooltipTokens.fgLight;

    const motionEasing = theme.motion.easing as {
      emphasized?: string;
      standard?: string;
      easeInOut: string;
    };
    const easing = motionEasing.standard ?? motionEasing.easeInOut;

    const enterTransform = enterTransformStart(
      position?.side ?? placementSide,
      tooltipTokens.enterTranslate,
    );

    const panelCss = css`
      position: fixed;
      z-index: ${theme.zIndex.tooltip};
      max-width: ${tooltipTokens.maxWidth};
      padding: ${tooltipTokens.paddingY} ${tooltipTokens.paddingX};
      background: ${bg};
      color: ${fg};
      border-radius: ${tooltipTokens.radius};
      box-shadow: ${tooltipTokens.shadow};
      font-family: inherit;
      font-size: ${tooltipTokens.fontSize};
      line-height: ${tooltipTokens.lineHeight};
      font-weight: ${tooltipTokens.fontWeight};
      box-sizing: border-box;
      /* tooltip 不应该捕获鼠标 —— 鼠标移到 tooltip 上不会使其保持开启，
       移开 anchor 后立刻进入 exit 流程，符合 tooltip 的 UX 预期。 */
      pointer-events: none;
      /* 触摸屏上 tooltip 不应被显示（无 hover）；用 hover 媒体特性兜底。 */
      @media (hover: none) {
        display: none;
      }
      animation: timeui-tooltip-in ${tooltipTokens.enterDuration} ${easing};
      @keyframes timeui-tooltip-in {
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

    // ── arrow ──
    const arrowSize = tooltipTokens.arrowSize;
    const arrowStyle = useMemo<CSSProperties>(() => {
      const side = position?.side ?? placementSide;
      const align = position?.align ?? placementAlign;
      const baseStyle: CSSProperties = {
        position: 'absolute',
        width: arrowSize,
        height: arrowSize,
        background: bg,
        transform: 'rotate(45deg)',
        pointerEvents: 'none',
      };
      const centerOffset = `calc(${arrowSize} / -2)`;
      if (side === 'top') {
        baseStyle.bottom = centerOffset;
      } else if (side === 'bottom') {
        baseStyle.top = centerOffset;
      } else if (side === 'left') {
        baseStyle.right = centerOffset;
      } else {
        baseStyle.left = centerOffset;
      }
      if (side === 'top' || side === 'bottom') {
        if (align === 'start') {
          baseStyle.left = '8px';
        } else if (align === 'end') {
          baseStyle.right = '8px';
        } else {
          baseStyle.left = `calc(50% - ${arrowSize} / 2)`;
        }
      } else {
        if (align === 'start') {
          baseStyle.top = '8px';
        } else if (align === 'end') {
          baseStyle.bottom = '8px';
        } else {
          baseStyle.top = `calc(50% - ${arrowSize} / 2)`;
        }
      }
      return baseStyle;
    }, [position, placementSide, placementAlign, arrowSize, bg]);

    // ── 组合 inline style：定位 + 用户传入 ──
    const positionStyle: CSSProperties = position
      ? { top: position.top, left: position.left }
      : { top: -9999, left: -9999, visibility: 'hidden' };
    const mergedStyle: CSSProperties = { ...positionStyle, ...style };

    const renderPanel = () => (
      <div
        ref={mergeRefs(panelRef, forwardedRef)}
        id={baseId}
        role="tooltip"
        data-placement={placement}
        data-side={position?.side ?? placementSide}
        data-align={position?.align ?? placementAlign}
        className={className}
        style={mergedStyle}
        css={panelCss}
      >
        {content}
        {withArrow ? <span aria-hidden data-tooltip-arrow="" style={arrowStyle} /> : null}
      </div>
    );

    // 决定是否真正渲染 portal：禁用直接不挂；其它情况依赖 open + 客户端 mount。
    const shouldRenderPortal = !isDisabled && open && isMounted && typeof document !== 'undefined';

    return (
      <>
        {renderAnchor()}
        {shouldRenderPortal ? createPortal(renderPanel(), document.body) : null}
      </>
    );
  },
);

(Tooltip as unknown as { displayName: string }).displayName = 'TimeUI.Tooltip';
