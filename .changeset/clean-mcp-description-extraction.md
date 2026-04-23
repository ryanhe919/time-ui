---
'@timeui/mcp': patch
---

Clean up the docs-index description extractor so `list_components` returns a readable summary for every component.

- Skip `import` / `export` lines and fenced code blocks when scanning for the first prose paragraph (previously the `search` component's description leaked an import statement).
- When the leading paragraph ends in a colon followed by a list (e.g. `Layout`, `Typography`), merge in the list items or fall back to the previous complete sentence instead of returning a truncated clause.
- Strip inline markdown (`**bold**`, `` `code` ``, `[text](url)`) and clamp at a sentence boundary within the 240-char budget.
