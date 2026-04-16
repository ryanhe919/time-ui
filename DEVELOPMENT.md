# Developing TimeUI

## Prerequisites

- Node **22 LTS** (`nvm use` picks up `.nvmrc`)
- **pnpm 9+** (`corepack enable` if needed)
- Git

## First-time setup

```sh
git clone git@github.com:timeui/timeui.git
cd timeui
nvm use
pnpm install
cp -r .vscode-template .vscode   # optional: recommended editor config
```

## Architecture map

```
timeui/
├── apps/
│   └── docs/                  Storybook site + MDX docs + Playwright smoke tests
├── packages/
│   ├── tokens/                Design tokens (colors, spacing, typography)        — @timeui/tokens
│   ├── themes/                Light/dark themes composed from tokens             — @timeui/themes
│   ├── core/                  Providers (ConfigProvider, ThemeProvider), hooks  — @timeui/core
│   ├── utils/                 Framework-agnostic helpers                         — @timeui/utils
│   ├── components/            React components (Emotion styled)                  — @timeui/react
│   └── icons/                 SVGR-style tree-shakeable icon components          — @timeui/icons
├── tools/
│   └── create-component/      Private scaffolder (`pnpm new:component Foo`)
├── .changeset/                Pending release notes
├── .github/                   CI, release, issue + PR templates, CODEOWNERS
└── .vscode-template/          Recommended editor configs (copy to .vscode)
```

Dependency direction: `tokens → themes → core → components`. `utils` and `icons` are leaves. Nothing in `packages/` may import from `apps/`.

## Everyday workflows

| Task                                        | Command                                |
| ------------------------------------------- | -------------------------------------- |
| Start Storybook                             | `pnpm dev`                             |
| Run all tests                               | `pnpm test`                            |
| Run a single package's tests                | `pnpm --filter @timeui/react test`     |
| Lint / typecheck                            | `pnpm lint` / `pnpm typecheck`         |
| Format everything                           | `pnpm format`                          |
| Build all packages                          | `pnpm build`                           |
| Check bundle budgets                        | `pnpm size`                            |
| Scaffold a new component                    | `pnpm new:component Drawer`            |
| Regenerate icons from `packages/icons/svg/` | `pnpm --filter @timeui/icons generate` |
| Add a changeset                             | `pnpm changeset`                       |
| Ship a canary                               | `pnpm changeset:snapshot`              |

## Adding a component

1. `pnpm new:component MyThing` — generates source, types, tests, stories, and wires up the barrel export.
2. Fill in the component + stories. Emotion `styled` + theme tokens — no hard-coded colors.
3. Make sure the a11y smoke test passes and add role/keyboard assertions relevant to the pattern.
4. Write an MDX doc in `apps/docs` (Docs Agent owns the template).
5. `pnpm changeset` — `minor` for new components.

## Adding an icon

1. Drop a 24×24 SVG into `packages/icons/svg/` using `currentColor` and `stroke-width="2"`.
2. `pnpm --filter @timeui/icons generate`.
3. Commit both the SVG and the regenerated component + barrel.

## Troubleshooting

- **`pnpm install` hangs on peer warnings** — ensure you're on pnpm 9+ (`pnpm -v`).
- **ESLint flat-config errors in VS Code** — confirm `eslint.useFlatConfig: true` (already in the template settings) and reload the window.
- **Vitest can't resolve `@timeui/*`** — run `pnpm build` once so workspace `dist/` exists, or rely on the `paths` mapping in `tsconfig.base.json`.
- **Storybook misses a new component** — ensure `export * from './MyThing'` is in `packages/components/src/index.ts` (the scaffolder does this automatically).
- **Size budget fails in CI but not locally** — rebuild from clean: `pnpm clean && pnpm install && pnpm build && pnpm size`.
- **Changeset bot didn't open a Version PR** — you probably didn't add a changeset. `pnpm changeset:status` tells you what's pending.

## Commit conventions

Conventional commits, enforced by commitlint + Husky:

```
feat(components): add Drawer
fix(tokens): correct spacing.4 rem value
docs(button): clarify loading behavior
chore(deps): bump emotion to 11.13
```

## Releases

See `RELEASING.md`.
