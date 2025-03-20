// Define project status options
export type ProjectStatus =
  | 'active' 
  | 'in_progress' 
  | 'planning' 
  | 'on_hold' 
  | 'completed'
  | 'cancelled'
  | 'NOT_STARTED'
  | 'IN_FAB'
  | 'IN_ASSEMBLY'
  | 'IN_WRAP'
  | 'IN_NTC_TESTING'
  | 'IN_QC'
  | 'PLANNING'
  | 'COMPLETED'
  | 'SHIPPING';

// Define common project interface
export interface Project {
  id: string;
  projectNumber: string;
  name?: string;
  location?: string;
  team?: string;
  status: ProjectStatus;
  manualStatus?: boolean;
  contractDate?: string;
  chassisEta?: string;
  paymentMilestones?: string;
  lltsOrdered?: string;
  meAssigned?: string;
  meCadProgress?: string | number;
  eeAssigned?: string;
  eeDesignProgress?: string | number;
  itDesignProgress?: string | number;
  ntcDesignProgress?: string | number;
  ntcAssigned?: string;
  notes?: string;
  fabricationStart?: string;
  assemblyStart?: string;
  wrapGraphics?: string;
  ntcTesting?: string;
  qcStart?: string;
  executiveReview?: string;
  ship?: string;
  delivery?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

// Define team member interface
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  skills?: string[];
  yearsExperience?: number;
  certifications?: string[];
  availability?: number; // percentage of time available
  assignedProjects?: string[];
  startDate?: string;
  department?: string;
}

// Define project hour tracking interface
export interface ProjectHours {
  projectId: string;
  allocatedHours: number;
  earnedHours: number;
  lastUpdated: string;
  updatedBy?: string;
}

// Define team needs interface
export interface TeamNeed {
  id: string;
  type: 'part' | 'tool' | 'material' | 'assistance' | 'other';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiredBy?: string; // Date when item is needed by
  requestedBy?: string;
  requestedAt: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  projectId?: string; // Associated project (optional)
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}

// Define team analytics interface
export interface TeamAnalytics {
  totalCapacity: number; // Total hours available for the team
  utilization: number; // Percentage of capacity currently utilized
  projectHours: ProjectHours[]; // Hours per project
  efficiency: number; // Ratio of earned vs allocated hours
  teamUtilizationTrend?: {
    dates: string[];
    values: number[];
  };
}

// Define production line interface
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
  performance: {
    efficiency: number;
    quality: number;
    availability: number;
    oee: number;
  };
  // Team structure
  electricalLead?: {
    name: string;
    id?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  assemblyLead?: {
    name: string;
    id?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  teamName?: string;
  teamMembers?: TeamMember[];
  manpowerCapacity?: number; // Number of people that can work on this line
  currentManpower?: number; // Current number of team members assigned
  notes?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  assignedProjects?: string[];
  teamNeeds?: TeamNeed[]; // Team needs and requests
  teamAnalytics?: TeamAnalytics; // Team analytics data
  metrics?: any[];
  buildStages?: any[];
  allocatedInventory?: any[];
  createdAt?: string;
  updatedAt?: string;
}

// Define production metrics
export interface ProductionMetrics {
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  recordedBy: string;
}

// Define quality inspection
export interface QualityInspection {
  id: string;
  inspectionDate: string;
  inspector: string;
  productionLineId: string;
  results: any;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}