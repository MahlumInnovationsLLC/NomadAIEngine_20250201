import type { Express, Request } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import {
  documentWorkflows,
  documentApprovals,
  documentPermissions,
  roles,
  userTraining,
  aiEngineActivity,
  type SelectUser,
  equipmentTypes,
  equipment
} from "@db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { setupWebSocketServer } from "./services/websocket";
import multer from "multer";
import { BlobServiceClient } from "@azure/storage-blob";
import { generateReport } from "./services/document-generator";
import { listChats } from "./services/azure/cosmos_service";
import { analyzeDocument } from "./services/azure/openai_service";
import { getStorageMetrics } from "./services/azure/blob_service";

// Add interface for Request with user
interface AuthenticatedRequest extends Request {
  user?: SelectUser;
}

// Equipment related functions
async function getEquipmentType(manufacturer: string, model: string) {
  const [existingType] = await db
    .select()
    .from(equipmentTypes)
    .where(and(
      eq(equipmentTypes.manufacturer, manufacturer),
      eq(equipmentTypes.model, model)
    ))
    .limit(1);
  return existingType;
}

async function createEquipmentType(type: typeof equipmentTypes.$inferInsert) {
  const [newType] = await db
    .insert(equipmentTypes)
    .values(type)
    .returning();
  return newType;
}

async function getAllEquipment() {
  return db
    .select()
    .from(equipment)
    .orderBy(equipment.name);
}

async function createEquipment(equipmentData: typeof equipment.$inferInsert) {
  const [newEquipment] = await db
    .insert(equipment)
    .values(equipmentData)
    .returning();
  return newEquipment;
}

async function updateEquipment(id: string, updates: Partial<typeof equipment.$inferInsert>) {
  const [updatedEquipment] = await db
    .update(equipment)
    .set(updates)
    .where(eq(equipment.id, parseInt(id)))
    .returning();
  return updatedEquipment;
}

// Helper function to get recent activity
async function getRecentActivity(limit: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7); // Get activity from last 7 days

  const activities = await db
    .select({
      id: aiEngineActivity.id,
      type: aiEngineActivity.feature,
      metadata: aiEngineActivity.metadata,
      timestamp: aiEngineActivity.createdAt
    })
    .from(aiEngineActivity)
    .where(gte(aiEngineActivity.createdAt, startDate))
    .orderBy(aiEngineActivity.createdAt, 'desc')
    .limit(limit);

  return activities.map(activity => ({
    id: activity.id,
    type: activity.type,
    documentName: activity.metadata?.documentName || '',
    timestamp: activity.timestamp
  }));
}

