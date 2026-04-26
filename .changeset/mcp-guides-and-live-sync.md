---
'@timeui/mcp': minor
---

Two big improvements aimed at "MCP can answer everything the docs site can":

**Guides — non-component documentation is now queryable**

Indexes the `getting-started` (introduction / installation / mcp) and `chat` (overview / composer / markdown / api) sections in addition to components. Adds 4 new MCP tools that mirror the existing component tools:

- `list_sections` — top-level guide sections + page count
- `list_guides` — all guide pages, optionally filtered by section
- `get_guide` — full guide content + code examples by slug
- `search_guides` — scored full-text search restricted to guide pages (won't return components)

LLMs can now answer "how do I install" / "how do I wire up the MCP server" / "where's the chat API" without falling back to the component index.

**Live sync — fresh docs without reinstalling the package**

`runStdio` / `runHttp` now `await initIndex()` at startup, which fetches the latest index from `http://aliyun.ryanstone.cn/mcp-index.json` (3 s timeout, falls back to bundled on failure). The build script publishes the full payload at `apps/docs/public/mcp-index.json` so it ships with every docs deploy.

- `TIMEUI_MCP_INDEX_URL=https://your-host/mcp-index.json` — point at a self-hosted docs deployment.
- `TIMEUI_MCP_INDEX_URL=off` (or `none` / `local`) — disable the remote, always use the bundled snapshot (legacy behavior).

New exports: `initIndex`, `DEFAULT_REMOTE_INDEX_URL`, `listSections`, `listGuides`, `getGuide`, `searchGuides`, `GuideEntry`, `SectionEntry`, `PageTranslation`, `InitIndexOptions`, plus the corresponding `*Summary` / `*Detail` / `*SearchHit` types.
