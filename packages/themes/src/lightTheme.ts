import { tokens } from '@timeui/tokens';
import type { TimeUITheme } from './types';

const { palette } = tokens;

/**
 * The default light theme.
 *
 * Every component in TimeUI renders correctly against this theme out of the
 * box — it acts both as the reference implementation of the semantic surface
 * and as the fallback when no `<ThemeProvider>` wraps the tree.
 */
export const lightTheme: TimeUITheme = {
  mode: 'light',
  tokens,
  typography: tokens.typography,
  spacing: tokens.spacing,
  radius: tokens.radius,
  shadows: tokens.shadows,
  zIndex: tokens.zIndex,
  breakpoints: tokens.breakpoints,
  motion: tokens.motion,
  borders: tokens.borders,
  componentRadius: tokens.componentRadius,
  components: tokens.components,
  colors: {
    default: {
      DEFAULT: 'rgb(212, 212, 216)',
      foreground: 'rgb(0, 0, 0)',
      100: 'rgb(244, 244, 245)',
      200: 'rgb(228, 228, 231)',
      500: 'rgb(212, 212, 216)',
      600: 'rgb(82, 82, 91)',
    },
    primary: {
      DEFAULT: 'rgb(0, 111, 238)',
      foreground: 'rgb(255, 255, 255)',
      100: 'rgba(0, 111, 238, 0.1)',
      200: 'rgba(0, 111, 238, 0.2)',
      500: 'rgb(0, 111, 238)',
      600: 'rgb(0, 85, 184)',
    },
    secondary: {
      DEFAULT: 'rgb(120, 40, 200)',
      foreground: 'rgb(255, 255, 255)',
      100: 'rgba(120, 40, 200, 0.1)',
      200: 'rgba(120, 40, 200, 0.2)',
      500: 'rgb(120, 40, 200)',
      600: 'rgb(110, 53, 175)',
    },
    success: {
      DEFAULT: 'rgb(23, 201, 100)',
      foreground: 'rgb(0, 0, 0)',
      100: 'rgba(23, 201, 100, 0.1)',
      200: 'rgba(23, 201, 100, 0.2)',
      500: 'rgb(23, 201, 100)',
      600: 'rgb(18, 154, 77)',
    },
    warning: {
      DEFAULT: 'rgb(245, 165, 36)',
      foreground: 'rgb(0, 0, 0)',
      100: 'rgba(245, 165, 36, 0.1)',
      200: 'rgba(245, 165, 36, 0.2)',
      500: 'rgb(245, 165, 36)',
      600: 'rgb(194, 120, 3)',
    },
    danger: {
      DEFAULT: 'rgb(201, 12, 80)',
      foreground: 'rgb(255, 255, 255)',
      100: 'rgba(243, 18, 96, 0.1)',
      200: 'rgba(243, 18, 96, 0.2)',
      500: 'rgb(243, 18, 96)',
      600: 'rgb(193, 11, 73)',
    },
    focus: 'rgb(0, 111, 238)',
    bg: {
      canvas: palette.white,
      surface: palette.white,
      raised: palette.white,
      sunken: palette.gray[50],
      primary: palette.blue[500],
      muted: palette.gray[100],
      overlay: 'rgba(0, 0, 0, 0.45)',
    },
    text: {
      primary: palette.gray[900],
      secondary: palette.gray[700],
      muted: palette.gray[500],
      inverse: palette.white,
      link: palette.blue[600],
      disabled: palette.gray[400],
    },
    border: {
      default: palette.gray[200],
      subtle: palette.gray[100],
      strong: palette.gray[400],
      focus: palette.blue[500],
    },
    action: {
      primary: {
        default: palette.blue[500],
        hover: palette.blue[400],
        active: palette.blue[600],
        disabled: palette.blue[200],
      },
      secondary: {
        default: palette.gray[100],
        hover: palette.gray[200],
        active: palette.gray[300],
        disabled: palette.gray[50],
      },
      danger: {
        default: palette.red[500],
        hover: palette.red[400],
        active: palette.red[600],
        disabled: palette.red[200],
      },
    },
    status: {
      success: palette.green[500],
      warning: palette.orange[500],
      danger: palette.red[500],
      info: palette.blue[500],
      successBg: palette.green[50],
      warningBg: palette.orange[50],
      dangerBg: palette.red[50],
      infoBg: palette.blue[50],
    },
  },
};
