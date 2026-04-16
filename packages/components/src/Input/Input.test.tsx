/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 验证 Input 模块的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { createRef, useState } from 'react';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, expectA11y } from '../test-utils';
import { Input } from './Input';

function Controlled({
  initial = '',
  onChange,
}: {
  initial?: string;
  onChange?: (v: string) => void;
}) {
  const [v, setV] = useState(initial);
  return (
    <Input
      aria-label="field"
      value={v}
      onChange={(next) => {
        setV(next);
        onChange?.(next);
      }}
    />
  );
}

describe('Input — rendering & refs', () => {
  it('renders an <input> element', () => {
    renderWithProviders(<Input aria-label="name" />);
    expect(screen.getByRole('textbox', { name: 'name' })).toBeInTheDocument();
  });

  it('forwards ref to the underlying <input> element', () => {
    const ref = createRef<HTMLInputElement>();
    renderWithProviders(<Input aria-label="x" ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies className / style to the ROOT wrapper, not the input', () => {
    const { container } = renderWithProviders(
      <Input aria-label="x" className="my-root" style={{ marginTop: 8 }} />,
    );
    const root = container.querySelector('.my-root') as HTMLElement;
    expect(root).not.toBeNull();
    expect(root.tagName).toBe('DIV');
    expect(root.style.marginTop).toBe('8px');
    expect(root.querySelector('input')).not.toHaveClass('my-root');
  });
});

describe('Input — controlled / uncontrolled', () => {
  it('controlled: onChange is called with the unwrapped string value', async () => {
    const onChange = vi.fn();
    renderWithProviders(<Controlled onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'field' });
    await userEvent.type(input, 'ab');
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0]).toBe('ab');
    expect(input).toHaveValue('ab');
  });

  it('onChangeEvent exposes the native ChangeEvent', async () => {
    const onChangeEvent = vi.fn();
    renderWithProviders(<Input aria-label="x" defaultValue="" onChangeEvent={onChangeEvent} />);
    await userEvent.type(screen.getByRole('textbox'), 'a');
    const [event] = onChangeEvent.mock.calls.at(-1) as [Event];
    expect(event).toBeTruthy();
    expect((event as unknown as { target: HTMLInputElement }).target).toBeInstanceOf(
      HTMLInputElement,
    );
  });

  it('uncontrolled: defaultValue is used and DOM updates on input, external state untouched', async () => {
    const onChange = vi.fn();
    renderWithProviders(<Input aria-label="x" defaultValue="foo" onChange={onChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('foo');
    await userEvent.type(input, 'z');
    expect(input.value).toBe('fooz');
    expect(onChange).toHaveBeenCalled();
  });
});

