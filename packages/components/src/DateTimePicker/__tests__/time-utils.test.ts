/**
 * @author Ryan He
 * @date 2026-04-29
 * @description DateTimePicker 时间纯函数集的直接单元测试。其中
 *              `from12Hour` / `isAm` / `defaultDateTimeFormat` /
 *              `defaultDateTimeParse` / `setTime` / `withTime` /
 *              `isSameDateTime` / `startOfHour` / `startOfMinute` 在主组件测试
 *              里被间接调用次数有限，function coverage 仅 58%。这里覆盖每个导出
 *              的函数及其边界，把 time-utils 拉到 100%。
 */

import { describe, it, expect } from 'vitest';
import {
  startOfHour,
  startOfMinute,
  withTime,
  setTime,
  isSameDateTime,
  buildTimeOptions,
  pad2,
  to12Hour,
  from12Hour,
  isAm,
  defaultDateTimeFormat,
  defaultDateTimeParse,
} from '../time-utils';

describe('time-utils — startOfHour', () => {
  it('zeroes minutes / seconds / ms but keeps Y/M/D and hour', () => {
    const d = new Date(2026, 3, 24, 14, 35, 12, 999);
    const out = startOfHour(d);
    expect(out.getFullYear()).toBe(2026);
    expect(out.getMonth()).toBe(3);
    expect(out.getDate()).toBe(24);
    expect(out.getHours()).toBe(14);
    expect(out.getMinutes()).toBe(0);
    expect(out.getSeconds()).toBe(0);
    expect(out.getMilliseconds()).toBe(0);
  });

  it('does not mutate the input', () => {
    const d = new Date(2026, 3, 24, 14, 35, 12, 999);
    const before = d.getTime();
    startOfHour(d);
    expect(d.getTime()).toBe(before);
  });
});

describe('time-utils — startOfMinute', () => {
  it('zeroes seconds and ms but keeps Y/M/D/H/m', () => {
    const d = new Date(2026, 3, 24, 14, 35, 12, 999);
    const out = startOfMinute(d);
    expect(out.getMinutes()).toBe(35);
    expect(out.getSeconds()).toBe(0);
    expect(out.getMilliseconds()).toBe(0);
  });

  it('does not mutate the input', () => {
    const d = new Date(2026, 3, 24, 14, 35, 12, 999);
    const ms = d.getMilliseconds();
    startOfMinute(d);
    expect(d.getMilliseconds()).toBe(ms);
  });
});

describe('time-utils — withTime / setTime', () => {
  it('keeps Y/M/D from datePart and applies given h/m/s/ms', () => {
    const datePart = new Date(2026, 5, 10, 8, 0, 0, 0);
    const out = withTime(datePart, 23, 59, 58, 7);
    expect(out.getFullYear()).toBe(2026);
    expect(out.getMonth()).toBe(5);
    expect(out.getDate()).toBe(10);
    expect(out.getHours()).toBe(23);
    expect(out.getMinutes()).toBe(59);
    expect(out.getSeconds()).toBe(58);
    expect(out.getMilliseconds()).toBe(7);
  });

  it('defaults ms to 0 when omitted', () => {
    const out = withTime(new Date(2026, 0, 1), 1, 2, 3);
    expect(out.getMilliseconds()).toBe(0);
  });

  it('setTime is an alias of withTime', () => {
    const target = new Date(2026, 0, 1);
    expect(setTime(target, 1, 2, 3, 4).getTime()).toBe(withTime(target, 1, 2, 3, 4).getTime());
  });
});

describe('time-utils — isSameDateTime', () => {
  it('returns false when either argument is null / undefined', () => {
    expect(isSameDateTime(null, new Date())).toBe(false);
    expect(isSameDateTime(new Date(), null)).toBe(false);
    expect(isSameDateTime(undefined, undefined)).toBe(false);
    expect(isSameDateTime(null, undefined)).toBe(false);
  });

  it('returns true for identical timestamps', () => {
    const a = new Date(2026, 3, 24, 14, 35, 12, 999);
    const b = new Date(a.getTime());
    expect(isSameDateTime(a, b)).toBe(true);
  });

  it('returns false for different timestamps', () => {
    const a = new Date(2026, 3, 24, 14, 35, 12, 0);
    const b = new Date(2026, 3, 24, 14, 35, 12, 1);
    expect(isSameDateTime(a, b)).toBe(false);
  });
});

