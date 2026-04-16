import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { defaultLocale, type Locale } from './i18n/messages';

/** Global configuration shared across every TimeUI component in the tree. */
export interface TimeUIConfig {
  /** Class-name prefix applied to every component (`${prefixCls}-button`, …). */
  prefixCls: string;
  /** Writing direction. */
  direction: 'ltr' | 'rtl';
  /** Active locale. Supported: `'zh'` | `'en'`. Defaults to `'zh'`. */
  locale: Locale;
  /**
   * Returns the DOM node that overlays (popovers, modals, …) should portal
   * into. Defaults to `document.body`. Return `null`/`undefined` to let the
   * component fall back to its own default.
   */
  getPopupContainer: (triggerNode?: HTMLElement) => HTMLElement;
}

const defaultGetPopupContainer: TimeUIConfig['getPopupContainer'] = () =>
  typeof document !== 'undefined' ? document.body : (undefined as unknown as HTMLElement);

const defaultConfig: TimeUIConfig = {
  prefixCls: 'timeui',
  direction: 'ltr',
  locale: defaultLocale,
  getPopupContainer: defaultGetPopupContainer,
};

const ConfigContext = createContext<TimeUIConfig>(defaultConfig);
ConfigContext.displayName = 'TimeUIConfigContext';

export interface ConfigProviderProps extends Partial<TimeUIConfig> {
  children: ReactNode;
}

/**
 * Provides app-wide TimeUI configuration. Nested `ConfigProvider`s merge their
 * overrides onto the parent config.
 */
export const ConfigProvider = ({ children, ...overrides }: ConfigProviderProps) => {
  const parent = useContext(ConfigContext);
  const value = useMemo<TimeUIConfig>(
    () => {
      const merged: TimeUIConfig = { ...parent };
      (Object.keys(overrides) as (keyof TimeUIConfig)[]).forEach((k) => {
        const v = overrides[k];
        if (v !== undefined) {
          (merged as any)[k] = v;
        }
      });
      return merged;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      parent,
      overrides.prefixCls,
      overrides.direction,
      overrides.locale,
      overrides.getPopupContainer,
    ],
  );
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

/**
 * Read TimeUI's global config. Safely returns defaults if no `ConfigProvider`
 * is mounted above the caller.
 */
export const useConfig = (): TimeUIConfig => useContext(ConfigContext);

/** Exposed for tests and advanced integrations. */
export const __defaultConfig = defaultConfig;
