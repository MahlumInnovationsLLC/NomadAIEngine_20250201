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

// Add QualityMetric interface
export interface QualityMetric {
  value: number;
  trend: number;
  target: number;
  unit: string;
}

export interface QualityMetrics {
  defectRate: QualityMetric;
  firstPassYield: QualityMetric;
  customerComplaints: QualityMetric;
  supplierQuality: QualityMetric;
  processCapability: QualityMetric;
  qualityTraining: QualityMetric;
}

// Update QualityInspection interface
export interface QualityInspection {
  id: string;
  inspectionDate: string;
  inspector: string;
  productionLineId: string;
  projectNumber?: string; // Added project number field
  templateType: 'inspection' | 'audit' | 'ncr' | 'capa' | 'scar';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results: {
    checklistItems: {
      id: string;
      parameter: string;
      specification: string;
      measurement?: string | number;
      status: 'pass' | 'fail' | 'na';
      notes?: string;
    }[];
    defectsFound: {
      id: string;
      description: string;
      severity: 'minor' | 'major' | 'critical';
      status: 'identified' | 'investigating' | 'resolved';
      correctiveAction?: string;
    }[];
  };
  notes?: string;
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

export type ProjectStatus =
  | "NOT STARTED"
  | "IN FAB"
  | "IN ASSEMBLY"
  | "IN WRAP"
  | "IN NTC TESTING"
  | "IN QC"
  | "COMPLETED";

export interface Project {
  id: string;
  projectNumber: string;
  name?: string;
  location?: string;
  team?: string;
  contractDate?: string;
  dpasRating?: string;
  chassisEta?: string;
  stretchShortenGears?: 'N/A' | 'Stretch' | 'Shorten' | 'Gears';
  paymentMilestones?: string;
  lltsOrdered?: string;
  meAssigned?: string;
  meCadProgress?: number;
  eeAssigned?: string;
  eeDesignProgress?: number;
  itAssigned?: string;
  itDesignProgress?: number;
  ntcAssigned?: string;
  ntcDesignProgress?: number;
  fabricationStart?: string;
  assemblyStart?: string;
  wrapGraphics?: string;
  ntcTesting?: string;
  qcStart?: string;
  qcDays?: string;
  executiveReview?: string;
  ship?: string;
  delivery?: string;
  status: ProjectStatus;
  manualStatus?: boolean;
  progress: number;
  tasks?: ProjectTask[];
  notes?: string;
}

export interface ProjectTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  dependencies: string[];
  assignee: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface QualityFormTemplate {
  id: string;
  name: string;
  type: 'inspection' | 'audit' | 'ncr' | 'capa' | 'scar';
  description: string;
  sections: {
    id: string;
    title: string;
    description?: string;
    fields: {
      id: string;
      label: string;
      type: 'text' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'date' | 'file';
      required: boolean;
      options?: string[];
      validation?: {
        min?: number;
        max?: number;
        pattern?: string;
      };
    }[];
  }[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  isActive: boolean;
}

export interface NonConformanceReport {
  id: string;
  number: string; // NCR tracking number
  title: string;
  description: string;
  detectedDate: string;
  reportedBy: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'draft' | 'open' | 'under_review' | 'pending_disposition' | 'closed';
  type: 'product' | 'process' | 'material' | 'documentation';
  area: string;
  productLine?: string;
  lotNumber?: string;
  quantityAffected?: number;
  disposition: 'use_as_is' | 'rework' | 'repair' | 'scrap' | 'return_to_supplier' | 'pending';
  containmentActions: {
    action: string;
    assignedTo: string;
    dueDate: string;
    completedDate?: string;
    status: 'pending' | 'in_progress' | 'completed';
  }[];
  rootCauseAnalysis?: {
    category: string;
    description: string;
    attachments?: string[];
  };
  correctiveActionId?: string; // Reference to CAPA if created
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CorrectiveAction {
  id: string;
  number: string; // CAPA tracking number
  title: string;
  description: string;
  type: 'corrective' | 'preventive' | 'improvement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'open' | 'in_progress' | 'verification' | 'closed';
  source: 'ncr' | 'audit' | 'customer_complaint' | 'internal';
  sourceReference?: string; // Reference to source document (e.g., NCR number)
  problemStatement: string;
  rootCauseAnalysis: {
    method: '5why' | 'fishbone' | 'fmea' | 'other';
    findings: string;
    attachments?: string[];
  };
  actions: {
    id: string;
    type: 'immediate' | 'corrective' | 'preventive';
    description: string;
    assignedTo: string;
    dueDate: string;
    completedDate?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'verified';
    verificationMethod?: string;
    verificationResults?: string;
    verifiedBy?: string;
    verificationDate?: string;
  }[];
  effectiveness: {
    criteria: string;
    measurement: string;
    results?: string;
    verifiedBy?: string;
    verificationDate?: string;
  };
  attachments: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierCorrectiveAction {
  id: string;
  number: string; // SCAR tracking number
  supplierId: string;
  supplierName: string;
  issueDate: string;
  responseRequired: string;
  status: 'draft' | 'issued' | 'supplier_response' | 'review' | 'closed';
  issue: {
    description: string;
    partNumbers?: string[];
    lotNumbers?: string[];
    quantityAffected?: number;
    occurrenceDate: string;
    category: 'quality' | 'delivery' | 'documentation' | 'other';
    severity: 'minor' | 'major' | 'critical';
  };
  containmentActions: {
    action: string;
    responsibility: 'supplier' | 'internal';
    dueDate: string;
    completedDate?: string;
    status: 'pending' | 'in_progress' | 'completed';
    verification?: string;
  }[];
  rootCauseAnalysis?: {
    method: string;
    findings: string;
    attachments?: string[];
  };
  correctiveActions: {
    action: string;
    type: 'immediate' | 'long_term';
    responsibility: string;
    dueDate: string;
    completedDate?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'verified';
    verification?: string;
  }[];
  preventiveActions: {
    action: string;
    responsibility: string;
    dueDate: string;
    completedDate?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'verified';
  }[];
  verification: {
    method: string;
    results?: string;
    verifiedBy?: string;
    verificationDate?: string;
  };
  attachments: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  availableStock: number;
  safetyStock: number;
  leadTime: number;
  reorderPoint: number;
  standardCost: number;
  supplier?: string;
}

export interface BOMComponent {
  materialId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  leadTime: number;
  critical: boolean;
  substitutes?: string[];
  notes?: string;
}

export interface BillOfMaterials {
  id: string;
  projectId: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
  components: BOMComponent[];
  totalCost: number;
  createdBy: string;
  lastUpdated: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
}

// Add MaterialAllocation interface
export interface MaterialAllocation {
  id: string;
  materialId: string;
  quantity: number;
  allocationDate: string;
  status: 'pending' | 'allocated' | 'depleted';
  projectId: string;
  productionLineId: string;
  requiredQuantity: number;
}

export interface FloorPlan {
  id: string;
  name: string;
  description: string | null;
  imageUrl?: string;
  dimensions: {
    width: number;
    height: number;
  };
  gridSize: number;
  zones: FloorPlanZone[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
  isActive: boolean;
}

export interface FloorPlanZone {
  id: string;
  name: string;
  type: 'production' | 'storage' | 'assembly' | 'testing' | 'packaging';
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  capacity: number;
  occupiedBy?: string[]; // Project IDs
}

export interface ProjectLocation {
  projectId: string;
  floorPlanId: string;
  zoneId: string;
  position: {
    x: number;
    y: number;
  };
  status: 'planned' | 'active' | 'complete';
  startDate: string;
  endDate?: string;
}