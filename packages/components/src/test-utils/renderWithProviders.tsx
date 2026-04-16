import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { ConfigProvider, ThemeProvider, type TimeUIConfig } from '@timeui/core';
import { lightTheme, darkTheme, type TimeUITheme } from '@timeui/themes';

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Theme object or a named theme mode (`'light' | 'dark'`). Defaults to `lightTheme`. */
  theme?: TimeUITheme | 'light' | 'dark';
  /** Optional overrides for `ConfigProvider`. */
  config?: Partial<TimeUIConfig>;
}

/**
 * `TimeUIProvider` — wraps children in the canonical TimeUI context stack
 * (`ConfigProvider` + `ThemeProvider`). Exported from test-utils so component
 * tests exercise the exact provider tree the app-level consumer would use.
 */
export const TimeUIProvider = ({
  children,
  theme,
  config,
}: {
  children: ReactNode;
  theme?: TimeUITheme;
  config?: Partial<TimeUIConfig>;
}) => (
  <ConfigProvider {...(config ?? {})}>
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  </ConfigProvider>
);

const resolveTheme = (theme: RenderWithProvidersOptions['theme']): TimeUITheme | undefined => {
  if (!theme) return undefined;
  if (theme === 'light') return lightTheme;
  if (theme === 'dark') return darkTheme;
  return theme;
};

/**
 * Render a React element inside the full TimeUI provider stack. Use this
 * helper in every component test instead of bare `render()` so behaviour
 * stays consistent with production consumers.
 */
export const renderWithProviders = (
  ui: ReactElement,
  { theme, config, ...options }: RenderWithProvidersOptions = {},
): RenderResult => {
  const resolvedTheme = resolveTheme(theme);
  return render(ui, {
    wrapper: ({ children }) => (
      <TimeUIProvider theme={resolvedTheme} config={config}>
        {children}
      </TimeUIProvider>
    ),
    ...options,
  });
};
