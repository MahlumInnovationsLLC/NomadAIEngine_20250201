// Add MaterialStats interface to the existing types
export interface MaterialStats {
  totalItems: number;
  activeOrders: number;
  lowStockItems: number;
  warehouseCapacity: number;
  totalValue: number;
  stockoutRate: number;
  inventoryTurnover: number;
  averageLeadTime: number;
}

// Material and Inventory Types
export interface Material {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  unit: string;
  unitPrice: number;
  minimumStock: number;
  reorderPoint: number;
  leadTime: number;
  supplier: Supplier;
  supplierId: string;
  warehouseId: string;
  currentStock: number;
  allocatedStock: number;
  availableStock: number;
  lastUpdated: string;
  createdAt: string;
  // New fields for enhanced tracking
  batchNumber?: string;
  serialNumber?: string;
  abcClass?: 'A' | 'B' | 'C';
  binLocation?: string;
  lastCycleCount?: string;
  safetyStock: number;
  maxStock: number;
  turnoverRate?: number;
  averageDailyUsage?: number;
  // Vehicle manufacturing specifics
  isVehicleComponent?: boolean;
  compatibleVehicles?: string[];
  vinAssociations?: string[];
  regulatoryInfo?: {
    certifications: string[];
    complianceNotes: string;
  };
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  rating: number;
  activeOrders: number;
  performanceMetrics: SupplierMetrics;
  // New fields for enhanced supplier management
  qualityScore: number;
  contractTerms?: {
    paymentTerms: string;
    deliveryTerms: string;
    minimumOrderQuantity: number;
  };
  certifications?: string[];
  preferredSupplier?: boolean;
}

// Rest of the existing interfaces remain unchanged
export interface SupplierMetrics {
  onTimeDelivery: number;
  qualityScore: number;
  responseTime: number;
  costCompetitiveness: number;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  type: 'primary' | 'secondary' | 'distribution';
  capacity: {
    total: number;
    used: number;
    available: number;
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  zones: WarehouseZone[];
}

export interface WarehouseZone {
  id: string;
  name: string;
  type: 'storage' | 'picking' | 'receiving' | 'shipping';
  capacity: number;
  currentUtilization: number;
  // New fields for enhanced warehouse operations
  pickingStrategy: 'FIFO' | 'LIFO' | 'FEFO';
  allowsCrossDocking: boolean;
  restrictedMaterials?: string[];
  temperatureControlled?: boolean;
  temperatureRange?: {
    min: number;
    max: number;
    unit: 'C' | 'F';
  };
}

export interface InventoryTransaction {
  id: string;
  materialId: string;
  type: 'receipt' | 'issue' | 'transfer' | 'adjustment' | 'cycle_count';
  quantity: number;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  reference: string;
  timestamp: string;
  performedBy: string;
  // New fields for enhanced tracking
  batchNumber?: string;
  serialNumber?: string;
  qualityCheck?: {
    passed: boolean;
    inspectedBy: string;
    notes: string;
  };
  workOrderId?: string;
  productionLineId?: string;
}

// New interfaces for production integration
export interface ProductionOrder {
  id: string;
  orderNumber: string;
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold';
  startDate: string;
  endDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  materials: ProductionMaterial[];
  workInProgress: WorkInProgress[];
}

export interface ProductionMaterial {
  materialId: string;
  requiredQuantity: number;
  allocatedQuantity: number;
  consumedQuantity: number;
  deliverySchedule: {
    date: string;
    quantity: number;
  }[];
}

export interface WorkInProgress {
  id: string;
  productionOrderId: string;
  currentStage: string;
  completionPercentage: number;
  qualityMetrics: {
    defectRate: number;
    reworkRate: number;
    scrapQuantity: number;
  };
}

// New interfaces for BOM management
export interface BillOfMaterials {
  id: string;
  productId: string;
  version: string;
  status: 'draft' | 'active' | 'obsolete';
  components: BOMComponent[];
  totalCost: number;
  lastUpdated: string;
}

export interface BOMComponent {
  materialId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  substitutes?: string[];
  critical: boolean;
  leadTime: number;
}

// Extended analytics interfaces
export interface SupplyChainMetrics {
  healthScore: number;
  activeOrders: number;
  onTimeDelivery: number;
  averageLeadTime: number;
  supplierPerformance: number;
  inventoryAccuracy: number;
  transportationCosts: number;
  riskIndex: number;
  // New analytics fields
  totalInventoryValue: number;
  inventoryTurnover: number;
  stockoutRate: number;
  backorderRate: number;
  averageOrderCycle: number;
  warehouseUtilization: number;
  crossDockingRate: number;
  returnRate: number;
}

export interface InventoryStats {
  totalValue: number;
  totalItems: number;
  lowStockCount: number;
  overStockCount: number;
  inventoryTurnover: number;
  averageLeadTime: number;
  stockoutRate: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: 'draft' | 'submitted' | 'confirmed' | 'in_transit' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  totalAmount: number;
  currency: string;
  orderDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
}

export interface PurchaseOrderItem {
  materialId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface MaterialAllocation {
  id: string;
  materialId: string;
  quantity: number;
  productionOrderId: string;
  status: 'planned' | 'allocated' | 'consumed' | 'returned';
  allocationDate: string;
  requiredDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ForecastingData {
  materialId: string;
  period: string;
  forecastedDemand: number;
  actualDemand?: number;
  confidence: number;
  factors: {
    seasonal: number;
    trend: number;
    special_events?: string[];
  };
}

export interface SupplierCommunicationHistory {
  id: string;
  supplierId: string;
  type: 'message' | 'email' | 'meeting' | 'document';
  title: string;
  content: string;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  status: 'unread' | 'read' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sender: {
    id: string;
    name: string;
    role: string;
  };
  recipients: {
    id: string;
    name: string;
    role: string;
  }[];
  createdAt: string;
  updatedAt: string;
  metadata?: {
    meetingTime?: string;
    meetingDuration?: number;
    meetingLocation?: string;
    meetingAttendees?: string[];
    documentType?: string;
    documentExpiry?: string;
  };
}

export interface SupplierPerformanceData {
  period: string;
  qualityScore: number;
  deliveryPerformance: number;
  costCompetitiveness: number;
  defectRate: number;
  inspectionPassRate: number;
  documentationAccuracy: number;
  averageLeadTime: number;
  onTimeDeliveryRate: number;
  orderFillRate: number;
  responseTime: number;
  priceVariance: number;
  costSavings: number;
  totalSpend: number;
}

// Any additional supplier-related interfaces would go here