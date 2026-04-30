# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

TimeUI 是一个企业级 React 组件库，以 pnpm workspaces + Turborepo 组织的 monorepo，发布到 npm `@timeui/*` 作用域下。技术栈：React 18+（peerDependency）、TypeScript strict、Emotion、tsup（ESM+CJS+d.ts）、Vitest、Next.js 15 App Router + MDX 文档站、Changesets。

> **项目长文档**：本文件提供高密度速查；下列长文档在对应主题上更全面，遇到细节问题先去这里查：
>
> - [`docs/guides/development.md`](./docs/guides/development.md) — 本地开发环境、调试、依赖管理
> - [`docs/guides/testing.md`](./docs/guides/testing.md) — Vitest 配置、`renderWithProviders` / `expectA11y` 用法、覆盖率门禁解释
> - [`docs/guides/theming.md`](./docs/guides/theming.md) — token / theme 体系、Emotion module augmentation、暗色主题对比度调校
> - [`docs/guides/releasing.md`](./docs/guides/releasing.md) — Changesets 流程、canary、回滚策略
> - [`docs/guides/governance.md`](./docs/guides/governance.md) — RFC 流程、维护者职责、行为准则
> - [`CONTRIBUTING.md`](./CONTRIBUTING.md) — 组件 PR 质量清单（forwardRef / 受控双支持 / a11y / size / changeset 等强制项）

## 常用命令

```bash
pnpm dev                              # 启动 docs (Next.js dev)
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
pnpm --filter @timeui/icons generate             # 从 svg/ 重新生成图标组件
pnpm --filter @timeui/mcp build:index            # 扫 docs MDX 重建 data/index.json
pnpm --filter @timeui/mcp test                   # MCP 包单元测试
pnpm changeset:snapshot                          # 发 canary 预览版
```

> 当前没有 Storybook、Chromatic、Playwright e2e。视觉验证靠 docs 站（含每个组件页的 LiveDemo 可编辑预览）在浏览器里手测。

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

> **推荐**：直接用 `/new-component` skill，会调起 component-architect → engineer × N → tester × N → docs-author → release-engineer 的完整 Agent Team 流程。下面的手动步骤是底层动作，仅在你**确定要绕开 team 流程**（如临时小改、紧急修补）时使用。

1. `pnpm new:component MyThing`：在 `packages/components/src/MyThing/` 下生成源文件、单元测试、a11y 测试，并自动 append 到 `src/index.ts` 的 barrel 导出。
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
- 数据源：`scripts/build-index.ts` 扫描 `apps/docs/.../components/**/*.mdx` 生成 `data/index.json`（39 组件 × 7 分类 × 2 locale），因此 MCP 包构建期与 docs 站 MDX 结构耦合。
- 两种 transport：`timeui-mcp`（stdio，用于 IDE/CLI 客户端）与 `timeui-mcp-http`（Streamable HTTP，默认 `127.0.0.1:3333`）。
- `apps/docs` 内置 AI 助手：`src/app/api/assistant/route.ts` 通过 `@anthropic-ai/sdk` + 自定义 `baseURL` 接 MiniMax / Claude（环境变量 `ANTHROPIC_BASE_URL` / `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL`），SSE 流式 + tool calling loop。凭据模板见 `apps/docs/.env.example`。
- 助手 UI 使用 Chat 组件族 + `@timeui/react/chat-markdown` 做流式 markdown 渲染。`chat-markdown` 是独立 subpath export，`react-markdown` / `remark-gfm` 是 optional peerDep，不打进主 bundle。

## 团队协作（Skills / Agents / Teammates）

本仓库为常见组件库工作流配置了**项目级 Skill + Agent**。当用户提需求时，主 Claude（tech-lead）应该按下面对照表选择正确的入口，而不是自己埋头写代码。

### Skills（用户可用 `/<name>` 触发，主 Claude 也可主动调）

