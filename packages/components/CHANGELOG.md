# @timeui/react

## 2.0.2

### Patch Changes

- 772beca: fix(popover): tighten React 18 / 19 ref-reading branch

  Splits the dual-version ref read into an explicit `majorReactVersion >= 19`
  check so React 18 no longer hits the `props.ref` path (which warns) and
  React 19 stops falling through to the deprecated `element.ref`. Behaviour
  is unchanged on either runtime — this is a deprecation-warning fix only.

## 2.0.1

### Patch Changes

- 2114cec: fix(date-time-picker): cap time column height to the calendar grid

  The right-pane TimePanel was a flex child of the body without `min-height: 0`, so its
  content size (60-row hour/minute lists ≈ 1800px tall) overrode the body's calendar-anchored
  height and pushed the time columns far below the date grid. Adding `min-height: 0`,
  `min-width: 0`, and `overflow: hidden` to the right pane lets the bounded body height take
  effect and the inner list's `overflow-y: auto` actually scroll.

## 2.0.0

### Major Changes

- 743c882: **Unify component API naming across all 36+ components (BREAKING CHANGE).**

  Following the audit recorded in `.scratch/api-unification-spec.md`, every component now follows a single set of naming conventions. The biggest themes:
  - **Boolean state props use the `is*` prefix.** `disabled → isDisabled`, `loading → isLoading`, `fullWidth → isFullWidth`, `selected → isSelected`, `clearable → isClearable`, `bordered → isBordered`, `striped → isStriped`, `pulse → isPulse`, etc.
  - **Overlay open state is `isOpen` / `defaultOpen` / `onOpenChange`** (not `open` / `defaultIsOpen` / `onClose`). Affects Modal, Drawer, Popover, Tooltip, Toast, SearchDialog. The lone exception to the `is*` convention is `defaultOpen` (matches React conventions for `defaultValue` etc.).
  - **Steps switches to `activeIndex` / `defaultActiveIndex`** (was `current` / `defaultCurrent`). Aligns with Tabs' `selectedKey` family.
  - **Pagination's main change handler is `onPageChange`** (was `onChange`), to leave room for `onPageSizeChange` already in use.
  - **Data-item key fields are now `itemKey` / `sectionKey` / `columnKey`** instead of `key`, so they don't collide with React's reserved `key`. Affects `TabItem`, `StepItem`, `MenuSection`, `TableColumn`.
  - **`onChangeEvent` removed.** The pattern of exposing both `onChange(value)` and `onChangeEvent(e)` was removed from Input, Textarea, Checkbox, Switch, Radio. Use `onChange` (value-shaped) plus standard React event handlers (`onBlur`, `onFocus`, etc.) on the underlying element if you need the event.
  - **Modal/Drawer focus & scroll props renamed for clarity:** `blockScrollOnMount → shouldBlockScroll`, `returnFocusOnClose → shouldReturnFocus`.
  - **Popover/Tooltip arrow:** `withArrow → hasArrow`.
  - **Visual modifier props:** `Text muted → isMuted`, `Avatar pulse → isPulse`, etc.
  - **Size scales unified to a 5-tier `xs | sm | md | lg | xl` scale** across all 22 components that take a `size` prop (was a mix of 3-tier and ad-hoc scales).
  - **Slot props standardised on `startContent` / `endContent`** (was a mix of `prefix` / `suffix` / `leading` / `trailing`).
  - **Search trigger**: `fullWidth → isFullWidth`, size scale expanded to xs–xl.

  Migration: there are no deprecated aliases — old names will fail to type-check. Use the rename table in `.scratch/api-unification-spec.md` for a complete diff.

## 1.13.0

### Minor Changes

