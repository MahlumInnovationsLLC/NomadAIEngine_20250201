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
const partChangeContainer = database.container("part-changes");
const workloadCenterContainer = database.container("workload-centers");
const componentTraceabilityContainer = database.container("component-traceability");

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
    console.log('Project is IN QC');
    return "IN QC";
  }

  if (dates.ntcTesting && normalizedToday >= dates.ntcTesting) {
    console.log('Project is IN NTC TESTING');
    return "IN NTC TESTING";
  }

  if (dates.wrapGraphics && normalizedToday >= dates.wrapGraphics) {
    console.log('Project is IN WRAP');
    return "IN WRAP";
  }

  if (dates.assemblyStart && normalizedToday >= dates.assemblyStart) {
    console.log('Project is IN ASSEMBLY');
    return "IN ASSEMBLY";
  }

  if (dates.fabricationStart && normalizedToday >= dates.fabricationStart) {
    console.log('Project is IN FAB');
    return "IN FAB";
  }

  console.log('Project is NOT STARTED');
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
  inspectionDate: string;
  inspector: string;
  productionLineId: string;
  results: any; // Replace 'any' with a more specific type if needed
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
    const existing = await qualityInspectionContainer.item(id, id).read();
    if (!existing.resource) throw new Error("Inspection not found");

    const updated = {
      ...existing.resource,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const { resource } = await qualityInspectionContainer.item(id, id).replace(updated);
    if (!resource) throw new Error("Failed to update quality inspection");
    return resource;
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
      { id: "mrp-calculations", partitionKey: { paths: ["/id"] } },
      { id: "part-changes", partitionKey: { paths: ["/id"] } },
      { id: "workload-centers", partitionKey: { paths: ["/id"] } },
      { id: "component-traceability", partitionKey: { paths: ["/id"] } }
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

// Add these interfaces at the top with other interfaces
interface PartChange {
  id: string;
  projectId: string;
  componentId: string;
  changeType: 'add' | 'replace';
  scannedCode: string;
  notes?: string;
  performedBy: string;
  timestamp: string;
}

interface WorkloadCenter {
  id: string;
  code: string; // A, B, C, etc.
  name: string;
  description: string;
  status: 'active' | 'maintenance' | 'offline';
  currentLoad: number;
  maxCapacity: number;
  activeProjects: string[];
  componentTracking: {
    installedComponents: string[];
    pendingReplacements: string[];
    pendingInstallations: string[];
  };
  routingOrder: number;
  previousSection?: string;
  nextSection?: string;
}

interface ComponentTraceability {
  id: string;
  componentId: string;
  workloadCenterId: string;
  projectId: string;
  installationDate: string;
  installedBy: string;
  status: 'installed' | 'pending_replacement' | 'replaced';
  replacementHistory: {
    date: string;
    performedBy: string;
    reason: string;
    newComponentId: string;
  }[];
}

interface ComponentInstallation {
  id: string;
  componentId: string;
  workloadCenterId: string;
  projectId: string;
  installedBy: string;
  installationDate: string;
  verifiedBy?: string;
  verificationDate?: string;
  signOffStatus: 'pending' | 'installed' | 'verified';
  notes?: string;
  sectionOrder: number;
}

// Add these functions with other exported functions
export async function recordPartChange(changeData: Omit<PartChange, 'id' | 'timestamp'>): Promise<PartChange> {
  try {
    const now = new Date().toISOString();
    const newChange: PartChange = {
      id: uuidv4(),
      ...changeData,
      timestamp: now
    };

    const { resource } = await partChangeContainer.items.create(newChange);
    if (!resource) throw new Error("Failed to record part change");

    // Update the component in BOM if it's a replacement
    if (changeData.changeType === 'replace') {
      const boms = await getBOMByProject(changeData.projectId);
      if (boms && boms.length > 0) {
        const bom = boms[0];
        const component = bom.components.find(c => c.materialId === changeData.componentId);

        if (component) {
          // Add to revision history.  Assuming component has a revisionHistory array
          if (!component.revisionHistory) component.revisionHistory = [];

          component.revisionHistory.push({
            revisionNumber: (component.revisionHistory.length + 1).toString(),
            effectiveDate: now,
            changes: [`Component replaced. Scanned code: ${changeData.scannedCode}`],
            approvalStatus: 'approved',
            approvedBy: changeData.performedBy,
            approvalDate: now,
            notes: changeData.notes
          });

          // Update BOM
          await createOrUpdateBOM({
            ...bom,
            components: bom.components.map(c =>
              c.materialId === changeData.componentId ? component : c
            )
          });
        }
      }
    }

    return resource;
  } catch (error) {
    console.error("Failed to record part change:", error);
    throw error;
  }
}

export async function getPartChangeHistory(projectId: string): Promise<PartChange[]> {
  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.projectId = @projectId ORDER BY c.timestamp DESC",
      parameters: [{ name: "@projectId", value: projectId }]
    };

    const { resources } = await partChangeContainer.items.query<PartChange>(querySpec).fetchAll();
    return resources;
  } catch (error) {
    console.error("Failed to get part change history:", error);
    throw error;
  }
}

