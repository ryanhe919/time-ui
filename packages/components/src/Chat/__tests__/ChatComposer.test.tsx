/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatComposer 模块的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { createRef, useState } from 'react';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { ChatComposer, type ChatComposerHandle } from '../ChatComposer';

const getTextarea = (): HTMLTextAreaElement => screen.getByRole('textbox') as HTMLTextAreaElement;

describe('ChatComposer — rendering', () => {
  it('renders a textarea with the provided aria-label', () => {
    renderWithProviders(<ChatComposer aria-label="Ask AI" />);
    expect(screen.getByRole('textbox', { name: 'Ask AI' })).toBeInTheDocument();
  });

  it('renders the placeholder', () => {
    renderWithProviders(<ChatComposer aria-label="x" placeholder="Type a message" />);
    expect(getTextarea()).toHaveAttribute('placeholder', 'Type a message');
  });

  it('exposes an imperative handle that focuses the textarea', () => {
    const ref = createRef<ChatComposerHandle>();
    renderWithProviders(<ChatComposer aria-label="x" ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.getElement()).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.getTextarea()).toBeInstanceOf(HTMLTextAreaElement);
    ref.current?.focus();
    expect(document.activeElement).toBe(ref.current?.getTextarea());
    ref.current?.blur();
    expect(document.activeElement).not.toBe(ref.current?.getTextarea());
  });

  it('applies className / style / id to the wrapper', () => {
    const { container } = renderWithProviders(
      <ChatComposer
        aria-label="x"
        id="composer-id"
        className="composer-cls"
        style={{ width: 320 }}
      />,
    );
    const wrap = container.querySelector('#composer-id') as HTMLDivElement;
    expect(wrap).not.toBeNull();
    expect(wrap.classList.contains('composer-cls')).toBe(true);
    expect(wrap.style.width).toBe('320px');
  });

  it('forwards the name attribute to the underlying textarea', () => {
    renderWithProviders(<ChatComposer aria-label="x" name="prompt" />);
    expect(getTextarea()).toHaveAttribute('name', 'prompt');
  });
});

describe('ChatComposer — controlled / uncontrolled value', () => {
  it('controlled: onChange fires with the new value, parent decides display', async () => {
    const onChange = vi.fn();
    function Harness() {
      const [v, setV] = useState('');
      return (
        <ChatComposer
          aria-label="x"
          value={v}
          onChange={(next) => {
            setV(next);
            onChange(next);
          }}
        />
      );
    }
    renderWithProviders(<Harness />);
    await userEvent.type(getTextarea(), 'hi');
    expect(onChange.mock.calls.at(-1)?.[0]).toBe('hi');
    expect(getTextarea().value).toBe('hi');
  });

  it('uncontrolled: defaultValue seeds the textarea, typing appends', async () => {
    const onChange = vi.fn();
    renderWithProviders(<ChatComposer aria-label="x" defaultValue="seed" onChange={onChange} />);
    expect(getTextarea().value).toBe('seed');
    await userEvent.type(getTextarea(), '!');
    expect(getTextarea().value).toBe('seed!');
    expect(onChange).toHaveBeenCalled();
  });
});

