/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Slider 模块的行为与回归。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { Slider } from '../';

const getThumbs = (): HTMLInputElement[] => screen.getAllByRole('slider') as HTMLInputElement[];
const getThumb = (): HTMLInputElement => screen.getByRole('slider') as HTMLInputElement;

const stubTrackRect = (track: Element, len = 200): void => {
  const rect = {
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: len,
    bottom: len,
    width: len,
    height: len,
    toJSON: () => ({}),
  } as DOMRect;
  vi.spyOn(track as HTMLElement, 'getBoundingClientRect').mockReturnValue(rect);
};

// jsdom's PointerEvent constructor sometimes drops clientX/Y from the init dict; building a
// MouseEvent and dispatching it under a pointer-event type sidesteps the issue and gives us
// deterministic coordinates everywhere. Wrapped in act() so the resulting state updates are
// flushed before the next assertion.
const dispatchPointer = (
  target: EventTarget,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  init: { clientX?: number; clientY?: number; button?: number; pointerType?: string } = {},
): void => {
  act(() => {
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: init.clientX ?? 0,
      clientY: init.clientY ?? 0,
      button: init.button ?? 0,
    });
    Object.defineProperty(event, 'pointerType', { value: init.pointerType ?? 'mouse' });
    target.dispatchEvent(event);
  });
};

describe('Slider — base rendering', () => {
  it('renders a single thumb with role="slider" and the default value', () => {
    renderWithProviders(<Slider aria-label="volume" defaultValue={30} />);
    const thumb = getThumb();
    expect(thumb).toHaveAttribute('aria-orientation', 'horizontal');
    expect(thumb).toHaveAttribute('aria-valuemin', '0');
    expect(thumb).toHaveAttribute('aria-valuemax', '100');
    expect(thumb).toHaveAttribute('aria-valuenow', '30');
    expect(thumb).toHaveAttribute('aria-label', 'volume');
  });

  it('falls back to min when no value/defaultValue provided', () => {
    renderWithProviders(<Slider aria-label="x" min={5} max={10} />);
    expect(getThumb()).toHaveAttribute('aria-valuenow', '5');
  });

  it('renders a range slider with two thumbs when defaultValue is an array', () => {
    renderWithProviders(<Slider aria-label="price" defaultValue={[100, 500]} max={1000} />);
    const thumbs = getThumbs();
    expect(thumbs).toHaveLength(2);
    expect(thumbs[0]).toHaveAttribute('aria-valuenow', '100');
    expect(thumbs[1]).toHaveAttribute('aria-valuenow', '500');
    expect(thumbs[0]).toHaveAttribute('aria-label', 'price minimum');
    expect(thumbs[1]).toHaveAttribute('aria-label', 'price maximum');
  });

  it('range thumb min/max attrs constrain each other', () => {
    renderWithProviders(<Slider aria-label="x" defaultValue={[20, 80]} />);
    const [lo, hi] = getThumbs() as [HTMLInputElement, HTMLInputElement];
    expect(lo).toHaveAttribute('max', '80');
    expect(hi).toHaveAttribute('min', '20');
  });
});

