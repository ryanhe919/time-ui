# @timeui/mcp

Model Context Protocol (MCP) server for the TimeUI component library, plus the shared static documentation index it reads from.

At build time, this package scans the `apps/docs` MDX tree and extracts component titles, descriptions, prose, and runnable code examples into a static JSON index (`data/index.json`). The same index then backs four LLM-facing tools:

| Tool                | Purpose                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| `list_categories`   | Enumerate all component categories (forms, overlays, feedback, ...) with counts. Call first to orient. |
| `list_components`   | List component slugs + titles + short descriptions, optionally filtered by category.                   |
| `get_component`     | Fetch full docs, examples, and docs URL for a single component slug.                                   |
| `search_components` | Full-text search when the user describes behavior but not a component name.                            |

All tools accept an optional `locale: 'zh' | 'en'` (default `zh`).

Two transports are shipped:

- `timeui-mcp` stdio transport, for Claude Code / Cursor / Windsurf subprocess mounts.
- `timeui-mcp-http` Streamable HTTP transport on `POST/GET/DELETE /mcp`, for IDEs and multi-host setups.

## Install

```bash
pnpm add -D @timeui/mcp   # or npm i -D @timeui/mcp
```

Or run directly via `npx -y @timeui/mcp ...` (recommended for host configs).

## stdio transport

### Claude Code

```bash
claude mcp add timeui -- npx -y @timeui/mcp timeui-mcp
```

### Cursor / Windsurf (`.cursor/mcp.json` or `~/.codeium/windsurf/mcp.json`)

```json
{
  "mcpServers": {
    "timeui": {
      "command": "npx",
      "args": ["-y", "@timeui/mcp", "timeui-mcp"]
    }
  }
}
```

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "timeui": {
      "command": "npx",
      "args": ["-y", "@timeui/mcp", "timeui-mcp"]
    }
  }
}
```

In stdio mode, `stdout` is reserved for MCP protocol framing. All logs and errors go to `stderr`.

## HTTP transport

Start a local server (defaults: host `127.0.0.1`, port `3333`):

```bash
npx -y @timeui/mcp timeui-mcp-http --port 3333
# or: timeui-mcp-http --port=3334 --host=0.0.0.0
```

The server exposes `POST /mcp` for JSON-RPC messages and `GET /mcp` for Streamable HTTP / SSE continuation. CORS is permissive by default (any origin; exposes `mcp-session-id`).

### Curl walkthrough: `list_categories`

```bash
# 1. Initialize a session. The server returns an mcp-session-id header.
curl -i -X POST http://127.0.0.1:3333/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": { "name": "curl", "version": "0.0.0" }
    }
  }'

# Capture the header: mcp-session-id: <uuid>
export SID=<paste-here>

# 2. Send the initialized notification (required by the protocol).
curl -X POST http://127.0.0.1:3333/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H "mcp-session-id: $SID" \
  -d '{"jsonrpc":"2.0","method":"notifications/initialized"}'

# 3. List tools.
curl -X POST http://127.0.0.1:3333/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H "mcp-session-id: $SID" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# 4. Call list_categories.
curl -X POST http://127.0.0.1:3333/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H "mcp-session-id: $SID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": { "name": "list_categories", "arguments": { "locale": "en" } }
  }'
```

## Tool reference

### `list_categories`

- Input: `{ locale?: 'zh' | 'en' }`
- Output (example):
  ```json
  [
    { "slug": "general", "label": "通用", "componentCount": 2 },
    { "slug": "forms", "label": "表单", "componentCount": 11 },
    { "slug": "overlays", "label": "浮层", "componentCount": 5 }
  ]
  ```

### `list_components`

- Input: `{ locale?: 'zh' | 'en', category?: string }`
- Output: array of `{ slug, title, description, category, href }`.

### `get_component`

- Input: `{ slug: string, locale?: 'zh' | 'en' }`
- Output: `{ slug, title, category, description, content, examples: [{ code }], href }` or `null` if not found.

### `search_components`

- Input: `{ query: string, locale?: 'zh' | 'en', limit?: number }` (limit default 10, max 50)
- Output: array of `{ slug, title, description, snippet, score, href }`, sorted by score desc.

## Programmatic use

If you need to embed the server in your own process (e.g. a plugin host), import `createServer` and wire it to any MCP transport yourself:

```ts
import { createServer } from '@timeui/mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = createServer();
await server.connect(new StdioServerTransport());
```

## Development

```bash
pnpm --filter @timeui/mcp build:index    # Regenerate data/index.json from apps/docs MDX.
pnpm --filter @timeui/mcp build          # Regenerate index + tsup ESM/CJS output.
pnpm --filter @timeui/mcp typecheck
```
