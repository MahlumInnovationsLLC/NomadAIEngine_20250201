import { Container } from "@azure/cosmos";
import { v4 as uuidv4 } from 'uuid';
import { getContainer, isCosmosInitialized, waitForCosmosInitialization } from './cosmos_service';

let buildingSystemsContainer: Container | null = null;

// Types
export interface ChemicalReading {
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  recordedBy: string;
}

export interface PoolMaintenance {
  id: string;
  readings: ChemicalReading[];
  lastCleaning: string;
  nextCleaning: string;
  filterStatus: string;
  chemicalLevels: {
    chlorine: number;
    pH: number;
    alkalinity: number;
    calcium: number;
  };
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuildingSystem {
  id: string;
  name: string;
  type: 'HVAC' | 'Electrical' | 'Plumbing' | 'Safety' | 'Other';
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
  createdAt?: string;
  updatedAt?: string;
}

// Initialize Building Systems Container
export async function getBuildingSystemsContainer(): Promise<Container> {
  if (!buildingSystemsContainer) {
    // Wait for Cosmos DB to be initialized
    if (!isCosmosInitialized()) {
      console.log("Waiting for Cosmos DB initialization...");
      await waitForCosmosInitialization();
    }

    const container = getContainer('building-systems');
    if (!container) {
      throw new Error("Building systems container not initialized");
    }
    buildingSystemsContainer = container;
  }
  return buildingSystemsContainer;
}

// Building Systems Functions
export async function getBuildingSystems(): Promise<BuildingSystem[]> {
  try {
    const container = await getBuildingSystemsContainer();
    console.log("Fetching building systems from Cosmos DB...");

    const querySpec = {
      query: "SELECT * FROM c WHERE c.type IN ('HVAC', 'Electrical', 'Plumbing', 'Safety', 'Other') ORDER BY c.createdAt DESC"
    };

    const { resources } = await container.items.query<BuildingSystem>(querySpec).fetchAll();
    console.log(`Retrieved ${resources.length} building systems`);
    return resources;
  } catch (error) {
    console.error("Failed to get building systems:", error);
    return [];
  }
}

export async function addBuildingSystem(system: Omit<BuildingSystem, "id" | "createdAt" | "updatedAt">): Promise<BuildingSystem> {
  try {
    const container = await getBuildingSystemsContainer();
    console.log("Adding new building system:", system);

    const now = new Date().toISOString();
    const newSystem: BuildingSystem = {
      id: uuidv4(),
      ...system,
      maintenanceHistory: system.maintenanceHistory || [],
      specifications: system.specifications || {},
      createdAt: now,
      updatedAt: now
    };

    console.log("Creating building system in Cosmos DB...");
    const { resource } = await container.items.create(newSystem);

    if (!resource) {
      throw new Error("Failed to create building system - no resource returned");
    }

    console.log("Successfully created building system:", resource.id);
    return resource;
  } catch (error) {
    console.error("Failed to add building system:", error);
    throw error;
  }
}

export async function updateBuildingSystem(id: string, updates: Partial<BuildingSystem>): Promise<BuildingSystem | null> {
  try {
    const container = await getBuildingSystemsContainer();
    console.log(`Updating building system ${id}:`, updates);

    // First, get the existing system
    const { resource: existingSystem } = await container.item(id, id).read<BuildingSystem>();

    if (!existingSystem) {
      console.warn(`Building system ${id} not found`);
      return null;
    }

    const updatedSystem = {
      ...existingSystem,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    console.log("Updating building system in Cosmos DB...");
    const { resource } = await container.item(id, id).replace(updatedSystem);

    if (!resource) {
      throw new Error("Failed to update building system - no resource returned");
    }

    console.log("Successfully updated building system:", resource.id);
    return resource;
  } catch (error) {
    console.error("Error updating building system:", error);
    throw error;
  }
}

export async function initializeFacilityDatabase() {
  try {
    // Wait for Cosmos DB to be initialized
    if (!isCosmosInitialized()) {
      console.log("Waiting for Cosmos DB initialization...");
      await waitForCosmosInitialization();
    }

    console.log("Initializing building systems container...");
    await getBuildingSystemsContainer();

    // Initialize other containers as needed
    console.log("Facility database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize facility database:", error);
    throw error;
  }
}

// Initialize the database when the module loads
initializeFacilityDatabase().catch(console.error);

export async function getLatestPoolMaintenance(): Promise<PoolMaintenance | null> {
  try {
    const database = await import("./cosmos_service").then(module => module.database);
    const poolMaintenanceContainer = database.container('pool-maintenance');
    const querySpec = {
      query: "SELECT TOP 1 * FROM c ORDER BY c.createdAt DESC"
    };

    const { resources } = await poolMaintenanceContainer.items.query<PoolMaintenance>(querySpec).fetchAll();
    return resources[0] || null;
  } catch (error) {
    console.error("Failed to get latest pool maintenance:", error);
    throw error;
  }
}

export async function addPoolChemicalReading(reading: ChemicalReading): Promise<PoolMaintenance> {
  try {
    const database = await import("./cosmos_service").then(module => module.database);
    const poolMaintenanceContainer = database.container('pool-maintenance');
    const latest = await getLatestPoolMaintenance();
    const now = new Date().toISOString();

    if (latest) {
      const updated = {
        ...latest,
        readings: [...latest.readings, reading],
        updatedAt: now
      };

      const { resource } = await poolMaintenanceContainer.item(latest.id, latest.id).replace(updated);
      if (!resource) throw new Error("Failed to update pool maintenance");
      return resource;
    } else {
      const newRecord: PoolMaintenance = {
        id: uuidv4(),
        readings: [reading],
        lastCleaning: now,
        nextCleaning: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
        filterStatus: "clean",
        chemicalLevels: {
          chlorine: 0,
          pH: 7,
          alkalinity: 0,
          calcium: 0
        },
        notes: "",
        createdAt: now,
        updatedAt: now
      };

      const { resource } = await poolMaintenanceContainer.items.create(newRecord);
      if (!resource) throw new Error("Failed to create pool maintenance record");
      return resource;
    }
  } catch (error) {
    console.error("Failed to add pool chemical reading:", error);
    throw error;
  }
}


export async function getInspections(status?: Inspection["status"]): Promise<Inspection[]> {
  try {
    const database = await import("./cosmos_service").then(module => module.database);
    const inspectionContainer = database.container('inspections');
    const querySpec = {
      query: status
        ? "SELECT * FROM c WHERE c.status = @status ORDER BY c.dueDate ASC"
        : "SELECT * FROM c ORDER BY c.dueDate ASC",
      parameters: status ? [{ name: "@status", value: status }] : undefined
    };

    const { resources } = await inspectionContainer.items.query<Inspection>(querySpec).fetchAll();
    return resources;
  } catch (error) {
    console.error("Failed to get inspections:", error);
    throw error;
  }
}

export async function createInspection(inspection: Omit<Inspection, "id" | "createdAt" | "updatedAt">): Promise<Inspection> {
  try {
    const database = await import("./cosmos_service").then(module => module.database);
    const inspectionContainer = database.container('inspections');
    const now = new Date().toISOString();
    const newInspection = {
      id: uuidv4(),
      ...inspection,
      createdAt: now,
      updatedAt: now
    };

    const { resource } = await inspectionContainer.items.create(newInspection);
    if (!resource) throw new Error("Failed to create inspection");
    return resource;
  } catch (error) {
    console.error("Failed to create inspection:", error);
    throw error;
  }
}

export interface Inspection {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  status: 'pending' | 'completed' | 'overdue' | 'in-progress';
  assignedTo: string;
  dueDate: string;
  completedDate?: string;
  area: string;
  checklist: {
    item: string;
    status: 'pass' | 'fail' | 'na';
    notes?: string;
  }[];
  photos?: string[];
  issues?: {
    description: string;
    severity: 'low' | 'medium' | 'high';
    status: 'open' | 'in-progress' | 'resolved';
  }[];
  createdAt: string;
  updatedAt: string;
}