import { Router } from "express";
import {
  getAllInventoryItems,
  getInventoryItem,
  allocateInventory,
  updateInventoryQuantity,
  getInventoryStats,
  bulkImportInventory
} from "../services/azure/inventory_service";
import multer from 'multer';
import { parse } from 'csv-parse';

const router = Router();
// Configure multer with increased size limit
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Bulk import inventory items
router.post("/bulk-import", upload.single('file'), async (req, res) => {
  try {
    console.log("Starting bulk import process");

    if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("File received:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const csvData = req.file.buffer.toString('utf-8');
    console.log("CSV data sample:", csvData.substring(0, 200)); // Log first 200 chars for debugging

    // Parse CSV data
    parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: '\t' // Add tab delimiter for TSV files
    }, async (err, records) => {
      if (err) {
        console.error("CSV parsing error:", err);
        return res.status(400).json({ 
          error: "Failed to parse CSV file",
          details: err.message 
        });
      }

      console.log(`Successfully parsed ${records.length} records from CSV`);
      console.log("Sample record:", records[0]);

      try {
        // Transform CSV records to match schema
        const transformedItems = records.map((record: any) => {
          const item = {
            partNo: record.PartNo?.toString().trim(),
            binLocation: record.BinLocation?.toString().trim(),
            warehouse: record.Warehouse?.toString().trim(),
            qtyOnHand: parseFloat(record.QtyOnHand) || 0,
            description: record.Description?.toString().trim() || '',
            glCode: record.GLCode?.toString().trim() || '',
            prodCode: record.ProdCode?.toString().trim() || '',
            vendCode: record.VendCode?.toString().trim() || '',
            cost: parseFloat(record.Cost) || 0
          };
          console.log("Transformed item:", item);
          return item;
        });

        // Validate required fields
        const invalidItems = transformedItems.filter(item => 
          !item.partNo || !item.binLocation || !item.warehouse || 
          isNaN(item.qtyOnHand) || item.qtyOnHand < 0
        );

        if (invalidItems.length > 0) {
          console.error("Found invalid items:", invalidItems);
          return res.status(400).json({
            error: "Invalid items found in CSV",
            details: {
              message: "Some items are missing required fields or have invalid data",
              invalidItems
            }
          });
        }

        console.log(`Importing ${transformedItems.length} valid items`);
        const importedItems = await bulkImportInventory(transformedItems);

        console.log(`Successfully imported ${importedItems.length} items`);
        res.status(201).json({
          message: "Successfully imported inventory items",
          count: importedItems.length,
          items: importedItems
        });
      } catch (error) {
        console.error("Failed to process inventory items:", error);
        res.status(500).json({
          error: "Failed to import inventory items",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });
  } catch (error) {
    console.error("Failed to handle file upload:", error);
    res.status(500).json({ 
      error: "Failed to process file upload",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get inventory statistics
router.get("/stats", async (_req, res) => {
  try {
    const stats = await getInventoryStats();
    res.json(stats);
  } catch (error) {
    console.error("Failed to get inventory stats:", error);
    res.status(500).json({ error: "Failed to get inventory statistics" });
  }
});

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