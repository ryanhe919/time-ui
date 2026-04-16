'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ConfigProvider, ThemeProvider, lightTheme, darkTheme, type Locale } from '@timeui/react';

type Mode = 'light' | 'dark';
const ThemeModeCtx = createContext<{ mode: Mode; toggle: () => void }>({
  mode: 'light',
  toggle: () => {},
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

  const toggle = useCallback(() => {
    setMode((m) => {
      const next = m === 'light' ? 'dark' : 'light';
      localStorage.setItem('docs-theme', next);
      document.documentElement.dataset.theme = next;
      return next;
    });
  }, []);

  const theme = mode === 'dark' ? darkTheme : lightTheme;
  const value = useMemo(() => ({ mode, toggle }), [mode, toggle]);

  return (
    <ThemeModeCtx.Provider value={value}>
      <ConfigProvider locale={locale}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </ConfigProvider>
    </ThemeModeCtx.Provider>
  );
}
