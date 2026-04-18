#!/usr/bin/env node
/**
 * @author Ryan He
 * @date 2026-04-18
 * @description stdio transport CLI：供 Claude Code / Cursor 等 host 以子进程方式挂载 TimeUI MCP server。
 */

import { runStdio } from '../dist/stdio.js';

runStdio().catch((err) => {
  process.stderr.write(
    `[timeui-mcp] fatal: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`,
  );
  process.exit(1);
});
