// Milestone type definitions
export interface Milestone {
  id: string;
  title: string;
  start: string; // ISO date string
  end: string; // ISO date string
  color?: string;
  projectId: string;
  duration: number; // Duration in days
  dependencies?: string[];
  indent: number; // Indentation level for hierarchical display
  parent?: string | null; // Parent milestone ID for hierarchical relationships
  completed: number; // Percentage completed (0-100)
  isExpanded?: boolean; // Whether children are expanded or collapsed
  key?: string; // Key identifier for the milestone type
  createdAt: string;
  updatedAt: string;
}