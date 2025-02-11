import { Router } from 'express';
import { CosmosClient, SqlQuerySpec } from "@azure/cosmos";
import type { Warehouse, WarehouseZone, WarehouseMetrics } from '@/types/material';
import { BlobServiceClient } from "@azure/storage-blob";
import multer from 'multer';
import path from 'path';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Add better error handling for Cosmos DB connection
const cosmosConnectionString = process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING;
if (!cosmosConnectionString) {
  console.error('Missing NOMAD_AZURE_COSMOS_CONNECTION_STRING environment variable');
  throw new Error('Azure Cosmos DB connection string is required');
}

const cosmosClient = new CosmosClient(cosmosConnectionString);
const database = cosmosClient.database("NOMAD_AZURE_ENGINE_DB");
const warehousesContainer = database.container("NOMAD_AZURE_WAREHOUSES");
const zonesContainer = database.container("NOMAD_AZURE_WAREHOUSE_ZONES");
const metricsContainer = database.container("NOMAD_AZURE_WAREHOUSE_METRICS");
const floorPlansContainer = database.container("NOMAD_AZURE_WAREHOUSE_FLOOR_PLANS");

// Initialize Azure Blob Storage for floor plan images
const blobConnectionString = process.env.NOMAD_AZURE_STORAGE_CONNECTION_STRING;
const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnectionString!);
const floorPlansBlobContainer = blobServiceClient.getContainerClient("warehouse-floor-plans");

// Initialize containers
async function initializeWarehouses() {
  try {
    console.log('Starting warehouse initialization...');

    // Verify database exists
    const { database: dbResponse } = await cosmosClient.databases.createIfNotExists({
      id: "NOMAD_AZURE_ENGINE_DB"
    });
    console.log('Database verified/created:', dbResponse.id);

    // Create containers if they don't exist
    const containers = [
      { id: "NOMAD_AZURE_WAREHOUSES", partitionKey: "/id" },
      { id: "NOMAD_AZURE_WAREHOUSE_ZONES", partitionKey: "/warehouseId" },
      { id: "NOMAD_AZURE_WAREHOUSE_METRICS", partitionKey: "/warehouseId" },
      { id: "NOMAD_AZURE_WAREHOUSE_FLOOR_PLANS", partitionKey: "/warehouseId" }
    ];

    for (const container of containers) {
      console.log(`Verifying container ${container.id}...`);
      const { container: containerResponse } = await database.containers.createIfNotExists({
        id: container.id,
        partitionKey: { paths: [container.partitionKey] }
      });
      console.log(`Container ${containerResponse.id} verified/created`);
    }

    // Create blob container if it doesn't exist
    await floorPlansBlobContainer.createIfNotExists();
    console.log('Floor plans blob container verified/created');

    const defaultWarehouses: Warehouse[] = [
      {
        id: "cfalls-wh",
        name: "CFalls Warehouse",
        code: "CFW",
        type: "primary",
        capacity: {
          total: 150000,
          used: 95000,
          available: 55000
        },
        location: "Columbia Falls, MT",
        totalCapacity: 150000,
        utilizationPercentage: 63,
        zones: []
      },
      {
        id: "libby-wh",
        name: "Libby Distribution Center",
        code: "LDC",
        type: "distribution",
        capacity: {
          total: 85000,
          used: 45000,
          available: 40000
        },
        location: "Libby, MT",
        totalCapacity: 85000,
        utilizationPercentage: 53,
        zones: []
      },
      {
        id: "huntsville-wh",
        name: "Huntsville Warehouse",
        code: "HWH",
        type: "secondary",
        capacity: {
          total: 120000,
          used: 78000,
          available: 42000
        },
        location: "Huntsville, AL",
        totalCapacity: 120000,
        utilizationPercentage: 65,
        zones: []
      }
    ];

    // Initialize warehouses if they don't exist
    for (const warehouse of defaultWarehouses) {
      try {
        console.log(`Checking for existing warehouse: ${warehouse.id}`);
        const querySpec: SqlQuerySpec = {
          query: "SELECT * FROM c WHERE c.id = @id",
          parameters: [
            {
              name: "@id",
              value: warehouse.id
            }
          ]
        };

        const { resources } = await warehousesContainer.items.query(querySpec).fetchAll();

        if (resources.length === 0) {
          console.log(`Creating warehouse: ${warehouse.name}`);
          const { resource: createdWarehouse } = await warehousesContainer.items.create(warehouse);
          console.log(`Successfully created warehouse: ${createdWarehouse?.id}`);

          // Initialize default zones for this warehouse
          const defaultZones: Omit<WarehouseZone, 'warehouseId'>[] = [
            {
              id: `${warehouse.id}-storage`,
              name: "General Storage",
              type: "storage",
              capacity: Math.floor(warehouse.totalCapacity * 0.6),
              currentUtilization: 0,
              utilizationPercentage: 0,
              status: "active",
              pickingStrategy: "FIFO",
              allowsCrossDocking: false
            },
            {
              id: `${warehouse.id}-picking`,
              name: "Picking Zone",
              type: "picking",
              capacity: Math.floor(warehouse.totalCapacity * 0.2),
              currentUtilization: 0,
              utilizationPercentage: 0,
              status: "active",
              pickingStrategy: "FIFO",
              allowsCrossDocking: true
            }
          ];

          for (const zone of defaultZones) {
            console.log(`Creating zone: ${zone.name} for warehouse: ${warehouse.id}`);
            await zonesContainer.items.create({
              ...zone,
              warehouseId: warehouse.id
            });
          }

          // Initialize metrics
          const defaultMetrics: Omit<WarehouseMetrics, 'id' | 'warehouseId'> = {
            pickingAccuracy: 98.5,
            ordersProcessed: 0,
            inventoryTurns: 0,
            avgDockTime: 0,
            capacityUtilization: 0,
            orderFulfillmentTime: 0,
            inventoryAccuracy: 99.5,
            laborEfficiency: 85
          };

          console.log(`Creating metrics for warehouse: ${warehouse.id}`);
          await metricsContainer.items.create({
            id: warehouse.id,
            warehouseId: warehouse.id,
            ...defaultMetrics
          });
        } else {
          console.log(`Warehouse ${warehouse.id} already exists`);
        }
      } catch (error) {
        console.error(`Error processing warehouse ${warehouse.id}:`, error);
        throw error;
      }
    }

    console.log('Warehouse initialization completed successfully');
  } catch (error) {
    console.error('Error initializing warehouses:', error);
    throw error;
  }
}

