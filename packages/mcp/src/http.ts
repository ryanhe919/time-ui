/**
 * @author Ryan He
 * @date 2026-04-18
 * @description HTTP transport 入口：走 MCP 官方 Streamable HTTP 规范，用 express 承接 POST/GET /mcp；开发期默认放开 CORS，生产环境由调用方覆写。
 */

import { randomUUID } from 'node:crypto';

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import express, { type Request, type Response } from 'express';

import { createServer } from './server';

export interface RunHttpOptions {
  /** 监听端口；默认 3333。 */
  port?: number;
  /** 监听地址；默认 127.0.0.1，避免默认就对外暴露。 */
  host?: string;
}

// 简化实现：每个 initialize 请求开一个 server + transport 实例，并按 sessionId 驻留；非 initialize 请求必须带 mcp-session-id。
interface Session {
  transport: StreamableHTTPServerTransport;
}

const MCP_SESSION_HEADER = 'mcp-session-id';

export async function runHttp(options: RunHttpOptions = {}): Promise<void> {
  const port = options.port ?? 3333;
  const host = options.host ?? '127.0.0.1';

  const app = express();
  app.use(express.json({ limit: '4mb' }));

  // 放开 CORS：MCP inspector 与浏览器端 client 需要能读到 mcp-session-id 响应头。
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin ?? '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, mcp-session-id, last-event-id',
    );
    res.header('Access-Control-Expose-Headers', 'mcp-session-id');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  const sessions = new Map<string, Session>();

  // 复用已有 session；没有 session 且是 initialize 请求时新建一个。
  async function resolveTransport(
    req: Request,
    res: Response,
  ): Promise<StreamableHTTPServerTransport | null> {
    const headerValue = req.headers[MCP_SESSION_HEADER];
    const sessionId = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (sessionId && sessions.has(sessionId)) {
      return sessions.get(sessionId)!.transport;
    }

    if (!sessionId && req.method === 'POST' && isInitializeRequest(req.body)) {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          sessions.set(id, { transport });
        },
      });
      transport.onclose = () => {
        if (transport.sessionId) sessions.delete(transport.sessionId);
      };
      const server = createServer();
      await server.connect(transport);
      return transport;
    }

    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message:
          'Bad Request: no valid session. Send an initialize request first or include mcp-session-id header.',
      },
      id: null,
    });
    return null;
  }

  // Streamable HTTP 约定 POST 带 JSON-RPC body、GET/DELETE 只做 SSE 续传/清理，统一委托给 transport.handleRequest。
  const handleMcp = async (req: Request, res: Response): Promise<void> => {
    try {
      const transport = await resolveTransport(req, res);
      if (!transport) return;
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      // 不能再 write body（transport 可能已 flush header），尽量只往 stderr 记录。
      process.stderr.write(
        `[timeui-mcp-http] handler error: ${
          err instanceof Error ? (err.stack ?? err.message) : String(err)
        }\n`,
      );
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal error' },
          id: null,
        });
      }
    }
  };

  app.post('/mcp', handleMcp);
  app.get('/mcp', handleMcp);
  app.delete('/mcp', handleMcp);

  await new Promise<void>((resolve) => {
    app.listen(port, host, () => {
      // 面向人类的启动提示走 stdout 没问题——HTTP 模式下 stdout 不承载协议帧。
      console.log(`[timeui-mcp] http transport listening at http://${host}:${port}/mcp`);
      resolve();
    });
  });
}