- 1b1c04f: Add `PdfViewer` and `MarkdownViewer` components.
  - **`PdfViewer`** — canvas-based PDF document viewer built on `pdfjs-dist` (lazy dynamic-imported). Paginated reader with zoom (numeric / `page-fit` / `page-width`), optional download / print buttons, full keyboard navigation (`←`/`→`, `Page Up/Down`, `+`/`-`, `0`), and a `workerSrc` override for CDN-hosted workers. `pdfjs-dist` is an **optional peer**; install it alongside `@timeui/react`.
  - **`MarkdownViewer`** — document-oriented markdown reader built on `react-markdown` + `remark-gfm`. Reading-friendly typography, optional sticky table of contents (`IntersectionObserver`-based active-section tracking), copy / download / refresh toolbar (refresh re-fetches via internal nonce in URL mode), inline string or remote URL sources, fenced code delegated to `CodeBlock`. `react-markdown` and `remark-gfm` remain **optional peers**.

  Both viewers ship as dedicated subpath exports only — `@timeui/react/pdf-viewer` and `@timeui/react/markdown-viewer`. They are intentionally **not** re-exported from the main `@timeui/react` entry so the optional peers (`pdfjs-dist`, `react-markdown`, `remark-gfm`) never leak into the core bundle.

### Patch Changes

- 446d014: fix(select, popover): viewport-aware popper placement — pickers and tooltips no longer get clipped by the viewport edge.
  - **`Select`** — when the trigger sits near the bottom of the viewport, the listbox now opens **upwards** instead of being cut off. The list height also auto-shrinks to the available space and stays scrollable. Animation `transform-origin` flips to match. This directly fixes the `Pagination` page-size selector being unreachable when a paginator is rendered at the bottom of the page.
  - **`Popover`** (and everything built on it: `Tooltip`, `Menu`, `DatePicker`, `DateTimePicker`) — `computePopoverPosition` now does **flip** (top↔bottom / left↔right when the requested side has no room and the opposite does) and **shift** (clamps the cross-axis position so the panel stays inside the viewport with an 8 px safety margin). Pure-function callers without a `viewport` argument keep the previous behavior.

## 1.12.2

### Patch Changes

- f6208c9: Fix runtime crash when `useI18n().richTextEditor` is undefined.

  `<RichTextEditor>`'s toolbar would throw `Cannot read properties of undefined (reading 'bold')` whenever the surrounding `@timeui/core` was older than 1.5.0 (or whenever a stale workspace dist was loaded in dev), because the new i18n block hadn't shipped in those versions but the toolbar dereferenced it directly.

  Now the toolbar falls back to a built-in English label set when the i18n dictionary is missing the `richTextEditor` block, so the component degrades gracefully instead of crashing. To get localized labels, upgrade `@timeui/core` to ≥ 1.5.0 (no other change needed).

## 1.12.1

### Patch Changes

- Updated dependencies [6ae4852]
  - @timeui/core@1.5.0

## 1.12.0

### Minor Changes

- dd2709a: Add `RichTextEditor` — a full rich text editor based on TipTap, available as an independent subpath:

  ```ts
  import { RichTextEditor } from '@timeui/react/rich-text-editor';
  ```

  Why subpath: TipTap and ProseMirror weigh ~100 KB combined, so they're declared as **optional peer dependencies** and never flow into the main `@timeui/react` bundle. Installs that don't use the editor pay zero bytes for it.

  **Highlights**
  - Same size / variant / state vocabulary as `Input` and `Textarea` — `size: 'sm' | 'md' | 'lg'`, `variant: 'flat' | 'bordered' | 'faded'`, plus `isDisabled` / `isReadOnly` / `isInvalid`.
  - Controlled (`value` + `onChange`) and uncontrolled (`defaultValue`) modes, with internal sync that avoids feedback loops.
  - Toolbar presets (`'minimal' | 'basic' | 'full'`), free-form `ToolbarItem[]` arrays, or `toolbar={false}` to hide entirely. Toolbar buttons reuse our own `Button isIconOnly`, eating the dog food.
  - Pluggable: pass extra TipTap extensions via `extensions={[...]}`, or grab the editor instance via `onCreate={(editor) => ...}` for advanced workflows.
  - A11y baked in: `role="textbox"`, `aria-multiline`, `aria-disabled` / `aria-readonly` / `aria-invalid`, toolbar `role="toolbar"`, per-button `aria-label` and `aria-pressed`. axe-clean.
  - All visuals read from theme tokens — no hardcoded colors / sizes.

  **Required peer deps to install alongside:**

  ```bash
  pnpm add @tiptap/core @tiptap/react @tiptap/pm @tiptap/starter-kit \
    @tiptap/extension-underline @tiptap/extension-link @tiptap/extension-placeholder
  ```

  Full docs: `/docs/components/rich-text-editor`.

