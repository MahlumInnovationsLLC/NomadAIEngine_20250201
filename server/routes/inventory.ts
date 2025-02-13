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
import * as XLSX from 'xlsx';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // Increased to 50MB limit for large files
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'text/tab-separated-values'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload an Excel or CSV file.'));
    }
  }
});

// Bulk import inventory items
router.post("/bulk-import", upload.single('file'), async (req, res) => {
  console.log("Starting bulk import process...");
  try {
    if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(`Processing file: ${req.file.originalname}, size: ${req.file.size} bytes`);
    let records: any[] = [];

    // Handle Excel files
    if (req.file.mimetype.includes('excel') || req.file.originalname.match(/\.xlsx?$/i)) {
      console.log("Processing Excel file...");
      try {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        console.log(`Found ${workbook.SheetNames.length} sheets`);

        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          return res.status(400).json({ error: "Excel file is empty" });
        }

        records = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        console.log(`Successfully parsed ${records.length} records from Excel`);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        return res.status(400).json({ 
          error: "Failed to parse Excel file",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    } 
    // Handle CSV/TSV files
    else {
      console.log("Processing CSV/TSV file...");
      try {
        const fileContent = req.file.buffer.toString('utf-8');
        const delimiter = fileContent.includes('\t') ? '\t' : ',';

        records = await new Promise((resolve, reject) => {
          parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            delimiter: delimiter,
            relax_column_count: true
          }, (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        });
        console.log(`Successfully parsed ${records.length} records from CSV/TSV`);
      } catch (error) {
        console.error("Error parsing CSV/TSV file:", error);
        return res.status(400).json({ 
          error: "Failed to parse CSV/TSV file",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    if (!Array.isArray(records) || records.length === 0) {
      console.error("No valid records found in file");
      return res.status(400).json({ error: "No valid records found in the file" });
    }

    console.log(`Beginning transformation of ${records.length} records...`);
    try {
      const transformedItems = records.map((record: any, index: number) => {
        try {
          // Get identifier fields
          const sku = record.PartNo || record.sku;
          const name = record.Description || record.name;

          // Require at least one identifier
          if (!sku && !name) {
            throw new Error(`Row ${index + 1}: Each row must have either a SKU/PartNo or Name/Description`);
          }

          // Transform with optional fields and defaults
          return {
            sku: sku?.toString().trim() || `SKU-${Date.now()}-${index}`,
            name: name?.toString().trim() || `Item ${sku}`,
            description: (record.Description || record.description)?.toString().trim() || '',
            category: record.Category?.toString().trim() || 'Uncategorized',
            currentStock: parseFloat(record.QtyOnHand || record.quantity) || 0,
            unit: record.Unit?.toString().trim() || 'pcs',
            minimumStock: parseFloat(record.MinStock || record.minimumStock) || 0,
            reorderPoint: parseFloat(record.ReorderPoint || record.reorderPoint) || 0,
            binLocation: record.BinLocation?.toString().trim() || '',
            warehouse: record.Warehouse?.toString().trim() || '',
            cost: parseFloat(record.Cost || record.cost) || 0,
            supplier: (record.VendCode || record.supplier)?.toString().trim() || '',
            leadTime: parseInt(record.LeadTime || record.leadTime) || 0,
            batchNumber: record.BatchNumber?.toString().trim() || '',
            expiryDate: record.ExpiryDate || record.expiryDate || null,
            notes: record.Notes?.toString().trim() || ''
          };
        } catch (error) {
          console.error(`Error transforming record at index ${index}:`, error);
          throw error;
        }
      });

      console.log(`Successfully transformed ${transformedItems.length} records. Starting import...`);
      const importedItems = await bulkImportInventory(transformedItems);
      console.log(`Successfully imported ${importedItems.length} items`);

      res.status(201).json({
        message: "Successfully imported inventory items",
        count: importedItems.length,
        items: importedItems
      });
    } catch (error) {
      console.error("Error processing inventory items:", error);
      res.status(400).json({
        error: "Failed to process inventory items",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  } catch (error) {
    console.error("File upload error:", error);
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