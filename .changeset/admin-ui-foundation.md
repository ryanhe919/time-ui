---
'@timeui/react': minor
'@timeui/tokens': minor
---

feat: add Popover / Tooltip / Modal / Tabs / Pagination / Table component family

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
