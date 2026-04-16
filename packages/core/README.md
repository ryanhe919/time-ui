# `@timeui/core`

TimeUI 的共享 Provider 与 hooks——**所有组件都假设宿主应用包了 `ConfigProvider` + `ThemeProvider`**。

## 导出

### Provider

```tsx
import { ConfigProvider, ThemeProvider } from '@timeui/core';
import { lightTheme } from '@timeui/themes';

<ConfigProvider locale="zh">
  <ThemeProvider theme={lightTheme}>
    <App />
  </ThemeProvider>
</ConfigProvider>;
```

- `ConfigProvider` —— 承载运行时配置（`locale`、未来会放其他开关）。
- `ThemeProvider` —— 桥接到 Emotion 的 `ThemeProvider`。

两个 Provider 是**正交的**——切换 locale 不影响主题，反之亦然。

### Hooks

- `useI18n()` —— 返回当前 locale 下的文案字典（`common` / `button` / `codeBlock` / `search` 等 namespace）
- `useConfig()` —— 读 `ConfigProvider` 的当前配置
- （未来还会加 `useMediaQuery`、`useBreakpoint` 等）

### 类型

```ts
export type Locale = 'zh' | 'en';
export interface TimeUIConfig {
  locale: Locale;
}
```

### 内置文案

`messages.ts` 提供 `zh` 和 `en` 两套字典。组件（例如 `Search`、`CodeBlock`）调用 `useI18n()` 消费：

```ts
const i18n = useI18n();
i18n.codeBlock.copy; // '复制' / 'Copy'
i18n.search.placeholder; // '搜索…' / 'Search…'
```

## 为什么分成两个 Provider？

- **职责分离**：locale 属于运行时配置，theme 属于视觉——两者生命周期不同。
- **避免无意义的重渲染**：切换主题时 `ConfigProvider` 的 consumer 不会被触发，反之亦然。
- **SSR 友好**：locale 可以从请求头读取、theme 可以从 cookie 读取，解耦之后更容易并行初始化。
