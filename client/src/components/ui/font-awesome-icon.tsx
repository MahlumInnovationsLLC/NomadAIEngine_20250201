import { HTMLAttributes } from 'react';
import { FontAwesomeIcon as FAIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition, IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faGithub,
  faTwitter,
  faLinkedin,
  faDiscord,
  faSlack,
  faWindows,
  faFacebook,
  faInstagram
} from '@fortawesome/free-brands-svg-icons';
import {
  faCheck,
  faChevronRight,
  faCircle,
  faAward,
  faTrophyStar,
  faPersonChalkboard,
  faPlus,
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
  faCircleCheck,
  faGear,
  faRotate,
  faTriangleCircleSquare,
  faChartColumn,
  faArrowTrendUp,
  faList,
  faDumbbell,
  faPlay,
  faMessagePlus,
  faSquare,
  faPaperPlane,
  faChartLine,
  faMapPin,
  faGlobePointer,
  faBrainCircuit,
  faMagnifyingGlass,
  faBoxArchive,
  faEllipsisH,
  faSpinner,
  faWandMagic,
  faSignalSlash,
  faBluetooth,
  faWifi,
  faCircleNotch,
  faDownload,
  faLayerGroup,
  faShareNodes,
  faEnvelope,
  faEnvelopeOpen,
  faEnvelopeCircleCheck,
  faBullhorn,
  faDollarSign,
  faCoins,
  faBullseye
} from '@fortawesome/pro-light-svg-icons';

// Add icons to library
library.add(
  // Brand icons
  faGithub,
  faTwitter,
  faLinkedin,
  faDiscord,
  faSlack,
  faWindows,
  faFacebook,
  faInstagram,

  // Pro Light icons
  faCheck,
  faChevronRight,
  faCircle,
  faAward,
  faTrophyStar,
  faPersonChalkboard,
  faPlus,
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
  faCircleCheck,
  faGear,
  faRotate,
  faTriangleCircleSquare,
  faChartColumn,
  faArrowTrendUp,
  faList,
  faDumbbell,
  faPlay,
  faMessagePlus,
  faSquare,
  faPaperPlane,
  faChartLine,
  faMapPin,
  faGlobePointer,
  faBrainCircuit,
  faMagnifyingGlass,
  faBoxArchive,
  faEllipsisH,
  faSpinner,
  faWandMagic,
  faSignalSlash,
  faBluetooth,
  faWifi,
  faCircleNotch,
  faDownload,
  faLayerGroup,
  faShareNodes,
  faEnvelope,
  faEnvelopeOpen,
  faEnvelopeCircleCheck,
  faBullhorn,
  faDollarSign,
  faCoins,
  faBullseye
);

export interface FontAwesomeIconProps extends HTMLAttributes<SVGSVGElement> {
  icon: [IconPrefix, IconName] | string;
  size?: 'xs' | 'sm' | 'lg' | '2x' | '3x' | '4x' | '5x';
}

const iconMap: Record<string, IconDefinition> = {
  // Brand icons
  'github': faGithub,
  'twitter': faTwitter,
  'linkedin': faLinkedin,
  'discord': faDiscord,
  'slack': faSlack,
  'windows': faWindows,
  'facebook': faFacebook,
  'instagram': faInstagram,

  // Pro Light icons
  'check': faCheck,
  'chevron-right': faChevronRight,
  'circle': faCircle,
  'award': faAward,
  'trophy-star': faTrophyStar,
  'person-chalkboard': faPersonChalkboard,
  'plus': faPlus,
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
  'window-maximize': faWindowMaximize,
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
  'clock': faClock,
  'calendar-days': faCalendarDays,
  'circle-exclamation': faCircleExclamation,
  'question-circle': faQuestionCircle,
  'circle-check': faCircleCheck,
  'gear': faGear,
  'rotate': faRotate,
  'triangle-circle-square': faTriangleCircleSquare,
  'chart-column': faChartColumn,
  'arrow-trend-up': faArrowTrendUp,
  'list': faList,
  'dumbbell': faDumbbell,
  'play': faPlay,
  'message-plus': faMessagePlus,
  'square': faSquare,
  'paper-plane': faPaperPlane,
  'chart-line': faChartLine,
  'map-pin': faMapPin,
  'globe-pointer': faGlobePointer,
  'brain-circuit': faBrainCircuit,
  'magnifying-glass': faMagnifyingGlass,
  'box-archive': faBoxArchive,
  'ellipsis-h': faEllipsisH,
  'spinner': faSpinner,
  'wand-magic': faWandMagic,
  'signal-slash': faSignalSlash,
  'bluetooth': faBluetooth,
  'wifi': faWifi,
  'circle-notch': faCircleNotch,
  'download': faDownload,
  'layer-group': faLayerGroup,
  'share-nodes': faShareNodes,
  'envelope': faEnvelope,
  'envelope-open': faEnvelopeOpen,
  'envelope-circle-check': faEnvelopeCircleCheck,
  'bullhorn': faBullhorn,
  'dollar-sign': faDollarSign,
  'coins': faCoins,
  'bullseye': faBullseye
};

export function FontAwesomeIcon({ 
  icon, 
  size,
  className,
  ...props 
}: FontAwesomeIconProps) {
  if (Array.isArray(icon)) {
    const [prefix, name] = icon;
    if (prefix === 'fab') {
      // Handle brand icons
      const iconName = `fa${name.charAt(0).toUpperCase()}${name.slice(1)}`;
      const brandIcon = iconMap[name];
      if (!brandIcon) {
        console.warn(`Brand icon "${name}" not found`);
        return null;
      }
      return (
        <FAIcon 
          icon={brandIcon}
          className={className}
          size={size}
          {...props}
        />
      );
    }
    // Handle pro light icons with array notation
    return (
      <FAIcon 
        icon={[prefix, name]}
        className={className}
        size={size}
        {...props}
      />
    );
  }

  // Handle string-based icon names
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