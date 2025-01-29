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

export interface ManufacturingSystem {
  id: string;
  name: string;
  type: 'Assembly' | 'Machining' | 'Finishing' | 'Testing' | 'Packaging' | 'Other';
  status: 'operational' | 'maintenance' | 'error' | 'offline';
  lastInspection: string;
  nextInspection: string;
  maintenanceHistory: {
    date: string;
    type: string;
    description: string;
    technician: string;
    cost?: number;
  }[];
  specifications?: Record<string, any>;
  location: string;
  installationDate: string;
  warranty: {
    provider: string;
    expirationDate: string;
    coverage: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface QualityInspection {
  id: string;
  type: 'incoming' | 'in-process' | 'final' | 'audit';
  status: 'pending' | 'completed' | 'failed' | 'in-progress';
  assignedTo: string;
  dueDate: string;
  completedDate?: string;
  productionLine: string;
  checklist: {
    item: string;
    specification: string;
    measurement?: number;
    tolerance?: number;
    status: 'pass' | 'fail' | 'na';
    notes?: string;
  }[];
  defects?: {
    description: string;
    severity: 'minor' | 'major' | 'critical';
    status: 'identified' | 'investigating' | 'resolved';
    correctiveAction?: string;
  }[];
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