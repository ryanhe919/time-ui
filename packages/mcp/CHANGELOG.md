# @timeui/mcp

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
