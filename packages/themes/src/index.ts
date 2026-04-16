/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 统一导出当前包的对外公共 API。
 */

export * from './types';
export { lightTheme } from './lightTheme';
export { darkTheme } from './darkTheme';
export { createTheme, type CreateThemeOptions } from './createTheme';
export { token, cssVar, type Path } from './helpers';

import { lightTheme } from './lightTheme';
import { darkTheme } from './darkTheme';

export const themes = { light: lightTheme, dark: darkTheme } as const;
