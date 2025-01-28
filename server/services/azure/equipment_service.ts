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
  imageUrl?: string;
  imagePath?: string;
}

export interface EquipmentUsage {
  id: string;
  equipmentId: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  userId?: string;
  metrics: {
    avgLoad?: number;
    peakLoad?: number;
    restPeriods?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UsageAnalytics {
  dailyUsage: Array<{
    date: string;
    totalMinutes: number;
    sessions: number;
    peakHour: number;
    avgDuration: number;
  }>;
  weeklyTrends: Array<{
    week: string;
    totalMinutes: number;
    sessions: number;
    mostActiveDay: string;
  }>;
  timeOfDayDistribution: Array<{
    hour: number;
    sessions: number;
    avgDuration: number;
  }>;
  utilizationRate: number;
  averageSessionDuration: number;
}

export async function initializeEquipmentDatabase() {
  try {
    const { database } = await client.databases.createIfNotExists({
      id: "GYMAIEngineDB"
    });

    const { container: equipmentContainer } = await database.containers.createIfNotExists({
      id: "equipment",
      partitionKey: { paths: ["/id"] }
    });

    const { container: equipmentTypesContainer } = await database.containers.createIfNotExists({
      id: "equipment-types",
      partitionKey: { paths: ["/id"] }
    });

    const { container: equipmentUsageContainer } = await database.containers.createIfNotExists({
      id: "equipment-usage",
      partitionKey: { paths: ["/equipmentId"] }
    });

    console.log("Equipment database containers initialized successfully");
    return { equipmentContainer, equipmentTypesContainer, equipmentUsageContainer };
  } catch (error) {
    console.error("Failed to initialize equipment database:", error);
    throw error;
  }
}

export async function getEquipmentType(manufacturer: string, model: string): Promise<EquipmentType | null> {
  try {
    console.log(`Searching for equipment type - Manufacturer: ${manufacturer}, Model: ${model}`);
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

    console.log(`Found ${types.length} matching equipment types`);
    return types[0] || null;
  } catch (error) {
    console.error("Failed to get equipment type:", error);
    throw error;
  }
}

export async function createEquipmentType(type: Omit<EquipmentType, "id" | "createdAt" | "updatedAt">): Promise<EquipmentType> {
  try {
    console.log("Creating new equipment type:", type);
    const now = new Date().toISOString();
    const newType: EquipmentType = {
      id: uuidv4(),
      ...type,
      createdAt: now,
      updatedAt: now
    };

    console.log("Attempting to create equipment type in Cosmos DB:", newType);
    const { resource } = await equipmentTypesContainer.items.create(newType);

    if (!resource) {
      throw new Error("Failed to create equipment type - no resource returned from Cosmos DB");
    }

    console.log("Successfully created equipment type:", resource);
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
    if (!resource) {
      throw new Error("Failed to create equipment in Cosmos DB - no resource returned");
    }
    return resource;
  } catch (error) {
    console.error("Failed to create equipment:", error);
    throw error;
  }
}

export async function updateEquipment(id: string, updates: Partial<Equipment>): Promise<Equipment> {
  try {
    const { resource: existingEquipment } = await equipmentContainer.item(id, id).read<Equipment>();
    if (!existingEquipment) {
      throw new Error("Equipment not found");
    }

    const updatedEquipment = {
      ...existingEquipment,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const { resource } = await equipmentContainer.item(id, id).replace(updatedEquipment);
    if (!resource) {
      throw new Error("Failed to update equipment in Cosmos DB - no resource returned");
    }
    return resource;
  } catch (error) {
    console.error("Failed to update equipment:", error);
    throw error;
  }
}

export async function recordEquipmentUsage(usage: Omit<EquipmentUsage, "id" | "createdAt" | "updatedAt">): Promise<EquipmentUsage> {
  try {
    const now = new Date().toISOString();
    const newUsage: EquipmentUsage = {
      id: uuidv4(),
      ...usage,
      createdAt: now,
      updatedAt: now
    };

    const { resource } = await equipmentUsageContainer.items.create(newUsage);
    if (!resource) {
      throw new Error("Failed to record equipment usage - no resource returned");
    }
    return resource;
  } catch (error) {
    console.error("Failed to record equipment usage:", error);
    throw error;
  }
}

export async function getEquipmentUsageAnalytics(equipmentId: string, startDate: string, endDate: string): Promise<UsageAnalytics> {
  try {
    const querySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.equipmentId = @equipmentId 
        AND c.startTime >= @startDate 
        AND c.startTime <= @endDate
      `,
      parameters: [
        { name: "@equipmentId", value: equipmentId },
        { name: "@startDate", value: startDate },
        { name: "@endDate", value: endDate }
      ]
    };

    const { resources: usageRecords } = await equipmentUsageContainer.items
      .query<EquipmentUsage>(querySpec)
      .fetchAll();

    // Process usage records into analytics
    const analytics = processUsageRecords(usageRecords, startDate, endDate);
    return analytics;
  } catch (error) {
    console.error("Failed to get equipment usage analytics:", error);
    throw error;
  }
}

function processUsageRecords(records: EquipmentUsage[], startDate: string, endDate: string): UsageAnalytics {
  // Initialize analytics structure
  const analytics: UsageAnalytics = {
    dailyUsage: [],
    weeklyTrends: [],
    timeOfDayDistribution: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      sessions: 0,
      avgDuration: 0
    })),
    utilizationRate: 0,
    averageSessionDuration: 0
  };

  if (records.length === 0) {
    return analytics;
  }

  // Process daily usage
  const dailyMap = new Map<string, { minutes: number; sessions: number; durations: number[] }>();
  const weeklyMap = new Map<string, { minutes: number; sessions: number; dailySessions: Map<string, number> }>();
  const hourlyMap = new Map<number, { sessions: number; totalDuration: number }>();

  records.forEach(record => {
    const startTime = new Date(record.startTime);
    const date = startTime.toISOString().split('T')[0];
    const week = getWeekNumber(startTime);
    const hour = startTime.getHours();

    // Update daily stats
    const dayStats = dailyMap.get(date) || { minutes: 0, sessions: 0, durations: [] };
    dayStats.minutes += record.duration;
    dayStats.sessions++;
    dayStats.durations.push(record.duration);
    dailyMap.set(date, dayStats);

    // Update weekly stats
    const weekStats = weeklyMap.get(week) || { 
      minutes: 0, 
      sessions: 0, 
      dailySessions: new Map<string, number>() 
    };
    weekStats.minutes += record.duration;
    weekStats.sessions++;
    weekStats.dailySessions.set(
      date, 
      (weekStats.dailySessions.get(date) || 0) + 1
    );
    weeklyMap.set(week, weekStats);

    // Update hourly stats
    const hourStats = hourlyMap.get(hour) || { sessions: 0, totalDuration: 0 };
    hourStats.sessions++;
    hourStats.totalDuration += record.duration;
    hourlyMap.set(hour, hourStats);
  });

  // Convert maps to arrays and calculate additional metrics
  analytics.dailyUsage = Array.from(dailyMap.entries()).map(([date, stats]) => ({
    date,
    totalMinutes: stats.minutes,
    sessions: stats.sessions,
    peakHour: getPeakHour(records.filter(r => r.startTime.startsWith(date))),
    avgDuration: stats.minutes / stats.sessions
  }));

  analytics.weeklyTrends = Array.from(weeklyMap.entries()).map(([week, stats]) => ({
    week,
    totalMinutes: stats.minutes,
    sessions: stats.sessions,
    mostActiveDay: getMostActiveDay(stats.dailySessions)
  }));

  analytics.timeOfDayDistribution = Array.from(hourlyMap.entries())
    .map(([hour, stats]) => ({
      hour,
      sessions: stats.sessions,
      avgDuration: stats.totalDuration / stats.sessions
    }))
    .sort((a, b) => a.hour - b.hour);

  // Calculate overall metrics
  const totalMinutes = records.reduce((sum, r) => sum + r.duration, 0);
  const totalPossibleMinutes = calculateTotalPossibleMinutes(startDate, endDate);

  analytics.utilizationRate = (totalMinutes / totalPossibleMinutes) * 100;
  analytics.averageSessionDuration = totalMinutes / records.length;

  return analytics;
}

function getWeekNumber(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

function getPeakHour(dayRecords: EquipmentUsage[]): number {
  const hourCounts = new Map<number, number>();
  dayRecords.forEach(record => {
    const hour = new Date(record.startTime).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });
  return Array.from(hourCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
}

function getMostActiveDay(dailySessions: Map<string, number>): string {
  return Array.from(dailySessions.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

function calculateTotalPossibleMinutes(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return days * 24 * 60; // Assumes 24/7 availability
}

// Initialize the database when the module loads
initializeEquipmentDatabase().catch(console.error);


export async function uploadEquipmentImage(
  equipmentId: string,
  imageBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ url: string; path: string } | null> {
  try {
    console.log(`Uploading image for equipment ${equipmentId}`);
    const result = await uploadDocument(imageBuffer, fileName, {
      equipmentId,
      mimeType,
      type: 'equipment-image'
    });

    if (!result) {
      throw new Error('Failed to upload image to blob storage');
    }

    // Update equipment record with image URL
    const { resource: equipment } = await equipmentContainer.item(equipmentId, equipmentId).read();
    if (!equipment) {
      throw new Error('Equipment not found');
    }

    await equipmentContainer.item(equipmentId, equipmentId).replace({
      ...equipment,
      imageUrl: result.url,
      imagePath: result.path,
      updatedAt: new Date().toISOString()
    });

    return {
      url: result.url,
      path: result.path
    };
  } catch (error) {
    console.error('Error uploading equipment image:', error);
    throw error;
  }
}