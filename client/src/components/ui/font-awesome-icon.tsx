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
  faChartPie,
  faGraduationCap,
  faClipboardList,
  faWindowMaximize,
  faUpload,
  faGripVertical,
  faBrain,
  faMicroscope,
  faCirclePlus,
  faGrid,
  faBars,
  faCog,
  faShare,
  faRightFromBracket,
  faSun,
  faMoon,
  faCloud,
  faChevronDown,
  faChevronUp,
  faShield,
  faChevronLeft,
  faClock,
  faCalendarDays,
  faCircleExclamation,
  faQuestionCircle,
  faCircleCheck as faCircleCheck2,
  faGear,
  faRotate,
  faTriangleCircleSquare,
  faChartColumn,
  faArrowTrendUp,
  faList
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
  faChartPie,
  faGraduationCap,
  faClipboardList,
  faWindowMaximize,
  faUpload,
  faGripVertical,
  faBrain,
  faMicroscope,
  faCirclePlus,
  faGrid,
  faBars,
  faCog,
  faShare,
  faRightFromBracket,
  faSun,
  faMoon,
  faCloud,
  faChevronDown,
  faChevronUp,
  faShield,
  faChevronLeft,
  faClock,
  faCalendarDays,
  faCircleExclamation,
  faQuestionCircle,
  faCircleCheck2,
  faGear,
  faRotate,
  faTriangleCircleSquare,
  faChartColumn,
  faArrowTrendUp,
  faList
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
  'chart-mixed': faChartPie,
  'graduation-cap': faGraduationCap,
  'clipboard-list': faClipboardList,
  'microsoft': faWindowMaximize,
  'upload': faUpload,
  'grip-vertical': faGripVertical,
  'brain': faBrain,
  'microscope': faMicroscope,
  'circle-plus': faCirclePlus,
  'grid': faGrid,
  'bars': faBars,
  'cog': faCog,
  'share': faShare,
  'right-from-bracket': faRightFromBracket,
  'sun': faSun,
  'moon': faMoon,
  'cloud': faCloud,
  'chevron-down': faChevronDown,
  'chevron-up': faChevronUp,
  'shield': faShield,
  'chevron-left': faChevronLeft,
  'calendar-days': faCalendarDays,
  'clock': faClock,
  'circle-exclamation': faCircleExclamation,
  'question-circle': faQuestionCircle,
  'circle-check-2': faCircleCheck2,
  'gear': faGear,
  'rotate': faRotate,
  'triangle-circle-square': faTriangleCircleSquare,
  'chart-column': faChartColumn,
  'arrow-trend-up': faArrowTrendUp,
  'list': faList
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