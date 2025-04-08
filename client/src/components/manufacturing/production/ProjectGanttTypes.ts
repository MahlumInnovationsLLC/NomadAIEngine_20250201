import { Project } from "@/types/manufacturing";

// Gantt milestone interface
export interface GanttMilestone {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  projectId: string;
  projectName: string;
  editable?: boolean;
  deletable?: boolean;
  dependencies?: string[];
  duration: number; // Duration in days
  indent: number; // Indentation level for hierarchical display
  parent?: string; // Parent milestone ID for hierarchical relationships
  completed: number; // Percentage completed (0-100)
  isExpanded?: boolean; // Whether children are expanded or collapsed
  key?: string; // Key identifier for the milestone type
}

// Define the types we need from @aldabil/react-scheduler
export interface ProcessedEvent {
  event_id: string | number;
  title: string;
  start: Date;
  end: Date;
  resource: string | number;
  color?: string;
  editable?: boolean;
  deletable?: boolean;
  project_id?: string;
  [key: string]: any;
}

export interface Resource {
  id: string | number;
  title: string;
  subtitle?: string;
  color?: string;
  avatarSrc?: string | null;
}

// Define the interface for milestone templates
export interface MilestoneTemplate {
  key: string;
  title: string;
  duration: number;
  color: string;
  indent: number;
  parent?: string;
}

export interface ProjectGanttViewProps {
  projects: Project[];
  onUpdate?: (project: Project, milestones: GanttMilestone[]) => void;
}

// Milestone drag and resize interfaces
export interface DragState {
  isActive: boolean;
  milestoneId: string | null;
  startX: number;
  originalStartPos: number;
  originalWidth: number;
  type: 'move' | 'resize-start' | 'resize-end';
}

// Milestone Edit Dialog props interface
export interface MilestoneEditDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  editingMilestone: GanttMilestone | null;
  projectMilestones: GanttMilestone[];
  onSave: (milestone: GanttMilestone) => void;
}

// Determine if two milestones overlap in time
export function doMilestonesOverlap(a: GanttMilestone, b: GanttMilestone): boolean {
  return a.start <= b.end && b.start <= a.end;
}