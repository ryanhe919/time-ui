# `@timeui/tokens`

TimeUI 的**原语设计 token**——纯数据、没有副作用、不消费 React。

## 内容

- `palette.*` — 语义无关的色阶（`blue.50` 到 `blue.900` 等）
- `spacing` — 间距梯度数组（px）
- `typography` — 字体族 / 字号 / 字重 / 行高
- `radius` — 圆角（sm / md / lg / full）
- `shadows` — 阴影（sm / md / lg / focus）
- `zIndex` — 分层（dropdown / modal / toast…）
- `breakpoints` — 响应断点
- `motion` — 动效时长 / 缓动
- `borders` — 边框宽度
- `components.buttonSizes` — Button 的 xs/sm/md/lg/xl 尺寸映射

## 使用

组件代码一般**不**直接引用这个包，而是通过 `@timeui/themes` 暴露的 semantic token 消费（见 [`docs/guides/theming.md`](../../docs/guides/theming.md)）。

有需要时也可以直接导入原语：

```ts
import { palette, spacing } from '@timeui/tokens';

console.log(palette.blue[500]); // '#1677ff'
console.log(spacing[4]); // '16px'
```

## 为什么把 token 拆成独立包？

- 让设计团队可以单独迭代 token 而不触发组件 rebuild。
- 让主题、应用、工具（如 codegen 脚本）都能共用同一份原语。
- 保持 `@timeui/themes` 只关心"语义映射"这一件事。
