/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Search 组件的核心渲染与交互逻辑。
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useTheme, css } from '@emotion/react';
import { useI18n } from '@timeui/core';

export type SearchSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SearchVariant = 'bordered' | 'flat';

export interface SearchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  placeholder?: string;
  shortcut?: string;
  size?: SearchSize;
  variant?: SearchVariant;
  icon?: ReactNode;
  isFullWidth?: boolean;
}

const sizeMap: Record<SearchSize, { h: string; fs: string; px: string }> = {
  xs: { h: '24px', fs: '11px', px: '8px' },
  sm: { h: '28px', fs: '12px', px: '10px' },
  md: { h: '36px', fs: '13px', px: '12px' },
  lg: { h: '44px', fs: '15px', px: '14px' },
  xl: { h: '52px', fs: '17px', px: '16px' },
};

const DefaultIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const Search = forwardRef<HTMLButtonElement, SearchProps>(function Search(
  {
    placeholder,
    shortcut,
    size = 'md',
    variant = 'bordered',
    icon,
    isFullWidth = false,
    'aria-label': ariaLabelProp,
    type,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const i18n = useI18n();
  const sz = sizeMap[size];
  const text = placeholder ?? i18n.search.placeholder;
  const ariaLabel = ariaLabelProp ?? text ?? i18n.search.label;

  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      aria-label={ariaLabel}
      data-size={size}
      data-variant={variant}
      {...rest}
      css={css`
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: ${sz.h};
        padding: 0 ${sz.px};
        width: ${isFullWidth ? '100%' : 'auto'};
        min-width: 200px;
        font-family: inherit;
        font-size: ${sz.fs};
        line-height: 1;
        color: ${theme.colors.text.muted};
        background: ${variant === 'flat' ? theme.colors.bg.muted : 'transparent'};
        border: 1px solid ${variant === 'flat' ? 'transparent' : theme.colors.border.subtle};
        border-radius: 980px;
        cursor: pointer;
        transition:
          background-color ${theme.motion.duration.normal ?? '250ms'},
          color ${theme.motion.duration.normal ?? '250ms'},
          border-color ${theme.motion.duration.normal ?? '250ms'};
        text-align: left;

        &:hover {
          color: ${theme.colors.text.primary};
          border-color: ${variant === 'flat' ? 'transparent' : theme.colors.border.default};
          background: ${variant === 'flat' ? theme.colors.bg.muted : theme.colors.bg.muted};
        }
        &:focus-visible {
          outline: none;
          border-color: ${theme.colors.focus};
          box-shadow: inset 0 0 0 1px ${theme.colors.focus};
        }
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (prefers-reduced-motion: reduce) {
          transition: none;
        }
      `}
    >
      <span
        aria-hidden
        css={css`
          display: inline-flex;
          color: ${theme.colors.text.muted};
        `}
      >
        {icon ?? <DefaultIcon />}
      </span>
      <span
        css={css`
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        `}
      >
        {text}
      </span>
      {shortcut && (
        <kbd
          aria-hidden
          css={css`
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 10px;
            line-height: 1.4;
            padding: 1px 6px;
            border: 1px solid ${theme.colors.border.subtle};
            border-radius: 4px;
            color: ${theme.colors.text.muted};
            background: transparent;
          `}
        >
          {shortcut}
        </kbd>
      )}
    </button>
  );
});
Search.displayName = 'Search';
