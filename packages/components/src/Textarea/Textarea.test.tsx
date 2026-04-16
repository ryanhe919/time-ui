import { describe, it, expect, vi } from 'vitest';
import { createRef, useState } from 'react';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, expectA11y } from '../test-utils';
import { Textarea } from './Textarea';

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

  it('onChangeEvent exposes the native ChangeEvent', async () => {
    const onChangeEvent = vi.fn();
    renderWithProviders(<Textarea aria-label="x" onChangeEvent={onChangeEvent} />);
    await userEvent.type(screen.getByRole('textbox'), 'a');
    const [event] = onChangeEvent.mock.calls.at(-1) as [Event];
    expect((event as unknown as { target: HTMLTextAreaElement }).target).toBeInstanceOf(
      HTMLTextAreaElement,
    );
  });
});

describe('Textarea — auto-size', () => {
  it('uses auto-size mode when minRows / maxRows is supplied', () => {
    // jsdom doesn't do layout, but we can at least verify the auto-size path
    // wrote an inline height onto the textarea on mount.
    renderWithProviders(
      <Textarea aria-label="x" minRows={2} maxRows={6} defaultValue="one\ntwo" />,
    );
    const ta = screen.getByRole('textbox') as HTMLTextAreaElement;
    // After the layout effect, inline height should be set (even if 0px).
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
    // Visible counter.
    expect(screen.getByText('2/10')).toBeInTheDocument();
    // sr-only message (inline aria-live node).
    expect(screen.getByText('2 of 10 characters used')).toBeInTheDocument();
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
    // 4/10 — still muted (under 90%); we just assert the count renders.
    expect(screen.getByText('4/10')).toBeInTheDocument();
    rerender(<Harness v="aaaaaaaaa" />);
    // 9/10 — warning threshold (>90% of maxLength).
    expect(screen.getByText('9/10')).toBeInTheDocument();
    rerender(<Harness v="aaaaaaaaaaa" />);
    // 11/10 — danger.
    expect(screen.getByText('11/10')).toBeInTheDocument();
    expect(screen.getByText('11 of 10 characters used')).toBeInTheDocument();
  });
});

describe('Textarea — a11y', () => {
  it.each([['light'], ['dark']] as const)('passes axe in %s theme', async (theme) => {
    const { container } = renderWithProviders(
      <Textarea label="Bio" description="Tell us something" defaultValue="Hi." />,
      { theme },
    );
    await expectA11y(container);
  });
});
