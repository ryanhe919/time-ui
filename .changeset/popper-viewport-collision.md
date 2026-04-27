---
'@timeui/react': patch
---

fix(select, popover): viewport-aware popper placement — pickers and tooltips no longer get clipped by the viewport edge.

- **`Select`** — when the trigger sits near the bottom of the viewport, the listbox now opens **upwards** instead of being cut off. The list height also auto-shrinks to the available space and stays scrollable. Animation `transform-origin` flips to match. This directly fixes the `Pagination` page-size selector being unreachable when a paginator is rendered at the bottom of the page.
- **`Popover`** (and everything built on it: `Tooltip`, `Menu`, `DatePicker`, `DateTimePicker`) — `computePopoverPosition` now does **flip** (top↔bottom / left↔right when the requested side has no room and the opposite does) and **shift** (clamps the cross-axis position so the panel stays inside the viewport with an 8 px safety margin). Pure-function callers without a `viewport` argument keep the previous behavior.
