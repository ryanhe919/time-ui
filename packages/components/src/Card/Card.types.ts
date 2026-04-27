/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 定义 Card 组件族的对外类型契约。
 */

import type {
  CSSProperties,
  ElementType,
  HTMLAttributes,
  MouseEvent,
  MouseEventHandler,
  ReactNode,
} from 'react';

export type CardVariant = 'flat' | 'bordered' | 'elevated';
export type CardColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
export type CardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type CardRadius = 'none' | 'sm' | 'md' | 'lg';
export type CardAccentBar = 'start' | 'top' | 'none';

export type CardFooterJustify = 'start' | 'end' | 'between';

export interface CardClassNames {
  root?: string;
  header?: string;
  body?: string;
  footer?: string;
}

/**
 * onClick / color 与 native HTMLDivElement 同名但语义不同，剥出再声明。
 */
type StrippedDivKeys = 'onClick' | 'color';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, StrippedDivKeys> {
  variant?: CardVariant;
  color?: CardColor;
  size?: CardSize;
  radius?: CardRadius;
  isFullWidth?: boolean;
  isPressable?: boolean;
  isHoverable?: boolean;
  isDisabled?: boolean;
  accentBar?: CardAccentBar;
  as?: ElementType;
  href?: string;
  target?: string;
  rel?: string;
  onPress?: (e: MouseEvent<HTMLElement>) => void;
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
  style?: CSSProperties;
  classNames?: CardClassNames;
  children?: ReactNode;
  'aria-label'?: string;
}

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  startContent?: ReactNode;
  endContent?: ReactNode;
  as?: ElementType;
  className?: string;
  classNames?: Pick<CardClassNames, 'header'>;
  children?: ReactNode;
}

export interface CardBodyProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}

export interface CardFooterProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  justify?: CardFooterJustify;
  className?: string;
  children?: ReactNode;
}
