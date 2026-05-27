---
'@timeui/react': minor
---

feat(datepicker): add `variant` and `color` props to DatePicker, DateRangePicker, and DateTimePicker

The three date/time picker components now accept `variant` (`flat` | `bordered` | `faded` | `underlined`) and `color` (`default` | `primary` | `secondary` | `success` | `warning` | `danger`) props, matching the existing Input / Select / MultiSelect field styling system. Props are transparently forwarded to the internal `<Input>` trigger — no new tokens or style overrides are introduced.
