---
'@timeui/react': patch
---

Fix: icon-only `Button` now shows a native browser hover tooltip.

Previously `<Button isIconOnly aria-label="Bold">` only set `aria-label` (read by screen readers), so sighted users had no way to discover what an icon button does on hover. The browser native tooltip requires the `title` HTML attribute, which was never set.

Now when `isIconOnly` is true and no explicit `title` is provided, `title` is defaulted to the `aria-label`. Users get the standard ~500ms-delayed browser tooltip "for free" with the same text screen readers already announce. Text buttons are unaffected — they still get no `title` unless one is explicitly passed. Pass `title="..."` to override.
