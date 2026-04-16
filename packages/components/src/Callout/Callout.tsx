/** @jsxImportSource @emotion/react */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { useTheme, css } from '@emotion/react';

export type CalloutVariant = 'info' | 'success' | 'warning' | 'danger' | 'tip';

export interface CalloutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Visual + semantic variant. Default `'info'`. */
  variant?: CalloutVariant;
  /** Optional heading shown above the body. */
  title?: ReactNode;
  /**
   * Leading glyph. Pass a node to override, or `false` to hide entirely.
   * Defaults to a variant-appropriate monospace character.
   */
  icon?: ReactNode | false;
  children: ReactNode;
}

/** Map each variant to the color-scale key that drives its accent + fg. */
const scaleKey: Record<CalloutVariant, 'primary' | 'success' | 'warning' | 'danger'> = {
  info: 'primary',
  tip: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

/** Variant → ARIA role. Errors/warnings get assertive announcements. */
const role: Record<CalloutVariant, 'status' | 'alert'> = {
  info: 'status',
  tip: 'status',
  success: 'status',
  warning: 'alert',
  danger: 'alert',
};

/** Default glyph per variant — simple mono-safe symbols. */
const defaultGlyph: Record<CalloutVariant, string> = {
  info: '—',
  tip: '★',
  success: '✓',
  warning: '!',
  danger: '✕',
};

/**
 * Callout — a prose-friendly notice block for documentation, inline hints,
 * and other non-dismissible messages.
 *
 * Use `Alert`-style patterns (closable, actions) with a dedicated Alert
 * component instead. Callout is intentionally structural and static.
 */
export const Callout = forwardRef<HTMLDivElement, CalloutProps>(function Callout(
  { variant = 'info', title, icon, children, ...rest },
  ref,
) {
  const theme = useTheme();
  const key = scaleKey[variant];
  const accent = theme.colors[key].DEFAULT;
  const fg = theme.colors[key][600];
  const glyph = icon === undefined ? defaultGlyph[variant] : icon;

  return (
    <div
      ref={ref}
      role={role[variant]}
      data-variant={variant}
      {...rest}
      css={css`
        margin: 16px 0;
        padding: 16px 18px;
        border-left: 2px solid ${accent};
        background: ${theme.colors.bg.surface};
        display: grid;
        grid-template-columns: ${icon === false ? '1fr' : 'auto 1fr'};
        gap: 10px;
        align-items: start;
        color: ${theme.colors.text.primary};
        border-radius: 2px;
      `}
    >
      {icon !== false && (
        <div
          aria-hidden
          css={css`
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 14px;
            line-height: 1.5;
            color: ${fg};
            padding-top: 2px;
            min-width: 14px;
            text-align: center;
          `}
        >
          {glyph}
        </div>
      )}
      <div>
        {title && (
          <div
            css={css`
              font-weight: 600;
              font-size: 14px;
              line-height: 1.4;
              color: ${theme.colors.text.primary};
              margin-bottom: 4px;
            `}
          >
            {title}
          </div>
        )}
        <div
          css={css`
            font-size: 14px;
            line-height: 1.65;
            color: ${theme.colors.text.secondary};
          `}
        >
          {children}
        </div>
      </div>
    </div>
  );
});
Callout.displayName = 'Callout';
