---
'@timeui/react': patch
---

fix(chat-message): force 24-hour timestamp formatting to avoid SSR hydration mismatch

`formatTimestamp` previously called `toLocaleTimeString([], { hour, minute })`
which inherits the runtime's default locale — Node servers (often `en-US`)
produced `09:30 AM` while browsers in non-US locales produced `09:30`,
causing React hydration mismatches whenever a `<ChatMessage timestamp>`
prop was a Date or number value.

Pinning `hour12: false` keeps both sides on the 24-hour scale and drops
the AM/PM suffix entirely, so server and client serialize identically.
