import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from 'uuid';
import { ProjectStatus } from "@/types/manufacturing";
import { startOfDay, parseISO } from "date-fns";

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
const bomContainer = database.container("boms");
const materialBatchContainer = database.container("material-batches");
const materialMovementContainer = database.container("material-movements");
const mrpCalculationsContainer = database.container("mrp-calculations");

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

  // Get current date in EST/EDT (America/New_York timezone)
  const today = new Date();
  const userDate = new Date(today.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const normalizedToday = startOfDay(userDate);

  console.log('Raw current date:', today);
  console.log('User timezone date:', userDate);
  console.log('Normalized date for comparison:', normalizedToday);

  const dates = {
    fabricationStart: project.fabricationStart ? startOfDay(parseISO(project.fabricationStart)) : null,
    assemblyStart: project.assemblyStart ? startOfDay(parseISO(project.assemblyStart)) : null,
    wrapGraphics: project.wrapGraphics ? startOfDay(parseISO(project.wrapGraphics)) : null,
    ntcTesting: project.ntcTesting ? startOfDay(parseISO(project.ntcTesting)) : null,
    qcStart: project.qcStart ? startOfDay(parseISO(project.qcStart)) : null,
    ship: project.ship ? startOfDay(parseISO(project.ship)) : null,
  };

  console.log('Project dates:', dates);

  // Compare only the date portions for shipping status
  if (dates.ship) {
    const shipDate = dates.ship.toISOString().split('T')[0];
    const todayDate = normalizedToday.toISOString().split('T')[0];

    console.log('Comparing dates - Today:', todayDate, 'Ship date:', shipDate);

    if (todayDate === shipDate) {
      console.log('Project is SHIPPING TODAY');
      return "SHIPPING";
    }

    if (todayDate > shipDate) {
      console.log('Project is COMPLETED');
      return "COMPLETED";
    }
  }

  // Rest of the status checks using normalized date comparisons
  if (dates.qcStart && normalizedToday >= dates.qcStart) {
    console.log('Project is IN_QC');
    return "IN_QC";
  }

  if (dates.ntcTesting && normalizedToday >= dates.ntcTesting) {
    console.log('Project is IN_NTC_TESTING');
    return "IN_NTC_TESTING";
  }

  if (dates.wrapGraphics && normalizedToday >= dates.wrapGraphics) {
    console.log('Project is IN_WRAP');
    return "IN_WRAP";
  }

  if (dates.assemblyStart && normalizedToday >= dates.assemblyStart) {
    console.log('Project is IN_ASSEMBLY');
    return "IN_ASSEMBLY";
  }

  if (dates.fabricationStart && normalizedToday >= dates.fabricationStart) {
    console.log('Project is IN_FAB');
    return "IN_FAB";
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
  team?: string;  // Team property
  teamName?: string; // TeamName property for the team name displayed in the UI
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
  type: 'in-process' | 'final-qc' | 'executive-review' | 'pdi';
  templateType?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  projectId?: string;
  projectNumber?: string;
  partNumber?: string;
  location?: string;
  department?: string;
  inspector: string;
  inspectionDate: string;
  productionLineId: string;
  productionTeam?: string;
  results: {
    defectsFound: any[];
    checklistItems?: any[];
    passedChecks: number;
    totalChecks: number;
    notes?: string;
  };
  attachments?: any[];
  createdAt: string;
  updatedAt: string;
}

// Utility function to fix partition key issues
async function fixQualityInspectionPartitionKey(id: string): Promise<boolean> {
  try {
    console.log(`[DEBUG] Checking if inspection ${id} needs partition key fixing`);
    
    try {
      // Try to get with "default" partition key (wrong way)
      const { resource: legacyItem } = await qualityInspectionContainer.item(id, "default").read();
      
      if (legacyItem) {
        console.log(`[DEBUG] Found inspection with 'default' partition key, migrating to correct partition key...`);
        
        // Delete the original with incorrect partition key
        await qualityInspectionContainer.item(id, "default").delete();
        
        // Create a new one with correct partition key and preserve important fields
        const newItem = {
          ...legacyItem,
          id: id, // ensure same ID
          // Explicitly preserve these fields
          projectNumber: legacyItem.projectNumber,
          projectId: legacyItem.projectId,
          location: legacyItem.location
        };
        
        console.log(`[DEBUG] Creating new item with preserved fields:`, JSON.stringify({
          projectNumber: newItem.projectNumber,
          projectId: newItem.projectId,
          location: newItem.location
        }, null, 2));
        
        await qualityInspectionContainer.items.create(newItem);
        
        console.log(`[DEBUG] Successfully migrated inspection with ID ${id} to correct partition key`);
        return true;
      }
    } catch (err) {
      // This is expected if the item doesn't have "default" partition key
      console.log(`[DEBUG] No need to fix partition key for ${id} - either already fixed or not found with 'default' key`);
    }
    
    return false;
  } catch (error) {
    console.error(`[DEBUG] Error fixing partition key for inspection ${id}:`, error);
    return false;
  }
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
    console.log(`[DEBUG] Attempting to update quality inspection with ID: ${id}`);
    console.log(`[DEBUG] Updates received:`, JSON.stringify(updates, null, 2));
    
    // Try to fix partition key issues before attempting to update
    const fixed = await fixQualityInspectionPartitionKey(id);
    if (fixed) {
      console.log(`[DEBUG] Successfully fixed partition key for inspection ${id}`);
    }
    
    try {
      // First try with id as partition key (correct way)
      console.log(`[DEBUG] Trying to read with ID as partition key`);
      const existing = await qualityInspectionContainer.item(id, id).read();
      
      if (!existing.resource) {
        console.log(`[DEBUG] Not found with ID as partition key, trying with 'default' partition key`);
        // Try with 'default' partition key (legacy way)
        const legacyExisting = await qualityInspectionContainer.item(id, 'default').read();
        
        if (!legacyExisting.resource) {
          throw new Error("Inspection not found with either partition key");
        }
        
        console.log(`[DEBUG] Found with 'default' partition key`);
        // Continue with the legacy approach
        const legacyResource = legacyExisting.resource as QualityInspection;
        const updated = {
          ...legacyResource,
          ...updates,
          // Explicitly ensure these fields are preserved from updates
          projectNumber: updates.projectNumber || legacyResource.projectNumber,
          projectId: updates.projectId || legacyResource.projectId,
          location: updates.location || legacyResource.location,
          productionLineId: updates.productionLineId || legacyResource.productionLineId,
          productionTeam: updates.productionTeam || legacyResource.productionTeam,
          updatedAt: new Date().toISOString()
        };
        
        console.log(`[DEBUG] About to replace with 'default' partition key. Updated data:`, JSON.stringify({
          projectNumber: updated.projectNumber,
          projectId: updated.projectId,
          location: updated.location,
          productionLineId: updated.productionLineId,
          productionTeam: updated.productionTeam
        }, null, 2));
        
        const { resource } = await qualityInspectionContainer.item(id, 'default').replace(updated);
        if (!resource) throw new Error("Failed to update quality inspection");
        
        console.log(`[DEBUG] Successfully updated with 'default' partition key`);
        
        // Since we found it with 'default', let's try to migrate it now
        try {
          console.log(`[DEBUG] Attempting to migrate from 'default' to correct partition key after update`);
          await fixQualityInspectionPartitionKey(id);
        } catch (migrationError) {
          console.error(`[DEBUG] Error during migration attempt:`, migrationError);
          // Continue with the process even if migration fails
        }
        
        return resource as QualityInspection;
      }
      
      console.log(`[DEBUG] Found with ID as partition key`);
      const existingResource = existing.resource as QualityInspection;
      
      // Ensure project-related fields are explicitly preserved
      const updated = {
        ...existingResource,
        ...updates,
        // Explicitly ensure these fields are preserved from updates
        projectNumber: updates.projectNumber || existingResource.projectNumber,
        projectId: updates.projectId || existingResource.projectId,
        location: updates.location || existingResource.location,
        productionLineId: updates.productionLineId || existingResource.productionLineId,
        productionTeam: updates.productionTeam || existingResource.productionTeam,
        updatedAt: new Date().toISOString()
      };
      
      console.log(`[DEBUG] About to replace with ID as partition key. Updated data:`, JSON.stringify({
        projectNumber: updated.projectNumber,
        projectId: updated.projectId,
        location: updated.location,
        productionLineId: updated.productionLineId,
        productionTeam: updated.productionTeam
      }, null, 2));
      
      const { resource } = await qualityInspectionContainer.item(id, id).replace(updated);
      if (!resource) throw new Error("Failed to update quality inspection");
      
      console.log(`[DEBUG] Successfully updated with ID as partition key`);
      return resource as QualityInspection;
    } catch (readError: any) { // Type assertion for the error
      console.error(`[DEBUG] Error during read operation:`, readError);
      
      // If we get here and can't find the inspection, let's create a new one as a last resort
      if (readError.code === 404 || (readError.message && readError.message.includes("not found"))) {
        console.log(`[DEBUG] Inspection not found at all, attempting to create a new one with the same ID`);
        
        const typedUpdates = updates as QualityInspection;
        // Only proceed if we have enough data to create a new inspection
        if (typedUpdates.type && typedUpdates.inspector && typedUpdates.inspectionDate) {
          const now = new Date().toISOString();
          const newInspection: QualityInspection = {
            ...typedUpdates,
            id: id,  // Use the same ID
            createdAt: now,
            updatedAt: now
          };
          
          console.log(`[DEBUG] Creating new inspection with data:`, JSON.stringify(newInspection, null, 2));
          const { resource: createdResource } = await qualityInspectionContainer.items.create(newInspection);
          
          if (createdResource) {
            console.log(`[DEBUG] Successfully created new inspection with the same ID`);
            return createdResource as QualityInspection;
          }
        } else {
          console.log(`[DEBUG] Not enough data to create a new inspection`);
        }
      }
      
      throw readError;
    }
  } catch (error) {
    console.error("Failed to update quality inspection:", error);
    throw error;
  }
}

