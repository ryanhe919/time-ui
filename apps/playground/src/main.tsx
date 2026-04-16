/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 Playground 应用的入口挂载逻辑。
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