## 1.11.1

### Patch Changes

- 91921ba: Fix: icon-only `Button` now shows a native browser hover tooltip.

  Previously `<Button isIconOnly aria-label="Bold">` only set `aria-label` (read by screen readers), so sighted users had no way to discover what an icon button does on hover. The browser native tooltip requires the `title` HTML attribute, which was never set.

  Now when `isIconOnly` is true and no explicit `title` is provided, `title` is defaulted to the `aria-label`. Users get the standard ~500ms-delayed browser tooltip "for free" with the same text screen readers already announce. Text buttons are unaffected — they still get no `title` unless one is explicitly passed. Pass `title="..."` to override.

## 1.11.0

### Minor Changes

- f1cbc2d: Add `isIconOnly` prop to `Button` — renders a square icon-only button (width = height, drops min-width / padding / gap). Pair with `aria-label` for accessibility. Works with all variants, sizes, colors, and `radius="full"` for pill / FAB-style layouts.

  ```tsx
  <Button isIconOnly aria-label="Close"><XIcon /></Button>
  <Button isIconOnly radius="full" variant="shadow" color="primary" size="lg" aria-label="New">
    <PlusIcon />
  </Button>
  ```

  The button also gets a `data-icon-only` attribute for downstream styling hooks.

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

### Patch Changes

- Updated dependencies [dba5d6d]
  - @timeui/tokens@1.5.0
  - @timeui/core@1.4.3
  - @timeui/themes@1.2.3

## 1.10.0

### Minor Changes

- 50d0434: feat(datetimepicker): add DateTimePicker with optional minute/second granularity

  新增 `DateTimePicker` 组件，在 `DatePicker` 基础上并排 `TimePanel`（小时 / 分钟 / 秒滚动列）。`showMinute`（默认 true）与 `showSecond`（默认 false）按需开放分 / 秒粒度——被关闭的字段在 value 中恒为 0；支持 `use12Hours`、`hourStep` / `minuteStep` / `secondStep`、`Now` / `Clear` / `OK` 底部按钮；`defaultDateTimeFormat` / `defaultDateTimeParse` 与 24h / 12h 模式自适配。

## 1.9.1

### Patch Changes

- Refine button borders and form control focus styles.

## 1.9.0

### Minor Changes

- 6383a70: `DatePicker`: add a year view to the calendar panel.

  Clicking the month title in the calendar header now opens a 12-year grid; header arrows paginate by decade, and selecting a year returns to the date view. Keyboard and screen-reader behavior are covered by the existing accessibility contract and a new regression test.

### Patch Changes

- Updated dependencies [6383a70]
  - @timeui/core@1.4.2
  - @timeui/themes@1.2.2
  - @timeui/tokens@1.4.2

## 1.8.1

### Patch Changes

- Tighten Menu horizontal spacing and localize Pagination defaults through the global ConfigProvider locale.
- Updated dependencies
  - @timeui/core@1.4.1
  - @timeui/tokens@1.4.1
  - @timeui/themes@1.2.1

## 1.8.0

### Minor Changes

- ece0f77: Coordinated minor release across all TimeUI packages: aligns all packages on a shared minor-bump cadence and verifies the full monorepo on pnpm 10.33 + Node 22 toolchain.

