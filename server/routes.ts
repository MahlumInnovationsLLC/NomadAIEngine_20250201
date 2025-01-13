import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import multer from "multer";
import { v4 as uuidv4 } from 'uuid';
import { db } from "@db";
import { eq, and, sql } from "drizzle-orm";
import {
  documentWorkflows,
  documentApprovals,
  documentPermissions,
  roles,
  userTraining,
  aiEngineActivity,
  equipment
} from "@db/schema";

// Import services
import { analyzeDocument, checkOpenAIConnection } from "./services/azure/openai_service";
import { getStorageMetrics, getRecentActivity } from "./services/azure/blob_service";
import {
  getAllEquipment,
  createEquipment,
  updateEquipment,
} from "./services/azure/equipment_service";
import { setupWebSocketServer } from "./services/websocket";
import { generateReport, generateEquipmentReport } from "./services/report_generator";
import { azureBlobStorage, CONTAINERS } from "./services/azure/blob_storage_service";

// Types
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
  body: any;
}

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export function registerRoutes(app: Express): Server {
  console.log("Starting routes registration...");

  try {
    // Create HTTP server first
    const httpServer = createServer(app);

    // Set up Socket.IO server
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      path: "/socket.io/"
    });

    // Set up middleware
    app.use('/uploads', express.static('uploads'));

    // Authentication middleware (temporary for development)
    app.use((req: AuthenticatedRequest, res, next) => {
      req.user = { id: '1', username: 'test_user' };
      next();
    });

    // Equipment Operations
    app.get("/api/equipment", async (req, res) => {
      try {
        const equipment = await getAllEquipment();
        res.json(equipment);
      } catch (error) {
        console.error("Error getting equipment:", error);
        res.status(500).json({
          error: "Failed to get equipment",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    app.post("/api/equipment", async (req, res) => {
      try {
        const equipmentData = req.body;
        const newEquipment = await createEquipment(equipmentData);
        res.json(newEquipment);
      } catch (error) {
        console.error("Error creating equipment:", error);
        res.status(500).json({
          error: "Failed to create equipment",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    app.patch("/api/equipment/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;
        const updatedEquipment = await updateEquipment(id, updates);
        if (!updatedEquipment) {
          return res.status(404).json({ error: "Equipment not found" });
        }
        res.json(updatedEquipment);
      } catch (error) {
        console.error("Error updating equipment:", error);
        res.status(500).json({
          error: "Failed to update equipment",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Generate detailed report endpoint
    app.post("/api/generate-report", async (req: AuthenticatedRequest, res) => {
      try {
        const { topic } = req.body;

        if (!topic) {
          return res.status(400).json({ error: "Topic is required" });
        }

        console.log(`Generating report for topic: ${topic}`);
        const filename = await generateReport(topic);

        if (!filename) {
          throw new Error("Failed to generate report");
        }

        // Track AI usage for report generation (assuming it takes about 2 minutes)
        await trackAIEngineUsage(req.user!.id, 'report_generation', 2, { topic });

        res.json({
          success: true,
          filename,
          downloadUrl: `/uploads/${filename}`
        });
      } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({
          error: "Failed to generate report",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Messages endpoint
    app.post("/api/messages", async (req: AuthenticatedRequest, res) => {
      try {
        console.log("Received message request:", req.body);
        const { content } = req.body;

        if (!content) {
          console.log("Missing content in request");
          return res.status(400).json({ error: "Content is required" });
        }

        // Track AI usage for chat (assuming it takes about 0.5 minutes per message)
        await trackAIEngineUsage(req.user!.id, 'chat', 0.5, { messageLength: content.length });

        // Generate user message
        const userMessage = {
          id: uuidv4(),
          role: 'user',
          content,
          createdAt: new Date().toISOString()
        };

        console.log("Generated user message:", userMessage);

        // Check if user is requesting a downloadable report
        const isReportRequest = content.toLowerCase().includes('report') ||
          content.toLowerCase().includes('document') ||
          content.toLowerCase().includes('download');

        // Get AI response using Azure OpenAI
        let aiResponse;
        let downloadUrl;
        try {
          console.log("Getting AI response for content:", content);
          aiResponse = await analyzeDocument(content);
          console.log("Received AI response:", aiResponse);

          // If this is a report request, generate a downloadable document
          if (isReportRequest && aiResponse) {
            console.log("Generating downloadable report...");
            const filename = await generateReport(aiResponse);
            if (filename) {
              downloadUrl = `/uploads/${filename}`;
              aiResponse = `${aiResponse}\n\nI've prepared a detailed report for you. You can download it here: [Download Report](${downloadUrl})`;
            }
          }
        } catch (error) {
          console.error("Error getting AI response:", error);
          aiResponse = "I apologize, but I'm having trouble processing your request at the moment. Could you please try again?";
        }

        // Create AI message
        const aiMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: aiResponse || "I apologize, but I'm having trouble understanding your request. Could you please rephrase it?",
          createdAt: new Date().toISOString()
        };

        console.log("Generated AI message:", aiMessage);
        console.log("Sending response with both messages");

        res.json([userMessage, aiMessage]);
      } catch (error: any) {
        console.error("Error processing message:", error);
        res.status(500).json({ error: "Failed to process message", details: error.message });
      }
    });

    // Check Azure OpenAI connection status
    app.get("/api/azure/status", async (req, res) => {
      try {
        console.log("Checking Azure services status...");
        const status = await checkOpenAIConnection();
        res.json(status);
      } catch (error) {
        console.error("Error checking Azure OpenAI status:", error);
        res.status(500).json({
          status: "error",
          message: "Failed to check Azure OpenAI status",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Add dashboard metrics endpoint
    app.get("/api/dashboard/stats", async (req, res) => {
      try {
        const [storageMetrics, azureStatus] = await Promise.all([
          getStorageMetrics(),
          checkOpenAIConnection()
        ]);

        const stats = {
          totalDocuments: storageMetrics.totalDocuments,
          totalStorageSize: storageMetrics.totalSize,
          documentTypes: storageMetrics.documentTypes,
          aiServiceStatus: azureStatus.some(s => s.name === "Azure OpenAI" && s.status === "connected"),
          storageStatus: azureStatus.some(s => s.name === "Azure Blob Storage" && s.status === "connected"),
        };

        res.json(stats);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ error: "Failed to fetch dashboard statistics" });
      }
    });

    app.get("/api/dashboard/activity", async (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 10;
        const recentActivity = await getRecentActivity(limit);
        res.json(recentActivity);
      } catch (error) {
        console.error("Error fetching activity:", error);
        res.status(500).json({ error: "Failed to fetch activity" });
      }
    });

    // Dashboard extended stats endpoint
    app.get("/api/dashboard/extended-stats", async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.user) {
          return res.status(401).send("Not authenticated");
        }

        const userId = req.user.id;

        // Get user's training level
        const trainingLevel = await getUserTrainingLevel(userId);

        // Get AI Engine usage statistics for the past 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const aiActivities = await db
          .select({
            date: aiEngineActivity.startTime,
            duration: aiEngineActivity.durationMinutes,
          })
          .from(aiEngineActivity)
          .where(
            and(
              eq(aiEngineActivity.userId, userId),
              sql`${aiEngineActivity.startTime} >= ${sevenDaysAgo}`,
              sql`${aiEngineActivity.startTime} <= ${new Date()}`
            )
          );

        // Initialize all days in the past week with 0
        const dailyUsage = new Map<string, number>();
        for (let i = 0; i < 7; i++) {
          const date = new Date(sevenDaysAgo);
          date.setDate(date.getDate() + i);
          dailyUsage.set(date.toISOString().split('T')[0], 0);
        }

        // Add actual usage data
        aiActivities.forEach(activity => {
          const day = activity.date.toISOString().split('T')[0];
          const duration = parseFloat(activity.duration?.toString() || "0");
          dailyUsage.set(day, (dailyUsage.get(day) || 0) + duration);
        });

        const extendedStats = {
          collaborators: 5, // Placeholder until user management is implemented
          chatActivity: {
            totalResponses: 0,
            downloadedReports: 0
          },
          trainingLevel,
          incompleteTasks: 0,
          aiEngineUsage: Array.from(dailyUsage.entries()).map(([date, minutes]) => ({
            date,
            minutes: Math.round(minutes * 100) / 100
          })).sort((a, b) => a.date.localeCompare(b.date))
        };

        // Get activity logs to count chat responses and downloaded reports
        try {
          const activityLogs = await getRecentActivity(100); // Get last 100 activities
          for (const activity of activityLogs) {
            if (activity.type === 'download' && activity.documentName.includes('report')) {
              extendedStats.chatActivity.downloadedReports++;
            } else if (activity.type === 'view' && activity.documentName.includes('chat')) {
              extendedStats.chatActivity.totalResponses++;
            }
          }
        } catch (error) {
          console.warn("Error counting activity logs:", error);
          // Continue with default values if activity logs can't be counted
        }

        res.json(extendedStats);
      } catch (error) {
        console.error("Error fetching extended stats:", error);
        res.status(500).json({ error: "Failed to fetch extended statistics" });
      }
    });

    // Chat history endpoint  (Removed Cosmos DB related parts)
    app.get("/api/chats", async (req, res) => {
      try {
        //  Cosmos DB chat listing removed
        res.json([]); // Return empty array for now
      } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ error: "Failed to fetch chats" });
      }
    });


    // Update blob storage related routes to use the new service
    app.get("/api/documents/browse", async (req, res) => {
      try {
        console.log("Listing blobs from container:", CONTAINERS.DOCUMENTS);
        const path = (req.query.path as string) || "";
        console.log("Browsing path:", path);

        if (!azureBlobStorage.isInitialized()) {
          return res.status(503).json({ error: "Blob storage not available" });
        }

        const containerClient = azureBlobStorage.getContainerClient(CONTAINERS.DOCUMENTS);
        if (!containerClient) {
          return res.status(503).json({ error: "Documents container not available" });
        }

        // List all blobs in the path
        const items = [];
        const blobs = containerClient.listBlobsFlat({ prefix: path });

        for await (const blob of blobs) {
          const name = blob.name.split('/').pop() || '';
          if (!name.startsWith('.folder')) {
            items.push({
              name,
              path: blob.name,
              type: "file",
              size: blob.properties.contentLength,
              lastModified: blob.properties.lastModified?.toISOString()
            });
          }
        }

        res.json(items);
      } catch (error) {
        console.error("Error listing blobs:", error);
        res.status(500).json({ error: "Failed to list documents" });
      }
    });

    app.post("/api/documents/upload", upload.array('files'), async (req, res) => {
      try {
        if (!azureBlobStorage.isInitialized()) {
          return res.status(503).json({ error: "Blob storage not available" });
        }

        const path = req.body.path || "";
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
          return res.status(400).json({ error: "No files provided" });
        }

        console.log("Uploading files to container:", CONTAINERS.DOCUMENTS, "path:", path);
        console.log("Files to upload:", files.map(f => f.originalname));

        const uploadPromises = files.map(async (file) => {
          const blobName = path ? `${path}/${file.originalname}` : file.originalname;
          const success = await azureBlobStorage.uploadBlob(
            CONTAINERS.DOCUMENTS,
            blobName,
            file.buffer
          );
          return success ? blobName : null;
        });

        const results = await Promise.all(uploadPromises);
        const uploadedFiles = results.filter(Boolean);

        if (uploadedFiles.length === 0) {
          return res.status(500).json({ error: "Failed to upload files" });
        }

        console.log("Successfully uploaded files:", uploadedFiles);
        res.json({ message: "Files uploaded successfully", files: uploadedFiles });
      } catch (error) {
        console.error("Error uploading files:", error);
        res.status(500).json({ error: "Failed to upload files" });
      }
    });

    // Add folder creation endpoint
    app.post("/api/documents/folders", async (req, res) => {
      try {
        const { path } = req.body;

        if (!path) {
          return res.status(400).json({ error: "Path is required" });
        }

        console.log("Creating folder:", path);

        if (azureBlobStorage.isInitialized()) {
          // Create a zero-length blob with the folder name as prefix
          const folderPath = path.endsWith('/') ? path : `${path}/`;
          const success = await azureBlobStorage.createFolder(CONTAINERS.DOCUMENTS, folderPath);
          if(success){
            console.log("Successfully created folder:", path);
            res.json({ message: "Folder created successfully", path });
          } else {
            res.status(500).json({ error: "Failed to create folder" });
          }
        } else {
          res.status(500).json({ error: "Blob storage not initialized" });
        }
      } catch (error) {
        console.error("Error creating folder:", error);
        res.status(500).json({ error: "Failed to create folder" });
      }
    });

    // Add new endpoint to get user's training level
    app.get("/api/training/level", async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.user) {
          return res.status(401).send("Not authenticated");
        }

        const trainingLevel = await getUserTrainingLevel(req.user.id);
        res.json(trainingLevel);
      } catch (error) {
        console.error("Error getting training level:", error);
        res.status(500).json({ error: "Failed to get training level" });
      }
    });

    // Update training progress endpoint
    app.post("/api/training/progress", async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.user) {
          return res.status(401).send("Not authenticated");
        }

        const { moduleId, progress, status } = req.body;

        // Update the training progress
        await db
          .insert(userTraining)
          .values({
            userId: req.user.id,
            moduleId,
            progress,
            status,
            assignedBy: req.user.id,
          })
          .onConflictDoUpdate({
            target: [userTraining.userId, userTraining.moduleId],
            set: {
              progress,
              status,
              completedAt: status === 'completed' ? new Date() : undefined,
            },
          });

        // Since broadcastTrainingLevel is not implemented, we'll skip it for now
        // TODO: Implement training level broadcast in websocket service

        res.json({ message: "Training progress updated successfully" });
      } catch (error) {
        console.error("Error updating training progress:", error);
        res.status(500).json({ error: "Failed to update training progress" });
      }
    });

    // Add document content endpoint
    app.get("/api/documents/:documentPath(*)/content", async (req, res) => {
      try {
        const documentPath = req.params.documentPath;
        console.log("Fetching document content for:", documentPath);

        if (azureBlobStorage.isInitialized()) {
          const blob = await azureBlobStorage.getBlob(CONTAINERS.DOCUMENTS, documentPath);
          if (!blob) {
            return res.status(404).json({ error: "Document not found" });
          }
          res.json({
            content: blob.content,
            revision: blob.metadata?.revision,
          });
        } else {
          res.status(500).json({ error: "Blob storage not initialized" });
        }
      } catch (error) {
        console.error("Error fetching document content:", error);
        res.status(500).json({ error: "Failed to fetch document content" });
      }
    });

    // Add document content update endpoint
    app.put("/api/documents/:documentPath(*)/content", async (req, res) => {
      try {
        const documentPath = req.params.documentPath;
        const { content, revision } = req.body;

        if (!content) {
          return res.status(400).json({ error: "Content is required" });
        }

        console.log("Updating document content for:", documentPath);

        if (azureBlobStorage.isInitialized()) {
          const success = await azureBlobStorage.updateBlob(CONTAINERS.DOCUMENTS, documentPath, content, { revision });
          if(success){
            res.json({ message: "Document updated successfully" });
          } else {
            res.status(500).json({ error: "Failed to update document" });
          }
        } else {
          res.status(500).json({ error: "Blob storage not initialized" });
        }
      } catch (error) {
        console.error("Error updating document content:", error);
        res.status(500).json({ error: "Failed to update document content" });
      }
    });

    // Add workflow endpoint
    app.post("/api/documents/workflow", async (req, res) => {
      try {
        const { documentId, type, assigneeId } = req.body;

        if (!documentId || !type || !assigneeId) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Create workflow entry
        const [workflow] = await db
          .insert(documentWorkflows)
          .values({
            documentId: parseInt(documentId),
            status: 'active',
            startedAt: new Date(),
          })
          .returning();

        // Create approval entry
        await db
          .insert(documentApprovals)
          .values({
            documentId: parseInt(documentId),
            version: '1.0', // This should come from the document metadata
            approverUserId: assigneeId,
            status: 'pending',
          });

        // TODO: Send email notification
        // This would integrate with your email service

        res.json({
          message: `Document sent for ${type}`,
          workflowId: workflow.id,
        });
      } catch (error) {
        console.error("Error creating workflow:", error);
        res.status(500).json({ error: "Failed to create workflow" });
      }
    });

    // Add workflow status endpoint
    app.get("/api/documents/workflow/:documentId", async (req, res) => {
      try {
        const documentId = parseInt(req.params.documentId);

        const [latestWorkflow] = await db
          .select({
            status: documentWorkflows.status,
            startedAt: documentWorkflows.startedAt,
            completedAt: documentWorkflows.completedAt,
          })
          .from(documentWorkflows)
          .where(eq(documentWorkflows.documentId, documentId))
          .orderBy(documentWorkflows.startedAt, 'desc')
          .limit(1);

        if (!latestWorkflow) {
          return res.json({
            status: 'draft',
            updatedAt: new Date().toISOString(),
          });
        }

        const [latestApproval] = await db
          .select()
          .from(documentApprovals)
          .where(eq(documentApprovals.documentId, documentId))
          .orderBy(documentApprovals.createdAt, 'desc')
          .limit(1);

        res.json({
          status: latestApproval?.status || 'draft',
          reviewedBy: latestApproval?.approverUserId,
          approvedBy: latestApproval?.status === 'approved' ? latestApproval.approverUserId : undefined,
          updatedAt: latestWorkflow.startedAt.toISOString(),
        });
      } catch (error) {
        console.error("Error fetching workflow status:", error);
        res.status(500).json({ error: "Failed to fetch workflow status" });
      }
    });

    // Add workflow action endpoint (for handling review/approve actions)
    app.post("/api/documents/workflow/:documentId/action", async (req, res) => {
      try {
        const documentId = parseInt(req.params.documentId);
        const { action, userId, comments } = req.body;

        if (!documentId || !action || !userId) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Update approval status
        await db
          .update(documentApprovals)
          .set({
            status: action,
            comments,
            approvedAt: action === 'approved' ? new Date() : undefined,
          })
          .where(eq(documentApprovals.documentId, documentId))
          .where(eq(documentApprovals.approverUserId, userId));

        // If approved, update workflow status
        if (action === 'approved') {
          await db
            .update(documentWorkflows)
            .set({
              status: 'completed',
              completedAt: new Date(),
            })
            .where(eq(documentWorkflows.documentId, documentId));
        }

        res.json({
          message: `Document ${action} successfully`,
        });
      } catch (error) {
        console.error("Error updating workflow status:", error);
        res.status(500).json({ error: "Failed to update workflow status" });
      }
    });

    // Add document permissions endpoints
    app.get("/api/documents/:documentId/permissions", async (req, res) => {
      try {
        const documentId = parseInt(req.params.documentId);

        const permissions = await db
          .select()
          .from(documentPermissions)
          .where(eq(documentPermissions.documentId, documentId));

        // Enhance permissions with detailed access information
        const enhancedPermissions = permissions.map(permission => ({
          id: permission.id,
          roleLevel: permission.roleLevel,
          permissions: {
            view: true, // Base level permission
            edit: permission.roleLevel >= 2,
            review: permission.roleLevel >= 3,
            approve: permission.roleLevel >= 4,
            manage: permission.roleLevel >= 5,
          }
        }));

        res.json(enhancedPermissions);
      } catch (error) {
        console.error("Error fetching document permissions:", error);
        res.status(500).json({ error: "Failed to fetch permissions" });
      }
    });

    app.post("/api/documents/:documentId/permissions", async (req, res) => {
      try {
        const documentId = parseInt(req.params.documentId);
        const { roleLevel } = req.body;

        if (!roleLevel) {
          return res.status(400).json({ error: "Role level is required" });
        }

        // Check if permission already exists
        const [existingPermission] = await db
          .select()
          .from(documentPermissions)
          .where(
            and(
              eq(documentPermissions.documentId, documentId),
              eq(documentPermissions.roleLevel, roleLevel)
            )
          );

        if (existingPermission) {
          return res.status(400).json({ error: "Permission already exists for this role level" });
        }

        // Add new permission
        const [permission] = await db
          .insert(documentPermissions)
          .values({
            documentId,
            roleLevel,
          })
          .returning();

        res.json(permission);
      } catch (error) {
        console.error("Error adding document permission:", error);
        res.status(500).json({ error: "Failed to add permission" });
      }
    });

    app.patch("/api/documents/:documentId/permissions/:permissionId", async (req, res) => {
      try {
        const permissionId = parseInt(req.params.permissionId);
        const updates = req.body;

        // Update permission
        const [updatedPermission] = await db
          .update(documentPermissions)
          .set(updates)
          .where(eq(documentPermissions.id, permissionId))
          .returning();

        res.json(updatedPermission);
      } catch (error) {
        console.error("Error updating document permission:", error);
        res.status(500).json({ error: "Failed to update permission" });
      }
    });

    // Add roles endpoint
    app.get("/api/roles", async (req, res) => {
      try {
        const allRoles = await db
          .select()
          .from(roles)
          .orderBy(roles.level);

        res.json(allRoles);
      } catch (error) {
        console.error("Error fetching roles:", error);
        res.status(500).json({ error: "Failed to fetch roles" });
      }
    });


    // Socket.IO connection handling with proper types
    io.on('connection', (socket) => {
      console.log('New client connected');
      const userId = socket.handshake.query.userId;

      if (userId && typeof userId === 'string') {
        // Track user connection
        socket.join(`user:${userId}`);

        // Emit current connection status
        io.emit('USER_CONNECTION_UPDATE', {
          type: 'USER_CONNECTION_UPDATE',
          userId,
          status: 'connected'
        });

        socket.on('disconnect', () => {
          console.log('Client disconnected');
          socket.leave(`user:${userId}`);
          io.emit('USER_CONNECTION_UPDATE', {
            type: 'USER_CONNECTION_UPDATE',
            userId,
            status: 'disconnected'
          });
        });
      }
    });

    // Initialize WebSocket server
    const wsServer = setupWebSocketServer(httpServer);

    console.log("Routes registered successfully");
    return httpServer;
  } catch (error) {
    console.error("Failed to initialize services:", error);
    throw error;
  }
}

// Helper function to get user's training level
export async function getUserTrainingLevel(userId: string): Promise<number> {
  const trainings = await db
    .select()
    .from(userTraining)
    .where(eq(userTraining.userId, userId));

  const completedModules = trainings.filter(t => t.status === 'completed').length;
  return Math.floor(completedModules / 3) + 1;
}

// Helper function to track AI Engine usage
async function trackAIEngineUsage(
  userId: string,
  feature: 'chat' | 'document_analysis' | 'equipment_prediction' | 'report_generation',
  duration: number,
  metadata?: Record<string, any>
) {
  try {
    const sessionId = uuidv4();
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    await db.insert(aiEngineActivity).values({
      userId,
      sessionId,
      feature,
      startTime,
      endTime,
      durationMinutes: duration,
      metadata: metadata || {}
    });

    console.log(`Tracked AI Engine usage for user ${userId}: ${duration} minutes`);
  } catch (error) {
    console.error("Error tracking AI Engine usage:", error);
  }
}

async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    readableStream.on("data", (data) => {
      chunks.push(data);
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks).toString());
    });
    readableStream.on("error", reject);
  });
}