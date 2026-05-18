# @timeui/tokens

## 1.6.1

### Patch Changes

- b3281ec: Drawer 视觉与交互打磨：
  - 入场动画去掉 spring 回弹，改用 `easeOut` 平滑滑入。
  - 圆角 16px → 10px，整体更克制。
  - header / footer 内边距、min-height、close button 尺寸与 offset 重新调校，使标题与关闭按钮在 Y 轴自然对齐。
  - 修复将 `<DrawerHeader>` / `<DrawerFooter>` 直接传给 `header` / `footer` prop 时出现的双层包裹（导致 close 按钮错位 + 双下划线）；`DrawerHeader` 自带 close 按钮右侧避让。
  - header / footer 的 1px 分割线现在贯穿整个 panel 宽度，不再被内边距内缩。

## 1.6.0

### Minor Changes

- 145ed45: feat(multi-select): add MultiSelect with chip-based trigger, dropdown toolbar, OptGroup, search and full a11y; extend Tag with non-breaking closeButtonTabIndex / closeButtonAriaLabel props

  **MultiSelect** is a new multi-value listbox built on the same trigger /
  popover / search skeleton as `Select`, but with chip-based echo in the
  trigger, checkbox indicators on each option, and an optional toolbar for
  _Select all_ / _Clear_ inside the popover. It is the canonical answer for
  picking two or more values from a finite set (tags, categories,
  recipients…) and ships full keyboard, screen-reader, type-ahead and
  Backspace support that native `<select multiple>` simply lacks.

  Highlights:
  - **Design language consistent with `Select`**: shares variants (`flat` /
    `bordered` / `faded` / `underlined`), color ramp, sizes (xs–xl), radius
    mapping, FormField integration, popover placement and a11y wiring. The
    one intentional divergence is the **left-aligned checkbox** on each
    option — every row could be selected, so a single left column makes
    selection state scannable at a glance (matches W3C APG Listbox examples
    and Ant / MUI / NextUI).
  - **`+N` chip folding**: `maxTagCount` supports `"responsive"` (default,
    width-aware), a fixed integer cap, or `Infinity` (wrap). The `+N` chip is
    rendered as an `outline` neutral chip (non-removable) so it reads as
    metadata rather than another deletable value, and exposes the hidden
    labels via `title` + `aria-label="+N more: …"`.
  - **Toolbar** (`showSelectAllInToolbar`): single text button toggles
    between _Select all_ and _Clear_, scoped to **visible** items so it
    composes correctly with `isSearchable` filters and `hideSelectedInList`.
  - **`maxSelectedCount`**: over-cap rows render as `aria-disabled`, but
    already-selected rows can still toggle off — no dead-end states.
  - **Native form integration**: pass `name` and `MultiSelect` emits one
    hidden `<input>` per value, so `FormData` carries the selection without
    glue code.
  - **Declarative or compositional**: pass `items={[...]}` _or_ nest
    `<MultiSelectOption>` / `<MultiSelectOptGroup>` children; option /
    optgroup components are runtime-prop carriers and emit no DOM of their
    own.
  - **Custom rendering**: `tagRender` and `optionRender` for full control;
    default chip renderer reads `Tag` and is sized from the trigger size.

  **Tag — non-breaking extension**

  Two optional props were added to support `MultiSelect`'s chip slot
  without breaking any existing `Tag` consumer:
  - `closeButtonTabIndex?: number` — defaults to `0` (current behaviour);
    `MultiSelect` passes `-1` to keep the trigger as the only Tab stop.
  - `closeButtonAriaLabel?: string` — defaults to a sensible
    i18n-resolved label; `MultiSelect` overrides it to `Remove <label>` so
    screen readers announce _which_ chip is being removed.

  Both are additive and have no effect on default `Tag` usage.

  **Tokens**

  `@timeui/tokens` adds a `multiSelectTokens` namespace covering trigger
  height per size, chip-in-trigger gap, toolbar background / divider,
  checkbox column width, and overflow-chip foreground / background. All
  new tokens map to existing semantic tokens for both themes — no new
  raw colors were introduced.

