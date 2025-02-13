import type { InventoryAllocationEvent } from "./inventory";

// Production Section Types
export type ProductionSectionId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'H' | 'I' | 'J' | 'K' | 'L' | 'T' | 'Y' | 'X';

export interface WorkloadCenter {
  id: string;
  sectionId: ProductionSectionId;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'maintenance';
  currentProjects: string[];
  capabilities: string[];
  assignedTeam?: string;
  metrics: {
    efficiency: number;
    utilization: number;
    quality: number;
  };
}

export interface SectionAllocation {
  id: string;
  projectId: string;
  sectionId: ProductionSectionId;
  components: {
    componentId: string;
    materialId: string;
    quantity: number;
    installationStatus: 'pending' | 'in_progress' | 'installed' | 'verified';
    installedBy?: string;
    installationDate?: string;
    verifiedBy?: string;
    verificationDate?: string;
    notes?: string;
  }[];
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  startDate?: string;
  completionDate?: string;
  assignedTeam?: string;
  precedingSection?: ProductionSectionId;
  nextSection?: ProductionSectionId;
}

// Add Material Traceability interfaces
export interface MaterialBatch {
  id: string;
  materialId: string;
  batchNumber: string;
  receivedDate: string;
  expiryDate?: string;
  quantity: number;
  remainingQuantity: number;
  unit: string;
  supplier: string;
  supplierLotNumber?: string;
  qualityStatus: 'pending_inspection' | 'approved' | 'rejected' | 'quarantined';
  inspectionDate?: string;
  inspectedBy?: string;
  certifications?: string[];
  location: string;
  cost: number;
  notes?: string;
}

export interface MaterialMovement {
  id: string;
  batchId: string;
  type: 'receipt' | 'issue' | 'return' | 'adjustment';
  quantity: number;
  fromLocation: string;
  toLocation: string;
  projectId?: string;
  productionOrderId?: string;
  timestamp: string;
  performedBy: string;
  reason?: string;
}

// Enhance BOM interfaces
export interface BOMRevision {
  revisionNumber: string;
  effectiveDate: string;
  changes: string[];
  approvalStatus: 'draft' | 'pending_review' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalDate?: string;
  notes?: string;
}

export interface BOMComponentWithTraceability extends BOMComponent {
  sectionId: ProductionSectionId;
  installationOrder: number;
  revisionHistory: BOMRevision[];
  alternateComponents?: {
    materialId: string;
    notes: string;
  }[];
  qualityRequirements?: {
    specification: string;
    acceptanceCriteria: string;
  }[];
  routingStepId?: string;
  wastageAllowance: number;
  traceabilityRequired: boolean;
  installationInstructions?: string;
  specialTools?: string[];
  estimatedInstallTime?: number;
}

export interface BillOfMaterialsWithTraceability extends Omit<BillOfMaterials, 'components'> {
  components: BOMComponentWithTraceability[];
  sections: Record<ProductionSectionId, {
    name: string;
    description: string;
    components: string[]; // Component IDs
    sequence: number;
    estimatedDuration: number;
    specialRequirements?: string[];
  }>;
  revisions: BOMRevision[];
  effectiveDate: string;
  expiryDate?: string;
  engineeringNotes?: string;
  qualityNotes?: string;
  attachments?: string[];
  relatedDocuments?: {
    type: string;
    documentId: string;
    name: string;
  }[];
}

// Add MRP specific interfaces
export interface MRPCalculation {
  id: string;
  materialId: string;
  periodStart: string;
  periodEnd: string;
  grossRequirement: number;
  scheduledReceipts: number;
  projectedAvailable: number;
  netRequirement: number;
  plannedOrders: number;
  safetyStock: number;
  orderPoint: number;
  lotSize: number;
  leadTime: number;
  source: 'production_order' | 'project' | 'forecast';
  sourceReference: string;
}

export interface MRPSchedule {
  id: string;
  materialId: string;
  scheduleType: 'order' | 'production' | 'transfer';
  quantity: number;
  dueDate: string;
  releaseDate: string;
  status: 'planned' | 'firmed' | 'released' | 'completed';
  priority: number;
  notes?: string;
}

