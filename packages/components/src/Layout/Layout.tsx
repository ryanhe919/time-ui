/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Layout 组件的核心渲染与交互逻辑。
 */

import * as React from 'react';
import {
  forwardRef,
  type ElementType,
  type ComponentPropsWithRef,
  type CSSProperties,
} from 'react';
import { css, type CSSObject } from '@emotion/react';

type SxProp = CSSProperties;

type PolyProps<C extends ElementType, P> = P & {
  as?: C;
  sx?: SxProp;
} & Omit<ComponentPropsWithRef<C>, keyof P | 'as'>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type BoxProps<C extends ElementType = 'div'> = PolyProps<C, {}>;
export const Box = forwardRef(function Box<C extends ElementType = 'div'>(
  { as, sx, ...rest }: BoxProps<C>,
  ref: React.Ref<Element>,
) {
  const Comp = (as || 'div') as ElementType;
  return <Comp ref={ref as never} css={sx ? css(sx as CSSObject) : undefined} {...rest} />;
}) as <C extends ElementType = 'div'>(p: BoxProps<C>) => React.ReactElement;
(Box as unknown as { displayName: string }).displayName = 'Box';

export interface FlexOwnProps {
  direction?: CSSProperties['flexDirection'];
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  wrap?: CSSProperties['flexWrap'];
  gap?: number | string;
}
export type FlexProps<C extends ElementType = 'div'> = PolyProps<C, FlexOwnProps>;

export const Flex = forwardRef(function Flex<C extends ElementType = 'div'>(
  { as, sx, direction, align, justify, wrap, gap, ...rest }: FlexProps<C>,
  ref: React.Ref<Element>,
) {
  const Comp = (as || 'div') as ElementType;
  return (
    <Comp
      ref={ref as never}
      css={[
        css`
          display: flex;
          flex-direction: ${direction ?? 'row'};
          align-items: ${align ?? 'stretch'};
          justify-content: ${justify ?? 'flex-start'};
          flex-wrap: ${wrap ?? 'nowrap'};
          gap: ${typeof gap === 'number' ? `${gap}px` : (gap ?? '0')};
        `,
        sx && css(sx as CSSObject),
      ]}
      {...rest}
    />
  );
}) as <C extends ElementType = 'div'>(p: FlexProps<C>) => React.ReactElement;
(Flex as unknown as { displayName: string }).displayName = 'Flex';

export interface GridOwnProps {
  columns?: number | string;
  gap?: number | string;
  rowGap?: number | string;
  columnGap?: number | string;
}
export type GridProps<C extends ElementType = 'div'> = PolyProps<C, GridOwnProps>;

export const Grid = forwardRef(function Grid<C extends ElementType = 'div'>(
  { as, sx, columns = 12, gap, rowGap, columnGap, ...rest }: GridProps<C>,
  ref: React.Ref<Element>,
) {
  const Comp = (as || 'div') as ElementType;
  const cols = typeof columns === 'number' ? `repeat(${columns}, minmax(0, 1fr))` : columns;
  const g = (v?: number | string) => (typeof v === 'number' ? `${v}px` : v);
  return (
    <Comp
      ref={ref as never}
      css={[
        css`
          display: grid;
          grid-template-columns: ${cols};
          gap: ${g(gap) ?? '0'};
          row-gap: ${g(rowGap) ?? g(gap) ?? '0'};
          column-gap: ${g(columnGap) ?? g(gap) ?? '0'};
        `,
        sx && css(sx as CSSObject),
      ]}
      {...rest}
    />
  );
}) as <C extends ElementType = 'div'>(p: GridProps<C>) => React.ReactElement;
(Grid as unknown as { displayName: string }).displayName = 'Grid';

export interface StackOwnProps {
  direction?: 'row' | 'column';
  spacing?: number | string;
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
}
export type StackProps<C extends ElementType = 'div'> = PolyProps<C, StackOwnProps>;

export const Stack = forwardRef(function Stack<C extends ElementType = 'div'>(
  { as, sx, direction = 'column', spacing = 8, align, justify, ...rest }: StackProps<C>,
  ref: React.Ref<Element>,
) {
  const Comp = (as || 'div') as ElementType;
  const gap = typeof spacing === 'number' ? `${spacing}px` : spacing;
  return (
    <Comp
      ref={ref as never}
      css={[
        css`
          display: flex;
          flex-direction: ${direction};
          align-items: ${align ?? 'stretch'};
          justify-content: ${justify ?? 'flex-start'};
          gap: ${gap};
        `,
        sx && css(sx as CSSObject),
      ]}
      {...rest}
    />
  );
}) as <C extends ElementType = 'div'>(p: StackProps<C>) => React.ReactElement;
(Stack as unknown as { displayName: string }).displayName = 'Stack';

export interface ContainerOwnProps {
  maxWidth?: number | string;
  isPadded?: boolean;
}
export type ContainerProps<C extends ElementType = 'div'> = PolyProps<C, ContainerOwnProps>;

export const Container = forwardRef(function Container<C extends ElementType = 'div'>(
  { as, sx, maxWidth = 1200, isPadded = true, ...rest }: ContainerProps<C>,
  ref: React.Ref<Element>,
) {
  const Comp = (as || 'div') as ElementType;
  const mw = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;
  return (
    <Comp
      ref={ref as never}
      css={[
        css`
          width: 100%;
          max-width: ${mw};
          margin-left: auto;
          margin-right: auto;
          ${isPadded && 'padding: 0 16px;'}
          box-sizing: border-box;
        `,
        sx && css(sx as CSSObject),
      ]}
      {...rest}
    />
  );
}) as <C extends ElementType = 'div'>(p: ContainerProps<C>) => React.ReactElement;
(Container as unknown as { displayName: string }).displayName = 'Container';
