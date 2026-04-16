/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 colors 设计令牌。
 */

export const gray = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
} as const;

export const blue = {
  50: '#e6f4ff',
  100: '#bae0ff',
  200: '#91caff',
  300: '#69b1ff',
  400: '#4096ff',
  500: '#1677ff',
  600: '#0958d9',
  700: '#003eb3',
  800: '#002c8c',
  900: '#001d66',
} as const;

export const green = {
  50: '#f6ffed',
  100: '#d9f7be',
  200: '#b7eb8f',
  300: '#95de64',
  400: '#73d13d',
  500: '#52c41a',
  600: '#389e0d',
  700: '#237804',
  800: '#135200',
  900: '#092b00',
} as const;

export const red = {
  50: '#fff1f0',
  100: '#ffccc7',
  200: '#ffa39e',
  300: '#ff7875',
  400: '#ff4d4f',
  500: '#f5222d',
  600: '#cf1322',
  700: '#a8071a',
  800: '#820014',
  900: '#5c0011',
} as const;

export const orange = {
  50: '#fff7e6',
  100: '#ffe7ba',
  200: '#ffd591',
  300: '#ffc069',
  400: '#ffa940',
  500: '#fa8c16',
  600: '#d46b08',
  700: '#ad4e00',
  800: '#873800',
  900: '#612500',
} as const;

export const yellow = {
  50: '#feffe6',
  100: '#ffffb8',
  200: '#fffb8f',
  300: '#fff566',
  400: '#ffec3d',
  500: '#fadb14',
  600: '#d4b106',
  700: '#ad8b00',
  800: '#876800',
  900: '#614700',
} as const;

export const purple = {
  50: '#f9f0ff',
  100: '#efdbff',
  200: '#d3adf7',
  300: '#b37feb',
  400: '#9254de',
  500: '#722ed1',
  600: '#531dab',
  700: '#391085',
  800: '#22075e',
  900: '#120338',
} as const;

export const cyan = {
  50: '#e6fffb',
  100: '#b5f5ec',
  200: '#87e8de',
  300: '#5cdbd3',
  400: '#36cfc9',
  500: '#13c2c2',
  600: '#08979c',
  700: '#006d75',
  800: '#00474f',
  900: '#002329',
} as const;

export const magenta = {
  50: '#fff0f6',
  100: '#ffd6e7',
  200: '#ffadd2',
  300: '#ff85c0',
  400: '#f759ab',
  500: '#eb2f96',
  600: '#c41d7f',
  700: '#9e1068',
  800: '#780650',
  900: '#520339',
} as const;

export const volcano = {
  50: '#fff2e8',
  100: '#ffd8bf',
  200: '#ffbb96',
  300: '#ff9c6e',
  400: '#ff7a45',
  500: '#fa541c',
  600: '#d4380d',
  700: '#ad2102',
  800: '#871400',
  900: '#610b00',
} as const;

export const palette = {
  gray,
  blue,
  green,
  red,
  orange,
  yellow,
  purple,
  cyan,
  magenta,
  volcano,
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  currentColor: 'currentColor',
} as const;

export type Palette = typeof palette;
export type ColorRamp = typeof gray;
export type ColorRampKey = keyof ColorRamp;
