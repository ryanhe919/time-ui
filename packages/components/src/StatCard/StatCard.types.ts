/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 定义 StatCard 组件的对外类型契约。
 */

import type { CSSProperties, ElementType, MouseEvent, MouseEventHandler, ReactNode } from 'react';
import type {
  CardAccentBar,
  CardClassNames,
  CardColor,
  CardRadius,
  CardSize,
  CardVariant,
} from '../Card/Card.types';

export type StatCardDeltaDirection = 'up' | 'down' | 'flat';
export type StatCardDeltaPolarity = 'positive' | 'negative' | 'neutral' | 'auto';

export interface StatCardDelta {
  value: ReactNode;
  direction?: StatCardDeltaDirection;
  polarity?: StatCardDeltaPolarity;
}

export type StatCardEmphasis = 'subtle' | 'default' | 'strong';
export type StatCardValueAlign = 'start' | 'center';
export type StatCardIconPlacement = 'start' | 'end';

export interface StatCardClassNames extends CardClassNames {
  label?: string;
  value?: string;
  delta?: string;
  icon?: string;
  description?: string;
  trend?: string;
}

export interface StatCardSrLabels {
  valueLabel?: string;
  deltaLabel?: string;
}

export interface StatCardProps {
  // —— 透传给内部 Card —— //
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
  'aria-label'?: string;

  // —— StatCard 自己的 —— //
  label: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  iconPlacement?: StatCardIconPlacement;
  delta?: StatCardDelta;
  trend?: ReactNode;
  hasTrendBleed?: boolean;
  isLoading?: boolean;
  emphasis?: StatCardEmphasis;
  valueAlign?: StatCardValueAlign;
  sr?: StatCardSrLabels;
  classNames?: StatCardClassNames;
}
