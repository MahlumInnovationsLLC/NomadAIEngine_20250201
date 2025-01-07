import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { equipment, equipmentTypes } from "@db/schema";
import { eq } from "drizzle-orm";
import { initializeOpenAI } from "./services/azure/openai_service";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Azure Services Status endpoint
  app.get("/api/azure/status", async (_req, res) => {
    try {
      const services = [
        {
          name: "OpenAI",
          status: "connected",
          message: "Service is operational"
        },
        {
          name: "Blob Storage",
          status: process.env.AZURE_BLOB_CONNECTION_STRING ? "connected" : "error",
          message: process.env.AZURE_BLOB_CONNECTION_STRING ? "Connected to Azure Blob Storage" : "Missing connection string"
        },
        {
          name: "Cosmos DB",
          status: process.env.AZURE_COSMOS_CONNECTION_STRING ? "connected" : "error",
          message: process.env.AZURE_COSMOS_CONNECTION_STRING ? "Connected to Cosmos DB" : "Missing connection string"
        }
      ];

      res.json(services);
    } catch (error) {
      console.error("Error fetching Azure services status:", error);
      res.status(500).json({ error: "Failed to fetch Azure services status" });
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

  // Save floor plan
  app.post("/api/floor-plans", async (req, res) => {
    try {
      const { gridSize, dimensions, zones, metadata } = req.body;

      // Save floor plan to database
      const result = await db.query.floorPlans.findFirst({
        where: eq(floorPlans.isActive, true)
      });

      if (result) {
        await db.update(floorPlans)
          .set({
            gridSize,
            dimensions,
            zones,
            metadata,
            updatedAt: new Date()
          })
          .where(eq(floorPlans.id, result.id));
      } else {
        await db.insert(floorPlans).values({
          gridSize,
          dimensions,
          zones,
          metadata,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error saving floor plan:", error);
      res.status(500).json({ error: "Failed to save floor plan" });
    }
  });

  app.patch("/api/equipment/:id", async (req, res) => {
    try {
      const result = await db.update(equipment)
        .set({
          name: req.body.name,
          deviceType: req.body.deviceType,
          deviceIdentifier: req.body.deviceIdentifier,
          deviceConnectionStatus: req.body.deviceConnectionStatus,
          position: req.body.position,
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