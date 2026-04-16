# `@timeui/react`

TimeUI 的**发布入口**——聚合所有公开组件。

## 安装

```bash
pnpm add @timeui/react @timeui/core @timeui/themes @emotion/react
# 可选：若要使用 CodeBlock 的语法高亮
pnpm add shiki
```

> `react` / `react-dom` 是 peer dependency，必须由宿主工程提供（≥ 18）。`shiki` 也是 optional peer——不装则 CodeBlock 回退为纯文本展示，主包体积不受影响。

## 最小用法

```tsx
import { ConfigProvider, ThemeProvider } from '@timeui/core';
import { lightTheme } from '@timeui/themes';
import { Button } from '@timeui/react';

export default function App() {
  return (
    <ConfigProvider locale="zh">
      <ThemeProvider theme={lightTheme}>
        <Button color="primary">开始使用</Button>
      </ThemeProvider>
    </ConfigProvider>
  );
}
```

## 导出一览

- 操作类：`Button`、`Search`
- 排版：`Heading`、`Paragraph`、`Link`、`Code`
- 布局：`Flex`、`Stack`
- 文档类：`Callout`、`CodeBlock`（通过 sub-entry）
- 表单类：`FormField`、`Input`、`Textarea`、`Checkbox` + `CheckboxGroup`、`Radio` + `RadioGroup`、`Switch`、`Select` + `SelectOption`
- 测试工具：`renderWithProviders`、`expectA11y`（通过 `@timeui/react/test-utils`）

## 多入口

| 入口                       | 用途                                     |
| -------------------------- | ---------------------------------------- |
| `@timeui/react`            | 主包，聚合所有组件（**不含** CodeBlock） |
| `@timeui/react/code-block` | CodeBlock 组件（含 shiki 动态加载逻辑）  |
| `@timeui/react/test-utils` | 测试辅助函数                             |

拆分入口的目的：让只用 Button 的用户**不必把 shiki 打进 bundle**。

## Bundle 预算

- 主包（全量）gzipped ≤ 30 KB
- 仅 Button gzipped ≤ 20 KB
- `code-block` 入口 gzipped ≤ 5 KB（不含 shiki 本体）

详细配置见仓库根的 `.size-limit.cjs`。

## 组件文档

组件级别的 API / 示例请看文档站 `/zh/docs/components/*` 或仓库里的 `apps/docs/src/app/[locale]/docs/components/` 下的 MDX。

新增的表单组件文档路径：

- `/zh/docs/components/form-field`（FormField）
- `/zh/docs/components/input`（Input）
- `/zh/docs/components/textarea`（Textarea）
- `/zh/docs/components/select`（Select + SelectOption）
- `/zh/docs/components/checkbox`（Checkbox + CheckboxGroup）
- `/zh/docs/components/radio`（Radio + RadioGroup）
- `/zh/docs/components/switch`（Switch）
