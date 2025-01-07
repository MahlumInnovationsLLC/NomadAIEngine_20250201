import { HTMLAttributes } from 'react';
import { cn } from "@/lib/utils";

interface FontAwesomeIconProps extends HTMLAttributes<HTMLElement> {
  iconName: string;
  type?: 'kit' | 'solid' | 'regular' | 'light' | 'thin' | 'duotone' | 'brands';
  size?: 'xs' | 'sm' | 'lg' | '2x' | '3x' | '4x' | '5x';
}

export function FontAwesomeIcon({ 
  iconName, 
  type = 'kit', 
  size,
  className,
  ...props 
}: FontAwesomeIconProps) {
  const prefix = type === 'kit' ? 'fa-kit' : `fa-${type}`;

  return (
    <i 
      className={cn(
        prefix,
        `fa-${iconName}`,
        size && `fa-${size}`,
        className
      )} 
      {...props}
    />
  );
}