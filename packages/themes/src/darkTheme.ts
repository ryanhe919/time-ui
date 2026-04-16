/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现主题模块 darkTheme。
 */

import { tokens } from '@timeui/tokens';
import type { TimeUITheme } from './types';

const { palette } = tokens;

export const darkTheme: TimeUITheme = {
  mode: 'dark',
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
      DEFAULT: 'rgb(63, 63, 70)',
      foreground: 'rgb(255, 255, 255)',
      100: 'rgb(39, 39, 42)',
      200: 'rgb(63, 63, 70)',
      500: 'rgb(63, 63, 70)',
      600: 'rgb(236, 237, 238)',
    },
    primary: {
      DEFAULT: 'rgb(0, 111, 238)',
      foreground: 'rgb(255, 255, 255)',
      100: 'rgba(0, 111, 238, 0.1)',
      200: 'rgba(0, 111, 238, 0.2)',
      500: 'rgb(0, 111, 238)',
      600: 'rgb(102, 170, 249)',
    },
    secondary: {
      DEFAULT: 'rgb(147, 83, 211)',
      foreground: 'rgb(255, 255, 255)',
      100: 'rgba(147, 83, 211, 0.1)',
      200: 'rgba(147, 83, 211, 0.2)',
      500: 'rgb(147, 83, 211)',
      600: 'rgb(192, 143, 232)',
    },
    success: {
      DEFAULT: 'rgb(23, 201, 100)',
      foreground: 'rgb(0, 0, 0)',
      100: 'rgba(23, 201, 100, 0.1)',
      200: 'rgba(23, 201, 100, 0.2)',
      500: 'rgb(23, 201, 100)',
      600: 'rgb(116, 221, 156)',
    },
    warning: {
      DEFAULT: 'rgb(245, 165, 36)',
      foreground: 'rgb(0, 0, 0)',
      100: 'rgba(245, 165, 36, 0.1)',
      200: 'rgba(245, 165, 36, 0.2)',
      500: 'rgb(245, 165, 36)',
      600: 'rgb(249, 194, 108)',
    },
    danger: {
      DEFAULT: 'rgb(201, 12, 80)',
      foreground: 'rgb(255, 255, 255)',
      100: 'rgba(243, 18, 96, 0.1)',
      200: 'rgba(243, 18, 96, 0.2)',
      500: 'rgb(243, 18, 96)',
      600: 'rgb(247, 104, 161)',
    },
    focus: 'rgb(0, 111, 238)',
    bg: {
      canvas: palette.gray[900],
      surface: palette.gray[800],
      raised: palette.gray[700],
      sunken: palette.black,
      primary: palette.blue[400],
      muted: palette.gray[800],
      overlay: 'rgba(0, 0, 0, 0.65)',
    },
    text: {
      primary: palette.gray[50],
      secondary: palette.gray[200],
      muted: palette.gray[400],
      inverse: palette.gray[900],
      link: palette.blue[300],
      disabled: palette.gray[600],
    },
    border: {
      default: palette.gray[700],
      subtle: palette.gray[800],
      strong: palette.gray[500],
      focus: palette.blue[400],
    },
    action: {
      primary: {
        default: palette.blue[500],
        hover: palette.blue[400],
        active: palette.blue[600],
        disabled: palette.blue[800],
      },
      secondary: {
        default: palette.gray[700],
        hover: palette.gray[600],
        active: palette.gray[500],
        disabled: palette.gray[800],
      },
      danger: {
        default: palette.red[500],
        hover: palette.red[400],
        active: palette.red[600],
        disabled: palette.red[800],
      },
    },
    status: {
      success: palette.green[400],
      warning: palette.orange[400],
      danger: palette.red[400],
      info: palette.blue[400],
      successBg: palette.green[900],
      warningBg: palette.orange[900],
      dangerBg: palette.red[900],
      infoBg: palette.blue[900],
    },
  },
};
