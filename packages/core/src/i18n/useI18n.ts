import { useConfig } from '../ConfigProvider';
import { messages, defaultLocale, type Messages, type Locale } from './messages';

/**
 * Read the active locale's message dictionary. Components pull user-facing
 * strings from here instead of hard-coding them.
 *
 * Falls back to the default locale (Chinese) if the current config.locale is
 * not a recognized key.
 */
export function useI18n(): Messages & { locale: Locale } {
  const { locale } = useConfig();
  const resolved = (locale in messages ? locale : defaultLocale) as Locale;
  return { ...messages[resolved], locale: resolved };
}

export type { Locale, Messages };
