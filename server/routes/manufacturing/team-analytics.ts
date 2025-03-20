import express, { Request, Response, Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware, AuthenticatedRequest } from "../../auth-middleware";
import { CosmosClient, Container, Database } from "@azure/cosmos";

const router: Router = express.Router();

let cosmosClient: CosmosClient;
let database: Database;
let productionLinesContainer: Container;

// Initialize the Cosmos DB container
async function ensureContainer() {
  try {
    const databaseName = process.env.AZURE_COSMOS_DATABASE || "nomad-manufacturing";
    const containerName = "production-lines";
    
    if (!cosmosClient) {
      const endpoint = process.env.AZURE_COSMOS_ENDPOINT || "";
      const key = process.env.AZURE_COSMOS_KEY || "";
      cosmosClient = new CosmosClient({ endpoint, key });
    }
    
    if (!database) {
      database = await cosmosClient.databases.createIfNotExists({ id: databaseName }).then(response => response.database);
    }
    
    if (!productionLinesContainer) {
      productionLinesContainer = await database.containers.createIfNotExists({ id: containerName }).then(response => response.container);
    }
    
    return productionLinesContainer;
  } catch (error) {
    console.error("Error initializing containers:", error);
    throw error;
  }
}

// Get project hours for a specific production line
router.get('/production-lines/:id/project-hours', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureContainer();
    
    const productionLineId = req.params.id;
    
    // Get the production line
    const { resource: productionLine } = await productionLinesContainer.item(productionLineId, productionLineId).read();
    
    if (!productionLine) {
      return res.status(404).json({ message: "Production line not found" });
    }
    
    // Return project hours if they exist, otherwise return empty array
    res.json(productionLine.teamAnalytics?.projectHours || []);
  } catch (error) {
    console.error("Error fetching project hours:", error);
    res.status(500).json({ message: "Failed to fetch project hours" });
  }
});

// Update project hours for a specific production line and project
router.patch('/production-lines/:id/project-hours/:projectId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureContainer();
    
    const productionLineId = req.params.id;
    const projectId = req.params.projectId;
    const { earnedHours, allocatedHours } = req.body;
    
    // Get the production line
    const { resource: productionLine } = await productionLinesContainer.item(productionLineId, productionLineId).read();
    
    if (!productionLine) {
      return res.status(404).json({ message: "Production line not found" });
    }
    
    // Initialize teamAnalytics if it doesn't exist
    if (!productionLine.teamAnalytics) {
      productionLine.teamAnalytics = {
        totalCapacity: productionLine.manpowerCapacity ? productionLine.manpowerCapacity * 40 : 0,
        utilization: 0,
        efficiency: 0,
        projectHours: []
      };
    }
    
    // Check if project hours already exist for this project
    const existingProjectHoursIndex = productionLine.teamAnalytics.projectHours.findIndex(
      (ph: { projectId: string }) => ph.projectId === projectId
    );
    
    // If project hours exist, update them, otherwise create new
    if (existingProjectHoursIndex !== -1) {
      productionLine.teamAnalytics.projectHours[existingProjectHoursIndex] = {
        ...productionLine.teamAnalytics.projectHours[existingProjectHoursIndex],
        earnedHours: Number(earnedHours),
        allocatedHours: Number(allocatedHours),
        lastUpdated: new Date().toISOString(),
        updatedBy: req.user?.name || "Unknown"
      };
    } else {
      const newProjectHours = {
        projectId,
        earnedHours: Number(earnedHours),
        allocatedHours: Number(allocatedHours),
        lastUpdated: new Date().toISOString(),
        updatedBy: req.user?.name || "Unknown"
      };
      productionLine.teamAnalytics.projectHours.push(newProjectHours);
    }
    
    // Calculate overall efficiency based on total earned / total allocated hours
    const totalEarnedHours = productionLine.teamAnalytics.projectHours.reduce(
      (total: number, ph: { earnedHours: number }) => total + Number(ph.earnedHours), 0
    );
    const totalAllocatedHours = productionLine.teamAnalytics.projectHours.reduce(
      (total: number, ph: { allocatedHours: number }) => total + Number(ph.allocatedHours), 0
    );
    
    productionLine.teamAnalytics.efficiency = totalAllocatedHours > 0 
      ? (totalEarnedHours / totalAllocatedHours) * 100 
      : 0;
    
    productionLine.teamAnalytics.utilization = productionLine.teamAnalytics.totalCapacity > 0 
      ? (totalAllocatedHours / productionLine.teamAnalytics.totalCapacity) * 100 
      : 0;
    
    // Update the production line
    await productionLinesContainer.item(productionLineId, productionLineId).replace(productionLine);
    
    res.json({ message: "Project hours updated successfully", projectHours: productionLine.teamAnalytics.projectHours });
  } catch (error) {
    console.error("Error updating project hours:", error);
    res.status(500).json({ message: "Failed to update project hours" });
  }
});

