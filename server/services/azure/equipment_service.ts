import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from 'uuid';
import { db } from "@db";
import { equipment as equipmentTable, equipmentTypes } from "@db/schema";
import { eq, and } from "drizzle-orm";

let client: CosmosClient | null = null;
let database: any = null;
let equipmentContainer: any = null;

// Maximum retry attempts for database operations
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Initialize Cosmos DB if available, otherwise operate in PostgreSQL-only mode
export async function initializeEquipmentDatabase() {
  console.log("Starting equipment database initialization...");

  // Initialize PostgreSQL connection first
  try {
    // Test PostgreSQL connection
    await db.select().from(equipmentTable).limit(1);
    console.log("PostgreSQL connection successful");
  } catch (error) {
    console.error("Failed to connect to PostgreSQL:", error);
    throw new Error("PostgreSQL connection failed - database is required for equipment management");
  }

  // Try to initialize Cosmos DB if credentials are available
  if (process.env.AZURE_COSMOS_CONNECTION_STRING) {
    try {
      console.log("Attempting to connect to Cosmos DB...");
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

      console.log("✓ Cosmos DB initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Cosmos DB:", error);
      console.log("Operating in PostgreSQL-only mode");
      return false;
    }
  }
  console.log("No Cosmos DB connection string found, operating in PostgreSQL-only mode");
  return false;
}

// Utility function to handle database errors with retries
async function withRetry<T>(operation: () => Promise<T>, context: string): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`${context} failed (attempt ${attempt}/${MAX_RETRIES}):`, error);

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY * attempt;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Operation '${context}' failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

// Get equipment type by ID
export async function getEquipmentTypeById(id: number): Promise<EquipmentType | null> {
  return withRetry(async () => {
    const [type] = await db
      .select()
      .from(equipmentTypes)
      .where(eq(equipmentTypes.id, id))
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
  }, "Get equipment type");
}

// Get equipment type by manufacturer and model
export async function getEquipmentType(manufacturer: string, model: string): Promise<EquipmentType | null> {
  return withRetry(async () => {
    const [type] = await db
      .select()
      .from(equipmentTypes)
      .where(
        and(
          eq(equipmentTypes.manufacturer, manufacturer),
          eq(equipmentTypes.model, model)
        )
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
  }, "Get equipment type by manufacturer and model");
}

// Create new equipment type
export async function createEquipmentType(type: Omit<EquipmentType, "id">): Promise<EquipmentType> {
  return withRetry(async () => {
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
  }, "Create equipment type");
}

// Get all equipment
export async function getAllEquipment(): Promise<Equipment[]> {
  return withRetry(async () => {
    try {
      const pgEquipment = await db.query.equipment.findMany({
        orderBy: (equipment, { desc }) => [desc(equipment.createdAt)]
      });

      const mappedEquipment = pgEquipment.map(e => ({
        id: e.id.toString(),
        name: e.name,
        equipmentTypeId: e.equipmentTypeId?.toString() || null,
        status: e.status,
        healthScore: parseFloat(e.healthScore.toString()),
        deviceConnectionStatus: e.deviceConnectionStatus || undefined,
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

      // Sync to Cosmos DB if available
      if (client && equipmentContainer) {
        await Promise.all(mappedEquipment.map(equipment => 
          syncToCosmosDB(equipment).catch(console.error)
        ));
      }

      return mappedEquipment;
    } catch (error) {
      console.error("Failed to retrieve equipment from PostgreSQL:", error);

      // Try Cosmos DB as fallback if available
      if (client && equipmentContainer) {
        try {
          const { resources: equipment } = await equipmentContainer.items
            .query("SELECT * FROM c ORDER BY c._ts DESC")
            .fetchAll();
          return equipment;
        } catch (cosmosError) {
          console.error("Failed to retrieve equipment from Cosmos DB:", cosmosError);
        }
      }
      throw new Error("Failed to retrieve equipment data from all available sources");
    }
  }, "Get all equipment");
}

// Sync data to Cosmos DB
async function syncToCosmosDB(equipment: Equipment): Promise<void> {
  if (!client || !equipmentContainer) return;

  try {
    const cosmosEquipment = {
      ...equipment,
      _ts: Date.now(),
      partitionKey: equipment.id
    };

    await equipmentContainer.items.upsert(cosmosEquipment);
    console.log(`✓ Synced equipment ${equipment.id} to Cosmos DB`);
  } catch (error) {
    console.error("Failed to sync with Cosmos DB:", error);
    // Don't throw - we don't want to fail the operation if sync fails
  }
}

// Get equipment by ID with retries
export async function getEquipmentById(id: string): Promise<Equipment | null> {
  return withRetry(async () => {
    const [equipment] = await db
      .select()
      .from(equipmentTable)
      .where(eq(equipmentTable.id, parseInt(id)))
      .limit(1);

    if (!equipment) return null;

    return {
      id: equipment.id.toString(),
      name: equipment.name,
      equipmentTypeId: equipment.equipmentTypeId?.toString() || null,
      status: equipment.status,
      healthScore: parseFloat(equipment.healthScore.toString()),
      deviceConnectionStatus: equipment.deviceConnectionStatus || undefined,
      deviceIdentifier: equipment.deviceIdentifier || undefined,
      deviceType: equipment.deviceType || undefined,
      maintenanceScore: equipment.maintenanceScore ? parseFloat(equipment.maintenanceScore.toString()) : undefined,
      lastMaintenance: equipment.lastMaintenance?.toISOString(),
      nextMaintenance: equipment.nextMaintenance?.toISOString(),
      position: equipment.position as { x: number; y: number } | undefined,
      riskFactors: equipment.riskFactors as unknown[],
      lastPredictionUpdate: equipment.lastPredictionUpdate?.toISOString(),
      serialNumber: equipment.serialNumber || undefined,
      modelNumber: equipment.modelNumber || undefined,
      modelYear: equipment.modelYear || undefined,
      createdAt: equipment.createdAt.toISOString(),
      updatedAt: equipment.updatedAt.toISOString()
    };
  }, "Get equipment by ID");
}

// Create new equipment with retries
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
      throw error;
    }
  }, "Create equipment");
}

