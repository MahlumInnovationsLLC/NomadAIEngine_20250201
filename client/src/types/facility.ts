export interface ChemicalReading {
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  recordedBy: string;
}

export interface PoolMaintenance {
  id: string;
  readings: ChemicalReading[];
  lastCleaning: string;
  nextCleaning: string;
  filterStatus: string;
  chemicalLevels: {
    chlorine: number;
    pH: number;
    alkalinity: number;
    calcium: number;
  };
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuildingSystem {
  id: number;
  name: string;
  type: string;
  status: 'operational' | 'maintenance' | 'error' | 'offline';
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  healthScore: string | null;
  location: string | null;
  notes: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  lastInspection: string; //Retained from original
  nextInspection: string; //Retained from original
  maintenanceHistory: {
    date: string;
    type: string;
    description: string;
    technician: string;
    cost?: number;
  }[];
  specifications?: Record<string, any>; //Retained from original
  installationDate: string; //Retained from original
  warranty: {
    provider: string;
    expirationDate: string;
    coverage: string;
  };
}

export interface Inspection {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  status: 'pending' | 'completed' | 'overdue' | 'in-progress';
  assignedTo: string;
  dueDate: string;
  completedDate?: string;
  area: string;
  checklist: {
    item: string;
    status: 'pass' | 'fail' | 'na';
    notes?: string;
  }[];
  photos?: string[];
  issues?: {
    description: string;
    severity: 'low' | 'medium' | 'high';
    status: 'open' | 'in-progress' | 'resolved';
  }[];
  createdAt: string;
  updatedAt: string;
}