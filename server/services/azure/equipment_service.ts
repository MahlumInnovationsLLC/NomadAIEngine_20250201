import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from 'uuid';

if (!process.env.AZURE_COSMOS_CONNECTION_STRING) {
  throw new Error("Azure Cosmos DB connection string not found");
}

const client = new CosmosClient(process.env.AZURE_COSMOS_CONNECTION_STRING);
const database = client.database("GYMAIEngineDB");
const equipmentContainer = database.container("equipment");
const equipmentTypesContainer = database.container("equipment-types");

export interface EquipmentType {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  category: string;
  connectivityType?: string;
  maintenanceSchedule?: {
    frequency: number;
    unit: 'days' | 'weeks' | 'months';
  };
  specifications?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  equipmentTypeId: string;
  status: 'active' | 'maintenance' | 'inactive' | 'error';
  healthScore: number;
  deviceConnectionStatus?: 'connected' | 'disconnected' | 'error';
  deviceIdentifier?: string;
  deviceType?: string;
  maintenanceScore?: number;
  lastMaintenance?: string;
  nextMaintenance?: string;
  position?: { x: number; y: number };
  riskFactors?: unknown[];
  lastPredictionUpdate?: string;
  serialNumber?: string;
  modelNumber?: string;
  modelYear?: number;
  createdAt: string;
  updatedAt: string;
}

export async function initializeEquipmentDatabase() {
  try {
    // Create containers if they don't exist
    await database.containers.createIfNotExists({
      id: "equipment",
      partitionKey: { paths: ["/id"] }
    });

    await database.containers.createIfNotExists({
      id: "equipment-types",
      partitionKey: { paths: ["/id"] }
    });

    console.log("Equipment database containers initialized successfully");
  } catch (error) {
    console.error("Failed to initialize equipment database:", error);
    throw error;
  }
}

export async function getEquipmentType(manufacturer: string, model: string): Promise<EquipmentType | null> {
  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.manufacturer = @manufacturer AND c.model = @model",
      parameters: [
        { name: "@manufacturer", value: manufacturer },
        { name: "@model", value: model }
      ]
    };

    const { resources: types } = await equipmentTypesContainer.items
      .query<EquipmentType>(querySpec)
      .fetchAll();
    return types[0] || null;
  } catch (error) {
    console.error("Failed to get equipment type:", error);
    throw error;
  }
}

export async function createEquipmentType(type: Omit<EquipmentType, "id" | "createdAt" | "updatedAt">): Promise<EquipmentType> {
  try {
    const now = new Date().toISOString();
    const newType: EquipmentType = {
      id: uuidv4(),
      ...type,
      createdAt: now,
      updatedAt: now
    };

    const { resource } = await equipmentTypesContainer.items.create(newType);
    if (!resource) throw new Error("Failed to create equipment type in Cosmos DB");
    return resource;
  } catch (error) {
    console.error("Failed to create equipment type:", error);
    throw error;
  }
}

export async function getAllEquipment(): Promise<Equipment[]> {
  try {
    const querySpec = {
      query: "SELECT * FROM c ORDER BY c.createdAt DESC"
    };

    const { resources: equipment } = await equipmentContainer.items
      .query<Equipment>(querySpec)
      .fetchAll();
    return equipment;
  } catch (error) {
    console.error("Failed to get all equipment:", error);
    throw error;
  }
}

export async function createEquipment(equipment: Omit<Equipment, "id" | "createdAt" | "updatedAt">): Promise<Equipment> {
  try {
    const now = new Date().toISOString();
    const newEquipment: Equipment = {
      id: uuidv4(),
      ...equipment,
      status: equipment.status || 'inactive',
      healthScore: equipment.healthScore || 100,
      createdAt: now,
      updatedAt: now
    };

    const { resource } = await equipmentContainer.items.create(newEquipment);
    if (!resource) throw new Error("Failed to create equipment in Cosmos DB");
    return resource;
  } catch (error) {
    console.error("Failed to create equipment:", error);
    throw error;
  }
}

export async function updateEquipment(id: string, updates: Partial<Equipment>): Promise<Equipment> {
  try {
    const { resource: existingEquipment } = await equipmentContainer.item(id, id).read<Equipment>();
    if (!existingEquipment) throw new Error("Equipment not found");

    const updatedEquipment = {
      ...existingEquipment,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const { resource } = await equipmentContainer.item(id, id).replace(updatedEquipment);
    if (!resource) throw new Error("Failed to update equipment in Cosmos DB");
    return resource;
  } catch (error) {
    console.error("Failed to update equipment:", error);
    throw error;
  }
}

// Initialize the database when the module loads
initializeEquipmentDatabase().catch(console.error);