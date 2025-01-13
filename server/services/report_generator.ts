import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export async function generateReport(content: string): Promise<string> {
  try {
    // Ensure uploads directory exists
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    const filename = `report-${uuidv4()}.txt`;
    const filePath = path.join(UPLOADS_DIR, filename);

    // Write report content to file
    await fs.writeFile(filePath, content, 'utf-8');

    return filename;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
}

import { db } from "@db";
import { equipment, equipmentTypes } from "@db/schema";
import { eq } from "drizzle-orm";

interface EquipmentReport {
  id: string;
  name: string;
  type?: string;
  status: string;
  healthScore: number;
  maintenanceInfo?: {
    lastMaintenance?: string;
    nextMaintenance?: string;
    maintenanceScore?: number;
  };
  deviceInfo?: {
    deviceType?: string;
    connectionStatus?: string;
    identifier?: string;
  };
}

export async function generateEquipmentReport(equipmentId?: string): Promise<string> {
  try {
    // Ensure uploads directory exists
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    let equipmentData;
    if (equipmentId) {
      // Get specific equipment
      const [item] = await db
        .select()
        .from(equipment)
        .where(eq(equipment.id, parseInt(equipmentId)))
        .limit(1);

      if (!item) {
        throw new Error(`Equipment with ID ${equipmentId} not found`);
      }
      equipmentData = [item];
    } else {
      // Get all equipment
      equipmentData = await db.select().from(equipment);
    }

    // Get all equipment types for reference
    const types = await db.select().from(equipmentTypes);
    const typeMap = new Map(types.map(t => [t.id, t]));

    // Format equipment data
    const reportData: EquipmentReport[] = equipmentData.map(e => ({
      id: e.id.toString(),
      name: e.name,
      type: e.equipmentTypeId ? typeMap.get(e.equipmentTypeId)?.name : undefined,
      status: e.status,
      healthScore: parseFloat(e.healthScore.toString()),
      maintenanceInfo: {
        lastMaintenance: e.lastMaintenance?.toISOString(),
        nextMaintenance: e.nextMaintenance?.toISOString(),
        maintenanceScore: e.maintenanceScore ? parseFloat(e.maintenanceScore.toString()) : undefined,
      },
      deviceInfo: {
        deviceType: e.deviceType,
        connectionStatus: e.deviceConnectionStatus,
        identifier: e.deviceIdentifier,
      },
    }));

    // Generate report content
    const content = generateReportContent(reportData);

    // Write report to file
    const filename = `equipment-report-${uuidv4()}.txt`;
    const filePath = path.join(UPLOADS_DIR, filename);
    await fs.writeFile(filePath, content, 'utf-8');

    return filename;
  } catch (error) {
    console.error('Error generating equipment report:', error);
    throw error;
  }
}

function generateReportContent(equipment: EquipmentReport[]): string {
  const timestamp = new Date().toISOString();
  let content = `Equipment Status Report\nGenerated: ${timestamp}\n\n`;

  equipment.forEach(e => {
    content += `Equipment ID: ${e.id}\n`;
    content += `Name: ${e.name}\n`;
    if (e.type) content += `Type: ${e.type}\n`;
    content += `Status: ${e.status}\n`;
    content += `Health Score: ${e.healthScore}%\n`;

    if (e.maintenanceInfo) {
      content += '\nMaintenance Information:\n';
      if (e.maintenanceInfo.lastMaintenance) {
        content += `Last Maintenance: ${e.maintenanceInfo.lastMaintenance}\n`;
      }
      if (e.maintenanceInfo.nextMaintenance) {
        content += `Next Maintenance: ${e.maintenanceInfo.nextMaintenance}\n`;
      }
      if (e.maintenanceInfo.maintenanceScore !== undefined) {
        content += `Maintenance Score: ${e.maintenanceInfo.maintenanceScore}%\n`;
      }
    }

    if (e.deviceInfo && (e.deviceInfo.deviceType || e.deviceInfo.connectionStatus)) {
      content += '\nDevice Information:\n';
      if (e.deviceInfo.deviceType) {
        content += `Device Type: ${e.deviceInfo.deviceType}\n`;
      }
      if (e.deviceInfo.connectionStatus) {
        content += `Connection Status: ${e.deviceInfo.connectionStatus}\n`;
      }
      if (e.deviceInfo.identifier) {
        content += `Device ID: ${e.deviceInfo.identifier}\n`;
      }
    }

    content += '\n---\n\n';
  });

  return content;
}