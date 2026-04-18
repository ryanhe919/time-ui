/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-18
 * @description Card 主体子组件。
 */

'use client';

import { forwardRef, type ElementType, type ReactElement } from 'react';
import { css } from '@emotion/react';
import type { CardBodyProps } from './Card.types';

export const CardBody = forwardRef<HTMLElement, CardBodyProps>(function CardBody(
  { as, className, children, ...rest },
  ref,
) {
  const Comp = (as ?? 'div') as ElementType;

  return (
    <Comp
      ref={ref as never}
      data-slot="body"
      className={className}
      css={css`
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-width: 0;
      `}
      {...rest}
    >
      {children}
    </Comp>
  );
}) as <T extends HTMLElement = HTMLElement>(
  props: CardBodyProps & { ref?: React.Ref<T> },
) => ReactElement;

(CardBody as unknown as { displayName: string }).displayName = 'TimeUI.CardBody';
