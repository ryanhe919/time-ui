/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 实现 Card 组件：flat / bordered / elevated 三档 variant，交互（pressable / hoverable / disabled）
 *   与 accentBar 治理。视觉遵循 Visual Treatment v1.0：bordered 致密化 hover（1px 不跳）、elevated 三层阴影、
 *   pressable 极细微 depress、focus halo 叠在 variant shadow 之后、accentBar 3 → 4px micro animation。
 */

'use client';

import {
  forwardRef,
  type ElementType,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
} from 'react';
import { css, useTheme } from '@emotion/react';
import type {
  CardAccentBar,
  CardColor,
  CardProps,
  CardRadius,
  CardSize,
  CardVariant,
} from './Card.types';

// ────────────────────────────────────────────────────────────
// Motion 常量（不对外 export；StatCard 从 ./motion 再导入）
// ────────────────────────────────────────────────────────────

export const CURVES = {
  weighty: 'cubic-bezier(0.32, 0.72, 0, 1)',
  tick: 'cubic-bezier(0.22, 1, 0.36, 1)',
  linear: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

export const DURATIONS = {
  hoverIn: '180ms',
  hoverOut: '220ms',
  pressDown: '80ms',
  pressUp: '220ms',
  focus: '140ms',
  deltaTick: '260ms',
  skeleton: '1400ms',
} as const;

// ────────────────────────────────────────────────────────────
// 尺寸 → padding / gap
// ────────────────────────────────────────────────────────────

const SIZE_PADDING: Record<CardSize, number> = {
  sm: 12,
  md: 16,
  lg: 24,
};

const RADIUS_KEY: Record<CardRadius, 'none' | 'sm' | 'md' | 'lg'> = {
  none: 'none',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

function colorKey(color: CardColor): CardColor {
  return color;
}

// ────────────────────────────────────────────────────────────
// Shadow（elevated / hover，light + dark）
// ────────────────────────────────────────────────────────────

const ELEVATED_SHADOW_LIGHT = [
  '0 1px 0 rgba(17, 24, 39, 0.04)',
  '0 1px 3px rgba(17, 24, 39, 0.06)',
  '0 4px 10px -4px rgba(17, 24, 39, 0.08)',
].join(', ');

const ELEVATED_HOVER_SHADOW_LIGHT = [
  '0 2px 0 rgba(17, 24, 39, 0.04)',
  '0 4px 8px rgba(17, 24, 39, 0.08)',
  '0 12px 24px -8px rgba(17, 24, 39, 0.12)',
].join(', ');

const ELEVATED_SHADOW_DARK = [
  'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
  '0 1px 2px rgba(0, 0, 0, 0.3)',
  '0 4px 12px -2px rgba(0, 0, 0, 0.35)',
].join(', ');

const ELEVATED_HOVER_SHADOW_DARK = [
  'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  '0 2px 4px rgba(0, 0, 0, 0.35)',
  '0 12px 28px -4px rgba(0, 0, 0, 0.5)',
].join(', ');

// ────────────────────────────────────────────────────────────
// 主组件
// ────────────────────────────────────────────────────────────

export const Card = forwardRef<HTMLElement, CardProps>(function Card(props, ref) {
  const {
    variant = 'bordered' as CardVariant,
    color = 'default' as CardColor,
    size = 'md' as CardSize,
    radius = 'md' as CardRadius,
    fullWidth = false,
    isPressable: isPressableProp = false,
    isHoverable = false,
    isDisabled = false,
    accentBar = 'none' as CardAccentBar,
    as,
    href,
    target,
    rel,
    onPress,
    onClick,
    className,
    style,
    classNames,
    children,
    'aria-label': ariaLabel,
    ...rest
  } = props;

  const theme = useTheme();
  const isDark = theme.mode === 'dark';
  const cKey = colorKey(color);
  const palette = theme.colors[cKey];

  // Pressable 语义：存在 href 自动视为 pressable。
  const isPressable = isPressableProp || href !== undefined;

  // 根节点决策：as > href → <a> > isPressable → div role="button" > div
  let Comp: ElementType = 'div';
  if (as) {
    Comp = as as ElementType;
  } else if (href !== undefined) {
    Comp = 'a';
  } else {
    Comp = 'div';
  }

  const interactive = (isPressable || isHoverable) && !isDisabled;

  const padding = SIZE_PADDING[size];
  const borderRadius = radius === 'none' ? '0px' : theme.componentRadius[RADIUS_KEY[radius]];

  // hover border color（bordered variant 致密化）
  // color=default → border.strong（回退 border.default）
  // 其他 color → [600] 兜底（ColorScale 没有 [300]/[400]，使用 600 级作为较深致密色）
  let hoverBorderColor: string;
  if (color === 'default') {
    hoverBorderColor = theme.colors.border.strong || theme.colors.border.default;
  } else {
    hoverBorderColor = isDark
      ? (palette[600] ?? palette.DEFAULT)
      : (palette[500] ?? palette.DEFAULT);
  }

  // flat hover
  const flatHoverBg =
    color === 'default' ? theme.colors.bg.muted : (palette[100] ?? theme.colors.bg.muted);
  const flatHoverRingColor =
    color === 'default'
      ? theme.colors.border.default
      : (palette[200] ?? theme.colors.border.default);

  // Variant base styles
  let baseBackground = theme.colors.bg.surface;
  let baseBorder = `1px solid transparent`;
  let baseShadow = 'none';
  let hoverBackground: string | null = null;
  let hoverBorder: string | null = null;
  let hoverShadow: string | null = null;

  if (variant === 'flat') {
    baseBackground = theme.colors.bg.muted;
    baseBorder = '1px solid transparent';
    baseShadow = 'none';
    hoverBackground = flatHoverBg;
    hoverShadow = `inset 0 0 0 1px ${flatHoverRingColor}`;
  } else if (variant === 'bordered') {
    baseBackground = theme.colors.bg.surface;
    baseBorder = `1px solid ${theme.colors.border.default}`;
    baseShadow = 'none';
    hoverBorder = hoverBorderColor;
    hoverShadow = `inset 0 0 0 1px ${hoverBorderColor}`;
  } else if (variant === 'elevated') {
    baseBackground = theme.colors.bg.surface;
    baseBorder = '1px solid transparent';
    baseShadow = isDark ? ELEVATED_SHADOW_DARK : ELEVATED_SHADOW_LIGHT;
    hoverShadow = isDark ? ELEVATED_HOVER_SHADOW_DARK : ELEVATED_HOVER_SHADOW_LIGHT;
  }

  // Accent bar
  const accentColor =
    color === 'default'
      ? theme.colors.border.strong || theme.colors.border.default
      : (palette[500] ?? palette.DEFAULT);

  // ── events ─────────────────────────────────────────────
  const handleClick = (e: MouseEvent<HTMLElement>) => {
    onClick?.(e);
    if (isDisabled) return;
    if (onPress) onPress(e);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!isPressable || isDisabled) return;
    if (href !== undefined || Comp === 'a' || Comp === 'button') {
      // Native element keyboard semantics take over.
      return;
    }
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      // Fire as a click-like event (construct a MouseEvent-shaped object is not safe;
      // rely on onPress only, not onClick, since no native click is fired here).
      onPress?.(e as unknown as MouseEvent<HTMLElement>);
    }
  };

  // ── ARIA / role ────────────────────────────────────────
  // Prefer native semantics when we can.
  const nativeInteractiveTag = Comp === 'a' || Comp === 'button';
  const role = isPressable && !nativeInteractiveTag ? 'button' : undefined;
  const tabIndex = isPressable && !nativeInteractiveTag ? (isDisabled ? -1 : 0) : undefined;
  const finalRel = Comp === 'a' && target === '_blank' ? (rel ?? 'noopener noreferrer') : rel;

  // AccentBar 伪元素几何
  const accentInset =
    accentBar === 'start'
      ? css`
          &::before {
            content: '';
            position: absolute;
            inset-inline-start: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background: ${accentColor};
            border-start-start-radius: inherit;
            border-end-start-radius: inherit;
            pointer-events: none;
            transition: width ${DURATIONS.hoverIn} ${CURVES.weighty};
          }
          &[data-hoverable='true']:hover::before,
          &[data-pressable='true']:hover::before {
            width: 4px;
          }
          @media (prefers-reduced-motion: reduce) {
            &::before {
              transition: none;
            }
          }
        `
      : accentBar === 'top'
        ? css`
            &::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: ${accentColor};
              border-start-start-radius: inherit;
              border-start-end-radius: inherit;
              pointer-events: none;
              transition: height ${DURATIONS.hoverIn} ${CURVES.weighty};
            }
            &[data-hoverable='true']:hover::before,
            &[data-pressable='true']:hover::before {
              height: 4px;
            }
            @media (prefers-reduced-motion: reduce) {
              &::before {
                transition: none;
              }
            }
          `
        : css``;

  return (
    <Comp
      ref={ref as never}
      className={[classNames?.root, className].filter(Boolean).join(' ') || undefined}
      style={style}
      href={Comp === 'a' ? href : undefined}
      target={Comp === 'a' ? target : undefined}
      rel={Comp === 'a' ? finalRel : undefined}
      role={role}
      tabIndex={tabIndex}
      aria-disabled={isDisabled || undefined}
      aria-label={ariaLabel}
      data-variant={variant}
      data-color={color}
      data-size={size}
      data-radius={radius}
      data-accent-bar={accentBar}
      data-pressable={isPressable || undefined}
      data-hoverable={isHoverable || undefined}
      data-disabled={isDisabled || undefined}
      data-fullwidth={fullWidth || undefined}
      onClick={handleClick}
      onKeyDown={isPressable ? handleKeyDown : undefined}
      css={[
        css`
          position: relative;
          display: flex;
          flex-direction: column;
          gap: ${padding}px;
          box-sizing: border-box;
          width: ${fullWidth ? '100%' : 'auto'};
          padding: ${padding}px;
          background: ${baseBackground};
          color: ${theme.colors.text.primary};
          border: ${baseBorder};
          border-radius: ${borderRadius};
          box-shadow: ${baseShadow};
          text-decoration: none;
          transition:
            background-color ${DURATIONS.hoverIn} ${CURVES.weighty},
            border-color ${DURATIONS.hoverIn} ${CURVES.weighty},
            color ${DURATIONS.hoverIn} ${CURVES.weighty},
            box-shadow ${DURATIONS.hoverIn} ${CURVES.weighty},
            transform ${DURATIONS.pressUp} ${CURVES.weighty},
            opacity ${DURATIONS.hoverIn} ${CURVES.weighty};
          cursor: ${interactive ? 'pointer' : 'default'};
          -webkit-tap-highlight-color: transparent;
          isolation: isolate;

          &[data-disabled='true'] {
            opacity: 0.55;
            cursor: not-allowed;
          }

          /* hover states — only when pressable or hoverable (not disabled) */
          &[data-hoverable='true']:hover:not([aria-disabled='true']),
          &[data-pressable='true']:hover:not([aria-disabled='true']) {
            ${hoverBackground !== null ? `background-color: ${hoverBackground};` : ''}
            ${hoverBorder !== null ? `border-color: ${hoverBorder};` : ''}
            ${hoverShadow !== null ? `box-shadow: ${hoverShadow};` : ''}
            ${variant === 'elevated' ? 'transform: translateY(-1px);' : ''}
          }

          /* pressable depress */
          &[data-pressable='true']:active:not([aria-disabled='true']) {
            transform: translateY(0.5px) scale(0.998);
            transition-duration: ${DURATIONS.pressDown};
          }
          &[data-pressable='true']:not(:active) {
            transition-duration: ${DURATIONS.pressUp};
          }

          /* focus halo — only applied to pressable surfaces so static cards don't get a halo */
          &[data-pressable='true']:focus-visible {
            outline: 2px solid ${theme.colors.focus};
            outline-offset: 3px;
            box-shadow:
              ${baseShadow === 'none' ? '0 0 0 0 transparent' : baseShadow},
              0 0 0 6px color-mix(in srgb, ${theme.colors.focus} 18%, transparent);
            transition: box-shadow ${DURATIONS.focus} ${CURVES.linear};
          }

          @media (prefers-reduced-motion: reduce) {
            transition: none;
            &[data-pressable='true']:active:not([aria-disabled='true']) {
              transform: none;
            }
            &[data-hoverable='true']:hover:not([aria-disabled='true']),
            &[data-pressable='true']:hover:not([aria-disabled='true']) {
              ${variant === 'elevated' ? 'transform: none;' : ''}
            }
          }
        `,
        accentInset,
      ]}
      {...rest}
    >
      {children}
    </Comp>
  );
}) as <T extends HTMLElement = HTMLElement>(
  props: CardProps & { ref?: React.Ref<T> },
) => ReactElement;

(Card as unknown as { displayName: string }).displayName = 'TimeUI.Card';
