import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { notifications, userNotifications } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";
import { setupWebSocketServer } from "./services/websocket";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const wsServer = setupWebSocketServer(httpServer);

  // Clean up WebSocket server when HTTP server closes
  httpServer.on('close', () => {
    wsServer.close();
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