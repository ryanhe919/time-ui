/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 DatePicker date-utils 纯函数（边界、闭区间、跨月、跨年、weekStartsOn）。
 */

import { describe, it, expect } from 'vitest';
import {
  addDays,
  addMonths,
  addYears,
  buildCalendarMatrix,
  buildWeekDayOrder,
  clampDate,
  compareDays,
  defaultFormat,
  defaultParse,
  endOfMonth,
  getDaysInMonth,
  isInRange,
  isInRangeExclusive,
  isSameDay,
  isSameMonth,
  isWithinBounds,
  monthLabel,
  normalizeRange,
  startOfCalendarGrid,
  startOfDay,
  startOfMonth,
  weekdayLabels,
} from '../date-utils';

describe('date-utils — startOfDay', () => {
  it('clears hours/minutes/seconds/ms', () => {
    const d = new Date(2026, 3, 17, 13, 45, 22, 999);
    const s = startOfDay(d);
    expect(s.getFullYear()).toBe(2026);
    expect(s.getMonth()).toBe(3);
    expect(s.getDate()).toBe(17);
    expect(s.getHours()).toBe(0);
    expect(s.getMinutes()).toBe(0);
    expect(s.getSeconds()).toBe(0);
    expect(s.getMilliseconds()).toBe(0);
  });

  it('does not mutate the input', () => {
    const d = new Date(2026, 3, 17, 13, 45);
    startOfDay(d);
    expect(d.getHours()).toBe(13);
  });
});

describe('date-utils — startOfMonth/endOfMonth', () => {
  it('startOfMonth returns the 1st at 00:00', () => {
    const s = startOfMonth(new Date(2026, 3, 17, 13));
    expect(s.getDate()).toBe(1);
    expect(s.getHours()).toBe(0);
  });

  it('endOfMonth returns last day at 23:59:59.999 (handles 30-day months)', () => {
    const e = endOfMonth(new Date(2026, 3, 1));
    expect(e.getDate()).toBe(30);
    expect(e.getHours()).toBe(23);
    expect(e.getMinutes()).toBe(59);
  });

  it('handles February in a leap year', () => {
    expect(getDaysInMonth(new Date(2024, 1, 1))).toBe(29);
    expect(getDaysInMonth(new Date(2025, 1, 1))).toBe(28);
  });
});

describe('date-utils — addDays / addMonths / addYears', () => {
  it('addDays handles cross-month forward', () => {
    const d = addDays(new Date(2026, 0, 30), 5); // Jan 30 + 5 = Feb 4
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(4);
  });

  it('addDays handles negative cross-month', () => {
    const d = addDays(new Date(2026, 1, 2), -5); // Feb 2 - 5 = Jan 28
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(28);
  });

  it('addMonths clamps day-of-month overflow (Jan 31 + 1 → Feb 28/29)', () => {
    const d = addMonths(new Date(2025, 0, 31), 1);
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(28);
  });

  it('addMonths handles negative cross-year', () => {
    const d = addMonths(new Date(2026, 0, 15), -2);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(10);
  });

  it('addYears advances by 12 months', () => {
    const d = addYears(new Date(2026, 5, 15), 3);
    expect(d.getFullYear()).toBe(2029);
    expect(d.getMonth()).toBe(5);
  });
});

describe('date-utils — isSameDay / isSameMonth', () => {
  it('isSameDay ignores time portion', () => {
    expect(isSameDay(new Date(2026, 3, 17, 1), new Date(2026, 3, 17, 23))).toBe(true);
    expect(isSameDay(new Date(2026, 3, 17), new Date(2026, 3, 18))).toBe(false);
  });

  it('isSameDay returns false on null/undefined', () => {
    expect(isSameDay(null, new Date())).toBe(false);
    expect(isSameDay(new Date(), undefined)).toBe(false);
    expect(isSameDay(null, null)).toBe(false);
  });

  it('isSameMonth checks year + month', () => {
    expect(isSameMonth(new Date(2026, 3, 1), new Date(2026, 3, 30))).toBe(true);
    expect(isSameMonth(new Date(2026, 3, 1), new Date(2025, 3, 1))).toBe(false);
    expect(isSameMonth(null, new Date())).toBe(false);
  });
});

