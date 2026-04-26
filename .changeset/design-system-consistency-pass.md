---
'@timeui/tokens': minor
'@timeui/react': minor
---

Design system consistency pass — token cleanup, focus ring unification, scaffolder modernization.

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
