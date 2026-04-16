import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    renderWithProviders(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('fires onClick', async () => {
    const fn = vi.fn();
    renderWithProviders(<Button onClick={fn}>Go</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('respects disabled', async () => {
    const fn = vi.fn();
    renderWithProviders(
      <Button disabled onClick={fn}>
        Nope
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    // HeroUI-style disabled buttons use `pointer-events: none`, so clicks
    // don't dispatch. Bypass the pointer-events guard just to assert handler
    // does not fire when disabled.
    await userEvent.click(btn, { pointerEventsCheck: 0 });
    expect(fn).not.toHaveBeenCalled();
  });

  it('shows loading state', () => {
    renderWithProviders(<Button loading>Load</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toBeDisabled();
  });

  it('renders polymorphic as anchor', () => {
    renderWithProviders(
      <Button as="a" href="#x">
        link
      </Button>,
    );
    expect(screen.getByRole('link', { name: /link/i })).toBeInTheDocument();
  });
});
