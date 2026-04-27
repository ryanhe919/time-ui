/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Toast 组件的可访问性（axe 0 violation）。
 */

import { afterEach, describe, it, vi } from 'vitest';
import { act, cleanup } from '@testing-library/react';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { ToastProvider, useToast } from '../';

// useToast 必须在 Provider 内才有效。InnerProbe 在 Provider 内捕获 api 给测试用。
const InnerProbe = ({ onApi }: { onApi: (api: ReturnType<typeof useToast>) => void }) => {
  const api = useToast();
  onApi(api);
  return null;
};

const renderProvider = () => {
  let captured: ReturnType<typeof useToast> | null = null;
  const result = renderWithProviders(
    <ToastProvider>
      <InnerProbe
        onApi={(api) => {
          captured = api;
        }}
      />
    </ToastProvider>,
  );
  return {
    ...result,
    getApi: () => {
      if (!captured) throw new Error('api not captured');
      return captured;
    },
  };
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Toast — a11y', () => {
  it('zero axe violations (light)', async () => {
    const { getApi, baseElement } = renderProvider();
    act(() => {
      getApi().success('ok title', { description: 'desc' } as never);
      getApi().show({
        title: 'with action',
        description: 'desc',
        duration: null,
        action: { label: 'Retry', onPress: () => {} },
      });
    });
    await expectA11y(baseElement);
  });

  it('zero axe violations (dark)', async () => {
    let captured: ReturnType<typeof useToast> | null = null;
    const { baseElement } = renderWithProviders(
      <ToastProvider>
        <InnerProbe
          onApi={(api) => {
            captured = api;
          }}
        />
      </ToastProvider>,
      { theme: 'dark' },
    );
    act(() => {
      captured?.success('ok');
    });
    await expectA11y(baseElement);
  });
});
