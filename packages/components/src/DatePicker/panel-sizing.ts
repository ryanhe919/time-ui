/**
 * @author Ryan He
 * @date 2026-04-24
 * @description DatePicker / DateRangePicker 浮层尺寸预设。
 */

import type { DatePickerPanelSize } from './DatePicker.types';

interface DatePickerTokenLike {
  panelMinWidth: string;
  panelRangeMinWidth: string;
  panelPaddingX: string;
  panelPaddingY: string;
  panelRadius: string;
  panelGap: string;
  headerHeight: string;
  headerFontSize: string;
  headerNavButtonSize: string;
  headerNavButtonRadius: string;
  headerNavIconSize: string;
  headerGap: string;
  weekdayHeight: string;
  weekdayFontSize: string;
  cellSize: string;
  cellRadius: string;
  cellFontSize: string;
  cellGap: string;
  cellTodayDotSize: string;
  cellTodayDotOffset: string;
  rangeEndRadius: string;
  monthSlideTranslate: string;
  footerHeight: string;
  footerPaddingX: string;
  footerGap: string;
}

export interface DatePickerPanelSizing {
  panelMinWidth: string;
  panelRangeMinWidth: string;
  panelPaddingX: string;
  panelPaddingY: string;
  panelRadius: string;
  panelGap: string;
  headerHeight: string;
  headerFontSize: string;
  headerNavButtonSize: string;
  headerNavButtonRadius: string;
  headerNavIconSize: string;
  headerGap: string;
  weekdayHeight: string;
  weekdayFontSize: string;
  cellSize: string;
  cellRadius: string;
  cellFontSize: string;
  cellGap: string;
  cellTodayDotSize: string;
  cellTodayDotOffset: string;
  rangeEndRadius: string;
  monthSlideTranslate: string;
  footerHeight: string;
  footerPaddingX: string;
  footerGap: string;
}

const SIZE_OVERRIDES: Record<Exclude<DatePickerPanelSize, 'md'>, Partial<DatePickerPanelSizing>> = {
  sm: {
    panelMinWidth: '252px',
    panelRangeMinWidth: '516px',
    panelPaddingX: '12px',
    panelPaddingY: '12px',
    panelRadius: '10px',
    panelGap: '12px',
    headerHeight: '32px',
    headerFontSize: '13px',
    headerNavButtonSize: '26px',
    headerNavButtonRadius: '7px',
    headerNavIconSize: '14px',
    headerGap: '6px',
    weekdayHeight: '24px',
    weekdayFontSize: '10px',
    cellSize: '32px',
    cellRadius: '7px',
    cellFontSize: '12px',
    cellTodayDotSize: '3px',
    cellTodayDotOffset: '3px',
    rangeEndRadius: '7px',
    monthSlideTranslate: '10px',
    footerHeight: '40px',
    footerPaddingX: '10px',
    footerGap: '6px',
  },
  lg: {
    panelMinWidth: '330px',
    panelRangeMinWidth: '678px',
    panelPaddingX: '18px',
    panelPaddingY: '16px',
    panelRadius: '14px',
    panelGap: '18px',
    headerHeight: '40px',
    headerFontSize: '15px',
    headerNavButtonSize: '32px',
    headerNavButtonRadius: '9px',
    headerNavIconSize: '18px',
    headerGap: '10px',
    weekdayHeight: '32px',
    weekdayFontSize: '12px',
    cellSize: '42px',
    cellRadius: '9px',
    cellFontSize: '14px',
    cellTodayDotSize: '5px',
    cellTodayDotOffset: '5px',
    rangeEndRadius: '9px',
    monthSlideTranslate: '14px',
    footerHeight: '48px',
    footerPaddingX: '14px',
    footerGap: '10px',
  },
};

export function getDatePickerPanelSizing(
  tokens: DatePickerTokenLike,
  panelSize: DatePickerPanelSize,
): DatePickerPanelSizing {
  const base: DatePickerPanelSizing = {
    panelMinWidth: tokens.panelMinWidth,
    panelRangeMinWidth: tokens.panelRangeMinWidth,
    panelPaddingX: tokens.panelPaddingX,
    panelPaddingY: tokens.panelPaddingY,
    panelRadius: tokens.panelRadius,
    panelGap: tokens.panelGap,
    headerHeight: tokens.headerHeight,
    headerFontSize: tokens.headerFontSize,
    headerNavButtonSize: tokens.headerNavButtonSize,
    headerNavButtonRadius: tokens.headerNavButtonRadius,
    headerNavIconSize: tokens.headerNavIconSize,
    headerGap: tokens.headerGap,
    weekdayHeight: tokens.weekdayHeight,
    weekdayFontSize: tokens.weekdayFontSize,
    cellSize: tokens.cellSize,
    cellRadius: tokens.cellRadius,
    cellFontSize: tokens.cellFontSize,
    cellGap: tokens.cellGap,
    cellTodayDotSize: tokens.cellTodayDotSize,
    cellTodayDotOffset: tokens.cellTodayDotOffset,
    rangeEndRadius: tokens.rangeEndRadius,
    monthSlideTranslate: tokens.monthSlideTranslate,
    footerHeight: tokens.footerHeight,
    footerPaddingX: tokens.footerPaddingX,
    footerGap: tokens.footerGap,
  };

  return panelSize === 'md' ? base : { ...base, ...SIZE_OVERRIDES[panelSize] };
}
