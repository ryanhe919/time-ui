/**
 * @author Ryan He
 * @date 2026-04-17
 * @description DatePicker / DateRangePicker 的纯日期工具函数集合。
 *              所有函数 SSR-safe、零依赖、不依赖 date-fns/dayjs，避免增加 bundle size。
 *              输入 Date 实例不会被原地修改 —— 所有变换都返回新的 Date。
 */

export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** 把任意 Date 规约到当天 0:00（保留时区，仅清空时分秒）。 */
export const startOfDay = (d: Date): Date => {
  const out = new Date(d.getTime());
  out.setHours(0, 0, 0, 0);
  return out;
};

/** 把任意 Date 规约到当月 1 号 0:00。 */
export const startOfMonth = (d: Date): Date => {
  const out = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  return out;
};

/** 当月最后一天的 23:59:59.999。 */
export const endOfMonth = (d: Date): Date => {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
};

/** 当月天数（28/29/30/31）。 */
export const getDaysInMonth = (d: Date): number => {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
};

/** 加 n 天（n 可负）。返回新的 Date。 */
export const addDays = (d: Date, n: number): Date => {
  const out = new Date(d.getTime());
  out.setDate(out.getDate() + n);
  return out;
};

/** 加 n 月（n 可负）。日期超出新月份时自动归到该月最后一天。 */
export const addMonths = (d: Date, n: number): Date => {
  const out = new Date(d.getFullYear(), d.getMonth() + n, 1, 0, 0, 0, 0);
  // 保留 day-of-month，但要 clamp 到目标月份的最大天数。
  const targetDay = Math.min(d.getDate(), getDaysInMonth(out));
  out.setDate(targetDay);
  return out;
};

/** 加 n 年。 */
export const addYears = (d: Date, n: number): Date => addMonths(d, n * 12);

/** 两个 Date 是否同一天（忽略时分秒）。null/undefined 永远返回 false。 */
export const isSameDay = (a: Date | null | undefined, b: Date | null | undefined): boolean => {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

/** 两个 Date 是否同一个月。 */
export const isSameMonth = (a: Date | null | undefined, b: Date | null | undefined): boolean => {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
};

/** date 是否落在 [start, end] 闭区间（按天比较，忽略时分秒）。end 可早于 start，函数会自动交换。 */
export const isInRange = (
  date: Date,
  start: Date | null | undefined,
  end: Date | null | undefined,
): boolean => {
  if (!start || !end) return false;
  const d = startOfDay(date).getTime();
  const a = startOfDay(start).getTime();
  const b = startOfDay(end).getTime();
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return d >= lo && d <= hi;
};

/** date 是否严格在区间内部（不含端点）。 */
export const isInRangeExclusive = (
  date: Date,
  start: Date | null | undefined,
  end: Date | null | undefined,
): boolean => {
  if (!start || !end) return false;
  const d = startOfDay(date).getTime();
  const a = startOfDay(start).getTime();
  const b = startOfDay(end).getTime();
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return d > lo && d < hi;
};

/** 比较两个日期（按天）：a < b 返回负值，a > b 正值，相等 0。 */
export const compareDays = (a: Date, b: Date): number => {
  return startOfDay(a).getTime() - startOfDay(b).getTime();
};

/** 把 Date clamp 到 [min, max]（按天比较）。min/max 可为空。 */
export const clampDate = (d: Date, min?: Date | null, max?: Date | null): Date => {
  if (min && compareDays(d, min) < 0) return startOfDay(min);
  if (max && compareDays(d, max) > 0) return startOfDay(max);
  return d;
};

/** 给定 weekStartsOn，返回 [day0, day1, …, day6] 索引数组（每项为 0..6 对应 Sun..Sat）。 */
export const buildWeekDayOrder = (weekStartsOn: WeekStartsOn): number[] => {
  return [0, 1, 2, 3, 4, 5, 6].map((i) => (i + weekStartsOn) % 7);
};

/** 把当月起点回退到 weekStartsOn 对应的星期几（生成日历网格起点）。 */
export const startOfCalendarGrid = (monthAnchor: Date, weekStartsOn: WeekStartsOn): Date => {
  const first = startOfMonth(monthAnchor);
  const dow = first.getDay(); // 0..6（0=Sunday）
  const back = (dow - weekStartsOn + 7) % 7;
  return addDays(first, -back);
};

export interface CalendarCell {
  date: Date;
  /** 是否属于 monthAnchor 所在月。 */
  isCurrentMonth: boolean;
}

/**
 * 生成 6×7 = 42 个连续日期格子。从 weekStartsOn 调整后的起点开始向后填。
 * 用于日历网格渲染 — 始终 42 格保证布局稳定，避免月份切换时高度跳变。
 */
export const buildCalendarMatrix = (
  monthAnchor: Date,
  weekStartsOn: WeekStartsOn,
): CalendarCell[] => {
  const start = startOfCalendarGrid(monthAnchor, weekStartsOn);
  const month = monthAnchor.getMonth();
  const year = monthAnchor.getFullYear();
  const out: CalendarCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const date = addDays(start, i);
    const isCurrentMonth = date.getMonth() === month && date.getFullYear() === year;
    out.push({ date, isCurrentMonth });
  }
  return out;
};

/** date 是否落在 [min, max]（任意一端为空视作不限制）。 */
export const isWithinBounds = (date: Date, min?: Date | null, max?: Date | null): boolean => {
  if (min && compareDays(date, min) < 0) return false;
  if (max && compareDays(date, max) > 0) return false;
  return true;
};

/** 默认格式化：本地化的 short date。 */
export const defaultFormat = (d: Date, locale?: string): string => {
  try {
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    // 极少数环境（旧 jsdom / 异常 locale）兜底。
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
};

/** 默认解析：宽容 ISO（YYYY-MM-DD）+ Date 构造器兜底。失败返回 null。 */
export const defaultParse = (s: string): Date | null => {
  const trimmed = s.trim();
  if (!trimmed) return null;
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]) - 1;
    const d = Number(isoMatch[3]);
    const dt = new Date(y, m, d);
    if (dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d) {
      return dt;
    }
  }
  const fallback = new Date(trimmed);
  if (Number.isNaN(fallback.getTime())) return null;
  return startOfDay(fallback);
};

/** 月份英文名（fallback；优先使用 toLocaleDateString({month:'long'})）。 */
export const monthLabel = (d: Date, locale?: string): string => {
  try {
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  } catch {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }
};

/** 给定 weekStartsOn，返回长度 7 的星期几短标签（如 ['Su','Mo',…]）。 */
export const weekdayLabels = (weekStartsOn: WeekStartsOn, locale?: string): string[] => {
  const order = buildWeekDayOrder(weekStartsOn);
  // 选一个已知星期日（2024-01-07 = Sunday）作为基准锚点。
  const anchor = new Date(2024, 0, 7);
  return order.map((dayIndex) => {
    const d = addDays(anchor, dayIndex);
    try {
      return d.toLocaleDateString(locale, { weekday: 'narrow' });
    } catch {
      return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayIndex] ?? '';
    }
  });
};

/** 把 range 规范化：若 end < start，则交换。 */
export const normalizeRange = <T extends { start: Date; end: Date }>(range: T): T => {
  if (compareDays(range.start, range.end) > 0) {
    return { ...range, start: range.end, end: range.start };
  }
  return range;
};
