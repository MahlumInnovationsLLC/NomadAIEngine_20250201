import { HTMLAttributes } from 'react';
import { FontAwesomeIcon as FAIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition, IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faBrainCircuit,
  faGlobePointer,
  faPaperPlane,
  faBold,
  faItalic,
  faHeading,
  faListUl,
  faListOl,
  faEye,
  faEdit,
  faTrash,
  faTimes,
  faPlus,
  faLightbulb,
  faClock,
  faEnvelope,
  faMousePointer,
  faChartLine,
  faXmark,
  faChartBar,
  faChartPie,
  faGripVertical,
  faCloud,
  faShield,
  faCircleCheck,
  faGear,
  faTriangleCircleSquare,
  faHome,
  faServer,
  faIndustry,
  faBoxesStacked,
  faWrench,
  faTasks,
  faCalendar,
  faChevronDown,
  faCheck,
  faDashboard,
  faUsers,
  faBuilding,
  faMessage,
  faArrowRight,
  faFileLines,
  faBullhorn,
  faPlay,
  faSun,
  faMoon,
  faBars,
  faCog,
  faShare,
  faRightFromBracket,
  faLaptop,
  faCircleExclamation,
  faHandshake,
  faDollarSign,
  faBullseye,
  faUserTie,
  faPhone,
  faProjectDiagram,
  faFileContract,
  faRocket,
  faGears
} from '@fortawesome/pro-light-svg-icons';

// Add icons to library
library.add(
  faBold,
  faItalic,
  faHeading,
  faListUl,
  faListOl,
  faEye,
  faEdit,
  faTrash,
  faTimes,
  faPlus,
  faLightbulb,
  faClock,
  faEnvelope,
  faMousePointer,
  faChartLine,
  faXmark,
  faChartBar,
  faChartPie,
  faGripVertical,
  faCloud,
  faShield,
  faCircleCheck,
  faGear,
  faTriangleCircleSquare,
  faHome,
  faServer,
  faIndustry,
  faBoxesStacked,
  faWrench,
  faTasks,
  faCalendar,
  faChevronDown,
  faCheck,
  faDashboard,
  faUsers,
  faBuilding,
  faMessage,
  faArrowRight,
  faFileLines,
  faBullhorn,
  faPlay,
  faSun,
  faMoon,
  faBars,
  faCog,
  faShare,
  faRightFromBracket,
  faLaptop,
  faCircleExclamation,
  faHandshake,
  faDollarSign,
  faBullseye,
  faUserTie,
  faPhone,
  faProjectDiagram,
  faFileContract,
  faRocket,
  faGears
);

export interface FontAwesomeIconProps extends HTMLAttributes<SVGSVGElement> {
  icon: IconDefinition | [IconPrefix, IconName] | IconName;
  size?: 'xs' | 'sm' | 'lg' | '2x' | '3x' | '4x' | '5x';
}

const iconMap: Record<string, IconDefinition> = {
  'brain-circuit': faBrainCircuit,
  'globe-pointer': faGlobePointer,
  'paper-plane': faPaperPlane,
  'bold': faBold,
  'italic': faItalic,
  'heading': faHeading,
  'list-ul': faListUl,
  'list-ol': faListOl,
  'eye': faEye,
  'edit': faEdit,
  'trash': faTrash,
  'times': faTimes,
  'plus': faPlus,
  'lightbulb': faLightbulb,
  'clock': faClock,
  'envelope': faEnvelope,
  'mouse-pointer': faMousePointer,
  'chart-line': faChartLine,
  'xmark': faXmark,
  'chart-bar': faChartBar,
  'chart-pie': faChartPie,
  'grip-vertical': faGripVertical,
  'cloud': faCloud,
  'shield': faShield,
  'circle-check': faCircleCheck,
  'gear': faGear,
  'triangle-circle-square': faTriangleCircleSquare,
  'home': faHome,
  'server': faServer,
  'industry': faIndustry,
  'boxes-stacked': faBoxesStacked,
  'wrench': faWrench,
  'tasks': faTasks,
  'calendar': faCalendar,
  'chevron-down': faChevronDown,
  'check': faCheck,
  'dashboard': faDashboard,
  'users': faUsers,
  'building': faBuilding,
  'message': faMessage,
  'arrow-right': faArrowRight,
  'file-lines': faFileLines,
  'bullhorn': faBullhorn,
  'play': faPlay,
  'sun': faSun,
  'moon': faMoon,
  'bars': faBars,
  'cog': faCog,
  'share': faShare,
  'right-from-bracket': faRightFromBracket,
  'laptop': faLaptop,
  'circle-exclamation': faCircleExclamation,
  'handshake': faHandshake,
  'dollar-sign': faDollarSign,
  'bullseye': faBullseye,
  'user-tie': faUserTie,
  'phone': faPhone,
  'project-diagram': faProjectDiagram,
  'file-contract': faFileContract,
  'rocket': faRocket,
  'gears': faGears,
};

export function FontAwesomeIcon({
  icon,
  size,
  className,
  ...props
}: FontAwesomeIconProps) {
  // Handle IconDefinition objects directly
  if (typeof icon === 'object' && 'icon' in icon) {
    return (
      <FAIcon
        icon={icon}
        className={className}
        size={size}
        {...props}
      />
    );
  }

  // Handle array-based icon specifications
  if (Array.isArray(icon)) {
    return (
      <FAIcon
        icon={icon}
        className={className}
        size={size}
        {...props}
      />
    );
  }

  // Handle string-based icon names
  const iconName = typeof icon === 'string' ? icon : '';
  const faIcon = iconMap[iconName];
  if (!faIcon) {
    console.warn(`Icon "${iconName}" not found in icon map`);
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