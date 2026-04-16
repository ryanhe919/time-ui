/** @jsxImportSource @emotion/react */
import { forwardRef, type ElementType, type ReactElement } from 'react';
import { useTheme, css } from '@emotion/react';
import type {
  ButtonProps,
  ButtonVariant,
  ButtonColor,
  ButtonSize,
  ButtonRadius,
} from './Button.types';

/**
 * Mix an alpha into an rgb/rgba/hex color string without adding a dependency.
 * Returns an `rgba(r, g, b, a)` string. Falls back to the original string if
 * the color cannot be parsed.
 */
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

/**
 * Resolve the HeroUI-style (variant, color) pair from potentially-legacy
 * inputs. When both a new `color` prop and a legacy variant (e.g. `'primary'`)
 * are supplied, the new `color` wins.
 */
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
  // Legacy mapping:
  //   primary  -> solid + primary
  //   secondary-> solid + secondary (visually closer to original filled look)
  //   outline  -> bordered + primary
  //   danger   -> solid + danger
  //   ghost    -> light + default (legacy ghost was a transparent neutral pill)
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
      // New 'ghost' behavior only applies when caller explicitly uses the new
      // API *with* a color; the bare legacy `variant="ghost"` kept the muted
      // neutral look, which maps cleanest to `light` + `default`.
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

/**
 * Map size → spinner diameter (roughly tracks the size's font-size).
 */
const spinnerSize: Record<ButtonSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
};

/**
 * Button — HeroUI-aligned action primitive.
 *
 * Accepts the new `variant` + `color` + `radius` API. Legacy variant values
 * (`'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'`) remain
 * supported via internal mapping:
 *
 *   - `variant="primary"`   → `variant="solid"`    color="primary"
 *   - `variant="secondary"` → `variant="solid"`    color="secondary"
 *   - `variant="outline"`   → `variant="bordered"` color="primary"
 *   - `variant="ghost"`     → `variant="light"`    color="default"
 *   - `variant="danger"`    → `variant="solid"`    color="danger"
 *
 * If both a new `color` and a legacy `variant` are supplied, the new `color`
 * wins.
 */
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
  const borderThick = theme.borders.width.thick;

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

  // Variant recipe (rest state + hover state).
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
      // Use scale[600] for text (per-theme contrast-safe) while keeping
      // scale.DEFAULT for the border to preserve brand vibrance.
      bg = 'transparent';
      fg = scale[600];
      border = `${borderThick} solid ${scale.DEFAULT}`;
      hoverBg = withAlpha(scale.DEFAULT, 0.2);
      break;
    case 'light':
      bg = 'transparent';
      fg = scale[600];
      hoverBg = withAlpha(scale.DEFAULT, 0.2);
      break;
    case 'flat':
      bg = withAlpha(scale.DEFAULT, 0.2);
      fg = scale[600];
      // Spec says color/50 feels too strong; use 0.3 (documented deviation).
      hoverBg = withAlpha(scale.DEFAULT, 0.3);
      break;
    case 'faded':
      bg = neutral[100];
      fg = scale[600];
      border = `${borderThick} solid ${neutral[500]}`;
      // Faded: no visible hover change.
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
      border = `${borderThick} solid ${scale.DEFAULT}`;
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
      css={css`
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: ${sizeTokens.gap};
        box-sizing: border-box;
        height: ${sizeTokens.height};
        min-width: ${sizeTokens.minWidth};
        padding: 0 ${sizeTokens.paddingX};
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
          outline: 2px solid ${focusColor};
          outline-offset: 2px;
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
