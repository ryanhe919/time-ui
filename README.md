# TimeUI

Enterprise-grade React component library. Published to npm under the `@timeui/*` scope.

## Monorepo layout

```
packages/
  tokens/      @timeui/tokens   — design tokens (colors, spacing, typography, radius, shadows)
  themes/      @timeui/themes   — light/dark themes + Emotion module augmentation
  utils/       @timeui/utils    — pure utility functions
  icons/       @timeui/icons    — icon library (placeholder)
  core/        @timeui/core     — shared hooks & providers (ConfigProvider, ThemeProvider)
  components/  @timeui/react    — umbrella component package (published entry)
apps/
  docs/        Storybook 8 documentation site
  playground/  Vite sandbox for local development
```

## Tech stack

- pnpm workspaces + Turborepo
- React 18+ (peer dependency `react >=18`), TypeScript strict
- Emotion (`@emotion/react`, `@emotion/styled`) for styling
- tsup for ESM + CJS + d.ts builds
- Vitest + @testing-library/react for unit tests
- Storybook 8 for docs
- Changesets for versioning/publishing
- ESLint (flat) + Prettier + Stylelint + Husky + lint-staged + commitlint

## Getting started

```bash
pnpm install
pnpm dev           # runs playground + docs in watch mode
pnpm build         # builds every package
pnpm test          # runs Vitest across packages
pnpm lint          # ESLint across the workspace
pnpm typecheck     # TypeScript noEmit across packages
```

## Adding a component

1. Create `packages/components/src/<ComponentName>/<ComponentName>.tsx`.
2. Add a sibling `<ComponentName>.test.tsx`.
3. Re-export from `packages/components/src/<ComponentName>/index.ts`, then from `packages/components/src/index.ts`.
4. Add a `stories/<ComponentName>.stories.tsx` in `apps/docs`.
5. Run `pnpm changeset` to record a version bump before you merge.

See `CONTRIBUTING.md` for the component quality bar and RFC process.

## Testing

Full guide: [`TESTING.md`](./TESTING.md). Covers unit + coverage, a11y
(`vitest-axe`), Playwright E2E against built Storybook, `@storybook/test-runner`
interaction tests, and Chromatic visual regression.

### Required CI secrets

| Secret                    | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| `CHROMATIC_PROJECT_TOKEN` | Publishes Storybook to Chromatic on every PR   |
| `CODECOV_TOKEN`           | Authenticated coverage uploads (private repos) |

## License

MIT (c) TimeUI contributors.
