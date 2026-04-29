---
'@timeui/react': patch
---

fix(select): clamp dropdown left to viewport so triggers near the right edge no longer get their popover clipped

`updateRect` only clamped vertically; horizontally it used `r.left` raw + `minWidth: r.width`, so any Select rendered near the viewport's right edge (e.g. Pagination size-changer in `flex justify-end`, last column of a form, drawers anchored bottom-right) had its dropdown extend past the viewport and the option list became unclickable. Now `updateRect` measures the actual popover width via `popoverRef` (with `ResizeObserver` to re-clamp when long options or search filters change the rendered width) and shifts `left` to `max(safeMargin, vw - dropWidth - safeMargin)` whenever it would otherwise overflow on the right.
