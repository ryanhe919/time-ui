/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-18
 * @description Card 底部子组件。
 */

'use client';

import { forwardRef, type ElementType, type ReactElement } from 'react';
import { css } from '@emotion/react';
import type { CardFooterJustify, CardFooterProps } from './Card.types';

const JUSTIFY_MAP: Record<CardFooterJustify, string> = {
  start: 'flex-start',
  end: 'flex-end',
  between: 'space-between',
};

export const CardFooter = forwardRef<HTMLElement, CardFooterProps>(function CardFooter(
  { as, justify = 'end', className, children, ...rest },
  ref,
) {
  const Comp = (as ?? 'footer') as ElementType;

  return (
    <Comp
      ref={ref as never}
      data-slot="footer"
      data-justify={justify}
      className={className}
      css={css`
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: ${JUSTIFY_MAP[justify]};
      `}
      {...rest}
    >
      {children}
    </Comp>
  );
}) as <T extends HTMLElement = HTMLElement>(
  props: CardFooterProps & { ref?: React.Ref<T> },
) => ReactElement;

(CardFooter as unknown as { displayName: string }).displayName = 'TimeUI.CardFooter';
