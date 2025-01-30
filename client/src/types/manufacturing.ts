export interface ProductionMetrics {
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  recordedBy: string;
}

export interface ProductionLine {
  id: string;
  metrics: ProductionMetrics[];
  lastMaintenance: string;
  nextMaintenance: string;
  status: 'operational' | 'maintenance' | 'error' | 'offline';
  performance: {
    efficiency: number;
    quality: number;
    availability: number;
    oee: number;
  };
  notes: string;
  createdAt: string;
  updatedAt: string;
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
