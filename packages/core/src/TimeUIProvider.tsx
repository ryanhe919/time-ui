import type { ReactNode } from 'react';
import { ConfigProvider, type ConfigProviderProps } from './ConfigProvider';
import { ThemeProvider, type ThemeProviderProps } from './ThemeProvider';

export interface TimeUIProviderProps
  extends Omit<ConfigProviderProps, 'children'>, Omit<ThemeProviderProps, 'children'> {
  children: ReactNode;
}

/**
 * Top-level TimeUI provider. Composes `ConfigProvider` and `ThemeProvider`.
 *
 * ```tsx
 * <TimeUIProvider mode="dark" locale="zh-CN">
 *   <App />
 * </TimeUIProvider>
 * ```
 */
export const TimeUIProvider = ({
  children,
  theme,
  mode,
  prefixCls,
  direction,
  locale,
  getPopupContainer,
}: TimeUIProviderProps) => (
  <ConfigProvider
    prefixCls={prefixCls}
    direction={direction}
    locale={locale}
    getPopupContainer={getPopupContainer}
  >
    <ThemeProvider theme={theme} mode={mode}>
      {children}
    </ThemeProvider>
  </ConfigProvider>
);
