---
'@timeui/react': patch
---

feat(table): add four visual variants — `enclosed` (default) / `divided` / `grid` / `quiet`

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
