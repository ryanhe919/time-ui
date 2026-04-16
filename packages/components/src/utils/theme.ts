/**
 * Defensive theme access helpers. Bridges the component layer onto the
 * semantic-token shape exposed by `@timeui/themes`.
 *
 * Components should reach for `t(theme).color.text.primary` etc. rather than
 * touching theme paths directly, so refactors at the design-system layer
 * stay contained.
 */
import type { Theme } from '@emotion/react';

type AnyRec = Record<string, unknown>;

const get = (obj: unknown, path: (string | number)[]): unknown => {
  let cur: unknown = obj;
  for (const k of path) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as AnyRec)[k as string];
  }
  return cur;
};

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

export const t = (theme: Theme) => {
  const palette = (theme.tokens?.palette ?? {}) as AnyRec;
  const grayRamp = (palette.gray ?? {}) as Record<string | number, string>;
  const blueRamp = (palette.blue ?? {}) as Record<string | number, string>;
  const greenRamp = (palette.green ?? {}) as Record<string | number, string>;
  const orangeRamp = (palette.orange ?? {}) as Record<string | number, string>;
  const redRamp = (palette.red ?? {}) as Record<string | number, string>;

  const bg = (theme.colors?.bg ?? {}) as AnyRec;
  const txt = (theme.colors?.text ?? {}) as AnyRec;
  const border = (theme.colors?.border ?? {}) as AnyRec;
  const action = (theme.colors?.action ?? {}) as AnyRec;
  const status = (theme.colors?.status ?? {}) as AnyRec;
  const primary = (action.primary ?? {}) as AnyRec;
  const secondary = (action.secondary ?? {}) as AnyRec;
  const danger = (action.danger ?? {}) as AnyRec;

  const spacingObj = (theme.spacing ?? theme.tokens?.spacing ?? {}) as Record<
    string | number,
    string
  >;
  const radiusObj = (theme.radius ?? theme.tokens?.radius ?? {}) as Record<string | number, string>;
  const shadowsObj = (theme.shadows ?? theme.tokens?.shadows ?? {}) as Record<
    string | number,
    string
  >;
  const typography = (theme.typography ?? theme.tokens?.typography ?? {}) as AnyRec;
  const fontSize = (typography.fontSize ?? {}) as Record<string, string>;
  const fontWeight = (typography.fontWeight ?? {}) as Record<string, number>;

  return {
    space: (k: string | number) => str(spacingObj[k], '0'),
    radius: (k: string | number) => str(radiusObj[k], '0'),
    shadow: (k: string | number) => str(shadowsObj[k], 'none'),
    fs: (k: string) => fontSize[k] ?? '14px',
    fw: (k: string) => fontWeight[k] ?? 400,
    font: str(typography.fontFamilyBase, 'system-ui, sans-serif'),
    motion: {
      duration: (k: string) =>
        str(
          get(theme, ['motion', 'duration', k]) ?? get(theme, ['tokens', 'motion', 'duration', k]),
          '150ms',
        ),
    },
    z: (k: string) => Number(get(theme, ['zIndex', k]) ?? get(theme, ['tokens', 'zIndex', k]) ?? 0),
    color: {
      // Action — primary
      primary: str(primary.default, str(blueRamp[500], '#1677ff')),
      primaryHover: str(primary.hover, str(blueRamp[400], '#4096ff')),
      primaryActive: str(primary.active, str(blueRamp[600], '#0958d9')),
      primaryDisabled: str(primary.disabled, str(blueRamp[200], '#91caff')),
      // Action — secondary
      secondary: str(secondary.default, str(grayRamp[100], '#f5f5f5')),
      secondaryHover: str(secondary.hover, str(grayRamp[200], '#e5e5e5')),
      // Action — danger family + status danger fallback
      dangerAction: str(danger.default, str(redRamp[500], '#f5222d')),
      dangerActionHover: str(danger.hover, str(redRamp[400], '#ff4d4f')),
      // Text
      text: str(txt.primary, '#171717'),
      textPrimary: str(txt.primary, '#171717'),
      textSecondary: str(txt.secondary, '#404040'),
      textMuted: str(txt.muted, '#737373'),
      textInverse: str(txt.inverse, '#ffffff'),
      textDisabled: str(txt.disabled, '#a3a3a3'),
      textLink: str(txt.link, '#0958d9'),
      // Surfaces
      bg: str(bg.canvas, '#ffffff'),
      surface: str(bg.surface, '#ffffff'),
      raised: str(bg.raised, '#ffffff'),
      sunken: str(bg.sunken, '#fafafa'),
      muted: str(bg.muted, '#f5f5f5'),
      codeBg: str(bg.muted, '#f5f5f5'),
      overlay: str(bg.overlay, 'rgba(0,0,0,0.45)'),
      // Border
      border: str(border.default, '#e5e5e5'),
      borderSubtle: str(border.subtle, '#f5f5f5'),
      borderStrong: str(border.strong, '#a3a3a3'),
      borderFocus: str(border.focus, '#1677ff'),
      // Status
      success: str(status.success, str(greenRamp[500], '#52c41a')),
      warning: str(status.warning, str(orangeRamp[500], '#faad14')),
      danger: str(status.danger, str(redRamp[500], '#f5222d')),
      info: str(status.info, str(blueRamp[500], '#1677ff')),
      successBg: str(status.successBg, str(greenRamp[50], '#f6ffed')),
      warningBg: str(status.warningBg, str(orangeRamp[50], '#fff7e6')),
      dangerBg: str(status.dangerBg, str(redRamp[50], '#fff1f0')),
      infoBg: str(status.infoBg, str(blueRamp[50], '#e6f4ff')),
      // Primitive ramp escape hatch
      neutral: (shade: number | string) => str(grayRamp[shade], '#999'),
    },
  };
};
