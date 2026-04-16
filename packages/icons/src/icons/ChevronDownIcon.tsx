import { forwardRef } from 'react';
import type { SVGProps } from 'react';

export interface ChevronDownIconProps extends Omit<SVGProps<SVGSVGElement>, 'color'> {
  /** Square icon dimension in pixels (or any CSS length). Defaults to 24. */
  size?: number | string;
  /** Stroke/fill color. Applied via currentColor. Defaults to `currentColor`. */
  color?: string;
}

export const ChevronDownIcon = forwardRef<SVGSVGElement, ChevronDownIconProps>(
  function ChevronDownIcon({ size = 24, color = 'currentColor', ...rest }, ref) {
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
        <polyline points="6 9 12 15 18 9" />
      </svg>
    );
  },
);

ChevronDownIcon.displayName = 'ChevronDownIcon';
