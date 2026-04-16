/** @jsxImportSource @emotion/react */
import { forwardRef, type HTMLAttributes, type AnchorHTMLAttributes } from 'react';
import { useTheme, css } from '@emotion/react';
import { t } from '../utils/theme';

export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export interface TextProps extends HTMLAttributes<HTMLSpanElement> {
  size?: TextSize;
  weight?: TextWeight;
  muted?: boolean;
  truncate?: boolean;
}

export const Text = forwardRef<HTMLSpanElement, TextProps>(function Text(
  { size = 'md', weight = 'regular', muted, truncate, ...rest },
  ref,
) {
  const theme = useTheme();
  const tt = t(theme);
  return (
    <span
      ref={ref}
      {...rest}
      css={css`
        font-family: ${tt.font};
        font-size: ${tt.fs(size)};
        font-weight: ${tt.fw(weight)};
        color: ${muted ? tt.color.textMuted : tt.color.text};
        ${truncate &&
        css`
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: inline-block;
          max-width: 100%;
        `}
      `}
    />
  );
});
Text.displayName = 'Text';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level = 2, ...rest },
  ref,
) {
  const theme = useTheme();
  const tt = t(theme);
  const Tag = `h${level}` as 'h1';
  const sizes: Record<number, string> = {
    1: '32px',
    2: '24px',
    3: '20px',
    4: '18px',
    5: '16px',
    6: '14px',
  };
  return (
    <Tag
      ref={ref as never}
      {...rest}
      css={css`
        font-family: ${tt.font};
        font-size: ${sizes[level] ?? '16px'};
        font-weight: ${tt.fw('semibold')};
        color: ${tt.color.text};
        margin: 0;
        line-height: 1.3;
      `}
    />
  );
});
Heading.displayName = 'Heading';

export const Paragraph = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  function Paragraph(props, ref) {
    const theme = useTheme();
    const tt = t(theme);
    return (
      <p
        ref={ref}
        {...props}
        css={css`
          font-family: ${tt.font};
          font-size: 14px;
          color: ${tt.color.text};
          line-height: 1.6;
          margin: 0 0 0.75em;
        `}
      />
    );
  },
);
Paragraph.displayName = 'Paragraph';

export const Link = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
  function Link(props, ref) {
    const theme = useTheme();
    const tt = t(theme);
    return (
      <a
        ref={ref}
        {...props}
        css={css`
          color: ${tt.color.primary};
          text-decoration: none;
          font-family: ${tt.font};
          &:hover {
            text-decoration: underline;
          }
          &:focus-visible {
            outline: 2px solid ${tt.color.primary};
            outline-offset: 2px;
            border-radius: 2px;
          }
        `}
      />
    );
  },
);
Link.displayName = 'Link';

export const Code = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(function Code(props, ref) {
  const theme = useTheme();
  const tt = t(theme);
  return (
    <code
      ref={ref}
      {...props}
      css={css`
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.9em;
        background: ${tt.color.codeBg};
        color: ${tt.color.textPrimary};
        border: 1px solid ${tt.color.borderSubtle};
        padding: 1px 6px;
        border-radius: ${tt.radius('sm')};
      `}
    />
  );
});
Code.displayName = 'Code';
