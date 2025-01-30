import { Router } from "express";
import { getProductionLineStatus, addProductionMetrics } from "../services/azure/facility_service";
import crypto from 'crypto';

const router = Router();

// Get all production lines
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