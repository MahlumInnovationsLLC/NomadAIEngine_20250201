import express, { Request, Response, Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware, AuthenticatedRequest } from "../../auth-middleware";
import { CosmosClient, Container, Database } from "@azure/cosmos";
import { WebSocketManager } from "../../services/websocket";

const router: Router = express.Router();
let webSocketManager: WebSocketManager | null = null;

// Remove SendGrid completely as requested

// Function to register the WebSocket manager
export function registerWebSocketManager(wsManager: WebSocketManager) {
  webSocketManager = wsManager;
}

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
    
    // Check for productionLineId in both params and body
    const productionLineId = req.params.id || req.body.productionLineId;
    if (!productionLineId) {
      return res.status(400).json({ message: "Production line ID is required" });
    }
    
    console.log("Production line ID received:", productionLineId);
    console.log("Request body:", req.body);
    
    const { 
      type, 
      description, 
      priority, 
      requiredBy, 
      projectId, 
      notes, 
      owner,
      ownerEmail,
      sendNotification 
    } = req.body;
    
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
      owner: owner || undefined,
      ownerEmail: ownerEmail || undefined,
      notificationSent: false, // Initialize as false, we'll set it below if sent
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
    
    // Create mailto link if notification requested and owner email is provided
    let mailtoLink = null;
    if (sendNotification && ownerEmail) {
      try {
        console.log(`Team need created with ID: ${newTeamNeed.id}`);
        console.log(`Email notification requested: ${sendNotification}`);
        console.log(`Owner email: ${ownerEmail}`);
        console.log(`Creating mailto link for email client to: ${ownerEmail}`);
        
        // Format required by date if provided
        let requiredByText = '';
        if (requiredBy) {
          const requiredDate = new Date(requiredBy);
          requiredByText = ` needed by ${requiredDate.toLocaleDateString()}`;
        }
        
        // Project-specific message if projectId is provided
        let projectText = '';
        if (projectId) {
          projectText = ` for project #${projectId}`;
        }
        
        // Determine email subject based on priority
        let priorityText = priority.toUpperCase();
        
        const emailSubject = `[${priorityText}] Team Need: ${type}`;
        
        // Define text version for email clients
        const textContent = `
Team Need: ${type} (${priority.toUpperCase()})
Description: ${description}
${requiredByText ? `Required By: ${requiredByText}\n` : ''}
${projectText ? `Project: ${projectText}\n` : ''}
${notes ? `Notes: ${notes}\n` : ''}
Requested By: ${req.user?.name || "Unknown"}
Requested At: ${new Date().toLocaleString()}

You have been assigned as the owner of this team need.

You can view and respond to this team need in the system by visiting:
${process.env.BASE_URL || 'https://NOMAD_BASE_URL'}/manufacturing/production/team/${productionLineId}?tab=needs&highlight=${newTeamNeed.id}
        `.trim();
        
        // Create a mailto link for client use
        mailtoLink = `mailto:${ownerEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(textContent)}`;
        console.log(`Created mailto link for email client`);
        
        // Mark notification as being handled client-side
        productionLine.teamNeeds[productionLine.teamNeeds.length - 1].notificationSent = true;
        
        // Update the production line
        await productionLinesContainer.item(productionLineId, productionLineId).replace(productionLine);
      } catch (emailError) {
        console.error("Error creating mailto link:", emailError);
        console.error("Error details:", JSON.stringify(emailError, null, 2));
        // We don't want to fail the request if the email link creation fails
      }
    }
    
    // Send notification to team managers about the new need
    if (webSocketManager) {
      try {
        // Determine notification priority based on the team need priority
        let notificationPriority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
        switch (priority) {
          case 'critical':
            notificationPriority = 'urgent';
            break;
          case 'high':
            notificationPriority = 'high';
            break;
          case 'medium':
            notificationPriority = 'medium';
            break;
          case 'low':
            notificationPriority = 'low';
            break;
        }
        
        // Project-specific message if projectId is provided
        let projectText = '';
        if (projectId) {
          projectText = ` for project #${projectId}`;
        }
        
        // Format required by date if provided
        let requiredByText = '';
        if (requiredBy) {
          const requiredDate = new Date(requiredBy);
          requiredByText = ` needed by ${requiredDate.toLocaleDateString()}`;
        }
        
        // Use productionLine team lead users to notify them
        // For this example, we're using "Admin" as a placeholder
        // In a real system, you would pull the electrical lead and assembly lead from productionLine
        const teamLeads = ["Admin"]; // Placeholder for actual team leads
        
        const link = `/manufacturing/production/team/${productionLineId}?tab=needs&highlight=${newTeamNeed.id}`;
        
        // Notify all team leads about the new need
        for (const userId of teamLeads) {
          await webSocketManager.sendNotification(userId, {
            type: 'new_team_need',
            title: `New ${priority} ${type} Request`,
            message: `${newTeamNeed.requestedBy} requested ${description}${projectText}${requiredByText}`,
            priority: notificationPriority,
            link,
            metadata: {
              productionLineId,
              teamNeedId: newTeamNeed.id,
              teamNeed: newTeamNeed
            }
          });
        }
        
        console.log(`Notifications sent for new team need: ${newTeamNeed.id}`);
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
        // We don't want to fail the request if notification fails, so we just log the error
      }
    }
    
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
    
    // Check for productionLineId in both params and body
    const productionLineId = req.params.id || req.body.productionLineId;
    const teamNeedId = req.params.needId;
    const updates = req.body;
    
    if (!productionLineId) {
      return res.status(400).json({ message: "Production line ID is required" });
    }
    
    console.log("PATCH - Production line ID received:", productionLineId);
    console.log("PATCH - Team need ID received:", teamNeedId);
    console.log("PATCH - Request body:", req.body);
    
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
    
    // Store the original status for comparison
    const originalStatus = productionLine.teamNeeds[teamNeedIndex].status;
    
    // Special handling for status changes
    if (updates.status && updates.status !== originalStatus) {
      // If changing to resolved, add resolved info
      if (updates.status === 'resolved') {
        updates.resolvedAt = new Date().toISOString();
        updates.resolvedBy = req.user?.name || "Unknown";
      }
    }
    
    // Get original data for comparison
    const originalTeamNeed = { ...productionLine.teamNeeds[teamNeedIndex] };
    
    // Update the team need
    productionLine.teamNeeds[teamNeedIndex] = {
      ...productionLine.teamNeeds[teamNeedIndex],
      ...updates
    };
    
    // Update the production line
    await productionLinesContainer.item(productionLineId, productionLineId).replace(productionLine);
    
    // Create mailto link if notification requested and owner email is provided
    let mailtoLink = null;
    if (updates.owner && updates.ownerEmail && 
        updates.sendNotification &&
        (!originalTeamNeed.owner || originalTeamNeed.owner !== updates.owner)) {
      try {
        console.log(`Creating email notification link for ${updates.ownerEmail} for team need: ${teamNeedId}`);
        
        // Format required by date if provided
        let requiredByText = '';
        if (productionLine.teamNeeds[teamNeedIndex].requiredBy) {
          const requiredDate = new Date(productionLine.teamNeeds[teamNeedIndex].requiredBy);
          requiredByText = ` needed by ${requiredDate.toLocaleDateString()}`;
        }
        
        // Project-specific message if projectId is provided
        let projectText = '';
        if (productionLine.teamNeeds[teamNeedIndex].projectId) {
          projectText = ` for project #${productionLine.teamNeeds[teamNeedIndex].projectId}`;
        }
        
        // Determine email subject based on priority
        const priority = productionLine.teamNeeds[teamNeedIndex].priority;
        const priorityText = priority.toUpperCase();
        
        const emailSubject = `[${priorityText}] Team Need: ${productionLine.teamNeeds[teamNeedIndex].type}`;
        
        // Define text version for email clients
        const textContent = `
Team Need: ${productionLine.teamNeeds[teamNeedIndex].type} (${priorityText})
Description: ${productionLine.teamNeeds[teamNeedIndex].description}
${requiredByText ? `Required By: ${requiredByText}\n` : ''}
${projectText ? `Project: ${projectText}\n` : ''}
${productionLine.teamNeeds[teamNeedIndex].notes ? `Notes: ${productionLine.teamNeeds[teamNeedIndex].notes}\n` : ''}
Requested By: ${productionLine.teamNeeds[teamNeedIndex].requestedBy || "Unknown"}
Requested At: ${new Date(productionLine.teamNeeds[teamNeedIndex].requestedAt).toLocaleString()}

You have been assigned as the owner of this team need.

You can view and respond to this team need in the system by visiting:
${process.env.BASE_URL || 'https://NOMAD_BASE_URL'}/manufacturing/production/team/${productionLineId}?tab=needs&highlight=${teamNeedId}
        `.trim();
        
        // Create a mailto link for client use
        mailtoLink = `mailto:${updates.ownerEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(textContent)}`;
        
        console.log(`Created mailto link for email client`);
        
        // Mark notification as sent in the database
        productionLine.teamNeeds[teamNeedIndex].notificationSent = true;
        
        // Update the production line again to save the notification status
        await productionLinesContainer.item(productionLineId, productionLineId).replace(productionLine);
      } catch (emailError) {
        console.error("Error creating mailto link:", emailError);
        console.error("Error details:", JSON.stringify(emailError, null, 2));
        // We don't want to fail the request if the email link creation fails
      }
    }
    
    // Send notification if the status changed
    if (webSocketManager && updates.status && updates.status !== originalStatus) {
      try {
        // Define the notification details based on status change
        let title = '';
        let message = '';
        let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
        
        // Customize notification based on the new status
        switch(updates.status) {
          case 'in_progress':
            title = 'Team Need In Progress';
            message = `Team need "${productionLine.teamNeeds[teamNeedIndex].description}" is now being addressed`;
            priority = 'medium';
            break;
          case 'resolved':
            title = 'Team Need Resolved';
            message = `Team need "${productionLine.teamNeeds[teamNeedIndex].description}" has been resolved by ${updates.resolvedBy || 'a team member'}`;
            priority = 'low';
            break;
          case 'cancelled':
            title = 'Team Need Cancelled';
            message = `Team need "${productionLine.teamNeeds[teamNeedIndex].description}" has been cancelled`;
            priority = 'low';
            break;
          default:
            title = 'Team Need Status Updated';
            message = `Team need "${productionLine.teamNeeds[teamNeedIndex].description}" status changed to ${updates.status}`;
            priority = 'medium';
        }
        
        // Get original requestor ID to notify them
        // Here we're using their name as the ID - in a real system, you'd use actual user IDs
        const userId = productionLine.teamNeeds[teamNeedIndex].requestedBy || 'Unknown';
        
        const link = `/manufacturing/production/team/${productionLineId}?tab=needs&highlight=${teamNeedId}`;
        
        // Send notification to the requestor
        await webSocketManager.sendNotification(userId, {
          type: 'team_need_status_change',
          title,
          message,
          priority,
          link,
          metadata: {
            productionLineId,
            teamNeedId,
            oldStatus: originalStatus,
            newStatus: updates.status,
            teamNeed: productionLine.teamNeeds[teamNeedIndex]
          }
        });
        
        console.log(`Notification sent for team need status change to ${updates.status}`);
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
        // We don't want to fail the request if notification fails, so we just log the error
      }
    }
    
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
    
    // Check for productionLineId in both params and body
    const productionLineId = req.params.id || req.body.productionLineId;
    const teamNeedId = req.params.needId;
    
    if (!productionLineId) {
      return res.status(400).json({ message: "Production line ID is required" });
    }
    
    console.log("DELETE - Production line ID received:", productionLineId);
    console.log("DELETE - Team need ID received:", teamNeedId);
    
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