// Update equipment with retries
export async function updateEquipment(id: string, updates: Partial<Equipment>): Promise<Equipment> {
  return withRetry(async () => {
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

      if (!pgEquipment) {
        throw new Error(`Equipment with ID ${id} not found`);
      }

      const updatedEquipment = {
        id: pgEquipment.id.toString(),
        name: pgEquipment.name,
        equipmentTypeId: pgEquipment.equipmentTypeId?.toString() || null,
        status: pgEquipment.status,
        healthScore: parseFloat(pgEquipment.healthScore.toString()),
        deviceConnectionStatus: pgEquipment.deviceConnectionStatus || undefined,
        deviceIdentifier: pgEquipment.deviceIdentifier || undefined,
        deviceType: pgEquipment.deviceType || undefined,
        maintenanceScore: pgEquipment.maintenanceScore ? parseFloat(pgEquipment.maintenanceScore.toString()) : undefined,
        lastMaintenance: pgEquipment.lastMaintenance?.toISOString(),
        nextMaintenance: pgEquipment.nextMaintenance?.toISOString(),
        position: pgEquipment.position as { x: number; y: number } | undefined,
        riskFactors: pgEquipment.riskFactors as unknown[],
        lastPredictionUpdate: pgEquipment.lastPredictionUpdate?.toISOString(),
        serialNumber: pgEquipment.serialNumber || undefined,
        modelNumber: pgEquipment.modelNumber || undefined,
        modelYear: pgEquipment.modelYear || undefined,
        createdAt: pgEquipment.createdAt.toISOString(),
        updatedAt: pgEquipment.updatedAt.toISOString()
      };

      // Sync to Cosmos DB
      await syncToCosmosDB(updatedEquipment);

      return updatedEquipment;
    } catch (error) {
      console.error("Failed to update equipment:", error);
      throw error;
    }
  }, "Update equipment");
}

// Types
export interface Equipment {
  id: string;
  name: string;
  equipmentTypeId?: string | null;
  status: string;
  healthScore: number;
  deviceConnectionStatus?: string;
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

// Initialize database connections when module loads
initializeEquipmentDatabase().catch(console.error);