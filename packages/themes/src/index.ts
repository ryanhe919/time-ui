/**
 * @timeui/themes — semantic token layer and theme engine.
 *
 * Primitives (from `@timeui/tokens`) are raw values. Themes map those
 * primitives onto semantic roles (`colors.bg.surface`, `colors.text.muted`,
 * `colors.action.primary.hover`, …). Components should consume semantic
 * tokens only.
 *
 * Theming is handled via Emotion's `ThemeProvider`. Type augmentation in
 * `./types.ts` gives every `styled.div` and `css` prop full autocomplete
 * for the `TimeUITheme` shape.
 */

export * from './types';
export { lightTheme } from './lightTheme';
export { darkTheme } from './darkTheme';
export { createTheme, type CreateThemeOptions } from './createTheme';
export { token, cssVar, type Path } from './helpers';

import { lightTheme } from './lightTheme';
import { darkTheme } from './darkTheme';

/** Bundled built-in themes, keyed by mode. */
export const themes = { light: lightTheme, dark: darkTheme } as const;
