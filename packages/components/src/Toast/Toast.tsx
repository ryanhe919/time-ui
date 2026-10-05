/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 Toast / Notification 组件：ToastProvider 注入 store，渲染分 placement
 *              的 Portal viewport；ToastItem 负责单条卡片的入/出场动画、自动 dismiss、hover 暂停。
 */

'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type FC } from 'react';
import { createPortal } from 'react-dom';
import { css, keyframes, useTheme } from '@emotion/react';
import {
  createToastStore,
  currentStoreRef,
  ToastStoreContext,
  useToastStoreSnapshot,
  type ToastStore,
} from './Toast.api';
import type { ToastInstance, ToastPlacement, ToastProviderProps, ToastStatus } from './Toast.types';

// ────────────────────────────────────────────────────────────
// 工具
// ────────────────────────────────────────────────────────────

const PLACEMENTS: ReadonlyArray<ToastPlacement> = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

function viewportPositionCss(placement: ToastPlacement, padding: string) {
  const [vert, horiz] = placement.split('-') as ['top' | 'bottom', 'left' | 'center' | 'right'];
  return css`
    position: fixed;
    ${vert}: ${padding};
    ${horiz === 'left' ? `left: ${padding};` : ''}
    ${horiz === 'right' ? `right: ${padding};` : ''}
    ${horiz === 'center' ? `left: 50%; transform: translateX(-50%);` : ''}
    display: flex;
    flex-direction: ${vert === 'top' ? 'column' : 'column-reverse'};
    align-items: ${horiz === 'left' ? 'flex-start' : horiz === 'right' ? 'flex-end' : 'center'};
    pointer-events: none;
  `;
}

// 入场偏移方向：right 系列从右滑入；left 反之；center 用纵向。
function enterTransform(placement: ToastPlacement, distance: string): string {
  if (placement.endsWith('-right')) return `translateX(${distance})`;
  if (placement.endsWith('-left')) return `translateX(-${distance})`;
  // center 系列：top-center 从上方滑入，bottom-center 从下方滑入
  return placement.startsWith('top-') ? `translateY(-${distance})` : `translateY(${distance})`;
}

const STATUS_COLOR_KEY: Record<ToastStatus, 'success' | 'danger' | 'warning' | 'primary'> = {
  success: 'success',
  danger: 'danger',
  warning: 'warning',
  info: 'primary',
  loading: 'primary',
};

// ────────────────────────────────────────────────────────────
// 内置图标
// ────────────────────────────────────────────────────────────

const StatusIcon: FC<{ status: ToastStatus; color: string; size: string }> = ({
  status,
  color,
  size,
}) => {
  const dim = size;
  const stroke = 'currentColor';
  if (status === 'loading') {
    return <Spinner color={color} size={dim} />;
  }
  if (status === 'success') {
    return (
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        css={css`
          color: ${color};
          flex: none;
        `}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m8 12 3 3 5-6" />
      </svg>
    );
  }
  if (status === 'danger') {
    return (
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        css={css`
          color: ${color};
          flex: none;
        `}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 7v6" />
        <circle cx="12" cy="16.5" r="0.5" fill={color} stroke="none" />
      </svg>
    );
  }
  if (status === 'warning') {
    return (
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        css={css`
          color: ${color};
          flex: none;
        `}
      >
        <path d="M12 3 2 20h20L12 3Z" />
        <path d="M12 10v4" />
        <circle cx="12" cy="17" r="0.5" fill={color} stroke="none" />
      </svg>
    );
  }
  // info
  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      css={css`
        color: ${color};
        flex: none;
      `}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 11v5" />
      <circle cx="12" cy="7.5" r="0.5" fill={color} stroke="none" />
    </svg>
  );
};

const spinKeyframes = keyframes`
  to { transform: rotate(360deg); }
`;

