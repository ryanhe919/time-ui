---
'@timeui/react': minor
---

Add `PdfViewer` and `MarkdownViewer` components.

- **`PdfViewer`** — canvas-based PDF document viewer built on `pdfjs-dist` (lazy dynamic-imported). Paginated reader with zoom (numeric / `page-fit` / `page-width`), optional download / print buttons, full keyboard navigation (`←`/`→`, `Page Up/Down`, `+`/`-`, `0`), and a `workerSrc` override for CDN-hosted workers. `pdfjs-dist` is an **optional peer**; install it alongside `@timeui/react`.
- **`MarkdownViewer`** — document-oriented markdown reader built on `react-markdown` + `remark-gfm`. Reading-friendly typography, optional sticky table of contents (`IntersectionObserver`-based active-section tracking), copy / download / refresh toolbar (refresh re-fetches via internal nonce in URL mode), inline string or remote URL sources, fenced code delegated to `CodeBlock`. `react-markdown` and `remark-gfm` remain **optional peers**.

Both viewers ship as dedicated subpath exports only — `@timeui/react/pdf-viewer` and `@timeui/react/markdown-viewer`. They are intentionally **not** re-exported from the main `@timeui/react` entry so the optional peers (`pdfjs-dist`, `react-markdown`, `remark-gfm`) never leak into the core bundle.
