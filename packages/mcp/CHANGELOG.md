# @timeui/mcp

## 0.3.0

### Minor Changes

- a23a540: Two big improvements aimed at "MCP can answer everything the docs site can":

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

## 0.2.1

### Patch Changes

- 6383a70: Clean up the docs-index description extractor so `list_components` returns a readable summary for every component.
  - Skip `import` / `export` lines and fenced code blocks when scanning for the first prose paragraph (previously the `search` component's description leaked an import statement).
  - When the leading paragraph ends in a colon followed by a list (e.g. `Layout`, `Typography`), merge in the list items or fall back to the previous complete sentence instead of returning a truncated clause.
  - Strip inline markdown (`**bold**`, `` `code` ``, `[text](url)`) and clamp at a sentence boundary within the 240-char budget.

## 0.2.0

### Minor Changes

- ece0f77: Coordinated minor release across all TimeUI packages: aligns all packages on a shared minor-bump cadence and verifies the full monorepo on pnpm 10.33 + Node 22 toolchain.

## 0.1.2

### Patch Changes

- Add an `mcp` bin alias so `npx -y @timeui/mcp` works without `-p`.

  npm/npx resolves a package's default executable by the last segment of the package name, so `@timeui/mcp` looks up `mcp` in the `bin` map. The previous release only registered `timeui-mcp` / `timeui-mcp-http`, which made `npx -y @timeui/mcp` fail with "could not determine executable to run". Both old names continue to work unchanged.

## 0.1.1

### Patch Changes

- First npm publication of `@timeui/mcp` — MCP server for TimeUI component documentation.
  - `timeui-mcp` (stdio transport) and `timeui-mcp-http` (Streamable HTTP transport) CLIs.
  - Four tools: `list_categories`, `list_components`, `get_component`, `search_components`.
  - Static documentation index built at package build time, covering every published TimeUI component in both `zh` and `en`.
  - Drop-in for Claude Code / Cursor via `npx -y @timeui/mcp timeui-mcp`.
