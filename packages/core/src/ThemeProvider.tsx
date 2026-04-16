import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { darkTheme, lightTheme, type TimeUITheme } from '@timeui/themes';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeProviderProps {
  /** Explicit theme object. Overrides `mode`. */
  theme?: TimeUITheme;
  /** Pick a built-in theme by mode. `'auto'` follows `prefers-color-scheme`. */
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

/**
 * Wraps Emotion's `ThemeProvider` with TimeUI defaults.
 *
 * - Pass a `theme` to use a custom theme (from `createTheme`).
 * - Pass `mode="dark"` (or `"auto"`) to pick a built-in theme.
 * - With no props it defaults to `lightTheme`.
 */
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
