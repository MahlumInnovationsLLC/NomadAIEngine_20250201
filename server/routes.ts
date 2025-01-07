import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { equipment, equipmentTypes } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

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

  app.patch("/api/equipment/:id", async (req, res) => {
    try {
      const result = await db.update(equipment)
        .set({
          name: req.body.name,
          deviceType: req.body.deviceType,
          deviceIdentifier: req.body.deviceIdentifier,
          deviceConnectionStatus: req.body.deviceConnectionStatus,
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