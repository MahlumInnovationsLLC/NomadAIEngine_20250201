import type { InventoryAllocationEvent } from "./inventory";

export interface ProductionMetrics {
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  recordedBy: string;
}

export interface InventoryAllocation {
  materialId: string;
  materialName: string;
  requiredQuantity: number;
  allocatedQuantity: number;
  unit: string;
  status: 'pending' | 'allocated' | 'depleted';
  lastUpdated: string;
}

export interface BuildStageIssue {
  id: string;
  stageId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  reportedBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolution?: string;
  affectedComponents?: string[];
  qualityImpact?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  availability: 'available' | 'assigned' | 'unavailable';
  currentAssignment?: string;
}

export interface ProductionTeam {
  id: string;
  name: string;
  supervisor: string;
  members: TeamMember[];
  shift: 'morning' | 'afternoon' | 'night';
  specializations: string[];
}

export interface BuildStage {
  id: string;
  name: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  progress: number;
  startTime?: string;
  completionTime?: string;
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  dependencies: string[]; // IDs of dependent stages
  assignedTeam?: ProductionTeam;
  assignedOperators: string[];
  earnedHours: number;
  allocatedHours: number;
  issues: BuildStageIssue[];
  qualityChecks: {
    checkId: string;
    status: 'pending' | 'passed' | 'failed';
    timestamp: string;
  }[];
}

export interface ProductionBay {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'maintenance';
  currentOrder?: ProductionOrder;
  assignedTeam?: ProductionTeam;
  specializations: string[];
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  equipment: {
    id: string;
    name: string;
    status: 'operational' | 'maintenance' | 'error';
  }[];
}

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in_progress' | 'completed' | 'on_hold';
  startDate: string;
  dueDate: string;
  completedDate?: string;
  customer?: string;
  notes?: string;
  assignedBay?: ProductionBay;
  earnedHours: number;
  allocatedHours: number;
  progress: number;
  projectId?: string; // Add project reference
}

export interface ProductionLine {
  id: string;
  name: string;
  description?: string;
  type: 'assembly' | 'machining' | 'fabrication' | 'packaging' | 'testing';
  status: 'operational' | 'maintenance' | 'error' | 'offline';
  capacity: {
    planned: number;
    actual: number;
    unit: string;
  };
  currentOrder?: ProductionOrder;
  buildStages: BuildStage[];
  allocatedInventory: InventoryAllocationEvent[];
  metrics: ProductionMetrics[];
  performance: {
    efficiency: number;
    quality: number;
    availability: number;
    oee: number;
  };
  lastMaintenance: string;
  nextMaintenance: string;
  notes: string;
  productionBays: ProductionBay[];
  assignedTeams: ProductionTeam[];
  createdAt: string;
  updatedAt: string;
}

export interface GanttScheduleItem {
  id: string;
  orderNumber: string;
  productName: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  dependencies: string[];
  assignedBay: string;
  assignedTeam: string;
  type: 'production' | 'maintenance' | 'setup';
  status: 'scheduled' | 'in_progress' | 'completed' | 'delayed';
}

export interface ProductionSchedule {
  lineId: string;
  orders: ProductionOrder[];
  scheduledDowntime: {
    startTime: string;
    endTime: string;
    reason: string;
  }[];
  ganttItems: GanttScheduleItem[];
  projectId?: string; // Add project reference
}

export interface QualityCheck {
  id: string;
  stageId: string;
  checkType: 'visual' | 'measurement' | 'functional' | 'documentation';
  parameter: string;
  specification: string;
  actualValue?: string | number;
  status: 'pass' | 'fail' | 'pending';
  inspector: string;
  timestamp: string;
  notes?: string;
}

export interface ManufacturingSystem {
  id: string;
  name: string;
  type: 'Assembly' | 'Machining' | 'Finishing' | 'Testing' | 'Packaging' | 'Other';
  status: 'operational' | 'maintenance' | 'error' | 'offline';
  lastInspection: string;
  nextInspection: string;
  maintenanceHistory: {
    date: string;
    type: string;
    description: string;
    technician: string;
    cost?: number;
  }[];
  specifications?: Record<string, any>;
  location: string;
  installationDate: string;
  warranty: {
    provider: string;
    expirationDate: string;
    coverage: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface QualityInspection {
  id: string;
  type: 'incoming' | 'in-process' | 'final' | 'audit';
  status: 'pending' | 'completed' | 'failed' | 'in-progress';
  assignedTo: string;
  dueDate: string;
  completedDate?: string;
  productionLine: string;
  checklist: {
    item: string;
    specification: string;
    measurement?: number;
    tolerance?: number;
    status: 'pass' | 'fail' | 'na';
    notes?: string;
  }[];
  defects?: {
    description: string;
    severity: 'minor' | 'major' | 'critical';
    status: 'identified' | 'investigating' | 'resolved';
    correctiveAction?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInventoryAllocation extends InventoryAllocation {
  projectId: string;
  allocatedDate: string;
  requestedBy: string;
  notes?: string;
}

export interface ProductionProject {
  id: string;
  projectNumber: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  startDate: string;
  targetCompletionDate: string;
  actualCompletionDate?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  customer?: string;
  projectManager: string;
  totalBudgetedHours: number;
  totalActualHours: number;
  inventory: ProjectInventoryAllocation[];
  productionOrders: ProductionOrder[];
  schedule?: ProductionSchedule;
  metrics: {
    completionPercentage: number;
    hoursVariance: number;
    qualityScore: number;
    delayedTasks: number;
  };
  documents: {
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedBy: string;
    uploadedAt: string;
  }[];
  notes: {
    id: string;
    content: string;
    author: string;
    timestamp: string;
    type: 'general' | 'issue' | 'milestone';
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCreationForm {
  projectNumber: string;
  name: string;
  description: string;
  startDate: string;
  targetCompletionDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  customer?: string;
  projectManager: string;
  totalBudgetedHours: number;
}