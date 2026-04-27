/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Steps 模块的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { Steps } from '../';
import type { StepItem, StepsSize, StepsVariant } from '../Steps.types';

const BASE_ITEMS: StepItem[] = [
  { itemKey: 'a', title: 'Login', description: 'Provide credentials' },
  { itemKey: 'b', title: 'Verify', description: 'Email verification' },
  { itemKey: 'c', title: 'Profile', description: 'Set up profile' },
  { itemKey: 'd', title: 'Done', description: 'All set' },
];

describe('Steps — basic rendering', () => {
  it('renders as an <ol role="list"> with the provided aria-label', () => {
    renderWithProviders(<Steps aria-label="Signup flow" items={BASE_ITEMS} activeIndex={1} />);
    const list = screen.getByRole('list', { name: 'Signup flow' });
    expect(list.tagName).toBe('OL');
  });

  it('renders one list item per step', () => {
    renderWithProviders(<Steps aria-label="x" items={BASE_ITEMS} activeIndex={0} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(BASE_ITEMS.length);
  });

  it('renders numeric indicators by default for wait / process steps', () => {
    renderWithProviders(<Steps aria-label="x" items={BASE_ITEMS} activeIndex={1} />);
    // process (index 1) shows "2", wait (index 2) shows "3", wait (index 3) shows "4".
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders titles and descriptions', () => {
    renderWithProviders(<Steps aria-label="x" items={BASE_ITEMS} activeIndex={0} />);
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Provide credentials')).toBeInTheDocument();
    expect(screen.getByText('Verify')).toBeInTheDocument();
  });

  it('skips description block when not provided', () => {
    const items: StepItem[] = [{ title: 'Only title' }, { title: 'Second' }];
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={items} activeIndex={0} />,
    );
    expect(container.querySelectorAll('[data-steps-description]')).toHaveLength(0);
  });

  it('supports items without an explicit key (falls back to index)', () => {
    const items: StepItem[] = [{ title: 'One' }, { title: 'Two' }];
    renderWithProviders(<Steps aria-label="x" items={items} activeIndex={0} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders an empty <ol> gracefully when items is empty', () => {
    const { container } = renderWithProviders(<Steps aria-label="empty" items={[]} />);
    expect(container.querySelector('ol')).not.toBeNull();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('treats a missing items prop as empty (defensive)', () => {
    const { container } = renderWithProviders(
      // @ts-expect-error — deliberately missing
      <Steps aria-label="no-items" />,
    );
    expect(container.querySelector('ol')).not.toBeNull();
  });

  it('renders startContent before the first step', () => {
    const { container } = renderWithProviders(
      <Steps
        aria-label="x"
        items={BASE_ITEMS}
        activeIndex={0}
        startContent={<span data-testid="start">Prefix</span>}
      />,
    );
    expect(screen.getByTestId('start')).toBeInTheDocument();
    const firstChild = container.querySelector('ol')?.firstElementChild as HTMLElement;
    expect(firstChild.getAttribute('data-steps-start-content')).toBe('');
  });

  it('forwards id, className, style to the root <ol>', () => {
    const { container } = renderWithProviders(
      <Steps
        aria-label="x"
        items={BASE_ITEMS}
        activeIndex={0}
        id="my-steps"
        className="extra"
        style={{ margin: '10px' }}
      />,
    );
    const ol = container.querySelector('#my-steps') as HTMLElement;
    expect(ol).not.toBeNull();
    expect(ol.classList.contains('extra')).toBe(true);
    expect(ol.style.margin).toBe('10px');
  });

  it('forwards ref to the <ol> element', () => {
    let captured: HTMLOListElement | null = null;
    renderWithProviders(
      <Steps
        aria-label="x"
        items={BASE_ITEMS}
        activeIndex={0}
        ref={(node: HTMLOListElement | null) => {
          captured = node;
        }}
      />,
    );
    expect(captured).toBeInstanceOf(HTMLOListElement);
  });
});

describe('Steps — status inference', () => {
  it('index < current → finish (connector fill + success color)', () => {
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={BASE_ITEMS} activeIndex={2} />,
    );
    const items = container.querySelectorAll('[data-steps-item]');
    expect(items[0]!.getAttribute('data-status')).toBe('finish');
    expect(items[1]!.getAttribute('data-status')).toBe('finish');
  });

  it('index === current → process by default', () => {
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={BASE_ITEMS} activeIndex={1} />,
    );
    const items = container.querySelectorAll('[data-steps-item]');
    expect(items[1]!.getAttribute('data-status')).toBe('process');
  });

  it('index > current → wait', () => {
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={BASE_ITEMS} activeIndex={1} />,
    );
    const items = container.querySelectorAll('[data-steps-item]');
    expect(items[2]!.getAttribute('data-status')).toBe('wait');
    expect(items[3]!.getAttribute('data-status')).toBe('wait');
  });

  it('overall status="error" applies to the current step', () => {
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={BASE_ITEMS} activeIndex={2} status="error" />,
    );
    const items = container.querySelectorAll('[data-steps-item]');
    expect(items[2]!.getAttribute('data-status')).toBe('error');
  });

  it('explicit item.status overrides inferred status', () => {
    const items: StepItem[] = [{ title: 'A' }, { title: 'B', status: 'error' }, { title: 'C' }];
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={items} activeIndex={0} />,
    );
    const listItems = container.querySelectorAll('[data-steps-item]');
    // current is 0 → B would normally be 'wait', but item.status='error' wins.
    expect(listItems[1]!.getAttribute('data-status')).toBe('error');
  });

  it('renders check icon for finished steps (no custom icon)', () => {
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={BASE_ITEMS} activeIndex={2} />,
    );
    // first two steps are finish → should render svg (no text number)
    const firstIndicator = container.querySelectorAll('[data-steps-indicator]')[0] as HTMLElement;
    expect(firstIndicator.querySelector('svg')).not.toBeNull();
  });

  it('renders close icon for error status (no custom icon)', () => {
    const items: StepItem[] = [{ title: 'A' }, { title: 'B', status: 'error' }, { title: 'C' }];
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={items} activeIndex={0} />,
    );
    const indicators = container.querySelectorAll('[data-steps-indicator]');
    expect((indicators[1] as HTMLElement).querySelector('svg')).not.toBeNull();
  });

  it('item.icon takes precedence over status-derived default icon', () => {
    const items: StepItem[] = [
      { title: 'A', icon: <span data-testid="custom-a">A</span> },
      { title: 'B' },
    ];
    renderWithProviders(<Steps aria-label="x" items={items} activeIndex={1} />);
    expect(screen.getByTestId('custom-a')).toBeInTheDocument();
  });
});

