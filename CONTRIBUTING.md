# Contributing to TimeUI

Thanks for considering a contribution. TimeUI is an enterprise component library; we hold a high bar.

## RFC process

Any new component, breaking API change, or cross-cutting design-system decision (theme tokens,
accessibility contract, layout primitives) must start as an RFC:

1. Open an issue using the "RFC" template describing the problem, prior art, proposed API, and alternatives.
2. Link mockups or Storybook prototypes where helpful.
3. Maintainers will tag the RFC for discussion; once accepted it is labeled `rfc:accepted`.
4. Implementation PRs reference the RFC issue.

Small additions (one variant, a prop) can skip the RFC if they're obviously compatible.

## Component quality checklist

Every component PR must tick:

- [ ] TypeScript strict, no `any`, props fully documented via JSDoc.
- [ ] Forwards `ref` where it wraps a DOM node.
- [ ] Supports controlled & uncontrolled patterns if stateful.
- [ ] Styles via Emotion, consuming theme tokens — no hard-coded colors or spacing.
- [ ] Works in both `lightTheme` and `darkTheme`.
- [ ] Respects `prefers-reduced-motion` for any animation.
- [ ] Accessibility:
  - [ ] Correct ARIA roles/attributes.
  - [ ] Keyboard navigable, visible focus ring.
  - [ ] Tested with a screen reader.
  - [ ] Passes axe with zero violations.
- [ ] Vitest + Testing Library tests cover: render, variants, interaction, a11y baseline.
- [ ] Storybook story with controls for every variant/size/state.
- [ ] Exported from `@timeui/react`.
- [ ] `pnpm changeset` entry recorded.
- [ ] No new `dependencies` without maintainer approval; prefer `peerDependencies`.

## Commit convention

Conventional Commits, enforced by commitlint. Examples:

```
feat(button): add loading state
fix(select): prevent focus trap on disabled options
docs(theme): document module augmentation
```

## Release flow

Versioning is handled by Changesets. CI publishes to npm on merge to `main`
when pending changesets exist.
