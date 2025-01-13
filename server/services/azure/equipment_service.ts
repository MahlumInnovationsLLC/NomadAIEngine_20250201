import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from 'uuid';
import { db } from "@db";
import { equipment as equipmentTable, equipmentTypes } from "@db/schema";
import { eq } from "drizzle-orm";

let client: CosmosClient | null = null;
let database: any = null;
let equipmentContainer: any = null;

// Maximum retry attempts for database operations
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Initialize Cosmos DB if available, otherwise operate in PostgreSQL-only mode
export async function initializeEquipmentDatabase() {
  if (process.env.AZURE_COSMOS_CONNECTION_STRING) {
    try {
      client = new CosmosClient(process.env.AZURE_COSMOS_CONNECTION_STRING);
      database = client.database("GYMAIEngineDB");
      equipmentContainer = database.container("equipment");

      await database.containers.createIfNotExists({
        id: "equipment",
        partitionKey: { paths: ["/id"] },
        indexingPolicy: {
          indexingMode: "consistent",
          automatic: true,
          includedPaths: [{ path: "/*" }],
        }
      });

      console.log("Cosmos DB initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Cosmos DB:", error);
      return false;
    }
  }
  console.log("No Cosmos DB connection string found, operating in PostgreSQL-only mode");
  return false;
}

export interface Equipment {
  id: string;
  name: string;
  equipmentTypeId?: string | null;
  status: string;
  healthScore: number;
  deviceConnectionStatus?: string | null;
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

export interface EquipmentType {
  id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  category: string;
  connectivityType: string;
}

// Utility function to add retry logic
async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES) {
        console.log(`Retry attempt ${attempt} after error:`, error);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      }
    }
  }

  throw lastError;
}

// Synchronize data between PostgreSQL and Cosmos DB
async function syncToCosmosDB(equipment: Equipment): Promise<void> {
  if (!client || !equipmentContainer) return;

  try {
    const cosmosEquipment = {
      ...equipment,
      _ts: Date.now(),
      partitionKey: equipment.id
    };

    await equipmentContainer.items.upsert(cosmosEquipment);
  } catch (error) {
    console.error("Failed to sync with Cosmos DB:", error);
    // Don't throw - we don't want to fail the operation if sync fails
  }
}

// Get equipment type by manufacturer and model
export async function getEquipmentType(manufacturer: string, model: string): Promise<EquipmentType | null> {
  try {
    const [type] = await db
      .select()
      .from(equipmentTypes)
      .where(
        eq(equipmentTypes.manufacturer, manufacturer) && 
        eq(equipmentTypes.model, model)
      )
      .limit(1);

    if (!type) return null;

    return {
      id: type.id.toString(),
      name: type.name,
      manufacturer: type.manufacturer || undefined,
      model: type.model || undefined,
      category: type.category,
      connectivityType: type.connectivityType,
    };
  } catch (error) {
    console.error("Error getting equipment type:", error);
    return null;
  }
}

// Create new equipment type
export async function createEquipmentType(type: Omit<EquipmentType, "id">): Promise<EquipmentType> {
  const [newType] = await db
    .insert(equipmentTypes)
    .values({
      name: type.name,
      manufacturer: type.manufacturer,
      model: type.model,
      category: type.category,
      connectivityType: type.connectivityType,
    })
    .returning();

  return {
    id: newType.id.toString(),
    name: newType.name,
    manufacturer: newType.manufacturer || undefined,
    model: newType.model || undefined,
    category: newType.category,
    connectivityType: newType.connectivityType,
  };
}

export async function getAllEquipment(): Promise<Equipment[]> {
  return withRetry(async () => {
    // Try PostgreSQL first as it's our primary storage
    try {
      const pgEquipment = await db.query.equipment.findMany({
        orderBy: (equipment, { desc }) => [desc(equipment.createdAt)]
      });

      const mappedEquipment = pgEquipment.map(e => ({
        id: e.id.toString(),
        name: e.name,
        equipmentTypeId: e.equipmentTypeId?.toString() || null,
        status: e.status,
        healthScore: parseFloat(e.healthScore?.toString() || "0"),
        deviceConnectionStatus: e.deviceConnectionStatus,
        deviceIdentifier: e.deviceIdentifier || undefined,
        deviceType: e.deviceType || undefined,
        maintenanceScore: e.maintenanceScore ? parseFloat(e.maintenanceScore.toString()) : undefined,
        lastMaintenance: e.lastMaintenance?.toISOString(),
        nextMaintenance: e.nextMaintenance?.toISOString(),
        position: e.position as { x: number; y: number } | undefined,
        riskFactors: e.riskFactors as unknown[],
        lastPredictionUpdate: e.lastPredictionUpdate?.toISOString(),
        serialNumber: e.serialNumber || undefined,
        modelNumber: e.modelNumber || undefined,
        modelYear: e.modelYear || undefined,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString()
      }));

      // If PostgreSQL is successful, ensure Cosmos DB is in sync
      if (client && equipmentContainer) {
        mappedEquipment.forEach(async (equipment) => {
          await syncToCosmosDB(equipment).catch(console.error);
        });
      }

      return mappedEquipment;
    } catch (error) {
      console.error("Failed to retrieve equipment from PostgreSQL:", error);

      // Try Cosmos DB as fallback if available
      if (client && equipmentContainer) {
        try {
          const { resources: equipment } = await equipmentContainer.items
            .query("SELECT * FROM c ORDER BY c.createdAt DESC")
            .fetchAll();
          return equipment;
        } catch (cosmosError) {
          console.error("Failed to retrieve equipment from Cosmos DB:", cosmosError);
        }
      }
      throw new Error("Failed to retrieve equipment data from all available sources");
    }
  });
}

