/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 components 设计令牌。
 */

export const buttonSizes = {
  xs: {
    height: '28px',
    minWidth: '56px',
    fontSize: '11px',
    lineHeight: '14px',
    paddingX: '10px',
    gap: '6px',
    radius: '6px',
  },
  sm: {
    height: '32px',
    minWidth: '64px',
    fontSize: '12px',
    lineHeight: '16px',
    paddingX: '12px',
    gap: '8px',
    radius: '8px',
  },
  md: {
    height: '40px',
    minWidth: '80px',
    fontSize: '14px',
    lineHeight: '20px',
    paddingX: '16px',
    gap: '8px',
    radius: '12px',
  },
  lg: {
    height: '48px',
    minWidth: '96px',
    fontSize: '16px',
    lineHeight: '24px',
    paddingX: '24px',
    gap: '12px',
    radius: '14px',
  },
  xl: {
    height: '56px',
    minWidth: '112px',
    fontSize: '18px',
    lineHeight: '28px',
    paddingX: '28px',
    gap: '12px',
    radius: '16px',
  },
} as const;

export const inputSizes = {
  xs: {
    height: '28px',
    fontSize: '12px',
    lineHeight: '16px',
    paddingX: '10px',
    iconSize: '14px',
    gap: '6px',
  },
  sm: {
    height: '32px',
    fontSize: '13px',
    lineHeight: '18px',
    paddingX: '12px',
    iconSize: '14px',
    gap: '8px',
  },
  md: {
    height: '40px',
    fontSize: '14px',
    lineHeight: '20px',
    paddingX: '14px',
    iconSize: '16px',
    gap: '8px',
  },
  lg: {
    height: '48px',
    fontSize: '16px',
    lineHeight: '24px',
    paddingX: '16px',
    iconSize: '18px',
    gap: '10px',
  },
  xl: {
    height: '56px',
    fontSize: '18px',
    lineHeight: '28px',
    paddingX: '20px',
    iconSize: '20px',
    gap: '12px',
  },
} as const;

export const checkboxSizes = {
  sm: {
    indicator: '16px',
    fontSize: '13px',
    gap: '8px',
  },
  md: {
    indicator: '20px',
    fontSize: '14px',
    gap: '8px',
  },
  lg: {
    indicator: '24px',
    fontSize: '16px',
    gap: '8px',
  },
} as const;

export const switchSizes = {
  sm: {
    trackWidth: '32px',
    trackHeight: '20px',
    thumbSize: '16px',
    padding: '2px',
  },
  md: {
    trackWidth: '48px',
    trackHeight: '28px',
    thumbSize: '24px',
    padding: '2px',
  },
  lg: {
    trackWidth: '56px',
    trackHeight: '32px',
    thumbSize: '28px',
    padding: '2px',
  },
} as const;

export const components = {
  button: buttonSizes,
  input: inputSizes,
  checkbox: checkboxSizes,
  switch: switchSizes,
} as const;

export type ButtonSizes = typeof buttonSizes;
export type InputSizes = typeof inputSizes;
export type CheckboxSizes = typeof checkboxSizes;
export type SwitchSizes = typeof switchSizes;
export type Components = typeof components;