| Skill                | 何时用                                                                        | 流程                                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/new-component`     | 新增 ≥ 1 个组件，要走完整流程；用户提"组个团队做 X"、"按规范走一遍"、"端到端" | 起 TeamCreate → architect 写 spec → engineer×N 实现 → tester×N 测试 → docs-author 文档 → release-engineer 发布预检 → TeamDelete 清场 |
| `/component-design`  | 用户只想先要 spec，不开工                                                     | 一次性 spawn component-architect 产出 `.claude/team-docs/<feature>-spec.md`                                                          |
| `/update-docs`       | 已有组件文档缺失/过时，单独补文档                                             | 调起 docs-author + 强制重建 MCP 索引                                                                                                 |
| `/update-mcp`        | docs MDX / navigation 改了之后；MCP 客户端拿到旧数据                          | `pnpm --filter @timeui/mcp build:index` + 单测                                                                                       |
| `/release-component` | 实现+测试+文档完成后准备进 release PR                                         | 调起 release-engineer 跑 build/lint/typecheck/coverage/size/MCP/changeset 7 步门禁                                                   |

### Agents（在 `.claude/agents/`，作为 `subagent_type` 调用；多数会作为持久 teammate 通过 TeamCreate + Agent(team_name=, name=) 加入团队）

| Agent                      | 角色                                               | 你的输入                     | 它的输出                                                                                               |
| -------------------------- | -------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| `component-architect`      | 需求分析 + UI/UX 架构师                            | 用户原始需求、要做的组件清单 | `.claude/team-docs/<feature>-spec.md`（含 props/视觉/行为/a11y/测试要点/token 清单/任务切分/冲突防护） |
| `component-engineer`       | 实现工程师（可多实例并行）                         | spec 路径 + 它负责的组件     | `packages/components/src/<Name>/{<Name>.tsx, <Name>.types.ts, index.ts}` + barrel append               |
| `component-tester`         | 测试工程师（可多实例并行）                         | spec 路径 + 已实现的组件     | `__tests__/<Name>.test.tsx` + `<Name>.a11y.test.tsx`，覆盖率 ≥ 85/85/85/80                             |
| `docs-author`              | 双语 MDX + LivePlayground 文档工程师（建议单实例） | 已实现并测过的组件 + spec    | 双语 MDX + `page.tsx` + 更新 `navigation.ts`，并本地浏览器眼检                                         |
| `release-engineer`         | 发布预检（最后一棒）                               | 所有交付到位的组件清单       | build/lint/typecheck/test:coverage/size/MCP 索引/changeset 7 步全过                                    |
| `design-language-guardian` | 设计语言守门人（review-only，横切角色）            | spec 或实现路径              | 评审 markdown：✅ 合格 / 🟡 警告 / 🔴 阻断 / 📚 设计语言新发现                                         |

### 何时用持久 Team vs 何时一次性 Agent

**用 TeamCreate（持久 team）—— `/new-component` 内部已经这么做：**

- 同时新增 ≥ 2 个组件
- 用户用「团队 / team / 成员」字眼
- 多角色协调（架构 + 实现 + 测试 + 文档同时在线）
- 流程跨多轮（实现完先暂停评审，再决定是否进测试）

**用一次性 Agent —— 不要拉出整个 team：**

- 仅设计 spec（用 `/component-design`）
- 单独评审已有 spec/实现（`design-language-guardian`）
- 单独修文档（用 `/update-docs`）
- 独立调研、单步并行查询、只读分析

### tech-lead（你，主 Claude）的工作约定

1. **不下场写组件 / 测试 / MDX 实现**：你的角色是协调，不是替队友写代码。识别需求 → 选 skill → 派工 → 读汇报 → 协调冲突 → 提交 PR。
2. **遵守串行依赖**：spec 必须先就绪 → engineer 才能开工；实现合入 → tester 才能测；测试 + 文档全部到位 → release-engineer 才能跑门禁。
3. **共享文件冲突防护**：barrel `packages/components/src/index.ts` / `tokens/src/components.ts` / `navigation.ts` —— 让多实例工程师只追加新行，不改其它行；如果某文件需要重构，单独开一个 PR 由单人完成。
4. **Token 由谁改**：spec 阶段 architect 决定「需要新增哪些 token」；Day 1 由**单一**工程师在 tokens 包一次性加好（即使数值留占位），后续工程师**只读不写**。
5. **MCP 索引必须重建**：任何 MDX 改动都跟一个 `pnpm --filter @timeui/mcp build:index`；这是最常被遗忘的步骤。
6. **完工清场**：team 用完必 `TeamDelete`；先给每个 still-running 成员发 `SendMessage({ type: "shutdown_request" })` 再删 team。
7. **commit/push 由 tech-lead 做**：成员只交付文件，最终 commit 与 PR 描述由你统一写（保证消息风格统一、changeset 完整）。

### 何时**不**走团队流程（直接动手即可）

- 单文件 bug fix（typo、null check、CSS 漏边距等）
- 升级依赖、改 lint 配置
- 文档勘误（< 5 行）
- 仅给已有组件加一个示例（`/update-docs` 也能走，但太轻量也可以直接改）

## 常见陷阱

- Vitest 报 `@timeui/*` 解析失败：先执行一次 `pnpm build`。
- Size budget 本地过 CI 不过：`pnpm clean && pnpm install && pnpm build && pnpm size` 重新跑。
- 文档站找不到新组件：除了 `packages/components/src/index.ts` 的 barrel，还要在 `apps/docs/src/app/[locale]/docs/components/<name>/{en,zh}.mdx` 加文档并更新 navigation；改完 MDX 记得跑 `pnpm --filter @timeui/mcp build:index`。
- ESLint 用的是 flat config（`eslint.config.js`），编辑器需开启 `eslint.useFlatConfig: true`。
- 受 token 影响的视觉变化没法靠测试发现（无 Chromatic）：改 `packages/tokens` 或 `packages/themes` 后，至少在 `pnpm dev` 起的 docs 站里手动眼检几个典型组件。
