---
'@timeui/react': patch
---

fix(table): scale row selection checkbox by density

Row-selection and select-all `Checkbox` instances no longer fall back to
the default `md` size, which read as visually too large in dense tables.
The size now follows `density`: `compact → xs`, `default | comfortable
→ sm`. No API change — purely visual.
