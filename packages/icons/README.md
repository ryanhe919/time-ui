# `@timeui/icons`

TimeUI 的图标库——基于 SVGR 从 `svg/` 目录自动生成 tree-shakeable 的 React 组件。

## 使用

```tsx
import { IconSearch, IconCheck } from '@timeui/icons';

<IconSearch width={16} height={16} />;
```

所有图标：

- 使用 `currentColor`，颜色跟随父元素
- 默认 24 × 24 viewBox，线宽 `stroke-width="2"`
- forwardRef 到根 `<svg>`，兼容 tooltip / popover 的 trigger 模式

## 新增图标

1. 把 24 × 24 的 SVG 放进 `packages/icons/svg/`，颜色用 `currentColor`。
2. 运行 `pnpm --filter @timeui/icons generate`，会自动生成同名的 React 组件并更新 barrel。
3. 同时提交 SVG 与生成的 `.tsx` + `index.ts`。

## 当前状态

当前组件库内部并**不直接依赖**图标包——大部分组件（如 Button）使用内联的 inline SVG。图标包面向**应用层**用户，作为 DX 的补全；随着组件库发展会逐步把部分内联 SVG 收拢过来。