// Add BOM Management Functions
export async function createOrUpdateBOM(bomData: any) {
  try {
    const now = new Date().toISOString();
    if (!bomData.id) {
      bomData.id = uuidv4();
      bomData.createdAt = now;
    }
    bomData.updatedAt = now;

    const { resource } = await bomContainer.items.upsert(bomData);
    return resource;
  } catch (error) {
    console.error("Failed to create/update BOM:", error);
    throw error;
  }
}

export async function getBOMByProject(projectId: string) {
  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.projectId = @projectId",
      parameters: [{ name: "@projectId", value: projectId }]
    };

    const { resources } = await bomContainer.items.query(querySpec).fetchAll();
    return resources;
  } catch (error) {
    console.error("Failed to get BOM by project:", error);
    throw error;
  }
}

// Add Material Batch Management Functions
export async function createMaterialBatch(batchData: any) {
  try {
    const now = new Date().toISOString();
    const newBatch = {
      id: uuidv4(),
      ...batchData,
      createdAt: now,
      updatedAt: now
    };

    const { resource } = await materialBatchContainer.items.create(newBatch);
    return resource;
  } catch (error) {
    console.error("Failed to create material batch:", error);
    throw error;
  }
}

export async function recordMaterialMovement(movementData: any) {
  try {
    const now = new Date().toISOString();
    const newMovement = {
      id: uuidv4(),
      ...movementData,
      timestamp: now
    };

    const { resource: movement } = await materialMovementContainer.items.create(newMovement);

    // Update the batch quantities
    const batch = await materialBatchContainer.item(movementData.batchId, movementData.batchId).read();
    if (batch.resource) {
      const updatedBatch = {
        ...batch.resource,
        remainingQuantity: movementData.type === 'issue'
          ? batch.resource.remainingQuantity - movementData.quantity
          : batch.resource.remainingQuantity + movementData.quantity,
        updatedAt: now
      };

      await materialBatchContainer.item(movementData.batchId, movementData.batchId).replace(updatedBatch);
    }

    return movement;
  } catch (error) {
    console.error("Failed to record material movement:", error);
    throw error;
  }
}

