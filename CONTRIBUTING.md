# 贡献指南

感谢你考虑为 TimeUI 贡献。TimeUI 定位企业级组件库，我们对质量把关较严。

如果还没熟悉本地开发环境，请先阅读 [`docs/guides/development.md`](./docs/guides/development.md)。

## RFC 流程

以下情况**必须走 RFC**：

- 新增公开组件（非显而易见的小增补）
- 破坏性 API 变更
- 跨包 / 跨主题系统的设计决策（token、可访问性契约、布局原语）

步骤：

1. 用 **"RFC"** Issue 模板描述：问题、先例、拟议 API、备选方案、迁移策略。
2. 如有可行的 mockup / 原型，贴链接。
3. 核心维护者给 RFC 打标签开启讨论；接受后打 `rfc:accepted`。
4. 实现 PR 在描述里引用 RFC Issue。

小改动（单一 variant、单一 prop）若明显向后兼容，可以跳过 RFC。

完整 RFC 生命周期见 [`docs/guides/governance.md`](./docs/guides/governance.md)。

## 组件质量清单

每一个组件 PR 在合并前必须满足：

- [ ] TypeScript strict，不使用 `any`，props 通过 JSDoc 完整记录。
- [ ] 若包 DOM 节点则 `forwardRef`。
- [ ] 有状态的组件支持受控 + 非受控两种模式。
- [ ] 样式通过 Emotion `css` prop + `useTheme()` 消费 theme token；**禁止**硬编码颜色/间距。
- [ ] 在 `lightTheme` 与 `darkTheme` 下表现均正常（含 WCAG AA 对比度）。
- [ ] 动画遵循 `prefers-reduced-motion`。
- [ ] 可访问性：
  - [ ] 正确的 ARIA role / attribute
  - [ ] 可键盘操作，`focus-visible` 有可见焦点样式
  - [ ] 至少跑过一次屏幕阅读器手测
  - [ ] axe-core 零违规（`expectA11y()`）
- [ ] Vitest 测试覆盖：渲染、variant、交互、a11y 基线；覆盖率 lines/fn/stmt ≥ 85%、branch ≥ 80%（CI 强制）。
- [ ] 组件从 `@timeui/react` barrel 导出（重依赖组件改走 subpath export，避免膨胀主 bundle）。
- [ ] 文档站的 MDX 页面同步更新（`apps/docs/src/app/[locale]/docs/components/<name>/` 下 `zh.mdx` + `en.mdx` + `page.tsx`），双语章节结构一一对应（不能只交付 zh 或只交付 en）。
- [ ] 每个 variant / size / state 提供独立的 `<LivePlayground>` 可编辑示例，且站点上展示效果与代码完全一致（不允许截图或伪代码）。
- [ ] 改完 MDX 后必须重建 MCP 索引：`pnpm --filter @timeui/mcp build:index`，否则 AI 客户端拿到的是旧数据。
- [ ] `pnpm size` 通过，主 bundle 总预算 80 KB gzipped 不超标。
- [ ] `pnpm changeset` 写了一条条目（新组件 `minor`）。
- [ ] 不新增 `dependencies`，除非维护者同意；能放 `peerDependencies` 就放。

## 提交规范

[Conventional Commits](https://www.conventionalcommits.org/)，由 commitlint + Husky 强制。示例：

```
feat(button): 新增 loading 状态
fix(select): 禁用项不再触发 focus trap
docs(theme): 补充 module augmentation 说明
chore(deps): 升级 emotion 到 11.13
```

提交时 lint-staged 会对 `*.{ts,tsx,js,jsx}` 自动跑 `eslint --fix` + Prettier。

## 发版

版本号由 Changesets 管理。`main` 合并后会由 bot 开 "Version Packages" PR，合并即触发 npm 发布。**不要手动 `npm publish`。** 细节见 [`docs/guides/releasing.md`](./docs/guides/releasing.md)。

## 行为准则

请保持专业、友善。对技术方案可以严苛，但对人永远尊重。
