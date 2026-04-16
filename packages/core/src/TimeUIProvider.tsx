/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现核心模块 TimeUIProvider。
 */

import type { ReactNode } from 'react';
import { ConfigProvider, type ConfigProviderProps } from './ConfigProvider';
import { ThemeProvider, type ThemeProviderProps } from './ThemeProvider';

export interface TimeUIProviderProps
  extends Omit<ConfigProviderProps, 'children'>, Omit<ThemeProviderProps, 'children'> {
  children: ReactNode;
}

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
