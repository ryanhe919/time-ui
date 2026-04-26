---
'@timeui/react': patch
---

Fix runtime crash when `useI18n().richTextEditor` is undefined.

`<RichTextEditor>`'s toolbar would throw `Cannot read properties of undefined (reading 'bold')` whenever the surrounding `@timeui/core` was older than 1.5.0 (or whenever a stale workspace dist was loaded in dev), because the new i18n block hadn't shipped in those versions but the toolbar dereferenced it directly.

Now the toolbar falls back to a built-in English label set when the i18n dictionary is missing the `richTextEditor` block, so the component degrades gracefully instead of crashing. To get localized labels, upgrade `@timeui/core` to ≥ 1.5.0 (no other change needed).
