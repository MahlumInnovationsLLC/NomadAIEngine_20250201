import { Router } from "express";
import {
  getAllInventoryItems,
  getInventoryItem,
  allocateInventory,
  updateInventoryQuantity
} from "../services/azure/inventory_service";
import { bulkImportInventory } from "../services/azure/inventory_service";

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

// Add after existing routes
router.post("/bulk-import", async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    // Validate required fields
    const requiredFields = ['sku', 'name', 'category', 'unit'];
    const missingFields = items.some(item => 
      requiredFields.some(field => !item[field])
    );

    if (missingFields) {
      return res.status(400).json({ 
        error: "Missing required fields",
        requiredFields 
      });
    }

    const importedItems = await bulkImportInventory(items);
    res.status(201).json(importedItems);
  } catch (error) {
    console.error("Failed to bulk import inventory:", error);
    res.status(500).json({ 
      error: "Failed to import inventory items",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;