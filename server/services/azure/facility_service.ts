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
    console.log(`Attempting to read project with id: ${id}`);

    // Try to get the project from Cosmos DB
    const { resource } = await projectsContainer.item(id, id).read();

    if (!resource) {
      // If project doesn't exist, create it with default values
      console.log(`Project ${id} not found, creating new project`);
      const newProject = {
        id,
        projectNumber: "NEW_PROJECT",
        name: "New Project",
        status: "NOT_STARTED",
        manualStatus: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource: createdProject } = await projectsContainer.items.create(newProject);
      console.log('Created new project:', createdProject);
      return createdProject;
    }

    console.log('Successfully retrieved project:', resource);
    return resource;
  } catch (error: any) {
    console.error("Failed to get project:", error);
    if (error.code === 404) {
      throw new Error(`Project with id ${id} not found`);
    }
    throw error;
  }
}

export async function updateProject(id: string, updates: any) {
  try {
    console.log('Updating project:', id, 'with updates:', updates);

    let existingProject;
    try {
      const { resource } = await projectsContainer.item(id, id).read();
      existingProject = resource;
    } catch (error: any) {
      if (error.code === 404) {
        console.log('Project not found, creating new one');
        existingProject = await getProject(id);
      } else {
        throw error;
      }
    }

    if (!existingProject) {
      console.error(`Project with id ${id} not found for update`);
      throw new Error(`Project with id ${id} not found`);
    }

    console.log('Found existing project:', existingProject);

    // Ensure manualStatus and status are handled correctly
    let finalUpdates = { ...updates };

    // If we're explicitly setting manualStatus to false, force automatic status calculation
    if ('manualStatus' in updates && updates.manualStatus === false) {
      const calculatedStatus = calculateProjectStatus({
        ...existingProject,
        ...finalUpdates
      });

      finalUpdates = {
        ...finalUpdates,
        status: calculatedStatus,
        manualStatus: false  // Ensure this stays false
      };
    } else if (!('manualStatus' in updates)) {
      // Preserve existing manualStatus if not explicitly changed
      finalUpdates.manualStatus = existingProject.manualStatus;
    }

    // Prepare the final update
    const updatedProject = {
      ...existingProject,
      ...finalUpdates,
      updatedAt: new Date().toISOString()
    };

    console.log('Attempting to update with:', updatedProject);

    // Perform the update
    const { resource } = await projectsContainer.item(id, id).replace(updatedProject);

    if (!resource) {
      console.error('No resource returned from update operation');
      throw new Error('Failed to update project - no resource returned');
    }

    console.log('Successfully updated project:', resource);
    return resource;
  } catch (error: any) {
    console.error("Failed to update project:", error);
    if (error.code) {
      console.error("Cosmos DB Error Code:", error.code);
    }
    if (error.body) {
      console.error("Cosmos DB Error Body:", error.body);
    }
    throw error;
  }
}

export function calculateProjectStatus(project: any): ProjectStatus {
  if (!project) {
    console.error('Cannot calculate status: project is null or undefined');
    return "NOT_STARTED";
  }

  // Only use manual status if explicitly set to true and manualStatus flag exists
  if ('manualStatus' in project && project.manualStatus === true) {
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

  // Return appropriate status based on dates
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

  console.log('Project is NOT_STARTED');
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
    console.log("Starting manufacturing database initialization...");

    // Verify database exists or create it
    const { database: dbResponse } = await client.databases.createIfNotExists({
      id: "NomadAIEngineDB"
    });
    console.log("Database verified/created:", dbResponse.id);

    // Create containers if they don't exist
    const containersToCreate = [
      {
        id: "production-lines",
        partitionKey: { paths: ["/id"] }
      },
      {
        id: "manufacturing-systems",
        partitionKey: { paths: ["/id"] }
      },
      {
        id: "maintenance-records",
        partitionKey: { paths: ["/id"] }
      },
      {
        id: "quality-inspections",
        partitionKey: { paths: ["/id"] }
      },
      {
        id: "manufacturing-projects",
        partitionKey: { paths: ["/id"] }
      }
    ];

    for (const containerDef of containersToCreate) {
      console.log(`Verifying container ${containerDef.id}...`);
      const { container } = await database.containers.createIfNotExists(containerDef);
      console.log(`Container ${container.id} verified/created`);

      // Verify container is accessible
      try {
        await container.items.query("SELECT TOP 1 * FROM c").fetchAll();
        console.log(`Container ${container.id} is accessible`);
      } catch (error) {
        console.error(`Error accessing container ${container.id}:`, error);
        throw error;
      }
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