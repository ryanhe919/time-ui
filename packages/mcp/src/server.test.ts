/**
 * @author Ryan He
 * @date 2026-04-18
 * @description server.ts 集成 smoke：通过 SDK 自带的 InMemoryTransport 把 Client 接到 createServer() 上，验证 tools/list 与 tools/call 返回正确。
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { createServer } from './server';

async function connectPair() {
  const server = createServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'timeui-mcp-test-client', version: '0.0.0' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { server, client };
}

describe('createServer()', () => {
  it('returns a truthy Server instance without throwing', () => {
    expect(() => createServer()).not.toThrow();
    const server = createServer();
    expect(server).toBeTruthy();
  });

  it('exposes all 4 tools via tools/list', async () => {
    const { server, client } = await connectPair();
    try {
      const { tools } = await client.listTools();
      const names = tools.map((t) => t.name).sort();
      expect(names).toEqual(
        ['get_component', 'list_categories', 'list_components', 'search_components'].sort(),
      );
      for (const tool of tools) {
        expect(typeof tool.description).toBe('string');
        expect(tool.description.length).toBeGreaterThan(0);
        expect(tool.inputSchema).toBeTruthy();
        // zod-to-json-schema 顶层应为 object 且剥离了 $schema。
        expect((tool.inputSchema as { type?: string }).type).toBe('object');
        expect(Object.prototype.hasOwnProperty.call(tool.inputSchema, '$schema')).toBe(false);
      }
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('tools/call list_categories returns JSON payload in text content', async () => {
    const { server, client } = await connectPair();
    try {
      const result = await client.callTool({
        name: 'list_categories',
        arguments: { locale: 'en' },
      });
      expect(result.isError).not.toBe(true);
      const content = result.content as Array<{ type: string; text: string }>;
      expect(Array.isArray(content)).toBe(true);
      expect(content[0]?.type).toBe('text');
      const parsed = JSON.parse(content[0]!.text) as Array<{
        slug: string;
        label: string;
        componentCount: number;
      }>;
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
      const general = parsed.find((c) => c.slug === 'general');
      expect(general?.label).toBe('General');
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('tools/call with an unknown tool returns isError', async () => {
    const { server, client } = await connectPair();
    try {
      const result = await client.callTool({
        name: 'not_a_tool',
        arguments: {},
      });
      expect(result.isError).toBe(true);
      const content = result.content as Array<{ type: string; text: string }>;
      expect(content[0]?.text).toContain('Unknown tool');
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('tools/call list_components filters by category', async () => {
    const { server, client } = await connectPair();
    try {
      const result = await client.callTool({
        name: 'list_components',
        arguments: { category: 'forms' },
      });
      expect(result.isError).not.toBe(true);
      const content = result.content as Array<{ type: string; text: string }>;
      const parsed = JSON.parse(content[0]!.text) as Array<{
        slug: string;
        category: string;
      }>;
      expect(parsed.length).toBeGreaterThan(0);
      for (const item of parsed) {
        expect(item.category).toBe('forms');
      }
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('tools/call search_components returns ranked hits', async () => {
    const { server, client } = await connectPair();
    try {
      const result = await client.callTool({
        name: 'search_components',
        arguments: { query: 'button', limit: 3, locale: 'en' },
      });
      expect(result.isError).not.toBe(true);
      const content = result.content as Array<{ type: string; text: string }>;
      const parsed = JSON.parse(content[0]!.text) as Array<{
        slug: string;
        score: number;
      }>;
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed.length).toBeLessThanOrEqual(3);
      expect(parsed[0]?.slug).toBe('button');
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('tools/call with invalid arguments returns a zod validation error', async () => {
    const { server, client } = await connectPair();
    try {
      // get_component 要求 slug 是非空字符串。
      const result = await client.callTool({
        name: 'get_component',
        arguments: { slug: 123 },
      });
      expect(result.isError).toBe(true);
      const content = result.content as Array<{ type: string; text: string }>;
      expect(content[0]?.text).toMatch(/Invalid arguments|slug/);
    } finally {
      await client.close();
      await server.close();
    }
  });
});
