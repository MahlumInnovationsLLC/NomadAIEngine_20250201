import { Router } from "express";
import { Server } from "socket.io";
import { 
  getProductionLineStatus, 
  addProductionMetrics, 
  getQualityInspections, 
  saveQualityInspection, 
  updateQualityInspection,
  getProject,
  updateProject,
  calculateProjectStatus,
  saveQualityTemplate,
  getQualityTemplates,
  updateQualityTemplate
} from "../services/azure/facility_service";
import crypto from 'crypto';
import qualityRoutes from './manufacturing/quality';
import projectRoutes from './manufacturing/projects';
import resourceRoutes from './manufacturing/resources';
import dailyRequirementRoutes from './manufacturing/daily-requirements';
import auditRoutes from './manufacturing/quality/audits';
import analyticsRoutes from './manufacturing/analytics';
import { ProjectStatus } from "@/types/manufacturing";

const router = Router();

// Setup Socket.IO event handlers
export function setupManufacturingSocketIO(io: Server) {
  const manufacturingNamespace = io.of('/manufacturing');

  manufacturingNamespace.on('connection', (socket) => {
    console.log('Manufacturing client connected');

    // Template events
    socket.on('quality:template:create', async (data) => {
      try {
        console.log('Creating quality template:', data);
        const result = await saveQualityTemplate(data);
        socket.emit('quality:template:created', result);
        // Also broadcast to all clients
        socket.broadcast.emit('quality:template:updated', await getQualityTemplates());
      } catch (error) {
        console.error('Failed to create quality template:', error);
        socket.emit('error', { 
          message: 'Failed to create quality template',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    socket.on('quality:template:list', async () => {
      try {
        console.log('Fetching quality templates');
        const templates = await getQualityTemplates();
        socket.emit('quality:template:list', { templates });
      } catch (error) {
        console.error('Failed to get quality templates:', error);
        socket.emit('error', { message: 'Failed to get quality templates' });
      }
    });

    socket.on('quality:template:update', async ({ id, updates }) => {
      try {
        console.log('Updating quality template:', id, updates);
        const result = await updateQualityTemplate(id, updates);
        socket.emit('quality:template:updated', result);
        // Also broadcast to all clients
        socket.broadcast.emit('quality:template:updated', await getQualityTemplates());
      } catch (error) {
        console.error('Failed to update quality template:', error);
        socket.emit('error', { message: 'Failed to update quality template' });
      }
    });

    // Quality Inspection events
    socket.on('quality:inspection:create', async (data) => {
      try {
        const result = await saveQualityInspection(data);
        socket.emit('quality:inspection:created', result);
      } catch (error) {
        console.error('Failed to create quality inspection:', error);
        socket.emit('error', { message: 'Failed to create quality inspection' });
      }
    });

    socket.on('quality:inspection:list', async () => {
      try {
        const inspections = await getQualityInspections();
        socket.emit('quality:inspection:list', inspections);
      } catch (error) {
        console.error('Failed to get quality inspections:', error);
        socket.emit('error', { message: 'Failed to get quality inspections' });
      }
    });

    socket.on('quality:inspection:update', async ({ id, updates }) => {
      try {
        const result = await updateQualityInspection(id, updates);
        socket.emit('quality:inspection:updated', result);
      } catch (error) {
        console.error('Failed to update quality inspection:', error);
        socket.emit('error', { message: 'Failed to update quality inspection' });
      }
    });

    // Production Line events
    socket.on('production:line:status', async () => {
      try {
        const status = await getProductionLineStatus();
        socket.emit('production:line:status', status ? [status] : []);
      } catch (error) {
        console.error('Failed to get production lines:', error);
        socket.emit('error', { message: 'Failed to get production lines' });
      }
    });

    socket.on('production:line:metrics:add', async (metrics) => {
      try {
        const result = await addProductionMetrics(metrics);
        socket.emit('production:line:metrics:added', result);
      } catch (error) {
        console.error('Failed to add production metrics:', error);
        socket.emit('error', { message: 'Failed to add production metrics' });
      }
    });

    // Project status events
    socket.on('project:status:reset', async (id) => {
      try {
        const project = await getProject(id);
        if (!project) {
          socket.emit('error', { message: 'Project not found' });
          return;
        }

        const calculatedStatus = calculateProjectStatus(project);
        const updatedProject = await updateProject(id, {
          manualStatus: false,
          status: calculatedStatus
        });

        socket.emit('project:status:reset', updatedProject);
      } catch (error) {
        console.error('Failed to reset project status:', error);
        socket.emit('error', { message: 'Failed to reset project status' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Manufacturing client disconnected');
    });
  });
}

// Keep REST routes for non-realtime operations
router.use('/quality', qualityRoutes);
router.use('/quality/audits', auditRoutes);
router.use('/projects', projectRoutes);
router.use('/resources', resourceRoutes);
router.use('/daily-requirements', dailyRequirementRoutes);
router.use('/analytics', analyticsRoutes);

export default router;