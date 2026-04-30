# TimeUI

企业级 React 组件库，发布到 npm 的 `@timeui/*` 作用域下。

- 🎨 设计语言对齐 HeroUI；WCAG AA 对比度
- 🌓 深 / 浅主题，基于 semantic token 的可定制主题
- 🌐 内置 i18n（默认中文，支持英文，按需扩展）
- 🧱 Emotion 的 `css` prop + `useTheme()`，**不用 `@emotion/styled`**
- 📦 tsup 同时输出 ESM / CJS / d.ts；`code-block` 独立 sub-entry，shiki 按需加载
- 🔒 React 18+ peer dependency（不把 react 锁进 dependencies）
- 🤖 内置 MCP server（`@timeui/mcp`）+ docs 站自带 AI 文档助手，接入 Anthropic 兼容 API（MiniMax / Claude）

## 仓库结构

```
packages/
  tokens/      @timeui/tokens   — 设计 token（颜色、spacing、字体、圆角、阴影）
  themes/      @timeui/themes   — light / dark 主题 + Emotion module augmentation
  core/        @timeui/core     — ConfigProvider / ThemeProvider / useI18n
  utils/       @timeui/utils    — 框架无关的纯函数
  icons/       @timeui/icons    — SVGR 图标（叶子包）
  components/  @timeui/react    — 发布入口，聚合所有组件
  mcp/         @timeui/mcp      — MCP server + 文档索引，供 AI 客户端查询组件
apps/
  docs/        Next.js 15 App Router + @next/mdx 的文档站（部署到 CentOS + pm2）
tools/
  create-component/  组件脚手架（pnpm new:component Foo）
docs/
  guides/      项目长文档（开发 / 测试 / 发版 / 治理 / 主题）
```

依赖方向严格单向：`tokens → themes → core → components`。`utils` 与 `icons` 为叶子。

## 技术栈

- pnpm workspaces + Turborepo
- React 18+（peer dependency）、TypeScript strict
- Emotion（`@emotion/react`）
- Next.js 15（文档站）
- tsup（构建）、Vitest（测试）、size-limit（预算）
- Changesets（版本 / 发布）
- ESLint flat config + Prettier + Stylelint + Husky + lint-staged + commitlint

## 快速开始

```bash
pnpm install
pnpm dev            # 启动 docs (Next.js dev)
pnpm build          # 构建所有包（按依赖图）
pnpm test           # 跨包 Vitest
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
```

## 新增组件

```bash
pnpm new:component Drawer
```

脚手架会生成源文件、测试、barrel 导出、并在文档站的目录里放入 MDX 模板。详见 [`docs/guides/development.md`](./docs/guides/development.md)。

## AI 集成

TimeUI 提供 MCP（Model Context Protocol）server，让 AI 客户端可以直接查询组件文档；文档站也内置了 AI 助手。

- **stdio MCP**（Claude Code / Cursor 等）：

  ```bash
  claude mcp add timeui -- npx -y @timeui/mcp timeui-mcp
  ```

- **Streamable HTTP**（默认监听 `127.0.0.1:3333`）：

  ```bash
  npx -y @timeui/mcp timeui-mcp-http --port 3333
  ```

- **站内 AI 助手**：在 `apps/docs/.env.local` 填好 MiniMax 凭据（参考 `apps/docs/.env.example`）后执行 `pnpm dev`，点击文档站 TopNav 右上的 ✨ 按钮即可打开。

完整工具列表（`list_categories` / `list_components` / `get_component` / `search_components`）与参数说明见 [`packages/mcp/README.md`](./packages/mcp/README.md)。

## 项目文档

| 文档                                                       | 内容                                          |
| ---------------------------------------------------------- | --------------------------------------------- |
| [docs/guides/development.md](./docs/guides/development.md) | 本地开发手册、常用命令、故障排查              |
| [docs/guides/testing.md](./docs/guides/testing.md)         | 测试、覆盖率阈值、CI 流水线、所需 secrets     |
| [docs/guides/releasing.md](./docs/guides/releasing.md)     | Changesets 工作流、canary、hotfix、npm token  |
| [docs/guides/governance.md](./docs/guides/governance.md)   | RFC 流程、团队、废弃策略                      |
| [docs/guides/theming.md](./docs/guides/theming.md)         | 主题体系、创建自定义主题、semantic token 速览 |
| [CONTRIBUTING.md](./CONTRIBUTING.md)                       | 贡献质量清单、提交规范                        |
| [SECURITY.md](./SECURITY.md)                               | 安全问题上报                                  |
| [CLAUDE.md](./CLAUDE.md)                                   | 给 Claude Code 的仓库指引                     |

## License

MIT (c) TimeUI contributors.
