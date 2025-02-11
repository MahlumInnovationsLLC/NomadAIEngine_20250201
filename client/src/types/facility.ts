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
  installationDate: string;
  warranty: {
    provider: string;
    expirationDate: string;
    coverage: string;
  };
  notifications?: FacilityNotification[];
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

export interface FacilityNotification {
  id: number;
  buildingSystemId: number;
  type: 'maintenance_due' | 'system_error' | 'inspection_required' | 'health_alert' | 'status_change';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'unread' | 'read' | 'acknowledged' | 'resolved';
  metadata?: Record<string, any>;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

// Adding missing types for Equipment
interface EquipmentBase {
  id: string;
  name: string;
  type: string;
  position?: { x: number; y: number };
  status: 'operational' | 'maintenance' | 'error' | 'offline';
  healthScore: number;
  deviceConnectionStatus?: 'connected' | 'disconnected';
  isSelected?: boolean;
}

export interface Equipment extends BuildingSystem, EquipmentBase {
  // Combining BuildingSystem and EquipmentBase
}

export interface FloorPlan {
  id: string;
  name: string;
  dimensions: {
    width: number;
    height: number;
  };
  gridSize: number;
  imageUrl?: string;
  zones?: {
    id: string;
    name: string;
    type: string;
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];
  equipment?: Equipment[];
  updatedAt: string;
}