export async function createWorkloadCenter(center: Omit<WorkloadCenter, 'id'>): Promise<WorkloadCenter> {
  try {
    const newCenter: WorkloadCenter = {
      id: uuidv4(),
      ...center,
      activeProjects: [],
      componentTracking: {
        installedComponents: [],
        pendingReplacements: [],
        pendingInstallations: []
      }
    };

    const { resource } = await workloadCenterContainer.items.create(newCenter);
    if (!resource) throw new Error("Failed to create workload center");
    return resource;
  } catch (error) {
    console.error("Failed to create workload center:", error);
    throw error;
  }
}

export async function getWorkloadCenters(): Promise<WorkloadCenter[]> {
  try {
    const { resources } = await workloadCenterContainer.items.readAll().fetchAll();
    return resources;
  } catch (error) {
    console.error("Failed to get workload centers:", error);
    throw error;
  }
}

export async function assignComponentToWorkloadCenter(data: {
  componentId: string;
  workloadCenterId: string;
  projectId: string;
  installedBy: string;
}): Promise<ComponentTraceability> {
  try {
    const now = new Date().toISOString();
    const traceabilityRecord: ComponentTraceability = {
      id: uuidv4(),
      ...data,
      installationDate: now,
      status: 'installed',
      replacementHistory: []
    };

    const { resource } = await componentTraceabilityContainer.items.create(traceabilityRecord);
    if (!resource) throw new Error("Failed to create traceability record");

    // Update workload center tracking
    const { resource: center } = await workloadCenterContainer.item(data.workloadCenterId, data.workloadCenterId).read();
    if (center) {
      center.componentTracking.installedComponents.push(data.componentId);
      await workloadCenterContainer.item(data.workloadCenterId, data.workloadCenterId).replace(center);
    }

    return resource;
  } catch (error) {
    console.error("Failed to assign component to workload center:", error);
    throw error;
  }
}

export async function getComponentTraceability(componentId: string): Promise<ComponentTraceability[]> {
  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.componentId = @componentId ORDER BY c.installationDate DESC",
      parameters: [{ name: "@componentId", value: componentId }]
    };

    const { resources } = await componentTraceabilityContainer.items.query<ComponentTraceability>(querySpec).fetchAll();
    return resources;
  } catch (error) {
    console.error("Failed to get component traceability:", error);
    throw error;
  }
}

// Add new functions for component routing and installation tracking
export async function assignComponentToSection(data: {
  componentId: string;
  workloadCenterId: string;
  projectId: string;
  sectionOrder: number;
}): Promise<void> {
  try {
    const { resource: center } = await workloadCenterContainer.item(data.workloadCenterId, data.workloadCenterId).read();
    if (!center) throw new Error("Workload center not found");

    // Add to pending installations
    center.componentTracking.pendingInstallations.push(data.componentId);
    await workloadCenterContainer.item(data.workloadCenterId, data.workloadCenterId).replace(center);

    // Create a pending installation record
    const installation: ComponentInstallation = {
      id: uuidv4(),
      ...data,
      installedBy: '',
      installationDate: new Date().toISOString(),
      signOffStatus: 'pending',
      sectionOrder: data.sectionOrder
    };

    await componentTraceabilityContainer.items.create(installation);
  } catch (error) {
    console.error("Failed to assign component to section:", error);
    throw error;
  }
}

