'use client';

/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 Modal 组件：portal 渲染、focus trap、ESC/overlay 关闭、滚动锁定与无障碍。
 */

import {
  forwardRef,
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
  ModalBodyProps,
  ModalFooterProps,
  ModalHeaderProps,
  ModalProps,
  ModalSize,
} from './Modal.types';

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

function widthForSize(size: ModalSize, modal: Record<string, unknown>): string {
  switch (size) {
    case 'sm':
      return String(modal.widthSm);
    case 'lg':
      return String(modal.widthLg);
    case 'xl':
      return String(modal.widthXl);
    case 'full':
      return String(modal.widthFull);
    case 'md':
    default:
      return String(modal.widthMd);
  }
}

// ────────────────────────────────────────────────────────────
// 复合子组件
// ────────────────────────────────────────────────────────────

const ModalHeaderImpl = forwardRef<HTMLDivElement, ModalHeaderProps>(function ModalHeader(
  { children, className, id },
  ref,
) {
  const theme = useTheme();
  const modal = theme.components.modal as Record<string, unknown>;
  const headerCss = css`
    padding: ${String(modal.headerPaddingY)} ${String(modal.headerPaddingX)};
    font-size: ${String(modal.headerFontSize)};
    font-weight: ${Number(modal.headerFontWeight)};
    color: ${theme.colors.text.primary};
    border-bottom: 1px solid ${theme.colors.border.subtle};
    flex: none;
    line-height: 1.4;
    margin: 0;
  `;
  return (
    <h2
      ref={ref as unknown as React.Ref<HTMLHeadingElement>}
      id={id}
      className={className}
      css={headerCss}
    >
      {children}
    </h2>
  );
});
(ModalHeaderImpl as unknown as { displayName: string }).displayName = 'TimeUI.ModalHeader';
export const ModalHeader = ModalHeaderImpl;

const ModalBodyImpl = forwardRef<HTMLDivElement, ModalBodyProps>(function ModalBody(
  { children, className, id },
  ref,
) {
  const theme = useTheme();
  const modal = theme.components.modal as Record<string, unknown>;
  const bodyCss = css`
    padding: ${String(modal.bodyPaddingY)} ${String(modal.bodyPaddingX)};
    font-size: ${String(modal.bodyFontSize)};
    line-height: ${Number(modal.bodyLineHeight)};
    color: ${theme.colors.text.secondary};
    flex: 1 1 auto;
    min-height: 0;
  `;
  return (
    <div ref={ref} id={id} className={className} css={bodyCss}>
      {children}
    </div>
  );
});
(ModalBodyImpl as unknown as { displayName: string }).displayName = 'TimeUI.ModalBody';
export const ModalBody = ModalBodyImpl;

