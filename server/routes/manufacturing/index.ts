import express, { Router } from 'express';
import { Server } from 'socket.io';
import projectsRouter from './projects';
import analyticsRouter from './analytics';
import resourcesRouter from './resources';
import productionLinesRouter from './production-lines';
import teamAnalyticsRouter, { registerWebSocketManager } from './team-analytics';
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
// Commenting out this route registration since it may not exist
// router.use('/daily-requirements', dailyRequirementsRouter);

// Manufacturing Socket.IO setup
export function setupManufacturingSocketIO(io: Server) {
  const manufacturingNsp = io.of('/manufacturing');
  
  manufacturingNsp.on('connection', (socket) => {
    console.log('Manufacturing namespace client connected');
    
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