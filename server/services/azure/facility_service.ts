import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from 'uuid';

if (!process.env.AZURE_COSMOS_CONNECTION_STRING) {
  throw new Error("Azure Cosmos DB connection string not found");
}

const client = new CosmosClient(process.env.AZURE_COSMOS_CONNECTION_STRING);
const database = client.database("GYMAIEngineDB");
const facilityContainer = database.container("facility-maintenance");
const poolMaintenanceContainer = database.container("pool-maintenance");
const buildingSystemsContainer = database.container("building-systems");
const inspectionContainer = database.container("inspections");

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
  createdAt: string;
  updatedAt: string;
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

export async function initializeFacilityDatabase() {
  try {
    await database.containers.createIfNotExists({
      id: "facility-maintenance",
      partitionKey: { paths: ["/id"] }
    });

    await database.containers.createIfNotExists({
      id: "pool-maintenance",
      partitionKey: { paths: ["/id"] }
    });

    await database.containers.createIfNotExists({
      id: "building-systems",
      partitionKey: { paths: ["/id"] }
    });

    await database.containers.createIfNotExists({
      id: "inspections",
      partitionKey: { paths: ["/id"] }
    });

    console.log("Facility maintenance containers initialized successfully");
  } catch (error) {
    console.error("Failed to initialize facility maintenance database:", error);
    throw error;
  }
}

// Pool Maintenance Functions
export async function getLatestPoolMaintenance(): Promise<PoolMaintenance | null> {
  try {
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

// Building Systems Functions
export async function getBuildingSystems(): Promise<BuildingSystem[]> {
  try {
    // For testing purposes, return mock building systems
    const mockSystems: BuildingSystem[] = [
      {
        id: "mock-hvac-1",
        name: "Main HVAC System",
        type: "HVAC",
        status: "operational",
        lastInspection: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        nextInspection: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
        maintenanceHistory: [
          {
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            type: "routine",
            description: "Regular maintenance check",
            technician: "John Smith",
            cost: 250
          }
        ],
        location: "Building A - First Floor",
        installationDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        warranty: {
          provider: "HVAC Solutions Inc",
          expirationDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(),
          coverage: "Full parts and labor"
        },
        specifications: {
          model: "HAC-2000",
          capacity: "10 tons",
          efficiency: "SEER 16"
        },
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "mock-electrical-1",
        name: "Emergency Generator",
        type: "Electrical",
        status: "maintenance",
        lastInspection: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        nextInspection: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
        maintenanceHistory: [
          {
            date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            type: "repair",
            description: "Replaced fuel filter",
            technician: "Mike Johnson",
            cost: 450
          }
        ],
        location: "Building B - Basement",
        installationDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
        warranty: {
          provider: "PowerGen Corp",
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          coverage: "Limited warranty"
        },
        specifications: {
          model: "PG-5000",
          capacity: "500 kW",
          fuelType: "Diesel"
        },
        createdAt: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "mock-plumbing-1",
        name: "Water Treatment System",
        type: "Plumbing",
        status: "error",
        lastInspection: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        nextInspection: new Date(Date.now() + 0 * 24 * 60 * 60 * 1000).toISOString(),
        maintenanceHistory: [
          {
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            type: "emergency",
            description: "Filter system malfunction",
            technician: "Sarah Wilson",
            cost: 850
          }
        ],
        location: "Building A - Basement",
        installationDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        warranty: {
          provider: "AquaPure Systems",
          expirationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          coverage: "Parts only"
        },
        specifications: {
          model: "AP-2000",
          capacity: "1000 GPD",
          filterType: "Reverse Osmosis"
        },
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return mockSystems;
  } catch (error) {
    console.error("Failed to get building systems:", error);
    throw error;
  }
}

export async function addBuildingSystem(system: Omit<BuildingSystem, "id" | "createdAt" | "updatedAt">): Promise<BuildingSystem> {
  try {
    const now = new Date().toISOString();
    const newSystem = {
      id: uuidv4(),
      ...system,
      createdAt: now,
      updatedAt: now
    };

    const { resource } = await buildingSystemsContainer.items.create(newSystem);
    if (!resource) throw new Error("Failed to create building system");
    return resource;
  } catch (error) {
    console.error("Failed to add building system:", error);
    throw error;
  }
}

export async function updateBuildingSystem(id: string, updates: Partial<BuildingSystem>): Promise<BuildingSystem | null> {
  try {
    const { resource: existingSystem } = await buildingSystemsContainer.item(id, id).read();

    if (!existingSystem) {
      return null;
    }

    const updatedSystem = {
      ...existingSystem,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const { resource } = await buildingSystemsContainer.item(id, id).replace(updatedSystem);
    return resource || null;
  } catch (error) {
    console.error("Error updating building system:", error);
    throw error;
  }
}

// Inspection Functions
export async function getInspections(status?: Inspection["status"]): Promise<Inspection[]> {
  try {
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

// Initialize the database when the module loads
initializeFacilityDatabase().catch(console.error);