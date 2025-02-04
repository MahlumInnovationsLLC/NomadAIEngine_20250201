import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from 'uuid';
import { ProjectStatus } from "@/types/manufacturing";

if (!process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING) {
  throw new Error("Azure Cosmos DB connection string not found");
}

const client = new CosmosClient(process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING);
const database = client.database("NomadAIEngineDB");
const productionContainer = database.container("production-lines");
const manufacturingSystemsContainer = database.container("manufacturing-systems");
const maintenanceContainer = database.container("maintenance-records");
const qualityInspectionContainer = database.container("quality-inspections");
const projectsContainer = database.container("manufacturing-projects");

// Project Management Functions
export async function getProject(id: string) {
  try {
    const { resource } = await projectsContainer.item(id, id).read();
    if (!resource) {
      throw new Error(`Project with id ${id} not found`);
    }
    return resource;
  } catch (error) {
    console.error("Failed to get project:", error);
    throw error;
  }
}

export async function updateProject(id: string, updates: any) {
  try {
    console.log('Updating project:', id, 'with updates:', updates);
    const { resource: existingProject } = await projectsContainer.item(id, id).read();

    if (!existingProject) {
      throw new Error(`Project with id ${id} not found`);
    }

    console.log('Found existing project:', existingProject);

    const updatedProject = {
      ...existingProject,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    console.log('Attempting to update with:', updatedProject);

    const { resource } = await projectsContainer.item(id, id).replace(updatedProject);
    if (!resource) {
      throw new Error('Failed to update project - no resource returned');
    }

    console.log('Successfully updated project:', resource);
    return resource;
  } catch (error) {
    console.error("Failed to update project:", error);
    throw error;
  }
}

export function calculateProjectStatus(project: any): ProjectStatus {
  if (project.manualStatus) {
    console.log('Using manual status:', project.status);
    return project.status;
  }

  console.log('Calculating status for project:', project);

  const today = new Date();
  console.log('Current date:', today);

  const dates = {
    fabricationStart: project.fabricationStart ? new Date(project.fabricationStart) : null,
    assemblyStart: project.assemblyStart ? new Date(project.assemblyStart) : null,
    wrapGraphics: project.wrapGraphics ? new Date(project.wrapGraphics) : null,
    ntcTesting: project.ntcTesting ? new Date(project.ntcTesting) : null,
    qcStart: project.qcStart ? new Date(project.qcStart) : null,
    ship: project.ship ? new Date(project.ship) : null,
  };

  console.log('Project dates:', dates);

  if (dates.ship && today >= dates.ship) {
    console.log('Project is COMPLETED');
    return "COMPLETED";
  }

  if (dates.qcStart && today >= dates.qcStart) {
    console.log('Project is IN QC');
    return "IN QC";
  }

  if (dates.ntcTesting && today >= dates.ntcTesting) {
    console.log('Project is IN NTC TESTING');
    return "IN NTC TESTING";
  }

  if (dates.wrapGraphics && today >= dates.wrapGraphics) {
    console.log('Project is IN WRAP');
    return "IN WRAP";
  }

  if (dates.assemblyStart && today >= dates.assemblyStart) {
    console.log('Project is IN ASSEMBLY');
    return "IN ASSEMBLY";
  }

  if (dates.fabricationStart && today >= dates.fabricationStart) {
    console.log('Project is IN FAB');
    return "IN FAB";
  }

  console.log('Project is NOT STARTED');
  return "NOT_STARTED";
}

export interface ProductionMetrics {
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  recordedBy: string;
}

export interface ProductionLine {
  id: string;
  name: string;
  description?: string;
  type: 'assembly' | 'machining' | 'fabrication' | 'packaging' | 'testing';
  status: 'operational' | 'maintenance' | 'error' | 'offline';
  capacity: {
    planned: number;
    actual: number;
    unit: string;
  };
  metrics: ProductionMetrics[];
  buildStages: any[];
  allocatedInventory: any[];
  performance: {
    efficiency: number;
    quality: number;
    availability: number;
    oee: number;
  };
  lastMaintenance: string;
  nextMaintenance: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}


// Add inspection-specific interfaces and functions
export interface QualityInspection {
  id: string;
  inspectionDate: string;
  inspector: string;
  productionLineId: string;
  results: any; // Replace 'any' with a more specific type if needed
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getQualityInspections(): Promise<QualityInspection[]> {
  try {
    const querySpec = {
      query: "SELECT * FROM c ORDER BY c.createdAt DESC"
    };

    const { resources } = await qualityInspectionContainer.items.query<QualityInspection>(querySpec).fetchAll();
    return resources;
  } catch (error) {
    console.error("Failed to get quality inspections:", error);
    throw error;
  }
}

export async function saveQualityInspection(inspection: Omit<QualityInspection, 'id'>): Promise<QualityInspection> {
  try {
    const now = new Date().toISOString();
    const newInspection = {
      id: uuidv4(),
      ...inspection,
      createdAt: now,
      updatedAt: now
    };

    const { resource } = await qualityInspectionContainer.items.create(newInspection);
    if (!resource) throw new Error("Failed to create quality inspection");
    return resource;
  } catch (error) {
    console.error("Failed to save quality inspection:", error);
    throw error;
  }
}

export async function updateQualityInspection(id: string, updates: Partial<QualityInspection>): Promise<QualityInspection> {
  try {
    const existing = await qualityInspectionContainer.item(id, id).read();
    if (!existing.resource) throw new Error("Inspection not found");

    const updated = {
      ...existing.resource,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const { resource } = await qualityInspectionContainer.item(id, id).replace(updated);
    if (!resource) throw new Error("Failed to update quality inspection");
    return resource;
  } catch (error) {
    console.error("Failed to update quality inspection:", error);
    throw error;
  }
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
    await database.containers.createIfNotExists({
      id: "manufacturing-projects",
      partitionKey: { paths: ["/id"] }
    });

    // Create a default production line if none exists
    const { resources } = await productionContainer.items.query("SELECT TOP 1 * FROM c").fetchAll();
    if (resources.length === 0) {
      const now = new Date().toISOString();
      const defaultProductionLine: ProductionLine = {
        id: uuidv4(),
        name: "Main Assembly Line",
        description: "Primary vehicle assembly line",
        type: "assembly",
        metrics: [],
        buildStages: [],
        allocatedInventory: [],
        lastMaintenance: now,
        nextMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "operational",
        capacity: {
          planned: 100,
          actual: 85,
          unit: "units/day"
        },
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
        name: "Default Production Line",
        type: "assembly",
        metrics: [metrics],
        buildStages: [],
        allocatedInventory: [],
        lastMaintenance: now,
        nextMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "operational",
        capacity: {
          planned: 100,
          actual: 0,
          unit: "units/day"
        },
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