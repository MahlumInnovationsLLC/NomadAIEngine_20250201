import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { chats, messages } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { setupWebSocketServer } from "./services/websocket";
import { getChatCompletion } from "./services/azure-openai";
import { generateReport } from "./services/document-generator";
import { join } from "path";
import express from "express";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const wsServer = setupWebSocketServer(httpServer);

  // Clean up WebSocket server when HTTP server closes
  httpServer.on('close', () => {
    wsServer.close();
  });

  // Add uploads directory for serving generated files
  app.use('/uploads', express.static('uploads'));

  // Get all chats for the current user
  app.get("/api/chats", async (req, res) => {
    try {
      // For now, using a mock user ID until auth is implemented
      const userId = "user123";
      const userChats = await db.query.chats.findMany({
        where: eq(chats.userId, userId),
        orderBy: [desc(chats.lastMessageAt)],
        with: {
          messages: {
            limit: 1,
            orderBy: [desc(messages.createdAt)],
          },
        },
      });

      res.json(userChats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ error: "Failed to fetch chats" });
    }
  });

  // Delete a chat
  app.delete("/api/chats/:id", async (req, res) => {
    try {
      await db.delete(messages)
        .where(eq(messages.chatId, parseInt(req.params.id)));

      await db.delete(chats)
        .where(eq(chats.id, parseInt(req.params.id)));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({ error: "Failed to delete chat" });
    }
  });

  // Get a specific chat
  app.get("/api/chats/:id", async (req, res) => {
    try {
      const chat = await db.query.chats.findFirst({
        where: eq(chats.id, parseInt(req.params.id)),
        with: {
          messages: true,
        },
      });

      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      res.json(chat);
    } catch (error) {
      console.error("Error fetching chat:", error);
      res.status(500).json({ error: "Failed to fetch chat" });
    }
  });

  // Create a new chat
  app.post("/api/chats", async (req, res) => {
    try {
      const { content } = req.body;
      const userId = "user123"; // Mock user ID until auth is implemented

      // Create new chat with initial title
      const [chat] = await db.insert(chats)
        .values({
          title: "New Chat",
          userId,
          lastMessageAt: new Date(),
        })
        .returning();

      // Create first message
      const [userMessage] = await db.insert(messages)
        .values({
          chatId: chat.id,
          role: 'user',
          content,
        })
        .returning();

      // Get AI response
      const aiResponse = `I'm here to help! Here's my response to: ${content}`;

      // Save AI response
      const [aiMessage] = await db.insert(messages)
        .values({
          chatId: chat.id,
          role: 'assistant',
          content: aiResponse,
        })
        .returning();

      res.json({ ...chat, messages: [userMessage, aiMessage] });
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ error: "Failed to create chat" });
    }
  });

  // Update chat title
  app.patch("/api/chats/:id", async (req, res) => {
    try {
      const { title } = req.body;
      const chatId = parseInt(req.params.id);

      const [updatedChat] = await db.update(chats)
        .set({ title })
        .where(eq(chats.id, chatId))
        .returning();

      res.json(updatedChat);
    } catch (error) {
      console.error("Error updating chat:", error);
      res.status(500).json({ error: "Failed to update chat" });
    }
  });

  // Send a message
  app.post("/api/messages", async (req, res) => {
    try {
      const { content, chatId } = req.body;

      // Save user message
      const [userMessage] = await db.insert(messages)
        .values({
          chatId: parseInt(chatId),
          role: 'user',
          content,
        })
        .returning();

      // Update chat's last message timestamp
      await db.update(chats)
        .set({ lastMessageAt: new Date() })
        .where(eq(chats.id, parseInt(chatId)));

      // Get AI response
      const aiResponse = `Here's my response to: ${content}`;

      // Save AI response
      const [aiMessage] = await db.insert(messages)
        .values({
          chatId: parseInt(chatId),
          role: 'assistant',
          content: aiResponse,
        })
        .returning();

      res.json([userMessage, aiMessage]);
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  return httpServer;
}