describe('time-utils — buildTimeOptions', () => {
  it('returns [] when max <= 0', () => {
    expect(buildTimeOptions(0, 1)).toEqual([]);
    expect(buildTimeOptions(-5, 1)).toEqual([]);
  });

  it('treats step <= 0 as step=1', () => {
    expect(buildTimeOptions(5, 0)).toEqual([0, 1, 2, 3, 4]);
    expect(buildTimeOptions(5, -3)).toEqual([0, 1, 2, 3, 4]);
  });

  it('respects positive step', () => {
    expect(buildTimeOptions(10, 2)).toEqual([0, 2, 4, 6, 8]);
  });

  it('floors fractional max and step', () => {
    expect(buildTimeOptions(5.9, 1.7)).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('time-utils — pad2', () => {
  it('pads single digits to width 2', () => {
    expect(pad2(0)).toBe('00');
    expect(pad2(7)).toBe('07');
  });
  it('leaves two-digit numbers unchanged', () => {
    expect(pad2(12)).toBe('12');
    expect(pad2(99)).toBe('99');
  });
});

describe('time-utils — to12Hour', () => {
  it('maps 0 → 12 (midnight)', () => {
    expect(to12Hour(0)).toBe(12);
  });
  it('keeps 1..12 unchanged', () => {
    expect(to12Hour(1)).toBe(1);
    expect(to12Hour(11)).toBe(11);
    expect(to12Hour(12)).toBe(12);
  });
  it('maps 13..23 to 1..11', () => {
    expect(to12Hour(13)).toBe(1);
    expect(to12Hour(23)).toBe(11);
  });
  it('handles values out of [0, 23] via modulo', () => {
    expect(to12Hour(24)).toBe(12);
    expect(to12Hour(-1)).toBe(11);
  });
});

describe('time-utils — from12Hour', () => {
  it('returns 0 for 12 AM', () => {
    expect(from12Hour(12, 'am')).toBe(0);
  });
  it('returns 12 for 12 PM (noon)', () => {
    expect(from12Hour(12, 'pm')).toBe(12);
  });
  it('keeps 1..11 unchanged in AM', () => {
    expect(from12Hour(1, 'am')).toBe(1);
    expect(from12Hour(11, 'am')).toBe(11);
  });
  it('shifts 1..11 by +12 in PM', () => {
    expect(from12Hour(1, 'pm')).toBe(13);
    expect(from12Hour(11, 'pm')).toBe(23);
  });
});

describe('time-utils — isAm', () => {
  it('returns true for 0..11', () => {
    for (const h of [0, 1, 6, 11]) expect(isAm(h)).toBe(true);
  });
  it('returns false for 12..23', () => {
    for (const h of [12, 13, 18, 23]) expect(isAm(h)).toBe(false);
  });
  it('normalizes negative / out-of-range hours via modulo', () => {
    expect(isAm(-1)).toBe(false); // -1 → 23
    expect(isAm(24)).toBe(true); // → 0
  });
});

describe('time-utils — defaultDateTimeFormat', () => {
  const d = new Date(2026, 3, 24, 9, 5, 7); // 2026-04-24 09:05:07

  it('default 24h "YYYY-MM-DD HH:mm"', () => {
    expect(defaultDateTimeFormat(d)).toBe('2026-04-24 09:05');
  });

  it('appends ":ss" when showSecond=true', () => {
    expect(defaultDateTimeFormat(d, { showSecond: true })).toBe('2026-04-24 09:05:07');
  });

  it('omits minutes (and seconds) when showMinute=false', () => {
    expect(defaultDateTimeFormat(d, { showMinute: false })).toBe('2026-04-24 09');
    // seconds also gone implicitly
    expect(defaultDateTimeFormat(d, { showMinute: false, showSecond: true })).toBe('2026-04-24 09');
  });

  it('uses 12h with AM suffix for morning', () => {
    expect(defaultDateTimeFormat(d, { is12Hour: true })).toBe('2026-04-24 09:05 AM');
  });

  it('uses 12h with PM suffix for afternoon', () => {
    const pm = new Date(2026, 3, 24, 13, 30);
    expect(defaultDateTimeFormat(pm, { is12Hour: true })).toBe('2026-04-24 01:30 PM');
  });

  it('formats midnight as "12:00 AM" in 12h', () => {
    expect(defaultDateTimeFormat(new Date(2026, 0, 1, 0, 0), { is12Hour: true })).toBe(
      '2026-01-01 12:00 AM',
    );
  });

  it('formats noon as "12:00 PM" in 12h', () => {
    expect(defaultDateTimeFormat(new Date(2026, 0, 1, 12, 0), { is12Hour: true })).toBe(
      '2026-01-01 12:00 PM',
    );
  });
});

describe('time-utils — defaultDateTimeParse', () => {
  it('parses "YYYY-MM-DD HH:mm"', () => {
    const d = defaultDateTimeParse('2026-04-24 09:05')!;
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3);
    expect(d.getDate()).toBe(24);
    expect(d.getHours()).toBe(9);
    expect(d.getMinutes()).toBe(5);
    expect(d.getSeconds()).toBe(0);
  });

  it('parses with seconds', () => {
    const d = defaultDateTimeParse('2026-04-24 09:05:07')!;
    expect(d.getSeconds()).toBe(7);
  });

  it('parses date-only "YYYY-MM-DD"', () => {
    const d = defaultDateTimeParse('2026-04-24')!;
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it('parses 12h with " AM"', () => {
    const d = defaultDateTimeParse('2026-04-24 09:05 AM')!;
    expect(d.getHours()).toBe(9);
  });

  it('parses 12h with " pm" (lowercase)', () => {
    const d = defaultDateTimeParse('2026-04-24 01:00 pm')!;
    expect(d.getHours()).toBe(13);
  });

  it('parses "12:00 AM" as midnight', () => {
    expect(defaultDateTimeParse('2026-04-24 12:00 AM')!.getHours()).toBe(0);
  });

  it('parses "12:00 PM" as noon', () => {
    expect(defaultDateTimeParse('2026-04-24 12:00 PM')!.getHours()).toBe(12);
  });

  it('returns null for empty / whitespace string', () => {
    expect(defaultDateTimeParse('')).toBeNull();
    expect(defaultDateTimeParse('   ')).toBeNull();
  });

  it('returns null when 12h hour is out of [1, 12]', () => {
    expect(defaultDateTimeParse('2026-04-24 13:00 PM')).toBeNull();
    expect(defaultDateTimeParse('2026-04-24 00:00 PM')).toBeNull();
  });

  it('returns null when minute is out of range', () => {
    expect(defaultDateTimeParse('2026-04-24 09:60')).toBeNull();
  });

  it('returns null when second is out of range', () => {
    expect(defaultDateTimeParse('2026-04-24 09:05:60')).toBeNull();
  });

  it('returns null when 24h hour is out of [0, 23]', () => {
    expect(defaultDateTimeParse('2026-04-24 24:00')).toBeNull();
  });

  it('returns null for an impossible date (e.g. Feb 30)', () => {
    expect(defaultDateTimeParse('2026-02-30 09:00')).toBeNull();
  });

  it('falls back to ISO 8601 parsing on non-matching primary regex', () => {
    const d = defaultDateTimeParse('2026-04-24T09:05:00.000Z');
    expect(d).not.toBeNull();
  });

  it('returns null when fallback parsing produces NaN', () => {
    expect(defaultDateTimeParse('not a date')).toBeNull();
  });

  it('parses with "T" separator instead of space', () => {
    const d = defaultDateTimeParse('2026-04-24T09:05')!;
    expect(d.getHours()).toBe(9);
  });

  it('round-trips: format → parse → equal date+time', () => {
    const original = new Date(2026, 3, 24, 9, 5, 7);
    const s = defaultDateTimeFormat(original, { showSecond: true });
    const back = defaultDateTimeParse(s)!;
    expect(back.getFullYear()).toBe(original.getFullYear());
    expect(back.getMonth()).toBe(original.getMonth());
    expect(back.getDate()).toBe(original.getDate());
    expect(back.getHours()).toBe(original.getHours());
    expect(back.getMinutes()).toBe(original.getMinutes());
    expect(back.getSeconds()).toBe(original.getSeconds());
  });
});
