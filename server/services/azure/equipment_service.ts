import { db } from "@db";
import { equipment as equipmentTable, equipmentTypes } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import { BlobServiceClient } from "@azure/storage-blob";

// Maximum retry attempts for database operations
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

let blobServiceClient: BlobServiceClient | null = null;
let containerClient: any = null;

// Initialize database and blob storage if available
export async function initializeEquipmentDatabase() {
  console.log("Starting equipment database initialization...");

  // Initialize PostgreSQL connection first
  try {
    console.log("Testing PostgreSQL connection...");

    // Verify schema exists using raw SQL
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'equipment'
      );
    `);

    if (!result.rows?.[0]?.exists) {
      console.error("Equipment table does not exist in the database");
      throw new Error("Database schema not initialized - equipment table missing");
    }

    // Test equipment table access
    await db.select().from(equipmentTable).limit(1);
    console.log("✓ PostgreSQL connection and schema verification successful");
  } catch (error) {
    console.error("Failed to connect to PostgreSQL:", error);
    throw new Error("PostgreSQL connection failed - database is required for equipment management");
  }

  // Try to initialize Azure Blob Storage if connection string is available
  if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Attempting to connect to Azure Blob Storage (attempt ${attempt}/${MAX_RETRIES})...`);
        blobServiceClient = BlobServiceClient.fromConnectionString(
          process.env.AZURE_STORAGE_CONNECTION_STRING
        );

        // Create container if it doesn't exist
        containerClient = blobServiceClient.getContainerClient("equipment-backups");
        await containerClient.createIfNotExists({
          access: 'container' // This makes the container public
        });

        console.log("✓ Azure Blob Storage initialized successfully");
        return true;
      } catch (error) {
        console.error(`Failed to initialize Azure Blob Storage (attempt ${attempt}/${MAX_RETRIES}):`, error);

        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY * attempt;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.log("Operating in PostgreSQL-only mode");
          return false;
        }
      }
    }
  }
  console.log("No Azure Storage connection string found, operating in PostgreSQL-only mode");
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

// Backup data to Azure Blob Storage
async function backupToBlob(data: any, blobName: string): Promise<void> {
  if (!containerClient) return;

  try {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const content = JSON.stringify(data, null, 2); // Pretty print JSON
    await blockBlobClient.upload(content, content.length);
    console.log(`✓ Backed up ${blobName} to Azure Blob Storage`);
  } catch (error) {
    console.error("Failed to backup to Azure Blob Storage:", error);
    // Don't throw - we don't want to fail the operation if backup fails
  }
}

// Get all equipment
export async function getAllEquipment(): Promise<Equipment[]> {
  return withRetry(async () => {
    console.log("Fetching all equipment from database...");
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

    // Backup to blob storage if available
    if (containerClient) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await backupToBlob(mappedEquipment, `equipment-list-${timestamp}.json`);
    }

    return mappedEquipment;
  }, "Get all equipment");
}

// Get equipment by ID with retries
export async function getEquipmentById(id: string): Promise<Equipment | null> {
  return withRetry(async () => {
    console.log(`Fetching equipment with ID ${id}...`);
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
    try {
      console.log("Creating new equipment:", equipment.name);
      const [pgEquipment] = await db.insert(equipmentTable).values({
        name: equipment.name,
        equipmentTypeId: equipment.equipmentTypeId ? parseInt(equipment.equipmentTypeId) : null,
        status: equipment.status as any,
        healthScore: equipment.healthScore.toString(),
        deviceConnectionStatus: equipment.deviceConnectionStatus as any,
        deviceIdentifier: equipment.deviceIdentifier,
        deviceType: equipment.deviceType,
        position: equipment.position,
        serialNumber: equipment.serialNumber,
        modelNumber: equipment.modelNumber,
        modelYear: equipment.modelYear,
        maintenanceScore: equipment.maintenanceScore?.toString(),
        riskFactors: equipment.riskFactors,
        lastPredictionUpdate: equipment.lastPredictionUpdate ? new Date(equipment.lastPredictionUpdate) : null,
        lastMaintenance: equipment.lastMaintenance ? new Date(equipment.lastMaintenance) : null,
        nextMaintenance: equipment.nextMaintenance ? new Date(equipment.nextMaintenance) : null,
      }).returning();

      const createdEquipment = {
        ...equipment,
        id: pgEquipment.id.toString(),
        createdAt: pgEquipment.createdAt.toISOString(),
        updatedAt: pgEquipment.updatedAt.toISOString()
      };

      // Backup to blob storage if available
      if (containerClient) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await backupToBlob(createdEquipment, `equipment-${createdEquipment.id}-${timestamp}.json`);
      }

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
      console.log(`Updating equipment ${id}...`);
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

      // Backup to blob storage if available
      if (containerClient) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await backupToBlob(updatedEquipment, `equipment-${id}-${timestamp}.json`);
      }

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

// Initialize database connections when module loads
console.log("Initializing equipment service...");
initializeEquipmentDatabase().catch(error => {
  console.error("Failed to initialize equipment database:", error);
  process.exit(1);
});