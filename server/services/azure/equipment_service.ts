import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from 'uuid';
import { uploadDocument } from '../blobStorage';

// Get the connection string from environment variables
const connectionString = process.env.AZURE_COSMOS_CONNECTION_STRING;
if (!connectionString) {
  throw new Error("Azure Cosmos DB connection string not found in environment variables");
}

// Initialize the Cosmos client and database/containers
const client = new CosmosClient(process.env.AZURE_COSMOS_CONNECTION_STRING || '');
const database = client.database("GYMAIEngineDB");
const equipmentContainer = database.container("equipment");
const equipmentTypesContainer = database.container("equipment-types");
const equipmentUsageContainer = database.container("equipment-usage");
const equipmentTelemetryContainer = database.container("equipment-telemetry");

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
  telemetrySchema?: {
    metrics: Array<{
      name: string;
      unit: string;
      normalRange?: { min: number; max: number };
    }>;
  };
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
  riskFactors?: string[];
  lastPredictionUpdate?: string;
  serialNumber?: string;
  modelNumber?: string;
  modelYear?: number;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  imagePath?: string;
  telemetryConfig?: {
    protocol: 'mqtt' | 'http' | 'modbus';
    endpoint?: string;
    authKey?: string;
    metrics: Array<{
      name: string;
      path: string;
      unit: string;
    }>;
  };
  lastTelemetryUpdate?: string;
  maintenanceHistory?: Array<{
    date: string;
    type: 'scheduled' | 'emergency' | 'preventive';
    description: string;
    technician?: string;
    parts?: Array<{ name: string; quantity: number }>;
  }>;
}

export interface EquipmentTelemetry {
  id: string;
  equipmentId: string;
  timestamp: string;
  metrics: Record<string, number>;
  alerts?: Array<{
    metric: string;
    value: number;
    threshold: number;
    severity: 'warning' | 'critical';
  }>;
}

// Initialize the database and containers when the module loads
export async function initializeEquipmentDatabase() {
  try {
    const { database } = await client.databases.createIfNotExists({
      id: "GYMAIEngineDB"
    });

    const containers = [
      { id: "equipment", partitionKey: "/id" },
      { id: "equipment-types", partitionKey: "/id" },
      { id: "equipment-usage", partitionKey: "/equipmentId" },
      { id: "equipment-telemetry", partitionKey: "/equipmentId" }
    ];

    for (const containerDef of containers) {
      await database.containers.createIfNotExists(containerDef);
    }

    console.log("Equipment database containers initialized successfully");
  } catch (error) {
    console.error("Failed to initialize equipment database:", error);
    throw error;
  }
}

// Add IoT device connection functions
export async function connectEquipmentToIoT(
  equipmentId: string, 
  deviceConfig: Equipment['telemetryConfig']
): Promise<Equipment> {
  try {
    const { resource: equipment } = await equipmentContainer.item(equipmentId, equipmentId).read<Equipment>();
    if (!equipment) {
      throw new Error("Equipment not found");
    }

    const updatedEquipment = {
      ...equipment,
      telemetryConfig: deviceConfig,
      deviceConnectionStatus: 'connected',
      updatedAt: new Date().toISOString()
    };

    const { resource } = await equipmentContainer.item(equipmentId, equipmentId).replace(updatedEquipment);
    if (!resource) {
      throw new Error("Failed to update equipment with IoT configuration");
    }

    return resource;
  } catch (error) {
    console.error("Failed to connect equipment to IoT:", error);
    throw error;
  }
}

export async function recordTelemetry(telemetry: Omit<EquipmentTelemetry, "id">): Promise<EquipmentTelemetry> {
  try {
    const newTelemetry: EquipmentTelemetry = {
      id: uuidv4(),
      ...telemetry,
    };

    const { resource } = await equipmentTelemetryContainer.items.create(newTelemetry);
    if (!resource) {
      throw new Error("Failed to record telemetry data");
    }

    // Update equipment's last telemetry update timestamp
    await equipmentContainer.item(telemetry.equipmentId, telemetry.equipmentId)
      .patch([{ op: "replace", path: "/lastTelemetryUpdate", value: telemetry.timestamp }]);

    return resource;
  } catch (error) {
    console.error("Failed to record telemetry:", error);
    throw error;
  }
}

// Export existing functions with minor updates.  This assumes equipment_service_original.ts exists and contains the original functions.
export {
  getEquipmentType,
  createEquipmentType,
  getAllEquipment,
  createEquipment,
  updateEquipment,
  recordEquipmentUsage,
  getEquipmentUsageAnalytics,
  uploadEquipmentImage
} from './equipment_service_original';


// Initialize the database when the module loads
initializeEquipmentDatabase().catch(console.error);