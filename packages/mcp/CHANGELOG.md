# @timeui/mcp

## 0.1.1

### Patch Changes

- First npm publication of `@timeui/mcp` — MCP server for TimeUI component documentation.
  - `timeui-mcp` (stdio transport) and `timeui-mcp-http` (Streamable HTTP transport) CLIs.
  - Four tools: `list_categories`, `list_components`, `get_component`, `search_components`.
  - Static documentation index built at package build time, covering every published TimeUI component in both `zh` and `en`.
  - Drop-in for Claude Code / Cursor via `npx -y @timeui/mcp timeui-mcp`.
