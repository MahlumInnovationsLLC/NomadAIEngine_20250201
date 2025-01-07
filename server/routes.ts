import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import multer from "multer";
import { db } from "@db";
import { documents, documentCollaborators, documentWorkflows, chats, equipment, floorPlans, equipmentTypes } from "@db/schema";
import { eq, sql, desc } from "drizzle-orm";
import * as cosmosService from "./services/azure/cosmos_service";
import * as blobService from "./services/azure/blob_service";
import * as openAIService from "./services/azure/openai_service";
import { openai } from "./services/azure/openai_service";
import * as searchService from "./services/search";

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  // WebSocket connection handling
  httpServer.on('upgrade', (request, socket, head) => {
    if (request.headers['sec-websocket-protocol'] === 'vite-hmr') {
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  // WebSocket message handling (unchanged from original)
  wss.on('connection', (ws: WebSocketClient) => {
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'join':
            ws.documentId = message.documentId;
            ws.userId = message.userId;
            // Broadcast to other clients that a new user joined
            broadcastToDocument(ws.documentId, {
              type: 'user_joined',
              userId: ws.userId
            }, ws);
            break;

          case 'operation':
            const operation: DocumentOperation = message.operation;
            // Apply operation to the document
            await applyDocumentOperation(operation);
            // Broadcast operation to other clients
            broadcastToDocument(ws.documentId!, {
              type: 'operation',
              operation
            }, ws);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (ws.documentId && ws.userId) {
        broadcastToDocument(ws.documentId, {
          type: 'user_left',
          userId: ws.userId
        }, ws);
      }
    });
  });

  function broadcastToDocument(documentId: number, message: any, exclude?: WebSocket) {
    wss.clients.forEach((client: WebSocketClient) => {
      if (client !== exclude && client.documentId === documentId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  async function applyDocumentOperation(operation: DocumentOperation) {
    const document = await cosmosService.getDocument(operation.documentId.toString());

    if (!document) return;

    let newContent = document.content;
    switch (operation.type) {
      case 'insert':
        newContent = newContent.slice(0, operation.position) +
                    operation.content! +
                    newContent.slice(operation.position);
        break;
      case 'delete':
        newContent = newContent.slice(0, operation.position) +
                    newContent.slice(operation.position + operation.length!);
        break;
    }

    await cosmosService.updateDocument(operation.documentId.toString(), {
      ...document,
      content: newContent,
      version: document.version + 1,
      updatedAt: new Date().toISOString()
    });
  }

  // Document REST endpoints (unchanged from original)
  app.post("/api/documents/:id/index", async (req, res) => {
    try {
      await searchService.indexDocument(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to index document" });
    }
  });

  app.get("/api/search", async (req, res) => {
    const { q: query, limit = 5 } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    try {
      const results = await searchService.semanticSearch(query, Number(limit));
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.post("/api/documents/:id/collaborators", async (req, res) => {
    try {
      const docId = parseInt(req.params.id);
      if (isNaN(docId)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }

      const result = await db.insert(documentCollaborators).values({
        documentId: docId,
        userId: req.body.userId,
        canEdit: req.body.canEdit
      }).returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to add collaborator" });
    }
  });

  // Dashboard endpoints (unchanged from original)
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const [
        totalDocuments,
        activeChats,
        collaborators,
        activeWorkflows
      ] = await Promise.all([
        db.select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` }).from(documents),
        db.select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` }).from(chats),
        db.select({ count: sql<number>`CAST(COUNT(DISTINCT user_id) AS INTEGER)` }).from(documentCollaborators),
        db.select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
          .from(documentWorkflows)
          .where(eq(documentWorkflows.status, 'active')),
      ]);

      res.json({
        totalDocuments: totalDocuments[0].count || 0,
        activeChats: activeChats[0].count || 0,
        collaborators: collaborators[0].count || 0,
        activeWorkflows: activeWorkflows[0].count || 0,
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/documents/recent", async (req, res) => {
    try {
      const recentDocs = await db.query.documents.findMany({
        orderBy: [desc(documents.updatedAt)],
        limit: 5,
      });
      res.json(recentDocs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent documents" });
    }
  });

  app.get("/api/dashboard/activity", async (req, res) => {
    try {
      const activities = [];

      // Get recent document updates
      const recentDocuments = await db.query.documents.findMany({
        orderBy: [desc(documents.updatedAt)],
        limit: 3,
      });

      activities.push(...recentDocuments.map(doc => ({
        id: `doc-${doc.id}`,
        type: 'document',
        description: `Updated document: ${doc.title}`,
        timestamp: doc.updatedAt,
      })));

      // Get recent messages
      const recentMessages = await db.query.messages.findMany({
        orderBy: [desc(messages.createdAt)],
        limit: 3,
      });

      activities.push(...recentMessages.map(msg => ({
        id: `msg-${msg.id}`,
        type: 'message',
        description: `New message in chat #${msg.chatId}`,
        timestamp: msg.createdAt,
      })));

      // Sort all activities by timestamp
      activities.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      res.json(activities.slice(0, 5));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity feed" });
    }
  });

  // Azure Services Status Endpoint (unchanged from original)
  app.get("/api/azure/status", async (_req, res) => {
    try {
      const status = [];

      // Check Cosmos DB Status
      try {
        await cosmosService.getDocument("health-check");
        status.push({
          name: "Cosmos DB",
          status: "connected",
        });
      } catch (error) {
        status.push({
          name: "Cosmos DB",
          status: "error",
          message: "Connection failed",
        });
      }

      // Check Blob Storage Status
      try {
        await blobService.listFiles("health-check/");
        status.push({
          name: "Blob Storage",
          status: "connected",
        });
      } catch (error) {
        status.push({
          name: "Blob Storage",
          status: "error",
          message: "Connection failed",
        });
      }

      // Check OpenAI Status
      try {
        await openAIService.generateEmbeddings("health check");
        status.push({
          name: "Azure OpenAI",
          status: "connected",
        });
      } catch (error) {
        status.push({
          name: "Azure OpenAI",
          status: "error",
          message: "Connection failed",
        });
      }

      res.json(status);
    } catch (error) {
      console.error("Error checking Azure services status:", error);
      res.status(500).json({ error: "Failed to check services status" });
    }
  });

  // Chat routes (unchanged from original)
  app.get("/api/chats", async (req, res) => {
    const result = await db.query.chats.findMany({
      with: {
        messages: true,
      }
    });
    res.json(result);
  });

  app.post("/api/chats", async (req, res) => {
    const result = await db.insert(chats).values({
      title: req.body.title,
      userId: req.body.userId
    }).returning();
    res.json(result[0]);
  });

  app.post("/api/messages", async (req, res) => {
    const result = await db.insert(messages).values({
      chatId: req.body.chatId,
      role: req.body.role,
      content: req.body.content
    }).returning();
    res.json(result[0]);
  });

  app.post("/api/files", upload.array("files"), async (req, res) => {
    const uploadedFiles = req.files as Express.Multer.File[];
    const results = await Promise.all(
      uploadedFiles.map(file =>
        db.insert(messages).values({
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size.toString(),
          path: file.path,
          messageId: req.body.messageId
        }).returning()
      )
    );
    res.json(results.map(r => r[0]));
  });


  // Document management with Azure integration (unchanged from original)
  app.post("/api/documents", upload.single('file'), async (req, res) => {
    try {
      // Create document metadata in Cosmos DB
      const document = await cosmosService.storeDocument({
        title: req.body.title,
        content: req.body.content || "",
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // If there's a file, store it in Blob Storage
      if (req.file) {
        const blobUrl = await blobService.uploadFile(
          `${document.id}/${req.file.originalname}`,
          req.file.buffer,
          {
            documentId: document.id,
            contentType: req.file.mimetype
          }
        );

        // Update document with blob URL
        await cosmosService.updateDocument(document.id, {
          ...document,
          blobUrl
        });
      }

      // Generate AI insights if content is available
      if (req.body.content) {
        const [summary, analysis] = await Promise.all([
          openAIService.generateSummary(req.body.content),
          openAIService.analyzeDocument(req.body.content)
        ]);

        // Store AI insights
        await cosmosService.updateDocument(document.id, {
          ...document,
          aiInsights: {
            summary,
            analysis
          }
        });
      }

      res.json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await cosmosService.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  app.get("/api/documents", async (req, res) => {
    try {
      const querySpec = {
        query: "SELECT * FROM c ORDER BY c.updatedAt DESC"
      };
      const documents = await cosmosService.listDocuments(querySpec);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Version control with Blob Storage (unchanged from original)
  app.post("/api/documents/:id/versions", upload.single('file'), async (req, res) => {
    try {
      const documentId = req.params.id;
      const document = await cosmosService.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Store new version in Blob Storage
      const versionNumber = document.version + 1;
      const blobUrl = await blobService.uploadFile(
        `${documentId}/v${versionNumber}/${req.file?.originalname || 'content.txt'}`,
        req.file?.buffer || Buffer.from(req.body.content || ''),
        {
          documentId,
          version: versionNumber.toString(),
          contentType: req.file?.mimetype || 'text/plain'
        }
      );

      // Update document metadata
      const updatedDocument = await cosmosService.updateDocument(documentId, {
        ...document,
        version: versionNumber,
        blobUrl,
        updatedAt: new Date().toISOString()
      });

      res.json(updatedDocument);
    } catch (error) {
      res.status(500).json({ error: "Failed to create document version" });
    }
  });

  // Get document versions (unchanged from original)
  app.get("/api/documents/:id/versions", async (req, res) => {
    try {
      const documentId = req.params.id;
      const files = await blobService.listFiles(`${documentId}/`);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document versions" });
    }
  });

  // Download specific version (unchanged from original)
  app.get("/api/documents/:id/versions/:version", async (req, res) => {
    try {
      const { id, version } = req.params;
      const downloadResponse = await blobService.downloadFile(`${id}/v${version}/content.txt`);
      res.setHeader('Content-Type', 'application/octet-stream');
      downloadResponse.readableStreamBody?.pipe(res);
    } catch (error) {
      res.status(500).json({ error: "Failed to download document version" });
    }
  });

  // Floor plan routes (unchanged from original)
  app.get("/api/floor-plans/active", async (_req, res) => {
    try {
      const activePlan = await db.query.floorPlans.findFirst({
        where: eq(floorPlans.isActive, true)
      });
      res.json(activePlan);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active floor plan" });
    }
  });

  app.patch("/api/floor-plans/:id", async (req, res) => {
    try {
      const result = await db.update(floorPlans)
        .set({
          gridSize: req.body.gridSize,
          dimensions: req.body.dimensions,
          metadata: req.body.metadata,
          updatedAt: new Date()
        })
        .where(eq(floorPlans.id, parseInt(req.params.id)))
        .returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update floor plan" });
    }
  });

  // Equipment routes (modified with edited code)
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

  app.delete("/api/equipment/:id", async (req, res) => {
    try {
      await db.delete(equipment)
        .where(eq(equipment.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete equipment" });
    }
  });

  // Equipment maintenance routes (modified with edited code)
  app.post("/api/equipment/:id/maintenance", async (req, res) => {
    try {
      const { scheduledFor, type, notes } = req.body;
      const equipmentId = parseInt(req.params.id);

      const result = await db.update(equipment)
        .set({
          nextMaintenance: new Date(scheduledFor),
          maintenanceType: type,
          maintenanceNotes: notes,
          updatedAt: new Date()
        })
        .where(eq(equipment.id, equipmentId))
        .returning();

      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to schedule maintenance" });
    }
  });

  // Equipment troubleshooting routes (unchanged from original)
  app.get("/api/equipment/:id/troubleshooting", async (req, res) => {
    try {
      // In a real application, this would be fetched from a database
      // For now, we'll return mock troubleshooting data
      const mockGuide = {
        steps: [
          {
            id: "1",
            title: "Power Issues",
            description: "Equipment is not turning on or display is blank",
            solution: "Check power connection and verify outlet functionality. If using battery power, replace or recharge batteries.",
            severity: "high"
          },
          {
            id: "2",
            title: "Unusual Noise",
            description: "Equipment is making grinding or squeaking sounds during operation",
            solution: "Inspect moving parts for wear and tear. Apply appropriate lubricant to designated areas.",
            severity: "medium"
          },
          {
            id: "3",
            title: "Display Errors",
            description: "Error codes or garbled display on the equipment screen",
            solution: "Power cycle the equipment. If error persists, note the error code and contact manufacturer support.",
            severity: "medium"
          },
          {
            id: "4",
            title: "Connectivity Issues",
            description: "Equipment is not transmitting data or showing offline status",
            solution: "Check wireless connection strength and reset network adapter. Verify IoT sensor attachment.",
            severity: "high"
          }
        ]
      };

      res.json(mockGuide);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch troubleshooting guide" });
    }
  });

  // Equipment type routes (unchanged from original)
  app.post("/api/equipment-types", async (req, res) => {
    try {
      const result = await db.insert(equipmentTypes)
        .values({
          name: req.body.name,
          manufacturer: req.body.manufacturer,
          model: req.body.model,
          category: req.body.category,
          connectivityType: req.body.connectivityType,
        })
        .returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to create equipment type" });
    }
  });

  app.post("/api/equipment", async (req, res) => {
    try {
      const result = await db.insert(equipment)
        .values({
          name: req.body.name,
          equipmentTypeId: req.body.equipmentTypeId,
          status: req.body.status,
          healthScore: req.body.healthScore,
          deviceConnectionStatus: req.body.deviceConnectionStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to create equipment" });
    }
  });

  // Equipment usage prediction routes (modified with edited code)
  app.get("/api/equipment/:id/predictions", async (req, res) => {
    try {
      const { timeRange = '7d' } = req.query;
      const equipmentId = parseInt(req.params.id);

      // For now, generate mock data until we have real-time data
      const mockData = Array.from({ length: timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30 }, (_, i) => {
        const date = new Date();
        date.setHours(date.getHours() - (timeRange === '24h' ? i : i * 24));

        return {
          equipment_id: equipmentId,
          timestamp: date.toISOString(),
          predicted_usage: Math.random() * 100,
          confidence: 0.7 + Math.random() * 0.3
        };
      });

      res.json(mockData.reverse());
    } catch (error) {
      console.error('Error fetching predictions:', error);
      res.status(500).json({ error: "Failed to fetch predictions" });
    }
  });

  app.post("/api/equipment/:id/generate-prediction", async (req, res) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const { timeRange = '7d' } = req.body;

      // Get equipment details
      const equipment = await db.query.equipment.findFirst({
        where: eq(equipment.id, equipmentId),
        with: {
          type: true
        }
      });

      if (!equipment) {
        return res.status(404).json({ error: "Equipment not found" });
      }

      // Use OpenAI to generate predictions
      const prompt = `Analyze the following fitness equipment and predict its usage pattern:
Equipment: ${equipment.name}
Type: ${equipment.type?.name || 'Unknown'}
Current Health Score: ${equipment.healthScore}%
Time Range: ${timeRange}

Generate a detailed prediction of equipment usage over the specified time range, considering:
1. Typical gym peak hours
2. Equipment popularity
3. Seasonal patterns
4. Current health status

Provide the prediction as a JSON array with hourly/daily predictions including confidence scores.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { 
            role: "system", 
            content: "You are an AI expert in fitness equipment usage analysis and prediction." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        response_format: { type: "json_object" }
      });

      const predictions = JSON.parse(completion.choices[0].message.content);
      res.json(predictions);
    } catch (error) {
      console.error('Error generating predictions:', error);
      res.status(500).json({ error: "Failed to generate predictions" });
    }
  });

  return httpServer;
}

interface DocumentOperation {
  type: 'insert' | 'delete' | 'update';
  position: number;
  content?: string;
  length?: number;
  documentId: number;
  userId: string;
}

interface WebSocketClient extends WebSocket {
  documentId?: number;
  userId?: string;
}