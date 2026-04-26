/**
 * @author Ryan He
 * @date 2026-04-18
 * @description tools.ts 单测：覆盖 components 4 件套与 guides 4 件套共 8 个纯函数。
 */

import { __resetIndexCache, loadIndex } from './data';
import {
  getComponent,
  getGuide,
  listCategories,
  listComponents,
  listGuides,
  listSections,
  searchComponents,
  searchGuides,
} from './tools';

// 不写死数字：直接从当前 bundled index 推导，避免新增组件 / 指南后这里反复手改。
const idx = loadIndex();
const TOTAL_COMPONENTS = idx.components.length;
const TOTAL_GUIDES = idx.guides.length;

beforeEach(() => {
  __resetIndexCache();
});

describe('listCategories()', () => {
  it('returns the zh category list by default with slug/label/componentCount', () => {
    const cats = listCategories();
    expect(cats.length).toBeGreaterThan(0);
    for (const c of cats) {
      expect(typeof c.slug).toBe('string');
      expect(typeof c.label).toBe('string');
      expect(typeof c.componentCount).toBe('number');
      expect(c.componentCount).toBeGreaterThanOrEqual(0);
    }
    // zh label 至少包含一个 CJK 字符。
    const hasCjk = cats.some((c) => /[\u4e00-\u9fff]/.test(c.label));
    expect(hasCjk).toBe(true);
  });

  it('returns English labels when locale is en', () => {
    const cats = listCategories({ locale: 'en' });
    const general = cats.find((c) => c.slug === 'general');
    expect(general).toBeTruthy();
    expect(general?.label).toBe('General');
    // en 下应不包含任何 CJK 字符。
    for (const c of cats) {
      expect(/[\u4e00-\u9fff]/.test(c.label)).toBe(false);
    }
  });

  it('component counts across categories sum to TOTAL_COMPONENTS', () => {
    const cats = listCategories();
    const sum = cats.reduce((acc, c) => acc + c.componentCount, 0);
    expect(sum).toBe(TOTAL_COMPONENTS);
  });
});

describe('listComponents()', () => {
  it('returns every component when no filter is provided', () => {
    const all = listComponents();
    expect(all.length).toBe(TOTAL_COMPONENTS);
    for (const item of all) {
      expect(typeof item.slug).toBe('string');
      expect(typeof item.title).toBe('string');
      expect(typeof item.description).toBe('string');
      expect(typeof item.category).toBe('string');
      expect(typeof item.href).toBe('string');
    }
  });

  it('filters by category slug', () => {
    const forms = listComponents({ category: 'forms' });
    expect(forms.length).toBeGreaterThan(0);
    expect(forms.length).toBeLessThan(TOTAL_COMPONENTS);
    for (const item of forms) {
      expect(item.category).toBe('forms');
    }
  });

  it('returns [] for unknown categories without throwing', () => {
    expect(() => listComponents({ category: 'nope' })).not.toThrow();
    expect(listComponents({ category: 'nope' })).toEqual([]);
  });

  it('respects locale: en returns English titles', () => {
    const enList = listComponents({ locale: 'en' });
    const btn = enList.find((c) => c.slug === 'button');
    expect(btn).toBeTruthy();
    expect(btn?.title).toBe('Button');
    // en 中 button 的 title 不应含 CJK。
    expect(/[\u4e00-\u9fff]/.test(btn?.title ?? '')).toBe(false);
  });

  it('default locale zh returns Chinese titles for button', () => {
    const zhList = listComponents();
    const btn = zhList.find((c) => c.slug === 'button');
    expect(btn).toBeTruthy();
    expect(btn?.title).toContain('按钮');
  });
});

describe('getComponent()', () => {
  it('returns zh details for button by default', () => {
    const detail = getComponent({ slug: 'button' });
    expect(detail).not.toBeNull();
    expect(detail?.slug).toBe('button');
    expect(detail?.title).toContain('按钮');
    expect(detail?.category).toBe('general');
    expect(typeof detail?.description).toBe('string');
    expect(typeof detail?.content).toBe('string');
    expect(detail?.content.length).toBeGreaterThan(0);
    expect(Array.isArray(detail?.examples)).toBe(true);
    expect(detail?.examples.length).toBeGreaterThan(0);
    for (const ex of detail?.examples ?? []) {
      expect(typeof ex.code).toBe('string');
    }
    expect(typeof detail?.href).toBe('string');
  });

  it('returns English title when locale is en', () => {
    const detail = getComponent({ slug: 'button', locale: 'en' });
    expect(detail).not.toBeNull();
    expect(detail?.title).toContain('Button');
    expect(/[\u4e00-\u9fff]/.test(detail?.title ?? '')).toBe(false);
  });

  it('returns null for unknown slugs', () => {
    expect(getComponent({ slug: 'nonexistent' })).toBeNull();
    expect(getComponent({ slug: '', locale: 'en' })).toBeNull();
  });
});

