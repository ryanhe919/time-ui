# `@timeui/themes`

把 `@timeui/tokens` 的原语映射为 **semantic token**，并对 Emotion 的 `DefaultTheme` 做 module augmentation。

## 内容

- `lightTheme` — 浅色主题
- `darkTheme` — 深色主题
- `createTheme(overrides, { base? })` — 基于现有主题深合并得到派生主题
- TypeScript 类型：`TimeUITheme`、`SemanticColors`

## 使用

```tsx
import { ThemeProvider } from '@timeui/core';
import { lightTheme, darkTheme, createTheme } from '@timeui/themes';

<ThemeProvider theme={lightTheme}>
  <App />
</ThemeProvider>;

// 自定义品牌色
const brand = createTheme({
  colors: {
    action: {
      primary: { default: '#ff2e88', hover: '#ff57a3', active: '#cc226d', disabled: '#ffb5d1' },
    },
  },
});

<ThemeProvider theme={brand}>
  <App />
</ThemeProvider>;
```

完整主题系统 + 所有 semantic key 见 [`docs/guides/theming.md`](../../docs/guides/theming.md)。

## WCAG AA 对比度

两套内置主题都经过对比度验证：

- `bordered` / `light` / `ghost` / `faded` / `flat` 变体的前景色使用 `scale[600]`。
- `danger` 在浅色主题下使用 `rgb(201, 12, 80)` 以确保对比度。

如果你基于 `createTheme` 自定义了颜色，请自行验证对比度。
