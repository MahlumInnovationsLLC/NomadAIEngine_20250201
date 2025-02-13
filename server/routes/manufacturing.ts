import { Router } from "express";
import { 
  getProductionLineStatus, 
  addProductionMetrics, 
  getQualityInspections, 
  saveQualityInspection, 
  updateQualityInspection,
  getProject,
  updateProject,
  calculateProjectStatus
} from "../services/azure/facility_service";
import crypto from 'crypto';
import qualityRoutes from './manufacturing/quality';
import projectRoutes from './manufacturing/projects';
import resourceRoutes from './manufacturing/resources';
import dailyRequirementRoutes from './manufacturing/daily-requirements';
import auditRoutes from './manufacturing/quality/audits';
import { ProjectStatus } from "@/types/manufacturing";

const router = Router();

// Register routes
router.use('/quality', qualityRoutes);
router.use('/quality/audits', auditRoutes); // Added audit routes
router.use('/projects', projectRoutes);
router.use('/resources', resourceRoutes);
router.use('/daily-requirements', dailyRequirementRoutes);

// Reset project status to automatic
router.post("/projects/:id/reset-status", async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Attempting to reset status for project:', id);

    // Get current project from Cosmos DB
    const project = await getProject(id);

    if (!project) {
      console.log('Project not found:', id);
      return res.status(404).json({ error: "Project not found" });
    }

    console.log('Found project:', project);

    // Calculate new status based on dates
    const calculatedStatus = calculateProjectStatus(project);
    console.log('Calculated new status:', calculatedStatus);

    // Update project in Cosmos DB
    const updatedProject = await updateProject(id, {
      manualStatus: false,
      status: calculatedStatus
    });

    console.log('Successfully updated project:', updatedProject);
    res.json(updatedProject);
  } catch (error) {
    console.error("Failed to reset project status:", error);

    // Enhanced error response
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const errorDetails = error instanceof Error && error.stack ? error.stack : "";

    res.status(500).json({ 
      error: "Failed to reset project status",
      details: errorMessage,
      stack: errorDetails 
    });
  }
});

// Quality Inspection Routes
router.post("/quality/inspections", async (req, res) => {
  try {
    const inspectionData = req.body;
    const result = await saveQualityInspection(inspectionData);
    res.status(201).json(result);
  } catch (error) {
    console.error("Failed to create quality inspection:", error);
    res.status(500).json({ error: "Failed to create quality inspection" });
  }
});

router.get("/quality/inspections", async (req, res) => {
  try {
    const inspections = await getQualityInspections();
    res.json(inspections);
  } catch (error) {
    console.error("Failed to get quality inspections:", error);
    res.status(500).json({ error: "Failed to get quality inspections" });
  }
});

router.put("/quality/inspections/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const result = await updateQualityInspection(id, updates);
    res.json(result);
  } catch (error) {
    console.error("Failed to update quality inspection:", error);
    res.status(500).json({ error: "Failed to update quality inspection" });
  }
});

// Production Lines Routes
router.get("/production-lines", async (req, res) => {
  try {
    const status = await getProductionLineStatus();
    // For now, we'll wrap the single line in an array until we implement multi-line support
    res.json(status ? [status] : []);
  } catch (error) {
    console.error("Failed to get production lines:", error);
    res.status(500).json({ error: "Failed to get production lines" });
  }
});

// Get single production line status
router.get("/production-line/:id", async (req, res) => {
  try {
    const status = await getProductionLineStatus();
    if (!status) {
      return res.status(404).json({ error: "Production line not found" });
    }
    res.json(status);
  } catch (error) {
    console.error("Failed to get production line status:", error);
    res.status(500).json({ error: "Failed to get production line status" });
  }
});

// Update production line status
router.post("/production-line/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }
    // TODO: Implement status update in Cosmos DB
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to update production line status:", error);
    res.status(500).json({ error: "Failed to update production line status" });
  }
});

// Add production metrics
router.post("/production-line/:id/metrics", async (req, res) => {
  try {
    const metrics = req.body;
    const result = await addProductionMetrics(metrics);
    res.json(result);
  } catch (error) {
    console.error("Failed to add production metrics:", error);
    res.status(500).json({ error: "Failed to add production metrics" });
  }
});

// Create new production line
router.post("/production-lines", async (req, res) => {
  try {
    const now = new Date().toISOString();
    const newLine = {
      ...req.body,
      id: crypto.randomUUID(),
      metrics: [],
      buildStages: [],
      allocatedInventory: [],
      lastMaintenance: now,
      nextMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
      updatedAt: now,
    };

    // TODO: Implement creation in Cosmos DB
    // For now return mock response
    res.status(201).json(newLine);
  } catch (error) {
    console.error("Failed to create production line:", error);
    res.status(500).json({ error: "Failed to create production line" });
  }
});

export default router;