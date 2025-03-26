// Types for manufacturing module

// Quality Inspection types
export interface QualityInspection {
  id: string;
  title: string;
  description?: string;
  type: 'in-process' | 'final-qc' | 'executive-review' | 'pdi';
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  result?: 'pass' | 'fail' | 'conditional';
  template: QualityFormTemplate;
  responses: any[];
  notes?: string;
  attachments?: any[];
  serialNumber?: string;
  projectId?: string;
  projectNumber?: string;
}

// Quality Form Template types
export interface QualityFormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'checkbox' | 'select' | 'multiselect' | 'date' | 'image' | 'measurement' | 'visual';
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
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
  type: 'inspection';
  description: string;
  version: number;
  isActive: boolean;
  inspectionType?: 'in-process' | 'final-qc' | 'executive-review' | 'pdi';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  sections: QualityFormSection[];
}

// Team types
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  availability: number;
  teamId?: string;
  email: string;
  avatar?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  leadId: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ResourceAllocation {
  id: string;
  teamMemberId: string;
  projectId: string;
  hoursAllocated: number;
  startDate: string;
  endDate: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// Production line types
export interface ProductionLine {
  id: string;
  name: string;
  description: string;
  status: 'operational' | 'maintenance' | 'offline' | 'error';
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
  createdAt: string;
  updatedAt: string;
}

// Project types 
export interface Project {
  id: string;
  name?: string;
  projectNumber?: string;
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

// Team needs type
export interface TeamNeed {
  id: string;
  productionLineId: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  notes?: string;
  category: 'materials' | 'staffing' | 'equipment' | 'training' | 'support' | 'other';
}