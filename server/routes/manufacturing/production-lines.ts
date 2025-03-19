import express, { Response, Request } from "express";
import { CosmosClient, Container } from "@azure/cosmos";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware, AuthenticatedRequest } from "../../auth-middleware";

const router = express.Router();

// Simple health check endpoint for testing
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Production lines API is healthy' });
});

// Initialize container using the same approach as facility_service.ts
if (!process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING) {
  console.warn("Azure Cosmos DB connection string not found - Production lines functionality will be limited");
}

const client = new CosmosClient(process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING || "");
const database = client.database("NomadAIEngineDB");
const productionLineContainer = database.container("production-lines");

// Get all production lines - temporarily remove auth for testing
router.get('/', async (req: any, res: Response) => {
  try {
    const querySpec = {
      query: "SELECT * FROM c ORDER BY c.name"
    };

    const { resources: productionLines } = await productionLineContainer.items.query(querySpec).fetchAll();
    
    // If no production lines found, generate sample data for development
    if (productionLines.length === 0) {
      // Generate sample production lines
      const sampleLines = [
        {
          id: uuidv4(),
          name: "Assembly Line A1",
          description: "Main assembly line for product series A",
          type: "assembly",
          status: "operational",
          capacity: {
            planned: 1000,
            actual: 850,
            unit: "units/day"
          },
          performance: {
            efficiency: 0.85,
            quality: 0.97,
            availability: 0.92,
            oee: 0.76
          },
          lastMaintenance: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
          nextMaintenance: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(), // 16 days from now
          metrics: [],
          buildStages: [],
          allocatedInventory: [],
          notes: "Running at normal capacity",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          name: "Machining Line M2",
          description: "Precision machining for components",
          type: "machining",
          status: "maintenance",
          capacity: {
            planned: 500,
            actual: 0,
            unit: "components/day"
          },
          performance: {
            efficiency: 0.00,
            quality: 0.94,
            availability: 0.82,
            oee: 0.00
          },
          lastMaintenance: new Date().toISOString(), // Now
          nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
          metrics: [],
          buildStages: [],
          allocatedInventory: [],
          notes: "Scheduled maintenance in progress",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          name: "Fabrication Line F3",
          description: "Sheet metal fabrication line",
          type: "fabrication",
          status: "operational",
          capacity: {
            planned: 750,
            actual: 700,
            unit: "parts/day"
          },
          performance: {
            efficiency: 0.93,
            quality: 0.96,
            availability: 0.98,
            oee: 0.87
          },
          lastMaintenance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          nextMaintenance: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days from now
          metrics: [],
          buildStages: [],
          allocatedInventory: [],
          notes: "Running at optimal efficiency",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          name: "Testing Line T1",
          description: "Automated testing and quality control",
          type: "testing",
          status: "error",
          capacity: {
            planned: 1200,
            actual: 600,
            unit: "tests/day"
          },
          performance: {
            efficiency: 0.50,
            quality: 0.85,
            availability: 0.60,
            oee: 0.25
          },
          lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          nextMaintenance: new Date(Date.now() + 0 * 24 * 60 * 60 * 1000).toISOString(), // Today
          metrics: [],
          buildStages: [],
          allocatedInventory: [],
          notes: "Equipment failure detected, maintenance team dispatched",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Create the sample production lines in the database
      for (const line of sampleLines) {
        await productionLineContainer.items.create(line);
      }

      // Return the sample data
      return res.json(sampleLines);
    }
    
    return res.json(productionLines);
  } catch (error) {
    console.error("Failed to fetch production lines:", error);
    res.status(500).json({ error: "Failed to fetch production lines" });
  }
});

// Get a single production line by ID
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { resource: productionLine } = await productionLineContainer.item(id, id).read();
    
    if (!productionLine) {
      return res.status(404).json({ error: "Production line not found" });
    }
    
    res.json(productionLine);
  } catch (error) {
    console.error("Failed to fetch production line:", error);
    res.status(500).json({ error: "Failed to fetch production line" });
  }
});

// Create a new production line
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, type, capacity } = req.body;
    
    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({ error: "Name and type are required" });
    }
    
    const now = new Date().toISOString();
    const newProductionLine = {
      id: uuidv4(),
      name,
      description,
      type,
      status: "operational", // Default status
      capacity: capacity || {
        planned: 0,
        actual: 0,
        unit: "units/day"
      },
      performance: {
        efficiency: 0,
        quality: 0,
        availability: 0,
        oee: 0
      },
      lastMaintenance: null,
      nextMaintenance: null,
      metrics: [],
      buildStages: [],
      allocatedInventory: [],
      notes: "",
      createdAt: now,
      updatedAt: now,
      createdBy: req.user?.id || "unknown"
    };
    
    const { resource: createdLine } = await productionLineContainer.items.create(newProductionLine);
    res.status(201).json(createdLine);
  } catch (error) {
    console.error("Failed to create production line:", error);
    res.status(500).json({ error: "Failed to create production line" });
  }
});

