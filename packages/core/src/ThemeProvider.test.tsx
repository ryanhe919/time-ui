import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTheme } from '@emotion/react';
import { darkTheme, lightTheme } from '@timeui/themes';
import { ThemeProvider } from './ThemeProvider';
import { TimeUIProvider } from './TimeUIProvider';

describe('ThemeProvider', () => {
  it('defaults to lightTheme', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });
    expect(result.current.mode).toBe('light');
    expect(result.current.colors.bg.canvas).toBe(lightTheme.colors.bg.canvas);
  });

  it('honors mode="dark"', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider mode="dark">{children}</ThemeProvider>,
    });
    expect(result.current.mode).toBe('dark');
    expect(result.current.colors.bg.canvas).toBe(darkTheme.colors.bg.canvas);
  });
});

describe('TimeUIProvider', () => {
  it('composes theme + config', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <TimeUIProvider mode="dark" locale="zh-CN">
          {children}
        </TimeUIProvider>
      ),
    });
    expect(result.current.mode).toBe('dark');
  });
});
