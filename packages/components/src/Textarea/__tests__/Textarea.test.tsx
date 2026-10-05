/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Textarea 模块的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { createRef, useState } from 'react';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { lightTheme } from '@timeui/themes';
import { renderWithProviders } from '../../test-utils';
import { Textarea } from '../';

describe('Textarea — rendering & refs', () => {
  it('renders a <textarea> with the requested rows attribute', () => {
    renderWithProviders(<Textarea aria-label="bio" rows={5} />);
    const ta = screen.getByRole('textbox', { name: 'bio' }) as HTMLTextAreaElement;
    expect(ta.tagName).toBe('TEXTAREA');
    expect(ta).toHaveAttribute('rows', '5');
  });

  it('forwards ref to the underlying <textarea>', () => {
    const ref = createRef<HTMLTextAreaElement>();
    renderWithProviders(<Textarea aria-label="x" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('applies className / style to the ROOT wrapper', () => {
    const { container } = renderWithProviders(
      <Textarea aria-label="x" className="ta-root" style={{ paddingTop: 4 }} />,
    );
    const root = container.querySelector('.ta-root') as HTMLElement;
    expect(root).not.toBeNull();
    expect(root.tagName).toBe('DIV');
    expect(root.style.paddingTop).toBe('4px');
  });
});

describe('Textarea — controlled / uncontrolled', () => {
  it('controlled: onChange fires with the unwrapped string value', async () => {
    const onChange = vi.fn();
    function Harness() {
      const [v, setV] = useState('');
      return (
        <Textarea
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
    const ta = screen.getByRole('textbox') as HTMLTextAreaElement;
    await userEvent.type(ta, 'hi');
    expect(onChange.mock.calls.at(-1)?.[0]).toBe('hi');
    expect(ta.value).toBe('hi');
  });

  it('uncontrolled: defaultValue is used; onChange still fires', async () => {
    const onChange = vi.fn();
    renderWithProviders(<Textarea aria-label="x" defaultValue="seed" onChange={onChange} />);
    const ta = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(ta.value).toBe('seed');
    await userEvent.type(ta, '!');
    expect(ta.value).toBe('seed!');
    expect(onChange).toHaveBeenCalled();
  });
});

describe('Textarea — auto-size', () => {
  it('uses auto-size mode when minRows / maxRows is supplied', () => {
    renderWithProviders(
      <Textarea aria-label="x" minRows={2} maxRows={6} defaultValue="one\ntwo" />,
    );
    const ta = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(ta.style.height).not.toBe('');
  });

  it('fixed rows mode does not mutate inline height', () => {
    renderWithProviders(<Textarea aria-label="x" rows={4} />);
    const ta = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(ta.style.height).toBe('');
    expect(ta).toHaveAttribute('rows', '4');
  });
});

describe('Textarea — showCount', () => {
  it('renders `n/max` counter and sr-only a11y message', () => {
    renderWithProviders(<Textarea aria-label="x" showCount maxLength={10} defaultValue="hi" />);
    expect(screen.getByText('2/10')).toBeInTheDocument();
    expect(screen.getByText('2 of 10 characters used')).toBeInTheDocument();
  });

  it('lays out the counter below the textarea and end content without covering either', () => {
    renderWithProviders(
      <Textarea
        aria-label="Notes"
        rows={1}
        showCount
        maxLength={100}
        defaultValue="A full final line"
        endContent={<span>Attachments</span>}
      />,
    );
    const counter = screen.getByText('17/100');
    expect(getComputedStyle(counter).position).not.toBe('absolute');
    expect(getComputedStyle(counter).alignSelf).toBe('flex-end');
    expect(counter.previousElementSibling).toContainElement(screen.getByText('Attachments'));
  });

  it('updates the counter as the user types and aria-describedby includes the count id', async () => {
    function Harness() {
      const [v, setV] = useState('');
      return <Textarea aria-label="x" showCount maxLength={5} value={v} onChange={setV} />;
    }
    renderWithProviders(<Harness />);
    const ta = screen.getByRole('textbox') as HTMLTextAreaElement;
    await userEvent.type(ta, 'abc');
    expect(screen.getByText('3/5')).toBeInTheDocument();
    const describedBy = ta.getAttribute('aria-describedby') ?? '';
    expect(describedBy).toBeTruthy();
  });

  it('adds the generated count id to aria-describedby when showCount is enabled', () => {
    renderWithProviders(
      <Textarea
        aria-label="x"
        aria-describedby="external-help"
        showCount
        maxLength={10}
        defaultValue="abc"
      />,
    );
    const ta = screen.getByRole('textbox');
    const describedBy = ta.getAttribute('aria-describedby') ?? '';
    expect(describedBy).toContain('-count');
  });
});

describe('Textarea — Escape does NOT clear (spec §2.3)', () => {
  it('pressing Escape leaves the value unchanged', () => {
    function Harness() {
      const [v, setV] = useState('keep me');
      return <Textarea aria-label="x" value={v} onChange={setV} />;
    }
    renderWithProviders(<Harness />);
    const ta = screen.getByRole('textbox') as HTMLTextAreaElement;
    ta.focus();
    fireEvent.keyDown(ta, { key: 'Escape' });
    expect(ta.value).toBe('keep me');
  });
});

describe('Textarea — error state & FormField integration', () => {
  it('errorMessage → aria-invalid="true" and aria-describedby wiring', () => {
    renderWithProviders(<Textarea aria-label="x" errorMessage="Too short" />);
    const ta = screen.getByRole('textbox');
    expect(ta).toHaveAttribute('aria-invalid', 'true');
    const err = screen.getByRole('alert');
    expect(err).toHaveTextContent('Too short');
    const describedBy = ta.getAttribute('aria-describedby') ?? '';
    expect(describedBy).toContain(err.id);
  });

  it('label → htmlFor matches the textarea id', () => {
    renderWithProviders(<Textarea label="Bio" id="bio-xyz" />);
    const label = screen.getByText('Bio') as HTMLLabelElement;
    expect(label.tagName).toBe('LABEL');
    expect(label.htmlFor).toBe('bio-xyz');
    expect(screen.getByLabelText('Bio')).toHaveAttribute('id', 'bio-xyz');
  });

  it('description alone still wraps with FormField and wires aria-describedby', () => {
    renderWithProviders(<Textarea aria-label="x" id="bio-desc" description="Helpful text" />);
    const ta = screen.getByRole('textbox');
    const description = screen.getByText('Helpful text');
    expect(ta.getAttribute('aria-describedby')).toContain(description.id);
  });
});

describe('Textarea — disabled / readOnly', () => {
  it('isReadOnly sets the `readonly` attribute and keeps focus', () => {
    renderWithProviders(<Textarea aria-label="x" isReadOnly defaultValue="locked" />);
    const ta = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(ta.readOnly).toBe(true);
    ta.focus();
    expect(document.activeElement).toBe(ta);
  });

  it('isDisabled sets the disabled attribute on the textarea', () => {
    renderWithProviders(<Textarea aria-label="x" isDisabled defaultValue="x" />);
    const ta = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(ta).toBeDisabled();
  });

  it('showCount goes through warning → danger color as the value crosses 90% → 100%', () => {
    function Harness({ v }: { v: string }) {
      return <Textarea aria-label="x" showCount maxLength={10} value={v} onChange={() => {}} />;
    }
    const { rerender } = renderWithProviders(<Harness v="aaaa" />);
    expect(screen.getByText('4/10')).toBeInTheDocument();
    rerender(<Harness v="aaaaaaaaaa" />);
    expect(screen.getByText('10/10')).toBeInTheDocument();
    expect(document.head.textContent ?? '').toContain(lightTheme.colors.status.warning);
    rerender(<Harness v="aaaaaaaaaaa" />);
    expect(screen.getByText('11/10')).toBeInTheDocument();
    expect(screen.getByText('11 of 10 characters used')).toBeInTheDocument();
    expect(document.head.textContent ?? '').toContain(lightTheme.colors.status.danger);
  });

  it('keeps muted counter color before the 90% threshold', () => {
    renderWithProviders(<Textarea aria-label="x" showCount maxLength={10} defaultValue="abc" />);
    expect(screen.getByText('3/10')).toBeInTheDocument();
    expect(document.head.textContent ?? '').toContain('color:');
  });
});

describe('Textarea — layout branches', () => {
  it('supports isFullWidth and renders start/end slots', () => {
    const { container } = renderWithProviders(
      <Textarea
        aria-label="x"
        isFullWidth
        startContent={<span data-testid="ta-start">S</span>}
        endContent={<span data-testid="ta-end">E</span>}
      />,
    );
    expect(screen.getByTestId('ta-start')).toBeInTheDocument();
    expect(screen.getByTestId('ta-end')).toBeInTheDocument();
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-full-width', 'true');
  });

  it('falls back when computed line-height is normal during auto-size', () => {
    const original = window.getComputedStyle;
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element) => {
      const computed = original(element);
      return new Proxy(computed, {
        get(target, prop) {
          if (prop === 'lineHeight') return 'normal';
          const value = Reflect.get(target, prop, target);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
    });

    renderWithProviders(<Textarea aria-label="x" minRows={2} defaultValue="one\ntwo" />);
    const ta = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(ta.style.height).not.toBe('');
  });

  it('clamps auto-size to maxRows and enables overflow when content exceeds the cap', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'scrollHeight',
    );
    Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return 240;
      },
    });

    renderWithProviders(<Textarea aria-label="x" minRows={2} maxRows={3} defaultValue="many" />);
    const ta = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(ta.style.overflowY).toBe('auto');

    if (originalDescriptor) {
      Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', originalDescriptor);
    }
  });

  it('renders without FormField wrappers when no label, description or error is provided', () => {
    const { container } = renderWithProviders(<Textarea aria-label="plain" />);
    expect(container.querySelector('label')).toBeNull();
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.firstElementChild?.tagName).toBe('DIV');
    expect(screen.getByRole('textbox', { name: 'plain' })).toBeInTheDocument();
  });
});