// Update a production line
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Ensure ID cannot be changed
    if (updates.id && updates.id !== id) {
      return res.status(400).json({ error: "Production line ID cannot be changed" });
    }
    
    // Get existing production line
    const { resource: existingLine } = await productionLineContainer.item(id, id).read();
    
    if (!existingLine) {
      return res.status(404).json({ error: "Production line not found" });
    }
    
    // Merge updates with existing line
    const updatedLine = {
      ...existingLine,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.id || "unknown"
    };
    
    const { resource: result } = await productionLineContainer.item(id, id).replace(updatedLine);
    res.json(result);
  } catch (error) {
    console.error("Failed to update production line:", error);
    res.status(500).json({ error: "Failed to update production line" });
  }
});

// Delete a production line
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    await productionLineContainer.item(id, id).delete();
    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete production line:", error);
    res.status(500).json({ error: "Failed to delete production line" });
  }
});

// Update production line status
router.patch('/:id/status', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['operational', 'maintenance', 'error', 'offline'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: "Invalid status. Must be one of: operational, maintenance, error, offline" 
      });
    }
    
    // Get existing production line
    const { resource: existingLine } = await productionLineContainer.item(id, id).read();
    
    if (!existingLine) {
      return res.status(404).json({ error: "Production line not found" });
    }
    
    // Update status
    const updatedLine = {
      ...existingLine,
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.id || "unknown"
    };
    
    const { resource: result } = await productionLineContainer.item(id, id).replace(updatedLine);
    res.json(result);
  } catch (error) {
    console.error("Failed to update production line status:", error);
    res.status(500).json({ error: "Failed to update production line status" });
  }
});

// Get assigned projects for a production line
router.get('/:id/assignments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get existing production line
    const { resource: productionLine } = await productionLineContainer.item(id, id).read();
    
    if (!productionLine) {
      return res.status(404).json({ error: "Production line not found" });
    }
    
    // Return assigned projects (or empty array if none)
    res.json(productionLine.assignedProjects || []);
  } catch (error) {
    console.error("Failed to fetch production line assignments:", error);
    res.status(500).json({ error: "Failed to fetch production line assignments" });
  }
});

// Update assigned projects for a production line
router.post('/:id/assignments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { projectIds } = req.body;
    
    if (!Array.isArray(projectIds)) {
      return res.status(400).json({ error: "projectIds must be an array" });
    }
    
    // Get existing production line
    const { resource: productionLine } = await productionLineContainer.item(id, id).read();
    
    if (!productionLine) {
      return res.status(404).json({ error: "Production line not found" });
    }
    
    // Update assignments
    const updatedLine = {
      ...productionLine,
      assignedProjects: projectIds,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.id || "unknown"
    };
    
    const { resource: result } = await productionLineContainer.item(id, id).replace(updatedLine);
    res.json(result.assignedProjects || []);
  } catch (error) {
    console.error("Failed to update production line assignments:", error);
    res.status(500).json({ error: "Failed to update production line assignments" });
  }
});

// Get production line stats endpoint
router.get('/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {

    // Query all production lines
    const { resources: productionLines } = await productionLineContainer.items.readAll().fetchAll();
    
    // Calculate stats
    const totalLines = productionLines.length;
    const operationalLines = productionLines.filter(line => line.status === 'operational').length;
    const maintenanceLines = productionLines.filter(line => line.status === 'maintenance').length;
    const errorLines = productionLines.filter(line => line.status === 'error').length;
    const offlineLines = productionLines.filter(line => line.status === 'offline').length;
    
    // Calculate average metrics
    const averageOEE = totalLines > 0 
      ? productionLines.reduce((sum, line) => sum + (line.performance?.oee || 0), 0) / totalLines
      : 0;
    
    const averageEfficiency = totalLines > 0 
      ? productionLines.reduce((sum, line) => sum + (line.performance?.efficiency || 0), 0) / totalLines
      : 0;
    
    const averageQuality = totalLines > 0 
      ? productionLines.reduce((sum, line) => sum + (line.performance?.quality || 0), 0) / totalLines
      : 0;
    
    const averageAvailability = totalLines > 0 
      ? productionLines.reduce((sum, line) => sum + (line.performance?.availability || 0), 0) / totalLines
      : 0;
    
    // Calculate total production capacity
    const totalPlannedCapacity = productionLines.reduce((sum, line) => sum + (line.capacity?.planned || 0), 0);
    const totalActualCapacity = productionLines.reduce((sum, line) => sum + (line.capacity?.actual || 0), 0);
    
    // Return stats
    res.json({
      totalLines,
      byStatus: {
        operational: operationalLines,
        maintenance: maintenanceLines,
        error: errorLines,
        offline: offlineLines
      },
      averageMetrics: {
        oee: averageOEE,
        efficiency: averageEfficiency,
        quality: averageQuality,
        availability: averageAvailability
      },
      capacity: {
        planned: totalPlannedCapacity,
        actual: totalActualCapacity,
        utilization: totalPlannedCapacity > 0 ? totalActualCapacity / totalPlannedCapacity : 0
      }
    });
  } catch (error) {
    console.error("Failed to fetch production line stats:", error);
    res.status(500).json({ error: "Failed to fetch production line stats" });
  }
});

export default router;