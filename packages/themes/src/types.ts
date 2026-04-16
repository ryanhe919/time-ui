/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现主题模块 types。
 */

import type {} from '@emotion/react';
import type {
  Tokens,
  Palette,
  Typography,
  Spacing,
  Radius,
  ComponentRadius,
  Shadows,
  ZIndex,
  Breakpoints,
  Motion,
  Borders,
  Components,
} from '@timeui/tokens';

export type ThemeMode = 'light' | 'dark';

export interface InteractiveColor {
  default: string;
  hover: string;
  active: string;
  disabled: string;
}

export interface ColorScale {
  DEFAULT: string;
  foreground: string;
  100: string;
  200: string;
  500: string;
  600: string;
}

export interface SemanticColors {
  default: ColorScale;
  primary: ColorScale;
  secondary: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  danger: ColorScale;
  focus: string;
  bg: {
    canvas: string;
    surface: string;
    raised: string;
    sunken: string;
    primary: string;
    muted: string;
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
    link: string;
    disabled: string;
  };
  border: {
    default: string;
    subtle: string;
    strong: string;
    focus: string;
  };
  action: {
    primary: InteractiveColor;
    secondary: InteractiveColor;
    danger: InteractiveColor;
  };
  status: {
    success: string;
    warning: string;
    danger: string;
    info: string;
    successBg: string;
    warningBg: string;
    dangerBg: string;
    infoBg: string;
  };
}

export interface TimeUITheme {
  mode: ThemeMode;
  tokens: Tokens;
  colors: SemanticColors;
  typography: Typography;
  spacing: Spacing;
  radius: Radius;
  componentRadius: ComponentRadius;
  shadows: Shadows;
  zIndex: ZIndex;
  breakpoints: Breakpoints;
  motion: Motion;
  borders: Borders;
  components: Components;
}

export type ThemeOverrides = DeepPartial<TimeUITheme>;

export type DeepPartial<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type {
  Palette,
  Typography,
  Spacing,
  Radius,
  ComponentRadius,
  Shadows,
  ZIndex,
  Breakpoints,
  Motion,
  Borders,
  Components,
};

declare module '@emotion/react' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface Theme extends TimeUITheme {}
}
