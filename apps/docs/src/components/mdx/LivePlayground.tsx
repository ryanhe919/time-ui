/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-27
 * @description LivePlayground —— 基于 Sandpack 的可编辑实时预览。
 *              用户可在右侧编辑器中改 Demo.tsx 的代码（包含 props、样式等），
 *              左侧 iframe 即时重新渲染。底层依赖从 npm 拉真实的 @timeui/react@2.0.0+，
 *              所以效果与生产环境一致。
 */

'use client';

import { useMemo } from 'react';
import { css } from '@emotion/react';
import {
  Sandpack,
  type SandpackPredefinedTemplate,
  type SandpackThemeProp,
} from '@codesandbox/sandpack-react';
import { useThemeMode } from '@/app/providers';

export interface LivePlaygroundProps {
  /** 用户编辑的初始代码。必须默认导出一个 React 组件。 */
  code: string;
  /** 编辑器初始可见高度，默认 360。 */
  editorHeight?: number;
  /** 文档站 locale，用于注入 ConfigProvider。默认 'zh'。 */
  locale?: 'zh' | 'en';
  /** 额外 npm 依赖（除 @timeui/react / emotion 外）。 */
  extraDependencies?: Record<string, string>;
}

const APP_TEMPLATE = (
  locale: 'zh' | 'en',
  mode: 'light' | 'dark',
) => `import { ThemeProvider, ConfigProvider, lightTheme, darkTheme } from '@timeui/react';
import Demo from './Demo';

export default function App() {
  return (
    <ConfigProvider locale="${locale}">
      <ThemeProvider theme={${mode === 'dark' ? 'darkTheme' : 'lightTheme'}}>
        <div style={{
          padding: 24,
          minHeight: '100vh',
          background: ${mode === 'dark' ? "'#0b0b0c'" : "'#ffffff'"},
          color: ${mode === 'dark' ? "'#f5f5f7'" : "'#1d1d1f'"},
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        }}>
          <Demo />
        </div>
      </ThemeProvider>
    </ConfigProvider>
  );
}
`;

const INDEX_TEMPLATE = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root')!);
root.render(<StrictMode><App /></StrictMode>);
`;

export function LivePlayground({
  code,
  editorHeight = 360,
  locale = 'zh',
  extraDependencies,
}: LivePlaygroundProps) {
  const { mode } = useThemeMode();

  const dependencies = useMemo(
    () => ({
      '@timeui/react': '^2.0.0',
      '@timeui/icons': '^1.3.0',
      '@emotion/react': '^11.13.3',
      ...extraDependencies,
    }),
    [extraDependencies],
  );

  const files = useMemo(
    () => ({
      '/App.tsx': { code: APP_TEMPLATE(locale, mode), hidden: true },
      '/index.tsx': { code: INDEX_TEMPLATE, hidden: true },
      '/Demo.tsx': { code: code.trim(), active: true },
    }),
    [code, locale, mode],
  );

  const sandpackTheme: SandpackThemeProp = mode === 'dark' ? 'dark' : 'light';
  const template: SandpackPredefinedTemplate = 'react-ts';

  return (
    <div
      css={css`
        margin: 32px 0;
        border-radius: var(--r-card);
        overflow: hidden;
        border: 1px solid var(--c-hairline);
        box-shadow: var(--c-shadow-card);
        font-family: var(--docs-sans);
        .sp-wrapper {
          --sp-border-radius: 0 !important;
        }
        .sp-layout {
          border: 0 !important;
          border-radius: 0 !important;
        }
      `}
    >
      <Sandpack
        key={`${mode}-${locale}`}
        template={template}
        theme={sandpackTheme}
        files={files}
        customSetup={{ dependencies }}
        options={{
          editorHeight,
          showLineNumbers: true,
          showInlineErrors: true,
          wrapContent: true,
          showTabs: false,
          showNavigator: false,
          showConsole: false,
          showConsoleButton: true,
          autorun: true,
          recompileMode: 'delayed',
          recompileDelay: 400,
        }}
      />
    </div>
  );
}
