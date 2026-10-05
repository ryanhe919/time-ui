# @timeui/react

## 2.3.0

### Minor Changes

- d2c0ad0: Fix component rendering and interaction regressions across forms, overlays, tables, navigation, PDF and chat: preserve icon button dimensions and keyboard focus, prevent textarea/upload overlap, synchronize date and async option state, update floating and sticky positioning after resize, and keep streamed content and replacement PDFs current.

  Add PDF.js 5/6 and Tiptap 3 compatibility while retaining PDF.js 4 and Tiptap 2 support. Require patched Tiptap versions (2.27.3 or 3.30.4 and newer within their major) to prevent inherited executable DOM attributes.

  Refresh the bilingual MCP documentation index with the supported PDF.js and patched Tiptap version requirements.

## 2.2.1

### Minor Changes

> 版本号说明：`2.2.0` 已于此前发布到 npm（内容见下方 2.2.0 条目），仓库侧的 version commit
> 随后被回滚，因此本次变更以 `2.2.1` 发布。功能上属于 minor 级别的新增。

- de7b580: Modal 支持拖动与缩放；Select / MultiSelect 接入后端搜索与分页。

  **Modal — 拖动 / 缩放（opt-in，默认关闭）**
  - 新增 `isDraggable`：拖内置 header 移动面板；没有 `title` 时，给面板内任意元素加 `data-timeui-modal-drag-handle`（导出常量 `MODAL_DRAG_HANDLE_ATTR`）即可作为把手，把手内部的按钮 / 链接 / 表单控件以及 `data-timeui-modal-no-drag` 元素不会误触发拖动。
  - 新增 `isResizable` + `resizeHandles`：四边四角八个缩放把手，可按需裁剪。
  - 位置与尺寸支持受控 / 非受控：`rect` / `defaultRect` / `onRectChange`（回调带 `reason: 'init' | 'drag' | 'resize' | 'constrain'`），并有 `minWidth` / `minHeight` / `shouldConstrainToViewport` / `shouldResetRectOnClose` 约束。
  - 键盘可达：`Ctrl/⌘ + 方向键` 移动，`Ctrl/⌘ + Shift + 方向键` 缩放，均为 16px 步长。
  - `@timeui/tokens` 的 `modalTokens` 新增 `resizeHandleSize` / `resizeHandleCornerSize` / `minWidth` / `minHeight` / `viewportPadding`。

  **Select / MultiSelect — 后端搜索与分页**

  两个组件获得同名同义的一套 props（`AsyncSearchProps`），三种模式互相兼容、默认行为完全不变：
  - **本地**（默认）—— 行为与既有版本一致；Select 补上了此前只有 MultiSelect 才有的 `filterOption`。
  - **托管远程** —— 只传 `loadOptions`，组件负责 debounce（`searchDebounce`，默认 300ms）、`AbortSignal` 取消过期请求、乱序响应丢弃、按 `value` 去重的分页累积、滚动触底（`loadMoreThreshold`）与键盘到底翻页、失败重试。`searchParams` 随请求下发且变化时自动从第一页重搜，`pageSize` / `resetOnClose` 可调。
  - **受控远程** —— `searchMode="remote"` 跳过本地过滤，配合 `searchValue` / `onSearchChange` / `onSearch` / `isLoading` / `isLoadingMore` / `hasMore` / `onLoadMore` / `loadError` / `onRetry` 完全自管数据。

  远程模式下选中项常常不在当前结果里，两个组件都会缓存已选项的 label（并在 `items` 里兜底查找），因此 Select 的 trigger 与 MultiSelect 的 chip 不会退化成裸 `value`。

  **行为修正**

  `MultiSelect` 在 `isLoading` 期间不再整体卸载 listbox，改为保留一个 `aria-busy` 的空 listbox。此前 trigger 的 `aria-expanded="true"` 会配上指向不存在元素的 `aria-controls`，违反 `aria-required-attr`。依赖「loading 时 `role="listbox"` 不存在」的测试需要改为断言 `aria-busy` + 零个 `option`。

### Patch Changes

- Updated dependencies [de7b580]
  - @timeui/tokens@1.7.0
  - @timeui/core@1.5.5
  - @timeui/themes@1.2.8

## 2.2.0

### Minor Changes

- 0578648: feat(datepicker): add `variant` and `color` props to DatePicker, DateRangePicker, and DateTimePicker

  The three date/time picker components now accept `variant` (`flat` | `bordered` | `faded` | `underlined`) and `color` (`default` | `primary` | `secondary` | `success` | `warning` | `danger`) props, matching the existing Input / Select / MultiSelect field styling system. Props are transparently forwarded to the internal `<Input>` trigger — no new tokens or style overrides are introduced.

## 2.1.1

### Patch Changes

- b3281ec: Drawer 视觉与交互打磨：
  - 入场动画去掉 spring 回弹，改用 `easeOut` 平滑滑入。
  - 圆角 16px → 10px，整体更克制。
  - header / footer 内边距、min-height、close button 尺寸与 offset 重新调校，使标题与关闭按钮在 Y 轴自然对齐。
  - 修复将 `<DrawerHeader>` / `<DrawerFooter>` 直接传给 `header` / `footer` prop 时出现的双层包裹（导致 close 按钮错位 + 双下划线）；`DrawerHeader` 自带 close 按钮右侧避让。
  - header / footer 的 1px 分割线现在贯穿整个 panel 宽度，不再被内边距内缩。

- Updated dependencies [b3281ec]
  - @timeui/tokens@1.6.1
  - @timeui/themes@1.2.7
  - @timeui/core@1.5.4