### Patch Changes

- Updated dependencies [ece0f77]
  - @timeui/core@1.4.0
  - @timeui/tokens@1.4.0
  - @timeui/themes@1.2.0

## 1.7.0

### Minor Changes

- 9110af2: Maintenance release: verify full build/test/size budgets pass on pnpm 10.33 + Node 22, and tighten StatCard loading-state test type-safety.

## 1.6.0

### Minor Changes

- 2d16139: Add `Card` and `StatCard` components. Card ships `flat` / `bordered` / `elevated` variants with governed interaction (isHoverable / isPressable / isDisabled), optional start / top accent bar, size-driven padding (sm 12 / md 16 / lg 24), and compound subcomponents `CardHeader` / `CardBody` / `CardFooter`. Visual treatment: bordered hover densifies via inset ring (geometry stays 1px — no jitter), elevated uses a three-layer shadow in light and inset-highlighted stack in dark, pressable :active depresses with `translateY(0.5px) scale(0.998)` in 80ms, focus-visible paints a color-mix halo layered over variant shadow, accent bar grows 3 → 4px on hover with a weighty curve. StatCard composes Card for KPI tiles: uppercase KPI label (CJK auto-detected to disable uppercase/tracking), `tabular-nums slashed-zero` value with emphasis-driven type scale, polarity-auto delta pill with a baseline translateY lift and an arrow tick animation re-keyed on direction/value changes, optional icon container with inset highlight, trend slot with bleed/non-bleed layouts, inline breathe-pulse skeleton state. Adds `statCard.*` i18n keys (zh / en) covering the aria-label templates and loading copy.

### Patch Changes

- Add thorough regression tests for `Card` and `StatCard`, improving interaction and theme-path coverage.
- Updated dependencies [2d16139]
  - @timeui/core@1.3.0

## 1.5.0

### Minor Changes

- 3874cd0: Add `Upload` component with button and dropzone variants, supporting controlled/uncontrolled value, custom request pipeline with concurrency + abort, accept / size / count / duplicate validation, image preview with managed ObjectURL lifecycle, and full keyboard + screen reader a11y.

  Adds `upload.*` i18n keys to `@timeui/core` (zh / en).

### Patch Changes

- Updated dependencies [3874cd0]
  - @timeui/core@1.2.0

## 1.4.0

### Minor Changes

- Add streaming Markdown renderer as a subpath export, and introduce a companion `@timeui/mcp` package (first release) that powers an in-docs AI assistant.
  - **`@timeui/react/chat-markdown`** — new subpath export. A theme-aware streaming markdown renderer for AI chat output (paragraphs / lists / fenced code / tables / blockquotes / links), with graceful mid-stream degradation on unclosed fences. `react-markdown` and `remark-gfm` are declared as optional peer dependencies, so the main bundle is unaffected (same split model as `./code-block`).
  - **Sidebar category collapse** — the docs site sidebar now collapses per-category with localStorage-persisted state. Component categories were restructured into `general / layout / forms / data-display / feedback / overlays / navigation`.
  - **Companion package `@timeui/mcp`** (published separately, first release) — MCP server over stdio and Streamable HTTP with four tools (`list_categories`, `list_components`, `get_component`, `search_components`), backed by a build-time index of the docs MDX. Can be wired into Claude Code / Cursor via `npx -y @timeui/mcp timeui-mcp`.

  No breaking changes; existing `@timeui/react` imports and public API are unchanged.

## 1.3.2

### Patch Changes

- dd304aa: fix(chat-message): force 24-hour timestamp formatting to avoid SSR hydration mismatch

  `formatTimestamp` previously called `toLocaleTimeString([], { hour, minute })`
  which inherits the runtime's default locale — Node servers (often `en-US`)
  produced `09:30 AM` while browsers in non-US locales produced `09:30`,
  causing React hydration mismatches whenever a `<ChatMessage timestamp>`
  prop was a Date or number value.

  Pinning `hour12: false` keeps both sides on the 24-hour scale and drops
  the AM/PM suffix entirely, so server and client serialize identically.

