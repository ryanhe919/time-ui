/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 Avatar 组件：头像 + 状态点 + 自动 initials/颜色 hash。
 */

'use client';

import { forwardRef, useCallback, useEffect, useId, useState, type ReactNode } from 'react';
import { css, useTheme } from '@emotion/react';
import type { AvatarColor, AvatarProps, AvatarSize, AvatarStatus } from './Avatar.types';

const NAMED_SIZES: ReadonlyArray<AvatarSize> = ['xs', 'sm', 'md', 'lg', 'xl'];

const HASH_PALETTE: ReadonlyArray<Exclude<AvatarColor, 'auto' | 'neutral'> | 'neutral'> = [
  'primary',
  'success',
  'warning',
  'danger',
  'neutral',
];

function getInitials(name?: string): string {
  if (!name) return '';
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parts.length === 0) return '';
  if (parts.length === 1) {
    const first = parts[0] ?? '';
    return first.slice(0, 2).toUpperCase();
  }
  const first = parts[0] ?? '';
  const last = parts[parts.length - 1] ?? '';
  const a = first.charAt(0);
  const b = last.charAt(0);
  return (a + b).toUpperCase();
}

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pickAutoColor(name?: string): Exclude<AvatarColor, 'auto'> {
  if (!name) return 'neutral';
  const idx = hashName(name) % HASH_PALETTE.length;
  return HASH_PALETTE[idx] as Exclude<AvatarColor, 'auto'>;
}

function colorKey(
  color: Exclude<AvatarColor, 'auto'>,
): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  return color === 'neutral' ? 'default' : color;
}

const STATUS_COLOR_KEY: Record<AvatarStatus, 'success' | 'warning' | 'danger' | 'default'> = {
  online: 'success',
  busy: 'danger',
  away: 'warning',
  offline: 'default',
};

const DefaultUserIcon = ({ size }: { size: number }) => (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    width={Math.round(size * 0.6)}
    height={Math.round(size * 0.6)}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
  </svg>
);

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  {
    src,
    alt,
    name,
    fallbackIcon,
    size = 'md',
    shape = 'circle',
    color = 'neutral',
    status,
    isBordered = false,
    onError,
    className,
  },
  ref,
) {
  const theme = useTheme();
  const [imgErrored, setImgErrored] = useState(false);

  // Reset error state when src changes.
  useEffect(() => {
    setImgErrored(false);
  }, [src]);

  const isNamedSize =
    typeof size === 'string' && (NAMED_SIZES as ReadonlyArray<string>).includes(size);
  const sizeKey: AvatarSize = isNamedSize ? (size as AvatarSize) : 'md';
  const sizeTokens = theme.components.avatarSize[sizeKey];

  const dimensionPx = typeof size === 'number' ? size : parseFloat(sizeTokens.size);
  const dimension = typeof size === 'number' ? `${size}px` : sizeTokens.size;
  const fontSize =
    typeof size === 'number' ? `${Math.max(10, Math.round(size * 0.4))}px` : sizeTokens.fontSize;

  const resolvedColor: Exclude<AvatarColor, 'auto'> =
    color === 'auto' ? pickAutoColor(name) : color;
  const palette = theme.colors[colorKey(resolvedColor)];
  const ringColor = theme.colors.bg.surface;

  const initials = getInitials(name);
  const showImage = Boolean(src) && !imgErrored;

  const handleImgError = useCallback(() => {
    setImgErrored(true);
    onError?.();
  }, [onError]);

  const radius =
    shape === 'circle'
      ? theme.components.avatar.circleRadius
      : theme.components.avatar.squareRadius;
  const borderWidth = theme.components.avatar.groupBorderWidth;

  const autoId = useId();
  const safeAutoId = autoId.replace(/:/g, '');

  let body: ReactNode;
  if (showImage) {
    body = (
      <img
        src={src}
        alt={alt ?? name ?? ''}
        onError={handleImgError}
        css={css`
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        `}
      />
    );
  } else if (initials) {
    body = (
      <span
        aria-hidden={alt ? undefined : true}
        css={css`
          font-weight: ${theme.components.avatar.fallbackFontWeight};
          font-size: ${fontSize};
          line-height: 1;
          letter-spacing: 0.02em;
        `}
      >
        {initials}
      </span>
    );
  } else if (fallbackIcon) {
    body = (
      <span
        aria-hidden
        css={css`
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        `}
      >
        {fallbackIcon}
      </span>
    );
  } else {
    body = <DefaultUserIcon size={dimensionPx} />;
  }

  const ariaLabel = alt ?? name ?? 'Avatar';

  return (
    <span
      ref={ref}
      role={showImage ? undefined : 'img'}
      aria-label={showImage ? undefined : ariaLabel}
      data-shape={shape}
      data-color={resolvedColor}
      data-status={status ?? undefined}
      data-bordered={isBordered || undefined}
      data-size={isNamedSize ? sizeKey : 'custom'}
      className={className}
      id={`timeui-avatar-${safeAutoId}`}
      css={css`
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: visible;
        width: ${dimension};
        height: ${dimension};
        color: ${palette.foreground ?? theme.colors.text.primary};
        background-color: ${palette[500] ?? palette.DEFAULT};
        border-radius: ${radius};
        ${isBordered ? `box-shadow: 0 0 0 ${borderWidth} ${ringColor};` : ''}
        user-select: none;
        vertical-align: middle;
      `}
    >
      <span
        css={css`
          position: relative;
          width: 100%;
          height: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: inherit;
        `}
      >
        {body}
      </span>
      {status ? (
        <StatusDot
          status={status}
          dimensionPx={dimensionPx}
          sizeKey={isNamedSize ? sizeKey : 'md'}
        />
      ) : null}
    </span>
  );
});

(Avatar as unknown as { displayName: string }).displayName = 'TimeUI.Avatar';

const StatusDot = ({
  status,
  dimensionPx,
  sizeKey,
}: {
  status: AvatarStatus;
  dimensionPx: number;
  sizeKey: AvatarSize;
}) => {
  const theme = useTheme();
  const dotSizePx =
    dimensionPx <= 24
      ? Math.max(6, Math.round(dimensionPx * 0.28))
      : parseFloat(theme.components.avatarSize[sizeKey].statusDotSize);
  const offset = theme.components.avatar.statusDotOffset;
  const borderColor = theme.colors.bg.surface;
  const bw = theme.components.avatar.statusDotBorderWidth;
  const colorKeyName = STATUS_COLOR_KEY[status];
  const palette = theme.colors[colorKeyName];
  return (
    <span
      data-testid="avatar-status-dot"
      data-status={status}
      aria-hidden
      css={css`
        position: absolute;
        right: ${offset};
        bottom: ${offset};
        width: ${dotSizePx}px;
        height: ${dotSizePx}px;
        background-color: ${palette[500] ?? palette.DEFAULT};
        border-radius: 9999px;
        box-shadow: 0 0 0 ${bw} ${borderColor};
      `}
    />
  );
};

(StatusDot as unknown as { displayName: string }).displayName = 'TimeUI.Avatar.StatusDot';

export type { AvatarProps } from './Avatar.types';
