/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 SegmentedControl 模块的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { SegmentedControl } from '../';
import type {
  SegmentedControlOption,
  SegmentedControlSize,
  SegmentedControlColor,
} from '../SegmentedControl.types';

const RANGE_OPTIONS: ReadonlyArray<SegmentedControlOption> = [
  { value: '1d', label: '1D' },
  { value: '7d', label: '7D' },
  { value: '1m', label: '1M' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'All' },
];

const ICON_OPTIONS: ReadonlyArray<SegmentedControlOption> = [
  { value: 'chats', label: 'Chats', icon: <span data-testid="icon-chats">💬</span> },
  { value: 'emails', label: 'Emails', icon: <span data-testid="icon-emails">✉️</span> },
];

const getRadios = (): HTMLInputElement[] => screen.getAllByRole('radio') as HTMLInputElement[];

describe('SegmentedControl — basic rendering', () => {
  it('renders one radio per option with role=radio', () => {
    renderWithProviders(
      <SegmentedControl aria-label="Range" options={RANGE_OPTIONS} defaultValue="1d" />,
    );
    expect(getRadios()).toHaveLength(RANGE_OPTIONS.length);
  });

  it('wraps the radios in a group with role="radiogroup"', () => {
    renderWithProviders(
      <SegmentedControl aria-label="Range" options={RANGE_OPTIONS} defaultValue="1d" />,
    );
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-label', 'Range');
    expect(group).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('checks the option matching defaultValue', () => {
    renderWithProviders(
      <SegmentedControl aria-label="Range" options={RANGE_OPTIONS} defaultValue="1m" />,
    );
    const radios = getRadios();
    expect(radios[0]!.checked).toBe(false);
    expect(radios[2]!.checked).toBe(true);
  });

  it('falls back to first non-disabled option when neither value nor defaultValue is given', () => {
    const opts: SegmentedControlOption[] = [
      { value: 'a', label: 'A', isDisabled: true },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C' },
    ];
    renderWithProviders(<SegmentedControl aria-label="x" options={opts} />);
    const radios = getRadios();
    expect(radios[0]!.checked).toBe(false);
    expect(radios[1]!.checked).toBe(true);
  });

  it('renders no checked option when value is unmatched (selectedIndex < 0)', () => {
    renderWithProviders(
      <SegmentedControl
        aria-label="x"
        options={RANGE_OPTIONS}
        value={'unknown' as never}
        onChange={() => {}}
      />,
    );
    expect(getRadios().every((r) => !r.checked)).toBe(true);
  });

  it('renders icons alongside labels when provided', () => {
    renderWithProviders(
      <SegmentedControl aria-label="Inbox" options={ICON_OPTIONS} defaultValue="chats" />,
    );
    expect(screen.getByTestId('icon-chats')).toBeInTheDocument();
    expect(screen.getByTestId('icon-emails')).toBeInTheDocument();
    expect(screen.getByText('Chats')).toBeInTheDocument();
  });

  it('renders icon-only options (label omitted)', () => {
    const opts: SegmentedControlOption[] = [
      {
        value: 'list',
        label: null,
        icon: <span data-testid="i-list">≡</span>,
        'aria-label': 'List',
      },
      {
        value: 'grid',
        label: null,
        icon: <span data-testid="i-grid">▦</span>,
        'aria-label': 'Grid',
      },
    ];
    const { container } = renderWithProviders(
      <SegmentedControl aria-label="View" options={opts} defaultValue="list" />,
    );
    expect(screen.getByTestId('i-list')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-segmented-label]')).toHaveLength(0);
  });

  it('icon-only options activate square segments + circular indicator', () => {
    const opts: SegmentedControlOption[] = [
      { value: 'sun', label: null, icon: <span>☀</span>, 'aria-label': 'Light' },
      { value: 'moon', label: null, icon: <span>🌙</span>, 'aria-label': 'Dark' },
    ];
    const { container } = renderWithProviders(
      <SegmentedControl aria-label="Theme" options={opts} defaultValue="sun" />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.dataset.iconOnly).toBe('true');
    const track = container.querySelector('[data-segmented-track]') as HTMLElement;
    // grid columns are sized to the segment side length (square), not 1fr / percentages.
    expect(track.style.gridTemplateColumns).toMatch(/repeat\(2,\s*calc\(/);
  });

  it('treats ReactNode labels as centered icon content in icon-only mode', () => {
    const opts: SegmentedControlOption[] = [
      { value: 'sun', label: <span data-testid="icon-sun">☀</span>, 'aria-label': 'Light' },
      { value: 'moon', label: <span data-testid="icon-moon">🌙</span>, 'aria-label': 'Dark' },
    ];
    const { container } = renderWithProviders(
      <SegmentedControl aria-label="Theme" options={opts} defaultValue="sun" />,
    );
    expect(screen.getByTestId('icon-sun')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-segmented-label]')).toHaveLength(0);
  });

  it('mixed icon + label options stay rectangular (no icon-only mode)', () => {
    const { container } = renderWithProviders(
      <SegmentedControl aria-label="Inbox" options={ICON_OPTIONS} defaultValue="chats" />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.dataset.iconOnly).toBeUndefined();
  });

  it('handles empty options array gracefully (no radios, no crash)', () => {
    const { container } = renderWithProviders(<SegmentedControl aria-label="empty" options={[]} />);
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(container.querySelector('[data-segmented-track]')).not.toBeNull();
  });
});

describe('SegmentedControl — controlled / uncontrolled', () => {
  it('uncontrolled: clicking an option updates the checked state and fires onChange', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <SegmentedControl
        aria-label="Range"
        options={RANGE_OPTIONS}
        defaultValue="1d"
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('radio', { name: '7D' }));
    expect(onChange).toHaveBeenCalledWith('7d');
    expect((screen.getByRole('radio', { name: '7D' }) as HTMLInputElement).checked).toBe(true);
  });

  it('controlled: onChange fires but checked state remains driven by props', async () => {
    const onChange = vi.fn();
    const { rerender } = renderWithProviders(
      <SegmentedControl aria-label="x" options={RANGE_OPTIONS} value="1d" onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole('radio', { name: '1Y' }));
    expect(onChange).toHaveBeenCalledWith('1y');
    expect((screen.getByRole('radio', { name: '1Y' }) as HTMLInputElement).checked).toBe(false);
    rerender(
      <SegmentedControl aria-label="x" options={RANGE_OPTIONS} value="1y" onChange={onChange} />,
    );
    expect((screen.getByRole('radio', { name: '1Y' }) as HTMLInputElement).checked).toBe(true);
  });

  it('clicking the already-selected option does not refire onChange', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <SegmentedControl
        aria-label="x"
        options={RANGE_OPTIONS}
        defaultValue="1d"
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('radio', { name: '1D' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('SegmentedControl — disabled / readonly / invalid / required', () => {
  it('isDisabled disables all radios and applies aria-disabled to the group', () => {
    renderWithProviders(
      <SegmentedControl aria-label="x" options={RANGE_OPTIONS} defaultValue="1d" isDisabled />,
    );
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-disabled', 'true');
    getRadios().forEach((r) => expect(r).toBeDisabled());
  });

  it('per-option isDisabled marks just that radio as disabled', () => {
    const opts: SegmentedControlOption[] = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', isDisabled: true },
      { value: 'c', label: 'C' },
    ];
    renderWithProviders(<SegmentedControl aria-label="x" options={opts} defaultValue="a" />);
    const radios = getRadios();
    expect(radios[0]!).not.toBeDisabled();
    expect(radios[1]!).toBeDisabled();
    expect(radios[2]!).not.toBeDisabled();
  });

  it('isReadOnly reverts the checked DOM state on change attempts and suppresses onChange', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <SegmentedControl
        aria-label="x"
        options={RANGE_OPTIONS}
        defaultValue="1d"
        isReadOnly
        onChange={onChange}
      />,
    );
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-readonly', 'true');
    // Browser clicks would optimistically check; simulate the resulting change event directly.
    const seven = screen.getByRole('radio', { name: '7D' }) as HTMLInputElement;
    fireEvent.click(seven);
    expect(onChange).not.toHaveBeenCalled();
    // The currently selected option remains checked.
    expect((screen.getByRole('radio', { name: '1D' }) as HTMLInputElement).checked).toBe(true);
  });

  it('isInvalid sets aria-invalid="true" on group and each input', () => {
    renderWithProviders(
      <SegmentedControl aria-label="x" options={RANGE_OPTIONS} defaultValue="1d" isInvalid />,
    );
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');
    getRadios().forEach((r) => expect(r).toHaveAttribute('aria-invalid', 'true'));
  });

  it('isRequired marks only the first radio with `required` (anchor for validation)', () => {
    renderWithProviders(
      <SegmentedControl aria-label="x" options={RANGE_OPTIONS} defaultValue="1d" isRequired />,
    );
    const radios = getRadios();
    expect(radios[0]!).toHaveAttribute('required');
    expect(radios[1]!).not.toHaveAttribute('required');
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
  });
});

describe('SegmentedControl — orientation', () => {
  it('orientation="vertical" sets aria-orientation and data-orientation', () => {
    const { container } = renderWithProviders(
      <SegmentedControl
        aria-label="x"
        options={RANGE_OPTIONS}
        defaultValue="1d"
        orientation="vertical"
      />,
    );
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-orientation', 'vertical');
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.dataset.orientation).toBe('vertical');
  });

  it('horizontal is the default orientation', () => {
    renderWithProviders(
      <SegmentedControl aria-label="x" options={RANGE_OPTIONS} defaultValue="1d" />,
    );
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-orientation', 'horizontal');
  });
});

describe('SegmentedControl — keyboard interaction', () => {
  it('Tab focuses the first radio in the group', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SegmentedControl aria-label="x" options={RANGE_OPTIONS} defaultValue="1d" />,
    );
    await user.tab();
    expect(getRadios()[0]).toHaveFocus();
  });

  it('Space activates the focused radio', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <SegmentedControl
        aria-label="x"
        options={RANGE_OPTIONS}
        defaultValue="1d"
        onChange={onChange}
      />,
    );
    const seven = screen.getByRole('radio', { name: '7D' });
    seven.focus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith('7d');
  });
});

