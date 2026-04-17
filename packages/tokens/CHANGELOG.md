# @timeui/tokens

## 1.3.0

### Minor Changes

- 0a3337c: feat: add 10 admin-system components — Drawer / Toast / Menu / DatePicker / DateRangePicker / Avatar / Tag / Badge / Skeleton / Empty / Steps

  Second-batch component family for building complete admin / management UIs.
  409 new unit + a11y tests (lines/funcs/stmts ≥95%, branches ≥80% across the
  board), full bilingual documentation (20 MDX pages, 8 demo components, all
  slotted into the existing `overlays` / `navigation` / `data-display` groups),
  and matching tokens.
  - **Drawer** — placement-aware side dialog (left/right/top/bottom), reuses
    Modal-style focus trap / scroll lock / portal; `DrawerHeader` / `Body` /
    `Footer` compounds.
  - **Toast / Notification** — command-style API (`toast.success/error/...`) +
    `useToast` hook + `ToastProvider`; supports `toast.promise()` flow,
    hover-pause auto-dismiss, 6 placements.
  - **Menu / Dropdown** — declarative `<Menu.Item>` + data-driven `items`,
    `selectionMode: 'none' | 'single' | 'multiple'`, ARIA menu semantics,
    keyboard nav + typeahead. Built on Popover; exports `MenuRow` for downstream
    reuse.
  - **DatePicker / DateRangePicker** — calendar overlay built on Popover + Input,
    `isDateUnavailable` / `minValue` / `maxValue`, range hover preview, optional
    presets sidebar (reuses `MenuRow`). Zero external date-lib dependency.
  - **Avatar / AvatarGroup** — image → name initials → fallback chain, 5 sizes,
    4 status dots, `color="auto"` deterministic hashing, `AvatarGroup` overlap +
    `+N` overflow.
  - **Tag** — 6 colors × 3 variants (`solid` / `soft` / `outline`) × 3 sizes,
    optional `isClosable` + `isInteractive`.
  - **Badge** — `standard` (with `max` overflow) and `dot` variants, 4 corner
    placements, standalone or wrapper mode.
  - **Skeleton / SkeletonGroup** — `rect` / `circle` / `text` shapes with
    `shimmer` / `pulse` / `none` animations; `SkeletonGroup` context-driven
    `isLoaded` switch.
  - **Empty** — 4 inline-SVG presets (`default` / `search` / `error` /
    `no-data`), `default` / `inline` variants, customizable image / title /
    description / actions.
  - **Steps** — multi-step indicator, horizontal / vertical, `default` / `dot` /
    `navigation` variants, automatic status inference + connector fill animation.

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

## 1.0.0

### Major Changes

- 8f6c11a: 初始化