## 1.5.2

### Patch Changes

- 7ee2011: fix(pagination): correct edge-page selection, sync jumper input across sizes, extend size-changer scale
  - Rewrite `buildPaginationItems` from "left/right sibling shrink" to a constant 7-slot (`2 * siblingCount + 5`) three-region layout (near-start / near-end / middle). Fixes a dead zone where pages near the edges only surfaced `N-1` and `N`.
  - Replace the bespoke quick-jumper `<input>` with the shared `<Input>` component so the jumper visually and behaviourally matches the rest of the Pagination control across all 5 sizes.
  - Drop the `'lg' | 'md' | 'sm'` clamp on the embedded SizeChanger `<Select>` and forward the full 5-tier scale (`xs | sm | md | lg | xl`).

  Tokens: `paginationSizes[size]` gains a `jumperWidth` (44 / 52 / 64 / 72 / 80 px). The standalone `paginationTokens.jumperWidth` / `.jumperHeight` / `.jumperRadius` fields are removed — those concerns are now owned by the `Input` component and no longer need a duplicate Pagination-local token surface.

## 1.5.1

### Patch Changes

- 471b2b8: chore: align all published packages to a fresh patch version

  Coordinated patch bump across the entire `@timeui/*` surface. No
  behavioural changes — published purely to keep the workspace versions
  in lockstep.

## 1.5.0

### Minor Changes

- dba5d6d: Design system consistency pass — token cleanup, focus ring unification, scaffolder modernization.

  **`@timeui/tokens`**
  - Collapse off-grid font sizes to the canonical scale (12 / 13 / 14 / 16 / 18):
    - Slider / SegmentedControl / Tabs / Pagination `lg` fontSize: 15 → 16
    - Steps `lg` titleFontSize: 15 → 16
    - Empty titleFontSize: 15 → 16
    - Modal / Drawer headerFontSize: 17 → 18
    - Badge standardFontSize: 11 → 12
  - Align `md` / `lg` heights across components so they line up next to `Button`:
    - Pagination `md` itemSize 36 → 40 (radius 10 → 12), `lg` 44 → 48 (radius 12 → 14), jumper 36/10 → 40/12
    - SegmentedControl `md` height 36 → 40, `lg` 44 → 48
    - Avatar `lg` size 56 → 48 (fontSize 20 → 18) — was visually equivalent to Button `xl`
  - Tighten radius scale into three tiers (micro 8 / floating 12 / large container 16):
    - Tooltip radius 6 → 8
    - Tag `sm` / `md` radius 6 → 8
    - ChatBubble bubbleRadius 18 → 16
  - Add `calloutTokens` and `CalloutTokens` type, registered under `components.callout`.

  **`@timeui/react`**
  - Unify focus rings to 2px (`theme.borders.width.thick`) across `fieldStyles`, Checkbox, Slider and Input adornment buttons (was 1 / 1.5 / 2px mix).
  - FormField `disabled` opacity 0.6 → 0.5 — matches Button / Switch / Checkbox.
  - Callout now reads from `theme.components.callout` instead of hardcoded values; visuals unchanged.
  - CodeBlock no longer hardcodes hex colors / mono font-family / 150ms transition — all read from theme (`bg.sunken`, `text.primary`, `typography.fontFamily.mono`, `motion.duration.fast`).
  - Select drops 11.5px / 12.5px wild font sizes in option description and empty state.

## 1.4.2

### Patch Changes

- 6383a70: Coordinate a patch bump across the remaining publishable packages. No user-facing code changes in these packages — version aligned with the `@timeui/react` minor release.

## 1.4.1

### Patch Changes

- Tighten Menu horizontal spacing and localize Pagination defaults through the global ConfigProvider locale.

## 1.4.0

### Minor Changes

- ece0f77: Coordinated minor release across all TimeUI packages: aligns all packages on a shared minor-bump cadence and verifies the full monorepo on pnpm 10.33 + Node 22 toolchain.

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
