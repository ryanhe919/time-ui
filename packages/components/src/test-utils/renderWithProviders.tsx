/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Test-utils 组件的核心渲染与交互逻辑。
 */

import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { ConfigProvider, ThemeProvider, type TimeUIConfig } from '@timeui/core';
import { lightTheme, darkTheme, type TimeUITheme } from '@timeui/themes';

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: TimeUITheme | 'light' | 'dark';
  config?: Partial<TimeUIConfig>;
}

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
