---
'@timeui/react': patch
'@timeui/tokens': patch
---

fix(pagination): correct edge-page selection, sync jumper input across sizes, extend size-changer scale

- Rewrite `buildPaginationItems` from "left/right sibling shrink" to a constant 7-slot (`2 * siblingCount + 5`) three-region layout (near-start / near-end / middle). Fixes a dead zone where pages near the edges only surfaced `N-1` and `N`.
- Replace the bespoke quick-jumper `<input>` with the shared `<Input>` component so the jumper visually and behaviourally matches the rest of the Pagination control across all 5 sizes.
- Drop the `'lg' | 'md' | 'sm'` clamp on the embedded SizeChanger `<Select>` and forward the full 5-tier scale (`xs | sm | md | lg | xl`).

Tokens: `paginationSizes[size]` gains a `jumperWidth` (44 / 52 / 64 / 72 / 80 px). The standalone `paginationTokens.jumperWidth` / `.jumperHeight` / `.jumperRadius` fields are removed — those concerns are now owned by the `Input` component and no longer need a duplicate Pagination-local token surface.
