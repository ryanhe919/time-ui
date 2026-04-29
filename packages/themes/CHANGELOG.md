# @timeui/themes

## 1.2.4

### Patch Changes

- 471b2b8: chore: align all published packages to a fresh patch version

  Coordinated patch bump across the entire `@timeui/*` surface. No
  behavioural changes — published purely to keep the workspace versions
  in lockstep.

- Updated dependencies [471b2b8]
  - @timeui/tokens@1.5.1

## 1.2.3

### Patch Changes

- Updated dependencies [dba5d6d]
  - @timeui/tokens@1.5.0

## 1.2.2

### Patch Changes

- 6383a70: Coordinate a patch bump across the remaining publishable packages. No user-facing code changes in these packages — version aligned with the `@timeui/react` minor release.
- Updated dependencies [6383a70]
  - @timeui/tokens@1.4.2

## 1.2.1

### Patch Changes

- Updated dependencies
  - @timeui/tokens@1.4.1

## 1.2.0

### Minor Changes

- ece0f77: Coordinated minor release across all TimeUI packages: aligns all packages on a shared minor-bump cadence and verifies the full monorepo on pnpm 10.33 + Node 22 toolchain.

### Patch Changes

- Updated dependencies [ece0f77]
  - @timeui/tokens@1.4.0

## 1.1.2

### Patch Changes

- Updated dependencies [0a3337c]
  - @timeui/tokens@1.3.0

## 1.1.1

### Patch Changes

- Updated dependencies [f032a76]
  - @timeui/tokens@1.2.0

## 1.1.0

### Minor Changes

- 32635c1: Release 1.1.0 — form-field visibility, Select usability, docs typography.

  **Components**
  - **fieldStyles** (Input / Textarea / Select): rebuilt the four variant
    recipes for stronger contrast on white and dark canvases — `flat` is now
    a soft tinted chip with a hairline edge, `bordered` uses `border.strong`
    instead of the near-invisible `border.default`, `faded` combines a
    tinted ground with the strong border (the loudest soft variant), and
    `underlined` gets a visible bottom rule. Hover and focus states scale
    with the new baseline.
  - **Select**: clicking the chevron, `startContent` slot, or the gap around
    the trigger now opens the dropdown. Wrapper-level `mousedown` is
    forwarded to the underlying `<button>`'s `click()` (Radix / HeroUI parity).

  **Docs**
  - New Typography and Layout component pages (zh / en).
  - Sidebar groups Components by category (`general` / `forms`) via a new
    `NavGroup` shape; i18n captions added.
  - LiveDemo preview boundary now resets the `mdx-article` heading cascade,
    so `<Heading level={1..6}/>` rendered inside a demo keeps its own
    emotion styles instead of inheriting the editorial recipes.
  - mdx-article H4 / H5 / H6 hierarchy filled in with a coherent gradient.

  **Internal**
  - `turbo.json`: `test` and `typecheck` no longer declare stale `outputs`;
    coverage moved to a dedicated `test:coverage` task.
  - New unit tests: `utils/{fieldStyles,theme,useControllableState}`.
  - `FormField` test: obsolete `labelPlacement="left"` corrected to
    `"start"` for the tightened union type.
  - Author / date / description headers added across token, theme, and
    component source files for traceability.

### Patch Changes

- Updated dependencies [32635c1]
  - @timeui/tokens@1.1.0

## 1.0.0

### Major Changes

- 8f6c11a: 初始化

### Patch Changes

- Updated dependencies [8f6c11a]
  - @timeui/tokens@1.0.0
