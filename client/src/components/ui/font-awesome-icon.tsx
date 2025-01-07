import { HTMLAttributes } from 'react';
import { cn } from "@/lib/utils";

interface FontAwesomeIconProps extends HTMLAttributes<HTMLElement> {
  icon: string;
  type?: 'solid' | 'regular' | 'light' | 'thin' | 'duotone' | 'brands';
  size?: 'xs' | 'sm' | 'lg' | '2x' | '3x' | '4x' | '5x';
}

export function FontAwesomeIcon({ 
  icon, 
  type = 'solid', 
  size,
  className,
  ...props 
}: FontAwesomeIconProps) {
  const prefix = type === 'brands' ? 'fab' : `fa${type.charAt(0)}`;
  
  return (
    <i 
      className={cn(
        prefix,
        `fa-${icon}`,
        size && `fa-${size}`,
        className
      )} 
      {...props}
    />
  );
}
