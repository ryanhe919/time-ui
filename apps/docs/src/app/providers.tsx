/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 集中封装应用级 Provider 组合逻辑。
 */

'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ConfigProvider, ThemeProvider, lightTheme, darkTheme, type Locale } from '@timeui/react';

type Mode = 'light' | 'dark';
const ThemeModeCtx = createContext<{
  mode: Mode;
  setMode: (next: Mode) => void;
}>({
  mode: 'light',
  setMode: () => {},
});

export function useThemeMode() {
  return useContext(ThemeModeCtx);
}

export function Providers({
  locale = 'zh',
  children,
}: {
  locale?: Locale;
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<Mode>('light');

  useEffect(() => {
    const stored = (localStorage.getItem('docs-theme') as Mode | null) ?? 'light';
    setMode(stored);
    document.documentElement.dataset.theme = stored;
  }, []);

  const setModeAndPersist = useCallback((next: Mode) => {
    setMode(next);
    localStorage.setItem('docs-theme', next);
    document.documentElement.dataset.theme = next;
  }, []);

  const theme = mode === 'dark' ? darkTheme : lightTheme;
  const value = useMemo(() => ({ mode, setMode: setModeAndPersist }), [mode, setModeAndPersist]);

  return (
    <ThemeModeCtx.Provider value={value}>
      <ConfigProvider locale={locale}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </ConfigProvider>
    </ThemeModeCtx.Provider>
  );
}