describe('Slider — controlled / uncontrolled', () => {
  it('controlled value prop is reflected in the input', () => {
    const { rerender } = renderWithProviders(
      <Slider aria-label="x" value={20} onChange={() => {}} />,
    );
    expect(getThumb()).toHaveAttribute('aria-valuenow', '20');
    rerender(<Slider aria-label="x" value={70} onChange={() => {}} />);
    expect(getThumb()).toHaveAttribute('aria-valuenow', '70');
  });

  it('uncontrolled: changing the input updates aria-valuenow locally', () => {
    const onChange = vi.fn();
    renderWithProviders(<Slider aria-label="x" defaultValue={10} onChange={onChange} />);
    const thumb = getThumb();
    fireEvent.change(thumb, { target: { value: '40' } });
    expect(thumb).toHaveAttribute('aria-valuenow', '40');
    expect(onChange).toHaveBeenLastCalledWith(40);
  });

  it('controlled: change fires onChange but does not auto-update without re-render', () => {
    const onChange = vi.fn();
    renderWithProviders(<Slider aria-label="x" value={10} onChange={onChange} />);
    const thumb = getThumb();
    fireEvent.change(thumb, { target: { value: '55' } });
    expect(onChange).toHaveBeenLastCalledWith(55);
    expect(thumb).toHaveAttribute('aria-valuenow', '10');
  });

  it('range mode: changing low thumb forwards an array onChange', () => {
    const onChange = vi.fn();
    renderWithProviders(<Slider aria-label="x" defaultValue={[10, 50]} onChange={onChange} />);
    const lo = getThumbs()[0]!;
    fireEvent.change(lo, { target: { value: '20' } });
    expect(onChange).toHaveBeenLastCalledWith([20, 50]);
  });

  it('range mode: low thumb cannot cross above the high thumb', () => {
    renderWithProviders(<Slider aria-label="x" defaultValue={[10, 50]} />);
    const [lo, hi] = getThumbs() as [HTMLInputElement, HTMLInputElement];
    fireEvent.change(lo, { target: { value: '99' } });
    expect(lo).toHaveAttribute('aria-valuenow', '50');
    expect(hi).toHaveAttribute('aria-valuenow', '50');
  });

  it('range mode: high thumb cannot cross below the low thumb', () => {
    renderWithProviders(<Slider aria-label="x" defaultValue={[10, 50]} />);
    const [lo, hi] = getThumbs() as [HTMLInputElement, HTMLInputElement];
    fireEvent.change(hi, { target: { value: '5' } });
    expect(hi).toHaveAttribute('aria-valuenow', '10');
    expect(lo).toHaveAttribute('aria-valuenow', '10');
  });

  it('ignores non-finite input values', () => {
    // jsdom's range input may coerce arbitrary strings to a numeric default; we only assert
    // that no NaN sneaks through the controlled state.
    renderWithProviders(<Slider aria-label="x" defaultValue={20} />);
    const thumb = getThumb();
    fireEvent.change(thumb, { target: { value: '' } });
    expect(getThumb().getAttribute('aria-valuenow')).not.toBe('NaN');
  });
});

describe('Slider — min / max / step', () => {
  it('clamps to [min, max] when input arrives outside bounds', () => {
    renderWithProviders(<Slider aria-label="x" min={0} max={100} defaultValue={50} />);
    const thumb = getThumb();
    fireEvent.change(thumb, { target: { value: '999' } });
    expect(thumb).toHaveAttribute('aria-valuenow', '100');
    fireEvent.change(thumb, { target: { value: '-50' } });
    expect(thumb).toHaveAttribute('aria-valuenow', '0');
  });

  it('snaps to step', () => {
    renderWithProviders(<Slider aria-label="x" min={0} max={100} step={10} defaultValue={0} />);
    const thumb = getThumb();
    fireEvent.change(thumb, { target: { value: '53' } });
    expect(thumb).toHaveAttribute('aria-valuenow', '50');
  });

  it('preserves decimal precision when step is fractional', () => {
    renderWithProviders(<Slider aria-label="x" min={0} max={1} step={0.1} defaultValue={0} />);
    const thumb = getThumb();
    fireEvent.change(thumb, { target: { value: '0.6' } });
    expect(thumb).toHaveAttribute('aria-valuenow', '0.6');
  });

  it('handles degenerate range when min === max (no NaN)', () => {
    renderWithProviders(<Slider aria-label="x" min={5} max={5} defaultValue={5} />);
    expect(getThumb()).toHaveAttribute('aria-valuenow', '5');
  });
});

