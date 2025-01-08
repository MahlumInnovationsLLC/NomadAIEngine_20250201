import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { chats, messages, notifications, userNotifications } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";
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

  // Create a new chat with AI-generated title
  app.post("/api/chats", async (req, res) => {
    try {
      const { content } = req.body;
      const userId = "user123"; // Mock user ID until auth is implemented

      // Generate a title for the chat based on the first message
      const titleResponse = await getChatCompletion([
        {
          role: "system",
          content: "Generate a brief, descriptive title (max 6 words) for a chat that starts with this message. Return only the title text."
        },
        { role: "user", content }
      ]);

      // Create new chat
      const [chat] = await db.insert(chats)
        .values({
          title: titleResponse.trim(),
          userId,
          lastMessageAt: new Date(),
        })
        .returning();

      // Create first message
      await db.insert(messages)
        .values({
          chatId: chat.id,
          role: 'user',
          content,
        });

      res.json(chat);
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ error: "Failed to create chat" });
    }
  });

  // Update chat title
  app.patch("/api/chats/:id", async (req, res) => {
    try {
      const { title } = req.body;
      const [updatedChat] = await db.update(chats)
        .set({ title })
        .where(eq(chats.id, parseInt(req.params.id)))
        .returning();

      res.json(updatedChat);
    } catch (error) {
      console.error("Error updating chat:", error);
      res.status(500).json({ error: "Failed to update chat" });
    }
  });

  // Chat message endpoint
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

      // Check if this is a direct request for a report
      if (content.toLowerCase().includes('yes, generate') || 
          content.toLowerCase().includes('yes, give me') ||
          content.toLowerCase().includes('generate a downloadable') ||
          content.toLowerCase().includes('create a downloadable')) {
        try {
          const reportTopic = content.replace(/yes,?\s*(generate|create|give me)\s*(a|the)?\s*report/i, '').trim();
          const filename = await generateReport(reportTopic);
          const message = {
            id: Date.now(),
            content: `I've prepared a detailed report based on your request. You can download it here:\n\n[Click here to download the report](/uploads/${filename})`,
            role: 'assistant'
          };
          return res.json(message);
        } catch (error) {
          console.error("Error generating report:", error);
          return res.json({
            id: Date.now(),
            content: "I apologize, but I encountered an error while generating the report. Please try again.",
            role: 'assistant'
          });
        }
      }

      // Get chat completion from Azure OpenAI
      const response = await getChatCompletion([
        { 
          role: "system", 
          content: "You are GYM AI Engine, an intelligent assistant helping users with gym management, training, and equipment maintenance. Format your responses using Markdown:\n\n- Use # for main headings\n- Use ** for bold text\n- Use - for bullet points\n- Use 1. for numbered lists\n\nWhen users ask for a report or analysis, respond with: 'I can help you create a detailed report on [topic]. Would you like me to generate a downloadable Word document for you? Just let me know by saying \"Yes, generate the report\" and I'll create a comprehensive document that you can download.'\n\nFor reports, provide extensive detail including market analysis, trends, statistics, and in-depth explanations. Structure the content with clear sections and subsections."
        },
        { role: "user", content }
      ]);

      // Save assistant message
      const [assistantMessage] = await db.insert(messages)
        .values({
          chatId: parseInt(chatId),
          role: 'assistant',
          content: response,
        })
        .returning();

      res.json(assistantMessage);
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // Get chat messages
  app.get("/api/messages/:chatId", async (req, res) => {
    try {
      const chatMessages = await db.query.messages.findMany({
        where: eq(messages.chatId, parseInt(req.params.chatId)),
        orderBy: [messages.createdAt],
      });

      res.json(chatMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  return httpServer;
}