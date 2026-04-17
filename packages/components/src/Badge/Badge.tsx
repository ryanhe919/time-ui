/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 Badge 组件：支持 standard / dot 两种模式与包裹定位。
 */

'use client';

import { forwardRef, useId, type ReactNode } from 'react';
import { css, useTheme } from '@emotion/react';
import type { BadgeColor, BadgePlacement, BadgeProps, BadgeVariant } from './Badge.types';

function colorKey(color: BadgeColor): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  return color === 'neutral' ? 'default' : color;
}

const PLACEMENT_POS: Record<
  BadgePlacement,
  { top?: string; right?: string; bottom?: string; left?: string }
> = {
  'top-right': { top: '0', right: '0' },
  'top-left': { top: '0', left: '0' },
  'bottom-right': { bottom: '0', right: '0' },
  'bottom-left': { bottom: '0', left: '0' },
};

function formatContent(content: unknown, max: number): ReactNode {
  if (typeof content === 'number') {
    if (content > max) return `${max}+`;
    return String(content);
  }
  return content as ReactNode;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    content,
    variant = 'standard',
    color = 'danger',
    placement = 'top-right',
    max = 99,
    showZero = false,
    isInvisible = false,
    isOneCharacter = false,
    isPulse = false,
    showOutline = true,
    children,
    className,
    'aria-label': ariaLabel,
  },
  ref,
) {
  const theme = useTheme();
  const palette = theme.colors[colorKey(color)];
  const tokens = theme.components.badge;

  const isNumeric = typeof content === 'number';
  const numericHidden = isNumeric && content === 0 && !showZero;
  const effectivelyHidden = isInvisible || numericHidden;

  const displayContent = variant === 'dot' ? null : formatContent(content, max);
  const singleChar =
    isOneCharacter ||
    variant === 'dot' ||
    (typeof displayContent === 'string' && displayContent.length <= 1);

  const bg = palette[500] ?? palette.DEFAULT;
  const fg = palette.foreground ?? theme.colors.text.primary;
  const outlineColor = theme.colors.bg.surface;

  const autoId = useId();
  const safeAutoId = autoId.replace(/:/g, '');

  const posKey: 'offsetTopRight' | 'offsetTopLeft' | 'offsetBottomRight' | 'offsetBottomLeft' =
    placement === 'top-right'
      ? 'offsetTopRight'
      : placement === 'top-left'
        ? 'offsetTopLeft'
        : placement === 'bottom-right'
          ? 'offsetBottomRight'
          : 'offsetBottomLeft';
  const translate = tokens[posKey];

  const pos = PLACEMENT_POS[placement];

  const dotStyles = css`
    display: inline-block;
    width: ${tokens.dotSize};
    height: ${tokens.dotSize};
    border-radius: 9999px;
    background-color: ${bg};
    ${showOutline ? `box-shadow: 0 0 0 ${tokens.dotBorderWidth} ${outlineColor};` : ''}
    ${isPulse
      ? `
        position: relative;
        &::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background-color: ${bg};
          animation: timeui-badge-pulse ${tokens.pulseDuration} ease-out infinite;
        }
        @keyframes timeui-badge-pulse {
          0% { transform: scale(1); opacity: 0.7; }
          80% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          &::after { animation: none; }
        }
      `
      : ''}
  `;

  const standardStyles = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    height: ${tokens.standardHeight};
    min-width: ${singleChar ? tokens.standardMinWidth : `calc(${tokens.standardMinWidth} + 4px)`};
    padding: ${singleChar ? '0' : `0 ${tokens.standardPaddingX}`};
    border-radius: ${tokens.standardRadius};
    background-color: ${bg};
    color: ${fg};
    font-size: ${tokens.standardFontSize};
    font-weight: ${tokens.standardFontWeight};
    line-height: 1;
    white-space: nowrap;
    ${showOutline ? `box-shadow: 0 0 0 ${tokens.standardBorderWidth} ${outlineColor};` : ''}
    animation: timeui-badge-enter ${tokens.enterDuration} ease-out;
    @keyframes timeui-badge-enter {
      from {
        transform: scale(${tokens.enterScale});
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `;

  const badgeInner = (
    <span
      data-testid="badge"
      data-variant={variant}
      data-color={color}
      data-placement={placement}
      data-invisible={effectivelyHidden || undefined}
      aria-label={ariaLabel ?? (typeof displayContent === 'string' ? displayContent : undefined)}
      role={ariaLabel ? 'status' : undefined}
      css={variant === 'dot' ? dotStyles : standardStyles}
    >
      {variant === 'dot' ? null : displayContent}
    </span>
  );

  // Standalone (no children)
  if (children === undefined) {
    if (effectivelyHidden) {
      return (
        <span
          ref={ref}
          className={className}
          data-invisible="true"
          id={`timeui-badge-${safeAutoId}`}
          css={css`
            display: inline-block;
          `}
        />
      );
    }
    return (
      <span
        ref={ref}
        className={className}
        id={`timeui-badge-${safeAutoId}`}
        css={css`
          display: inline-flex;
          align-items: center;
          justify-content: center;
        `}
      >
        {badgeInner}
      </span>
    );
  }

  // Wrapper mode
  return (
    <span
      ref={ref}
      className={className}
      id={`timeui-badge-${safeAutoId}`}
      css={css`
        position: relative;
        display: inline-flex;
        vertical-align: middle;
      `}
    >
      {children}
      {!effectivelyHidden ? (
        <span
          css={css`
            position: absolute;
            ${pos.top !== undefined ? `top: ${pos.top};` : ''}
            ${pos.right !== undefined ? `right: ${pos.right};` : ''}
            ${pos.bottom !== undefined ? `bottom: ${pos.bottom};` : ''}
            ${pos.left !== undefined ? `left: ${pos.left};` : ''}
            transform: ${translate};
            transform-origin: center;
            pointer-events: none;
            z-index: 1;
          `}
        >
          {badgeInner}
        </span>
      ) : null}
    </span>
  );
});

(Badge as unknown as { displayName: string }).displayName = 'TimeUI.Badge';

export type { BadgeColor, BadgePlacement, BadgeVariant };
