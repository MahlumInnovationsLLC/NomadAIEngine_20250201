import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from 'uuid';
import { FieldType, InspectionField, InspectionSection, InspectionTemplate } from "@/types/manufacturing/templates";

/**
 * Generate a UUID using the uuid v4 function
 * This is an alias of uuidv4 to maintain backward compatibility
 * @returns A new UUID v4 string
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Combines multiple class names into a single string, using Tailwind's merge utility
 * to handle conflicting classes appropriately.
 * @param inputs List of class names, objects, or conditional expressions
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string into a more readable format
 * @param dateString Date string to format
 * @param includeTime Whether to include the time in the formatted string
 * @returns Formatted date string
 */
export function formatDate(dateString: string, includeTime: boolean = false): string {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' })
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Formats a timestamp into a relative time string (e.g., "2 hours ago")
 * @param timestamp Date string to format
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
}

/**
 * Creates a new template with default values
 * @returns New inspection template
 */
export function createNewTemplate(): InspectionTemplate {
  const now = new Date().toISOString();
  
  return {
    id: uuidv4(),
    name: 'New Inspection Template',
    category: 'Manufacturing',
    description: '',
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    updatedBy: 'system',
    isActive: true,
    isArchived: false,
    standard: '',
    sections: []
  };
}

/**
 * Creates a new section with default values
 * @param order Display order for the section
 * @returns New inspection section
 */
export function createNewSection(order: number): InspectionSection {
  return {
    id: uuidv4(),
    title: `Section ${order}`,
    description: '',
    order: order,
    fields: []
  };
}

/**
 * Creates a new field with default values based on field type
 * @param type Field type
 * @returns New inspection field
 */
export function createNewField(type: FieldType): InspectionField {
  const baseField: InspectionField = {
    id: uuidv4(),
    type,
    label: `New ${capitalize(type)} Field`,
    description: '',
    required: false,
    instructions: ''
  };
  
  switch (type) {
    case 'select':
    case 'multi-select':
      return {
        ...baseField,
        options: ['Option 1', 'Option 2', 'Option 3']
      };
      
    case 'number':
    case 'measurement':
      return {
        ...baseField,
        unit: '',
        min: undefined,
        max: undefined
      };
      
    case 'visual':
      return {
        ...baseField,
        acceptable: ['Good Condition', 'No Visible Defects', 'Meets Specifications']
      };
      
    default:
      return baseField;
  }
}

/**
 * Capitalizes the first letter of a string
 * @param str String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Duplicates a template with a new ID and updated metadata
 * @param template Template to duplicate
 * @returns Duplicated template
 */
export function duplicateTemplate(template: InspectionTemplate): InspectionTemplate {
  const now = new Date().toISOString();
  
  // Create deep copy of sections and fields with new IDs
  const sections = template.sections.map(section => {
    const fields = section.fields.map(field => ({
      ...field,
      id: uuidv4()
    }));
    
    return {
      ...section,
      id: uuidv4(),
      fields
    };
  });
  
  return {
    ...template,
    id: uuidv4(),
    name: `${template.name} (Copy)`,
    createdAt: now,
    updatedAt: now,
    version: 1,
    isArchived: false,
    sections
  };
}

/**
 * Toggles the archived status of a template
 * @param template Template to toggle archive status
 * @returns Updated template
 */
export function toggleTemplateArchiveStatus(template: InspectionTemplate): InspectionTemplate {
  return {
    ...template,
    isArchived: !template.isArchived,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Validates a template
 * @param template Template to validate
 * @returns Validation result
 */
export function validateTemplate(template: InspectionTemplate): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check template name
  if (!template.name.trim()) {
    errors.push('Template name is required');
  }
  
  // Check template category
  if (!template.category.trim()) {
    errors.push('Category is required');
  }
  
  // Check sections
  if (template.sections.length === 0) {
    errors.push('Template must have at least one section');
  } else {
    // Check each section
    template.sections.forEach((section, sectionIndex) => {
      if (!section.title.trim()) {
        errors.push(`Section ${sectionIndex + 1} must have a title`);
      }
      
      // Check for section fields
      if (section.fields.length === 0) {
        errors.push(`Section "${section.title || sectionIndex + 1}" must have at least one field`);
      } else {
        // Check each field
        section.fields.forEach((field, fieldIndex) => {
          if (!field.label.trim()) {
            errors.push(`Field ${fieldIndex + 1} in section "${section.title || sectionIndex + 1}" must have a label`);
          }
          
          // Check field type specific validations
          if (hasOptions(field.type) && (!field.options || field.options.length === 0)) {
            errors.push(`${field.label || 'Field ' + (fieldIndex + 1)} in section "${section.title || sectionIndex + 1}" must have at least one option`);
          }
          
          if (hasAcceptanceCriteria(field.type) && (!field.acceptable || field.acceptable.length === 0)) {
            errors.push(`${field.label || 'Field ' + (fieldIndex + 1)} in section "${section.title || sectionIndex + 1}" must have at least one acceptance criterion`);
          }
        });
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Checks if a field type has options
 * @param type Field type
 * @returns Whether the field type has options
 */
export function hasOptions(type: FieldType): boolean {
  return type === 'select' || type === 'multi-select';
}

/**
 * Checks if a field type has acceptance criteria
 * @param type Field type
 * @returns Whether the field type has acceptance criteria
 */
export function hasAcceptanceCriteria(type: FieldType): boolean {
  return type === 'visual';
}

/**
 * Checks if a field type has units
 * @param type Field type
 * @returns Whether the field type has units
 */
export function hasUnits(type: FieldType): boolean {
  return type === 'number' || type === 'measurement';
}

/**
 * Checks if a field type has tolerance
 * @param type Field type
 * @returns Whether the field type has tolerance
 */
export function hasTolerance(type: FieldType): boolean {
  return type === 'measurement';
}

/**
 * Generates a slug from a string
 * @param str String to convert to slug
 * @returns Slug string
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .trim();
}

/**
 * Truncates text to a specific length, adding an ellipsis if needed
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Formats a number of bytes into a human-readable string representation
 * @param bytes Number of bytes to format
 * @param decimals Number of decimal places to include in the output
 * @returns Formatted size string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}