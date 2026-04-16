/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 i18n 模块 useI18n。
 */

import { useConfig } from '../ConfigProvider';
import { messages, defaultLocale, type Messages, type Locale } from './messages';

export function useI18n(): Messages & { locale: Locale } {
  const { locale } = useConfig();
  const resolved = (locale in messages ? locale : defaultLocale) as Locale;
  return { ...messages[resolved], locale: resolved };
}

export type { Locale, Messages };
