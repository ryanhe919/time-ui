/**
 * @timeui/tokens — primitive design tokens.
 *
 * These are raw, theme-agnostic values (color ramps, type scale, spacing grid,
 * etc.). UI components never consume primitives directly: `@timeui/themes`
 * maps them onto semantic roles (bg.primary, text.muted, …).
 *
 * Every export uses `as const` so TypeScript infers literal types, giving
 * consumers full autocomplete on token paths.
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

/** The full primitive token set, grouped by category. */
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
