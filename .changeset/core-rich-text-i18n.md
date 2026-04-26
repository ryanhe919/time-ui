---
'@timeui/core': minor
---

Add `richTextEditor` block to `Messages` (zh + en) covering the toolbar label, every standard formatting button (bold / italic / underline / strike / h1-h3 / lists / blockquote / code / horizontalRule / link / clearFormat / undo / redo) and the link prompt.

Consumed by `<RichTextEditor>` in `@timeui/react/rich-text-editor` so the toolbar tooltips automatically follow the surrounding `<ConfigProvider locale="...">`. Custom labels can still be passed via the `labels` prop.
