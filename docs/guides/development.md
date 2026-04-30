# 开发指南

面向 TimeUI 贡献者的本地开发手册。

## 环境要求

- **Node 22 LTS**（仓库根的 `.nvmrc` 已锁定，`nvm use` 会自动切换）。
- **pnpm 9+**（推荐 `corepack enable`，锁版来自 `package.json#packageManager`）。
- Git。

## 首次启动

```sh
git clone git@github.com:timeui/timeui.git
cd timeui
nvm use
pnpm install
cp -r .vscode-template .vscode   # 可选：推荐的编辑器配置
```

## 仓库结构

```
timeui/
├── apps/
│   └── docs/                  Next.js 15 App Router + @next/mdx 文档站
├── packages/
│   ├── tokens/                @timeui/tokens — 设计 token（色板、spacing、字体、radius、shadow）
│   ├── themes/                @timeui/themes — light/dark 主题，由 tokens 组合而成
│   ├── core/                  @timeui/core   — ConfigProvider / ThemeProvider / i18n hook
│   ├── utils/                 @timeui/utils  — 框架无关的工具函数
│   ├── components/            @timeui/react  — 发布入口，聚合导出所有组件
│   └── icons/                 @timeui/icons  — SVGR 图标（叶子包）
├── tools/
│   └── create-component/      私有脚手架（`pnpm new:component Foo`）
├── docs/                      项目长文档（本目录）
├── .changeset/                待发布的 changeset
└── .github/                   CI / release / deploy-docs / issue 模板 / CODEOWNERS
```

依赖方向严格单向：`tokens → themes → core → components`。`utils` 与 `icons` 是叶子。`packages/` 禁止从 `apps/` 引用。

## 日常命令

| 任务                                  | 命令                                         |
| ------------------------------------- | -------------------------------------------- |
| 启动 docs                             | `pnpm dev`                                   |
| 运行所有包的测试                      | `pnpm test`                                  |
| 单包测试                              | `pnpm --filter @timeui/react test`           |
| 单测试文件                            | `pnpm --filter @timeui/react test -- Button` |
| 覆盖率报告                            | `pnpm --filter @timeui/react test:coverage`  |
| Lint / Typecheck                      | `pnpm lint` / `pnpm typecheck`               |
| Prettier 一次性写入                   | `pnpm format`                                |
| 构建所有包                            | `pnpm build`                                 |
| Size 预算校验                         | `pnpm size`                                  |
| 脚手架生成组件                        | `pnpm new:component Drawer`                  |
| 添加 changeset                        | `pnpm changeset`                             |
| 发 canary                             | `pnpm changeset:snapshot`                    |
| 单独构建文档站                        | `pnpm --filter @timeui/docs build`           |
| 从 `packages/icons/svg/` 重新生成图标 | `pnpm --filter @timeui/icons generate`       |

## 新增一个组件

1. `pnpm new:component MyThing` — 脚手架会生成源码、测试、导出，并写入 barrel。
2. 使用 Emotion 的 `css` prop + `useTheme()` 消费 theme token，**禁止硬编码色值/间距**。同时覆盖 `lightTheme` 与 `darkTheme`。
3. 必须：forwardRef（若包 DOM 节点）、受控/非受控双支持（有状态组件）、ARIA、键盘可达、axe 零违规、`prefers-reduced-motion`。
4. 在 `apps/docs/src/app/[locale]/docs/components/my-thing/` 下写一份 MDX 文档（`zh.mdx` + `en.mdx` + `page.tsx`）。
5. 运行 `pnpm changeset` —— 新组件用 `minor`。

## 新增一个图标

1. 把 24×24 的 SVG 放进 `packages/icons/svg/`，颜色用 `currentColor`，线宽 `stroke-width="2"`。
2. `pnpm --filter @timeui/icons generate`。
3. 同时提交 SVG、生成的组件与 barrel 文件。

## 文档站本地开发

```sh
pnpm --filter @timeui/docs dev      # http://localhost:3000
```

文档站基于 **Next.js 15 App Router + @next/mdx**（没有用 Storybook）。组件 demo 通过 `apps/docs/src/components/timeui-client.tsx` 的 `'use client'` 边界桥接到 MDX。MDX 注入的组件列表见 `apps/docs/src/mdx-components.tsx`。

路由为 `/{locale}/docs/...`，`middleware.ts` 会把根路径重定向到 `/zh/docs/...`。

## 常见故障排查

- **`pnpm install` 卡在 peer warnings** —— 确认 pnpm 版本 ≥ 9（`pnpm -v`）。
- **ESLint 在 VS Code 里找不到配置** —— 打开 `eslint.useFlatConfig: true`（`.vscode-template` 里已配），重载窗口。
- **Vitest 无法解析 `@timeui/*`** —— 先 `pnpm build` 一次让每个包生成 `dist/`，或依赖 `tsconfig.base.json` 里的 `paths` 映射。
- **Size budget 本地过、CI 不过** —— 清干净重跑：`pnpm clean && pnpm install && pnpm build && pnpm size`。
- **Changesets bot 没开 Version PR** —— 十有八九是没加 changeset。`pnpm changeset:status` 能告诉你当前有哪些待发布项。
- **文档站 "Multiple versions of React" 报错** —— 检查 `packages/components` 的 `peerDependencies` 是否把 `react` 放为 peer（不要把它装进 `dependencies`）。

## 提交规范

[Conventional Commits](https://www.conventionalcommits.org/)，由 commitlint + Husky 强制：

```
feat(button): 新增 loading 属性
fix(search): 避免禁用态仍触发 onClick
docs(button): 补充 loading 行为示意
chore(deps): 升级 emotion 到 11.13
```

## 发布

见 [releasing.md](./releasing.md)。
