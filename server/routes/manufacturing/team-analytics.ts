import express, { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Container, SqlQuerySpec } from '@azure/cosmos';
import { getContainer } from '../../../server/services/azure/cosmos_service';
import { AuthenticatedRequest, authMiddleware } from '../../auth-middleware';
import { TeamNeed, ProjectHours } from '../../../client/src/types/manufacturing';

const router: Router = express.Router();

// Get the production lines container
let productionLinesContainer: Container | null = null;

async function ensureContainer() {
  if (!productionLinesContainer) {
    productionLinesContainer = getContainer('production-lines');
    if (!productionLinesContainer) {
      throw new Error('Failed to access production-lines container');
    }
  }
  return productionLinesContainer;
}

// Endpoint to get project hours for a production line
router.get('/production-lines/:id/project-hours', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const container = await ensureContainer();
    const { id } = req.params;

    // Query the production line
    const { resource: productionLine } = await container.item(id, id).read();
    
    if (!productionLine) {
      return res.status(404).json({ message: 'Production line not found' });
    }

    // Get project hours from the production line
    const projectHours = productionLine.teamAnalytics?.projectHours || [];
    
    res.json(projectHours);
  } catch (error) {
    console.error('Error fetching project hours:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to update project hours for a production line
router.patch('/production-lines/:id/project-hours/:projectId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const container = await ensureContainer();
    const { id, projectId } = req.params;
    const { earnedHours, allocatedHours } = req.body;

    // Validate inputs
    if (typeof earnedHours !== 'number' || typeof allocatedHours !== 'number') {
      return res.status(400).json({ message: 'Invalid input. earnedHours and allocatedHours must be numbers' });
    }

    // Query the production line
    const { resource: productionLine } = await container.item(id, id).read();
    
    if (!productionLine) {
      return res.status(404).json({ message: 'Production line not found' });
    }

    // Initialize teamAnalytics if it doesn't exist
    if (!productionLine.teamAnalytics) {
      productionLine.teamAnalytics = {
        totalCapacity: productionLine.manpowerCapacity ? productionLine.manpowerCapacity * 40 : 0,
        utilization: 0,
        efficiency: 0,
        projectHours: [],
      };
    }

    // Initialize projectHours array if it doesn't exist
    if (!productionLine.teamAnalytics.projectHours) {
      productionLine.teamAnalytics.projectHours = [];
    }

    // Find the project hours entry
    const projectHoursIndex = productionLine.teamAnalytics.projectHours.findIndex(
      (ph: ProjectHours) => ph.projectId === projectId
    );

    // Update existing entry or add a new one
    if (projectHoursIndex >= 0) {
      productionLine.teamAnalytics.projectHours[projectHoursIndex].earnedHours = earnedHours;
      productionLine.teamAnalytics.projectHours[projectHoursIndex].allocatedHours = allocatedHours;
      productionLine.teamAnalytics.projectHours[projectHoursIndex].lastUpdated = new Date().toISOString();
      productionLine.teamAnalytics.projectHours[projectHoursIndex].updatedBy = req.user?.name || 'Unknown';
    } else {
      const newProjectHours: ProjectHours = {
        projectId,
        earnedHours,
        allocatedHours,
        lastUpdated: new Date().toISOString(),
        updatedBy: req.user?.name || 'Unknown',
      };
      productionLine.teamAnalytics.projectHours.push(newProjectHours);
    }

    // Recalculate team analytics metrics
    let totalEarnedHours = 0;
    let totalAllocatedHours = 0;

    productionLine.teamAnalytics.projectHours.forEach((ph: ProjectHours) => {
      totalEarnedHours += ph.earnedHours;
      totalAllocatedHours += ph.allocatedHours;
    });

    // Update efficiency and utilization
    productionLine.teamAnalytics.efficiency = totalAllocatedHours > 0 
      ? totalEarnedHours / totalAllocatedHours 
      : 0;

    productionLine.teamAnalytics.utilization = productionLine.teamAnalytics.totalCapacity > 0 
      ? totalAllocatedHours / productionLine.teamAnalytics.totalCapacity 
      : 0;

    // Update the production line
    const { resource: updatedProductionLine } = await container.item(id, id).replace(productionLine);
    
    res.json({
      success: true,
      projectHours: updatedProductionLine.teamAnalytics.projectHours,
      teamAnalytics: updatedProductionLine.teamAnalytics
    });
  } catch (error) {
    console.error('Error updating project hours:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to get team needs for a production line
router.get('/production-lines/:id/team-needs', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const container = await ensureContainer();
    const { id } = req.params;

    // Query the production line
    const { resource: productionLine } = await container.item(id, id).read();
    
    if (!productionLine) {
      return res.status(404).json({ message: 'Production line not found' });
    }

    // Get team needs from the production line
    const teamNeeds = productionLine.teamNeeds || [];
    
    res.json(teamNeeds);
  } catch (error) {
    console.error('Error fetching team needs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to add a team need to a production line
router.post('/production-lines/:id/team-needs', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const container = await ensureContainer();
    const { id } = req.params;
    const { type, description, priority, requiredBy, projectId, notes } = req.body;

    // Validate inputs
    if (!type || !description || !priority) {
      return res.status(400).json({ message: 'Invalid input. type, description, and priority are required' });
    }

    // Query the production line
    const { resource: productionLine } = await container.item(id, id).read();
    
    if (!productionLine) {
      return res.status(404).json({ message: 'Production line not found' });
    }

    // Initialize teamNeeds array if it doesn't exist
    if (!productionLine.teamNeeds) {
      productionLine.teamNeeds = [];
    }

    // Create new team need
    const newTeamNeed: TeamNeed = {
      id: uuidv4(),
      type,
      description,
      priority,
      requiredBy,
      projectId,
      notes,
      requestedBy: req.user?.name || 'Unknown',
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };

    // Add the team need
    productionLine.teamNeeds.push(newTeamNeed);

    // Update the production line
    const { resource: updatedProductionLine } = await container.item(id, id).replace(productionLine);
    
    res.json({
      success: true,
      teamNeed: newTeamNeed,
      teamNeeds: updatedProductionLine.teamNeeds
    });
  } catch (error) {
    console.error('Error adding team need:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to update a team need
router.patch('/production-lines/:id/team-needs/:needId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const container = await ensureContainer();
    const { id, needId } = req.params;
    const updates = req.body;

    // Query the production line
    const { resource: productionLine } = await container.item(id, id).read();
    
    if (!productionLine) {
      return res.status(404).json({ message: 'Production line not found' });
    }

    // Initialize teamNeeds array if it doesn't exist
    if (!productionLine.teamNeeds) {
      return res.status(404).json({ message: 'Team need not found' });
    }

    // Find the team need
    const teamNeedIndex = productionLine.teamNeeds.findIndex(
      (need: TeamNeed) => need.id === needId
    );

    if (teamNeedIndex === -1) {
      return res.status(404).json({ message: 'Team need not found' });
    }

    // Update the team need (merging with existing data)
    productionLine.teamNeeds[teamNeedIndex] = {
      ...productionLine.teamNeeds[teamNeedIndex],
      ...updates,
    };

    // Update the production line
    const { resource: updatedProductionLine } = await container.item(id, id).replace(productionLine);
    
    res.json({
      success: true,
      teamNeed: productionLine.teamNeeds[teamNeedIndex],
      teamNeeds: updatedProductionLine.teamNeeds
    });
  } catch (error) {
    console.error('Error updating team need:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to delete a team need
router.delete('/production-lines/:id/team-needs/:needId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const container = await ensureContainer();
    const { id, needId } = req.params;

    // Query the production line
    const { resource: productionLine } = await container.item(id, id).read();
    
    if (!productionLine) {
      return res.status(404).json({ message: 'Production line not found' });
    }

    // Initialize teamNeeds array if it doesn't exist
    if (!productionLine.teamNeeds) {
      return res.status(404).json({ message: 'Team need not found' });
    }

    // Check if the team need exists
    const originalLength = productionLine.teamNeeds.length;
    productionLine.teamNeeds = productionLine.teamNeeds.filter((need: TeamNeed) => need.id !== needId);

    if (productionLine.teamNeeds.length === originalLength) {
      return res.status(404).json({ message: 'Team need not found' });
    }

    // Update the production line
    const { resource: updatedProductionLine } = await container.item(id, id).replace(productionLine);
    
    res.json({
      success: true,
      teamNeeds: updatedProductionLine.teamNeeds
    });
  } catch (error) {
    console.error('Error deleting team need:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;