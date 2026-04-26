/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Button 组件的核心渲染与交互逻辑。
 */

import { forwardRef, type ElementType, type ReactElement } from 'react';
import { useTheme, css } from '@emotion/react';
import type {
  ButtonProps,
  ButtonVariant,
  ButtonColor,
  ButtonSize,
  ButtonRadius,
} from './Button.types';

function withAlpha(color: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const c = color.trim();
  const rgbMatch = c.match(
    /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+[\d.%]+)?\s*\)$/i,
  );
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  const hexMatch = c.match(/^#([0-9a-f]{3,8})$/i);
  if (hexMatch && hexMatch[1]) {
    let h: string = hexMatch[1];
    if (h.length === 3) {
      h = h
        .split('')
        .map((ch) => ch + ch)
        .join('');
    }
    if (h.length === 6 || h.length === 8) {
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }
  return c;
}

type NewVariant = 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'ghost';

interface Resolved {
  variant: NewVariant;
  color: ButtonColor;
}

function resolveVariantColor(
  variant: ButtonVariant | undefined,
  color: ButtonColor | undefined,
): Resolved {
  const newVariants: NewVariant[] = [
    'solid',
    'bordered',
    'light',
    'flat',
    'faded',
    'shadow',
    'ghost',
  ];
  if (variant && (newVariants as string[]).includes(variant)) {
    return { variant: variant as NewVariant, color: color ?? 'default' };
  }
  switch (variant) {
    case 'primary':
      return { variant: 'solid', color: color ?? 'primary' };
    case 'secondary':
      return { variant: 'solid', color: color ?? 'secondary' };
    case 'outline':
      return { variant: 'bordered', color: color ?? 'primary' };
    case 'danger':
      return { variant: 'solid', color: color ?? 'danger' };
    case 'ghost':
      return color ? { variant: 'ghost', color } : { variant: 'light', color: 'default' };
    default:
      return { variant: 'solid', color: color ?? 'default' };
  }
}

const Spinner = ({ size = 14 }: { size?: number }) => (
  <span
    aria-hidden
    css={css`
      width: ${size}px;
      height: ${size}px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
      animation: timeui-spin 0.7s linear infinite;
      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
      @keyframes timeui-spin {
        to {
          transform: rotate(360deg);
        }
      }
    `}
  />
);

const spinnerSize: Record<ButtonSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
};

