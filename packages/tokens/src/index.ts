/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 统一导出当前包的对外公共 API。
 */

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radius';
export * from './shadows';
export * from './zIndex';
export * from './breakpoints';
export * from './motion';
export * from './borders';
export * from './components';

import { palette } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius, componentRadius } from './radius';
import { shadows } from './shadows';
import { zIndex } from './zIndex';
import { breakpoints } from './breakpoints';
import { motion } from './motion';
import { borders } from './borders';
import { components } from './components';

export const tokens = {
  palette,
  typography,
  spacing,
  radius,
  componentRadius,
  shadows,
  zIndex,
  breakpoints,
  motion,
  borders,
  components,
} as const;

export type Tokens = typeof tokens;
