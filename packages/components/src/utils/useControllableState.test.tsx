/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 useControllableState 工具模块的行为与回归。
 */

import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useControllableState } from './useControllableState';

describe('utils/useControllableState', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('updates internal state in uncontrolled mode', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState({
        defaultValue: 'a',
        onChange,
        name: 'UncontrolledCase',
      }),
    );

    expect(result.current[0]).toBe('a');
    act(() => result.current[1]('b'));
    expect(result.current[0]).toBe('b');
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('calls onChange without mutating internal value in controlled mode', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) =>
        useControllableState({
          value,
          defaultValue: 'x',
          onChange,
          name: 'ControlledCase',
        }),
      { initialProps: { value: 'a' } },
    );

    expect(result.current[0]).toBe('a');
    act(() => result.current[1]('b'));
    expect(onChange).toHaveBeenCalledWith('b');
    expect(result.current[0]).toBe('a');

    rerender({ value: 'b' });
    expect(result.current[0]).toBe('b');
  });

  it('warns when both value and defaultValue are provided', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderHook(() =>
      useControllableState({
        value: 'a',
        defaultValue: 'x',
        name: 'BothPropsCase',
      }),
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('received both `value` and `defaultValue`');
  });

  it('warns when switching between controlled and uncontrolled modes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = renderHook(
      ({ value }: { value?: string }) =>
        useControllableState({
          value,
          defaultValue: 'x',
          name: 'FlipCase',
        }),
      { initialProps: { value: undefined } as { value?: string } },
    );

    rerender({ value: 'next' });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('changing from uncontrolled to controlled');
  });

  it('uses the default hook name in warnings when name is omitted', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderHook(() =>
      useControllableState({
        value: 'a',
        defaultValue: 'x',
      }),
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('useControllableState');
  });

  it('warns when switching from controlled to uncontrolled mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = renderHook(
      ({ value }: { value?: string }) =>
        useControllableState({
          value,
          defaultValue: 'x',
          name: 'FlipBackCase',
        }),
      { initialProps: { value: 'start' } as { value?: string } },
    );

    rerender({ value: undefined });
    const messages = warn.mock.calls.map((call) => String(call[0]));
    expect(
      messages.some((message) => message.includes('changing from controlled to uncontrolled')),
    ).toBe(true);
  });
});
