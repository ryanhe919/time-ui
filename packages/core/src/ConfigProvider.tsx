/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现核心模块 ConfigProvider。
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { defaultLocale, type Locale } from './i18n/messages';

export interface TimeUIConfig {
  prefixCls: string;
  direction: 'ltr' | 'rtl';
  locale: Locale;
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

export const useConfig = (): TimeUIConfig => useContext(ConfigContext);

export const __defaultConfig = defaultConfig;
