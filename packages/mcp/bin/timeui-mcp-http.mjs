#!/usr/bin/env node
/**
 * @author Ryan He
 * @date 2026-04-18
 * @description HTTP transport CLI：本地常驻一个 Streamable HTTP MCP server，便于 IDE 插件或多 host 并发调用。
 */

import { runHttp } from '../dist/http.js';

// 手写一个极简 argv 解析：支持 --port=3333 / --port 3333 / --host=0.0.0.0 / --host 0.0.0.0。
// 不引 commander/yargs 是为了让 bin 依赖尽量薄、启动更快。
function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      opts.help = true;
      continue;
    }
    const eq = arg.indexOf('=');
    const key = eq >= 0 ? arg.slice(0, eq) : arg;
    const value = eq >= 0 ? arg.slice(eq + 1) : argv[i + 1];
    if (key === '--port') {
      opts.port = Number(value);
      if (eq < 0) i += 1;
    } else if (key === '--host') {
      opts.host = value;
      if (eq < 0) i += 1;
    }
  }
  return opts;
}

const { help, port, host } = parseArgs(process.argv.slice(2));

if (help) {
  process.stdout.write(
    'Usage: timeui-mcp-http [--port <number>] [--host <addr>]\n',
  );
  process.exit(0);
}

if (port !== undefined && (!Number.isFinite(port) || port <= 0)) {
  process.stderr.write(`[timeui-mcp-http] invalid --port value\n`);
  process.exit(1);
}

runHttp({ port, host }).catch((err) => {
  process.stderr.write(
    `[timeui-mcp-http] fatal: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`,
  );
  process.exit(1);
});
