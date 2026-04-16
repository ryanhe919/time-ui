import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ConfigProvider, useConfig, __defaultConfig } from './ConfigProvider';

describe('useConfig', () => {
  it('returns defaults when called outside a provider', () => {
    const { result } = renderHook(() => useConfig());
    expect(result.current.prefixCls).toBe(__defaultConfig.prefixCls);
    expect(result.current.direction).toBe('ltr');
    expect(result.current.locale).toBe('zh');
    expect(typeof result.current.getPopupContainer).toBe('function');
  });

  it('merges overrides from ConfigProvider', () => {
    const { result } = renderHook(() => useConfig(), {
      wrapper: ({ children }) => (
        <ConfigProvider prefixCls="acme" direction="rtl">
          {children}
        </ConfigProvider>
      ),
    });
    expect(result.current.prefixCls).toBe('acme');
    expect(result.current.direction).toBe('rtl');
    expect(result.current.locale).toBe('zh');
  });

  it('nested providers merge onto parent', () => {
    const { result } = renderHook(() => useConfig(), {
      wrapper: ({ children }) => (
        <ConfigProvider prefixCls="outer" locale="fr-FR">
          <ConfigProvider prefixCls="inner">{children}</ConfigProvider>
        </ConfigProvider>
      ),
    });
    expect(result.current.prefixCls).toBe('inner');
    expect(result.current.locale).toBe('fr-FR');
  });
});
