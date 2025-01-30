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
  assignedOperators: string[];
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
  createdAt: string;
  updatedAt: string;
}

export interface ProductionSchedule {
  lineId: string;
  orders: ProductionOrder[];
  scheduledDowntime: {
    startTime: string;
    endTime: string;
    reason: string;
  }[];
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