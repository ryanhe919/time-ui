/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Playground 应用的示例页面。
 */

import { useState } from 'react';
import { Button, ThemeProvider, lightTheme, darkTheme } from '@timeui/react';

export const App = () => {
  const [dark, setDark] = useState(false);
  const theme = dark ? darkTheme : lightTheme;
  return (
    <ThemeProvider theme={theme}>
      <main
        style={{
          minHeight: '100vh',
          padding: 32,
          background: theme.colors.bg.canvas,
          color: theme.colors.text.primary,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h1>TimeUI Playground</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
        <Button variant="secondary" onClick={() => setDark((d) => !d)}>
          Toggle {dark ? 'Light' : 'Dark'}
        </Button>
      </main>
    </ThemeProvider>
  );
};
