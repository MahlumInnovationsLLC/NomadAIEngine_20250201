import { z } from "zod";

export const inventoryItemSchema = z.object({
  id: z.string(),
  partNo: z.string().min(1, "Part number is required"),
  binLocation: z.string().min(1, "Bin location is required"),
  warehouse: z.string().min(1, "Warehouse is required"),
  qtyOnHand: z.number().min(0, "Quantity must be non-negative"),
  description: z.string(),
  glCode: z.string(),
  prodCode: z.string(),
  vendCode: z.string(),
  cost: z.number().min(0, "Cost must be non-negative"),
  lastUpdated: z.string(),
  status: z.enum(["in_stock", "low_stock", "out_of_stock", "discontinued"]),
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  recentUpdates: {
    itemId: string;
    previousQuantity: number;
    newQuantity: number;
    reason: string;
    timestamp: string;
  }[];
}