describe('searchComponents()', () => {
  it('returns button as the top hit when searching "button"', () => {
    const hits = searchComponents({ query: 'button' });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.slug).toBe('button');
    expect(typeof hits[0]?.score).toBe('number');
    expect(hits[0]?.score).toBeGreaterThan(0);
    expect(typeof hits[0]?.snippet).toBe('string');
    expect(hits[0]?.snippet.length).toBeGreaterThan(0);
  });

  it('is case-insensitive: TABLE in en locale still matches table', () => {
    const hits = searchComponents({ query: 'TABLE', locale: 'en' });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.slug).toBe('table');
  });

  it('returns [] when no component matches the query', () => {
    expect(searchComponents({ query: 'xyznowayexists' })).toEqual([]);
  });

  it('returns [] when the query tokenizes to nothing', () => {
    expect(searchComponents({ query: '   ' })).toEqual([]);
  });

  it('respects the limit option', () => {
    const capped = searchComponents({ query: 'button', limit: 2 });
    expect(capped.length).toBeLessThanOrEqual(2);
    const uncapped = searchComponents({ query: 'button' });
    // limit=2 应当不多于不限时的命中数。
    expect(capped.length).toBeLessThanOrEqual(uncapped.length);
  });

  it('clamps limit to the [1, 50] range', () => {
    // limit=0 被钳制为 1。
    const one = searchComponents({ query: 'button', limit: 0 });
    expect(one.length).toBeLessThanOrEqual(1);
    // 超大 limit 不应抛错，且不超过实际命中数。
    const many = searchComponents({ query: 'button', limit: 9999 });
    expect(many.length).toBeGreaterThan(0);
    expect(many.length).toBeLessThanOrEqual(50);
  });

  it('sorts results by score in non-increasing order', () => {
    const hits = searchComponents({ query: 'component', limit: 50 });
    expect(hits.length).toBeGreaterThan(0);
    for (let i = 1; i < hits.length; i += 1) {
      const prev = hits[i - 1]!;
      const cur = hits[i]!;
      expect(prev.score).toBeGreaterThanOrEqual(cur.score);
    }
  });

  it('matches CJK queries in zh locale and includes button in the hits', () => {
    // 注：tokenize 会把 "按钮" 拆成单字 "按" / "钮"，所以 content 里多次出现相关字的组件
    // 可能分数更高；这里只保证 button 一定被命中，不强行断言排名。
    const hits = searchComponents({ query: '按钮', limit: 50 });
    expect(hits.length).toBeGreaterThan(0);
    const slugs = hits.map((h) => h.slug);
    expect(slugs).toContain('button');
  });
});

// =============================================================================
// Guides 4 件套
// =============================================================================

describe('listSections()', () => {
  it('returns the zh section list with slug/label/guideCount by default', () => {
    const sections = listSections();
    expect(sections.length).toBeGreaterThan(0);
    for (const s of sections) {
      expect(typeof s.slug).toBe('string');
      expect(typeof s.label).toBe('string');
      expect(typeof s.guideCount).toBe('number');
      expect(s.guideCount).toBeGreaterThanOrEqual(0);
    }
    // zh 至少有一个含 CJK 的 label。
    expect(sections.some((s) => /[一-鿿]/.test(s.label))).toBe(true);
  });

  it('returns English labels when locale is en', () => {
    const sections = listSections({ locale: 'en' });
    const gettingStarted = sections.find((s) => s.slug === 'getting-started');
    expect(gettingStarted).toBeTruthy();
    for (const s of sections) {
      expect(/[一-鿿]/.test(s.label)).toBe(false);
    }
  });

  it('guide counts across sections sum to TOTAL_GUIDES', () => {
    const sum = listSections().reduce((acc, s) => acc + s.guideCount, 0);
    expect(sum).toBe(TOTAL_GUIDES);
  });
});

describe('listGuides()', () => {
  it('returns every guide when no filter is provided', () => {
    const all = listGuides();
    expect(all.length).toBe(TOTAL_GUIDES);
    for (const item of all) {
      expect(typeof item.slug).toBe('string');
      expect(typeof item.title).toBe('string');
      expect(typeof item.description).toBe('string');
      expect(typeof item.section).toBe('string');
      expect(typeof item.href).toBe('string');
    }
  });

  it('filters by section slug', () => {
    const gs = listGuides({ section: 'getting-started' });
    expect(gs.length).toBeGreaterThan(0);
    expect(gs.length).toBeLessThan(TOTAL_GUIDES);
    for (const item of gs) {
      expect(item.section).toBe('getting-started');
    }
  });

  it('returns [] for unknown sections without throwing', () => {
    expect(() => listGuides({ section: 'nope' })).not.toThrow();
    expect(listGuides({ section: 'nope' })).toEqual([]);
  });
});

describe('getGuide()', () => {
  it('returns zh details for installation by default', () => {
    const detail = getGuide({ slug: 'installation' });
    expect(detail).not.toBeNull();
    expect(detail?.slug).toBe('installation');
    expect(detail?.section).toBe('getting-started');
    expect(typeof detail?.description).toBe('string');
    expect(typeof detail?.content).toBe('string');
    expect(detail?.content.length).toBeGreaterThan(0);
    expect(Array.isArray(detail?.examples)).toBe(true);
  });

  it('returns null for unknown slugs', () => {
    expect(getGuide({ slug: 'nonexistent' })).toBeNull();
    expect(getGuide({ slug: '', locale: 'en' })).toBeNull();
  });
});

describe('searchGuides()', () => {
  it('finds installation when searching "install"', () => {
    const hits = searchGuides({ query: 'install', locale: 'en' });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.slug === 'installation')).toBe(true);
  });

  it('does not return component slugs', () => {
    const hits = searchGuides({ query: 'install', locale: 'en' });
    for (const h of hits) {
      // 所有命中都应该带 section 字段（guides 独有），不会混进 components。
      expect(typeof h.section).toBe('string');
    }
  });

  it('returns [] for queries that match nothing', () => {
    expect(searchGuides({ query: 'xyznowayexists' })).toEqual([]);
  });

  it('respects locale: zh "安装" hits installation guide', () => {
    const hits = searchGuides({ query: '安装' });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.slug === 'installation')).toBe(true);
  });
});
