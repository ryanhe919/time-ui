/**
 * @author Ryan He
 * @date 2026-04-18
 * @description data.ts 单测：验证 index.json 加载、memoize、initIndex 远程拉取与回退行为。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { __resetIndexCache, initIndex, loadIndex, type DocsIndex } from './data';

describe('loadIndex()', () => {
  beforeEach(() => {
    __resetIndexCache();
  });

  it('returns an object with components / categories / generatedAt', () => {
    const index = loadIndex();
    expect(index).toBeTruthy();
    expect(Array.isArray(index.components)).toBe(true);
    expect(index.categories).toBeTruthy();
    expect(typeof index.generatedAt).toBe('string');
    expect(index.generatedAt.length).toBeGreaterThan(0);
  });

  it('populates categories for both zh and en locales', () => {
    const index = loadIndex();
    expect(Array.isArray(index.categories.zh)).toBe(true);
    expect(Array.isArray(index.categories.en)).toBe(true);
    expect(index.categories.zh.length).toBeGreaterThan(0);
    expect(index.categories.en.length).toBe(index.categories.zh.length);
    for (const cat of index.categories.zh) {
      expect(typeof cat.slug).toBe('string');
      expect(typeof cat.label).toBe('string');
    }
  });

  it('every ComponentEntry has slug, category, and zh/en translations', () => {
    const index = loadIndex();
    expect(index.components.length).toBeGreaterThan(0);
    for (const entry of index.components) {
      expect(typeof entry.slug).toBe('string');
      expect(entry.slug.length).toBeGreaterThan(0);
      expect(typeof entry.category).toBe('string');
      expect(entry.translations).toBeTruthy();
      expect(entry.translations.zh).toBeTruthy();
      expect(entry.translations.en).toBeTruthy();
      expect(typeof entry.translations.zh.title).toBe('string');
      expect(typeof entry.translations.en.title).toBe('string');
      expect(typeof entry.translations.zh.href).toBe('string');
      expect(typeof entry.translations.en.href).toBe('string');
      expect(Array.isArray(entry.translations.zh.examples)).toBe(true);
      expect(Array.isArray(entry.translations.en.examples)).toBe(true);
    }
  });

  it('memoizes: successive calls return the same reference', () => {
    const a = loadIndex();
    const b = loadIndex();
    expect(b).toBe(a);
    expect(b.components).toBe(a.components);
  });

  it('__resetIndexCache() forces the next loadIndex() to return a fresh object', () => {
    const a = loadIndex();
    __resetIndexCache();
    const b = loadIndex();
    expect(b).not.toBe(a);
    // 内容依旧一致，只是对象引用不同。
    expect(b.components.length).toBe(a.components.length);
    expect(b.generatedAt).toBe(a.generatedAt);
  });

  it('exposes guides[] and sections{} from the bundled index', () => {
    const index = loadIndex();
    expect(Array.isArray(index.guides)).toBe(true);
    expect(index.guides.length).toBeGreaterThan(0);
    expect(Array.isArray(index.sections.zh)).toBe(true);
    expect(Array.isArray(index.sections.en)).toBe(true);
    for (const g of index.guides) {
      expect(typeof g.slug).toBe('string');
      expect(typeof g.section).toBe('string');
      expect(g.translations.zh).toBeTruthy();
      expect(g.translations.en).toBeTruthy();
    }
  });
});

describe('initIndex()', () => {
  const ORIGINAL_ENV = process.env.TIMEUI_MCP_INDEX_URL;

  beforeEach(() => {
    __resetIndexCache();
    delete process.env.TIMEUI_MCP_INDEX_URL;
  });

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) delete process.env.TIMEUI_MCP_INDEX_URL;
    else process.env.TIMEUI_MCP_INDEX_URL = ORIGINAL_ENV;
  });

  function makeFakeIndex(marker: string): DocsIndex {
    return {
      generatedAt: marker,
      categories: { zh: [], en: [] },
      sections: { zh: [], en: [] },
      components: [],
      guides: [],
    };
  }

  it('uses fetched payload when remote responds 200', async () => {
    const fake = makeFakeIndex('REMOTE-OK');
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify(fake), { status: 200 }),
    ) as unknown as typeof fetch;
    const log = vi.fn();
    const index = await initIndex({
      remoteUrl: 'http://example.invalid/mcp-index.json',
      fetchImpl,
      log,
    });
    expect(index.generatedAt).toBe('REMOTE-OK');
    // 后续 sync loadIndex 应当看到同一份缓存（即远程版本）。
    expect(loadIndex().generatedAt).toBe('REMOTE-OK');
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('falls back to bundled snapshot when remote returns non-2xx', async () => {
    const fetchImpl = vi.fn(
      async () => new Response('Not Found', { status: 404 }),
    ) as unknown as typeof fetch;
    const log = vi.fn();
    const index = await initIndex({
      remoteUrl: 'http://example.invalid/mcp-index.json',
      fetchImpl,
      log,
    });
    expect(index.components.length).toBeGreaterThan(0);
    expect(log).toHaveBeenCalled();
    expect(String(log.mock.calls[0]?.[0])).toMatch(/falling back/);
  });

  it('falls back to bundled snapshot when fetch rejects', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof fetch;
    const log = vi.fn();
    const index = await initIndex({
      remoteUrl: 'http://example.invalid/mcp-index.json',
      fetchImpl,
      log,
    });
    expect(index.components.length).toBeGreaterThan(0);
    expect(log).toHaveBeenCalled();
  });

  it('skips network entirely when remoteUrl is the "off" sentinel', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const log = vi.fn();
    const index = await initIndex({ remoteUrl: 'off', fetchImpl, log });
    expect(index.components.length).toBeGreaterThan(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('honors TIMEUI_MCP_INDEX_URL env when remoteUrl opt is absent', async () => {
    process.env.TIMEUI_MCP_INDEX_URL = 'http://from-env.invalid/mcp-index.json';
    const fake = makeFakeIndex('FROM-ENV');
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      // 验证 fetch 拿到的是 env 中的 URL。
      const url = typeof input === 'string' ? input : input.toString();
      expect(url).toBe('http://from-env.invalid/mcp-index.json');
      return new Response(JSON.stringify(fake), { status: 200 });
    }) as unknown as typeof fetch;
    const index = await initIndex({ fetchImpl, log: vi.fn() });
    expect(index.generatedAt).toBe('FROM-ENV');
  });

  it('treats env value "off" as offline', async () => {
    process.env.TIMEUI_MCP_INDEX_URL = 'off';
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    await initIndex({ fetchImpl, log: vi.fn() });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