// Initialize warehouses when the server starts
initializeWarehouses().catch(console.error);

// Get all warehouses with their zones
router.get('/', async (_req, res) => {
  try {
    console.log('Fetching warehouses...');

    const { resources: warehouses } = await warehousesContainer
      .items
      .readAll()
      .fetchAll();

    console.log(`Found ${warehouses.length} warehouses`);

    // Fetch zones for each warehouse
    const warehousesWithZones = await Promise.all(
      warehouses.map(async (warehouse) => {
        console.log(`Fetching zones for warehouse: ${warehouse.id}`);
        const querySpec: SqlQuerySpec = {
          query: "SELECT * FROM c WHERE c.warehouseId = @warehouseId",
          parameters: [
            {
              name: "@warehouseId",
              value: warehouse.id
            }
          ]
        };

        const { resources: zones } = await zonesContainer.items.query(querySpec).fetchAll();

        return {
          ...warehouse,
          zones
        };
      })
    );

    console.log(`Successfully fetched ${warehousesWithZones.length} warehouses with zones`);
    res.json(warehousesWithZones);
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to fetch warehouses",
      details: errorMessage
    });
  }
});

// Get warehouse metrics
router.get('/metrics/:warehouseId', async (req, res) => {
  try {
    const { warehouseId } = req.params;
    console.log(`Fetching metrics for warehouse: ${warehouseId}`);

    const querySpec: SqlQuerySpec = {
      query: "SELECT * FROM c WHERE c.warehouseId = @warehouseId",
      parameters: [
        {
          name: "@warehouseId",
          value: warehouseId
        }
      ]
    };

    const { resources } = await metricsContainer.items.query(querySpec).fetchAll();

    if (resources.length === 0) {
      console.log(`No metrics found for warehouse: ${warehouseId}`);
      return res.status(404).json({ error: "Warehouse metrics not found" });
    }

    console.log(`Successfully fetched metrics for warehouse: ${warehouseId}`);
    res.json(resources[0]);
  } catch (error) {
    console.error("Error fetching warehouse metrics:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to fetch warehouse metrics",
      details: errorMessage
    });
  }
});