describe('Steps — controlled / uncontrolled', () => {
  it('uncontrolled: defaults to 0', () => {
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={BASE_ITEMS} variant="navigation" />,
    );
    const items = container.querySelectorAll('[data-steps-item]');
    expect(items[0]!.getAttribute('aria-current')).toBe('step');
  });

  it('uncontrolled: defaultCurrent sets the initial index', () => {
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={BASE_ITEMS} defaultActiveIndex={2} variant="navigation" />,
    );
    const items = container.querySelectorAll('[data-steps-item]');
    expect(items[2]!.getAttribute('aria-current')).toBe('step');
  });

  it('uncontrolled + navigation: clicking a step updates state and fires onChange', async () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Steps
        aria-label="x"
        items={BASE_ITEMS}
        variant="navigation"
        onActiveIndexChange={onChange}
      />,
    );
    const buttons = container.querySelectorAll('button[data-steps-button]');
    await userEvent.click(buttons[2] as HTMLElement);
    expect(onChange).toHaveBeenCalledWith(2);
    const items = container.querySelectorAll('[data-steps-item]');
    expect(items[2]!.getAttribute('aria-current')).toBe('step');
  });

  it('controlled: onChange fires but state is driven by props', async () => {
    const onChange = vi.fn();
    const { rerender, container } = renderWithProviders(
      <Steps
        aria-label="x"
        items={BASE_ITEMS}
        activeIndex={0}
        variant="navigation"
        onActiveIndexChange={onChange}
      />,
    );
    const buttons = container.querySelectorAll('button[data-steps-button]');
    await userEvent.click(buttons[2] as HTMLElement);
    expect(onChange).toHaveBeenCalledWith(2);
    // still shows 0 as current (controlled)
    let items = container.querySelectorAll('[data-steps-item]');
    expect(items[0]!.getAttribute('aria-current')).toBe('step');

    rerender(
      <Steps
        aria-label="x"
        items={BASE_ITEMS}
        activeIndex={2}
        variant="navigation"
        onActiveIndexChange={onChange}
      />,
    );
    items = container.querySelectorAll('[data-steps-item]');
    expect(items[2]!.getAttribute('aria-current')).toBe('step');
  });

  it('clicking the already-current step is a no-op (no onChange)', async () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Steps
        aria-label="x"
        items={BASE_ITEMS}
        defaultActiveIndex={1}
        variant="navigation"
        onActiveIndexChange={onChange}
      />,
    );
    const buttons = container.querySelectorAll('button[data-steps-button]');
    await userEvent.click(buttons[1] as HTMLElement);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Steps — clickable / navigation interaction', () => {
  it('isClickable=false + default variant: steps render as <div>, no onChange on click', async () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={BASE_ITEMS} activeIndex={0} onActiveIndexChange={onChange} />,
    );
    expect(container.querySelectorAll('button[data-steps-button]')).toHaveLength(0);
    // clicking the title region should not trigger onChange since no button wrapper.
    await userEvent.click(screen.getByText('Verify'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('isClickable=true + default variant: steps become buttons, click fires onChange', async () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Steps
        aria-label="x"
        items={BASE_ITEMS}
        defaultActiveIndex={0}
        isClickable
        onActiveIndexChange={onChange}
      />,
    );
    const buttons = container.querySelectorAll('button[data-steps-button]');
    expect(buttons).toHaveLength(BASE_ITEMS.length);
    await userEvent.click(buttons[3] as HTMLElement);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('navigation variant auto-enables clickability (no isClickable prop needed)', async () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Steps
        aria-label="x"
        items={BASE_ITEMS}
        variant="navigation"
        onActiveIndexChange={onChange}
      />,
    );
    const buttons = container.querySelectorAll('button[data-steps-button]');
    await userEvent.click(buttons[1] as HTMLElement);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('disabled item skips click / onChange', async () => {
    const items: StepItem[] = [{ title: 'A' }, { title: 'B', isDisabled: true }, { title: 'C' }];
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={items} variant="navigation" onActiveIndexChange={onChange} />,
    );
    const buttons = container.querySelectorAll('button[data-steps-button]');
    // The browser prevents clicks on disabled buttons, but fire directly to verify.
    fireEvent.click(buttons[1] as HTMLElement);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('isClickable=false + non-navigation ignores select() calls even when button exists (sanity)', async () => {
    // Defensive: reading behavior — isClickable is false AND variant !== navigation → no button rendered at all.
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Steps
        aria-label="x"
        items={BASE_ITEMS}
        activeIndex={0}
        isClickable={false}
        onActiveIndexChange={onChange}
      />,
    );
    expect(container.querySelectorAll('button[data-steps-button]')).toHaveLength(0);
  });

  it('keyboard: Enter / Space on a nav step triggers onChange', async () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Steps
        aria-label="x"
        items={BASE_ITEMS}
        defaultActiveIndex={0}
        variant="navigation"
        onActiveIndexChange={onChange}
      />,
    );
    const buttons = container.querySelectorAll(
      'button[data-steps-button]',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[2]!.focus();
    fireEvent.keyDown(buttons[2]!, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(2);

    onChange.mockClear();
    // After first call onChange keeps internal state; simulate again on another step.
    buttons[3]!.focus();
    fireEvent.keyDown(buttons[3]!, { key: ' ' });
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('keyboard: irrelevant keys on nav step do nothing', () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Steps
        aria-label="x"
        items={BASE_ITEMS}
        variant="navigation"
        onActiveIndexChange={onChange}
      />,
    );
    const buttons = container.querySelectorAll(
      'button[data-steps-button]',
    ) as NodeListOf<HTMLButtonElement>;
    fireEvent.keyDown(buttons[2]!, { key: 'ArrowDown' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clicking beyond the array (via keyboard on out-of-range) is a no-op', () => {
    // Simulate a direct call path: clicking on a disabled step's button even though it would be
    // ignored by the browser. This ensures the guard in `select` stands up.
    const items: StepItem[] = [{ title: 'A' }, { title: 'B', isDisabled: true }, { title: 'C' }];
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={items} variant="navigation" onActiveIndexChange={onChange} />,
    );
    const buttons = container.querySelectorAll(
      'button[data-steps-button]',
    ) as NodeListOf<HTMLButtonElement>;
    // disabled button: fire direct keyDown on it — should not trigger.
    fireEvent.keyDown(buttons[1]!, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Steps — direction (horizontal / vertical)', () => {
  it('horizontal (default) sets data-orientation="horizontal"', () => {
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={BASE_ITEMS} activeIndex={0} />,
    );
    const ol = container.querySelector('ol') as HTMLElement;
    expect(ol.dataset.orientation).toBe('horizontal');
  });

  it('vertical renders data-orientation="vertical" and connectors', () => {
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={BASE_ITEMS} activeIndex={1} direction="vertical" />,
    );
    const ol = container.querySelector('ol') as HTMLElement;
    expect(ol.dataset.orientation).toBe('vertical');
    // Connectors are present between items (N-1 of them).
    const connectors = container.querySelectorAll('[data-steps-connector]');
    expect(connectors.length).toBe(BASE_ITEMS.length - 1);
  });

  it('horizontal: N-1 connectors rendered between steps', () => {
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={BASE_ITEMS} activeIndex={0} />,
    );
    const connectors = container.querySelectorAll('[data-steps-connector]');
    expect(connectors.length).toBe(BASE_ITEMS.length - 1);
  });

  it('vertical + empty does not emit connectors', () => {
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={[]} direction="vertical" />,
    );
    expect(container.querySelectorAll('[data-steps-connector]')).toHaveLength(0);
  });
});

