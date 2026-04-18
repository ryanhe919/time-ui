/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-18
 * @description Card 头部子组件：title / subtitle + 起止内容槽。
 */

'use client';

import { forwardRef, type ElementType, type ReactElement } from 'react';
import { css, useTheme } from '@emotion/react';
import type { CardHeaderProps } from './Card.types';

export const CardHeader = forwardRef<HTMLElement, CardHeaderProps>(function CardHeader(
  { title, subtitle, startContent, endContent, as, className, children, ...rest },
  ref,
) {
  const theme = useTheme();
  const Comp = (as ?? 'header') as ElementType;

  return (
    <Comp
      ref={ref as never}
      data-slot="header"
      className={className}
      css={css`
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        color: ${theme.colors.text.primary};
      `}
      {...rest}
    >
      {startContent ? (
        <span
          data-slot="header-start"
          css={css`
            display: inline-flex;
            align-items: center;
            flex: none;
          `}
        >
          {startContent}
        </span>
      ) : null}
      {title != null || subtitle != null ? (
        <span
          data-slot="header-text"
          css={css`
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
            flex: 1 1 auto;
          `}
        >
          {title != null ? (
            <span
              data-slot="header-title"
              css={css`
                font-size: 15px;
                font-weight: 600;
                line-height: 1.4;
                color: ${theme.colors.text.primary};
                overflow: hidden;
                text-overflow: ellipsis;
              `}
            >
              {title}
            </span>
          ) : null}
          {subtitle != null ? (
            <span
              data-slot="header-subtitle"
              css={css`
                font-size: 13px;
                line-height: 1.45;
                color: ${theme.colors.text.secondary};
              `}
            >
              {subtitle}
            </span>
          ) : null}
        </span>
      ) : null}
      {children != null ? children : null}
      {endContent ? (
        <span
          data-slot="header-end"
          css={css`
            display: inline-flex;
            align-items: center;
            flex: none;
            margin-inline-start: auto;
          `}
        >
          {endContent}
        </span>
      ) : null}
    </Comp>
  );
}) as <T extends HTMLElement = HTMLElement>(
  props: CardHeaderProps & { ref?: React.Ref<T> },
) => ReactElement;

(CardHeader as unknown as { displayName: string }).displayName = 'TimeUI.CardHeader';