// Get team needs for a specific production line
router.get('/production-lines/:id/team-needs', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureContainer();
    
    const productionLineId = req.params.id;
    
    // Get the production line
    const { resource: productionLine } = await productionLinesContainer.item(productionLineId, productionLineId).read();
    
    if (!productionLine) {
      return res.status(404).json({ message: "Production line not found" });
    }
    
    // Return team needs if they exist, otherwise return empty array
    res.json(productionLine.teamNeeds || []);
  } catch (error) {
    console.error("Error fetching team needs:", error);
    res.status(500).json({ message: "Failed to fetch team needs" });
  }
});

// Create a new team need for a production line
router.post('/production-lines/:id/team-needs', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureContainer();
    
    const productionLineId = req.params.id;
    const { type, description, priority, requiredBy, projectId, notes } = req.body;
    
    // Get the production line
    const { resource: productionLine } = await productionLinesContainer.item(productionLineId, productionLineId).read();
    
    if (!productionLine) {
      return res.status(404).json({ message: "Production line not found" });
    }
    
    // Initialize teamNeeds if it doesn't exist
    if (!productionLine.teamNeeds) {
      productionLine.teamNeeds = [];
    }
    
    // Create new team need
    const newTeamNeed = {
      id: uuidv4(),
      type,
      description,
      priority,
      requiredBy: requiredBy || undefined,
      projectId: projectId || undefined,
      notes: notes || undefined,
      requestedBy: req.user?.name || "Unknown",
      requestedAt: new Date().toISOString(),
      status: 'pending',
      resolvedAt: undefined,
      resolvedBy: undefined
    };
    
    // Add the new team need to the array
    productionLine.teamNeeds.push(newTeamNeed);
    
    // Update the production line
    await productionLinesContainer.item(productionLineId, productionLineId).replace(productionLine);
    
    res.status(201).json({ message: "Team need created successfully", teamNeed: newTeamNeed });
  } catch (error) {
    console.error("Error creating team need:", error);
    res.status(500).json({ message: "Failed to create team need" });
  }
});

// Update a team need for a production line
router.patch('/production-lines/:id/team-needs/:needId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureContainer();
    
    const productionLineId = req.params.id;
    const teamNeedId = req.params.needId;
    const updates = req.body;
    
    // Get the production line
    const { resource: productionLine } = await productionLinesContainer.item(productionLineId, productionLineId).read();
    
    if (!productionLine) {
      return res.status(404).json({ message: "Production line not found" });
    }
    
    // Find the team need to update
    if (!productionLine.teamNeeds) {
      return res.status(404).json({ message: "Team need not found" });
    }
    
    const teamNeedIndex = productionLine.teamNeeds.findIndex(
      (need: { id: string }) => need.id === teamNeedId
    );
    
    if (teamNeedIndex === -1) {
      return res.status(404).json({ message: "Team need not found" });
    }
    
    // Special handling for status changes
    if (updates.status && updates.status !== productionLine.teamNeeds[teamNeedIndex].status) {
      // If changing to resolved, add resolved info
      if (updates.status === 'resolved') {
        updates.resolvedAt = new Date().toISOString();
        updates.resolvedBy = req.user?.name || "Unknown";
      }
    }
    
    // Update the team need
    productionLine.teamNeeds[teamNeedIndex] = {
      ...productionLine.teamNeeds[teamNeedIndex],
      ...updates
    };
    
    // Update the production line
    await productionLinesContainer.item(productionLineId, productionLineId).replace(productionLine);
    
    res.json({ 
      message: "Team need updated successfully", 
      teamNeed: productionLine.teamNeeds[teamNeedIndex] 
    });
  } catch (error) {
    console.error("Error updating team need:", error);
    res.status(500).json({ message: "Failed to update team need" });
  }
});

// Delete a team need from a production line
router.delete('/production-lines/:id/team-needs/:needId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureContainer();
    
    const productionLineId = req.params.id;
    const teamNeedId = req.params.needId;
    
    // Get the production line
    const { resource: productionLine } = await productionLinesContainer.item(productionLineId, productionLineId).read();
    
    if (!productionLine) {
      return res.status(404).json({ message: "Production line not found" });
    }
    
    // Check if team needs exist
    if (!productionLine.teamNeeds) {
      return res.status(404).json({ message: "Team need not found" });
    }
    
    // Remove the team need from the array
    productionLine.teamNeeds = productionLine.teamNeeds.filter(
      (need: { id: string }) => need.id !== teamNeedId
    );
    
    // Update the production line
    await productionLinesContainer.item(productionLineId, productionLineId).replace(productionLine);
    
    res.json({ message: "Team need deleted successfully" });
  } catch (error) {
    console.error("Error deleting team need:", error);
    res.status(500).json({ message: "Failed to delete team need" });
  }
});

export default router;