describe('Steps — variants', () => {
  it.each(['default', 'dot', 'navigation'] as const)(
    'renders variant=%s without crashing',
    (variant: StepsVariant) => {
      const { container } = renderWithProviders(
        <Steps aria-label="x" items={BASE_ITEMS} activeIndex={1} variant={variant} />,
      );
      const ol = container.querySelector('ol') as HTMLElement;
      expect(ol.dataset.variant).toBe(variant);
    },
  );

  it('dot variant: indicators do not contain text numbers', () => {
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={BASE_ITEMS} activeIndex={1} variant="dot" />,
    );
    // In dot mode, default icon is null; the `::before` pseudo provides the visual dot.
    const indicators = container.querySelectorAll('[data-steps-indicator]');
    indicators.forEach((ind) => {
      expect(ind.textContent).toBe('');
    });
  });

  it('dot variant: current step indicator has data-status="process"', () => {
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={BASE_ITEMS} activeIndex={2} variant="dot" />,
    );
    const indicators = container.querySelectorAll('[data-steps-indicator]');
    expect(indicators[2]!.getAttribute('data-status')).toBe('process');
  });

  it('navigation variant renders buttons with aria-current on the current step', () => {
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={BASE_ITEMS} defaultActiveIndex={1} variant="navigation" />,
    );
    const buttons = container.querySelectorAll('button[data-steps-button]');
    expect(buttons).toHaveLength(BASE_ITEMS.length);
    expect(buttons[1]!.getAttribute('aria-current')).toBe('step');
    expect(buttons[0]!.getAttribute('aria-current')).toBeNull();
  });
});