const ModalFooterImpl = forwardRef<HTMLDivElement, ModalFooterProps>(function ModalFooter(
  { children, className, id },
  ref,
) {
  const theme = useTheme();
  const modal = theme.components.modal as Record<string, unknown>;
  const footerCss = css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: ${String(modal.footerGap)};
    padding: ${String(modal.footerPaddingY)} ${String(modal.footerPaddingX)};
    border-top: 1px solid ${theme.colors.border.subtle};
    flex: none;
  `;
  return (
    <div ref={ref} id={id} className={className} css={footerCss}>
      {children}
    </div>
  );
});
(ModalFooterImpl as unknown as { displayName: string }).displayName = 'TimeUI.ModalFooter';
export const ModalFooter = ModalFooterImpl;

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

export const Modal = forwardRef<HTMLDivElement, ModalProps>(function Modal(props, forwardedRef) {
  const {
    isOpen,
    defaultIsOpen = false,
    onOpenChange,

    size = 'md',
    scrollBehavior = 'inside',

    title,
    footer,
    showCloseButton = true,

    closeOnEsc = true,
    closeOnOverlayClick = true,
    blockScrollOnMount = true,
    autoFocus = true,
    returnFocusOnClose = true,

    children,
    className,
    style,
    id,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
  } = props;

  const theme = useTheme();
  const modal = theme.components.modal as Record<string, unknown>;

  const autoId = useId();
  const safeAutoId = autoId.replace(/:/g, '');
  const baseId = id ?? `timeui-modal-${safeAutoId}`;
  const titleId = `${baseId}-title`;

  // 受控 / 非受控 open
  const [open, setOpen] = useControllableState<boolean>({
    value: isOpen,
    defaultValue: (isOpen !== undefined ? undefined : defaultIsOpen) as boolean,
    onChange: onOpenChange,
    name: 'Modal',
  });

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // ── body scroll lock（含滚动条宽度补偿，避免内容水平抖动） ──
  useScrollLock(open && blockScrollOnMount);

  // ── focus 管理：记忆 → autoFocus → 关闭归还 ──
  useEffect(() => {
    if (!open) return;
    if (typeof document === 'undefined') return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      if (!autoFocus) {
        // 仅把焦点移到 panel 自身，避免焦点漂泊在外部
        panelRef.current?.focus?.();
        return;
      }
      const focusables = getFocusableElements(panelRef.current);
      const first = focusables[0];
      if (first) first.focus();
      else panelRef.current?.focus?.();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(t);
      if (returnFocusOnClose) {
        const target = previouslyFocusedRef.current;
        if (target && typeof target.focus === 'function') {
          target.focus();
        }
      }
    };
  }, [open, autoFocus, returnFocusOnClose]);

  // ── ESC 关闭 ──
  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeOnEsc, setOpen]);

  // ── overlay click 关闭 ──
  const onOverlayMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!closeOnOverlayClick) return;
      if (e.target === e.currentTarget) {
        setOpen(false);
      }
    },
    [closeOnOverlayClick, setOpen],
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

  // ── 计算 width ──
  const panelWidth = useMemo(() => widthForSize(size, modal), [size, modal]);

  // ── styles ──
  const easing =
    (theme.motion.easing as { spring?: string }).spring ?? theme.motion.easing.easeInOut;
  const overlayDuration = String(modal.overlayDuration);
  const panelDuration = String(modal.panelDuration);
  const enterTranslate = String(modal.panelEnterTranslateY);
  const enterScale = Number(modal.panelEnterScale);
  const overlayBlur = String(modal.overlayBlur);
  const radius = String(modal.radius);
  const shadow = theme.mode === 'dark' ? String(modal.shadowDark) : String(modal.shadow);
  const closeSize = String(modal.closeButtonSize);
  const closeRadius = String(modal.closeButtonRadius);
  const closeOffset = String(modal.closeButtonOffset);
  const headerPaddingY = String(modal.headerPaddingY);
  const headerPaddingX = String(modal.headerPaddingX);
  const headerFontSize = String(modal.headerFontSize);
  const headerFontWeight = Number(modal.headerFontWeight);
  const maxHeight = String(modal.maxHeight);

  const overlayCss = css`
    position: fixed;
    inset: 0;
    z-index: ${theme.zIndex.modal};
    background: ${theme.colors.bg.overlay};
    backdrop-filter: saturate(180%) blur(${overlayBlur});
    -webkit-backdrop-filter: saturate(180%) blur(${overlayBlur});
    animation: timeui-modal-fade ${overlayDuration} ease-out;
    @keyframes timeui-modal-fade {
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

  const panelCss = css`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: ${panelWidth};
    max-width: calc(100vw - 32px);
    max-height: ${maxHeight};
    background: ${theme.colors.bg.surface};
    color: ${theme.colors.text.primary};
    border-radius: ${radius};
    box-shadow: ${shadow};
    z-index: ${theme.zIndex.modal};
    display: flex;
    flex-direction: column;
    outline: none;
    font-family: inherit;

    ${scrollBehavior === 'outside' ? `overflow-y: auto;` : `overflow: hidden;`}

    animation: timeui-modal-pop ${panelDuration} ${easing};
    @keyframes timeui-modal-pop {
      from {
        opacity: 0;
        transform: translate(-50%, calc(-50% + ${enterTranslate})) scale(${enterScale});
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      animation: timeui-modal-fade-only ${panelDuration} ease-out;
      @keyframes timeui-modal-fade-only {
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
    padding: ${String(modal.bodyPaddingY)} ${String(modal.bodyPaddingX)};
    font-size: ${String(modal.bodyFontSize)};
    line-height: ${Number(modal.bodyLineHeight)};
    color: ${theme.colors.text.secondary};
    flex: 1 1 auto;
    min-height: 0;
    ${scrollBehavior === 'inside' ? `overflow-y: auto;` : ''}

    /* 自定义滚动条 (body 区) */
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

  // 选择 a11y 标签：显式 aria-labelledby > 显式 aria-label > 默认 title => titleId
  const computedLabelledBy = ariaLabelledBy ?? (title && !ariaLabel ? titleId : undefined);

  return createPortal(
    <div
      ref={overlayRef}
      onMouseDown={onOverlayMouseDown}
      css={overlayCss}
      data-timeui-modal-overlay=""
    >
      <div
        ref={mergeRefs(panelRef, forwardedRef)}
        id={baseId}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={computedLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        className={className}
        style={style}
        css={panelCss}
        onKeyDown={onKeyDown}
        data-size={size}
        data-scroll-behavior={scrollBehavior}
      >
        {title ? (
          <h2 id={titleId} css={headerCss}>
            {title}
          </h2>
        ) : null}

        {showCloseButton ? (
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

        {footer === false || footer === undefined || footer === null ? null : (
          <div
            css={css`
              display: flex;
              align-items: center;
              justify-content: flex-end;
              gap: ${String(modal.footerGap)};
              padding: ${String(modal.footerPaddingY)} ${String(modal.footerPaddingX)};
              border-top: 1px solid ${theme.colors.border.subtle};
              flex: none;
            `}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
});

(Modal as unknown as { displayName: string }).displayName = 'TimeUI.Modal';
