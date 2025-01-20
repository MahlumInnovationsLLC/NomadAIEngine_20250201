import { HTMLAttributes } from 'react';
import { FontAwesomeIcon as FAIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import * as lightIcons from '@fortawesome/pro-light-svg-icons';

interface FontAwesomeIconProps extends HTMLAttributes<HTMLElement> {
  icon: string;
  size?: 'xs' | 'sm' | 'lg' | '2x' | '3x' | '4x' | '5x';
}

export function FontAwesomeIcon({ 
  icon, 
  size,
  className,
  ...props 
}: FontAwesomeIconProps) {
  // Convert icon name to light icon key
  const iconKey = `fal${icon.charAt(0).toUpperCase() + icon.slice(1)}` as keyof typeof lightIcons;
  const faIcon = lightIcons[iconKey] as IconDefinition;

  if (!faIcon) {
    console.warn(`Icon ${icon} not found in Font Awesome light icons`);
    return null;
  }

  return (
    <FAIcon 
      icon={faIcon}
      size={size}
      className={className}
      {...props}
    />
  );
}