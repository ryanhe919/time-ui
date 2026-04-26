# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

TimeUI 是一个企业级 React 组件库，以 pnpm workspaces + Turborepo 组织的 monorepo，发布到 npm `@timeui/*` 作用域下。技术栈：React 18+（peerDependency）、TypeScript strict、Emotion、tsup（ESM+CJS+d.ts）、Vitest、Next.js 15 App Router + MDX 文档站、Vite playground、Changesets。

## 常用命令

```bash
pnpm dev                              # 并行启动 playground (Vite) + docs (Next.js dev)
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
pnpm --filter @timeui/react test:coverage        # v8 覆盖率（CI 上传到 Codecov）
pnpm --filter @timeui/react test -- Button       # 只跑匹配的测试文件（传给 vitest）
pnpm --filter @timeui/docs dev                   # 文档站 dev http://localhost:3000
pnpm --filter @timeui/docs build                 # next build（产物 .next/）
pnpm --filter @timeui/playground dev             # Vite playground，手动验证组件
pnpm --filter @timeui/icons generate             # 从 svg/ 重新生成图标组件
pnpm --filter @timeui/mcp build:index            # 扫 docs MDX 重建 data/index.json
pnpm --filter @timeui/mcp test                   # MCP 包单元测试
pnpm changeset:snapshot                          # 发 canary 预览版
```

> 当前没有 Storybook、Chromatic、Playwright e2e。视觉验证靠 docs 站 + playground 在浏览器里手测。

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
- `@timeui/react`（即 `packages/components`）：发布入口，聚合导出；组件统一用 `@emotion/react` 的 `css={...}` prop + `useTheme()` 消费 theme token（不用 `@emotion/styled`），禁止硬编码颜色/间距。文件顶部需要 `/** @jsxImportSource @emotion/react */` pragma。

### 构建与测试链

- 每个包由 tsup 独立构建 ESM+CJS+d.ts；Turbo `build` 与 `typecheck`/`test` 都声明 `dependsOn: ["^build"]`，因此 Vitest 若解析不到 `@timeui/*` 需先 `pnpm build` 一次（或依赖 `tsconfig.base.json` 的 `paths` 映射）。
- 组件测试统一通过 `renderWithProviders`（来自 `@timeui/react/test-utils`）渲染，以保证使用的是与终端消费者一致的 `ConfigProvider` + `ThemeProvider` 栈；可用 `{ theme: 'light' | 'dark' }` 切换主题。
- 可访问性用 `expectA11y(container)`（封装 axe-core）；每个组件至少一条 a11y 测试。
- 文档站是 Next.js 15 App Router + MDX。每个组件页是双语 MDX 对：`apps/docs/src/app/[locale]/docs/components/<name>/{en,zh}.mdx`，`[locale]` 由 middleware 路由到 `zh` / `en`。
- CI（`.github/workflows/ci.yml`）分两 job：**verify**（lint + typecheck + `@timeui/react` test:coverage + 包构建 + docs 构建，覆盖率上 Codecov）、**size**（size-limit 预算校验）。release/docs 部署/安全审计是独立 workflow（`release.yml`、`deploy-docs.yml`、`security-audit.yml`）。

### 添加组件

1. `pnpm new:component MyThing`：在 `packages/components/src/MyThing/` 下生成源文件、单元测试、a11y 测试，并自动 append 到 `src/index.ts` 的 barrel 导出。
   > **已知坑**：脚手架仍会生成一个 `MyThing.stories.tsx`（@storybook/react 模板），但仓库已不再使用 Storybook 也没有 `.storybook` 配置——这个文件可以直接删掉，不会影响构建。
2. `css={...}` prop + `useTheme()` 读 token（不要硬编码色彩/间距），同时覆盖 `lightTheme` 与 `darkTheme`。
3. 满足 CONTRIBUTING.md 的质量清单：forwardRef（若包裹 DOM）、controlled/uncontrolled 双支持、ARIA/键盘可达、axe 零违规、支持 `prefers-reduced-motion`。
4. 新增双语 MDX 文档：`apps/docs/src/app/[locale]/docs/components/<my-thing>/{en,zh}.mdx`，覆盖所有 variant/size/state；同步更新 navigation 配置（参考相邻组件目录结构）。
5. 重建 MCP 索引：`pnpm --filter @timeui/mcp build:index`（MDX 结构变化后必跑，否则 MCP 客户端拿到的是旧索引）。
6. `pnpm changeset`：新组件用 `minor`，bugfix 用 `patch`，破坏性改动用 `major`；chore/docs/test/重构一般不需要 changeset。
7. 如果新组件用到了重依赖（markdown 解析器、代码高亮等），考虑做成独立 subpath export（参考 `@timeui/react/code-block` 和 `@timeui/react/chat-markdown`），避免膨胀主 bundle。

### 发布

不要手动 `npm publish`。合并到 `main` 后 changesets bot 会开一个 "Version Packages" PR，合并它即由 `.github/workflows/release.yml` 构建并发布。canary 预览版用 `pnpm changeset:snapshot`（带 `canary` dist-tag）。

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
- 文档站找不到新组件：除了 `packages/components/src/index.ts` 的 barrel，还要在 `apps/docs/src/app/[locale]/docs/components/<name>/{en,zh}.mdx` 加文档并更新 navigation；改完 MDX 记得跑 `pnpm --filter @timeui/mcp build:index`。
- ESLint 用的是 flat config（`eslint.config.js`），编辑器需开启 `eslint.useFlatConfig: true`。
- 受 token 影响的视觉变化没法靠测试发现（无 Chromatic）：改 `packages/tokens` 或 `packages/themes` 后，至少在 `pnpm dev` 起的 docs/playground 里手动眼检几个典型组件。
