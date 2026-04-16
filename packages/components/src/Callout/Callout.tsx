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
