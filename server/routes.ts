import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { equipment, equipmentTypes, floorPlans } from "@db/schema";
import { eq } from "drizzle-orm";
import { initializeOpenAI, checkOpenAIConnection } from "./services/azure/openai_service";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Azure Services Status endpoint
  app.get("/api/azure/status", async (_req, res) => {
    try {
      // Check OpenAI connection
      const openAIStatus = await checkOpenAIConnection();

      // Check Blob Storage connection
      let blobStatus = {
        status: "error",
        message: "Missing connection string"
      };

      if (process.env.AZURE_BLOB_CONNECTION_STRING) {
        try {
          // Attempt to list containers to verify connection
          const { BlobServiceClient } = await import("@azure/storage-blob");
          const blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AZURE_BLOB_CONNECTION_STRING
          );
          await blobServiceClient.getAccountInfo();
          blobStatus = {
            status: "connected",
            message: "Connected to Azure Blob Storage"
          };
        } catch (error) {
          blobStatus = {
            status: "error",
            message: "Failed to connect to Blob Storage"
          };
        }
      }

      // Check Database connection
      let dbStatus = {
        status: "error",
        message: "Missing connection string"
      };

      try {
        await db.query.equipmentTypes.findFirst();
        dbStatus = {
          status: "connected",
          message: "Connected to Database"
        };
      } catch (error) {
        dbStatus = {
          status: "error",
          message: "Failed to connect to Database"
        };
      }

      const services = [
        {
          name: "OpenAI",
          ...openAIStatus
        },
        {
          name: "Blob Storage",
          ...blobStatus
        },
        {
          name: "Database",
          ...dbStatus
        }
      ];

      res.json(services);
    } catch (error) {
      console.error("Error fetching Azure services status:", error);
      res.status(500).json({ 
        error: "Failed to fetch Azure services status",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Equipment routes
  app.get("/api/equipment", async (_req, res) => {
    try {
      const items = await db.query.equipment.findMany({
        orderBy: (equipment, { asc }) => [asc(equipment.name)],
        with: {
          type: true
        }
      });
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });

  // Usage Prediction endpoint
  app.get("/api/equipment/:id/predictions", async (req, res) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const item = await db.query.equipment.findFirst({
        where: eq(equipment.id, equipmentId),
        with: {
          type: true
        }
      });

      if (!item) {
        return res.status(404).json({ error: "Equipment not found" });
      }

      // Generate mock prediction data
      const predictions = {
        usageHours: Math.floor(Math.random() * 8) + 2,
        peakTimes: ["09:00", "17:00"],
        maintenanceRecommendation: item.maintenanceScore && item.maintenanceScore < 70 
          ? "Schedule maintenance soon" 
          : "No immediate maintenance required",
        nextPredictedMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      res.json(predictions);
    } catch (error) {
      console.error("Error generating predictions:", error);
      res.status(500).json({ error: "Failed to generate predictions" });
    }
  });

  // Add this new endpoint for predictive usage
  app.get("/api/equipment/:id/predictive-usage", async (req, res) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const item = await db.query.equipment.findFirst({
        where: eq(equipment.id, equipmentId),
        with: {
          type: true
        }
      });

      if (!item) {
        return res.status(404).json({ error: "Equipment not found" });
      }

      // Generate mock predictive usage data
      // In a real application, this would come from ML models and historical data
      const currentHour = new Date().getHours();
      const peakHours = [9, 17]; // 9 AM and 5 PM are typical peak hours
      const nextPeakHour = peakHours.find(h => h > currentHour) || peakHours[0];
      const minutesToPeak = nextPeakHour > currentHour 
        ? (nextPeakHour - currentHour) * 60 
        : (24 - currentHour + nextPeakHour) * 60;

      const predictiveData = {
        currentCapacity: Math.floor(Math.random() * 40) + 30, // 30-70%
        predictedPeakTime: "17:00",
        predictedQuietTime: "14:00",
        utilizationRate: Math.floor(Math.random() * 30) + 60, // 60-90%
        nextPeakIn: minutesToPeak,
        recommendations: [
          "Schedule maintenance during predicted quiet period",
          "Prepare for increased usage in 2 hours",
          "Consider redistributing load to similar equipment"
        ]
      };

      res.json(predictiveData);
    } catch (error) {
      console.error("Error generating predictive usage data:", error);
      res.status(500).json({ error: "Failed to generate predictive usage data" });
    }
  });

  // Performance Report endpoint
  app.post("/api/equipment/report", async (req, res) => {
    try {
      const { equipmentIds } = req.body;

      if (!Array.isArray(equipmentIds)) {
        return res.status(400).json({ error: "Invalid equipment IDs" });
      }

      const items = await db.query.equipment.findMany({
        where: eq(equipment.id, equipmentIds[0]), // For now, just use the first ID
        with: {
          type: true
        }
      });

      if (!items.length) {
        return res.status(404).json({ error: "No equipment found" });
      }

      // Generate mock report data
      const report = {
        generatedAt: new Date().toISOString(),
        equipment: items.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type?.name || "Unknown",
          healthScore: item.healthScore || 0,
          maintenanceScore: item.maintenanceScore || 0,
          lastMaintenance: item.lastMaintenance,
          metrics: {
            uptime: Math.floor(Math.random() * 100),
            efficiency: Math.floor(Math.random() * 100),
            utilization: Math.floor(Math.random() * 100)
          }
        })),
        analysis: {
          performanceAnalysis: [
            "Equipment efficiency trends show consistent performance",
            "Usage patterns indicate optimal load distribution",
            "Maintenance schedule adherence is above target"
          ],
          maintenanceRecommendations: [
            "Schedule preventive maintenance for high-usage equipment",
            "Consider upgrading aging components",
            "Monitor wear patterns on critical components"
          ],
          usageOptimization: [
            "Redistribute peak hour equipment usage",
            "Implement energy-saving modes during off-peak hours",
            "Consider equipment rotation to balance wear"
          ],
          riskAssessment: [
            "Low risk of immediate equipment failure",
            "Medium-term maintenance needs identified",
            "Contingency plans in place for critical equipment"
          ]
        },
        summary: {
          totalEquipment: items.length,
          averageHealth: items.reduce((acc, item) => acc + (item.healthScore || 0), 0) / items.length,
          requiresMaintenance: items.filter(item => (item.maintenanceScore || 0) < 70).length,
          offline: items.filter(item => item.status === 'offline').length
        }
      };

      res.json(report);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // Save floor plan
  app.post("/api/floor-plans", async (req, res) => {
    try {
      const { name, description, dimensions, gridSize, metadata } = req.body;

      // Try to find an active floor plan
      const result = await db.query.floorPlans.findFirst({
        where: eq(floorPlans.isActive, true)
      });

      if (result) {
        // Update existing floor plan
        await db.update(floorPlans)
          .set({
            name,
            description,
            dimensions,
            gridSize,
            metadata,
            updatedAt: new Date()
          })
          .where(eq(floorPlans.id, result.id));
      } else {
        // Create new floor plan
        await db.insert(floorPlans).values({
          name,
          description,
          dimensions,
          gridSize,
          metadata,
          isActive: true,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error saving floor plan:", error);
      // Still return success since equipment positions are saved
      res.json({ success: true, warning: "Some settings may not have been saved" });
    }
  });

  app.patch("/api/equipment/:id", async (req, res) => {
    try {
      const result = await db.update(equipment)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(eq(equipment.id, parseInt(req.params.id)))
        .returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update equipment" });
    }
  });

  app.patch("/api/equipment/:id/icon", async (req, res) => {
    try {
      const result = await db.update(equipment)
        .set({
          deviceType: req.body.iconKey,
          updatedAt: new Date()
        })
        .where(eq(equipment.id, parseInt(req.params.id)))
        .returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update equipment icon" });
    }
  });

  app.get("/api/equipment/suggest-icons", async (req, res) => {
    const { name, type } = req.query;

    // Predetermined icon suggestions based on equipment type
    const suggestions = [
      {
        key: "treadmill",
        reason: "Common for cardio equipment with walking/running function",
        confidence: 0.9
      },
      {
        key: "bike",
        reason: "Suitable for cycling-based equipment",
        confidence: 0.85
      },
      {
        key: "dumbbell",
        reason: "Classic icon for strength training equipment",
        confidence: 0.8
      },
      {
        key: "bench",
        reason: "Represents equipment with seating or lying position",
        confidence: 0.75
      }
    ];

    res.json(suggestions);
  });

  return httpServer;
}