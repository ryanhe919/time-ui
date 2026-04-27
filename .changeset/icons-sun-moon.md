---
'@timeui/icons': minor
---

Add `SunIcon` and `MoonIcon` — feather-style theme-toggle glyphs. The docs site previously inlined these as one-off SVGs in `apps/docs/src/components/icons/theme.tsx`; they now live in `@timeui/icons` so they ship as proper tree-shakeable, ref-forwarding components with the same `size` / `color` / `aria-label` API as the rest of the set.
