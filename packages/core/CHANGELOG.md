# @timeui/core

## 1.5.5

### Patch Changes

- Updated dependencies [de7b580]
  - @timeui/tokens@1.7.0
  - @timeui/themes@1.2.8

## 1.5.4

### Patch Changes

- Updated dependencies [b3281ec]
  - @timeui/tokens@1.6.1
  - @timeui/themes@1.2.7

## 1.5.3

### Patch Changes

- Updated dependencies [145ed45]
  - @timeui/tokens@1.6.0
  - @timeui/themes@1.2.6

## 1.5.2

### Patch Changes

- Updated dependencies [7ee2011]
  - @timeui/tokens@1.5.2
  - @timeui/themes@1.2.5

## 1.5.1

### Patch Changes

- 471b2b8: chore: align all published packages to a fresh patch version

  Coordinated patch bump across the entire `@timeui/*` surface. No
  behavioural changes — published purely to keep the workspace versions
  in lockstep.

- Updated dependencies [471b2b8]
  - @timeui/themes@1.2.4
  - @timeui/tokens@1.5.1
  - @timeui/utils@1.2.2

## 1.5.0

### Minor Changes

- 6ae4852: Add `richTextEditor` block to `Messages` (zh + en) covering the toolbar label, every standard formatting button (bold / italic / underline / strike / h1-h3 / lists / blockquote / code / horizontalRule / link / clearFormat / undo / redo) and the link prompt.

  Consumed by `<RichTextEditor>` in `@timeui/react/rich-text-editor` so the toolbar tooltips automatically follow the surrounding `<ConfigProvider locale="...">`. Custom labels can still be passed via the `labels` prop.

## 1.4.3

### Patch Changes

- Updated dependencies [dba5d6d]
  - @timeui/tokens@1.5.0
  - @timeui/themes@1.2.3

## 1.4.2

### Patch Changes

- 6383a70: Coordinate a patch bump across the remaining publishable packages. No user-facing code changes in these packages — version aligned with the `@timeui/react` minor release.
- Updated dependencies [6383a70]
  - @timeui/themes@1.2.2
  - @timeui/tokens@1.4.2
  - @timeui/utils@1.2.1

## 1.4.1

### Patch Changes

- Tighten Menu horizontal spacing and localize Pagination defaults through the global ConfigProvider locale.
- Updated dependencies
  - @timeui/tokens@1.4.1
  - @timeui/themes@1.2.1

## 1.4.0

### Minor Changes

- ece0f77: Coordinated minor release across all TimeUI packages: aligns all packages on a shared minor-bump cadence and verifies the full monorepo on pnpm 10.33 + Node 22 toolchain.

### Patch Changes

- Updated dependencies [ece0f77]
  - @timeui/tokens@1.4.0
  - @timeui/themes@1.2.0
  - @timeui/utils@1.2.0

## 1.3.0

### Minor Changes

- 2d16139: Add `Card` and `StatCard` components. Card ships `flat` / `bordered` / `elevated` variants with governed interaction (isHoverable / isPressable / isDisabled), optional start / top accent bar, size-driven padding (sm 12 / md 16 / lg 24), and compound subcomponents `CardHeader` / `CardBody` / `CardFooter`. Visual treatment: bordered hover densifies via inset ring (geometry stays 1px — no jitter), elevated uses a three-layer shadow in light and inset-highlighted stack in dark, pressable :active depresses with `translateY(0.5px) scale(0.998)` in 80ms, focus-visible paints a color-mix halo layered over variant shadow, accent bar grows 3 → 4px on hover with a weighty curve. StatCard composes Card for KPI tiles: uppercase KPI label (CJK auto-detected to disable uppercase/tracking), `tabular-nums slashed-zero` value with emphasis-driven type scale, polarity-auto delta pill with a baseline translateY lift and an arrow tick animation re-keyed on direction/value changes, optional icon container with inset highlight, trend slot with bleed/non-bleed layouts, inline breathe-pulse skeleton state. Adds `statCard.*` i18n keys (zh / en) covering the aria-label templates and loading copy.

## 1.2.0

### Minor Changes

- 3874cd0: Add `Upload` component with button and dropzone variants, supporting controlled/uncontrolled value, custom request pipeline with concurrency + abort, accept / size / count / duplicate validation, image preview with managed ObjectURL lifecycle, and full keyboard + screen reader a11y.

  Adds `upload.*` i18n keys to `@timeui/core` (zh / en).

## 1.1.2

### Patch Changes

- Updated dependencies [0a3337c]
  - @timeui/tokens@1.3.0
  - @timeui/themes@1.1.2

## 1.1.1

### Patch Changes

- Updated dependencies [f032a76]
  - @timeui/tokens@1.2.0
  - @timeui/themes@1.1.1

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
  - @timeui/themes@1.1.0
  - @timeui/tokens@1.1.0
  - @timeui/utils@1.1.0

## 1.0.0

### Major Changes

- 8f6c11a: 初始化

### Patch Changes

- Updated dependencies [8f6c11a]
  - @timeui/themes@1.0.0
  - @timeui/tokens@1.0.0
  - @timeui/utils@1.0.0
