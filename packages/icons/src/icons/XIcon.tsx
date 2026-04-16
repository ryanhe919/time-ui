import { forwardRef } from 'react';
import type { SVGProps } from 'react';

export interface XIconProps extends Omit<SVGProps<SVGSVGElement>, 'color'> {
  size?: number | string;
  color?: string;
}

export const XIcon = forwardRef<SVGSVGElement, XIconProps>(function XIcon(
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
});

XIcon.displayName = 'XIcon';