## 1.3.1

### Patch Changes

- 602b953: fix: post-1.3.0 bug bundle — Tabs RSC parsing / DateRangePicker visuals / React 19 ref / Tag mdx

  Eight related fixes accumulated since 1.3.0:
  - **Tabs**: `parseChildren` rewritten to identify `<Tab>` / `<TabPanel>` by props
    shape (`itemKey + label` for Tab, `itemKey` only for TabPanel) instead of
    `child.type === Tab`. Next.js 15 RSC wraps every client component in a
    `React.lazy` proxy whose `type` is an opaque object with no `displayName`,
    so reference equality and displayName comparisons both failed silently —
    declarative `<Tab itemKey><TabPanel itemKey>...</TabPanel></Tab>` rendered
    zero tabs in MDX. (Affected the Tabs basic-usage doc and any RSC-rendered
    consumer.)
  - **DateRangePicker** range highlight: `isRangeStart` and `isRangeEnd` are now
    computed independently, so start-only cells get an inner straight edge that
    meets the mid-segment seamlessly instead of always being all-rounded.
  - **DateRangePicker** dual-month view: new `hideOutsideMonth` prop on
    `CalendarPanel` (passed `true` by both panels in range mode) hides the
    adjacent-month "ghost" days that used to overlap between the two panels,
    giving a much cleaner visual.
  - **DatePicker / DateRangePicker** Popover width: explicit
    `width: 'max-content'` on the panel wrapper overrides `popoverTokens.maxWidth`
    (320px) so the wider double-month + presets layout fits inside the Popover
    background.
  - **Popover / Tooltip**: anchor cloning now reads `element.props.ref` (React 19)
    with a fallback to `element.ref` (React 18), eliminating the deprecation
    warning while staying compatible with both runtimes.
  - **CalendarPanel** performance: hoist `startOfDay`/`getTime` results once per
    `useMemo` run so the 42-cell loop no longer redoes range-bound normalization
    per cell; consolidated `isAnySelected` derived boolean removes 5 repeated
    `c.isSelected || c.isRangeStart || c.isRangeEnd` checks per cell.
  - **Tag** docs: moved inline `onClose` / `onPress` handlers from MDX into a
    `TagInteractiveDemo` client component so RSC no longer rejects passing event
    handlers to a client component.
  - **Toast** demo: rewrote to use `toast.show({ status, title, description })`
    instead of `toast.success(msg, { description })`, matching the actual API
    signature.

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

### Patch Changes

- Updated dependencies [0a3337c]
  - @timeui/tokens@1.3.0
  - @timeui/core@1.1.2
  - @timeui/themes@1.1.2

## 1.2.1

### Patch Changes

- f543876: feat(table): add four visual variants — `enclosed` (default) / `divided` / `grid` / `quiet`

  The `Table` component now accepts a `variant` prop with four cohesive looks, all
  built from existing tokens (no new tokens, no hardcoded colors):
  - **`enclosed`** (default, current behavior) — outer radius + container hairline +
    muted header bg. Apple Settings card vibe; ideal as a self-contained data block.
  - **`divided`** — no outer frame; header keeps only a strong bottom hairline plus
    tightened letter-spacing. Apple Mail list vibe; recedes inside body copy.
  - **`grid`** — `enclosed` plus subtle hairlines between columns. Numbers / report
    vibe; great for dense fields.
  - **`quiet`** — no border, no divider, no background; only row hover reveals
    separation. The most restrained form, best for documentation contexts.

  `hasBorder` is now honored only when `variant="enclosed"`; the other variants
  force it off (the docs note this explicitly). All variants compose orthogonally
  with `density`, `isStriped`, `stickyHeader`, and fixed columns.

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
