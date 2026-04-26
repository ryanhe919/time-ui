---
'@timeui/react': minor
---

Add `isIconOnly` prop to `Button` — renders a square icon-only button (width = height, drops min-width / padding / gap). Pair with `aria-label` for accessibility. Works with all variants, sizes, colors, and `radius="full"` for pill / FAB-style layouts.

```tsx
<Button isIconOnly aria-label="Close"><XIcon /></Button>
<Button isIconOnly radius="full" variant="shadow" color="primary" size="lg" aria-label="New">
  <PlusIcon />
</Button>
```

The button also gets a `data-icon-only` attribute for downstream styling hooks.
