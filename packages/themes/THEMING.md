# Theming TimeUI

TimeUI splits design decisions into two layers:

| Layer         | Package          | What it contains                                                   |
| ------------- | ---------------- | ------------------------------------------------------------------ |
| **Primitive** | `@timeui/tokens` | Raw, theme-agnostic values: color ramps, type scale, spacing grid. |
| **Semantic**  | `@timeui/themes` | Role-based tokens (`colors.bg.surface`, `colors.action.primary`).  |

Components only ever consume **semantic** tokens via Emotion's theme. That
means you can re-skin TimeUI without touching a single component.

## Quick start

```tsx
import { TimeUIProvider } from '@timeui/core';

<TimeUIProvider mode="dark">
  <App />
</TimeUIProvider>;
```

Modes: `"light"` (default), `"dark"`, `"auto"` (follows `prefers-color-scheme`).

## Consuming the theme in a component

```tsx
import styled from '@emotion/styled';

const Card = styled.div`
  background: ${(p) => p.theme.colors.bg.surface};
  color: ${(p) => p.theme.colors.text.primary};
  border: ${(p) => p.theme.borders.width.thin} solid ${(p) => p.theme.colors.border.default};
  border-radius: ${(p) => p.theme.radius.lg};
  padding: ${(p) => p.theme.spacing[4]};
`;
```

Module augmentation in `types.ts` makes every `theme.*` access fully typed.

## Customizing a theme

```tsx
import { createTheme } from '@timeui/themes';
import { TimeUIProvider } from '@timeui/core';

const brand = createTheme({
  colors: {
    action: {
      primary: {
        default: '#ff2e88',
        hover: '#ff57a3',
        active: '#cc226d',
        disabled: '#ffb5d1',
      },
    },
  },
});

<TimeUIProvider theme={brand}>
  <App />
</TimeUIProvider>;
```

`createTheme` deep-merges overrides onto the base (default `lightTheme`).
Use `{ base: 'dark' }` to extend the dark theme instead, or pass a full
`TimeUITheme` object as `base` for layered customizations.

## Adding a custom theme

Just build one with `createTheme` (or assemble a full `TimeUITheme` object)
and pass it to `<TimeUIProvider theme={yourTheme}>`. All semantic keys are
required; TypeScript will guide you.

## Semantic token map

```
colors.bg        — canvas / surface / raised / sunken / primary / muted / overlay
colors.text      — primary / secondary / muted / inverse / link / disabled
colors.border    — default / subtle / strong / focus
colors.action.*  — primary | secondary | danger × default / hover / active / disabled
colors.status    — success / warning / danger / info (+ *Bg variants)
```

Non-color semantic surfaces (`typography`, `spacing`, `radius`, `shadows`,
`zIndex`, `breakpoints`, `motion`, `borders`) mirror the primitive groups
directly, so `theme.spacing[4]` and friends work everywhere.

## Escape hatch: primitives

Need a raw palette value? Reach into `theme.tokens`:

```ts
theme.tokens.palette.blue[500]; // '#1677ff'
```

Prefer semantic tokens wherever possible — primitives bypass dark-mode and
custom-theme logic.
