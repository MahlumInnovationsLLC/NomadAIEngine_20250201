import { HTMLAttributes } from 'react';
import { FontAwesomeIcon as FAIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faGithub,
  faTwitter,
  faLinkedin,
  faDiscord,
  faWindows,
  faSlack
} from '@fortawesome/free-brands-svg-icons';
import {
  faMagnifyingGlass as faMagnifyingGlassSolid,
  faBoxArchive as faBoxArchiveSolid,
  faCircleCheck as faCircleCheckSolid,
  faCircleXmark as faCircleXmarkSolid,
  faChevronRight as faChevronRightSolid,
  faChevronLeft as faChevronLeftSolid,
  faChevronDown as faChevronDownSolid,
  faChevronUp as faChevronUpSolid,
  faEllipsisH as faEllipsisHSolid,
  faSpinner as faSpinnerSolid,
  faBars as faBarsSolid,
  faPlus as faPlusSolid,
  faXmark as faXmarkSolid
} from '@fortawesome/free-solid-svg-icons';
import { 
  faCircleCheck,
  faCircleXmark,
  faCircle
} from '@fortawesome/free-regular-svg-icons';

// Add icons to library
library.add(
  // Brand icons
  faGithub,
  faTwitter,
  faLinkedin,
  faDiscord,
  faSlack,
  faWindows,

  // Solid icons
  faMagnifyingGlassSolid,
  faBoxArchiveSolid,
  faCircleCheckSolid,
  faCircleXmarkSolid,
  faChevronRightSolid,
  faChevronLeftSolid,
  faChevronDownSolid,
  faChevronUpSolid,
  faEllipsisHSolid,
  faSpinnerSolid,
  faBarsSolid,
  faPlusSolid,
  faXmarkSolid,

  // Regular icons
  faCircleCheck,
  faCircleXmark,
  faCircle
);

interface FontAwesomeIconProps extends HTMLAttributes<SVGSVGElement> {
  icon: string;
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

  // Regular icons with fallbacks to solid
  'circle': faCircle,
  'circle-check': faCircleCheck || faCircleCheckSolid,
  'circle-xmark': faCircleXmark || faCircleXmarkSolid,

  // Solid icons
  'magnifying-glass': faMagnifyingGlassSolid,
  'box-archive': faBoxArchiveSolid,
  'ellipsis-h': faEllipsisHSolid,
  'spinner': faSpinnerSolid,
  'chevron-right': faChevronRightSolid,
  'chevron-left': faChevronLeftSolid,
  'chevron-down': faChevronDownSolid,
  'chevron-up': faChevronUpSolid,
  'bars': faBarsSolid,
  'plus': faPlusSolid,
  'xmark': faXmarkSolid,
  'bars-to-panel': faBarsSolid // Fallback for pro icon
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