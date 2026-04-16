# `@timeui/utils`

TimeUI 的**框架无关**工具函数。纯函数、无 React 依赖、完全可 tree-shake。

## 导出

- `cx(...classes)` — 轻量的 classnames 合并（忽略 `null` / `undefined` / `false`）
- `isBrowser()` — SSR-safe 环境检测
- `noop()` — 什么都不做的函数引用（等同于 `() => {}` 但稳定的引用）

## 用法

```ts
import { cx, isBrowser, noop } from '@timeui/utils';

cx('btn', isActive && 'btn--active');
// → 'btn btn--active'

if (isBrowser()) {
  window.addEventListener('resize', handleResize);
}

props.onChange ?? noop;
```

## 设计原则

- 零依赖。
- 仅加入**在组件库里确实需要**的函数——不做 lodash 的替代。
- 每个 export 对应一个明确的用例；有疑问优先使用原生 JS。
