---
'@timeui/react': patch
---

fix: post-1.3.0 bug bundle — Tabs RSC parsing / DateRangePicker visuals / React 19 ref / Tag mdx

Eight related fixes accumulated since 1.3.0:

- **Tabs**: `parseChildren` rewritten to identify `<Tab>` / `<TabPanel>` by props
  shape (`itemKey + label` for Tab, `itemKey` only for TabPanel) instead of
  `child.type === Tab`. Next.js 15 RSC wraps every client component in a
  `React.lazy` proxy whose `type` is an opaque object with no `displayName`,
  so reference equality and displayName comparisons both failed silently —
  declarative `<Tab itemKey><TabPanel itemKey>...</TabPanel></Tab>` rendered
  zero tabs in MDX. (Affected the Tabs basic-usage doc and any RSC-rendered
  consumer.)
- **DateRangePicker** range highlight: `isRangeStart` and `isRangeEnd` are now
  computed independently, so start-only cells get an inner straight edge that
  meets the mid-segment seamlessly instead of always being all-rounded.
- **DateRangePicker** dual-month view: new `hideOutsideMonth` prop on
  `CalendarPanel` (passed `true` by both panels in range mode) hides the
  adjacent-month "ghost" days that used to overlap between the two panels,
  giving a much cleaner visual.
- **DatePicker / DateRangePicker** Popover width: explicit
  `width: 'max-content'` on the panel wrapper overrides `popoverTokens.maxWidth`
  (320px) so the wider double-month + presets layout fits inside the Popover
  background.
- **Popover / Tooltip**: anchor cloning now reads `element.props.ref` (React 19)
  with a fallback to `element.ref` (React 18), eliminating the deprecation
  warning while staying compatible with both runtimes.
- **CalendarPanel** performance: hoist `startOfDay`/`getTime` results once per
  `useMemo` run so the 42-cell loop no longer redoes range-bound normalization
  per cell; consolidated `isAnySelected` derived boolean removes 5 repeated
  `c.isSelected || c.isRangeStart || c.isRangeEnd` checks per cell.
- **Tag** docs: moved inline `onClose` / `onPress` handlers from MDX into a
  `TagInteractiveDemo` client component so RSC no longer rejects passing event
  handlers to a client component.
- **Toast** demo: rewrote to use `toast.show({ status, title, description })`
  instead of `toast.success(msg, { description })`, matching the actual API
  signature.
