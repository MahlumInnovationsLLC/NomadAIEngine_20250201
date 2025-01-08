import type { Express } from "express";
import { createServer, type Server } from "http";
import { createChat, updateChat, deleteChat, getChat, listChats } from "./services/azure/cosmos_service";
import { setupWebSocketServer } from "./services/websocket";
import { analyzeDocument, checkOpenAIConnection } from "./services/azure/openai_service";
import { join } from "path";
import express from "express";
import { v4 as uuidv4 } from 'uuid';

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const wsServer = setupWebSocketServer(httpServer);

  // Add uploads directory for serving generated files
  app.use('/uploads', express.static('uploads'));

  // Check Azure OpenAI connection status
  app.get("/api/azure/status", async (req, res) => {
    try {
      const status = await checkOpenAIConnection();
      res.json(status);
    } catch (error) {
      console.error("Error checking Azure OpenAI status:", error);
      res.status(500).json({ 
        status: "error",
        message: "Failed to check Azure OpenAI status"
      });
    }
  });

  // Get all chats for the current user
  app.get("/api/chats", async (req, res) => {
    try {
      const userId = "user123"; // Mock user ID until auth is implemented
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
      const result = await deleteChat(userId, req.params.id);
      res.json(result);
    } catch (error: any) {
      console.error("Error deleting chat:", error);
      if (error.message === "Chat not found") {
        return res.status(404).json({ error: "Chat not found" });
      }
      if (error.message === "Unauthorized to delete this chat") {
        return res.status(403).json({ error: "Unauthorized to delete this chat" });
      }
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
      console.log("Received chat creation request:", req.body);
      const { content } = req.body;

      if (!content) {
        console.log("Missing content in request");
        return res.status(400).json({ error: "Content is required" });
      }

      const userId = "user123"; // Mock user ID until auth is implemented
      const chatId = uuidv4();
      const messageId = uuidv4();

      console.log("Generating new chat");
      const chatData = {
        id: chatId,
        userKey: userId,
        title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        messages: [{
          id: messageId,
          role: 'user',
          content,
          createdAt: new Date().toISOString()
        }],
        lastMessageAt: new Date().toISOString()
      };

      console.log("Creating chat with data:", chatData);
      const chat = await createChat(chatData);

      if (!chat || !Array.isArray(chat.messages)) {
        console.error("Invalid chat data received:", chat);
        throw new Error("Invalid chat data received from database");
      }

      // Add AI response using Azure OpenAI
      let aiResponse;
      try {
        aiResponse = await analyzeDocument(content);
      } catch (error) {
        console.error("Error getting AI response:", error);
        aiResponse = "I apologize, but I'm having trouble processing your request at the moment. Could you please try again?";
      }

      const aiMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: aiResponse || "I apologize, but I'm having trouble understanding your request. Could you please rephrase it?",
        createdAt: new Date().toISOString()
      };

      console.log("Adding AI response:", aiMessage);
      const updatedChat = await updateChat(userId, chat.id, {
        messages: [...chat.messages, aiMessage],
        lastMessageAt: new Date().toISOString()
      });

      console.log("Chat updated with AI response:", updatedChat);
      res.json(updatedChat);
    } catch (error: any) {
      console.error("Error in chat creation:", error);
      res.status(500).json({ error: "Failed to create chat", details: error.message });
    }
  });

  // Send a message
  app.post("/api/messages", async (req, res) => {
    try {
      console.log("Received message request:", req.body);
      const { content, chatId } = req.body;

      if (!content || !chatId) {
        console.log("Missing required fields:", { content, chatId });
        return res.status(400).json({ error: "Content and chatId are required" });
      }

      const userId = "user123";
      console.log("Fetching chat:", { userId, chatId });
      const chat = await getChat(userId, chatId);

      if (!chat) {
        console.log("Chat not found:", { userId, chatId });
        return res.status(404).json({ error: "Chat not found" });
      }

      if (!Array.isArray(chat.messages)) {
        console.error("Invalid chat data:", chat);
        throw new Error("Invalid chat data: messages array is missing");
      }

      // Add user message
      const userMessage = {
        id: uuidv4(),
        role: 'user',
        content,
        createdAt: new Date().toISOString()
      };

      // Get AI response using Azure OpenAI
      let aiResponse;
      try {
        aiResponse = await analyzeDocument(content);
      } catch (error) {
        console.error("Error getting AI response:", error);
        aiResponse = "I apologize, but I'm having trouble processing your request at the moment. Could you please try again?";
      }

      // Add AI response
      const aiMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: aiResponse || "I apologize, but I'm having trouble understanding your request. Could you please rephrase it?",
        createdAt: new Date().toISOString()
      };

      console.log("Updating chat with new messages:", { userMessage, aiMessage });
      await updateChat(userId, chatId, {
        messages: [...chat.messages, userMessage, aiMessage],
        lastMessageAt: new Date().toISOString()
      });

      console.log("Messages created successfully");
      res.json([userMessage, aiMessage]);
    } catch (error: any) {
      console.error("Error processing message:", error);
      res.status(500).json({ error: "Failed to process message", details: error.message });
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

  return httpServer;
}