// Initialize Azure Blob Storage Client
if (!process.env.AZURE_BLOB_CONNECTION_STRING) {
  throw new Error("Azure Blob Storage Connection String not found");
}

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_BLOB_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient("documents");

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Helper function to track AI Engine usage
async function trackAIEngineUsage(userId: string, feature: 'chat' | 'document_analysis' | 'equipment_prediction' | 'report_generation', duration: number, metadata?: Record<string, any>) {
  try {
    await db.insert(aiEngineActivity).values({
      userId,
      sessionId: `session_${Date.now()}`,
      feature,
      durationMinutes: duration,
      startTime: new Date(),
      endTime: new Date(Date.now() + duration * 60 * 1000),
      metadata: metadata || {}
    });

    console.log(`Tracked AI Engine usage for user ${userId}: ${duration} minutes`);
  } catch (error) {
    console.error("Error tracking AI Engine usage:", error);
  }
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const wsServer = setupWebSocketServer(httpServer);

  // Add uploads directory for serving generated files
  app.use('/uploads', express.static('uploads'));

  // Add user authentication middleware and user status tracking
  app.use((req: AuthenticatedRequest, _res, next) => {
    const userId = req.headers['x-user-id'];
    if (userId && typeof userId === 'string') {
      wsServer.broadcast([userId], { type: 'USER_ACTIVE' });
    }
    next();
  });

  // Update online users endpoint
  app.get("/api/users/online-status", (_req, res) => {
    const activeUsers = wsServer.getActiveUsers();
    res.json(activeUsers);
  });

  // Add dashboard metrics endpoint
  app.get("/api/dashboard/stats", async (_req, res) => {
    try {
      const storageMetrics = await getStorageMetrics();

      const stats = {
        totalDocuments: storageMetrics.totalDocuments,
        totalStorageSize: storageMetrics.totalSize,
        documentTypes: storageMetrics.documentTypes,
        aiServiceStatus: true,
        storageStatus: true,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  });

  // Document-related endpoints
  app.get("/api/documents/:documentPath(*)/content", async (req, res) => {
    try {
      const documentPath = req.params.documentPath;
      console.log("Fetching document content for:", documentPath);

      const blockBlobClient = containerClient.getBlockBlobClient(documentPath);

      try {
        const downloadResponse = await blockBlobClient.download();
        const properties = await blockBlobClient.getProperties();

        if (!downloadResponse.readableStreamBody) {
          return res.status(404).json({ error: "No content available" });
        }

        // Read the stream into a buffer
        const chunks: Buffer[] = [];
        for await (const chunk of downloadResponse.readableStreamBody) {
          chunks.push(Buffer.from(chunk));
        }
        const content = Buffer.concat(chunks).toString('utf-8');

        res.json({
          content,
          revision: properties.metadata?.revision,
        });
      } catch (error: any) {
        if (error.statusCode === 404) {
          return res.status(404).json({ error: "Document not found" });
        }
        throw error;
      }
    } catch (error) {
      console.error("Error fetching document content:", error);
      res.status(500).json({ error: "Failed to fetch document content" });
    }
  });

  app.put("/api/documents/:documentPath(*)/content", async (req, res) => {
    try {
      const documentPath = req.params.documentPath;
      const { content, revision } = req.body;

      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      console.log("Updating document content for:", documentPath);

      const blockBlobClient = containerClient.getBlockBlobClient(documentPath);

      // Add revision information as metadata
      const metadata = revision ? { revision } : undefined;

      await blockBlobClient.upload(content, content.length, {
        metadata,
        blobHTTPHeaders: {
          blobContentType: "text/html",
        },
      });

      res.json({ message: "Document updated successfully" });
    } catch (error) {
      console.error("Error updating document content:", error);
      res.status(500).json({ error: "Failed to update document content" });
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
      if (req.user?.id) {
        await trackAIEngineUsage(req.user.id, 'report_generation', 2, { topic });
      }

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

  app.post("/api/messages", async (req: AuthenticatedRequest, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      // Track AI usage for chat (assuming it takes about 0.5 minutes per message)
      if (req.user?.id) {
        await trackAIEngineUsage(req.user.id, 'chat', 0.5, { messageLength: content.length });
      }

      // Generate response using Azure OpenAI
      let aiResponse = await analyzeDocument(content);

      res.json({
        success: true,
        response: aiResponse
      });
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  app.get("/api/chats", async (_req, res) => {
    try {
      const chats = await listChats('default_user');
      const formattedChats = chats.map(chat => ({
        id: chat.id,
        title: chat.title,
        lastMessageAt: chat.lastMessageAt,
        isArchived: chat.isDeleted || false
      }));
      res.json(formattedChats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ error: "Failed to fetch chats" });
    }
  });

  app.post("/api/equipment-types", async (req, res) => {
    try {
      const type = req.body;
      const existingType = await getEquipmentType(type.manufacturer, type.model);

      if (existingType) {
        return res.json(existingType);
      }

      const newType = await createEquipmentType(type);
      res.json(newType);
    } catch (error) {
      console.error("Error creating equipment type:", error);
      res.status(500).json({ error: "Failed to create equipment type" });
    }
  });

  app.get("/api/equipment", async (req, res) => {
    try {
      const equipment = await getAllEquipment();
      res.json(equipment);
    } catch (error) {
      console.error("Error getting equipment:", error);
      res.status(500).json({ error: "Failed to get equipment" });
    }
  });

  app.post("/api/equipment", async (req, res) => {
    try {
      const equipmentData = req.body;
      const newEquipment = await createEquipment(equipmentData);
      res.json(newEquipment);
    } catch (error) {
      console.error("Error creating equipment:", error);
      res.status(500).json({ error: "Failed to create equipment" });
    }
  });

  app.patch("/api/equipment/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedEquipment = await updateEquipment(id, updates);
      res.json(updatedEquipment);
    } catch (error) {
      console.error("Error updating equipment:", error);
      res.status(500).json({ error: "Failed to update equipment" });
    }
  });


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
            gte(aiEngineActivity.startTime, sevenDaysAgo),
            lte(aiEngineActivity.startTime, new Date())
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

  app.get("/api/documents/browse", async (req, res) => {
    try {
      console.log("Listing blobs from container:", "documents");
      const path = (req.query.path as string) || "";
      console.log("Browsing path:", path);

      // List all blobs in the path
      const items = [];
      const listOptions = {
        prefix: path,
        delimiter: '/'
      };

      // Get all blobs with the specified prefix
      const blobs = containerClient.listBlobsByHierarchy('/', listOptions);

      console.log("Starting blob enumeration...");
      for await (const item of blobs) {
        console.log("Found item:", item.kind === "prefix" ? "Directory:" : "File:", item.name);

        // Check if it's a virtual directory (folder)
        if (item.kind === "prefix") {
          // Get folder name by removing the trailing slash
          const folderPath = item.name;
          const folderName = folderPath.split('/').filter(Boolean).pop() || "";

          items.push({
            name: folderName,
            path: folderPath,
            type: "folder"
          });
        } else {
          // It's a blob (file)
          const blobItem = item;
          const fileName = blobItem.name.split("/").pop() || "";

          // Don't include folder markers
          if (!fileName.startsWith('.folder')) {
            items.push({
              name: fileName,
              path: blobItem.name,
              type: "file",
              size: blobItem.properties?.contentLength,
              lastModified: blobItem.properties?.lastModified?.toISOString()
            });
          }
        }
      }

      console.log("Found items:", items);
      res.json(items);
    } catch (error) {
      console.error("Error listing blobs:", error);
      res.status(500).json({ error: "Failed to list documents" });
    }
  });

  app.post("/api/documents/upload", upload.array('files'), async (req, res) => {
    try {
      const path = req.body.path || "";
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      console.log("Uploading files to container:", "documents", "path:", path);
      console.log("Files to upload:", files.map(f => f.originalname));

      const uploadPromises = files.map(async (file) => {
        const blobName = path ? `${path}/${file.originalname}` : file.originalname;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.uploadData(file.buffer);
        return blobName;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      console.log("Successfully uploaded files:", uploadedFiles);

      res.json({ message: "Files uploaded successfully", files: uploadedFiles });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ error: "Failed to upload files" });
    }
  });

  app.post("/api/documents/folders", async (req, res) => {
    try {
      const { path } = req.body;

      if (!path) {
        return res.status(400).json({ error: "Path is required" });
      }

      console.log("Creating folder:", path);

      // Create a zero-length blob with the folder name as prefix
      const folderPath = path.endsWith('/') ? path : `${path}/`;
      const blockBlobClient = containerClient.getBlockBlobClient(`${folderPath}.folder`);
      await blockBlobClient.uploadData(Buffer.from(''));

      console.log("Successfully created folder:", path);
      res.json({ message: "Folder created successfully", path });
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(500).json({ error: "Failed to create folder" });
    }
  });

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

      // Broadcast the updated training level
      await wsServer.broadcastTrainingLevel(req.user.id);

      res.json({ message: "Training progress updated successfully" });
    } catch (error) {
      console.error("Error updating training progress:", error);
      res.status(500).json({ error: "Failed to update training progress" });
    }
  });

  return httpServer;
}

async function getUserTrainingLevel(userId: string):Promise<number>{
    const [training] = await db.select(userTraining.level).from(userTraining).where(eq(userTraining.userId, userId)).limit(1)
    return training?.level || 0;
}