describe('SegmentedControl — labels and aria', () => {
  it('renders a visible label and links it via aria-labelledby on the group', () => {
    renderWithProviders(
      <SegmentedControl label="Date range" options={RANGE_OPTIONS} defaultValue="1d" />,
    );
    const labelEl = screen.getByText('Date range');
    expect(labelEl).toBeInTheDocument();
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-labelledby', labelEl.id);
  });

  it('shows a danger asterisk after the label when isRequired', () => {
    renderWithProviders(
      <SegmentedControl label="Date range" options={RANGE_OPTIONS} defaultValue="1d" isRequired />,
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('forwards aria-labelledby and aria-describedby through to the radiogroup', () => {
    renderWithProviders(
      <>
        <span id="ext">External label</span>
        <span id="ext-desc">A help text</span>
        <SegmentedControl
          aria-labelledby="ext"
          aria-describedby="ext-desc"
          options={RANGE_OPTIONS}
          defaultValue="1d"
        />
      </>,
    );
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-labelledby', 'ext');
    expect(group).toHaveAttribute('aria-describedby', 'ext-desc');
  });

  it('uses option.label as accessible name when string', () => {
    renderWithProviders(
      <SegmentedControl aria-label="x" options={RANGE_OPTIONS} defaultValue="1d" />,
    );
    expect(screen.getByRole('radio', { name: '1D' })).toBeInTheDocument();
  });

  it('option["aria-label"] overrides the visible label for the accessible name', () => {
    const opts: SegmentedControlOption[] = [
      { value: 'chats', label: <span>💬</span>, 'aria-label': 'Chats' },
      { value: 'emails', label: <span>✉️</span>, 'aria-label': 'Emails' },
    ];
    renderWithProviders(<SegmentedControl aria-label="x" options={opts} defaultValue="chats" />);
    expect(screen.getByRole('radio', { name: 'Chats' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Emails' })).toBeInTheDocument();
  });

  it('respects a custom id on the wrapper', () => {
    const { container } = renderWithProviders(
      <SegmentedControl id="my-seg" aria-label="x" options={RANGE_OPTIONS} defaultValue="1d" />,
    );
    expect(container.querySelector('#my-seg')).not.toBeNull();
  });
});

describe('SegmentedControl — form submission', () => {
  it('every radio shares the same auto-generated name', () => {
    renderWithProviders(
      <SegmentedControl aria-label="x" options={RANGE_OPTIONS} defaultValue="1d" />,
    );
    const radios = getRadios();
    const first = radios[0]!.getAttribute('name');
    expect(first).toBeTruthy();
    radios.forEach((r) => expect(r.getAttribute('name')).toBe(first));
  });

  it('submits the selected value under `name`', () => {
    const { container } = renderWithProviders(
      <form>
        <SegmentedControl aria-label="x" options={RANGE_OPTIONS} defaultValue="1m" name="range" />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    const fd = new FormData(form);
    expect(fd.get('range')).toBe('1m');
  });
});

describe('SegmentedControl — color and size variants', () => {
  it.each(['default', 'primary', 'secondary', 'success', 'warning', 'danger'] as const)(
    'renders color=%s without crashing',
    (color: SegmentedControlColor) => {
      renderWithProviders(
        <SegmentedControl aria-label="x" options={RANGE_OPTIONS} defaultValue="1d" color={color} />,
      );
      expect(screen.getAllByRole('radio')).toHaveLength(RANGE_OPTIONS.length);
    },
  );

  it.each(['sm', 'md', 'lg'] as const)(
    'renders size=%s without crashing',
    (size: SegmentedControlSize) => {
      renderWithProviders(
        <SegmentedControl aria-label="x" options={RANGE_OPTIONS} defaultValue="1d" size={size} />,
      );
      expect(screen.getAllByRole('radio')).toHaveLength(RANGE_OPTIONS.length);
    },
  );

  it('isFullWidth + isIconOnly stays inline-grid (icon-only wins for compactness)', () => {
    const opts: SegmentedControlOption[] = [
      { value: 'a', label: <span>A</span>, 'aria-label': 'A' },
      { value: 'b', label: <span>B</span>, 'aria-label': 'B' },
    ];
    const { container } = renderWithProviders(
      <SegmentedControl aria-label="x" options={opts} defaultValue="a" isFullWidth />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.dataset.iconOnly).toBe('true');
  });

  it('vertical (text labels) sizes track height to N rows + padding and rows to size token', () => {
    const { container } = renderWithProviders(
      <SegmentedControl
        aria-label="x"
        options={RANGE_OPTIONS}
        defaultValue="1d"
        orientation="vertical"
      />,
    );
    const track = container.querySelector('[data-segmented-track]') as HTMLElement;
    // grid-template-rows must be in absolute units (size token), not % of an unset height.
    expect(track.style.gridTemplateRows).toMatch(/repeat\(5,\s*\d+px\)/);
    // The trackCss height = N * height + 2 * innerPadding, emitted via emotion.
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/height:\s*calc\(5\s*\*\s*\d+px\s*\+\s*2\s*\*\s*\d+px\)/);
  });

  it('vertical + icon-only sets grid-template-rows to fixed segment dim', () => {
    const opts: SegmentedControlOption[] = [
      { value: 'a', label: <span>A</span>, 'aria-label': 'A' },
      { value: 'b', label: <span>B</span>, 'aria-label': 'B' },
    ];
    const { container } = renderWithProviders(
      <SegmentedControl aria-label="x" options={opts} defaultValue="a" orientation="vertical" />,
    );
    const track = container.querySelector('[data-segmented-track]') as HTMLElement;
    expect(track.style.gridTemplateRows).toMatch(/repeat\(2,\s*calc\(/);
  });

  it('numeric labels stay rectangular (treated as textual)', () => {
    const opts: SegmentedControlOption[] = [
      { value: '1', label: 1 as unknown as string },
      { value: '2', label: 2 as unknown as string },
    ];
    const { container } = renderWithProviders(
      <SegmentedControl aria-label="x" options={opts} defaultValue="1" />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.dataset.iconOnly).toBeUndefined();
  });

  it('isFullWidth=true switches the wrapper to block layout', () => {
    const { container } = renderWithProviders(
      <SegmentedControl aria-label="x" options={RANGE_OPTIONS} defaultValue="1d" isFullWidth />,
    );
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/display:\s*block/);
    expect(container.firstElementChild).not.toBeNull();
  });
});

describe('SegmentedControl — refs and a11y', () => {
  it('forwards ref to the wrapper div', () => {
    let captured: HTMLDivElement | null = null;
    renderWithProviders(
      <SegmentedControl
        aria-label="x"
        options={RANGE_OPTIONS}
        defaultValue="1d"
        ref={(node: HTMLDivElement | null) => {
          captured = node;
        }}
      />,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
  });

  it('emits the prefers-reduced-motion override rule', () => {
    renderWithProviders(
      <SegmentedControl aria-label="x" options={RANGE_OPTIONS} defaultValue="1d" />,
    );
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});
