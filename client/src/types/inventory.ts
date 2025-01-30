import { z } from "zod";

export const inventoryItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string(),
  quantity: z.number().min(0, "Quantity must be non-negative"),
  unit: z.string(),
  reorderPoint: z.number().min(0),
  location: z.string(),
  lastUpdated: z.string(),
  status: z.enum(["in_stock", "low_stock", "out_of_stock", "discontinued"]),
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export interface InventoryAllocationEvent {
  itemId: string;
  quantity: number;
  allocatedTo: string; // Production line ID
  timestamp: string;
  type: 'allocation' | 'deallocation';
  status: 'pending' | 'completed' | 'failed';
}

export interface InventoryUpdateEvent {
  itemId: string;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  timestamp: string;
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  recentUpdates: InventoryUpdateEvent[];
}