// Add MRP Functions
export async function calculateMRP(projectId: string) {
  try {
    // Get project BOM
    const boms = await getBOMByProject(projectId);
    if (!boms || boms.length === 0) {
      throw new Error("No BOM found for project");
    }

    const bom = boms[0];
    const now = new Date().toISOString();
    const mrpCalculations = [];

    // Calculate requirements for each component
    for (const component of bom.components) {
      const calculation = {
        id: uuidv4(),
        materialId: component.materialId,
        periodStart: now,
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        grossRequirement: component.quantity,
        scheduledReceipts: 0, // This should be fetched from purchase orders
        projectedAvailable: 0, // This should be calculated from inventory
        netRequirement: 0,
        plannedOrders: 0,
        safetyStock: component.safetyStock || 0,
        orderPoint: component.reorderPoint || 0,
        lotSize: component.lotSize || component.quantity,
        leadTime: component.leadTime || 0,
        source: 'project',
        sourceReference: projectId,
        createdAt: now,
        updatedAt: now
      };

      // Calculate net requirements
      calculation.netRequirement = Math.max(0,
        calculation.grossRequirement - calculation.scheduledReceipts - calculation.projectedAvailable
      );

      // Calculate planned orders
      calculation.plannedOrders = Math.ceil(calculation.netRequirement / calculation.lotSize) * calculation.lotSize;

      mrpCalculations.push(calculation);
    }

    // Save MRP calculations
    const savedCalculations = await Promise.all(
      mrpCalculations.map(calc => mrpCalculationsContainer.items.create(calc))
    );

    return savedCalculations.map(result => result.resource);
  } catch (error) {
    console.error("Failed to calculate MRP:", error);
    throw error;
  }
}

