import { z } from 'zod';

// Project status type
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

// Project interface
export interface Project {
  id: string;
  projectNumber?: string;
  name?: string;
  location?: string;
  team?: string;
  status: string;
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

// Team Member interface
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  skills?: string[];
  availability?: number;
  assignedProjects?: string[];
}

// Team Lead interface
export interface TeamLead {
  id: string;
  name: string;
  role: string;
  email?: string;
}

// Production Line schema and interface
export const productionLineSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['assembly', 'machining', 'fabrication', 'packaging', 'testing']),
  status: z.enum(['operational', 'maintenance', 'error', 'offline']),
  capacity: z.object({
    planned: z.number(),
    actual: z.number(),
    unit: z.string(),
  }),
  metrics: z.array(z.object({
    type: z.string(),
    value: z.number(),
    unit: z.string(),
    timestamp: z.string(),
    recordedBy: z.string(),
  })).optional(),
  buildStages: z.array(z.any()).optional(),
  allocatedInventory: z.array(z.any()).optional(),
  performance: z.object({
    efficiency: z.number(),
    quality: z.number(),
    availability: z.number(),
    oee: z.number(),
  }),
  lastMaintenance: z.string(),
  nextMaintenance: z.string(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Team management specific properties
  teamName: z.string().optional(),
  manpowerCapacity: z.number().optional(),
  assignedProjects: z.array(z.object({
    id: z.string(),
    name: z.string(),
    hoursAllocated: z.number(),
  })).optional(),
  teamMembers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    email: z.string().optional(),
    skills: z.array(z.string()).optional(),
    availability: z.number().optional(),
    assignedProjects: z.array(z.string()).optional(),
  })).optional(),
  electricalLead: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    email: z.string().optional(),
  }).nullable().optional(),
  assemblyLead: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    email: z.string().optional(),
  }).nullable().optional(),
  teamAnalytics: z.object({
    totalCapacity: z.number(),
    utilization: z.number(),
    efficiency: z.number(),
    projectHours: z.array(z.object({
      projectId: z.string(),
      earnedHours: z.number(),
      allocatedHours: z.number(),
      lastUpdated: z.string(),
      updatedBy: z.string(),
    })),
  }).optional(),
  teamNeeds: z.array(z.object({
    id: z.string(),
    type: z.enum(['part', 'tool', 'material', 'assistance', 'other']),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    requiredBy: z.string().optional(),
    projectId: z.string().optional(),
    notes: z.string().optional(),
    requestedBy: z.string(),
    requestedAt: z.string(),
    status: z.enum(['pending', 'in_progress', 'resolved', 'cancelled']),
    resolvedAt: z.string().optional(),
    resolvedBy: z.string().optional(),
    owner: z.string().optional(),
    ownerEmail: z.string().optional(),
    notificationSent: z.boolean().optional(),
  })).optional(),
});

export type ProductionLine = z.infer<typeof productionLineSchema>;

// Team need interface
export interface TeamNeed {
  id: string;
  type: 'part' | 'tool' | 'material' | 'assistance' | 'other';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiredBy?: string;
  projectId?: string;
  notes?: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  resolvedAt?: string;
  resolvedBy?: string;
  owner?: string;
  ownerEmail?: string;
  notificationSent?: boolean;
}

// Team Analytics
export interface ProjectHours {
  projectId: string;
  earnedHours: number;
  allocatedHours: number;
  lastUpdated: string;
  updatedBy: string;
}

export interface TeamAnalytics {
  totalCapacity: number;
  utilization: number;
  efficiency: number;
  projectHours: ProjectHours[];
}