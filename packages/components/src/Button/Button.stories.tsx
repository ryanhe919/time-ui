import type { Meta, StoryObj } from '@storybook/react';
import type { CSSProperties } from 'react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
    disabled: false,
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'ghost'],
      description: 'Visual emphasis of the button.',
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: 'Vertical sizing preset.',
    },
    disabled: { control: 'boolean' },
    onClick: { action: 'clicked' },
    children: { control: 'text' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The **Button** is the primary call-to-action primitive in TimeUI. ' +
          'It supports three visual variants, three sizes, and the full set ' +
          'of native `<button>` attributes.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

const row: CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap',
};

const stack: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  alignItems: 'flex-start',
};

/** The default, minimal usage. */
export const Default: Story = {};

/** All visual variants side by side. */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={row}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};

/** All size presets, one per variant for quick comparison. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={stack}>
      <div style={row}>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
      <div style={row}>
        <Button variant="secondary" size="sm">
          Small
        </Button>
        <Button variant="secondary" size="md">
          Medium
        </Button>
        <Button variant="secondary" size="lg">
          Large
        </Button>
      </div>
      <div style={row}>
        <Button variant="ghost" size="sm">
          Small
        </Button>
        <Button variant="ghost" size="md">
          Medium
        </Button>
        <Button variant="ghost" size="lg">
          Large
        </Button>
      </div>
    </div>
  ),
};

/** Interactive states: default, focus-visible, disabled. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={stack}>
      <div style={row}>
        <Button>Default</Button>
        <Button autoFocus>Focused (autoFocus)</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div style={row}>
        <Button variant="secondary">Default</Button>
        <Button variant="secondary" disabled>
          Disabled
        </Button>
      </div>
      <div style={row}>
        <Button variant="ghost">Default</Button>
        <Button variant="ghost" disabled>
          Disabled
        </Button>
      </div>
    </div>
  ),
};

/** Fully controlled playground — tweak via the Controls panel. */
export const Playground: Story = {
  args: { children: 'Click me' },
};

/**
 * Accessibility reference. Run the **A11y** tab to verify axe rules on each
 * variant. All variants must pass color-contrast on both light and dark
 * themes.
 */
export const Accessibility: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Use `Tab` to move focus, `Space` or `Enter` to activate. ' +
          'Disabled buttons are removed from the tab order and announced as ' +
          'disabled by assistive technology.',
      },
    },
  },
  render: () => (
    <div style={row}>
      <Button aria-label="Save document" variant="primary">
        Save
      </Button>
      <Button aria-describedby="hint" variant="secondary">
        More info
      </Button>
      <span id="hint" style={{ fontSize: 12, opacity: 0.7 }}>
        Opens a dialog.
      </span>
    </div>
  ),
};
