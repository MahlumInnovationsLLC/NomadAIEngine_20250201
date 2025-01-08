import type { Express } from "express";
import { createServer, type Server } from "http";
import { createChat, updateChat, deleteChat, getChat, listChats } from "./services/azure/cosmos_service";
import { setupWebSocketServer } from "./services/websocket";
import { join } from "path";
import express from "express";
import { v4 as uuidv4 } from 'uuid';

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
      const chats = await listChats(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ error: "Failed to fetch chats" });
    }
  });

  // Delete a chat
  app.delete("/api/chats/:id", async (req, res) => {
    try {
      const userId = "user123"; // Mock user ID until auth is implemented
      await deleteChat(userId, req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({ error: "Failed to delete chat" });
    }
  });

  // Get a specific chat
  app.get("/api/chats/:id", async (req, res) => {
    try {
      const userId = "user123"; // Mock user ID until auth is implemented
      const chat = await getChat(userId, req.params.id);

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

      const chatId = uuidv4(); // Generate a unique UUID for the chat
      const messageId = uuidv4(); // Generate a unique UUID for the message

      const chatData = {
        id: chatId,
        userKey: userId, // Using userKey as partition key
        title: content.slice(0, 50) + (content.length > 50 ? "..." : ""), // Generate title from content
        messages: [{
          id: messageId,
          role: 'user',
          content,
          createdAt: new Date().toISOString()
        }],
        lastMessageAt: new Date().toISOString()
      };

      // Create chat in Cosmos DB
      const chat = await createChat(chatData);

      // Add AI response
      const aiMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `I'm here to help! Here's my response to: ${content}`,
        createdAt: new Date().toISOString()
      };

      // Update chat with AI response
      const updatedChat = await updateChat(userId, chatId, {
        messages: [...chat.messages, aiMessage]
      });

      res.json(updatedChat);
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ error: "Failed to create chat" });
    }
  });

  // Update chat title
  app.patch("/api/chats/:id", async (req, res) => {
    try {
      const { title } = req.body;
      const userId = "user123"; // Mock user ID until auth is implemented

      const updatedChat = await updateChat(userId, req.params.id, { title });
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
      const userId = "user123"; // Mock user ID until auth is implemented

      // Get current chat
      const chat = await getChat(userId, chatId);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      // Add user message
      const userMessage = {
        id: uuidv4(),
        role: 'user',
        content,
        createdAt: new Date().toISOString()
      };

      // Add AI response
      const aiMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `Here's my response to: ${content}`,
        createdAt: new Date().toISOString()
      };

      // Update chat with both messages
      await updateChat(userId, chatId, {
        messages: [...chat.messages, userMessage, aiMessage],
        lastMessageAt: new Date().toISOString()
      });

      res.json([userMessage, aiMessage]);
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  return httpServer;
}