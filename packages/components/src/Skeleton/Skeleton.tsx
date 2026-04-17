/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 Skeleton 组件：rect / circle / text 三种形态 + shimmer / pulse 动画。
 */

'use client';

import { forwardRef, useId } from 'react';
import { css, useTheme } from '@emotion/react';
import { useSkeletonGroup } from './SkeletonGroup';
import type { SkeletonProps, SkeletonShape } from './Skeleton.types';

function toCss(value: number | string | undefined, fallback: string): string {
  if (value === undefined) return fallback;
  if (typeof value === 'number') return `${value}px`;
  return value;
}

export const Skeleton = forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(
  {
    shape = 'rect',
    width,
    height,
    lines,
    radius,
    animation,
    isLoaded,
    children,
    className,
    'aria-label': ariaLabel,
  },
  ref,
) {
  const theme = useTheme();
  const groupCtx = useSkeletonGroup();

  const resolvedLoaded = isLoaded ?? groupCtx?.isLoaded ?? false;
  const resolvedAnimation = animation ?? groupCtx?.animation ?? 'shimmer';

  const tokens = theme.components.skeleton;
  const baseColor = theme.colors.bg.muted;
  const highlightColor = theme.colors.bg.sunken;

  const autoId = useId();
  const safeAutoId = autoId.replace(/:/g, '');

  if (resolvedLoaded) {
    return <>{children ?? null}</>;
  }

  const animationStyles = (() => {
    if (resolvedAnimation === 'shimmer') {
      return css`
        background-image: linear-gradient(
          ${tokens.shimmerAngle},
          ${baseColor} 0%,
          ${highlightColor} 50%,
          ${baseColor} 100%
        );
        background-size: ${tokens.shimmerWidth} 100%;
        background-position: -${tokens.shimmerWidth} 0;
        animation: timeui-skeleton-shimmer ${tokens.shimmerDuration} ease-in-out infinite;
        @keyframes timeui-skeleton-shimmer {
          to {
            background-position: ${tokens.shimmerWidth} 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          animation: none;
          background-image: none;
          background-color: ${baseColor};
        }
      `;
    }
    if (resolvedAnimation === 'pulse') {
      return css`
        background-color: ${baseColor};
        animation: timeui-skeleton-pulse ${tokens.pulseDuration} ease-in-out infinite;
        @keyframes timeui-skeleton-pulse {
          0%,
          100% {
            opacity: ${tokens.pulseMaxOpacity};
          }
          50% {
            opacity: ${tokens.pulseMinOpacity};
          }
        }
        @media (prefers-reduced-motion: reduce) {
          animation: none;
        }
      `;
    }
    // none
    return css`
      background-color: ${baseColor};
    `;
  })();

  // Multi-line text variant
  if (shape === 'text' && typeof lines === 'number' && lines > 1) {
    return (
      <span
        ref={ref}
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label={ariaLabel ?? 'Loading'}
        data-shape="text"
        data-lines={lines}
        className={className}
        id={`timeui-skeleton-${safeAutoId}`}
        css={css`
          display: flex;
          flex-direction: column;
          gap: ${tokens.textGap};
          width: ${toCss(width, '100%')};
        `}
      >
        {Array.from({ length: lines }).map((_, idx) => {
          const isLast = idx === lines - 1;
          const lineWidth = isLast ? tokens.textLastLineWidth : '100%';
          return (
            <span
              key={idx}
              data-testid="skeleton-line"
              css={[
                css`
                  display: block;
                  width: ${lineWidth};
                  height: ${toCss(height, tokens.textHeightMd)};
                  border-radius: ${toCss(radius, tokens.textRadius)};
                `,
                animationStyles,
              ]}
            />
          );
        })}
      </span>
    );
  }

  let resolvedRadius: string;
  let resolvedWidth: string;
  let resolvedHeight: string;
  switch (shape as SkeletonShape) {
    case 'circle':
      resolvedRadius = toCss(radius, tokens.circleRadius);
      resolvedWidth = toCss(width, '40px');
      resolvedHeight = toCss(height, resolvedWidth);
      break;
    case 'text':
      resolvedRadius = toCss(radius, tokens.textRadius);
      resolvedWidth = toCss(width, '100%');
      resolvedHeight = toCss(height, tokens.textHeightMd);
      break;
    case 'rect':
    default:
      resolvedRadius = toCss(radius, tokens.rectRadius);
      resolvedWidth = toCss(width, '100%');
      resolvedHeight = toCss(height, '16px');
      break;
  }

  return (
    <span
      ref={ref}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={ariaLabel ?? 'Loading'}
      data-shape={shape}
      data-animation={resolvedAnimation}
      className={className}
      id={`timeui-skeleton-${safeAutoId}`}
      css={[
        css`
          display: block;
          width: ${resolvedWidth};
          height: ${resolvedHeight};
          border-radius: ${resolvedRadius};
        `,
        animationStyles,
      ]}
    />
  );
});

(Skeleton as unknown as { displayName: string }).displayName = 'TimeUI.Skeleton';
