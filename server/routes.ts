import multer from 'multer';
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import { db } from "@db";
import { CosmosClient } from "@azure/cosmos";
import { 
  buildingSystems,
  notifications,
  userNotifications,
  facilityNotifications,
  documents,
  documentCollaborators,
  documentApprovals,
  documentWorkflows,
  documentPermissions,
  roles,
  trainingModules,
  userTraining,
  aiEngineActivity,
  marketingEvents,
  integrationConfigs
} from "@db/schema";
import { eq, and, gte, lte, sql, desc, inArray } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, type AuthenticatedRequest } from "./auth-middleware";
import {
  getEquipmentType,
  createEquipmentType,
  getAllEquipment,
  createEquipment,
  updateEquipment,
  uploadEquipmentImage
} from './services/azure/equipment_service';
import projectsRouter from "./routes/manufacturing/projects";
import trainingRouter from "./routes/training"; // Add this import
import qualityRouter, { registerQualityRoutes } from "./routes/manufacturing/quality"; // Import quality router and registration function
// Import removed to avoid duplicate route registration
// Initialize Cosmos DB client
const cosmosClient = new CosmosClient(process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING || '');
const cosmosDatabase = cosmosClient.database("NomadAIEngineDB");
const containers: { [key: string]: any } = {};
// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// Helper function to create facility notifications
async function createFacilityNotification({
  buildingSystemId,
  type,
  title,
  message,
  priority = 'medium'
}: {
  buildingSystemId?: number;
  type: 'maintenance_due' | 'system_error' | 'inspection_required' | 'health_alert' | 'status_change';
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}) {
  try {
    const [notification] = await db
      .insert(facilityNotifications)
      .values({
        buildingSystemId,
        type,
        title,
        message,
        priority,
        status: 'unread',
        createdAt: new Date(),
      })
      .returning();
    return notification;
  } catch (error) {
    console.error("Error creating facility notification:", error);
    throw error;
  }
}
async function initializeContainers() {
  const containerConfigs = [
    { id: "chats", partitionKey: "/userKey" },
    { id: "equipment", partitionKey: "/id" },
    { id: "equipment-types", partitionKey: "/id" },
    { id: "building-systems", partitionKey: "/id" }
  ];
  try {
    await Promise.all(
      containerConfigs.map(async (config) => {
        const { container } = await cosmosDatabase.containers.createIfNotExists({
          id: config.id,
          partitionKey: { paths: [config.partitionKey] }
        });
        containers[config.id] = container;
      })
    );
    console.log("Successfully initialized all containers");
  } catch (error) {
    console.error("Error initializing containers:", error);
    throw error;
  }
}
// Initialize containers
initializeContainers().catch(console.error);
export function registerRoutes(app: express.Application): Server {
  // Building Systems endpoints
  app.get("/api/facility/building-systems", async (_req, res) => {
    try {
      const systems = await db.select().from(buildingSystems);
      res.json(systems);
    } catch (error) {
      console.error("Error fetching building systems:", error);
      res.status(500).json({ error: "Failed to fetch building systems" });
    }
  });
  app.post("/api/facility/building-systems", async (req, res) => {
    try {
      const systemData = req.body;
      const newSystem = {
        name: systemData.name,
        type: systemData.type,
        status: 'operational' as const,
        location: systemData.location,
        notes: systemData.notes || null,
        healthScore: '100',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const [createdSystem] = await db
        .insert(buildingSystems)
        .values(newSystem)
        .returning();
      // Create a notification for the new system
      await createFacilityNotification({
        type: 'system_created',
        title: `New building system created: ${newSystem.name}`,
        message: `A new building system of type ${newSystem.type} has been added.`
      });
      res.json(createdSystem);
    } catch (error) {
      console.error("Error creating building system:", error);
      res.status(500).json({ error: "Failed to create building system" });
    }
  });
  app.get("/api/documents/:id/report", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const blobName = `reports/${documentId}.docx`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const downloadResponse = await blockBlobClient.download();
      if (!downloadResponse.readableStreamBody) {
        return res.status(404).json({ error: "Report not found" });
      }
      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${blobName.split('/').pop()}"`);
      // Pipe the stream to the response
      downloadResponse.readableStreamBody.pipe(res);
    } catch (error) {
      console.error("Error downloading report:", error);
      res.status(500).json({ error: "Failed to download report" });
    }
  });
  // Add notification endpoints
  app.get("/api/notifications", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const userNotifs = await db.query.userNotifications.findMany({
        where: eq(userNotifications.userId, userId),
        orderBy: [notifications.createdAt],
        include: {
          notification: true
        }
      });
      res.json(userNotifs);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });
  app.post("/api/notifications/mark-read", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { notificationIds } = req.body;
      if (!Array.isArray(notificationIds)) {
        return res.status(400).json({ error: "Invalid notification IDs" });
      }
      await db.update(userNotifications)
        .set({
          read: true,
          readAt: new Date()
        })
        .where(
          and(
            eq(userNotifications.userId, userId),
            inArray(userNotifications.notificationId, notificationIds)
          )
        );
      res.json({ message: "Notifications marked as read" });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  });
  app.get("/api/notifications/unread-count", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const [result] = await db.select({
        count: notifications.id,
      })
        .from(notifications)
        .innerJoin(
          userNotifications,
          eq(notifications.id, userNotifications.notificationId)
        )
        .where(
          and(
            eq(userNotifications.userId, userId),
            eq(userNotifications.read, false)
          )
        );
      res.json({ count: result?.count || 0 });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });
  // Document submission for review endpoint
  app.post("/api/documents/:documentId/submit-review", async (req: AuthenticatedRequest, res) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const { version } = req.body;
      const userId = req.user?.id;
      if (!documentId || !version || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      // Create workflow entry
      const [workflow] = await db
        .insert(documentWorkflows)
        .values({
          documentId,
          status: 'active',
          startedAt: new Date(),
        })
        .returning();
      // Get document approvers
      const approvers = await db
        .select()
        .from(documentCollaborators)
        .where(
          and(
            eq(documentCollaborators.documentId, documentId),
            eq(documentCollaborators.role, 'approver')
          )
        );
      // Get document details
      const [document] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId));
      if (!document) {
        throw new Error("Document not found");
      }
      // Send approval requests to all approvers
      const approvalPromises = approvers.map(async (approver) => {
        // Create approval entry
        const [approval] = await db
          .insert(documentApprovals)
          .values({
            documentId,
            version,
            approverUserId: approver.userId,
            status: 'pending',
          })
          .returning();
        //          // Generate approval/reject links
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const approvalLink = `${baseUrl}/api/documents/${documentId}/approve/${approval.id}`;
        const rejectLink = `${baseUrl}/api/documents/${documentId}/reject/${approval.id}`;
        // Send email
        await sendApprovalRequestEmail(approver.userId, {
          documentName: document.title,
          documentLink: `${baseUrl}/documents/${documentId}`,
          requesterName: userId,
          approvalLink,
          rejectLink,
          requestId: documentId
        });
      });
      await Promise.all(approvalPromises);
      // Update document status
      await db
        .update(documents)
        .set({
          status: 'in_review',
          version,
          updatedAt: new Date(),
          updatedBy: userId,
        })
        .where(eq(documents.id, documentId));
      res.json({
        message: "Document submitted for review",
        workflowId: workflow.id,
      });
    } catch (error) {
      console.error("Error submitting document for review:", error);
      res.status(500).json({ error: "Failed to submit document for review" });
    }
  });
  // Document approval endpoint
  app.post("/api/documents/:documentId/approve/:approvalId", async (req: AuthenticatedRequest, res) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const approvalId = parseInt(req.params.approvalId);
      const userId = req.user?.id;
      if (!documentId || !approvalId || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      // Update approval status
      await db
        .update(documentApprovals)
        .set({
          status: 'approved',
          approvedAt: new Date(),
        })
        .where(eq(documentApprovals.id, approvalId));
      // Check if all approvers have approved
      const [pendingApprovals] = await db
        .select({ count: sql`count(*)` })
        .from(documentApprovals)
        .where(
          and(
            eq(documentApprovals.documentId, documentId),
            eq(documentApprovals.status, 'pending')
          )
        );
      if (pendingApprovals.count === 0) {
        // All approvers have approved, update document status
        await db
          .update(documents)
          .set({
            status: 'approved',
            updatedAt: new Date(),
            updatedBy: userId,
          })
          .where(eq(documents.id, documentId));
        // Complete the workflow
        await db
          .update(documentWorkflows)
          .set({
            status: 'completed',
            completedAt: new Date(),
          })
          .where(eq(documentWorkflows.documentId, documentId));
      }
      res.json({ message: "Document approved successfully" });
    } catch (error) {
      console.error("Error approving document:", error);
      res.status(500).json({ error: "Failed to approve document" });
    }
  });
  // Document rejection endpoint
  app.post("/api/documents/:documentId/reject/:approvalId", async (req: AuthenticatedRequest, res) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const approvalId = parseInt(req.params.approvalId);
      const userId = req.user?.id;
      const { comments } = req.body;
      if (!documentId || !approvalId || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      // Update approval status
      await db
        .update(documentApprovals)
        .set({
          status: 'rejected',
          comments,
          updatedAt: new Date(),
        })
        .where(eq(documentApprovals.id, approvalId));
      // Update document status
      await db
        .update(documents)
        .set({
          status: 'draft',
          updatedAt: new Date(),
          updatedBy: userId,
        })
        .where(eq(documents.id, documentId));
      // Complete the workflow
      await db
        .update(documentWorkflows)
        .set({
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(documentWorkflows.documentId, documentId));
      res.json({ message: "Document rejected" });
    } catch (error) {
      console.error("Error rejecting document:", error);
      res.status(500).json({ error: "Failed to reject document" });
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
      // Broadcast the updated training level
      await wsServer.broadcastTrainingLevel(req.user.id);
      res.json({ message: "Training progress updated successfully" });
    } catch (error) {
      console.error("Error updating training progress:", error);
      res.status(500).json({ error: "Failed to update training progress" });
    }
  });
  // Document content endpoint - updating to handle paths correctly
  app.get("/api/documents/:path*/content", async (req: AuthenticatedRequest, res) => {
    try {
      const documentPath = req.params["path*"];
      console.log("Fetching document content for path:", documentPath);
      const blockBlobClient = containerClient.getBlockBlobClient(documentPath);
      try {
        const downloadResponse = await blockBlobClient.download();
        const properties = await blockBlobClient.getProperties();
        console.log("Document properties:", properties);
        if (!downloadResponse.readableStreamBody) {
          console.error("No content available for document:", documentPath);
          return res.status(404).json({ error: "No content available" });
        }
        // Read the stream into a buffer
        const chunks: Buffer[] = [];
        for await (const chunk of downloadResponse.readableStreamBody) {
          chunks.push(Buffer.from(chunk));
        }
        const content = Buffer.concat(chunks).toString('utf-8');
        console.log("Successfully retrieved document content, size:", content.length);
        console.log("Document metadata:", properties.metadata);
        // Send back the document data
        res.json({
          content,
          version: properties.metadata?.version || '1.0',
          status: properties.metadata?.status || 'draft',
          lastModified: properties.lastModified?.toISOString() || new Date().toISOString(),
        });
      } catch (error: any) {
        console.error("Error downloading document:", error);
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
  // Update document content endpoint
  app.put("/api/documents/content/:path*", async (req: AuthenticatedRequest, res) => {
    try {
      const documentPath = decodeURIComponent(req.params.path + (req.params[0] || ''));
      const { content, version, status } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }
      console.log("Updating document content for:", documentPath);
      const blockBlobClient = containerClient.getBlockBlobClient(documentPath);
      // Add metadata
      const metadata = {
        version: version || '1.0',
        status: status || 'draft',
        lastModified: new Date().toISOString()
      };
      await blockBlobClient.upload(content, content.length, {
        metadata,
        blobHTTPHeaders: {
          blobContentType: "text/html",
        },
      });
      console.log("Successfully updated document content");
      res.json({ message: "Document updated successfully" });
    } catch (error) {
      console.error("Error updating document content:", error);
      res.status(500).json({ error: "Failed to update document content" });
    }
  });
  // Add integration status endpoints
  app.get("/api/integrations/status", async (req, res) => {
    try {
      // Get all configs for the current user
      const configs = await db
        .select()
        .from(integrationConfigs)
        .where(eq(integrationConfigs.userId, req.user?.id || 'anonymous'));
      // Initialize status object
      const statuses: Record<string, any> = {};
      // Check each integration's status based on its configuration
      for (const config of configs) {
        const hasCredentials = Boolean(config.apiKey);
        if (!config.enabled) {
          statuses[config.integrationId] = {
            status: 'disconnected',
            lastChecked: new Date().toISOString(),
            message: 'Integration disabled'
          };
          continue;
        }
        if (!hasCredentials) {
          statuses[config.integrationId] = {
            status: 'disconnected',
            lastChecked: new Date().toISOString(),
            message: 'API key required'
          };
          continue;
        }
        // Mock connection check - replace with actual API checks in production
        const isConnected = hasCredentials && Math.random() > 0.2; // 80% success rate for demo
        statuses[config.integrationId] = {
          status: isConnected ? 'connected' : 'error',
          lastChecked: new Date().toISOString(),
          message: isConnected
            ? 'Connected and syncing'
            : 'Authentication failed. Please check your credentials.'
        };
      }
      // Add default disconnected status for unconfigured integrations
      const allPlatforms = [
        'mailchimp', 'sendgrid', 'hubspot', 'klaviyo',
        'facebook', 'instagram', 'twitter', 'linkedin',
        'google-analytics', 'mixpanel', 'segment', 'amplitude'
      ];
      for (const platform of allPlatforms) {
        if (!statuses[platform]) {
          statuses[platform] = {
            status: 'disconnected',
            lastChecked: new Date().toISOString(),
            message: 'Not configured'
          };
        }
      }
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching integration statuses:", error);
      res.status(500).json({ error: "Failed to fetch integration statuses" });
    }
  });
  // Add integration config endpoints
  app.get("/api/integrations/configs", async (req, res) => {
    try {
      const configs = await db
        .select()
        .from(integrationConfigs)
        .where(eq(integrationConfigs.userId, req.user?.id || 'anonymous'));
      // Convert array of configs to object keyed by integration ID
      const configsMap = configs.reduce((acc, config) => ({
        ...acc,
        [config.integrationId]: {
          apiKey: config.apiKey,
          enabled: config.enabled,
          syncFrequency: config.syncFrequency,
          webhookUrl: config.webhookUrl,
          customFields: config.customFields,
        }
      }), {});
      res.json(configsMap);
    } catch (error) {
      console.error("Error fetching integration configs:", error);
      res.status(500).json({ error: "Failed to fetch integration configurations" });
    }
  });
  app.put("/api/integrations/:id/config", async (req, res) => {
    try {
      const { id } = req.params;
      const config = req.body;
      // Update or insert config
      const [updatedConfig] = await db
        .insert(integrationConfigs)
        .values({
          userId: req.user?.id || 'anonymous',
          integrationId: id,
          apiKey: config.apiKey,
          enabled: config.enabled,
          syncFrequency: config.syncFrequency,
          webhookUrl: config.webhookUrl,
          customFields: config.customFields,
        })
        .onConflictDoUpdate({
          target: [integrationConfigs.userId, integrationConfigs.integrationId],
          set: {
            apiKey: config.apiKey,
            enabled: config.enabled,
            syncFrequency: config.syncFrequency,
            webhookUrl: config.webhookUrl,
            customFields: config.customFields,
            updatedAt: new Date(),
          },
        })
        .returning();
      res.json(updatedConfig);
    } catch (error) {
      console.error("Error saving integration config:", error);
      res.status(500).json({ error: "Failed to save integration configuration" });
    }
  });
  // Update the refresh endpoint to check actual connection
  app.post("/api/integrations/:id/refresh", async (req, res) => {
    try {
      const { id } = req.params;
      // Get the integration config
      const [config] = await db
        .select()
        .from(integrationConfigs)
        .where(
          and(
            eq(integrationConfigs.userId, req.user?.id || 'anonymous'),
            eq(integrationConfigs.integrationId, id)
          )
        );
      let status;
      if (!config?.enabled) {
        status = {
          status: 'disconnected',
          lastChecked: new Date().toISOString(),
          message: 'Integration disabled'
        };
      } else if (!config?.apiKey) {
        status = {
          status: 'disconnected',
          lastChecked: new Date().toISOString(),
          message: 'API key required'
        };
      } else {
        // Mock connection check - replace with actual API checks
        const isConnected = Math.random() > 0.2; // 80% success rate for demo
        status = {
          status: isConnected ? 'connected' : 'error',
          lastChecked: new Date().toISOString(),
          message: isConnected
            ? 'Connected and syncing'
            : 'Authentication failed. Please check your credentials.'
        };
      }
      // Track the refresh attempt
      await trackAIEngineUsage(
        req.user?.id || 'anonymous',
        'web_search',
        0.1,
        { integration: id, action: 'refresh' }
      );
      res.json(status);
    } catch (error) {
      console.error("Error refreshing integration status:", error);
      res.status(500).json({ error: "Failed to refresh integration status" });
    }
  });
  // Add new marketing calendar routes
  app.get("/api/marketing/calendar/events", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      // Get events from database
      const events = await db.query.marketingEvents.findMany({
        where: and(
          startDate ? gte(marketingEvents.startDate, startDate) : undefined,
          endDate ? lte(marketingEvents.endDate, endDate) : undefined
        ),
        orderBy: [marketingEvents.startDate]
      });
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });
  app.post("/api/marketing/calendar/events", async (req: AuthenticatedRequest, res) => {
    try {
      const { title, description, startDate, endDate, type, status, location } = req.body;
      // Validate required fields
      if (!title || !startDate || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      // Create new event
      const [event] = await db
        .insert(marketingEvents)
        .values({
          title,
          description,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          type,
          status: status || 'scheduled',
          createdBy: req.user?.id || 'system',
          location
        })
        .returning();
      // Broadcast event to connected clients
      wsServer.broadcastToRoom('calendar', {
        type: 'calendar_event_created',
        data: event
      });
      res.json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ error: "Failed to create calendar event" });
    }
  });
  app.post("/api/marketing/calendar/sync-outlook", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      // Simulate Outlook sync for now (will be replaced with actual Microsoft Graph API integration)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const sampleOutlookEvent = {
        id: "outlook-1",
        title: "Marketing Team Meeting",
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        type: "meeting",
        status: "scheduled",
        outlookEventId: "123456"
      };
      res.json({
        message: "Calendar synced with Outlook",
        syncedEvents: [sampleOutlookEvent]
      });
    } catch (error) {
      console.error("Error syncing with Outlook:", error);
      res.status(500).json({ error: "Failed to sync with Outlook calendar" });
    }
  });
  // Add member update endpoint
  app.patch("/api/members/:memberId", async (req, res) => {
    try {
      const { memberId } = req.params;
      const updates = req.body;
      const updatedMember = await updateMemberData(memberId, updates);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({ error: "Failed to update member data" });
    }
  });
  // Add member search endpoint
  app.get("/api/members", async (req, res) => {
    try {
      const searchTerm = req.query.search as string;
      const filters = {
        membershipType: req.query.membershipType as string,
        status: req.query.status as string
      };
      const members = await searchMembers(searchTerm, filters);
      res.json(members);
    } catch (error) {
      console.error("Error searching members:", error);
      res.status(500).json({ error: "Failed to search members" });
    }
  });
  // Add health report generation endpoint
  app.post("/api/health-report", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      // Mock data for demonstration - replace with actual data fetching
      const metrics = [
        {
          name: "Steps",
          value: 8432,
          unit: "steps",
          date: new Date().toISOString()
        },
        {
          name: "Heart Rate",
          value: 72,
          unit: "bpm",
          date: new Date().toISOString()
        },
        {
          name: "Sleep",
          value: 7.5,
          unit: "hours",
          date: new Date().toISOString()
        },
        {
          name: "Calories",
          value: 2250,
          unit: "kcal",
          date: new Date().toISOString()
        }
      ];
      const achievements = [
        {
          name: "Fitness Warrior",
          description: "Complete 10 workouts in a month",
          completedAt: "2025-01-20",
          progress: 100
        },
        {
          name: "Consistency King",
          description: "Log in for 7 consecutive days",
          progress: 85
        },
        {
          name: "Health Champion",
          description: "Maintain heart rate zones during workouts",
          progress: 60
        }
      ];
      const filename = await generateHealthReport(userId, metrics, achievements);
      res.json({
        success: true,
        filename,
        downloadUrl: `/uploads/${filename}`
      });
    } catch (error) {
      console.error("Error generating health report:", error);
      res.status(500).json({
        error: "Failed to generate health report",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  // Add calendar event endpoints
  app.get("/api/marketing/calendar/events", async (req: AuthenticatedRequest, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      // Get events from database
      const events = await db.query.marketingEvents.findMany({
        where: and(
          startDate ? gte(marketingEvents.startDate, startDate) : undefined,
          endDate ? lte(marketingEvents.endDate, endDate) : undefined
        ),
        orderBy: [marketingEvents.startDate]
      });
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });
  app.post("/api/marketing/calendar/events", async (req: AuthenticatedRequest, res) => {
    try {
      const { title, description, startDate, endDate, type, status, location } = req.body;
      // Validate required fields
      if (!title || !startDate || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      // Create new event
      const [event] = await db
        .insert(marketingEvents)
        .values({
          title,
          description,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          type,
          status: status || 'scheduled',
          createdBy: req.user?.id || 'system',
          location
        })
        .returning();
      // Broadcast event to connected clients
      wsServer.broadcastToRoom('calendar', {
        type: 'calendar_event_created',
        data: event
      });
      res.json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ error: "Failed to create calendar event" });
    }
  });
  app.post("/api/marketing/calendar/sync-outlook", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      // Simulate Outlook sync for now (will be replaced with actual Microsoft Graph API integration)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const sampleOutlookEvent = {
        id: "outlook-1",
        title: "Marketing Team Meeting",
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        type: "meeting",
        status: "scheduled",
        outlookEventId: "123456"
      };
      res.json({
        message: "Calendar synced with Outlook",
        syncedEvents: [sampleOutlookEvent]
      });
    } catch (error) {
      console.error("Error syncing with Outlook:", error);
      res.status(500).json({ error: "Failed to sync with Outlook calendar" });
    }
  });
  // Add member update endpoint
  app.patch("/api/members/:memberId", async (req, res) => {
    try {
      const { memberId } = req.params;
      const updates = req.body;
      const updatedMember = await updateMemberData(memberId, updates);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({ error: "Failed to update member data" });
    }
  });
  // Add member search endpoint
  app.get("/api/members", async (req, res) => {
    try {
      const searchTerm = req.query.search as string;
      const filters = {
        membershipType: req.query.membershipType as string,
        status: req.query.status as string
      };
      const members = await searchMembers(searchTerm, filters);
      res.json(members);
    } catch (error) {
      console.error("Error searching members:", error);
      res.status(500).json({ error: "Failed to search members" });
    }
  });
  // Add health report generation endpoint
  app.post("/api/health-report", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      // Mock data for demonstration - replace with actual data fetching
      const metrics = [
        {
          name: "Steps",
          value: 8432,
          unit: "steps",
          date: new Date().toISOString()
        },
        {
          name: "Heart Rate",
          value: 72,
          unit: "bpm",
          date: new Date().toISOString()
        },
        {
          name: "Sleep",
          value: 7.5,
          unit: "hours",
          date: new Date().toISOString()
        },
        {
          name: "Calories",
          value: 2250,
          unit: "kcal",
          date: new Date().toISOString()
        }
      ];
      const achievements = [
        {
          name: "Fitness Warrior",
          description: "Complete 10 workouts in a month",
          completedAt: "2025-01-20",
          progress: 100
        },
        {
          name: "Consistency King",
          description: "Log in for 7 consecutive days",
          progress: 85
        },
        {
          name: "Health Champion",
          description: "Maintain heart rate zones during workouts",
          progress: 60
        }
      ];
      const filename = await generateHealthReport(userId, metrics, achievements);
      res.json({
        success: true,
        filename,
        downloadUrl: `/uploads/${filename}`
      });
    } catch (error) {
      console.error("Error generating health report:", error);
      res.status(500).json({
        error: "Failed to generate health report",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  // Add calendar event endpoints
  app.get("/api/marketing/calendar/events", async (req: AuthenticatedRequest, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      // Get events from database
      const events = await db.query.marketingEvents.findMany({
        where: and(
          startDate ? gte(marketingEvents.startDate, startDate) : undefined,
          endDate ? lte(marketingEvents.endDate, endDate) : undefined
        ),
        orderBy: [marketingEvents.startDate]
      });
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });
  app.post("/api/marketing/calendar/events", async (req: AuthenticatedRequest, res) => {
    try {
      const { title, description, startDate, endDate, type, status, location } = req.body;
      // Validate required fields
      if (!title || !startDate || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      // Create new event
      const [event] = await db
        .insert(marketingEvents)
        .values({
          title,
          description,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          type,
          status: status || 'scheduled',
          createdBy: req.user?.id || 'system',
          location
        })
        .returning();
      // Broadcast event to connected clients
      wsServer.broadcastToRoom('calendar', {
        type: 'calendar_event_created',
        data: event
      });
      res.json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ error: "Failed to create calendar event" });
    }
  });
  app.post("/api/marketing/calendar/sync-outlook", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      // Simulate Outlook sync for now (will be replaced with actual Microsoft Graph API integration)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const sampleOutlookEvent = {
        id: "outlook-1",
        title: "Marketing Team Meeting",
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        type: "meeting",
        status: "scheduled",
        outlookEventId: "123456"
      };
      res.json({
        message: "Calendar synced with Outlook",
        syncedEvents: [sampleOutlookEvent]
      });
    } catch (error) {
      console.error("Error syncing with Outlook:", error);
      res.status(500).json({ error: "Failed to sync with Outlook calendar" });
    }
  });
  // Add member update endpoint
  app.patch("/api/members/:memberId", async (req, res) => {
    try {
      const { memberId } = req.params;
      const updates = req.body;
      const updatedMember = await updateMemberData(memberId, updates);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({ error: "Failed to update member data" });
    }
  });
  // Add member search endpoint
  app.get("/api/members", async (req, res) => {
    try {
      const searchTerm = req.query.search as string;
      const filters = {
        membershipType: req.query.membershipType as string,
        status: req.query.status as string
      };
      const members = await searchMembers(searchTerm, filters);
      res.json(members);
    } catch (error) {
      console.error("Error searching members:", error);
      res.status(500).json({ error: "Failed to search members" });
    }
  });
  // Add health report generation endpoint
  app.post("/api/health-report", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      // Mock data for demonstration - replace with actual data fetching
      const metrics = [
        {
          name: "Steps",
          value: 8432,
          unit: "steps",
          date: new Date().toISOString()
        },
        {
          name: "Heart Rate",
          value: 72,
          unit: "bpm",
          date: new Date().toISOString()
        },
        {
          name: "Sleep",
          value: 7.5,
          unit: "hours",
          date: new Date().toISOString()
        },
        {
          name: "Calories",
          value: 2250,
          unit: "kcal",
          date: new Date().toISOString()
        }
      ];
      const achievements = [
        {
          name: "Fitness Warrior",
          description: "Complete 10 workouts in a month",
          completedAt: "2025-01-20",
          progress: 100
        },
        {
          name: "Consistency King",
          description: "Log in for 7 consecutive days",
          progress: 85
        },
        {
          name: "Health Champion",
          description: "Maintain heart rate zones during workouts",
          progress: 60
        }
      ];
      const filename = await generateHealthReport(userId, metrics, achievements);
      res.json({
        success: true,
        filename,
        downloadUrl: `/uploads/${filename}`
      });
    } catch (error) {
      console.error("Error generating health report:", error);
      res.status(500).json({
        error: "Failed to generate health report",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  // Add calendar event endpoints
  app.get("/api/marketing/calendar/events", async (req: AuthenticatedRequest, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      // Get events from database
      const events = await db.query.marketingEvents.findMany({
        where: and(
          startDate ? gte(marketingEvents.startDate, startDate) : undefined,
          endDate ? lte(marketingEvents.endDate, endDate) : undefined
        ),
        orderBy: [marketingEvents.startDate]
      });
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });
  app.post("/api/marketing/calendar/events", async (req: AuthenticatedRequest, res) => {
    try {
      const { title, description, startDate, endDate, type, status, location } = req.body;
      // Validate required fields
      if (!title || !startDate || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      // Create new event
      const [event] = await db
        .insert(marketingEvents)
        .values({
          title,
          description,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          type,
          status: status || 'scheduled',
          createdBy: req.user?.id || 'system',
          location
        })
        .returning();
      // Broadcast event to connected clients
      wsServer.broadcastToRoom('calendar', {
        type: 'calendar_event_created',
        data: event
      });
      res.json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ error: "Failed to create calendar event" });
    }
  });
  app.post("/api/marketing/calendar/sync-outlook", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      // Simulate Outlook sync for now (will be replaced with actual Microsoft Graph API integration)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const sampleOutlookEvent = {
        id: "outlook-1",
        title: "Marketing Team Meeting",
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        type: "meeting",
        status: "scheduled",
        outlookEventId: "123456"
      };
      res.json({
        message: "Calendar synced with Outlook",
        syncedEvents: [sampleOutlookEvent]
      });
    } catch (error) {
      console.error("Error syncing with Outlook:", error);
      res.status(500).json({ error: "Failed to sync with Outlook calendar" });
    }
  });
  // Add member update endpoint
  app.patch("/api/members/:memberId", async (req, res) => {
    try {
      const { memberId } = req.params;
      const updates = req.body;
      const updatedMember = await updateMemberData(memberId, updates);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({ error: "Failed to update member data" });
    }
  });
  // Add member search endpoint
  app.get("/api/members", async (req, res) => {
    try {
      const searchTerm = req.query.search as string;
      const filters = {
        membershipType: req.query.membershipType as string,
        status: req.query.status as string
      };
      const members = await searchMembers(searchTerm, filters);
      res.json(members);
    } catch (error) {
      console.error("Error searching members:", error);
      res.status(500).json({ error: "Failed to search members" });
    }
  });
  // Add health report generation endpoint
  app.post("/api/health-report", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      // Mock data for demonstration - replace with actual data fetching
      const metrics = [
        {
          name: "Steps",
          value: 8432,
          unit: "steps",
          date: new Date().toISOString()
        },
        {
          name: "Heart Rate",
          value: 72,
          unit: "bpm",
          date: new Date().toISOString()
        },
        {
          name: "Sleep",
          value: 7.5,
          unit: "hours",
          date: new Date().toISOString()
        },
        {
          name: "Calories",
          value: 2250,
          unit: "kcal",
          date: new Date().toISOString()
        }
      ];
      const achievements = [
        {
          name: "Fitness Warrior",
          description: "Complete 10 workouts in a month",
          completedAt: "2025-01-20",
          progress: 100
        },
        {
          name: "Consistency King",
          description: "Log in for 7 consecutive days",
          progress: 85
        },
        {
          name: "Health Champion",
          description: "Maintain heart rate zones during workouts",
          progress: 60
        }
      ];
      const filename = await generateHealthReport(userId, metrics, achievements);
      res.json({
        success: true,
        filename,
        downloadUrl: `/uploads/${filename}`
      });
    } catch (error) {
      console.error("Error generating health report:", error);
      res.status(500).json({
        error: "Failed to generate health report",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  // Add calendar event endpoints
  app.get("/api/marketing/calendar/events", async (req: AuthenticatedRequest, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      // Get events from database
      const events = await db.query.marketingEvents.findMany({
        where: and(
          startDate ? gte(marketingEvents.startDate, startDate) : undefined,
          endDate ? lte(marketingEvents.endDate, endDate) : undefined
        ),
        orderBy: [marketingEvents.startDate]
      });
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });
  app.post("/api/marketing/calendar/events", async (req: AuthenticatedRequest, res) => {
    try {
      const { title, description, startDate, endDate, type, status, location } = req.body;
      // Validate required fields
      if (!title || !startDate || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      // Create new event
      const [event] = await db
        .insert(marketingEvents)
        .values({
          title,
          description,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          type,
          status: status || 'scheduled',
          createdBy: req.user?.id || 'system',
          location
        })
        .returning();
      // Broadcast event to connected clients
      wsServer.broadcastToRoom('calendar', {
        type: 'calendar_event_created',
        data: event
      });
      res.json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ error: "Failed to create calendar event" });
    }
  });
  app.post("/api/marketing/calendar/sync-outlook", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      // Simulate Outlook sync for now (will be replaced with actual Microsoft Graph API integration)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const sampleOutlookEvent = {
        id: "outlook-1",
        title: "Marketing Team Meeting",
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        type: "meeting",
        status: "scheduled",
        outlookEventId: "123456"
      };
      res.json({
        message: "Calendar synced with Outlook",
        syncedEvents: [sampleOutlookEvent]
      });
    } catch (error) {
      console.error("Error syncing with Outlook:", error);
      res.status(500).json({ error: "Failed to sync with Outlook calendar" });
    }
  });
  // Add member update endpoint
  app.patch("/api/members/:memberId", async (req, res) => {
    try {
      const { memberId } = req.params;
      const updates = req.body;
      const updatedMember = await updateMemberData(memberId, updates);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({ error: "Failed to update member data" });
    }
  });
  // Add member search endpoint
  app.get("/api/members", async (req, res) => {
    try {
      const searchTerm = req.query.search as string;
      const filters = {
        membershipType: req.query.membershipType as string,
        status: req.query.status as string
      };
      const members = await searchMembers(searchTerm, filters);
      res.json(members);
    } catch (error) {
      console.error("Error searching members:", error);
      res.status(500).json({ error: "Failed to search members" });
    }
  });
  // Add health report generation endpoint
  app.post("/api/health-report", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      // Mock data for demonstration - replace with actual data fetching
      const metrics = [
        {
          name: "Steps",
          value: 8432,
          unit: "steps",
          date: new Date().toISOString()
        },
        {
          name: "Heart Rate",
          value: 72,
          unit: "bpm",
          date: new Date().toISOString()
        },
        {
          name: "Sleep",
          value: 7.5,
          unit: "hours",
          date: new Date().toISOString()
        },
        {
          name: "Calories",
          value: 2250,
          unit: "kcal",
          date: new Date().toISOString()
        }
      ];
      const achievements = [
        {
          name: "Fitness Warrior",
          description: "Complete 10 workouts in a month",
          completedAt: "2025-01-20",
          progress: 100
        },
        {
          name: "Consistency King",
          description: "Log in for 7 consecutive days",
          progress: 85
        },
        {
          name: "Health Champion",
          description: "Maintain heart rate zones during workouts",
          progress: 60
        }
      ];
      const filename = await generateHealthReport(userId, metrics, achievements);
      res.json({
        success: true,
        filename,
        downloadUrl: `/uploads/${filename}`
      });
    } catch (error) {
      console.error("Error generating health report:", error);
      res.status(500).json({
        error: "Failed to generate health report",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  // Add calendar event endpoints
  app.get("/api/marketing/calendar/events", async (req: AuthenticatedRequest, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      // Get events from database
      const events = await db.query.marketingEvents.findMany({
        where: and(
          startDate ? gte(marketingEvents.startDate, startDate) : undefined,
          endDate ? lte(marketingEvents.endDate, endDate) : undefined
        ),
        orderBy: [marketingEvents.startDate]
      });
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });
  app.post("/api/marketing/calendar/events", async (req: AuthenticatedRequest, res) => {
    try {
      const { title, description, startDate, endDate, type, status, location } = req.body;
      // Validate required fields
      if (!title || !startDate || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      // Create new event
      const [event] = await db
        .insert(marketingEvents)
        .values({
          title,
          description,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          type,
          status: status || 'scheduled',
          createdBy: req.user?.id || 'system',
          location
        })
        .returning();
      // Broadcast event to connected clients
      wsServer.broadcastToRoom('calendar', {
        type: 'calendar_event_created',
        data: event
      });
      res.json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ error: "Failed to create calendar event" });
    }
  });
  app.post("/api/marketing/calendar/sync-outlook", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      // Simulate Outlook sync for now (will be replaced with actual Microsoft Graph API integration)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const sampleOutlookEvent = {
        id: "outlook-1",
        title: "Marketing Team Meeting",
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        type: "meeting",
        status: "scheduled",
        outlookEventId: "123456"
      };
      res.json({
        message: "Calendar synced with Outlook",
        syncedEvents: [sampleOutlookEvent]
      });
    } catch (error) {
      console.error("Error syncing with Outlook:", error);
      res.status(500).json({ error: "Failed to sync with Outlook calendar" });
    }
  });
  // Add member update endpoint
  app.patch("/api/members/:memberId", async (req, res) => {
    try {
      const { memberId } = req.params;
      const updates = req.body;
      const updatedMember = await updateMemberData(memberId, updates);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({ error: "Failed to update member data" });
    }
  });
  // Add member search endpoint
  app.get("/api/members", async (req, res) => {
    try {
      const searchTerm = req.query.search as string;
      const filters = {
        membershipType: req.query.membershipType as string,
        status: req.query.status as string
      };
      const members = await searchMembers(searchTerm, filters);
      res.json(members);
    } catch (error) {
      console.error("Error searching members:", error);
      res.status(500).json({ error: "Failed to search members" });
    }
  });
  // Add health report generation endpoint
  app.post("/api/health-report", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      // Mock data for demonstration - replace with actual data fetching
      const metrics = [
        {
          name: "Steps",
          value: 8432,
          unit: "steps",
          date: new Date().toISOString()
        },
        {
          name: "Heart Rate",
          value: 72,
          unit: "bpm",
          date: new Date().toISOString()
        },
        {
          name: "Sleep",
          value: 7.5,
          unit: "hours",
          date: new Date().toISOString()
        },
        {
          name: "Calories",
          value: 2250,
          unit: "kcal",
          date: new Date().toISOString()
        }
      ];
      const achievements = [
        {
          name: "Fitness Warrior",
          description: "Complete 10 workouts in a month",
          completedAt: "2025-01-20",
          progress: 100
        },
        {
          name: "Consistency King",
          description: "Log in for 7 consecutive days",
          progress: 85
        },
        {
          name: "Health Champion",
          description: "Maintain heart rate zones during workouts",
          progress: 60
        }
      ];
      const filename = await generateHealthReport(userId, metrics, achievements);
      res.json({
        success: true,
        filename,
        downloadUrl: `/uploads/${filename}`
      });
    } catch (error) {
      console.error("Error generating health report:", error);
      res.status(500).json({
        error: "Failed to generate health report",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  // Add calendar event endpoints
  app.get("/api/marketing/calendar/events", async (req: AuthenticatedRequest, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      // Get events from database
      const events = await db.query.marketingEvents.findMany({
        where: and(
          startDate ? gte(marketingEvents.startDate, startDate) : undefined,
          endDate ? lte(marketingEvents.endDate, endDate) : undefined
        ),
        orderBy: [marketingEvents.startDate]
      });
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });
  app.post("/api/marketing/calendar/events", async (req: AuthenticatedRequest, res) => {
    try {
      const { title, description, startDate, endDate, type, status, location } = req.body;
      // Validate required fields
      if (!title || !startDate || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      // Create new event
      const [event] = await db
        .insert(marketingEvents)
        .values({
          title,
          description,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          type,
          status: status || 'scheduled',
          createdBy: req.user?.id || 'system',
          location
        })
        .returning();
      // Broadcast event to connected clients
      wsServer.broadcastToRoom('calendar', {
        type: 'calendar_event_created',
        data: event
      });
      res.json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ error: "Failed to create calendar event" });
    }
  });
  app.post("/api/marketing/calendar/sync-outlook", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      // Simulate Outlook sync for now (will be replaced with actual Microsoft Graph API integration)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const sampleOutlookEvent = {
        id: "outlook-1",
        title: "Marketing Team Meeting",
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        type: "meeting",
        status: "scheduled",
        outlookEventId: "123456"
      };
      res.json({
        message: "Calendar synced with Outlook",
        syncedEvents: [sampleOutlookEvent]
      });
    } catch (error) {
      console.error("Error syncing with Outlook:", error);
      res.status(500).json({ error: "Failed to sync with Outlook calendar" });
    }
  });
  // Add member update endpoint
  app.patch("/api/members/:memberId", async (req, res) => {
    try {
      const { memberId } = req.params;
      const updates = req.body;
      const updatedMember = await updateMemberData(memberId, updates);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({ error: "Failed to update member data" });
    }
  });
  // Add member search endpoint
  app.get("/api/members", async (req, res) => {
    try {
      const searchTerm = req.query.search as string;
      const filters = {
        membershipType: req.query.membershipType as string,
        status: req.query.status as string
      };
      const members = await searchMembers(searchTerm, filters);
      res.json(members);
    } catch (error) {
      console.error("Error searching members:", error);
      res.status(500).json({ error: "Failed to search members" });
    }
  });
  // Add health report generation endpoint
  app.post("/api/health-report", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      // Mock data for demonstration - replace with actual data fetching
      const metrics = [
        {
          name: "Steps",
          value: 8432,
          unit: "steps",
          date: new Date().toISOString()
        },
        {
          name: "Heart Rate",
          value: 72,
          unit: "bpm",
          date: new Date().toISOString()
        },
        {
          name: "Sleep",
          value: 7.5,
          unit: "hours",
          date: new Date().toISOString()
        },
        {
          name: "Calories",
          value: 2250,
          unit: "kcal",
          date: new Date().toISOString()
        }
      ];
      const achievements = [
        {
          name: "Fitness Warrior",
          description: "Complete 10 workouts in a month",
          completedAt: "2025-01-20",
          progress: 100
        },
        {
          name: "Consistency King",
          description: "Log in for 7 consecutive days",
          progress: 85
        },
        {
          name: "Health Champion",
          description: "Maintain heart rate zones during workouts",
          progress: 60
        }
      ];
      const filename = await generateHealthReport(userId, metrics, achievements);
      res.json({
        success: true,
        filename,
        downloadUrl: `/uploads/${filename}`
      });
    } catch (error) {
      console.error("Error generating health report:", error);
      res.status(500).json({
        error: "Failed to generate health report",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  // Add calendar event endpoints
  app.get("/api/marketing/calendar/events", async (req: AuthenticatedRequest, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      // Get events from database
      const events = await db.query.marketingEvents.findMany({
        where: and(
          startDate ? gte(marketingEvents.startDate, startDate) : undefined,
          endDate ? lte(marketingEvents.endDate, endDate) : undefined
        ),
        orderBy: [marketingEvents.startDate]
      });
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });
  app.post("/api/marketing/calendar/events", async (req: AuthenticatedRequest, res) => {
    try {
      const { title, description, startDate, endDate, type, status, location } = req.body;
      // Validate required fields
      if (!title || !startDate || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      // Create new event
      const [event] = await db
        .insert(marketingEvents)
        .values({
          title,
          description,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          type,
          status: status || 'scheduled',
          createdBy: req.user?.id || 'system',
          location
        })
        .returning();
      // Broadcast event to connected clients
      wsServer.broadcastToRoom('calendar', {
        type: 'calendar_event_created',
        data: event
      });
      res.json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ error: "Failed to create calendar event" });
    }
  });
  app.post("/api/marketing/calendar/sync-outlook", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      // Simulate Outlook sync for now (will be replaced with actual Microsoft Graph API integration)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const sampleOutlookEvent = {
        id: "outlook-1",
        title: "Marketing Team Meeting",
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        type: "meeting",
        status: "scheduled",
        outlookEventId: "123456"
      };
      res.json({
        message: "Calendar synced with Outlook",
        syncedEvents: [sampleOutlookEvent]
      });
    } catch (error) {
      console.error("Error syncing with Outlook:", error);
      res.status(500).json({ error: "Failed to sync with Outlook calendar" });
    }
  });
  // Add manufacturing projects routes
  app.use("/api/manufacturing/projects", projectsRouter);
  // Add material handling routes
  app.get("/api/material/stats", async (_req, res) => {
    try {
      // Mock data for now - in production this would be calculated from real data
      const stats = {
        totalItems: 156,
        activeOrders: 12,
        lowStockItems: 8,
        warehouseCapacity: 75,
        totalValue: 287500,
        stockoutRate: 0.02,
        inventoryTurnover: 4.5,
        averageLeadTime: 5.2
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching material stats:", error);
      res.status(500).json({ error: "Failed to fetch material stats" });
    }
  });

  app.get("/api/material/warehouses", async (_req, res) => {
    try {
      // Mock warehouse data - in production this would come from the database
      const warehouses = [
        {
          id: "wh-1",
          name: "Main Distribution Center",
          type: "primary",
          capacity: {
            total: 10000,
            used: 7500,
            available: 2500
          }
        },
        {
          id: "wh-2",
          name: "East Coast Facility",
          type: "secondary",
          capacity: {
            total: 5000,
            used: 3000,
            available: 2000
          }
        }
      ];
      res.json(warehouses);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      res.status(500).json({ error: "Failed to fetch warehouses" });
    }
  });

  app.get("/api/material/inventory", async (_req, res) => {
    try {
      // Mock inventory data - in production this would come from the database
      const materials = [
        {
          id: "mat-1",
          sku: "SKU001",
          name: "Aluminum Sheet",
          description: "High-grade aluminum sheet metal",
          category: "Raw Materials",
          unit: "sheets",
          unitPrice: 45.99,
          currentStock: 150,
          allocatedStock: 20,
          availableStock: 130,
          minimumStock: 50,
          reorderPoint: 75,
          supplier: {
            id: "sup-1",
            name: "MetalCo Industries",
            code: "MCI001",
            contact: {
              name: "John Smith",
              email: "john@metalco.com",
              phone: "555-0123"
            },
            rating: 4.5
          }
        },
        // Add more mock materials as needed
      ];
      res.json(materials);
    } catch (error) {
      console.error("Error fetching materials:", error);
      res.status(500).json({ error: "Failed to fetch materials" });
    }
  });
  app.use("/api/training", trainingRouter); // Add this line
  
  // Add manufacturing quality routes
  app.use("/api/manufacturing/quality", qualityRouter);
  
  // Register quality templates routes
  registerQualityRoutes(app);
  
  const httpServer = createServer(app);
  return httpServer;
}
export function setupWebSocketServer(httpServer: Server, app: Express): WebSocketServer {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/socket.io'
  });
  const clients = new Map<string, WebSocket>();
  const rooms = new Map<string, Set<WebSocket>>();
  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'join_room') {
          const roomName = data.room;
          if (!rooms.has(roomName)) {
            rooms.set(roomName, new Set());
          }
          rooms.get(roomName)?.add(ws);
          console.log(`Client joined room: ${roomName}`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    ws.on('close', () => {
      // Remove client from all rooms
      rooms.forEach(clients => clients.delete(ws));
    });
  });
  // Add broadcast helper
  wss.broadcastToRoom = (room: string, message: any) => {
    const clients = rooms.get(room);
    if (clients) {
      const messageStr = JSON.stringify(message);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }
  };
  wss.broadcastTrainingLevel = async (userId: string) => {
    try {
      const trainingLevel = await getUserTrainingLevel(userId);
      wss.broadcastToRoom('training', { type: 'training_level_updated', trainingLevel });
    } catch (error) {
      console.error("Error broadcasting training level:", error);
    }
  };
  // Add calendar events endpoints
  app.get('/api/marketing/calendar/events', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const events = await db.select().from(marketingEvents)
        .where(
          and(
            gte(marketingEvents.startDate, new Date(startDate as string)),
            lte(marketingEvents.endDate, new Date(endDate as string))
          )
        );
      res.json(events);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
  });
  app.post('/api/marketing/calendar/events', async (req: AuthenticatedRequest, res) => {
    try {
      const eventData = {
        ...req.body,
        createdBy: req.user?.id || 'anonymous',
        status: 'scheduled'
      };
      const [event] = await db.insert(marketingEvents)
        .values(eventData)
        .returning();
      // Broadcast to all clients in the calendar room
      wss.broadcastToRoom('calendar', {
        type: 'calendar_event_created',
        event
      });
      res.json(event);
    } catch (error) {
      console.error('Error creating calendar event:', error);
      res.status(500).json({ error: 'Failed to create calendar event' });
    }
  });
  app.post('/api/marketing/calendar/sync-outlook', async (req: AuthenticatedRequest, res) => {
    try {
      // For demo purposes, simulate syncing with Outlook
      // In production, this would use Microsoft Graph API
      const events = await db.select().from(marketingEvents)
        .where(eq(marketingEvents.createdBy, req.user?.id || 'anonymous'));
      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Update events with mock Outlook IDs
      const syncedEvents = await Promise.all(events.map(async event => {
        if (!event.outlookEventId) {
          const [updated] = await db.update(marketingEvents)
            .set({
              outlookEventId: `outlook-${Math.random().toString(36).slice(2)}`,
              outlookCalendarId: 'primary',
              lastSyncedAt: new Date()
            })
            .where(eq(marketingEvents.id, event.id))
            .returning();
          return updated;
        }
        return event;
      }));
      res.json({ syncedEvents });
    } catch (error) {
      console.error('Error syncing with Outlook:', error);
      res.status(500).json({ error: 'Failed to sync with Outlook' });
    }
  });
  // Add manufacturing projects routes
  app.use("/api/manufacturing/projects", projectsRouter);
  
  // Quality inspection template routes are already registered
  
  return wss;
}