export async function signOffInstallation(data: {
  installationId: string;
  installedBy: string;
  notes?: string;
}): Promise<ComponentInstallation> {
  try {
    const { resource: installation } = await componentTraceabilityContainer.item(data.installationId, data.installationId).read();
    if (!installation) throw new Error("Installation record not found");

    const updatedInstallation = {
      ...installation,
      installedBy: data.installedBy,
      installationDate: new Date().toISOString(),
      signOffStatus: 'installed',
      notes: data.notes
    };

    const { resource } = await componentTraceabilityContainer.item(data.installationId, data.installationId).replace(updatedInstallation);
    if (!resource) throw new Error("Failed to update installation record");

    // Update workload center tracking
    const { resource: center } = await workloadCenterContainer.item(installation.workloadCenterId, installation.workloadCenterId).read();
    if (center) {
      center.componentTracking.pendingInstallations = center.componentTracking.pendingInstallations
        .filter(id => id !== installation.componentId);
      center.componentTracking.installedComponents.push(installation.componentId);
      await workloadCenterContainer.item(installation.workloadCenterId, installation.workloadCenterId).replace(center);
    }

    return resource;
  } catch (error) {
    console.error("Failed to sign off installation:", error);
    throw error;
  }
}

export async function verifyInstallation(data: {
  installationId: string;
  verifiedBy: string;
}): Promise<ComponentInstallation> {
  try {
    const { resource: installation } = await componentTraceabilityContainer.item(data.installationId, data.installationId).read();
    if (!installation) throw new Error("Installation record not found");

    const updatedInstallation = {
      ...installation,
      verifiedBy: data.verifiedBy,
      verificationDate: new Date().toISOString(),
      signOffStatus: 'verified'
    };

    const { resource } = await componentTraceabilityContainer.item(data.installationId, data.installationId).replace(updatedInstallation);
    if (!resource) throw new Error("Failed to verify installation");

    return resource;
  } catch (error) {
    console.error("Failed to verify installation:", error);
    throw error;
  }
}

export async function getSectionComponents(workloadCenterId: string, projectId: string): Promise<ComponentInstallation[]> {
  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.workloadCenterId = @workloadCenterId AND c.projectId = @projectId ORDER BY c.sectionOrder",
      parameters: [
        { name: "@workloadCenterId", value: workloadCenterId },
        { name: "@projectId", value: projectId }
      ]
    };

    const { resources } = await componentTraceabilityContainer.items.query<ComponentInstallation>(querySpec).fetchAll();
    return resources;
  } catch (error) {
    console.error("Failed to get section components:", error);
    throw error;
  }
}

// Update the initializeDefaultWorkloadCenters function to include routing order
export async function initializeDefaultWorkloadCenters() {
  try {
    const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'H', 'I', 'J', 'K', 'L', 'T', 'Y', 'X'];

    for (let i = 0; i < sections.length; i++) {
      const code = sections[i];
      const existing = await workloadCenterContainer.items
        .query({
          query: "SELECT * FROM c WHERE c.code = @code",
          parameters: [{ name: "@code", value: code }]
        })
        .fetchAll();

      if (existing.resources.length === 0) {
        await createWorkloadCenter({
          code,
          name: `Production Section ${code}`,
          description: `Main production workload center for section ${code}`,
          status: 'active',
          currentLoad: 0,
          maxCapacity: 100,
          activeProjects: [],
          componentTracking: {
            installedComponents: [],
            pendingReplacements: [],
            pendingInstallations: []
          },
          routingOrder: i + 1,
          previousSection: i > 0 ? sections[i - 1] : undefined,
          nextSection: i < sections.length - 1 ? sections[i + 1] : undefined
        });
      }
    }

    console.log("Default workload centers initialized with routing order");
  } catch (error) {
    console.error("Failed to initialize default workload centers:", error);
    throw error;
  }
}

initializeManufacturingDatabase().catch(console.error);
initializeDefaultWorkloadCenters().catch(console.error);