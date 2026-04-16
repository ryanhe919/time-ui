import { forwardRef } from 'react';
import type { SVGProps } from 'react';

export interface PlusIconProps extends Omit<SVGProps<SVGSVGElement>, 'color'> {
  /** Square icon dimension in pixels (or any CSS length). Defaults to 24. */
  size?: number | string;
  /** Stroke/fill color. Applied via currentColor. Defaults to `currentColor`. */
  color?: string;
}

export const PlusIcon = forwardRef<SVGSVGElement, PlusIconProps>(function PlusIcon(
  { size = 24, color = 'currentColor', ...rest },
  ref,
) {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={rest['aria-label'] ? undefined : true}
      focusable={false}
      {...rest}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
});

PlusIcon.displayName = 'PlusIcon';
