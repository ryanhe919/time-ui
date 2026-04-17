---
'@timeui/react': minor
'@timeui/tokens': minor
---

feat: add 10 admin-system components — Drawer / Toast / Menu / DatePicker / DateRangePicker / Avatar / Tag / Badge / Skeleton / Empty / Steps

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
