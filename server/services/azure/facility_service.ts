import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from 'uuid';

if (!process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING) {
  throw new Error("Azure Cosmos DB connection string not found");
}

const client = new CosmosClient(process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING);
const database = client.database("NomadAIEngineDB");
const productionContainer = database.container("production-lines");
const manufacturingSystemsContainer = database.container("manufacturing-systems");
const maintenanceContainer = database.container("maintenance-records");
const qualityInspectionContainer = database.container("quality-inspections");

export interface ProductionMetrics {
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  recordedBy: string;
}

export interface ProductionLine {
  id: string;
  metrics: ProductionMetrics[];
  lastMaintenance: string;
  nextMaintenance: string;
  status: 'operational' | 'maintenance' | 'error' | 'offline';
  performance: {
    efficiency: number;
    quality: number;
    availability: number;
    oee: number;
  };
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export async function initializeManufacturingDatabase() {
  try {
    await database.containers.createIfNotExists({
      id: "production-lines",
      partitionKey: { paths: ["/id"] }
    });

    await database.containers.createIfNotExists({
      id: "manufacturing-systems",
      partitionKey: { paths: ["/id"] }
    });

    await database.containers.createIfNotExists({
      id: "maintenance-records",
      partitionKey: { paths: ["/id"] }
    });

    await database.containers.createIfNotExists({
      id: "quality-inspections",
      partitionKey: { paths: ["/id"] }
    });

    // Create a default production line if none exists
    const { resources } = await productionContainer.items.query("SELECT TOP 1 * FROM c").fetchAll();
    if (resources.length === 0) {
      const now = new Date().toISOString();
      const defaultProductionLine: ProductionLine = {
        id: uuidv4(),
        metrics: [],
        lastMaintenance: now,
        nextMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "operational",
        performance: {
          efficiency: 98.5,
          quality: 99.2,
          availability: 97.8,
          oee: 95.6
        },
        notes: "Initial production line setup",
        createdAt: now,
        updatedAt: now
      };
      await productionContainer.items.create(defaultProductionLine);
    }

    console.log("Manufacturing database containers initialized successfully");
  } catch (error) {
    console.error("Failed to initialize manufacturing database:", error);
    throw error;
  }
}

// Production Line Functions
export async function getProductionLineStatus(): Promise<ProductionLine | null> {
  try {
    const querySpec = {
      query: "SELECT TOP 1 * FROM c ORDER BY c.createdAt DESC"
    };

    const { resources } = await productionContainer.items.query<ProductionLine>(querySpec).fetchAll();
    return resources[0] || null;
  } catch (error) {
    console.error("Failed to get production line status:", error);
    throw error;
  }
}

export async function addProductionMetrics(metrics: ProductionMetrics): Promise<ProductionLine> {
  try {
    const latest = await getProductionLineStatus();
    const now = new Date().toISOString();

    if (latest) {
      const updated = {
        ...latest,
        metrics: [...latest.metrics, metrics],
        updatedAt: now
      };

      const { resource } = await productionContainer.item(latest.id, latest.id).replace(updated);
      if (!resource) throw new Error("Failed to update production metrics");
      return resource;
    } else {
      const newRecord: ProductionLine = {
        id: uuidv4(),
        metrics: [metrics],
        lastMaintenance: now,
        nextMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "operational",
        performance: {
          efficiency: 100,
          quality: 100,
          availability: 100,
          oee: 100
        },
        notes: "",
        createdAt: now,
        updatedAt: now
      };

      const { resource } = await productionContainer.items.create(newRecord);
      if (!resource) throw new Error("Failed to create production record");
      return resource;
    }
  } catch (error) {
    console.error("Failed to add production metrics:", error);
    throw error;
  }
}

// Initialize the database when the module loads
initializeManufacturingDatabase().catch(console.error);