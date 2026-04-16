// Re-export core providers & theme APIs for a one-stop consumer import.
export { ConfigProvider, ThemeProvider, useConfig, useTheme, useI18n } from '@timeui/core';
export type {
  TimeUIConfig,
  ConfigProviderProps,
  ThemeProviderProps,
  Locale,
  Messages,
} from '@timeui/core';
export { lightTheme, darkTheme, themes } from '@timeui/themes';
export type { TimeUITheme, ThemeMode } from '@timeui/themes';

export * from './Button';
export * from './Callout';
export * from './Search';
export * from './Typography';
export * from './Layout';
/* CodeBlock is intentionally NOT re-exported here. Import it from
 * `@timeui/react/code-block` so consumers who don't use CodeBlock never pay
 * for the optional `shiki` peer (and bundlers don't emit shiki's grammar
 * chunks into their dist). */
