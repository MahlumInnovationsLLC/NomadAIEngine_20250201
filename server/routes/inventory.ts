import { Router } from "express";
import {
  getAllInventoryItems,
  getInventoryItem,
  allocateInventory,
  updateInventoryQuantity
} from "../services/azure/inventory_service";

const router = Router();

// Get all inventory items
router.get("/items", async (req, res) => {
  try {
    const items = await getAllInventoryItems();
    res.json(items);
  } catch (error) {
    console.error("Failed to get inventory items:", error);
    res.status(500).json({ error: "Failed to get inventory items" });
  }
});

// Get single inventory item
router.get("/items/:id", async (req, res) => {
  try {
    const item = await getInventoryItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    res.json(item);
  } catch (error) {
    console.error("Failed to get inventory item:", error);
    res.status(500).json({ error: "Failed to get inventory item" });
  }
});

// Allocate inventory to production line
router.post("/allocate", async (req, res) => {
  try {
    const { itemId, quantity, productionLineId } = req.body;
    
    if (!itemId || !quantity || !productionLineId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const allocation = await allocateInventory(itemId, quantity, productionLineId);
    res.json(allocation);
  } catch (error: any) {
    console.error("Failed to allocate inventory:", error);
    res.status(error.message === "Insufficient inventory" ? 400 : 500)
       .json({ error: error.message || "Failed to allocate inventory" });
  }
});

// Update inventory quantity
router.post("/items/:id/update-quantity", async (req, res) => {
  try {
    const { quantity, reason } = req.body;
    
    if (typeof quantity !== 'number' || !reason) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const updatedItem = await updateInventoryQuantity(req.params.id, quantity, reason);
    res.json(updatedItem);
  } catch (error: any) {
    console.error("Failed to update inventory quantity:", error);
    res.status(500).json({ error: error.message || "Failed to update inventory quantity" });
  }
});

export default router;