describe('Slider — disabled / readonly / invalid / required', () => {
  it('isDisabled disables the input and ignores pointer drags', () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Slider aria-label="x" defaultValue={20} isDisabled onChange={onChange} />,
    );
    expect(getThumb()).toBeDisabled();
    const track = container.querySelector('[data-track]') as HTMLElement;
    stubTrackRect(track);
    dispatchPointer(track, 'pointerdown', { clientX: 100, clientY: 0, button: 0 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('isReadOnly swallows input changes and reverts the DOM value', () => {
    const onChange = vi.fn();
    renderWithProviders(<Slider aria-label="x" defaultValue={30} isReadOnly onChange={onChange} />);
    const thumb = getThumb();
    fireEvent.change(thumb, { target: { value: '70' } });
    expect(onChange).not.toHaveBeenCalled();
    expect(thumb.value).toBe('30');
  });

  it('isReadOnly also blocks pointer drags', () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Slider aria-label="x" defaultValue={20} isReadOnly onChange={onChange} />,
    );
    const track = container.querySelector('[data-track]') as HTMLElement;
    stubTrackRect(track);
    dispatchPointer(track, 'pointerdown', { clientX: 100, clientY: 0, button: 0 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('isInvalid sets aria-invalid="true" on each thumb', () => {
    renderWithProviders(<Slider aria-label="x" defaultValue={[10, 90]} isInvalid />);
    getThumbs().forEach((t) => expect(t).toHaveAttribute('aria-invalid', 'true'));
  });

  it('isRequired only annotates the first thumb (range mode)', () => {
    // <input type="range"> ignores `required` semantically, but we still emit the attribute
    // so consumers building a custom validation layer can see which thumb is the anchor.
    renderWithProviders(<Slider aria-label="x" defaultValue={[10, 50]} isRequired />);
    const [lo, hi] = getThumbs() as [HTMLInputElement, HTMLInputElement];
    expect(lo).toHaveAttribute('required');
    expect(hi).not.toHaveAttribute('required');
  });
});

describe('Slider — labels and value display', () => {
  it('renders a visible label and links it via aria-labelledby on the wrapper', () => {
    renderWithProviders(<Slider label="Volume" defaultValue={30} />);
    const label = screen.getByText('Volume');
    expect(label).toBeInTheDocument();
    const wrapper = label.closest('[role="group"]') as HTMLElement;
    expect(wrapper.getAttribute('aria-labelledby')).toBe(label.getAttribute('id'));
  });

  it('uses string label as accessible name for thumbs when aria-label is missing', () => {
    renderWithProviders(<Slider label="Volume" defaultValue={30} />);
    expect(getThumb()).toHaveAttribute('aria-label', 'Volume');
  });

  it('formats value with default formatter (single)', () => {
    renderWithProviders(<Slider label="Volume" defaultValue={30} showValue />);
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('renders the value alone (no label) on the header row', () => {
    renderWithProviders(<Slider aria-label="x" defaultValue={42} showValue />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('formats value with default formatter (range, en dash)', () => {
    renderWithProviders(<Slider label="Range" defaultValue={[10, 90]} showValue />);
    expect(screen.getByText('10 – 90')).toBeInTheDocument();
  });

  it('uses formatValue for both display and aria-valuetext', () => {
    const fmt = (v: number | [number, number]) =>
      Array.isArray(v) ? `$${v[0]}–$${v[1]}` : `$${v}`;
    renderWithProviders(
      <Slider label="Price" defaultValue={[100, 500]} max={1000} showValue formatValue={fmt} />,
    );
    expect(screen.getByText('$100–$500')).toBeInTheDocument();
    const lo = getThumbs()[0]!;
    expect(lo).toHaveAttribute('aria-valuetext', '$100–$500');
  });

  it('renders startContent and endContent', () => {
    renderWithProviders(
      <Slider
        aria-label="x"
        defaultValue={30}
        startContent={<span data-testid="start">▼</span>}
        endContent={<span data-testid="end">▲</span>}
      />,
    );
    expect(screen.getByTestId('start')).toBeInTheDocument();
    expect(screen.getByTestId('end')).toBeInTheDocument();
  });
});

describe('Slider — vertical orientation', () => {
  it('sets aria-orientation="vertical" on each thumb', () => {
    renderWithProviders(<Slider aria-label="x" defaultValue={50} orientation="vertical" />);
    expect(getThumb()).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('renders value above and label below in vertical layout', () => {
    const { container } = renderWithProviders(
      <Slider label="Volume" defaultValue={46} orientation="vertical" showValue />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.dataset.orientation).toBe('vertical');
    const text = wrapper.textContent ?? '';
    expect(text.indexOf('46')).toBeLessThan(text.indexOf('Volume'));
  });

  it('vertical pointer drag uses inverted Y coordinates', () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Slider aria-label="x" defaultValue={0} orientation="vertical" onChange={onChange} />,
    );
    const track = container.querySelector('[data-track]') as HTMLElement;
    stubTrackRect(track, 200);
    // bottom=200; clicking near top (clientY=0) → ratio=1 → max
    dispatchPointer(track, 'pointerdown', { clientX: 0, clientY: 0, button: 0 });
    expect(onChange).toHaveBeenLastCalledWith(100);
  });
});

describe('Slider — pointer drag', () => {
  let track: HTMLElement;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('clicking the track jumps the thumb to that position', () => {
    const onChange = vi.fn();
    const onChangeEnd = vi.fn();
    const { container } = renderWithProviders(
      <Slider aria-label="x" defaultValue={0} onChange={onChange} onChangeEnd={onChangeEnd} />,
    );
    track = container.querySelector('[data-track]') as HTMLElement;
    stubTrackRect(track, 200);
    dispatchPointer(track, 'pointerdown', { clientX: 100, clientY: 0, button: 0 });
    expect(onChange).toHaveBeenLastCalledWith(50);
    dispatchPointer(window, 'pointerup', { clientX: 100, clientY: 0 });
    expect(onChangeEnd).toHaveBeenLastCalledWith(50);
  });

  it('pointermove updates the value while dragging', () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Slider aria-label="x" defaultValue={0} onChange={onChange} />,
    );
    track = container.querySelector('[data-track]') as HTMLElement;
    stubTrackRect(track, 200);
    dispatchPointer(track, 'pointerdown', { clientX: 50, clientY: 0, button: 0 });
    dispatchPointer(window, 'pointermove', { clientX: 150, clientY: 0 });
    expect(onChange).toHaveBeenLastCalledWith(75);
  });

  it('pointercancel cleans up drag listeners', () => {
    const onChange = vi.fn();
    const onChangeEnd = vi.fn();
    const { container } = renderWithProviders(
      <Slider aria-label="x" defaultValue={0} onChange={onChange} onChangeEnd={onChangeEnd} />,
    );
    track = container.querySelector('[data-track]') as HTMLElement;
    stubTrackRect(track, 200);
    dispatchPointer(track, 'pointerdown', { clientX: 50, clientY: 0, button: 0 });
    dispatchPointer(window, 'pointercancel', { clientX: 50, clientY: 0 });
    onChange.mockClear();
    // No further updates after cancel.
    dispatchPointer(window, 'pointermove', { clientX: 180, clientY: 0 });
    expect(onChange).not.toHaveBeenCalled();
    expect(onChangeEnd).toHaveBeenCalledTimes(1);
  });

  it('ignores non-primary mouse buttons', () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Slider aria-label="x" defaultValue={0} onChange={onChange} />,
    );
    track = container.querySelector('[data-track]') as HTMLElement;
    stubTrackRect(track, 200);
    dispatchPointer(track, 'pointerdown', { clientX: 100, clientY: 0, button: 2 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('range mode: clicking near the high thumb drags only the high thumb', () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Slider aria-label="x" defaultValue={[10, 60]} onChange={onChange} />,
    );
    track = container.querySelector('[data-track]') as HTMLElement;
    stubTrackRect(track, 200);
    // clientX=180 → 90; closer to 60 than 10
    dispatchPointer(track, 'pointerdown', { clientX: 180, clientY: 0, button: 0 });
    expect(onChange).toHaveBeenLastCalledWith([10, 90]);
  });

  it('range mode: clicking near the low thumb drags only the low thumb', () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Slider aria-label="x" defaultValue={[10, 60]} onChange={onChange} />,
    );
    track = container.querySelector('[data-track]') as HTMLElement;
    stubTrackRect(track, 200);
    // clientX=20 → 10; closer to 10
    dispatchPointer(track, 'pointerdown', { clientX: 20, clientY: 0, button: 0 });
    expect(onChange).toHaveBeenLastCalledWith([10, 60]);
  });

  it('clamps drag position to track bounds', () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Slider aria-label="x" defaultValue={50} onChange={onChange} />,
    );
    track = container.querySelector('[data-track]') as HTMLElement;
    stubTrackRect(track, 200);
    dispatchPointer(track, 'pointerdown', { clientX: 9999, clientY: 0, button: 0 });
    expect(onChange).toHaveBeenLastCalledWith(100);
    dispatchPointer(window, 'pointerup');
    dispatchPointer(track, 'pointerdown', { clientX: -50, clientY: 0, button: 0 });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('returns min when track has zero size (defensive)', () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Slider aria-label="x" min={5} max={50} defaultValue={20} onChange={onChange} />,
    );
    track = container.querySelector('[data-track]') as HTMLElement;
    vi.spyOn(track as HTMLElement, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      toJSON: () => ({}),
    } as DOMRect);
    dispatchPointer(track, 'pointerdown', { clientX: 100, clientY: 0, button: 0 });
    expect(onChange).toHaveBeenLastCalledWith(5);
  });
});

describe('Slider — keyboard onChangeEnd', () => {
  it('fires onChangeEnd after arrow key release', async () => {
    const onChangeEnd = vi.fn();
    renderWithProviders(<Slider aria-label="x" defaultValue={20} onChangeEnd={onChangeEnd} />);
    const thumb = getThumb();
    thumb.focus();
    fireEvent.keyUp(thumb, { key: 'ArrowRight' });
    expect(onChangeEnd).toHaveBeenCalledTimes(1);
  });

  it('does not fire onChangeEnd for unrelated keys', () => {
    const onChangeEnd = vi.fn();
    renderWithProviders(<Slider aria-label="x" defaultValue={20} onChangeEnd={onChangeEnd} />);
    fireEvent.keyUp(getThumb(), { key: 'Tab' });
    expect(onChangeEnd).not.toHaveBeenCalled();
  });

  it.each(['ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'])(
    'fires onChangeEnd on key release: %s',
    async (key) => {
      const onChangeEnd = vi.fn();
      renderWithProviders(<Slider aria-label="x" defaultValue={20} onChangeEnd={onChangeEnd} />);
      fireEvent.keyUp(getThumb(), { key });
      expect(onChangeEnd).toHaveBeenCalledTimes(1);
    },
  );
});

describe('Slider — form submission', () => {
  it('submits a single value as `name`', () => {
    const { container } = renderWithProviders(
      <form>
        <Slider aria-label="x" name="volume" defaultValue={42} />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    const fd = new FormData(form);
    expect(fd.get('volume')).toBe('42');
  });

  it('submits range as minName + maxName', () => {
    const { container } = renderWithProviders(
      <form>
        <Slider aria-label="x" minName="low" maxName="high" defaultValue={[10, 90]} />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    const fd = new FormData(form);
    expect(fd.get('low')).toBe('10');
    expect(fd.get('high')).toBe('90');
  });
});

describe('Slider — refs and a11y', () => {
  it('forwards ref to the wrapper div', () => {
    let captured: HTMLDivElement | null = null;
    renderWithProviders(
      <Slider
        aria-label="x"
        defaultValue={20}
        ref={(node) => {
          captured = node;
        }}
      />,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
  });

  it('respects a custom id on the wrapper', () => {
    const { container } = renderWithProviders(
      <Slider id="my-slider" aria-label="x" defaultValue={20} />,
    );
    expect(container.querySelector('#my-slider')).not.toBeNull();
  });

  it('accepts aria-labelledby override', () => {
    renderWithProviders(
      <>
        <span id="ext-label">External label</span>
        <Slider aria-labelledby="ext-label" defaultValue={20} />
      </>,
    );
    const wrapper = screen.getByRole('group');
    expect(wrapper).toHaveAttribute('aria-labelledby', 'ext-label');
  });

  it('emits the prefers-reduced-motion override rule', () => {
    renderWithProviders(<Slider aria-label="x" defaultValue={30} />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});

describe('Slider — color and size variants', () => {
  it.each(['default', 'primary', 'secondary', 'success', 'warning', 'danger'] as const)(
    'renders color=%s without crashing',
    (color) => {
      renderWithProviders(<Slider aria-label="x" defaultValue={50} color={color} />);
      expect(getThumb()).toBeInTheDocument();
    },
  );

  it.each(['sm', 'md', 'lg'] as const)('renders size=%s without crashing', (size) => {
    renderWithProviders(<Slider aria-label="x" defaultValue={50} size={size} />);
    expect(getThumb()).toBeInTheDocument();
  });

  it('accepts numeric length and converts to px', () => {
    renderWithProviders(<Slider aria-label="x" defaultValue={50} length={320} />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/width:\s*320px/);
  });

  it('accepts string length verbatim', () => {
    renderWithProviders(<Slider aria-label="x" defaultValue={50} length="50%" />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/width:\s*50%/);
  });
});

describe('Slider — userEvent interactions', () => {
  it('keyboard focus reaches the thumb via Tab', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Slider aria-label="x" defaultValue={30} />);
    await user.tab();
    expect(getThumb()).toHaveFocus();
  });
});