describe('Input — clearable & Escape', () => {
  it('shows the clear button only when there is a value', async () => {
    function Harness({ v }: { v: string }) {
      return <Input aria-label="x" isClearable value={v} onChange={() => {}} />;
    }
    const { rerender } = renderWithProviders(<Harness v="" />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<Harness v="hi" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label');
  });

  it('click clear empties the input, calls onClear and refocuses', async () => {
    const onClear = vi.fn();
    function Harness() {
      const [v, setV] = useState('hello');
      return <Input aria-label="x" value={v} onChange={setV} isClearable onClear={onClear} />;
    }
    renderWithProviders(<Harness />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('hello');
    const clearBtn = screen.getByRole('button');
    await userEvent.click(clearBtn);
    expect(input.value).toBe('');
    expect(onClear).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(input);
  });

  it('Escape clears value when isClearable and clearOnEscape are enabled', async () => {
    const onClear = vi.fn();
    function Harness() {
      const [v, setV] = useState('abc');
      return <Input aria-label="x" value={v} onChange={setV} isClearable onClear={onClear} />;
    }
    renderWithProviders(<Harness />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    input.focus();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('');
    expect(onClear).toHaveBeenCalled();
  });

  it('Escape does NOT clear when clearOnEscape={false}', async () => {
    function Harness() {
      const [v, setV] = useState('abc');
      return <Input aria-label="x" value={v} onChange={setV} isClearable clearOnEscape={false} />;
    }
    renderWithProviders(<Harness />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    input.focus();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('abc');
  });
});

describe('Input — password toggle', () => {
  it('password toggle switches type and reflects aria-pressed', async () => {
    renderWithProviders(<Input aria-label="pw" type="password" defaultValue="secret" />);
    const input = screen.getByLabelText('pw') as HTMLInputElement;
    expect(input.type).toBe('password');
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    expect(input.type).toBe('text');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('password toggle is hidden when isPasswordToggleVisible={false}', () => {
    renderWithProviders(<Input aria-label="pw" type="password" isPasswordToggleVisible={false} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('Input — disabled & readOnly', () => {
  it('isDisabled disables the input and adornment buttons', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Input aria-label="x" value="hello" onChange={onChange} isClearable isDisabled />,
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.disabled).toBe(true);
    const btn = screen.queryByRole('button');
    expect(btn).toBeNull();
  });

  it('isReadOnly marks the input readOnly and suppresses the clear button', () => {
    renderWithProviders(<Input aria-label="x" defaultValue="hello" isClearable isReadOnly />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.readOnly).toBe(true);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('Input — error state & FormField integration', () => {
  it('errorMessage auto-sets aria-invalid and surfaces role="alert"', () => {
    renderWithProviders(<Input aria-label="email" errorMessage="Required field" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const errorNode = screen.getByRole('alert');
    expect(errorNode).toHaveTextContent('Required field');
    const describedBy = input.getAttribute('aria-describedby') ?? '';
    expect(describedBy).toContain(errorNode.id);
  });

  it('label is rendered via FormField and tied to the input via htmlFor', () => {
    renderWithProviders(<Input label="Email" id="email-xyz" />);
    const label = screen.getByText('Email') as HTMLLabelElement;
    expect(label.tagName).toBe('LABEL');
    expect(label.htmlFor).toBe('email-xyz');
    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'email-xyz');
  });

  it('isRequired propagates to the native input and aria-required', () => {
    renderWithProviders(<Input label="Name" isRequired />);
    const input = screen.getByLabelText(/Name/) as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input).toHaveAttribute('aria-required', 'true');
  });
});

describe('Input — wrapper click focuses the input', () => {
  it('clicking the wrapper whitespace focuses the <input>', () => {
    const { container } = renderWithProviders(<Input aria-label="x" />);
    const root = container.firstElementChild as HTMLElement;
    const input = screen.getByRole('textbox');
    fireEvent.mouseDown(root, { target: root });
    expect(document.activeElement).toBe(input);
  });
});

describe('Input — start/end content', () => {
  it('renders startContent and endContent, and clicking the start slot still focuses the input', () => {
    const { container } = renderWithProviders(
      <Input
        aria-label="x"
        startContent={<span data-testid="start">@</span>}
        endContent={<span data-testid="end">USD</span>}
      />,
    );
    expect(screen.getByTestId('start')).toBeInTheDocument();
    expect(screen.getByTestId('end')).toBeInTheDocument();
    const root = container.firstElementChild as HTMLElement;
    const input = screen.getByRole('textbox');
    fireEvent.mouseDown(root, { target: root });
    expect(document.activeElement).toBe(input);
  });
});

describe('Input — dev warnings', () => {
  it('warns once when BOTH value and defaultValue are supplied', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderWithProviders(<Input aria-label="x" value="a" defaultValue="b" onChange={() => {}} />);
    expect(warn).toHaveBeenCalled();
    const msg = warn.mock.calls.map((c) => String(c[0])).join('\n');
    expect(msg).toMatch(/both.*value.*defaultValue/i);
    warn.mockRestore();
  });
});

describe('Input — a11y', () => {
  it.each([['light'], ['dark']] as const)(
    'passes axe in %s theme with label + description + error',
    async (theme) => {
      const { container } = renderWithProviders(
        <Input
          label="Email"
          description="We never share your email"
          errorMessage="Required"
          isRequired
        />,
        { theme },
      );
      await expectA11y(container);
    },
  );

  it('ships a prefers-reduced-motion rule that disables its adornment transitions', () => {
    renderWithProviders(<Input aria-label="x" defaultValue="x" isClearable onChange={() => {}} />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(styles).toMatch(/@media \(prefers-reduced-motion: reduce\)[^}]*transition:\s*none/);
  });
});