export async function initializeManufacturingDatabase() {
  try {
    console.log("Starting manufacturing database initialization...");

    const { database: dbResponse } = await client.databases.createIfNotExists({
      id: "NomadAIEngineDB"
    });
    console.log("Database verified/created:", dbResponse.id);

    // Create containers if they don't exist
    const containersToCreate = [
      { id: "production-lines", partitionKey: { paths: ["/id"] } },
      { id: "manufacturing-systems", partitionKey: { paths: ["/id"] } },
      { id: "maintenance-records", partitionKey: { paths: ["/id"] } },
      { id: "quality-inspections", partitionKey: { paths: ["/id"] } },
      { id: "manufacturing-projects", partitionKey: { paths: ["/id"] } },
      { id: "boms", partitionKey: { paths: ["/id"] } },
      { id: "material-batches", partitionKey: { paths: ["/id"] } },
      { id: "material-movements", partitionKey: { paths: ["/id"] } },
      { id: "mrp-calculations", partitionKey: { paths: ["/id"] } }
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

// Add getQualityTemplates function
export async function getQualityTemplates() {
  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'template'"
    };

    const { resources } = await qualityInspectionContainer.items.query(querySpec).fetchAll();
    return resources;
  } catch (error) {
    console.error("Failed to get quality templates:", error);
    throw error;
  }
}

export async function saveQualityTemplate(template: any) {
  try {
    const now = new Date().toISOString();
    const newTemplate = {
      ...template,
      type: 'template',
      createdAt: now,
      updatedAt: now
    };

    const { resource } = await qualityInspectionContainer.items.create(newTemplate);
    return resource;
  } catch (error) {
    console.error("Failed to save quality template:", error);
    throw error;
  }
}

export async function updateQualityTemplate(id: string, updates: any) {
  try {
    const { resource: existingTemplate } = await qualityInspectionContainer.item(id, id).read();
    if (!existingTemplate) {
      throw new Error('Template not found');
    }

    const updatedTemplate = {
      ...existingTemplate,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const { resource } = await qualityInspectionContainer.item(id, id).replace(updatedTemplate);
    return resource;
  } catch (error) {
    console.error("Failed to update quality template:", error);
    throw error;
  }
}

// Get production lines data for dropdown selection
export async function getProductionLines(): Promise<ProductionLine[]> {
  try {
    const querySpec = {
      query: "SELECT * FROM c"
    };

    const { resources } = await productionContainer.items.query<ProductionLine>(querySpec).fetchAll();
    
    console.log(`Retrieved ${resources.length} production lines`);
    
    // If we don't have any production lines, create some default ones
    if (resources.length === 0) {
      console.log("No production lines found, creating default production teams");
      
      const defaultLines = [
        {
          id: `line-${Date.now()}-1`,
          name: "Assembly Team",
          description: "Main assembly team for product finalization",
          type: "assembly",
          status: "operational",
          team: "Assembly",
          capacity: {
            planned: 8,
            actual: 7,
            unit: "hours"
          },
          metrics: [],
          buildStages: [],
          allocatedInventory: [],
          performance: {
            efficiency: 0.85,
            quality: 0.92,
            availability: 0.95,
            oee: 0.74
          },
          lastMaintenance: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          nextMaintenance: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
          notes: "Default assembly team",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `line-${Date.now()}-2`,
          name: "Electrical Team",
          description: "Electrical wiring and installation team",
          type: "assembly",
          status: "operational",
          team: "Electrical",
          capacity: {
            planned: 8,
            actual: 8,
            unit: "hours"
          },
          metrics: [],
          buildStages: [],
          allocatedInventory: [],
          performance: {
            efficiency: 0.82,
            quality: 0.95,
            availability: 0.92,
            oee: 0.71
          },
          lastMaintenance: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          nextMaintenance: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          notes: "Default electrical team",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `line-${Date.now()}-3`,
          name: "Paint Team",
          description: "Paint and finish team",
          type: "fabrication",
          status: "operational",
          team: "Paint",
          capacity: {
            planned: 8,
            actual: 6,
            unit: "hours"
          },
          metrics: [],
          buildStages: [],
          allocatedInventory: [],
          performance: {
            efficiency: 0.79,
            quality: 0.90,
            availability: 0.88,
            oee: 0.62
          },
          lastMaintenance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          nextMaintenance: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
          notes: "Default paint team",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `line-${Date.now()}-4`,
          name: "IT Team",
          description: "IT and networking team",
          type: "testing",
          status: "operational",
          team: "IT",
          capacity: {
            planned: 8,
            actual: 7,
            unit: "hours"
          },
          metrics: [],
          buildStages: [],
          allocatedInventory: [],
          performance: {
            efficiency: 0.88,
            quality: 0.96,
            availability: 0.90,
            oee: 0.76
          },
          lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          nextMaintenance: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
          notes: "Default IT team",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      // Create all default production lines
      for (const line of defaultLines) {
        await productionContainer.items.create(line);
      }
      
      // Fetch again after creating defaults
      const { resources: updatedResources } = await productionContainer.items.query<ProductionLine>(querySpec).fetchAll();
      return updatedResources;
    }
    
    return resources;
  } catch (error) {
    console.error("Failed to get production lines:", error);
    return [];
  }
}

// Initialize the database when the module loads
initializeManufacturingDatabase().catch(console.error);