export interface MaterialRequirement {
  materialId: string;
  requiredDate: string;
  quantity: number;
  projectId?: string;
  productionOrderId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'allocated' | 'issued' | 'completed';
}

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
  projectId?: string;
  projectNumber?: string;
  partNumber?: string;
  type: 'in-process' | 'final-qc' | 'executive-review' | 'pdi';
  templateType: InspectionTemplateType;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results: {
    checklistItems: {
      id: string;
      label: string;
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
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: string;
    uploadedBy: string;
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
  sections: Record<ProductionSectionId, {
    status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
    progress: number;
    startDate?: string;
    completionDate?: string;
    assignedTeam?: string;
    issues?: string[];
  }>;
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

// Update the template type for better categorization
export type InspectionTemplateType = 'in-process' | 'final-qc' | 'executive-review' | 'pdi';

// Update QualityFormTemplate interface
export interface QualityFormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'date' | 'file' | 'textarea';
  required: boolean;
  options?: string[];
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface QualityFormSection {
  id: string;
  title: string;
  description?: string;
  fields: QualityFormField[];
}

export interface QualityFormTemplate {
  id: string;
  name: string;
  type: 'inspection' | 'ncr' | 'capa' | 'scar' | 'mrb';
  description: string;
  inspectionType?: InspectionTemplateType;
  sections: QualityFormSection[];
  version: number;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
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

export interface QualityAudit {
  id: string;
  auditNumber: string;
  type: 'internal' | 'external' | 'supplier' | 'certification';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  scope: string;
  standard: string; // e.g., 'ISO 9001:2015'
  department: string;
  leadAuditor: string;
  auditTeam: string[];
  scheduledDate: string;
  completionDate?: string;
  duration: number; // in hours
  auditPlan: {
    objectives: string[];
    methodology: string;
    resources: string[];
    schedule: {
      activity: string;
      startTime: string;
      duration: number;
      participants: string[];
    }[];
  };
  findings: {
    id: string;
    type: 'observation' | 'minor-nc' | 'major-nc' | 'opportunity';
    description: string;
    category: string;
    reference: string; // ISO clause reference
    evidence: string;
    status: 'open' | 'in_progress' | 'closed';
    assignedTo?: string;
    dueDate?: string;
    correctiveActionId?: string; // Reference to CAPA if created
  }[];
  checklist: {
    id: string;
    section: string;
    requirement: string;
    reference: string; // ISO clause
    evidence: string;
    conformity: 'compliant' | 'non-compliant' | 'partial' | 'not-applicable';
    notes?: string;
  }[];
  attachments: string[];
  summary: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  nextAuditDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface AuditTemplate {
  id: string;
  name: string;
  type: 'internal' | 'external' | 'supplier' | 'certification';
  standard: string;
  version: number;
  isActive: boolean;
  sections: {
    id: string;
    title: string;
    reference: string; // ISO clause
    requirements: {
      id: string;
      text: string;
      guidance: string;
      evidenceRequired: string[];
      findingTypes?: ('observation' | 'minor' | 'major' | 'opportunity')[];
      requiredFindings?: boolean;
    }[];
  }[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FindingResponse {
  id: string;
  findingId: string;
  content: string;
  respondedBy: string;
  responseDate: string;
  status: 'draft' | 'submitted' | 'reviewed' | 'accepted' | 'rejected';
  reviewedBy?: string;
  reviewDate?: string;
  reviewComments?: string;
  attachments?: {
    name: string;
    url: string;
    size: number;
    type: string;
    uploadedAt: string;
  }[];
}

export interface RiskAcceptance {
  id: string;
  findingId: string;
  acceptedBy: string;
  acceptanceDate: string;
  justification: string;
  digitalSignature: {
    signedBy: string;
    signatureDate: string;
    ipAddress: string;
    userAgent: string;
  };
  approvedBy?: string;
  approvalDate?: string;
  expirationDate?: string;
  mitigatingControls?: string[];
  reviewCycle: 'quarterly' | 'semi-annual' | 'annual';
}

export interface Finding {
  id: string;
  type: 'observation' | 'minor' | 'major' | 'opportunity';
  description: string;
  department: string;
  status: 'open' | 'in_progress' | 'closed';
  createdAt: string;
  updatedAt: string;
  auditId?: string;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  responseDueDate?: string;
  responseStatus: 'pending' | 'overdue' | 'responded' | 'accepted' | 'rejected';
  resolution?: string;
  riskAcceptance?: RiskAcceptance;
  responses: FindingResponse[];
  attachments?: string[];
  comments?: {
    id: string;
    content: string;
    author: string;
    timestamp: string;
    type: 'comment' | 'status_update' | 'system';
    parentId?: string;
    mentions?: string[];
  }[];
  collaborators: {
    userId: string;
    role: 'owner' | 'reviewer' | 'contributor';
    addedAt: string;
  }[];
  timeline: {
    id: string;
    event: string;
    performedBy: string;
    timestamp: string;
    details?: Record<string, any>;
  }[];
  tags?: string[];
  impact?: string;
  rootCause?: string;
  recommendedActions?: string[];
  evidence?: {
    description: string;
    attachmentUrls: string[];
    addedBy: string;
    addedAt: string;
  }[];
}

export interface FindingTemplate {
  id: string;
  name: string;
  description: string;
  fields: {
    id: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'textarea';
    required: boolean;
    options?: string[];
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
    };
  }[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  isActive: boolean;
}