export async function createEquipment(equipment: Omit<Equipment, "id" | "createdAt" | "updatedAt">): Promise<Equipment> {
  return withRetry(async () => {
    const now = new Date().toISOString();
    const newEquipment = {
      ...equipment,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };

    // Validate required fields
    if (!newEquipment.name || !newEquipment.status || newEquipment.healthScore === undefined) {
      throw new Error("Missing required fields: name, status, or healthScore");
    }

    // Save to PostgreSQL first (primary storage)
    try {
      const [pgEquipment] = await db.insert(equipmentTable).values({
        name: newEquipment.name,
        equipmentTypeId: newEquipment.equipmentTypeId ? parseInt(newEquipment.equipmentTypeId) : null,
        status: newEquipment.status as any,
        healthScore: newEquipment.healthScore.toString(),
        deviceConnectionStatus: newEquipment.deviceConnectionStatus as any,
        deviceIdentifier: newEquipment.deviceIdentifier,
        deviceType: newEquipment.deviceType,
        position: newEquipment.position,
        serialNumber: newEquipment.serialNumber,
        modelNumber: newEquipment.modelNumber,
        modelYear: newEquipment.modelYear,
        maintenanceScore: newEquipment.maintenanceScore?.toString(),
        riskFactors: newEquipment.riskFactors,
        lastPredictionUpdate: newEquipment.lastPredictionUpdate ? new Date(newEquipment.lastPredictionUpdate) : null,
        lastMaintenance: newEquipment.lastMaintenance ? new Date(newEquipment.lastMaintenance) : null,
        nextMaintenance: newEquipment.nextMaintenance ? new Date(newEquipment.nextMaintenance) : null,
      }).returning();

      const createdEquipment = {
        ...newEquipment,
        id: pgEquipment.id.toString()
      };

      // Sync to Cosmos DB
      await syncToCosmosDB(createdEquipment);

      return createdEquipment;
    } catch (error) {
      console.error("Failed to create equipment:", error);
      throw new Error("Failed to create equipment in database");
    }
  });
}

export async function updateEquipment(id: string, updates: Partial<Equipment>): Promise<Equipment> {
  return withRetry(async () => {
    // Update PostgreSQL first (primary storage)
    try {
      const [pgEquipment] = await db.update(equipmentTable)
        .set({
          name: updates.name,
          equipmentTypeId: updates.equipmentTypeId ? parseInt(updates.equipmentTypeId) : undefined,
          status: updates.status as any,
          healthScore: updates.healthScore?.toString(),
          deviceConnectionStatus: updates.deviceConnectionStatus as any,
          deviceIdentifier: updates.deviceIdentifier,
          deviceType: updates.deviceType,
          position: updates.position,
          serialNumber: updates.serialNumber,
          modelNumber: updates.modelNumber,
          modelYear: updates.modelYear,
          maintenanceScore: updates.maintenanceScore?.toString(),
          riskFactors: updates.riskFactors,
          lastPredictionUpdate: updates.lastPredictionUpdate ? new Date(updates.lastPredictionUpdate) : undefined,
          lastMaintenance: updates.lastMaintenance ? new Date(updates.lastMaintenance) : undefined,
          nextMaintenance: updates.nextMaintenance ? new Date(updates.nextMaintenance) : undefined,
          updatedAt: new Date()
        })
        .where(eq(equipmentTable.id, parseInt(id)))
        .returning();

      const updatedEquipment = {
        ...updates,
        id: pgEquipment.id.toString(),
        createdAt: pgEquipment.createdAt.toISOString(),
        updatedAt: pgEquipment.updatedAt.toISOString()
      } as Equipment;

      // Sync to Cosmos DB
      await syncToCosmosDB(updatedEquipment);

      return updatedEquipment;
    } catch (error) {
      console.error("Failed to update equipment:", error);
      throw new Error("Failed to update equipment in database");
    }
  });
}

// Initialize Cosmos DB connection when module loads
initializeEquipmentDatabase().catch(console.error);