// Update warehouse zone
router.patch('/zones/:zoneId', async (req, res) => {
  try {
    const { zoneId } = req.params;
    const updates = req.body;
    console.log(`Updating zone ${zoneId} with:`, updates);

    const querySpec: SqlQuerySpec = {
      query: "SELECT * FROM c WHERE c.id = @zoneId",
      parameters: [
        {
          name: "@zoneId",
          value: zoneId
        }
      ]
    };

    const { resources } = await zonesContainer.items.query(querySpec).fetchAll();

    if (resources.length === 0) {
      console.log(`Zone not found: ${zoneId}`);
      return res.status(404).json({ error: "Zone not found" });
    }

    const existingZone = resources[0];
    const updatedZone = {
      ...existingZone,
      ...updates,
      utilizationPercentage: Math.round((updates.currentUtilization / existingZone.capacity) * 100)
    };

    console.log(`Updating zone ${zoneId} with new data:`, updatedZone);
    const { resource: result } = await zonesContainer
      .item(zoneId, existingZone.warehouseId)
      .replace(updatedZone);

    console.log(`Successfully updated zone: ${zoneId}`);
    res.json(result);
  } catch (error) {
    console.error("Error updating warehouse zone:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to update warehouse zone",
      details: errorMessage
    });
  }
});

// Floor Plan Management Routes

// Get floor plan
router.get('/:warehouseId/floor-plan', async (req, res) => {
  try {
    const { warehouseId } = req.params;
    console.log(`Fetching floor plan for warehouse: ${warehouseId}`);

    const querySpec: SqlQuerySpec = {
      query: "SELECT * FROM c WHERE c.warehouseId = @warehouseId",
      parameters: [{ name: "@warehouseId", value: warehouseId }]
    };

    const { resources } = await floorPlansContainer.items.query(querySpec).fetchAll();

    if (resources.length === 0) {
      return res.status(404).json({ error: "Floor plan not found" });
    }

    res.json(resources[0]);
  } catch (error) {
    console.error("Error fetching floor plan:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to fetch floor plan", details: errorMessage });
  }
});

// Upload floor plan image
router.post('/:warehouseId/floor-plan/image', upload.single('file'), async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const blobName = `${warehouseId}-${Date.now()}${path.extname(file.originalname)}`;
    const blockBlobClient = floorPlansBlobContainer.getBlockBlobClient(blobName);

    await blockBlobClient.upload(file.buffer, file.size);
    const imageUrl = blockBlobClient.url;

    // Update floor plan in Cosmos DB
    const floorPlan = {
      id: `${warehouseId}-floor-plan`,
      warehouseId,
      imageUrl,
      dimensions: { width: 1200, height: 800 }, // Default dimensions
      gridSize: 50,
      racking: [],
      updatedAt: new Date().toISOString()
    };

    await floorPlansContainer.items.upsert(floorPlan);

    res.json({ imageUrl });
  } catch (error) {
    console.error("Error uploading floor plan:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to upload floor plan", details: errorMessage });
  }
});

// Update floor plan layout
router.patch('/:warehouseId/floor-plan/:floorPlanId', async (req, res) => {
  try {
    const { warehouseId, floorPlanId } = req.params;
    const updates = req.body;

    const { resource } = await floorPlansContainer
      .item(floorPlanId, warehouseId)
      .replace({
        ...updates,
        id: floorPlanId,
        warehouseId,
        updatedAt: new Date().toISOString()
      });

    res.json(resource);
  } catch (error) {
    console.error("Error updating floor plan:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to update floor plan", details: errorMessage });
  }
});


// Update warehouse
router.patch('/:warehouseId', async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const updates = req.body;

    console.log(`Updating warehouse ${warehouseId} with:`, updates);

    const { resource } = await warehousesContainer
      .item(warehouseId, warehouseId)
      .replace({
        ...updates,
        id: warehouseId,
        updatedAt: new Date().toISOString()
      });

    console.log(`Successfully updated warehouse: ${warehouseId}`);
    res.json(resource);
  } catch (error) {
    console.error("Error updating warehouse:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to update warehouse", details: errorMessage });
  }
});

// Create new warehouse
router.post('/', async (req, res) => {
  try {
    const newWarehouse = {
      ...req.body,
      id: req.body.code.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      capacity: {
        total: req.body.totalCapacity,
        used: 0,
        available: req.body.totalCapacity
      },
      utilizationPercentage: 0,
      zones: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Creating new warehouse:', newWarehouse);

    const { resource } = await warehousesContainer.items.create(newWarehouse);

    // Initialize warehouse metrics
    const defaultMetrics = {
      id: newWarehouse.id,
      warehouseId: newWarehouse.id,
      pickingAccuracy: 100,
      ordersProcessed: 0,
      inventoryTurns: 0,
      avgDockTime: 0,
      capacityUtilization: 0,
      orderFulfillmentTime: 0,
      inventoryAccuracy: 100,
      laborEfficiency: 100
    };

    await metricsContainer.items.create(defaultMetrics);

    console.log(`Successfully created warehouse: ${resource.id}`);
    res.status(201).json(resource);
  } catch (error) {
    console.error("Error creating warehouse:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to create warehouse", details: errorMessage });
  }
});

export default router;