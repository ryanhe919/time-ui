---
'@timeui/react': patch
---

fix(date-time-picker): cap time column height to the calendar grid

The right-pane TimePanel was a flex child of the body without `min-height: 0`, so its
content size (60-row hour/minute lists ≈ 1800px tall) overrode the body's calendar-anchored
height and pushed the time columns far below the date grid. Adding `min-height: 0`,
`min-width: 0`, and `overflow: hidden` to the right pane lets the bounded body height take
effect and the inner list's `overflow-y: auto` actually scroll.
