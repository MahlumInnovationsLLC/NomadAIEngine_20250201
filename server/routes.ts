import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { equipment, equipmentTypes, floorPlans, documents, documentVersions, trainingModules, skills, skillAssessments, requiredSkills, userRoles, userSkills, notifications, userNotifications } from "@db/schema";
import { eq, lt, gt, and, asc, desc } from "drizzle-orm";
import { WebSocket, WebSocketServer } from 'ws';
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import multer from "multer";
import { createHash } from "crypto";
import { initializeOpenAI, checkOpenAIConnection } from "./services/azure/openai_service";

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Azure Blob Storage
async function initializeBlobStorage(): Promise<ContainerClient> {
  try {
    if (!process.env.AZURE_BLOB_CONNECTION_STRING) {
      throw new Error("Azure Blob Storage connection string not configured");
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_BLOB_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient('documents');
    await containerClient.createIfNotExists();

    return containerClient;
  } catch (error) {
    console.error("Error initializing blob storage:", error);
    throw error;
  }
}

async function uploadDocument(buffer: Buffer, fileName: string, metadata: any) {
  try {
    const containerClient = await initializeBlobStorage();
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.uploadData(buffer, {
      metadata,
      blobHTTPHeaders: {
        blobContentType: metadata.mimeType || 'application/octet-stream'
      }
    });

    const checksum = createHash('md5').update(buffer).digest('hex');

    return {
      url: blockBlobClient.url,
      path: fileName,
      size: buffer.length,
      checksum
    };
  } catch (error) {
    console.error("Error uploading document:", error);
    return null;
  }
}

async function downloadDocument(blobPath: string) {
  try {
    const containerClient = await initializeBlobStorage();
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    const downloadResponse = await blockBlobClient.download(0);
    const chunks: Buffer[] = [];

    for await (const chunk of downloadResponse.readableStreamBody!) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error("Error downloading document:", error);
    throw error;
  }
}

async function getDocumentMetadata(blobPath: string) {
  try {
    const containerClient = await initializeBlobStorage();
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    const properties = await blockBlobClient.getProperties();
    return properties.metadata;
  } catch (error) {
    console.error("Error getting document metadata:", error);
    return null;
  }
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const clients = new Map<string, WebSocket>();

  // Initialize WebSocket server
  const wss = new WebSocketServer({
    noServer: true,
    perMessageDeflate: false
  });

  // Handle WebSocket upgrade requests
  httpServer.on('upgrade', function upgrade(request, socket, head) {
    // Skip vite HMR connections
    if (request.headers['sec-websocket-protocol'] === 'vite-hmr') {
      return;
    }

    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const pathname = url.pathname;

    if (pathname === '/ws') {
      const userId = url.searchParams.get('userId');
      if (!userId) {
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, function done(ws) {
        // Remove existing connection for this user if any
        const existingClient = clients.get(userId);
        if (existingClient) {
          try {
            existingClient.terminate();
          } catch (e) {
            console.error('Error closing existing connection:', e);
          }
          clients.delete(userId);
        }

        // Store the new connection
        clients.set(userId, ws);

        // Handle connection close
        ws.on('close', () => {
          if (clients.get(userId) === ws) {
            clients.delete(userId);
          }
        });

        // Handle connection errors
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          if (clients.get(userId) === ws) {
            clients.delete(userId);
          }
        });
      });
    }
  });

  // Clean up on server close
  httpServer.on('close', () => {
    for (const client of clients.values()) {
      try {
        client.terminate();
      } catch (e) {
        console.error('Error closing client connection:', e);
      }
    }
    clients.clear();
    wss.close();
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
      userIds.forEach(userId => {
        const client = clients.get(userId);
        if (client?.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'notification',
            data: createdNotification,
          }));
        }
      });

      return createdNotification;
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      throw error;
    }
  }

  // Rest of your route handlers...
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

  // Module assignment with notifications
  app.post("/api/training/assign-module", async (req, res) => {
    try {
      const { userId, moduleId } = req.body;

      // First, create the training assignment
      await db.insert(userRoles).values({
        userId,
        roleId: moduleId,
        assignedBy: 'system',
      });

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