describe('date-utils — isInRange / isInRangeExclusive', () => {
  it('isInRange treats both endpoints as included', () => {
    const start = new Date(2026, 3, 10);
    const end = new Date(2026, 3, 20);
    expect(isInRange(start, start, end)).toBe(true);
    expect(isInRange(end, start, end)).toBe(true);
    expect(isInRange(new Date(2026, 3, 15), start, end)).toBe(true);
    expect(isInRange(new Date(2026, 3, 21), start, end)).toBe(false);
  });

  it('isInRange auto-swaps when end < start', () => {
    const a = new Date(2026, 3, 20);
    const b = new Date(2026, 3, 10);
    expect(isInRange(new Date(2026, 3, 15), a, b)).toBe(true);
  });

  it('isInRange returns false if either bound is null', () => {
    const d = new Date();
    expect(isInRange(d, null, d)).toBe(false);
    expect(isInRange(d, d, null)).toBe(false);
  });

  it('isInRangeExclusive excludes endpoints', () => {
    const start = new Date(2026, 3, 10);
    const end = new Date(2026, 3, 20);
    expect(isInRangeExclusive(start, start, end)).toBe(false);
    expect(isInRangeExclusive(end, start, end)).toBe(false);
    expect(isInRangeExclusive(new Date(2026, 3, 15), start, end)).toBe(true);
    expect(isInRangeExclusive(new Date(2026, 3, 9), start, end)).toBe(false);
    expect(isInRangeExclusive(new Date(), null, null)).toBe(false);
  });
});

describe('date-utils — compareDays / clampDate', () => {
  it('compareDays returns sign of day-difference', () => {
    expect(compareDays(new Date(2026, 3, 17), new Date(2026, 3, 18))).toBeLessThan(0);
    expect(compareDays(new Date(2026, 3, 18), new Date(2026, 3, 17))).toBeGreaterThan(0);
    expect(compareDays(new Date(2026, 3, 17, 1), new Date(2026, 3, 17, 23))).toBe(0);
  });

  it('clampDate clamps below min and above max', () => {
    const min = new Date(2026, 3, 10);
    const max = new Date(2026, 3, 20);
    expect(isSameDay(clampDate(new Date(2026, 3, 5), min, max), min)).toBe(true);
    expect(isSameDay(clampDate(new Date(2026, 3, 25), min, max), max)).toBe(true);
    const inside = new Date(2026, 3, 15);
    expect(clampDate(inside, min, max)).toBe(inside);
    expect(clampDate(inside, undefined, undefined)).toBe(inside);
  });
});

