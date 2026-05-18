'use client';

/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 Drawer 组件：portal 渲染、focus trap、ESC/overlay 关闭、滚动锁定与无障碍。
 *               与 Modal 共用绝大部分行为，差异在于贴边定位、尺寸 / 圆角策略和入场动画方向。
 */

import {
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { css, useTheme } from '@emotion/react';
import { mergeRefs, useControllableState, useScrollLock } from '../utils';
import type {
  DrawerBodyProps,
  DrawerFooterProps,
  DrawerHeaderProps,
  DrawerPlacement,
  DrawerProps,
  DrawerSize,
} from './Drawer.types';

// ────────────────────────────────────────────────────────────
// 内部工具
// ────────────────────────────────────────────────────────────

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
  'audio[controls]',
  'video[controls]',
  'iframe',
  'object',
  'embed',
  'summary',
].join(',');

function getFocusableElements(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

function isHorizontal(placement: DrawerPlacement): boolean {
  return placement === 'left' || placement === 'right';
}

function widthForSize(size: DrawerSize, drawer: Record<string, unknown>): string {
  switch (size) {
    case 'sm':
      return String(drawer.widthSm);
    case 'lg':
      return String(drawer.widthLg);
    case 'xl':
      return String(drawer.widthXl);
    case 'full':
      return String(drawer.widthFull);
    case 'md':
    default:
      return String(drawer.widthMd);
  }
}

function heightForSize(size: DrawerSize, drawer: Record<string, unknown>): string {
  switch (size) {
    case 'sm':
      return String(drawer.heightSm);
    case 'lg':
    case 'xl':
      // height 系列没有 xl，回退到 lg
      return String(drawer.heightLg);
    case 'full':
      return String(drawer.heightFull);
    case 'md':
    default:
      return String(drawer.heightMd);
  }
}

function radiusForPlacement(placement: DrawerPlacement, radius: string): string {
  // 贴边一侧圆角设 0，其余三角设 radius
  switch (placement) {
    case 'right':
      return `${radius} 0 0 ${radius}`;
    case 'left':
      return `0 ${radius} ${radius} 0`;
    case 'top':
      return `0 0 ${radius} ${radius}`;
    case 'bottom':
      return `${radius} ${radius} 0 0`;
    default:
      return radius;
  }
}

function enterTransformFor(placement: DrawerPlacement, distance: string): string {
  switch (placement) {
    case 'left':
      return `translateX(-${distance})`;
    case 'right':
      return `translateX(${distance})`;
    case 'top':
      return `translateY(-${distance})`;
    case 'bottom':
      return `translateY(${distance})`;
    default:
      return 'none';
  }
}

// ────────────────────────────────────────────────────────────
// 复合子组件
// ────────────────────────────────────────────────────────────

const DrawerHeaderImpl = forwardRef<HTMLDivElement, DrawerHeaderProps>(function DrawerHeader(
  { children, className },
  ref,
) {
  const theme = useTheme();
  const drawer = theme.components.drawer as Record<string, unknown>;
  const headerCss = css`
    display: flex;
    align-items: center;
    min-height: ${String(drawer.headerMinHeight)};
    padding: ${String(drawer.headerPaddingY)} ${String(drawer.headerPaddingX)};
    padding-right: calc(
      ${String(drawer.headerPaddingX)} + ${String(drawer.closeButtonSize)} +
        ${String(drawer.closeButtonOffset)}
    );
    font-size: ${String(drawer.headerFontSize)};
    font-weight: ${Number(drawer.headerFontWeight)};
    color: ${theme.colors.text.primary};
    border-bottom: 1px solid ${theme.colors.border.subtle};
    flex: none;
    line-height: 1.4;
    margin: 0;
  `;
  return (
    <div ref={ref} className={className} css={headerCss}>
      {children}
    </div>
  );
});
(DrawerHeaderImpl as unknown as { displayName: string }).displayName = 'TimeUI.DrawerHeader';
export const DrawerHeader = DrawerHeaderImpl;

const DrawerBodyImpl = forwardRef<HTMLDivElement, DrawerBodyProps>(function DrawerBody(
  { children, className },
  ref,
) {
  const theme = useTheme();
  const drawer = theme.components.drawer as Record<string, unknown>;
  const bodyCss = css`
    padding: ${String(drawer.bodyPaddingY)} ${String(drawer.bodyPaddingX)};
    font-size: ${String(drawer.bodyFontSize)};
    line-height: ${Number(drawer.bodyLineHeight)};
    color: ${theme.colors.text.secondary};
    flex: 1 1 auto;
    min-height: 0;
  `;
  return (
    <div ref={ref} className={className} css={bodyCss}>
      {children}
    </div>
  );
});
(DrawerBodyImpl as unknown as { displayName: string }).displayName = 'TimeUI.DrawerBody';
export const DrawerBody = DrawerBodyImpl;

const DrawerFooterImpl = forwardRef<HTMLDivElement, DrawerFooterProps>(function DrawerFooter(
  { children, className },
  ref,
) {
  const theme = useTheme();
  const drawer = theme.components.drawer as Record<string, unknown>;
  const footerCss = css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-height: ${String(drawer.footerMinHeight)};
    gap: ${String(drawer.footerGap)};
    padding: ${String(drawer.footerPaddingY)} ${String(drawer.footerPaddingX)};
    border-top: 1px solid ${theme.colors.border.subtle};
    flex: none;
  `;
  return (
    <div ref={ref} className={className} css={footerCss}>
      {children}
    </div>
  );
});
(DrawerFooterImpl as unknown as { displayName: string }).displayName = 'TimeUI.DrawerFooter';
export const DrawerFooter = DrawerFooterImpl;

// ────────────────────────────────────────────────────────────
// Close icon
// ────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

// ────────────────────────────────────────────────────────────
// 主组件
// ────────────────────────────────────────────────────────────

export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(function Drawer(props, forwardedRef) {
  const {
    isOpen,
    defaultOpen = false,
    onOpenChange,

    placement = 'right',
    size = 'md',

    isDismissable = true,
    disableKeyboardDismiss = false,
    hideCloseButton = false,
    scrollBehavior = 'inside',
    portalContainer,

    header,
    footer,
    children,
    className,
    style,
    id,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
  } = props;

  const theme = useTheme();
  const drawer = theme.components.drawer as Record<string, unknown>;

  const autoId = useId();
  const safeAutoId = autoId.replace(/:/g, '');
  const baseId = id ?? `timeui-drawer-${safeAutoId}`;

  // 受控 / 非受控 open
  const [open, setOpen] = useControllableState<boolean>({
    value: isOpen,
    defaultValue: (isOpen !== undefined ? undefined : defaultOpen) as boolean,
    onChange: onOpenChange,
    name: 'Drawer',
  });

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // ── body scroll lock（含滚动条宽度补偿，避免内容水平抖动） ──
  useScrollLock(open);

  // ── focus 管理：记忆 → 自动聚焦 → 关闭归还 ──
  useEffect(() => {
    if (!open) return;
    if (typeof document === 'undefined') return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      const focusables = getFocusableElements(panelRef.current);
      const first = focusables[0];
      if (first) first.focus();
      else panelRef.current?.focus?.();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(t);
      const target = previouslyFocusedRef.current;
      if (target && typeof target.focus === 'function') {
        target.focus();
      }
    };
  }, [open]);

  // ── ESC 关闭 ──
  useEffect(() => {
    if (!open || disableKeyboardDismiss) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, disableKeyboardDismiss, setOpen]);

  // ── overlay click 关闭 ──
  const onOverlayMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!isDismissable) return;
      if (e.target === e.currentTarget) {
        setOpen(false);
      }
    },
    [isDismissable, setOpen],
  );

  // ── focus trap：Tab / Shift+Tab 在头尾循环 ──
  const onKeyDown = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const root = panelRef.current;
    if (!root) return;
    const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusables.length === 0) {
      e.preventDefault();
      root.focus();
      return;
    }
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey) {
      if (active === first || !root.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  // ── panel 几何计算（依据 placement / size） ──
  const horizontal = isHorizontal(placement);
  const panelSize = useMemo(
    () => (horizontal ? widthForSize(size, drawer) : heightForSize(size, drawer)),
    [horizontal, size, drawer],
  );

  // ── styles ──
  const easing = theme.motion.easing.easeOut;
  const overlayDuration = String(drawer.overlayDuration);
  const panelDuration = String(drawer.panelDuration);
  const enterDistance = String(drawer.panelEnterTranslate);
  const overlayBlur = String(drawer.overlayBlur);
  const radius = String(drawer.radius);
  const shadow = theme.mode === 'dark' ? String(drawer.shadowDark) : String(drawer.shadow);
  const closeSize = String(drawer.closeButtonSize);
  const closeRadius = String(drawer.closeButtonRadius);
  const closeOffset = String(drawer.closeButtonOffset);
  const headerPaddingY = String(drawer.headerPaddingY);
  const headerPaddingX = String(drawer.headerPaddingX);
  const headerMinHeight = String(drawer.headerMinHeight);
  const headerFontSize = String(drawer.headerFontSize);
  const headerFontWeight = Number(drawer.headerFontWeight);
  const footerMinHeight = String(drawer.footerMinHeight);

  const overlayCss = css`
    position: fixed;
    inset: 0;
    z-index: ${theme.zIndex.modal};
    background: ${theme.colors.bg.overlay};
    backdrop-filter: saturate(180%) blur(${overlayBlur});
    -webkit-backdrop-filter: saturate(180%) blur(${overlayBlur});
    animation: timeui-drawer-fade ${overlayDuration} ease-out;
    @keyframes timeui-drawer-fade {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `;

  // 贴边定位：横向占满高度，纵向占满宽度
  const positionCss =
    placement === 'right'
      ? `top: 0; right: 0; bottom: 0; height: 100%; width: ${panelSize};`
      : placement === 'left'
        ? `top: 0; left: 0; bottom: 0; height: 100%; width: ${panelSize};`
        : placement === 'top'
          ? `top: 0; left: 0; right: 0; width: 100%; height: ${panelSize};`
          : `bottom: 0; left: 0; right: 0; width: 100%; height: ${panelSize};`;

  const enterFrom = enterTransformFor(placement, enterDistance);
  const cornerRadius = radiusForPlacement(placement, radius);
  const animName = `timeui-drawer-slide-${placement}`;
  const reducedAnimName = `timeui-drawer-fade-only`;

  const panelCss = css`
    position: fixed;
    ${positionCss}
    max-width: 100vw;
    max-height: 100vh;
    background: ${theme.colors.bg.surface};
    color: ${theme.colors.text.primary};
    border-radius: ${cornerRadius};
    box-shadow: ${shadow};
    z-index: ${theme.zIndex.modal};
    display: flex;
    flex-direction: column;
    outline: none;
    font-family: inherit;

    ${scrollBehavior === 'outside' ? `overflow-y: auto;` : `overflow: hidden;`}

    animation: ${animName} ${panelDuration} ${easing};
    @keyframes ${animName} {
      from {
        opacity: 0;
        transform: ${enterFrom};
      }
      to {
        opacity: 1;
        transform: translate(0, 0);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      animation: ${reducedAnimName} ${panelDuration} ease-out;
      @keyframes ${reducedAnimName} {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    }

    /* 自定义滚动条 */
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
    scrollbar-gutter: stable;
    &:hover,
    &:focus-within {
      scrollbar-color: rgba(120, 120, 128, 0.45) transparent;
    }
    &::-webkit-scrollbar {
      width: 10px;
      height: 10px;
      background: transparent;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: transparent;
      border: 2px solid transparent;
      border-radius: 9999px;
      background-clip: padding-box;
      transition: background-color 200ms ease;
    }
    &:hover::-webkit-scrollbar-thumb,
    &:focus-within::-webkit-scrollbar-thumb {
      background-color: rgba(120, 120, 128, 0.45);
    }
    &::-webkit-scrollbar-thumb:hover {
      background-color: rgba(80, 80, 90, 0.65);
    }
    &::-webkit-scrollbar-corner {
      background: transparent;
    }
  `;

  const headerCss = css`
    display: flex;
    align-items: center;
    min-height: ${headerMinHeight};
    padding: ${headerPaddingY} ${headerPaddingX};
    padding-right: calc(${headerPaddingX} + ${closeSize} + ${closeOffset});
    font-size: ${headerFontSize};
    font-weight: ${headerFontWeight};
    color: ${theme.colors.text.primary};
    border-bottom: 1px solid ${theme.colors.border.subtle};
    flex: none;
    line-height: 1.4;
    margin: 0;
  `;

  const bodyCss = css`
    padding: ${String(drawer.bodyPaddingY)} ${String(drawer.bodyPaddingX)};
    font-size: ${String(drawer.bodyFontSize)};
    line-height: ${Number(drawer.bodyLineHeight)};
    color: ${theme.colors.text.secondary};
    flex: 1 1 auto;
    min-height: 0;
    ${scrollBehavior === 'inside' ? `overflow-y: auto;` : ''}

    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
    &:hover,
    &:focus-within {
      scrollbar-color: rgba(120, 120, 128, 0.45) transparent;
    }
    &::-webkit-scrollbar {
      width: 10px;
      height: 10px;
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: transparent;
      border: 2px solid transparent;
      border-radius: 9999px;
      background-clip: padding-box;
      transition: background-color 200ms ease;
    }
    &:hover::-webkit-scrollbar-thumb,
    &:focus-within::-webkit-scrollbar-thumb {
      background-color: rgba(120, 120, 128, 0.45);
    }
  `;

  const footerCss = css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-height: ${footerMinHeight};
    gap: ${String(drawer.footerGap)};
    padding: ${String(drawer.footerPaddingY)} ${String(drawer.footerPaddingX)};
    border-top: 1px solid ${theme.colors.border.subtle};
    flex: none;
  `;

  const closeButtonCss = css`
    position: absolute;
    top: ${closeOffset};
    right: ${closeOffset};
    width: ${closeSize};
    height: ${closeSize};
    border-radius: ${closeRadius};
    border: none;
    background: transparent;
    color: ${theme.colors.text.secondary};
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition:
      background-color 120ms ease,
      color 120ms ease;
    &:hover {
      background: ${theme.colors.bg.muted};
      color: ${theme.colors.text.primary};
    }
    &:focus-visible {
      outline: 2px solid ${theme.colors.border.focus ?? theme.colors.focus};
      outline-offset: 2px;
    }
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `;

  if (!open || typeof document === 'undefined') return null;

  const container = portalContainer ?? document.body;

  return createPortal(
    <div
      ref={overlayRef}
      onMouseDown={onOverlayMouseDown}
      css={overlayCss}
      data-timeui-drawer-overlay=""
    >
      <div
        ref={mergeRefs(panelRef, forwardedRef)}
        id={baseId}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        className={className}
        style={style}
        css={panelCss}
        onKeyDown={onKeyDown}
        data-placement={placement}
        data-size={size}
        data-scroll-behavior={scrollBehavior}
      >
        {header !== undefined && header !== null && header !== false ? (
          isValidElement(header) && header.type === DrawerHeaderImpl ? (
            header
          ) : (
            <div css={headerCss}>{header}</div>
          )
        ) : null}

        {!hideCloseButton ? (
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            css={closeButtonCss}
          >
            <CloseIcon />
          </button>
        ) : null}

        {children !== undefined ? <div css={bodyCss}>{children}</div> : null}

        {footer !== undefined && footer !== null && footer !== false ? (
          isValidElement(footer) && footer.type === DrawerFooterImpl ? (
            footer
          ) : (
            <div css={footerCss}>{footer}</div>
          )
        ) : null}
      </div>
    </div>,
    container,
  );
});

(Drawer as unknown as { displayName: string }).displayName = 'TimeUI.Drawer';