export const Button = forwardRef<Element, ButtonProps>(function Button(
  {
    as,
    variant,
    color,
    size = 'md',
    radius: radiusProp,
    loading = false,
    disabled = false,
    fullWidth = false,
    isIconOnly = false,
    startIcon,
    endIcon,
    children,
    type,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const Comp = (as || 'button') as ElementType;
  const isButton = Comp === 'button';

  const { variant: v, color: c } = resolveVariantColor(variant, color);

  const scale = theme.colors[c];
  const neutral = theme.colors.default;
  const focusColor = theme.colors.focus;
  const borderThin = theme.borders.width.thin;

  const sizeTokens = theme.components.button[size];
  const sizeRadiusMap: Record<ButtonSize, ButtonRadius> = {
    xs: 'sm',
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'lg',
  };
  const radiusKey: ButtonRadius = radiusProp ?? sizeRadiusMap[size];
  const borderRadius = theme.componentRadius[radiusKey];

  let bg = 'transparent';
  let fg: string = scale.DEFAULT;
  let border = '0 solid transparent';
  let boxShadow = 'none';
  let hoverBg: string | null = null;
  let hoverFg: string | null = null;

  switch (v) {
    case 'solid':
      bg = scale.DEFAULT;
      fg = scale.foreground;
      hoverBg = withAlpha(scale.DEFAULT, 0.9);
      break;
    case 'bordered':
      bg = 'transparent';
      fg = scale[600];
      border = `${borderThin} solid ${scale.DEFAULT}`;
      hoverBg = withAlpha(scale.DEFAULT, 0.12);
      break;
    case 'light':
      bg = 'transparent';
      fg = scale[600];
      hoverBg = withAlpha(scale.DEFAULT, 0.2);
      break;
    case 'flat':
      bg = withAlpha(scale.DEFAULT, 0.2);
      fg = scale[600];
      hoverBg = withAlpha(scale.DEFAULT, 0.3);
      break;
    case 'faded':
      bg = neutral[100];
      fg = scale[600];
      border = `${borderThin} solid ${neutral[200]}`;
      break;
    case 'shadow':
      bg = scale.DEFAULT;
      fg = scale.foreground;
      boxShadow = `${withAlpha(scale.DEFAULT, 0.4)} 0 10px 15px -3px, ${withAlpha(
        scale.DEFAULT,
        0.4,
      )} 0 4px 6px -4px`;
      hoverBg = withAlpha(scale.DEFAULT, 0.9);
      break;
    case 'ghost':
      bg = 'transparent';
      fg = scale[600];
      border = `${borderThin} solid ${scale.DEFAULT}`;
      hoverBg = scale.DEFAULT;
      hoverFg = scale.foreground;
      break;
  }

  const duration = theme.motion.duration.normal ?? '250ms';

  return (
    <Comp
      ref={ref as never}
      type={isButton ? (type ?? 'button') : type}
      disabled={isButton ? disabled || loading : undefined}
      aria-disabled={disabled || loading || undefined}
      aria-busy={loading || undefined}
      data-variant={v}
      data-color={c}
      data-size={size}
      data-loading={loading || undefined}
      data-icon-only={isIconOnly || undefined}
      css={css`
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: ${isIconOnly ? '0' : sizeTokens.gap};
        box-sizing: border-box;
        height: ${sizeTokens.height};
        min-width: ${isIconOnly ? sizeTokens.height : sizeTokens.minWidth};
        ${isIconOnly ? `width: ${sizeTokens.height};` : ''}
        padding: ${isIconOnly ? '0' : `0 ${sizeTokens.paddingX}`};
        font-family: inherit;
        font-size: ${sizeTokens.fontSize};
        line-height: ${sizeTokens.lineHeight};
        font-weight: 400;
        letter-spacing: normal;
        white-space: nowrap;
        overflow: hidden;
        cursor: pointer;
        user-select: none;
        width: ${fullWidth ? '100%' : 'auto'};
        background-color: ${bg};
        color: ${fg};
        border: ${border};
        border-radius: ${borderRadius};
        box-shadow: ${boxShadow};
        outline: 1.5px solid transparent;
        -webkit-font-smoothing: antialiased;
        transition:
          background-color ${duration},
          color ${duration},
          border-color ${duration},
          transform ${duration},
          opacity ${duration},
          box-shadow ${duration};

        &:hover:not(:disabled):not([aria-disabled='true']) {
          ${hoverBg !== null ? `background-color: ${hoverBg};` : ''}
          ${hoverFg !== null ? `color: ${hoverFg};` : ''}
        }

        &:active:not(:disabled):not([aria-disabled='true']),
        &[data-pressed='true'] {
          transform: scale(0.97);
        }

        &:focus-visible {
          outline: none;
          box-shadow: ${boxShadow === 'none' ? '' : `${boxShadow},`} inset 0 0 0 2px ${focusColor};
          z-index: 1;
        }

        &:disabled,
        &[aria-disabled='true'],
        &[data-loading='true'] {
          opacity: 0.5;
          pointer-events: none;
        }

        @media (prefers-reduced-motion: reduce) {
          transition: none;
          &:active:not(:disabled):not([aria-disabled='true']),
          &[data-pressed='true'] {
            transform: none;
          }
        }
      `}
      {...rest}
    >
      {loading ? <Spinner size={spinnerSize[size]} /> : startIcon}
      {children}
      {!loading && endIcon}
    </Comp>
  );
}) as <C extends ElementType = 'button'>(props: ButtonProps<C>) => ReactElement;

(Button as unknown as { displayName: string }).displayName = 'Button';
