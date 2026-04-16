import { forwardRef } from 'react';
import type { SVGProps } from 'react';

export interface UserIconProps extends Omit<SVGProps<SVGSVGElement>, 'color'> {
  /** Square icon dimension in pixels (or any CSS length). Defaults to 24. */
  size?: number | string;
  /** Stroke/fill color. Applied via currentColor. Defaults to `currentColor`. */
  color?: string;
}

export const UserIcon = forwardRef<SVGSVGElement, UserIconProps>(function UserIcon(
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
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
});

UserIcon.displayName = 'UserIcon';
