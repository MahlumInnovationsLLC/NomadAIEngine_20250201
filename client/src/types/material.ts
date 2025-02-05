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
}

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
}

export interface InventoryTransaction {
  id: string;
  materialId: string;
  type: 'receipt' | 'issue' | 'transfer' | 'adjustment';
  quantity: number;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  reference: string;
  timestamp: string;
  performedBy: string;
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

export interface InventoryStats {
  totalValue: number;
  totalItems: number;
  lowStockCount: number;
  overStockCount: number;
  inventoryTurnover: number;
  averageLeadTime: number;
  stockoutRate: number;
}

export interface SupplyChainMetrics {
  healthScore: number;
  activeOrders: number;
  onTimeDelivery: number;
  averageLeadTime: number;
  supplierPerformance: number;
  inventoryAccuracy: number;
  transportationCosts: number;
  riskIndex: number;
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
