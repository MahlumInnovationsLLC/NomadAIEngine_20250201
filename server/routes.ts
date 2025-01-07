import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { db } from "@db";
import { chats, messages, files, reports } from "@db/schema";
import { eq } from "drizzle-orm";

const upload = multer({ dest: 'uploads/' });

export function registerRoutes(app: Express): Server {
  // Chat endpoints
  app.get("/api/chats", async (req, res) => {
    const result = await db.query.chats.findMany({
      with: {
        messages: true
      }
    });
    res.json(result);
  });

  app.get("/api/chats/:id", async (req, res) => {
    const result = await db.query.chats.findFirst({
      where: eq(chats.id, parseInt(req.params.id)),
      with: {
        messages: true
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

  // Message endpoints
  app.get("/api/messages", async (req, res) => {
    const chatId = req.query.chatId;
    const result = await db.query.messages.findMany({
      where: chatId ? eq(messages.chatId, parseInt(chatId as string)) : undefined,
      with: {
        files: true
      }
    });
    res.json(result);
  });

  app.post("/api/messages", async (req, res) => {
    const result = await db.insert(messages).values({
      chatId: req.body.chatId,
      role: req.body.role,
      content: req.body.content
    }).returning();
    res.json(result[0]);
  });

  // File upload endpoints
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

  // Report endpoints
  app.post("/api/reports", async (req, res) => {
    const result = await db.insert(reports).values({
      chatId: req.body.chatId,
      content: req.body.content
    }).returning();
    res.json(result[0]);
  });

  const httpServer = createServer(app);
  return httpServer;
}
