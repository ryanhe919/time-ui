/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Utils 组件的核心渲染与交互逻辑。
 */

import { css, type SerializedStyles, type Theme } from '@emotion/react';

export type FieldVariant = 'flat' | 'bordered' | 'faded' | 'underlined';

export type FieldColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

export interface GetFieldVariantStylesArgs {
  theme: Theme;
  variant: FieldVariant;
  color: FieldColor;
  isInvalid?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
}

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

  const palette = color === 'default' ? null : colors[color];
  const focusColor = palette ? palette[500] : colors.focus;
  const focusBgSoft = palette ? palette[100] : null;
  const duration = theme.motion.duration.normal;
  const easing =
    (theme.motion.easing as { standard?: string }).standard ?? theme.motion.easing.easeInOut;

  let background = 'transparent';
  let border = '0 solid transparent';
  let borderBottom: string | null = null;
  let hoverBackground: string | null = null;
  let hoverBorder: string | null = null;
  let hoverBorderBottom: string | null = null;
  let focusBorderBottom: string | null = null;
  let focusBorderColor: string | null = null;
  let focusBackground: string | null = null;
  let useEdgeFocus = true;

  switch (variant) {
    case 'flat': {
      background = colors.default[100];
      border = `${borderThin} solid ${colors.default[200]}`;
      hoverBackground = colors.default[200];
      hoverBorder = colors.border.strong;
      if (palette) {
        focusBackground = focusBgSoft;
        focusBorderColor = focusColor;
      }
      break;
    }
    case 'bordered': {
      background = 'transparent';
      border = palette
        ? `${borderThin} solid ${palette[500]}`
        : `${borderThin} solid ${colors.border.strong}`;
      hoverBorder = palette ? palette[600] : colors.default[600];
      if (palette) {
        focusBorderColor = focusColor;
      }
      break;
    }
    case 'faded': {
      background = palette ? palette[100] : colors.default[100];
      border = palette
        ? `${borderThin} solid ${palette[200]}`
        : `${borderThin} solid ${colors.border.strong}`;
      hoverBorder = palette ? palette[500] : colors.default[600];
      hoverBackground = palette ? null : colors.default[200];
      if (palette) {
        focusBorderColor = focusColor;
        focusBackground = focusBgSoft;
      }
      break;
    }
    case 'underlined': {
      background = 'transparent';
      border = '0 solid transparent';
      borderBottom = `${borderThin} solid ${colors.border.strong}`;
      hoverBorderBottom = palette ? palette[500] : colors.default[600];
      focusBorderBottom = `${borderThick} solid ${focusColor}`;
      useEdgeFocus = false;
      break;
    }
  }

  if (isInvalid) {
    if (variant === 'underlined') {
      borderBottom = `${borderThin} solid ${danger}`;
      hoverBorderBottom = danger;
      focusBorderBottom = `${borderThick} solid ${danger}`;
    } else if (variant === 'flat') {
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
      box-shadow ${duration} ${easing};

    &:hover:not(:disabled):not([aria-disabled='true']) {
      ${hoverBackground ? `background-color: ${hoverBackground};` : ''}
      ${hoverBorder ? `border-color: ${hoverBorder};` : ''}
      ${hoverBorderBottom ? `border-bottom-color: ${hoverBorderBottom};` : ''}
    }

    ${useEdgeFocus
      ? `
          &:focus-visible,
          &:focus-within {
            outline: none;
            border-color: ${focusBorderColor ?? focusColor};
            box-shadow: inset 0 0 0 ${borderThick} ${focusBorderColor ?? focusColor};
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