## 2.1.0

### Minor Changes

- f6c71cb: feat(chat): polish Chat family + add ChatScrollToBottom & ChatFileChip

  A round of audit-driven cleanup across the Chat component family, plus
  two new components that fill recurring product gaps. No breaking
  changes — `ChatComposer.ref` switches from a `<div>` element to an
  imperative handle, see migration note below.

  **ChatComposer**
  - Ref now exposes a `ChatComposerHandle` with `focus()` / `blur()` /
    `getElement()` / `getTextarea()`. Calling `composerRef.current?.focus()`
    finally focuses the textarea (was previously a no-op on the wrapper
    div). Migration: replace `useRef<HTMLDivElement>` with
    `useRef<ChatComposerHandle>`; if you used `composerRef.current` as a
    DOM node, call `composerRef.current?.getElement()` instead.
  - Focus state moved from React `useState` to CSS `:focus-within`, so
    the wrapper no longer re-renders on focus / blur. The `data-focused`
    attribute is removed (you can rely on `:focus-within` in CSS).
  - Focus ring upgraded from a 1px border colour swap to a 2px
    `inset box-shadow` to match the `Input` / `Select` field family — no
    more 1→2px width jitter on focus.
  - Composer demo MDX (`chat/composer/{en,zh}.mdx`) is now a runnable
    self-contained `Demo()` function so the LiveDemo no longer throws
    `ScopeError: value is not defined` in editable mode.

  **New: `ChatScrollToBottom`**

  Floating "↓ N new messages" pill button for chat surfaces. Pair with
  the new `ChatMessageList` `onAtBottomChange(atBottom)` callback so the
  button only shows when the user has scrolled away from the bottom.
  Configurable icon, optional unread count badge, full keyboard +
  focus-visible support.

  **New: `ChatFileChip`**

  Replaces hand-rolled file-chip `<span>`s in the composer top slot. One
  component covers the standard set: file name + extension-derived kind
  icon, optional size label, optional remove button (with proper event
  isolation), optional inline upload progress bar, error state, and a
  clickable variant for "preview attachment" flows.

  **`ChatMessageList` — auto-scroll bug fix**

  The list previously forced `scrollTop = scrollHeight` on every child
  update, hijacking the user's position whenever they scrolled up to read
  history. Auto-scroll now only fires when the user is already within
  32px of the bottom. The new `onAtBottomChange` prop reports
  "scrolled-away / back-at-bottom" transitions so consumers can show /
  hide `ChatScrollToBottom`. Also documents the deliberate
  `aria-live="polite" aria-relevant="additions"` choice (we omit
  `'text'` to keep streaming tokens from being re-announced).

  **`ChatToolCall` — focus visual aligned**

  Header focus now lifts the whole card (border colour change + 2px
  outline ring) instead of drawing an inset outline inside the button.
  Matches `ChatActionButton` / `ChatSendButton` / `ChatKnowledgeRefs`.

  **`ChatMessage` — flow polish**
  - Streaming caret sized in `em` units (0.55em × 1em) so it scales with
    the surrounding font size; visual is unchanged at the default 14px
    but no longer fixed-pixel.
  - Assistant / tool / knowledge bubbles now default to
    `white-space: normal`. User input bubbles still use `pre-wrap` to
    preserve manual newlines. Fixes spurious empty lines when wrapping a
    `<ChatMarkdown>` inside an assistant message.

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

### Patch Changes

- d9e617a: fix(table): scale row selection checkbox by density

  Row-selection and select-all `Checkbox` instances no longer fall back to
  the default `md` size, which read as visually too large in dense tables.
  The size now follows `density`: `compact → xs`, `default | comfortable
→ sm`. No API change — purely visual.

- Updated dependencies [145ed45]
  - @timeui/tokens@1.6.0
  - @timeui/core@1.5.3
  - @timeui/themes@1.2.6

## 2.0.4

### Patch Changes

- 7ee2011: fix(pagination): correct edge-page selection, sync jumper input across sizes, extend size-changer scale
  - Rewrite `buildPaginationItems` from "left/right sibling shrink" to a constant 7-slot (`2 * siblingCount + 5`) three-region layout (near-start / near-end / middle). Fixes a dead zone where pages near the edges only surfaced `N-1` and `N`.
  - Replace the bespoke quick-jumper `<input>` with the shared `<Input>` component so the jumper visually and behaviourally matches the rest of the Pagination control across all 5 sizes.
  - Drop the `'lg' | 'md' | 'sm'` clamp on the embedded SizeChanger `<Select>` and forward the full 5-tier scale (`xs | sm | md | lg | xl`).

  Tokens: `paginationSizes[size]` gains a `jumperWidth` (44 / 52 / 64 / 72 / 80 px). The standalone `paginationTokens.jumperWidth` / `.jumperHeight` / `.jumperRadius` fields are removed — those concerns are now owned by the `Input` component and no longer need a duplicate Pagination-local token surface.

- Updated dependencies [7ee2011]
  - @timeui/tokens@1.5.2
  - @timeui/core@1.5.2
  - @timeui/themes@1.2.5

## 2.0.3

### Patch Changes

- 471b2b8: chore: align all published packages to a fresh patch version

  Coordinated patch bump across the entire `@timeui/*` surface. No
  behavioural changes — published purely to keep the workspace versions
  in lockstep.

- Updated dependencies [471b2b8]
  - @timeui/core@1.5.1
  - @timeui/themes@1.2.4
  - @timeui/tokens@1.5.1

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
