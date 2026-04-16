import { forwardRef } from 'react';
import type { SVGProps } from 'react';

export interface SearchIconProps extends Omit<SVGProps<SVGSVGElement>, 'color'> {
  size?: number | string;
  color?: string;
}

export const SearchIcon = forwardRef<SVGSVGElement, SearchIconProps>(function SearchIcon(
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
});

SearchIcon.displayName = 'SearchIcon';
