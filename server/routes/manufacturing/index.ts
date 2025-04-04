import express, { Router } from 'express';
import { Server } from 'socket.io';
import projectsRouter from './projects';
import analyticsRouter from './analytics';
import resourcesRouter from './resources';
import productionLinesRouter from './production-lines';
import teamAnalyticsRouter, { registerWebSocketManager } from './team-analytics';
import milestonesRouter from './milestones';
// Commenting out dailyRequirementsRouter since it may not exist
// import dailyRequirementsRouter from './daily-requirements';
import { registerQualityRoutes } from './quality';

const router: Router = express.Router();

// Register manufacturing routes
router.use('/projects', projectsRouter);
router.use('/analytics', analyticsRouter);
router.use('/resources', resourcesRouter);
router.use('/production-lines', productionLinesRouter);
router.use('/team-analytics', teamAnalyticsRouter);
// Project milestones routes
router.use('/', milestonesRouter);
// Commenting out this route registration since it may not exist
// router.use('/daily-requirements', dailyRequirementsRouter);

// Manufacturing Socket.IO setup
export function setupManufacturingSocketIO(io: Server) {
  const manufacturingNsp = io.of('/manufacturing');
  
  manufacturingNsp.on('connection', (socket) => {
    console.log('Manufacturing namespace client connected');
    
    // Quality inspection update handler
    socket.on('quality:inspection:update', async (data) => {
      try {
        const { id, updates } = data;
        console.log(`[Socket] Received quality inspection update for ID: ${id}`);
        
        if (!id || !updates) {
          socket.emit('quality:inspection:updated', { 
            error: true, 
            message: 'Invalid data: missing id or updates' 
          });
          return;
        }
        
        // Import the facility service to handle the actual update
        const { updateQualityInspection } = await import('../../services/azure/facility_service');
        
        // Perform the update
        const result = await updateQualityInspection(id, updates);
        
        // Emit success response back to the client
        socket.emit('quality:inspection:updated', { 
          success: true, 
          data: result,
          message: 'Inspection updated successfully'
        });
        
        // Broadcast to other clients that an update happened (without the data)
        socket.broadcast.emit('quality:refresh:needed', {
          timestamp: new Date().toISOString(),
          message: 'Inspection updated',
          inspectionId: id
        });
        
      } catch (error) {
        console.error('[Socket] Error updating quality inspection:', error);
        
        // Send back error details
        socket.emit('quality:inspection:updated', { 
          error: true, 
          message: error instanceof Error ? error.message : 'Failed to update inspection',
          details: error instanceof Error ? error.stack : undefined
        });
      }
    });
    
    socket.on('quality:inspection:list', () => {
      // Broadcast to all clients to refresh their inspection lists
      manufacturingNsp.emit('quality:refresh:needed', {
        timestamp: new Date().toISOString(),
        message: 'Refresh inspection list'
      });
    });
    
    socket.on('join:production-line', (productionLineId) => {
      socket.join(`production-line:${productionLineId}`);
      console.log(`Client joined production-line:${productionLineId}`);
    });
    
    socket.on('leave:production-line', (productionLineId) => {
      socket.leave(`production-line:${productionLineId}`);
      console.log(`Client left production-line:${productionLineId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('Manufacturing namespace client disconnected');
    });
  });
  
  return manufacturingNsp;
}

export default router;