describe('Steps — disabled visuals across variants', () => {
  it('dot variant: disabled item still renders + applies opacity', () => {
    const items: StepItem[] = [
      { title: 'A' },
      { title: 'B', isDisabled: true, description: 'cannot click' },
    ];
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={items} variant="dot" activeIndex={0} />,
    );
    const listItems = container.querySelectorAll('[data-steps-item]');
    expect(listItems[1]!.getAttribute('data-disabled')).toBe('true');
    // description with disabled visual still rendered.
    expect(container.querySelectorAll('[data-steps-description]').length).toBe(1);
  });

  it('isClickable + vertical + disabled: button rendered with disabled attribute', () => {
    const items: StepItem[] = [
      { title: 'A' },
      { title: 'B', isDisabled: true, description: 'd' },
      { title: 'C' },
    ];
    const { container } = renderWithProviders(
      <Steps
        aria-label="x"
        items={items}
        direction="vertical"
        isClickable
        defaultActiveIndex={0}
      />,
    );
    const buttons = container.querySelectorAll(
      'button[data-steps-button]',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).toBe(3);
    expect(buttons[1]!.disabled).toBe(true);
  });
});

describe('Steps — sizes', () => {
  it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)('renders size=%s', (size: StepsSize) => {
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={BASE_ITEMS} activeIndex={0} size={size} />,
    );
    const ol = container.querySelector('ol') as HTMLElement;
    expect(ol.dataset.size).toBe(size);
  });
});

