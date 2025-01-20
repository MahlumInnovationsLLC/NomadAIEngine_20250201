import { HTMLAttributes } from 'react';
import { FontAwesomeIcon as FAIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { library } from '@fortawesome/fontawesome-svg-core';
import { 
  faCheck, 
  faChevronRight, 
  faCircle, 
  faCircleCheck, 
  faCalendar, 
  faTriangleExclamation,
  faUsers,
  faXmark,
  faFileLines,
  faHardDrive,
  faMessage,
  faChartMixed,
  faGraduationCap,
  faClipboardList,
  faWindow // Using window icon instead of microsoft
} from '@fortawesome/pro-light-svg-icons';

// Add icons to library
library.add(
  faCheck,
  faChevronRight,
  faCircle,
  faCircleCheck,
  faCalendar,
  faTriangleExclamation,
  faUsers,
  faXmark,
  faFileLines,
  faHardDrive,
  faMessage,
  faChartMixed,
  faGraduationCap,
  faClipboardList,
  faWindow
);

interface FontAwesomeIconProps extends HTMLAttributes<HTMLElement> {
  icon: string;
  size?: 'xs' | 'sm' | 'lg' | '2x' | '3x' | '4x' | '5x';
}

const iconMap: Record<string, IconDefinition> = {
  'check': faCheck,
  'chevron-right': faChevronRight,
  'circle': faCircle,
  'circle-check': faCircleCheck,
  'calendar': faCalendar,
  'triangle-exclamation': faTriangleExclamation,
  'users': faUsers,
  'xmark': faXmark,
  'file-lines': faFileLines,
  'hard-drive': faHardDrive,
  'message': faMessage,
  'chart-mixed': faChartMixed,
  'graduation-cap': faGraduationCap,
  'clipboard-list': faClipboardList,
  'microsoft': faWindow, // Map microsoft to window icon
};

export function FontAwesomeIcon({ 
  icon, 
  size,
  className,
  ...props 
}: FontAwesomeIconProps) {
  const faIcon = iconMap[icon];

  if (!faIcon) {
    console.warn(`Icon "${icon}" not found in icon map`);
    return null;
  }

  return (
    <FAIcon 
      icon={faIcon}
      className={className}
      size={size}
      {...props}
    />
  );
}