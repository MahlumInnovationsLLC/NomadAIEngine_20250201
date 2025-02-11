import { Router } from 'express';
import { CosmosClient } from "@azure/cosmos";
import type { Warehouse, WarehouseZone, WarehouseMetrics } from '@/types/material';

const router = Router();
const cosmosClient = new CosmosClient(process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING || '');
const database = cosmosClient.database("NomadAIEngineDB");
const warehousesContainer = database.container("warehouses");
const zonesContainer = database.container("warehouse-zones");
const metricsContainer = database.container("warehouse-metrics");

// Initialize warehouse data if not exists
async function initializeWarehouses() {
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

  try {
    // Create containers if they don't exist
    await database.containers.createIfNotExists({
      id: "warehouses",
      partitionKey: { paths: ["/id"] }
    });
    await database.containers.createIfNotExists({
      id: "warehouse-zones",
      partitionKey: { paths: ["/warehouseId"] }
    });
    await database.containers.createIfNotExists({
      id: "warehouse-metrics",
      partitionKey: { paths: ["/warehouseId"] }
    });

    // Initialize warehouses
    for (const warehouse of defaultWarehouses) {
      const { resources: existingWarehouse } = await warehousesContainer
        .items
        .query({
          query: "SELECT * FROM c WHERE c.id = @id",
          parameters: [{ name: "@id", value: warehouse.id }]
        })
        .fetchAll();

      if (existingWarehouse.length === 0) {
        await warehousesContainer.items.create(warehouse);
        console.log(`Initialized warehouse: ${warehouse.name}`);

        // Initialize default zones for each warehouse
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
          },
          {
            id: `${warehouse.id}-receiving`,
            name: "Receiving Dock",
            type: "receiving",
            capacity: Math.floor(warehouse.totalCapacity * 0.1),
            currentUtilization: 0,
            utilizationPercentage: 0,
            status: "active",
            pickingStrategy: "FIFO",
            allowsCrossDocking: true
          },
          {
            id: `${warehouse.id}-shipping`,
            name: "Shipping Dock",
            type: "shipping",
            capacity: Math.floor(warehouse.totalCapacity * 0.1),
            currentUtilization: 0,
            utilizationPercentage: 0,
            status: "active",
            pickingStrategy: "FIFO",
            allowsCrossDocking: true
          }
        ];

        for (const zone of defaultZones) {
          await zonesContainer.items.create({
            ...zone,
            warehouseId: warehouse.id
          });
          console.log(`Initialized zone: ${zone.name} for warehouse: ${warehouse.name}`);
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

        await metricsContainer.items.create({
          id: warehouse.id,
          warehouseId: warehouse.id,
          ...defaultMetrics
        });
        console.log(`Initialized metrics for warehouse: ${warehouse.name}`);
      }
    }
  } catch (error) {
    console.error("Error initializing warehouses:", error);
  }
}

// Initialize warehouses on startup
initializeWarehouses().catch(console.error);

// Get all warehouses
router.get('/', async (_req, res) => {
  try {
    const { resources: warehouses } = await warehousesContainer
      .items
      .readAll()
      .fetchAll();

    // For each warehouse, fetch its zones
    const warehousesWithZones = await Promise.all(
      warehouses.map(async (warehouse) => {
        const { resources: zones } = await zonesContainer
          .items
          .query({
            query: "SELECT * FROM c WHERE c.warehouseId = @warehouseId",
            parameters: [{ name: "@warehouseId", value: warehouse.id }]
          })
          .fetchAll();

        return {
          ...warehouse,
          zones
        };
      })
    );

    res.json(warehousesWithZones);
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    res.status(500).json({ error: "Failed to fetch warehouses" });
  }
});

// Get warehouse metrics
router.get('/metrics/:warehouseId', async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const { resources: [metrics] } = await metricsContainer
      .items
      .query({
        query: "SELECT * FROM c WHERE c.warehouseId = @warehouseId",
        parameters: [{ name: "@warehouseId", value: warehouseId }]
      })
      .fetchAll();

    if (!metrics) {
      return res.status(404).json({ error: "Warehouse metrics not found" });
    }

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching warehouse metrics:", error);
    res.status(500).json({ error: "Failed to fetch warehouse metrics" });
  }
});

// Get warehouse zones
router.get('/zones/:warehouseId', async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const { resources: zones } = await zonesContainer
      .items
      .query({
        query: "SELECT * FROM c WHERE c.warehouseId = @warehouseId",
        parameters: [{ name: "@warehouseId", value: warehouseId }]
      })
      .fetchAll();

    res.json(zones);
  } catch (error) {
    console.error("Error fetching warehouse zones:", error);
    res.status(500).json({ error: "Failed to fetch warehouse zones" });
  }
});

// Update warehouse zone
router.patch('/zones/:zoneId', async (req, res) => {
  try {
    const { zoneId } = req.params;
    const updates = req.body;

    const { resources: [existingZone] } = await zonesContainer
      .items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: zoneId }]
      })
      .fetchAll();

    if (!existingZone) {
      return res.status(404).json({ error: "Zone not found" });
    }

    const updatedZone = {
      ...existingZone,
      ...updates,
      utilizationPercentage: Math.round((updates.currentUtilization / existingZone.capacity) * 100)
    };

    const { resource: result } = await zonesContainer
      .item(zoneId, existingZone.warehouseId)
      .replace(updatedZone);

    res.json(result);
  } catch (error) {
    console.error("Error updating warehouse zone:", error);
    res.status(500).json({ error: "Failed to update warehouse zone" });
  }
});

export default router;