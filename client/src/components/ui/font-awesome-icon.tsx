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
  faInstagram,
} from '@fortawesome/free-brands-svg-icons';
import {
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
  faPaperPlane,
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
  faPaperPlane
);

export interface FontAwesomeIconProps extends HTMLAttributes<SVGSVGElement> {
  icon: [IconPrefix, IconName] | IconName | string;
  size?: 'xs' | 'sm' | 'lg' | '2x' | '3x' | '4x' | '5x';
}

const iconMap: Record<string, IconDefinition> = {
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
  'paper-plane': faPaperPlane,
};

export function FontAwesomeIcon({
  icon,
  size,
  className,
  ...props
}: FontAwesomeIconProps) {
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
  const faIcon = iconMap[typeof icon === 'string' ? icon : ''];
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