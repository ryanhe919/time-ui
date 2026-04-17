# @timeui/react

## 1.2.0

### Minor Changes

- f032a76: feat: add Popover / Tooltip / Modal / Tabs / Pagination / Table component family

  Six new components for building admin / management UIs, with matching token blocks,
  298 new unit + a11y tests (lines/funcs/stmts ≥95%, branches ≥80% across the board),
  and full bilingual documentation (12 MDX pages, 11 demo components, 3 new navigation
  groups: overlays / navigation / data-display).
  - **Popover** — anchor-based overlay with click / hover / focus / manual triggers and
    12 placements; exports `computePopoverPosition` for downstream reuse.
  - **Tooltip** — reverse-color hover/focus tooltip reusing Popover positioning, with
    cross-instance warm-up to skip enter delay on quickly-revisited targets.
  - **Modal** — focus-trapped dialog with scroll lock, sm/md/lg/xl/full sizes, and
    ModalHeader / ModalBody / ModalFooter compound subcomponents.
  - **Tabs** — declarative `<Tab>` + data-driven `items`, underline / pills / bordered
    variants, horizontal & vertical orientation, lazy panel mounting.
  - **Pagination** — page navigation with `siblingCount` ellipsis, quick jumper, and a
    page-size changer that reuses the existing `Select`.
  - **Table** — data-driven `columns` + `data`, sortable headers (controlled descriptor),
    single / multiple row selection, fixed columns, sticky header, loading / empty states.

### Patch Changes

- Updated dependencies [f032a76]
  - @timeui/tokens@1.2.0
  - @timeui/core@1.1.1
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
  - @timeui/core@1.1.0
  - @timeui/themes@1.1.0
  - @timeui/tokens@1.1.0

## 1.0.0

### Major Changes

- 8f6c11a: 初始化

### Patch Changes

- Updated dependencies [8f6c11a]
  - @timeui/core@1.0.0
  - @timeui/themes@1.0.0
  - @timeui/tokens@1.0.0
