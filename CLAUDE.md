# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

TimeUI 是一个企业级 React 组件库，以 pnpm workspaces + Turborepo 组织的 monorepo，发布到 npm `@timeui/*` 作用域下。技术栈：React 18+（peerDependency）、TypeScript strict、Emotion、tsup（ESM+CJS+d.ts）、Vitest、Storybook 8、Changesets。

## 常用命令

```bash
pnpm dev                              # 并行启动 playground + docs（Storybook）
pnpm build                            # 构建所有包（Turbo 按依赖图顺序）
pnpm test                             # 跨包运行 Vitest
pnpm lint                             # ESLint（flat config）
pnpm typecheck                        # tsc --noEmit
pnpm format                           # Prettier 写入
pnpm size                             # size-limit 预算校验
pnpm new:component Drawer             # 通过 tools/create-component 脚手架生成组件
pnpm changeset                        # 记录发版变更（合并前必须）
```

单包 / 单测试操作（通过 pnpm filter）：

```bash
pnpm --filter @timeui/react test                 # 组件包单元测试
pnpm --filter @timeui/react test:watch           # watch
pnpm --filter @timeui/react test:coverage        # v8 覆盖率（阈值 lines/fn/stmt 85%，branch 80%）
pnpm --filter @timeui/react test -- Button       # 只跑匹配的测试文件（传给 vitest）
pnpm --filter @timeui/docs build                 # 构建 Storybook（storybook-static/）
pnpm --filter @timeui/docs test:e2e              # Playwright 针对已构建的 Storybook
pnpm --filter @timeui/docs test:storybook        # @storybook/test-runner（play + axe）
pnpm --filter @timeui/docs chromatic             # 视觉回归（主路径）
pnpm --filter @timeui/icons generate             # 从 svg/ 重新生成图标组件
pnpm --filter @timeui/mcp build:index            # 重建 docs 索引 JSON
pnpm --filter @timeui/mcp test                   # MCP 包单元测试
pnpm changeset:snapshot                          # 发 canary 预览版
```

## 架构

### 包依赖方向（严格单向）

```
tokens → themes → core → components
utils、icons、mcp 为叶子包
packages/ 禁止从 apps/ 引用
```

> 特例：`@timeui/mcp` 的 `scripts/build-index.ts` 在**构建期**通过相对路径读取 `apps/docs` 的 navigation / i18n 生成 `data/index.json`。这只是构建产物的数据源，运行时包本身不 import `apps/docs`，也不依赖任何 `@timeui/*` 包。

- `@timeui/tokens`：设计 token（颜色、spacing、字体、圆角、阴影），纯数据。
- `@timeui/themes`：由 tokens 组合出 `lightTheme` / `darkTheme`，并对 Emotion 做 module augmentation（`DefaultTheme`）。
- `@timeui/core`：共享 `ConfigProvider` / `ThemeProvider` 与 hooks；所有组件都假设外层存在这两个 Provider。
- `@timeui/utils`：框架无关纯函数。
- `@timeui/icons`：树摇友好的 SVGR 风格图标，由 `svg/` 目录生成。
- `@timeui/react`（即 `packages/components`）：发布入口，聚合导出；组件用 Emotion `styled` 消费 theme token，禁止硬编码颜色/间距。

### 构建与测试链

- 每个包由 tsup 独立构建 ESM+CJS+d.ts；Turbo `build` 与 `typecheck`/`test` 都声明 `dependsOn: ["^build"]`，因此 Vitest 若解析不到 `@timeui/*` 需先 `pnpm build` 一次（或依赖 `tsconfig.base.json` 的 `paths` 映射）。
- 组件测试统一通过 `renderWithProviders`（来自 `@timeui/react/test-utils`）渲染，以保证使用的是与终端消费者一致的 `ConfigProvider` + `ThemeProvider` 栈；可用 `{ theme: 'light' | 'dark' }` 切换主题。
- 可访问性用 `expectA11y(container)`（封装 axe-core）；每个组件至少一条 a11y 测试。
- E2E 针对 **已构建** 的 Storybook（`storybook-static/`）经 `http-server` 6006 端口启动，位于 `apps/docs/e2e/`。
- CI（`.github/workflows/ci.yml`）分三 job：verify（lint+typecheck+单测+构建）、e2e（下载 Storybook artifact 跑 Playwright）、size（组件主包 gzipped < 80 KB）。Chromatic 在独立 workflow 并行发布。

### 添加组件

1. `pnpm new:component MyThing`：会生成源文件、测试、story 并接入 barrel 导出。
2. Emotion `styled` + theme token（不要硬编码色彩/间距），同时覆盖 `lightTheme` 与 `darkTheme`。
3. 满足 CONTRIBUTING.md 的质量清单：forwardRef（若包裹 DOM）、controlled/uncontrolled 双支持、ARIA/键盘可达、axe 零违规、支持 `prefers-reduced-motion`。
4. 新增 story（`apps/docs`）覆盖所有 variant/size/state。
5. `pnpm changeset`：新组件用 `minor`，bugfix 用 `patch`，破坏性改动用 `major`；chore/docs/test/重构一般不需要 changeset。
6. 如果新组件用到了重依赖（markdown 解析器、代码高亮等），考虑做成独立 subpath export（参考 `@timeui/react/code-block` 和 `@timeui/react/chat-markdown`），避免膨胀主 bundle。

### 发布

不要手动 `npm publish`。合并到 `main` 后 changesets bot 会开一个 "Version Packages" PR，合并它即由 `.github/workflows/release.yml` 构建并发布。canary/hotfix 流程见 `RELEASING.md`。

### 提交规范

Conventional Commits，由 commitlint + Husky + lint-staged 强制（`*.{ts,tsx,js,jsx}` 会走 `eslint --fix` + Prettier）。例：`feat(button): add loading state`、`fix(select): prevent focus trap on disabled options`。

### AI / MCP 集成

- `@timeui/mcp` 是独立 npm 包，对 AI 客户端（Claude Code / Cursor 等）暴露组件文档查询工具：`list_categories` / `list_components` / `get_component` / `search_components`。
- 数据源：`scripts/build-index.ts` 扫描 `apps/docs/.../components/**/*.mdx` 生成 `data/index.json`（31 组件 × 7 分类 × 2 locale），因此 MCP 包构建期与 docs 站 MDX 结构耦合。
- 两种 transport：`timeui-mcp`（stdio，用于 IDE/CLI 客户端）与 `timeui-mcp-http`（Streamable HTTP，默认 `127.0.0.1:3333`）。
- `apps/docs` 内置 AI 助手：`src/app/api/assistant/route.ts` 通过 `@anthropic-ai/sdk` + 自定义 `baseURL` 接 MiniMax / Claude（环境变量 `ANTHROPIC_BASE_URL` / `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL`），SSE 流式 + tool calling loop。凭据模板见 `apps/docs/.env.example`。
- 助手 UI 使用 Chat 组件族 + `@timeui/react/chat-markdown` 做流式 markdown 渲染。`chat-markdown` 是独立 subpath export，`react-markdown` / `remark-gfm` 是 optional peerDep，不打进主 bundle。

## 常见陷阱

- Vitest 报 `@timeui/*` 解析失败：先执行一次 `pnpm build`。
- Size budget 本地过 CI 不过：`pnpm clean && pnpm install && pnpm build && pnpm size` 重新跑。
- Storybook 找不到新组件：确认 `packages/components/src/index.ts` 有 `export * from './MyThing'`（脚手架会自动加）。
- ESLint 用的是 flat config（`eslint.config.js`），编辑器需开启 `eslint.useFlatConfig: true`。
