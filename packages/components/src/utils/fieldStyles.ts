/**
 * Shared variant styles for form-field surfaces (Input / Textarea / Select).
 *
 * Centralising the recipe here guarantees the 4 variants look identical
 * across the three components and that adding a 5th variant later only
 * requires touching one file.
 *
 * All values flow through the TimeUI `Theme`; **no hard-coded colors,
 * widths, or durations** appear in this function (per the §1.1 design
 * constraint in the form-components spec).
 */
import { css, type SerializedStyles, type Theme } from '@emotion/react';

export type FieldVariant = 'flat' | 'bordered' | 'faded' | 'underlined';

export type FieldColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

export interface GetFieldVariantStylesArgs {
  theme: Theme;
  variant: FieldVariant;
  /** Semantic color. Drives focus tinting across all four variants:
   *  `bordered` / `faded` → focused border color; `underlined` → focused
   *  underline color; `flat` → focus outline color. `'default'` falls back
   *  to the theme's global `focus` color. `isInvalid` still hard-overrides
   *  everything with the danger palette. */
  color: FieldColor;
  isInvalid?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
}

/**
 * Build the Emotion `SerializedStyles` snippet that implements one of the
 * four form-field variants.
 *
 * Usage:
 *   <input css={[getFieldVariantStyles({ theme, variant, color }), extra]} />
 *
 * The returned block only sets layout-neutral visuals (background, border,
 * outline, cursor, opacity, transition). Sizing (height / padding / font)
 * is the caller's responsibility so the same recipe can drive Input,
 * Textarea, and Select without coupling to their individual size tables.
 */
export function getFieldVariantStyles({
  theme,
  variant,
  color,
  isInvalid = false,
  isDisabled = false,
  isReadOnly = false,
}: GetFieldVariantStylesArgs): SerializedStyles {
  const colors = theme.colors;
  const borderThin = theme.borders.width.thin;
  const borderThick = theme.borders.width.thick;
  const danger = colors.status.danger;

  // Semantic tint. `default` keeps the global brand focus color so nothing
  // changes for the baseline; the five other colors light up the focus ring
  // / border in their own palette shade.
  const palette = color === 'default' ? null : colors[color];
  const focusColor = palette ? palette[500] : colors.focus;
  const focusBgSoft = palette ? palette[100] : null;
  const duration = theme.motion.duration.normal;
  // `motion.easing.standard` is the spec-level name; map to the existing
  // `easeInOut` curve (which is the Material-ish "standard" easing).
  const easing =
    (theme.motion.easing as { standard?: string }).standard ?? theme.motion.easing.easeInOut;

  // Per-variant recipe. Each branch sets exactly the visual surface knobs it
  // needs and leaves the rest at the shared defaults below.
  let background = 'transparent';
  let border = '0 solid transparent';
  let borderBottom: string | null = null;
  let hoverBackground: string | null = null;
  let hoverBorder: string | null = null;
  let hoverBorderBottom: string | null = null;
  let focusBorderBottom: string | null = null;
  // Border / background tint applied only while focused (inner tint, separate
  // from the outline ring). Null means "keep whatever hover / base state set".
  let focusBorderColor: string | null = null;
  let focusBackground: string | null = null;
  let useOutline = true;

  switch (variant) {
    case 'flat': {
      background = colors.bg.sunken;
      border = `${borderThin} solid transparent`;
      hoverBackground = colors.bg.muted;
      if (palette) {
        // Flat has no visible border, so tint the background softly on focus
        // in addition to the focus outline ring.
        focusBackground = focusBgSoft;
      }
      break;
    }
    case 'bordered': {
      background = 'transparent';
      border = palette
        ? `${borderThin} solid ${palette[500]}`
        : `${borderThin} solid ${colors.border.default}`;
      hoverBorder = palette ? palette[600] : colors.border.strong;
      if (palette) {
        focusBorderColor = focusColor;
      }
      break;
    }
    case 'faded': {
      background = palette ? palette[100] : colors.default[100];
      border = palette
        ? `${borderThin} solid ${palette[200]}`
        : `${borderThin} solid ${colors.default[500]}`;
      hoverBorder = palette ? palette[500] : colors.border.strong;
      if (palette) {
        focusBorderColor = focusColor;
        focusBackground = focusBgSoft;
      }
      break;
    }
    case 'underlined': {
      background = 'transparent';
      border = '0 solid transparent';
      borderBottom = `${borderThin} solid ${colors.border.default}`;
      hoverBorderBottom = colors.border.strong;
      focusBorderBottom = `${borderThick} solid ${focusColor}`;
      useOutline = false;
      break;
    }
  }

  // Invalid takes over: all variants' border / underline flip to danger.
  // Focus outline stays the brand `focus` color per Apple HIG (spec §1.2).
  if (isInvalid) {
    if (variant === 'underlined') {
      borderBottom = `${borderThin} solid ${danger}`;
      hoverBorderBottom = danger;
      focusBorderBottom = `${borderThick} solid ${danger}`;
    } else if (variant === 'flat') {
      // Flat has no border to flip, but we add one so the error is obvious.
      border = `${borderThin} solid ${danger}`;
      hoverBorder = danger;
    } else {
      border = `${borderThin} solid ${danger}`;
      hoverBorder = danger;
    }
  }

  return css`
    background-color: ${background};
    border: ${border};
    ${borderBottom ? `border-bottom: ${borderBottom};` : ''}
    ${isDisabled ? 'opacity: 0.5; cursor: not-allowed;' : ''}
    ${isReadOnly ? 'cursor: default;' : ''}
    transition:
      background-color ${duration} ${easing},
      color ${duration} ${easing},
      border-color ${duration} ${easing},
      outline-color ${duration} ${easing},
      box-shadow ${duration} ${easing};

    &:hover:not(:disabled):not([aria-disabled='true']) {
      ${hoverBackground ? `background-color: ${hoverBackground};` : ''}
      ${hoverBorder ? `border-color: ${hoverBorder};` : ''}
      ${hoverBorderBottom ? `border-bottom-color: ${hoverBorderBottom};` : ''}
    }

    ${useOutline
      ? `
          &:focus-visible,
          &:focus-within {
            outline: 2px solid ${focusColor};
            outline-offset: 2px;
            ${focusBorderColor ? `border-color: ${focusBorderColor};` : ''}
            ${focusBackground ? `background-color: ${focusBackground};` : ''}
          }
        `
      : `
          &:focus-visible,
          &:focus-within {
            ${focusBorderBottom ? `border-bottom: ${focusBorderBottom};` : ''}
          }
        `}

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `;
}
