import { Router } from "express";
import { getProductionLineStatus, addProductionMetrics } from "../services/azure/facility_service";

const router = Router();

// Get production line status
router.get("/production-line", async (req, res) => {
  try {
    const status = await getProductionLineStatus();
    res.json(status || {
      id: "default",
      metrics: [],
      lastMaintenance: new Date().toISOString(),
      nextMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "operational",
      performance: {
        efficiency: 100,
        quality: 100,
        availability: 100,
        oee: 100
      },
      notes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to get production line status:", error);
    res.status(500).json({ error: "Failed to get production line status" });
  }
});

// Update production line status
router.post("/production-line/status", async (req, res) => {
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
router.post("/production-line/metrics", async (req, res) => {
  try {
    const metrics = req.body;
    const result = await addProductionMetrics(metrics);
    res.json(result);
  } catch (error) {
    console.error("Failed to add production metrics:", error);
    res.status(500).json({ error: "Failed to add production metrics" });
  }
});

export default router;
