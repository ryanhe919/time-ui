# 主题系统

TimeUI 把设计决策拆成两层：

| 层级          | 包               | 内容                                                               |
| ------------- | ---------------- | ------------------------------------------------------------------ |
| **Primitive** | `@timeui/tokens` | 原始、与主题无关的取值：色板（color scale）、字号梯度、spacing。   |
| **Semantic**  | `@timeui/themes` | 基于语义的 token（`colors.bg.surface`、`colors.action.primary`）。 |

组件只消费 **semantic** token（通过 Emotion 的 theme），因此**重新换肤不用动任何一个组件**。

## 快速开始

TimeUI 用两个独立的 Provider —— `ConfigProvider`（负责 locale / 运行配置）和 `ThemeProvider`（负责主题）。应用根上两个都要包：

```tsx
import { ConfigProvider, ThemeProvider } from '@timeui/core';
import { lightTheme, darkTheme } from '@timeui/themes';

export function Root({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider locale="zh">
      <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
    </ConfigProvider>
  );
}
```

切换深色：把 `theme={lightTheme}` 换成 `theme={darkTheme}` 即可；或者在外层用任何 hooks/state 控制。

## 在组件里消费 theme

推荐用 Emotion 的 `css` prop + `useTheme()`（不用 `@emotion/styled`）：

```tsx
/** @jsxImportSource @emotion/react */
import { css, useTheme } from '@emotion/react';

export function Card({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <div
      css={css`
        background: ${theme.colors.bg.surface};
        color: ${theme.colors.text.primary};
        border: 1px solid ${theme.colors.border.default};
        border-radius: ${theme.radius.lg};
        padding: ${theme.spacing[4]};
      `}
    >
      {children}
    </div>
  );
}
```

`@timeui/themes` 对 Emotion 做了 module augmentation（`DefaultTheme`），`theme.*` 的访问是**完全类型化**的。

## 定制主题

### 方式 1：创建一个派生主题

```tsx
import { createTheme } from '@timeui/themes';
import { ThemeProvider } from '@timeui/core';

const brand = createTheme({
  colors: {
    action: {
      primary: {
        default: '#ff2e88',
        hover: '#ff57a3',
        active: '#cc226d',
        disabled: '#ffb5d1',
      },
    },
  },
});

<ThemeProvider theme={brand}>
  <App />
</ThemeProvider>;
```

`createTheme` 会把你的 override **深合并**到默认的 `lightTheme` 上。需要基于 dark 扩展：`createTheme(overrides, { base: darkTheme })`。

### 方式 2：完整主题对象

任何满足 `TimeUITheme` 类型的对象都可以直接作为 `theme={...}` 传入。TypeScript 会提示所有必填 semantic key。

## Semantic token 速览

```
colors.bg        canvas / surface / raised / sunken / primary / muted / overlay
colors.text      primary / secondary / muted / inverse / link / disabled
colors.border    default / subtle / strong / focus
colors.action.*  primary | secondary | danger × default / hover / active / disabled
colors.status    success / warning / danger / info（每项都有 bg / fg 变体）
colors.focus     focus ring 颜色

typography.*     fontFamily / fontSize / fontWeight / lineHeight
spacing[0-12]    间距梯度（px）
radius.*         sm / md / lg / full
shadows.*        sm / md / lg / focus
zIndex.*         dropdown / modal / toast / ...
breakpoints.*    xs / sm / md / lg / xl
motion.duration  fast / normal / slow
motion.easing    standard / emphasized / linear
borders.width    hairline / thin / thick
```

## 逃生舱：直接用原语

需要原始色板时，通过 `theme.tokens` 访问：

```ts
theme.tokens.palette.blue[500]; // '#1677ff'
```

**能用 semantic 就用 semantic**——原语会绕过深浅色与自定义主题的逻辑，容易在换肤时出现对比度问题。

## i18n 与 theme 的关系

二者是正交的两个 Provider：

- `ConfigProvider` 负责 `locale`（影响 `useI18n()` 读的文案，如 CodeBlock 的"复制/已复制"、Search 的默认 placeholder）。
- `ThemeProvider` 负责 `theme`（影响视觉）。

切换语言不会触发主题切换，反之亦然。