describe('Steps — accessibility', () => {
  it('each list item carries aria-current="step" on the current step', () => {
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={BASE_ITEMS} activeIndex={2} />,
    );
    const items = container.querySelectorAll('[role="listitem"]');
    expect(items[2]!.getAttribute('aria-current')).toBe('step');
    expect(items[0]!.getAttribute('aria-current')).toBeNull();
  });

  it('each step has an aria-label with textual status', () => {
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={BASE_ITEMS} activeIndex={1} />,
    );
    // inner step containers (div or button) get aria-label with status text.
    const stepHosts = container.querySelectorAll('[data-steps-item] > *[aria-label]');
    const labels = Array.from(stepHosts).map((n) => n.getAttribute('aria-label') ?? '');
    expect(labels.some((l) => l.includes('step 1 of 4'))).toBe(true);
    expect(labels.some((l) => l.includes('in progress'))).toBe(true);
    expect(labels.some((l) => l.includes('completed'))).toBe(true);
    expect(labels.some((l) => l.includes('pending'))).toBe(true);
  });

  it('status="error" surfaces "error" in the aria-label', () => {
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={BASE_ITEMS} activeIndex={1} status="error" />,
    );
    const stepHosts = container.querySelectorAll('[data-steps-item] > *[aria-label]');
    const labels = Array.from(stepHosts).map((n) => n.getAttribute('aria-label') ?? '');
    expect(labels.some((l) => l.includes('error'))).toBe(true);
  });

  it('non-string titles fall back to "Step N" for aria-label', () => {
    const items: StepItem[] = [{ title: <span>Login</span> }, { title: <span>Verify</span> }];
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={items} activeIndex={0} />,
    );
    const stepHosts = container.querySelectorAll('[data-steps-item] > *[aria-label]');
    const labels = Array.from(stepHosts).map((n) => n.getAttribute('aria-label') ?? '');
    expect(labels.some((l) => l.startsWith('Step 1'))).toBe(true);
  });

  it('numeric titles are coerced to strings in aria-label', () => {
    const items: StepItem[] = [
      { title: 1 as unknown as string },
      { title: 2 as unknown as string },
    ];
    const { container } = renderWithProviders(
      <Steps aria-label="x" items={items} activeIndex={0} />,
    );
    const stepHosts = container.querySelectorAll('[data-steps-item] > *[aria-label]');
    const labels = Array.from(stepHosts).map((n) => n.getAttribute('aria-label') ?? '');
    expect(labels.some((l) => l.startsWith('1,'))).toBe(true);
  });

  it('emits a prefers-reduced-motion override rule', () => {
    renderWithProviders(<Steps aria-label="x" items={BASE_ITEMS} activeIndex={1} />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});
