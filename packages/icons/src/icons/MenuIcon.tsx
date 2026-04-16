import { forwardRef } from 'react';
import type { SVGProps } from 'react';

export interface MenuIconProps extends Omit<SVGProps<SVGSVGElement>, 'color'> {
  size?: number | string;
  color?: string;
}

export const MenuIcon = forwardRef<SVGSVGElement, MenuIconProps>(function MenuIcon(
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
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
});

MenuIcon.displayName = 'MenuIcon';
