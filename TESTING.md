# Testing TimeUI

TimeUI ships four layers of quality gates. Everything runs locally with the same
commands CI uses.

| Layer                   | Runner                   | Scope                                       |
| ----------------------- | ------------------------ | ------------------------------------------- |
| Unit / integration      | Vitest + Testing Library | Per-component, inside `packages/components` |
| Accessibility           | `vitest-axe` + axe-core  | Called from unit tests via `expectA11y`     |
| E2E smoke               | Playwright               | Boots built Storybook, navigates stories    |
| Visual regression       | Chromatic (primary)      | Every story on every PR                     |
| Interaction + a11y scan | `@storybook/test-runner` | Story `play` functions + axe per story      |

---

## Unit tests

```bash
pnpm --filter @timeui/react test              # run once
pnpm --filter @timeui/react test:watch        # watch mode
pnpm --filter @timeui/react test:coverage     # with v8 coverage
```

Coverage thresholds (configured in `packages/components/vitest.config.ts`):

- lines / functions / statements: **85%**
- branches: **80%**

Reports are emitted as `text` (stdout), `html` (`coverage/index.html`), and
`lcov` (`coverage/lcov.info`) — the last is uploaded to Codecov in CI.

### Writing a component test

Always render through `renderWithProviders` from `@timeui/react/test-utils`
so the component sees the same `ConfigProvider` + `ThemeProvider` stack that
consumers use:

```tsx
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@timeui/react/test-utils';
import { screen } from '@testing-library/react';
import { Widget } from './Widget';

describe('Widget', () => {
  it('renders in dark theme', () => {
    renderWithProviders(<Widget label="Hi" />, { theme: 'dark' });
    expect(screen.getByText('Hi')).toBeInTheDocument();
  });
});
```

Options: `{ theme?: TimeUITheme | 'light' | 'dark', config?: Partial<TimeUIConfig> }`
plus all normal Testing Library `RenderOptions` (except `wrapper`).

### Accessibility checks

`expectA11y(container)` wraps axe-core. Call it at the end of any render:

```tsx
import { renderWithProviders, expectA11y } from '@timeui/react/test-utils';

it('is accessible', async () => {
  const { container } = renderWithProviders(<Widget label="Hi" />);
  await expectA11y(container);
});
```

See `packages/components/src/Button/Button.a11y.test.tsx` for a working
example. Every component should ship at least one a11y test.

---

## E2E (Playwright)

```bash
# 1. Build Storybook once
pnpm --filter @timeui/docs build

# 2. Run the suite (playwright.config spins up http-server automatically)
pnpm --filter @timeui/docs test:e2e
```

The smoke suite (`apps/docs/e2e/`) boots the **built** Storybook
(`storybook-static/`) via `http-server` on port 6006, navigates to the Button
story iframe, and runs `@axe-core/playwright` against the rendered markup.

Reports land in `apps/docs/playwright-report/`.

---

## Storybook interaction + a11y tests

```bash
# Terminal 1: serve Storybook
pnpm --filter @timeui/docs dev

# Terminal 2: run the test-runner against it
pnpm --filter @timeui/docs test:storybook
```

Configured in `apps/docs/.storybook/test-runner.ts`:

- Executes every story's `play` function as an interaction test.
- Runs axe-core (`#storybook-root`) per story for WCAG 2 A/AA.
- Opt out per-story with `parameters: { a11y: { disable: true } }`.

---

## Visual regression (Chromatic — recommended)

Chromatic is the canonical visual regression service.

```bash
pnpm --filter @timeui/docs chromatic
```

On CI, `.github/workflows/chromatic.yml` builds Storybook on every PR and
uploads it. Reviewers approve visual diffs in the Chromatic UI; PRs are
blocked until changes are acknowledged.

### Required secret

Add `CHROMATIC_PROJECT_TOKEN` in **Repo → Settings → Secrets → Actions**.
Grab it from your Chromatic project (`Manage → Configure`).

Codecov uploads also require `CODECOV_TOKEN` for private repos.

### Playwright screenshot fallback

If Chromatic is unavailable, Playwright's `toHaveScreenshot()` can be used
with a `visual.spec.ts` that iterates stories. This is **not** the preferred
path — prefer Chromatic.

---

## CI pipeline

`.github/workflows/ci.yml` runs on every PR:

1. `verify` — lint, typecheck, unit tests + coverage (uploaded to Codecov),
   build, Storybook build (artifact).
2. `e2e` — downloads the Storybook artifact, runs Playwright.
3. `size` — enforces `size-limit` budgets from `packages/components/package.json`
   (main bundle **< 80 KB gzipped**).

`.github/workflows/chromatic.yml` runs in parallel and publishes to Chromatic.

---

## Required secrets

| Secret                    | Used by          | Required                              |
| ------------------------- | ---------------- | ------------------------------------- |
| `CHROMATIC_PROJECT_TOKEN` | Chromatic action | Yes (visual regression)               |
| `CODECOV_TOKEN`           | Codecov action   | Private repos / authoritative uploads |
