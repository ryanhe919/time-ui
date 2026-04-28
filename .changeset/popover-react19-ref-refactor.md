---
'@timeui/react': patch
---

fix(popover): tighten React 18 / 19 ref-reading branch

Splits the dual-version ref read into an explicit `majorReactVersion >= 19`
check so React 18 no longer hits the `props.ref` path (which warns) and
React 19 stops falling through to the deprecated `element.ref`. Behaviour
is unchanged on either runtime — this is a deprecation-warning fix only.
