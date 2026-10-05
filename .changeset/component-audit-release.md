---
'@timeui/react': minor
---

Fix component rendering and interaction regressions across forms, overlays, tables, navigation, PDF and chat: preserve icon button dimensions and keyboard focus, prevent textarea/upload overlap, synchronize date and async option state, update floating and sticky positioning after resize, and keep streamed content and replacement PDFs current.

Add PDF.js 5/6 and Tiptap 3 compatibility while retaining PDF.js 4 and Tiptap 2 support. Require patched Tiptap versions (2.27.3 or 3.30.4 and newer within their major) to prevent inherited executable DOM attributes.

Refresh the bilingual MCP documentation index with the supported PDF.js and patched Tiptap version requirements.