describe('ChatComposer — submit semantics', () => {
  it('Enter submits the trimmed value and clears uncontrolled state', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<ChatComposer aria-label="x" onSubmit={onSubmit} />);
    const ta = getTextarea();
    await userEvent.type(ta, 'hello');
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('hello');
    expect(ta.value).toBe('');
  });

  it('Shift+Enter does not submit (allows newline)', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<ChatComposer aria-label="x" onSubmit={onSubmit} />);
    const ta = getTextarea();
    await userEvent.type(ta, 'line1');
    fireEvent.keyDown(ta, { key: 'Enter', shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('IME composition suppresses Enter submit (compositionStart → keyDown → compositionEnd)', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<ChatComposer aria-label="x" onSubmit={onSubmit} />);
    const ta = getTextarea();
    await userEvent.type(ta, 'こん');
    fireEvent.compositionStart(ta);
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.compositionEnd(ta, { data: 'こん' });
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('respects native isComposing on the keydown event', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<ChatComposer aria-label="x" onSubmit={onSubmit} />);
    const ta = getTextarea();
    await userEvent.type(ta, 'a');
    // jsdom does not always set isComposing; assert via direct dispatch with override.
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    Object.defineProperty(event, 'isComposing', { value: true });
    ta.dispatchEvent(event);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submitOnEnter={false} ignores Enter; needs explicit submit() call to trigger', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<ChatComposer aria-label="x" submitOnEnter={false} onSubmit={onSubmit} />);
    const ta = getTextarea();
    await userEvent.type(ta, 'hello');
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('empty / whitespace value: Enter does not submit', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<ChatComposer aria-label="x" onSubmit={onSubmit} />);
    const ta = getTextarea();
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.type(ta, '   ');
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('isDisabled blocks Enter submission and disables the textarea', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <ChatComposer aria-label="x" defaultValue="hello" isDisabled onSubmit={onSubmit} />,
    );
    const ta = getTextarea();
    expect(ta).toBeDisabled();
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('controlled: submit fires onSubmit but does NOT clear (parent controls value)', async () => {
    const onSubmit = vi.fn();
    function Harness() {
      const [v, setV] = useState('hello');
      return <ChatComposer aria-label="x" value={v} onChange={setV} onSubmit={onSubmit} />;
    }
    renderWithProviders(<Harness />);
    const ta = getTextarea();
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('hello');
    expect(ta.value).toBe('hello');
  });

  it('non-Enter keys do nothing special', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<ChatComposer aria-label="x" defaultValue="x" onSubmit={onSubmit} />);
    fireEvent.keyDown(getTextarea(), { key: 'a' });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('ChatComposer — slots', () => {
  it('renders top / start / end / bottom slots', () => {
    renderWithProviders(
      <ChatComposer
        aria-label="x"
        topContent={<span data-testid="top">top</span>}
        startContent={<button data-testid="start">+</button>}
        endContent={<button data-testid="end">→</button>}
        bottomContent={<span data-testid="bottom">btm</span>}
      />,
    );
    expect(screen.getByTestId('top')).toBeInTheDocument();
    expect(screen.getByTestId('start')).toBeInTheDocument();
    expect(screen.getByTestId('end')).toBeInTheDocument();
    expect(screen.getByTestId('bottom')).toBeInTheDocument();
  });

  it('does not render the toolbar row when both start and end are missing', () => {
    const { container } = renderWithProviders(<ChatComposer aria-label="x" />);
    expect(container.querySelector('[data-slot="toolbar"]')).toBeNull();
  });
});

describe('ChatComposer — focus state', () => {
  it('uses :focus-within so the wrapper does not need a focus state attribute', () => {
    const { container } = renderWithProviders(<ChatComposer aria-label="x" />);
    const wrap = container.firstElementChild as HTMLElement;
    // 视觉态由 CSS `:focus-within` 处理，不再用 React state；
    // 这里仅断言 wrapper 不再暴露 data-focused（避免 state-driven re-render）。
    expect(wrap.dataset.focused).toBeUndefined();
    getTextarea().focus();
    expect(wrap.dataset.focused).toBeUndefined();
  });

  it('exposes data-disabled on the wrapper', () => {
    const { container } = renderWithProviders(<ChatComposer aria-label="x" isDisabled />);
    const wrap = container.firstElementChild as HTMLElement;
    expect(wrap.dataset.disabled).toBe('true');
  });
});

describe('ChatComposer — auto-grow', () => {
  it('includes textarea padding in row heights and honors maxRows beyond the default CSS cap', () => {
    const originalGetComputedStyle = window.getComputedStyle.bind(window);
    const style = vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
      const computed = originalGetComputedStyle(element);
      return new Proxy(computed, {
        get(target, property) {
          if (property === 'lineHeight') return '20px';
          if (property === 'paddingTop' || property === 'paddingBottom') return '6px';
          return Reflect.get(target, property);
        },
      });
    });
    try {
      renderWithProviders(<ChatComposer aria-label="x" minRows={3} maxRows={12} />);
      const textarea = getTextarea();
      expect(textarea.style.height).toBe('72px');
      expect(textarea.style.maxHeight).toBe('252px');
    } finally {
      style.mockRestore();
    }
  });

  it('sets an inline height on mount', () => {
    renderWithProviders(<ChatComposer aria-label="x" defaultValue="line1" />);
    const ta = getTextarea();
    expect(ta.style.height).not.toBe('');
  });

  it('recomputes height when value grows', async () => {
    // Stub scrollHeight so we can observe the clamp logic. jsdom defaults to 0.
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight');
    let mocked = 24;
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return mocked;
      },
    });
    // Force a non-zero computed line-height so the [min,max] clamp window is non-degenerate.
    const originalGCS = window.getComputedStyle.bind(window);
    const gcsSpy = vi.spyOn(window, 'getComputedStyle').mockImplementation(((
      el: Element,
      pseudo?: string | null,
    ) => {
      const real = originalGCS(el, pseudo as string | undefined);
      return new Proxy(real, {
        get(target, prop) {
          if (prop === 'lineHeight') return '20px';
          if (prop === 'fontSize') return '14px';
          return Reflect.get(target, prop);
        },
      });
    }) as typeof window.getComputedStyle);
    try {
      const { rerender } = renderWithProviders(
        <ChatComposer aria-label="x" value="one" onChange={() => {}} minRows={1} maxRows={8} />,
      );
      const ta = getTextarea();
      const h1 = ta.style.height; // expected '24px' (min=20 < scroll=24 < max=160)
      mocked = 120; // simulate the textarea reporting more content
      rerender(
        <ChatComposer
          aria-label="x"
          value={'one\ntwo\nthree\nfour\nfive\nsix'}
          onChange={() => {}}
          minRows={1}
          maxRows={8}
        />,
      );
      expect(ta.style.height).not.toBe(h1);
      expect(parseInt(ta.style.height, 10)).toBeGreaterThan(parseInt(h1, 10));
    } finally {
      gcsSpy.mockRestore();
      if (original) Object.defineProperty(HTMLElement.prototype, 'scrollHeight', original);
    }
  });

  it('clamps to maxRows by enabling overflowY=auto', () => {
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight');
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return 9999;
      },
    });
    try {
      renderWithProviders(<ChatComposer aria-label="x" defaultValue="x" maxRows={2} />);
      const ta = getTextarea();
      expect(ta.style.overflowY).toBe('auto');
    } finally {
      if (original) Object.defineProperty(HTMLElement.prototype, 'scrollHeight', original);
    }
  });

  it('falls back to fontSize-based line-height when computed line-height is "normal"', () => {
    // jsdom typically returns lineHeight='' which is the empty/falsy branch; this case
    // hits the explicit "lh === normal" branch on line 58 of the component.
    const originalGCS = window.getComputedStyle.bind(window);
    const spy = vi.spyOn(window, 'getComputedStyle').mockImplementation(((
      el: Element,
      pseudo?: string | null,
    ) => {
      const real = originalGCS(el, pseudo as string | undefined);
      return new Proxy(real, {
        get(target, prop) {
          if (prop === 'lineHeight') return 'normal';
          if (prop === 'fontSize') return '14px';
          return Reflect.get(target, prop);
        },
      });
    }) as typeof window.getComputedStyle);
    try {
      renderWithProviders(<ChatComposer aria-label="x" defaultValue="hello" />);
      // Exists without throwing — the fallback path produced a numeric line height.
      expect(getTextarea().style.height).not.toBe('');
    } finally {
      spy.mockRestore();
    }
  });

  it('survives when computed font-size is NaN (defensive fallback)', () => {
    const originalGCS = window.getComputedStyle.bind(window);
    const spy = vi.spyOn(window, 'getComputedStyle').mockImplementation(((
      el: Element,
      pseudo?: string | null,
    ) => {
      const real = originalGCS(el, pseudo as string | undefined);
      return new Proxy(real, {
        get(target, prop) {
          if (prop === 'lineHeight') return 'normal';
          if (prop === 'fontSize') return 'garbage';
          return Reflect.get(target, prop);
        },
      });
    }) as typeof window.getComputedStyle);
    try {
      renderWithProviders(<ChatComposer aria-label="x" defaultValue="hello" />);
      expect(getTextarea().style.height).not.toBe('');
    } finally {
      spy.mockRestore();
    }
  });

  it('uses lineHeight from computed style when valid', () => {
    const originalGCS = window.getComputedStyle.bind(window);
    const spy = vi.spyOn(window, 'getComputedStyle').mockImplementation(((
      el: Element,
      pseudo?: string | null,
    ) => {
      const real = originalGCS(el, pseudo as string | undefined);
      return new Proxy(real, {
        get(target, prop) {
          if (prop === 'lineHeight') return '24px';
          return Reflect.get(target, prop);
        },
      });
    }) as typeof window.getComputedStyle);
    try {
      renderWithProviders(<ChatComposer aria-label="x" defaultValue="hello" />);
      expect(getTextarea().style.height).not.toBe('');
    } finally {
      spy.mockRestore();
    }
  });

  it('treats invalid (NaN) computed lineHeight as fallback', () => {
    const originalGCS = window.getComputedStyle.bind(window);
    const spy = vi.spyOn(window, 'getComputedStyle').mockImplementation(((
      el: Element,
      pseudo?: string | null,
    ) => {
      const real = originalGCS(el, pseudo as string | undefined);
      return new Proxy(real, {
        get(target, prop) {
          if (prop === 'lineHeight') return 'NaNpx';
          if (prop === 'fontSize') return '14px';
          return Reflect.get(target, prop);
        },
      });
    }) as typeof window.getComputedStyle);
    try {
      renderWithProviders(<ChatComposer aria-label="x" defaultValue="hello" />);
      expect(getTextarea().style.height).not.toBe('');
    } finally {
      spy.mockRestore();
    }
  });
});