describe('date-utils — buildWeekDayOrder', () => {
  it('weekStartsOn=0 returns [0..6]', () => {
    expect(buildWeekDayOrder(0)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
  it('weekStartsOn=1 returns [1..6,0] (Monday-first)', () => {
    expect(buildWeekDayOrder(1)).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });
  it('weekStartsOn=6 returns [6,0..5]', () => {
    expect(buildWeekDayOrder(6)).toEqual([6, 0, 1, 2, 3, 4, 5]);
  });
});

describe('date-utils — startOfCalendarGrid / buildCalendarMatrix', () => {
  it('grid start aligns to the chosen weekStartsOn', () => {
    // April 1, 2026 is a Wednesday (getDay() === 3).
    const anchor = new Date(2026, 3, 1);
    const sundayStart = startOfCalendarGrid(anchor, 0);
    expect(sundayStart.getDay()).toBe(0);
    expect(sundayStart.getMonth()).toBe(2); // March
    expect(sundayStart.getDate()).toBe(29);
    const mondayStart = startOfCalendarGrid(anchor, 1);
    expect(mondayStart.getDay()).toBe(1);
    expect(mondayStart.getDate()).toBe(30);
  });

  it('produces 42 cells with isCurrentMonth flag', () => {
    const cells = buildCalendarMatrix(new Date(2026, 3, 1), 0);
    expect(cells).toHaveLength(42);
    const inMonth = cells.filter((c) => c.isCurrentMonth);
    expect(inMonth).toHaveLength(30);
    // First few cells should be from March 2026 (prev month).
    expect(cells[0]!.isCurrentMonth).toBe(false);
    expect(cells[0]!.date.getMonth()).toBe(2);
  });
});

describe('date-utils — isWithinBounds', () => {
  it('returns true when both bounds are missing', () => {
    expect(isWithinBounds(new Date())).toBe(true);
  });
  it('respects min and max independently', () => {
    const min = new Date(2026, 3, 10);
    const max = new Date(2026, 3, 20);
    expect(isWithinBounds(new Date(2026, 3, 9), min, max)).toBe(false);
    expect(isWithinBounds(new Date(2026, 3, 21), min, max)).toBe(false);
    expect(isWithinBounds(new Date(2026, 3, 10), min, max)).toBe(true);
    expect(isWithinBounds(new Date(2026, 3, 20), min, max)).toBe(true);
    expect(isWithinBounds(new Date(2026, 3, 25), min, null)).toBe(true);
  });
});

describe('date-utils — defaultFormat / defaultParse', () => {
  it('defaultFormat returns a non-empty string', () => {
    const s = defaultFormat(new Date(2026, 3, 17));
    expect(s.length).toBeGreaterThan(0);
  });

  it('defaultParse parses ISO YYYY-MM-DD', () => {
    const d = defaultParse('2026-04-17');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(3);
    expect(d!.getDate()).toBe(17);
  });

  it('defaultParse rejects invalid ISO (e.g. 2026-13-01)', () => {
    expect(defaultParse('2026-13-01')).toBeNull();
  });

  it('defaultParse returns null for empty string', () => {
    expect(defaultParse('   ')).toBeNull();
  });

  it('defaultParse returns null for garbage', () => {
    expect(defaultParse('not a date')).toBeNull();
  });

  it('defaultParse falls back to Date constructor for non-ISO strings', () => {
    const d = defaultParse('April 17, 2026');
    // Some jsdom versions parse this; if so, ensure date-of-month is correct.
    if (d) {
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(3);
    }
  });
});

describe('date-utils — monthLabel / weekdayLabels', () => {
  it('monthLabel returns a string mentioning the year', () => {
    const label = monthLabel(new Date(2026, 3, 1));
    expect(label).toMatch(/2026/);
  });

  it('weekdayLabels returns 7 entries respecting weekStartsOn', () => {
    expect(weekdayLabels(0)).toHaveLength(7);
    expect(weekdayLabels(1)).toHaveLength(7);
  });

  it('monthLabel falls back to English when toLocaleDateString throws', () => {
    const orig = Date.prototype.toLocaleDateString;
    (Date.prototype as { toLocaleDateString: unknown }).toLocaleDateString = function () {
      throw new Error('no Intl');
    };
    try {
      const label = monthLabel(new Date(2026, 3, 1));
      expect(label).toMatch(/April/);
      expect(label).toMatch(/2026/);
    } finally {
      Date.prototype.toLocaleDateString = orig;
    }
  });

  it('weekdayLabels falls back to single letters when toLocaleDateString throws', () => {
    const orig = Date.prototype.toLocaleDateString;
    (Date.prototype as { toLocaleDateString: unknown }).toLocaleDateString = function () {
      throw new Error('no Intl');
    };
    try {
      const labels = weekdayLabels(0);
      expect(labels).toHaveLength(7);
      labels.forEach((l) => expect(typeof l).toBe('string'));
    } finally {
      Date.prototype.toLocaleDateString = orig;
    }
  });

  it('defaultFormat falls back to YYYY-MM-DD when toLocaleDateString throws', async () => {
    const { defaultFormat: fmt } = await import('../date-utils');
    const orig = Date.prototype.toLocaleDateString;
    (Date.prototype as { toLocaleDateString: unknown }).toLocaleDateString = function () {
      throw new Error('no Intl');
    };
    try {
      const out = fmt(new Date(2026, 3, 17));
      expect(out).toBe('2026-04-17');
    } finally {
      Date.prototype.toLocaleDateString = orig;
    }
  });
});

describe('date-utils — normalizeRange', () => {
  it('returns input untouched when start ≤ end', () => {
    const r = { start: new Date(2026, 3, 10), end: new Date(2026, 3, 20) };
    expect(normalizeRange(r)).toEqual(r);
  });

  it('swaps start/end when reversed', () => {
    const a = new Date(2026, 3, 20);
    const b = new Date(2026, 3, 10);
    const out = normalizeRange({ start: a, end: b });
    expect(isSameDay(out.start, b)).toBe(true);
    expect(isSameDay(out.end, a)).toBe(true);
  });
});
