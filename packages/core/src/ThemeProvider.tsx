/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现核心模块 ThemeProvider。
 */

import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { darkTheme, lightTheme, type TimeUITheme } from '@timeui/themes';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeProviderProps {
  theme?: TimeUITheme;
  mode?: ThemeMode;
  children: ReactNode;
}

function usePrefersDark(enabled: boolean): boolean {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (!enabled || typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [enabled]);
  return isDark;
}

export const ThemeProvider = ({ theme, mode = 'light', children }: ThemeProviderProps) => {
  const prefersDark = usePrefersDark(mode === 'auto');
  const resolved = useMemo<TimeUITheme>(() => {
    if (theme) return theme;
    if (mode === 'dark') return darkTheme;
    if (mode === 'auto') return prefersDark ? darkTheme : lightTheme;
    return lightTheme;
  }, [theme, mode, prefersDark]);
  return <EmotionThemeProvider theme={resolved}>{children}</EmotionThemeProvider>;
};

export { useTheme } from '@emotion/react';
