/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 ChatVoiceWave 组件的行为与回归。
 */

import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../test-utils';
import { ChatVoiceWave } from '../ChatVoiceWave';

describe('ChatVoiceWave — basic rendering', () => {
  it('renders 4 bars by default', () => {
    const { container } = renderWithProviders(<ChatVoiceWave aria-label="Recording" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.children).toHaveLength(4);
  });

  it('respects custom bar count', () => {
    const { container } = renderWithProviders(<ChatVoiceWave aria-label="Recording" bars={6} />);
    expect(container.firstElementChild!.children).toHaveLength(6);
  });

  it('exposes role="status" + aria-live="polite" + aria-label', () => {
    const { container } = renderWithProviders(<ChatVoiceWave aria-label="Listening" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('role', 'status');
    expect(root).toHaveAttribute('aria-live', 'polite');
    expect(root).toHaveAttribute('aria-label', 'Listening');
  });

  it('default aria-label is "Recording"', () => {
    const { container } = renderWithProviders(<ChatVoiceWave />);
    expect(container.firstElementChild).toHaveAttribute('aria-label', 'Recording');
  });

  it('sets data-active="true" when active', () => {
    const { container } = renderWithProviders(<ChatVoiceWave aria-label="x" isActive />);
    expect(container.firstElementChild).toHaveAttribute('data-active', 'true');
  });

  it('omits data-active when inactive', () => {
    const { container } = renderWithProviders(<ChatVoiceWave aria-label="x" isActive={false} />);
    expect(container.firstElementChild).not.toHaveAttribute('data-active');
  });
});

describe('ChatVoiceWave — variants', () => {
  it.each(['default', 'primary', 'secondary', 'success', 'warning', 'danger'] as const)(
    'renders color=%s without crashing',
    (color) => {
      const { container } = renderWithProviders(<ChatVoiceWave aria-label="x" color={color} />);
      expect(container.firstElementChild!.children).toHaveLength(4);
    },
  );

  it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)('renders size=%s without crashing', (size) => {
    const { container } = renderWithProviders(<ChatVoiceWave aria-label="x" size={size} />);
    expect(container.firstElementChild!.children).toHaveLength(4);
  });
});

describe('ChatVoiceWave — animation', () => {
  it('emits keyframe animation rule when isActive', () => {
    renderWithProviders(<ChatVoiceWave aria-label="x" isActive />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/@keyframes\s+timeui-chat-wave-/);
    expect(styles).toMatch(/animation:\s*timeui-chat-wave-/);
  });

  it('omits the animation rule on bars when inactive (bars frozen at min scale)', () => {
    // Read each bar's actual emotion-generated CSS rule body (avoids polluting cross-test
    // stylesheet snapshots since multiple it() blocks share the same document).
    const { container } = renderWithProviders(<ChatVoiceWave aria-label="x" isActive={false} />);
    const bars = Array.from(container.firstElementChild!.querySelectorAll('span'));
    const allStyles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    bars.forEach((bar) => {
      const className = (bar.getAttribute('class') ?? '')
        .split(/\s+/)
        .find((c) => c.startsWith('css-'));
      expect(className).toBeTruthy();
      // Pull just this bar's rule body from the emitted CSS.
      const re = new RegExp(`\\.${className}\\s*\\{[^}]*\\}`);
      const match = allStyles.match(re);
      expect(match).not.toBeNull();
      expect(match![0]).not.toMatch(/animation:\s*timeui-chat-wave-/);
    });
  });

  it('emits the prefers-reduced-motion override rule', () => {
    renderWithProviders(<ChatVoiceWave aria-label="x" />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});

describe('ChatVoiceWave — refs and pass-through', () => {
  it('forwards ref to the wrapper div', () => {
    let captured: HTMLDivElement | null = null;
    renderWithProviders(
      <ChatVoiceWave
        aria-label="x"
        ref={(node) => {
          captured = node;
        }}
      />,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
  });

  it('respects a custom id on the wrapper', () => {
    const { container } = renderWithProviders(<ChatVoiceWave id="my-wave" aria-label="x" />);
    expect(container.querySelector('#my-wave')).not.toBeNull();
  });
});
