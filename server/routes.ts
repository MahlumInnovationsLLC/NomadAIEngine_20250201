import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { notifications, userNotifications, equipment, equipmentTypes } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";
import { setupWebSocketServer } from "./services/websocket";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const wsServer = setupWebSocketServer(httpServer);

  // Clean up WebSocket server when HTTP server closes
  httpServer.on('close', () => {
    wsServer.close();
  });

  // Example equipment data route
  app.get("/api/equipment", async (_req, res) => {
    try {
      // Return sample equipment data
      const sampleEquipment = [
        {
          id: 1,
          name: "Treadmill X-1000",
          status: "active",
          healthScore: 95.5,
          lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          nextMaintenance: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
          maintenanceType: "Regular checkup",
          deviceConnectionStatus: "connected",
          position: { x: 10, y: 20 }
        },
        {
          id: 2,
          name: "Elliptical E-2000",
          status: "maintenance",
          healthScore: 75.0,
          lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          nextMaintenance: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          maintenanceType: "Belt replacement",
          deviceConnectionStatus: "connected",
          position: { x: 30, y: 40 }
        },
        {
          id: 3,
          name: "Rowing Machine R-500",
          status: "error",
          healthScore: 45.5,
          lastMaintenance: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          nextMaintenance: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          maintenanceType: "Urgent repair",
          deviceConnectionStatus: "disconnected",
          position: { x: 50, y: 60 }
        },
        {
          id: 4,
          name: "Strength Station S-3000",
          status: "active",
          healthScore: 88.5,
          lastMaintenance: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          nextMaintenance: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          maintenanceType: "Regular checkup",
          deviceConnectionStatus: "connected",
          position: { x: 70, y: 80 }
        },
        {
          id: 5,
          name: "Cycling Bike C-800",
          status: "active",
          healthScore: 92.0,
          lastMaintenance: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          nextMaintenance: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          maintenanceType: "Regular checkup",
          deviceConnectionStatus: "connected",
          position: { x: 90, y: 100 }
        }
      ];

      res.json(sampleEquipment);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });

  // Notification broadcast function
  async function broadcastNotification(notification: typeof notifications.$inferInsert, userIds: string[]) {
    try {
      // Insert notification
      const [createdNotification] = await db.insert(notifications)
        .values(notification)
        .returning();

      // Create user notifications
      await db.insert(userNotifications)
        .values(userIds.map(userId => ({
          userId,
          notificationId: createdNotification.id,
        })));

      // Broadcast to connected clients
      wsServer.broadcast(userIds, {
        type: 'notification',
        data: createdNotification,
      });

      return createdNotification;
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      throw error;
    }
  }

  // Notification API routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const userNotifs = await db.query.userNotifications.findMany({
        where: eq(userNotifications.userId, userId),
        with: {
          notification: true,
        },
        orderBy: [desc(userNotifications.createdAt)],
      });

      res.json(userNotifs);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/mark-read", async (req, res) => {
    try {
      const { userId, notificationIds } = req.body;

      await db.update(userNotifications)
        .set({
          read: true,
          readAt: new Date(),
        })
        .where(and(
          eq(userNotifications.userId, userId),
          eq(userNotifications.notificationId, notificationIds)
        ));

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  });

  // Training Module Routes
  app.post("/api/training/assign-module", async (req, res) => {
    try {
      const { userId, moduleId } = req.body;

      // Then send notification
      await broadcastNotification({
        type: 'module_assigned',
        title: 'New Training Module Assigned',
        message: `A new training module has been assigned to you.`,
        priority: 'medium',
        metadata: { moduleId },
      }, [userId]);

      res.json({
        success: true,
        message: "Module assigned successfully",
        assignment: { userId, moduleId, assignedAt: new Date() }
      });
    } catch (error) {
      console.error("Error assigning module:", error);
      res.status(500).json({ error: "Failed to assign module" });
    }
  });

  app.get("/api/training/progress", async (_req, res) => {
    try {
      // Return sample training progress data
      const progressData = {
        currentLevel: 2,
        currentExp: 750,
        nextLevelExp: 1000,
        modules: [
          {
            id: "module-1",
            title: "Azure Blob Storage Fundamentals",
            description: "Learn the basics of Azure Blob Storage and how to use it effectively",
            completedLessons: 2,
            totalLessons: 5,
            requiredLevel: 1
          },
          {
            id: "module-2",
            title: "Advanced Blob Storage Features",
            description: "Explore advanced features and best practices for Azure Blob Storage",
            completedLessons: 0,
            totalLessons: 4,
            requiredLevel: 2
          }
        ],
        recentActivity: [
          {
            id: "activity-1",
            description: "Completed Introduction to Azure Blob Storage",
            timestamp: new Date().toISOString(),
            type: "completion"
          },
          {
            id: "activity-2",
            description: "Started Advanced Blob Storage Features",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            type: "start"
          }
        ]
      };

      res.json(progressData);
    } catch (error) {
      console.error("Error fetching training progress:", error);
      res.status(500).json({ error: "Failed to fetch training progress" });
    }
  });

  return httpServer;
}