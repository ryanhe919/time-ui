/**
 * @author Ryan He
 * @date 2026-04-24
 * @description DateTimePicker 的纯时间工具函数集合。零依赖，SSR-safe，不修改入参 Date。
 *              与 DatePicker/date-utils.ts 互补：后者聚焦于"天 / 月 / 年"，此处聚焦于"时 / 分 / 秒"。
 */

/** 把任意 Date 规约到整小时（保留 y/m/d，mm/ss/ms 清零）。 */
export const startOfHour = (d: Date): Date => {
  const out = new Date(d.getTime());
  out.setMinutes(0, 0, 0);
  return out;
};

/** 把任意 Date 规约到整分钟（ss/ms 清零）。 */
export const startOfMinute = (d: Date): Date => {
  const out = new Date(d.getTime());
  out.setSeconds(0, 0);
  return out;
};

/** 合并日期部分与时间部分 —— 取 datePart 的 y/m/d + timePart 的 h/m/s/ms，返回新 Date。 */
export const withTime = (
  datePart: Date,
  hour: number,
  minute: number,
  second: number,
  ms = 0,
): Date => {
  return new Date(
    datePart.getFullYear(),
    datePart.getMonth(),
    datePart.getDate(),
    hour,
    minute,
    second,
    ms,
  );
};

/** 用给定 h/m/s 覆盖目标 Date 的时间部分。 */
export const setTime = (target: Date, hour: number, minute: number, second: number, ms = 0): Date =>
  withTime(target, hour, minute, second, ms);

/** 同日（忽略时分秒）+ 完全相等的时分秒。null/undefined 一律 false。 */
export const isSameDateTime = (a: Date | null | undefined, b: Date | null | undefined): boolean => {
  if (!a || !b) return false;
  return a.getTime() === b.getTime();
};

/** 按 step 生成 [0, max) 范围内的整数数组（含 0）。step<=0 视作 1，max<=0 返回空。 */
export const buildTimeOptions = (max: number, step: number): number[] => {
  const s = Math.max(1, Math.floor(step));
  const m = Math.max(0, Math.floor(max));
  const out: number[] = [];
  for (let i = 0; i < m; i += s) out.push(i);
  return out;
};

/** 把 n 补到两位（"9" → "09"）。 */
export const pad2 = (n: number): string => String(n).padStart(2, '0');

/** 24 小时制 → 12 小时制的 hour 数字（0→12，1..12→1..12，13..23→1..11）。 */
export const to12Hour = (hour24: number): number => {
  const h = ((hour24 % 24) + 24) % 24;
  if (h === 0) return 12;
  if (h > 12) return h - 12;
  return h;
};

/** 12 小时制 hour + period → 24 小时制。hour12 ∈ [1, 12]，period ∈ 'am'|'pm'。 */
export const from12Hour = (hour12: number, period: 'am' | 'pm'): number => {
  const h = ((hour12 % 12) + 12) % 12; // 映射到 [0, 11]，其中 12→0
  return period === 'pm' ? h + 12 : h;
};

/** 判断 24 小时制时刻是否 AM。 */
export const isAm = (hour24: number): boolean => {
  const h = ((hour24 % 24) + 24) % 24;
  return h < 12;
};

/**
 * DateTimePicker 的默认格式化。根据 showMinute/showSecond/is12Hour 组合输出：
 * - 默认 24 小时制 "YYYY-MM-DD HH:mm"。
 * - showSecond=true 时追加 ":ss"。
 * - showMinute=false 时省略 ":mm"（此时也不会有秒）。
 * - is12Hour=true 时后缀 " AM"/" PM"。
 */
export const defaultDateTimeFormat = (
  d: Date,
  opts: { showMinute?: boolean; showSecond?: boolean; is12Hour?: boolean; locale?: string } = {},
): string => {
  const { showMinute = true, showSecond = false, is12Hour = false } = opts;
  const datePart = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const h24 = d.getHours();
  const hourStr = is12Hour ? pad2(to12Hour(h24)) : pad2(h24);
  let timePart = hourStr;
  if (showMinute) {
    timePart += `:${pad2(d.getMinutes())}`;
    if (showSecond) timePart += `:${pad2(d.getSeconds())}`;
  }
  if (is12Hour) timePart += ` ${isAm(h24) ? 'AM' : 'PM'}`;
  return `${datePart} ${timePart}`;
};

/**
 * DateTimePicker 的默认解析。宽容接收：
 * - "YYYY-MM-DD HH[:mm[:ss]]"（可带尾部空格）
 * - "YYYY-MM-DD HH[:mm] AM/PM"
 * - 直接的 ISO 8601 字符串兜底
 * 任一失败返回 null。
 */
export const defaultDateTimeParse = (s: string): Date | null => {
  const trimmed = s.trim();
  if (!trimmed) return null;
  // 同时匹配 24h 与 12h：HH:mm:ss? (AM|PM)?
  const match =
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?\s*(AM|PM|am|pm)?)?$/.exec(
      trimmed,
    );
  if (match) {
    const y = Number(match[1]);
    const mo = Number(match[2]) - 1;
    const day = Number(match[3]);
    let h = match[4] !== undefined ? Number(match[4]) : 0;
    const mm = match[5] !== undefined ? Number(match[5]) : 0;
    const ss = match[6] !== undefined ? Number(match[6]) : 0;
    const period = match[7]?.toLowerCase() as 'am' | 'pm' | undefined;
    if (period) {
      if (h < 1 || h > 12) return null;
      h = from12Hour(h, period);
    }
    if (h < 0 || h > 23 || mm < 0 || mm > 59 || ss < 0 || ss > 59) return null;
    const dt = new Date(y, mo, day, h, mm, ss, 0);
    if (
      dt.getFullYear() === y &&
      dt.getMonth() === mo &&
      dt.getDate() === day &&
      dt.getHours() === h &&
      dt.getMinutes() === mm &&
      dt.getSeconds() === ss
    ) {
      return dt;
    }
    return null;
  }
  const fallback = new Date(trimmed);
  if (Number.isNaN(fallback.getTime())) return null;
  return fallback;
};
