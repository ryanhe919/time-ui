---
'@timeui/react': minor
'@timeui/tokens': minor
---

feat(multi-select): add MultiSelect with chip-based trigger, dropdown toolbar, OptGroup, search and full a11y; extend Tag with non-breaking closeButtonTabIndex / closeButtonAriaLabel props

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
