import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import multer from "multer";
import { db } from "@db";
import { chats, messages, documents, documentCollaborators, documentWorkflows } from "@db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { semanticSearch, indexDocument } from "./services/search";

const upload = multer({ dest: 'uploads/' });

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
    const document = await db.query.documents.findFirst({
      where: eq(documents.id, operation.documentId)
    });

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

    await db.update(documents)
      .set({
        content: newContent,
        version: document.version + 1,
        updatedAt: new Date()
      })
      .where(eq(documents.id, operation.documentId));
  }

  // Document REST endpoints
  app.post("/api/documents/:id/index", async (req, res) => {
    try {
      await indexDocument(parseInt(req.params.id));
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
      const results = await semanticSearch(query, Number(limit));
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const result = await db.insert(documents).values({
        title: req.body.title,
        content: req.body.content || "",
        chatId: req.body.chatId,
        version: 1
      }).returning();

      // Index the document after creation
      await indexDocument(result[0].id);
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const docId = parseInt(req.params.id);
      if (isNaN(docId)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }

      const result = await db.query.documents.findFirst({
        where: eq(documents.id, docId)
      });

      if (!result) {
        return res.status(404).json({ message: 'Document not found' });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document" });
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

  app.get("/api/chats", async (req, res) => {
    const result = await db.query.chats.findMany({
      with: {
        messages: true,
        documents: true
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
        db.insert(files).values({
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


  // Dashboard endpoints
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