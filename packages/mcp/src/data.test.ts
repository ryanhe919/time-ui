/**
 * @author Ryan He
 * @date 2026-04-18
 * @description data.ts 单测：验证 index.json 加载、memoize 行为与缓存重置。
 */

import { __resetIndexCache, loadIndex } from './data';

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
});
