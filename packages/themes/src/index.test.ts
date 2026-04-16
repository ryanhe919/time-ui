import { describe, it, expect } from 'vitest';
import { lightTheme, darkTheme, createTheme, token, cssVar, themes } from './index';

function sameKeys(a: unknown, b: unknown, path = ''): void {
  const isObj = (v: unknown) =>
    v !== null && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype;
  if (!isObj(a) || !isObj(b)) return;
  const ak = Object.keys(a as object).sort();
  const bk = Object.keys(b as object).sort();
  expect(ak, `key mismatch at ${path || '<root>'}`).toEqual(bk);
  for (const k of ak) {
    sameKeys(
      (a as Record<string, unknown>)[k],
      (b as Record<string, unknown>)[k],
      path ? `${path}.${k}` : k,
    );
  }
}

describe('themes shape', () => {
  it('light and dark expose the same semantic keys', () => {
    sameKeys(lightTheme.colors, darkTheme.colors);
  });

  it('bundled themes map includes both modes', () => {
    expect(themes.light).toBe(lightTheme);
    expect(themes.dark).toBe(darkTheme);
    expect(lightTheme.mode).toBe('light');
    expect(darkTheme.mode).toBe('dark');
  });

  it('both themes expose every primitive token group', () => {
    for (const t of [lightTheme, darkTheme]) {
      expect(t.tokens).toBeDefined();
      expect(t.spacing[4]).toBe('16px');
      expect(t.typography.fontFamily.sans).toMatch(/sans-serif/);
      expect(t.motion.easing.easeInOut).toMatch(/cubic-bezier/);
    }
  });
});

describe('createTheme', () => {
  it('returns lightTheme equivalent with no overrides', () => {
    const t = createTheme();
    expect(t.mode).toBe('light');
    expect(t.colors.bg.canvas).toBe(lightTheme.colors.bg.canvas);
  });

  it('deep-merges semantic overrides onto the base', () => {
    const t = createTheme({
      colors: {
        action: { primary: { default: '#ff00aa', hover: '#ff33bb' } },
      },
    });
    expect(t.colors.action.primary.default).toBe('#ff00aa');
    expect(t.colors.action.primary.hover).toBe('#ff33bb');
    // untouched keys survive
    expect(t.colors.action.primary.active).toBe(lightTheme.colors.action.primary.active);
    expect(t.colors.bg.surface).toBe(lightTheme.colors.bg.surface);
  });

  it('supports extending darkTheme via base option', () => {
    const t = createTheme({ base: 'dark', colors: { bg: { canvas: '#000' } } });
    expect(t.mode).toBe('dark');
    expect(t.colors.bg.canvas).toBe('#000');
    expect(t.colors.text.primary).toBe(darkTheme.colors.text.primary);
  });

  it('does not mutate the base theme', () => {
    const before = lightTheme.colors.bg.canvas;
    createTheme({ colors: { bg: { canvas: '#123456' } } });
    expect(lightTheme.colors.bg.canvas).toBe(before);
  });
});

describe('helpers', () => {
  it('token() resolves dotted paths', () => {
    expect(token(lightTheme, 'colors.bg.surface')).toBe(lightTheme.colors.bg.surface);
    expect(token(lightTheme, 'spacing.4')).toBe('16px');
    expect(token(lightTheme, 'nope.nope')).toBeUndefined();
  });

  it('cssVar() formats a CSS custom-property reference', () => {
    expect(cssVar('colors.bg.surface')).toBe('var(--timeui-colors-bg-surface)');
    expect(cssVar('spacing.4', 'x')).toBe('var(--x-spacing-4)');
  });
});
