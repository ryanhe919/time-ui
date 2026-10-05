/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Callout 组件的核心渲染与交互逻辑。
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { useTheme, css } from '@emotion/react';

export type CalloutVariant = 'info' | 'success' | 'warning' | 'danger' | 'tip';

export interface CalloutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: CalloutVariant;
  title?: ReactNode;
  icon?: ReactNode | false;
  children: ReactNode;
}

const scaleKey: Record<CalloutVariant, 'primary' | 'success' | 'warning' | 'danger'> = {
  info: 'primary',
  tip: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

const role: Record<CalloutVariant, 'status' | 'alert'> = {
  info: 'status',
  tip: 'status',
  success: 'status',
  warning: 'alert',
  danger: 'alert',
};

const defaultGlyph: Record<CalloutVariant, string> = {
  info: '—',
  tip: '★',
  success: '✓',
  warning: '!',
  danger: '✕',
};

export const Callout = forwardRef<HTMLDivElement, CalloutProps>(function Callout(
  { variant = 'info', title, icon, children, ...rest },
  ref,
) {
  const theme = useTheme();
  const tk = theme.components.callout;
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
        margin: ${tk.marginY} 0;
        padding: ${tk.paddingY} ${tk.paddingX};
        border-left: ${tk.borderLeftWidth} solid ${accent};
        background: ${theme.colors.bg.surface};
        display: grid;
        grid-template-columns: ${icon === false ? 'minmax(0, 1fr)' : 'auto minmax(0, 1fr)'};
        gap: ${tk.gap};
        align-items: start;
        color: ${theme.colors.text.primary};
        border-radius: ${tk.radius};
      `}
    >
      {icon !== false && (
        <div
          aria-hidden
          css={css`
            font-family: ${theme.typography.fontFamily.mono};
            font-size: ${tk.iconFontSize};
            line-height: 1.5;
            color: ${fg};
            padding-top: ${tk.iconPaddingTop};
            min-width: ${tk.iconMinWidth};
            text-align: center;
          `}
        >
          {glyph}
        </div>
      )}
      <div
        css={css`
          min-width: 0;
          overflow-wrap: anywhere;
        `}
      >
        {title && (
          <div
            css={css`
              font-weight: ${tk.titleFontWeight};
              font-size: ${tk.titleFontSize};
              line-height: ${tk.titleLineHeight};
              color: ${theme.colors.text.primary};
              margin-bottom: ${tk.titleMarginBottom};
            `}
          >
            {title}
          </div>
        )}
        <div
          css={css`
            font-size: ${tk.bodyFontSize};
            line-height: ${tk.bodyLineHeight};
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
