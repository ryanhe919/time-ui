/**
 * @author Ryan He
 * @date 2026-04-18
 * @description stdio transport 入口：保证 stdout 仅承载 MCP 协议流，日志/错误全部走 stderr，以便 Claude Code 等 host 能正确解析。
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { createServer } from './server';

export async function runStdio(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  // SIGINT/SIGTERM 都走同一个优雅关闭路径，避免 host 进程退出时留下半开连接。
  const shutdown = async (): Promise<void> => {
    try {
      await transport.close();
    } finally {
      process.exit(0);
    }
  };
  process.once('SIGINT', () => {
    void shutdown();
  });
  process.once('SIGTERM', () => {
    void shutdown();
  });

  await server.connect(transport);

  // 关键约束：stdio 模式下 stdout = MCP 帧；任何可见日志都必须落 stderr。
  process.stderr.write('[timeui-mcp] stdio transport ready\n');
}