const Spinner: FC<{ color: string; size: string }> = ({ color, size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    css={css`
      flex: none;
      animation: ${spinKeyframes} 900ms linear infinite;
      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    `}
  >
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const CloseIcon: FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M6 6 18 18" />
    <path d="M18 6 6 18" />
  </svg>
);

// ────────────────────────────────────────────────────────────
// ToastItem
// ────────────────────────────────────────────────────────────

interface ToastItemProps {
  toast: ToastInstance;
  onClose: (id: string) => void;
}

export const ToastItem: FC<ToastItemProps> = ({ toast, onClose }) => {
  const theme = useTheme();
  const t = theme.components.toast as Record<string, unknown>;
  const auto = useId();
  const safeId = `timeui-toast-${auto.replace(/:/g, '')}`;

  const colorKey = STATUS_COLOR_KEY[toast.status];
  const accent =
    (theme.colors as unknown as Record<string, { DEFAULT?: string }>)[colorKey]?.DEFAULT ??
    theme.colors.primary.DEFAULT;
  const surfaceBg = theme.colors.bg.surface ?? theme.colors.bg.canvas;
  const textPrimary = theme.colors.text.primary;
  const textSecondary = theme.colors.text.secondary;
  const textMuted = theme.colors.text.muted;
  const hairline = theme.colors.border.subtle;

  const shadow = String(theme.mode === 'dark' ? t.shadowDark : t.shadow);
  const enterDuration = String(t.enterDuration);
  const exitDuration = String(t.exitDuration);
  const enterTranslate = String(t.enterTranslate);
  const easing = theme.motion.easing.easeOut;

  // duration 可能是 number / null。loading 默认 null。
  const duration = toast.duration;
  const [isExiting, setIsExiting] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef<number | null>(duration);
  const startedAtRef = useRef<number>(Date.now());
  const isHoveredRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);

  // 关闭流程：先动画，再实际从 store 移除
  const beginClose = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    // reduced-motion 下也保留一帧让动画类切换；但缩短到 0
    exitTimerRef.current = setTimeout(() => {
      onClose(toast.id);
    }, parseDurationMs(exitDuration));
  }, [exitDuration, isExiting, onClose, toast.id]);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = useCallback(
    (ms: number) => {
      clearCloseTimer();
      if (ms <= 0) {
        beginClose();
        return;
      }
      startedAtRef.current = Date.now();
      remainingRef.current = ms;
      closeTimerRef.current = setTimeout(beginClose, ms);
    },
    [beginClose],
  );

  // 初次挂载 / duration 变化（update 后）：根据 duration 排程
  useEffect(() => {
    if (duration === null || isExiting || isHoveredRef.current) {
      clearCloseTimer();
      remainingRef.current = duration;
      return;
    }
    scheduleClose(duration);
    return () => {
      clearCloseTimer();
    };
  }, [duration, isExiting, scheduleClose]);

  // 卸载时清理 exit timer
  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  const onPointerEnter = () => {
    isHoveredRef.current = true;
    setIsPaused(true);
    if (closeTimerRef.current && remainingRef.current !== null) {
      clearCloseTimer();
      const consumed = Date.now() - startedAtRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - consumed);
    }
  };

  const onPointerLeave = () => {
    isHoveredRef.current = false;
    setIsPaused(false);
    if (remainingRef.current !== null && !isExiting) {
      scheduleClose(remainingRef.current);
    }
  };

  const onCloseClick = () => {
    clearCloseTimer();
    beginClose();
  };

  const onActionClick = () => {
    toast.action?.onPress();
    clearCloseTimer();
    beginClose();
  };

  // styles
  const itemCss = css`
    pointer-events: auto;
    box-sizing: border-box;
    width: ${String(t.width)};
    max-width: ${String(t.maxWidth)};
    min-height: ${String(t.minHeight)};
    padding: ${String(t.paddingY)} ${String(t.paddingX)};
    border-radius: ${String(t.radius)};
    background: ${surfaceBg};
    color: ${textPrimary};
    box-shadow: ${shadow};
    border: 1px solid ${hairline};
    display: flex;
    align-items: flex-start;
    gap: ${String(t.iconGap)};
    margin-top: 8px;
    margin-bottom: 8px;
    position: relative;
    overflow: hidden;
    opacity: 1;
    transform: translate(0, 0);
    transition:
      opacity ${exitDuration} ${easing},
      transform ${exitDuration} ${easing};
    animation: timeui-toast-enter ${enterDuration} ${easing};
    @keyframes timeui-toast-enter {
      from {
        opacity: 0;
        transform: ${enterTransform(toast.placement, enterTranslate)};
      }
      to {
        opacity: 1;
        transform: translate(0, 0);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      animation: timeui-toast-enter-rm ${enterDuration} ${easing};
      transition: opacity ${exitDuration} ${easing};
      @keyframes timeui-toast-enter-rm {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    }
  `;

  const exitingCss = css`
    opacity: 0;
    transform: ${enterTransform(toast.placement, enterTranslate)};
    @media (prefers-reduced-motion: reduce) {
      transform: none;
    }
  `;

  const iconWrapCss = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: ${String(t.iconSize)};
    height: ${String(t.iconSize)};
    color: ${accent};
    flex: none;
    margin-top: 2px;
  `;

  const bodyCss = css`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: ${String(t.descGap)};
  `;

  const titleCss = css`
    font-size: ${String(t.titleFontSize)};
    font-weight: ${Number(t.titleFontWeight)};
    line-height: 1.4;
    color: ${textPrimary};
    margin: 0;
    word-break: break-word;
  `;

  const descCss = css`
    font-size: ${String(t.descFontSize)};
    line-height: ${Number(t.descLineHeight)};
    color: ${textSecondary};
    word-break: break-word;
  `;

  const actionRowCss = css`
    margin-top: ${String(t.actionGap)};
    display: flex;
    gap: ${String(t.actionGap)};
  `;

  const actionBtnCss = css`
    appearance: none;
    border: 1px solid ${hairline};
    background: transparent;
    color: ${accent};
    padding: 4px 10px;
    border-radius: 6px;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    line-height: 1.2;
    &:hover {
      background: ${theme.colors.bg.sunken ?? theme.colors.bg.muted};
    }
    &:focus-visible {
      outline: 2px solid ${accent};
      outline-offset: 2px;
    }
  `;

  const closeBtnCss = css`
    appearance: none;
    border: none;
    background: transparent;
    color: ${textMuted};
    width: ${String(t.closeButtonSize)};
    height: ${String(t.closeButtonSize)};
    border-radius: ${String(t.closeButtonRadius)};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex: none;
    margin-top: ${String(t.closeButtonOffset)};
    &:hover {
      color: ${textPrimary};
      background: ${theme.colors.bg.sunken ?? theme.colors.bg.muted};
    }
    &:focus-visible {
      outline: 2px solid ${accent};
      outline-offset: 2px;
    }
  `;

  const progressBarCss =
    duration && duration > 0
      ? css`
          position: absolute;
          left: 0;
          bottom: 0;
          height: ${String(t.progressBarHeight)};
          width: 100%;
          background: ${accent};
          opacity: 0.6;
          transform-origin: left center;
          animation: timeui-toast-progress ${duration}ms linear forwards;
          animation-play-state: ${isPaused ? 'paused' : 'running'};
          @keyframes timeui-toast-progress {
            from {
              transform: scaleX(1);
            }
            to {
              transform: scaleX(0);
            }
          }
          @media (prefers-reduced-motion: reduce) {
            animation: none;
          }
        `
      : null;

  const isAlert = toast.status === 'danger';
  const role = isAlert ? 'alert' : 'status';
  const ariaLive = isAlert ? 'assertive' : 'polite';

  const icon = toast.icon ?? (
    <StatusIcon status={toast.status} color={accent} size={String(t.iconSize)} />
  );

  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      data-status={toast.status}
      data-placement={toast.placement}
      data-state={isExiting ? 'closed' : 'open'}
      data-testid="timeui-toast"
      id={safeId}
      css={[itemCss, isExiting && exitingCss]}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <span aria-hidden css={iconWrapCss}>
        {icon}
      </span>
      <div css={bodyCss}>
        {toast.title !== undefined && toast.title !== null ? (
          <div css={titleCss}>{toast.title}</div>
        ) : null}
        {toast.description !== undefined && toast.description !== null ? (
          <div css={descCss}>{toast.description}</div>
        ) : null}
        {toast.action ? (
          <div css={actionRowCss}>
            <button type="button" css={actionBtnCss} onClick={onActionClick}>
              {toast.action.label}
            </button>
          </div>
        ) : null}
      </div>
      {toast.isClosable ? (
        <button
          type="button"
          aria-label="Close notification"
          css={closeBtnCss}
          onClick={onCloseClick}
          data-testid="timeui-toast-close"
        >
          <CloseIcon size={14} />
        </button>
      ) : null}
      {progressBarCss ? <span key={duration} aria-hidden css={progressBarCss} /> : null}
    </div>
  );
};

(ToastItem as unknown as { displayName: string }).displayName = 'TimeUI.ToastItem';

// ────────────────────────────────────────────────────────────
// ToastViewport
// ────────────────────────────────────────────────────────────

interface ToastViewportProps {
  placement: ToastPlacement;
  toasts: ReadonlyArray<ToastInstance>;
  onClose: (id: string) => void;
}

const ToastViewport: FC<ToastViewportProps> = ({ placement, toasts, onClose }) => {
  const theme = useTheme();
  const t = theme.components.toast as Record<string, unknown>;
  const padding = String(t.viewportPadding);

  const containerCss = css`
    ${viewportPositionCss(placement, padding)};
    z-index: ${theme.zIndex.toast};
  `;

  return (
    <div
      data-placement={placement}
      data-testid={`timeui-toast-viewport-${placement}`}
      css={containerCss}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// ToastProvider
// ────────────────────────────────────────────────────────────

export const ToastProvider: FC<ToastProviderProps> = ({
  placement = 'top-right',
  maxToasts = 5,
  children,
}) => {
  // 单实例 store（首次渲染创建，之后稳定）
  const storeRef = useRef<ToastStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createToastStore({ placement });
  }
  const store = storeRef.current;

  // placement 默认值随 prop 变化
  useEffect(() => {
    store.setDefaults({ placement });
  }, [placement, store]);

  // 把当前 store 注册为 module-level 单例（供 `toast` 单例使用）
  useEffect(() => {
    const previous = currentStoreRef.current;
    currentStoreRef.current = store;
    return () => {
      if (currentStoreRef.current === store) {
        currentStoreRef.current = previous;
      }
    };
  }, [store]);

  return (
    <ToastStoreContext.Provider value={store}>
      {children}
      <ToastViewportRoot store={store} maxToasts={maxToasts} />
    </ToastStoreContext.Provider>
  );
};

(ToastProvider as unknown as { displayName: string }).displayName = 'TimeUI.ToastProvider';

interface ToastViewportRootProps {
  store: ToastStore;
  maxToasts: number;
}

/**
 * 渲染所有 placement 的 viewport（Portal 到 body）。
 * 按 placement 分组、按 maxToasts 截取最新 N 条（折叠老的）。
 */
const ToastViewportRoot: FC<ToastViewportRootProps> = ({ store, maxToasts }) => {
  const all = useToastStoreSnapshot(store);

  const grouped = useMemo(() => {
    const map = new Map<ToastPlacement, ToastInstance[]>();
    for (const p of PLACEMENTS) map.set(p, []);
    for (const t of all) {
      const arr = map.get(t.placement);
      if (arr) arr.push(t);
    }
    // 仅保留最新 maxToasts 条（按 createdAt 升序，截尾）
    const result = new Map<ToastPlacement, ToastInstance[]>();
    for (const [p, list] of map.entries()) {
      const sorted = [...list].sort((a, b) => a.createdAt - b.createdAt);
      const trimmed = sorted.slice(Math.max(0, sorted.length - maxToasts));
      result.set(p, trimmed);
    }
    return result;
  }, [all, maxToasts]);

  const onClose = useCallback(
    (id: string) => {
      store.getApi().dismiss(id);
    },
    [store],
  );

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {PLACEMENTS.map((p) => {
        const list = grouped.get(p) ?? [];
        if (list.length === 0) return null;
        return <ToastViewport key={p} placement={p} toasts={list} onClose={onClose} />;
      })}
    </>,
    document.body,
  );
};

(ToastViewportRoot as unknown as { displayName: string }).displayName = 'TimeUI.ToastViewportRoot';

// ────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────

function parseDurationMs(input: string): number {
  const trimmed = input.trim();
  if (trimmed.endsWith('ms')) return Number(trimmed.slice(0, -2));
  if (trimmed.endsWith('s')) return Number(trimmed.slice(0, -1)) * 1000;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : 0;
}

// 测试入口（不在 barrel 暴露）
export { ToastViewport };
