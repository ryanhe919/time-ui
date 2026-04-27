/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 Empty 组件：含 4 个内置插画与 default / inline 两种布局。
 */

'use client';

import { forwardRef, useId, type ReactNode } from 'react';
import { css, useTheme } from '@emotion/react';
import type { EmptyImagePreset, EmptyProps, EmptySize } from './Empty.types';

const PRESETS: ReadonlyArray<EmptyImagePreset> = ['default', 'search', 'error', 'no-data'];

interface PresetIconProps {
  preset: EmptyImagePreset;
  size: number;
  color: string;
}

const PresetIcon = ({ preset, size, color }: PresetIconProps) => {
  const stroke = 1.5;
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 64 64',
    fill: 'none',
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (preset) {
    case 'default':
      // empty box
      return (
        <svg {...common} data-testid="empty-image">
          <path d="M10 26l8-14h28l8 14" />
          <path d="M10 26v22a4 4 0 0 0 4 4h36a4 4 0 0 0 4-4V26z" />
          <path d="M10 26h14l3 6h10l3-6h14" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common} data-testid="empty-image">
          <circle cx="28" cy="28" r="14" />
          <path d="M40 40l12 12" />
          <path d="M22 28h12" />
        </svg>
      );
    case 'error':
      return (
        <svg {...common} data-testid="empty-image">
          <path d="M32 8L4 56h56L32 8z" />
          <path d="M32 26v14" />
          <circle cx="32" cy="48" r="1.5" fill={color} stroke="none" />
        </svg>
      );
    case 'no-data':
      return (
        <svg {...common} data-testid="empty-image">
          <rect x="10" y="14" width="44" height="36" rx="4" />
          <path d="M16 24h22M16 32h32M16 40h18" />
        </svg>
      );
  }
};

(PresetIcon as unknown as { displayName: string }).displayName = 'TimeUI.Empty.PresetIcon';

function imageBox(size: EmptySize, isInline: boolean): string {
  if (isInline) return 'inlineImageSize';
  if (size === 'xs') return 'imageSizeXs';
  if (size === 'sm') return 'imageSizeSm';
  if (size === 'lg') return 'imageSizeLg';
  if (size === 'xl') return 'imageSizeXl';
  return 'imageSizeMd';
}

export const Empty = forwardRef<HTMLDivElement, EmptyProps>(function Empty(
  {
    image = 'default',
    title,
    description,
    actions,
    size = 'md',
    variant = 'default',
    className,
    children,
  },
  ref,
) {
  const theme = useTheme();
  const tokens = theme.components.empty;
  const isInline = variant === 'inline';
  const muted = theme.colors.text.muted;
  const titleColor = theme.colors.text.primary;
  const descColor = theme.colors.text.secondary;

  const autoId = useId();
  const safeAutoId = autoId.replace(/:/g, '');

  const imageKey = imageBox(size, isInline) as
    | 'imageSizeXs'
    | 'imageSizeSm'
    | 'imageSizeMd'
    | 'imageSizeLg'
    | 'imageSizeXl'
    | 'inlineImageSize';
  const imgPx = parseFloat(tokens[imageKey]);

  let imgNode: ReactNode = null;
  if (typeof image === 'string' && (PRESETS as ReadonlyArray<string>).includes(image)) {
    imgNode = <PresetIcon preset={image as EmptyImagePreset} size={imgPx} color={muted} />;
  } else if (image) {
    imgNode = image;
  }

  const titleFontSize = isInline ? tokens.inlineTitleFontSize : tokens.titleFontSize;
  const descFontSize = isInline ? tokens.inlineDescFontSize : tokens.descFontSize;

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      data-variant={variant}
      data-size={size}
      className={className}
      id={`timeui-empty-${safeAutoId}`}
      css={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: ${tokens.gap};
        padding: ${isInline ? tokens.inlinePaddingY : tokens.paddingY} ${tokens.paddingX};
        color: ${muted};
        box-sizing: border-box;
      `}
    >
      {imgNode ? (
        <div
          data-testid="empty-image-wrap"
          css={css`
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: ${muted};
            line-height: 0;
          `}
        >
          {imgNode}
        </div>
      ) : null}
      {title || description ? (
        <div
          css={css`
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: ${tokens.descGap};
            max-width: ${tokens.descMaxWidth};
          `}
        >
          {title ? (
            <div
              data-testid="empty-title"
              css={css`
                color: ${titleColor};
                font-size: ${titleFontSize};
                font-weight: ${tokens.titleFontWeight};
                line-height: ${tokens.titleLineHeight};
              `}
            >
              {title}
            </div>
          ) : null}
          {description ? (
            <div
              data-testid="empty-desc"
              css={css`
                color: ${descColor};
                font-size: ${descFontSize};
                line-height: ${tokens.descLineHeight};
              `}
            >
              {description}
            </div>
          ) : null}
        </div>
      ) : null}
      {actions ? (
        <div
          data-testid="empty-actions"
          css={css`
            display: inline-flex;
            align-items: center;
            gap: ${tokens.actionsGap};
            margin-top: ${tokens.actionsMarginTop};
          `}
        >
          {actions}
        </div>
      ) : null}
      {children ? (
        <div
          data-testid="empty-children"
          css={css`
            display: contents;
          `}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
});

(Empty as unknown as { displayName: string }).displayName = 'TimeUI.Empty';
