import type { Express } from "express";
import { createServer, type Server } from "http";
import { analyzeDocument } from "./services/azure/openai_service";
import { setupWebSocketServer } from "./services/websocket";
import { v4 as uuidv4 } from 'uuid';
import express from "express";

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


  // Simple message endpoint that processes messages with Azure OpenAI
  app.post("/api/messages", async (req, res) => {
    try {
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      // Generate user message
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

      // Create AI message
      const aiMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: aiResponse || "I apologize, but I'm having trouble understanding your request. Could you please rephrase it?",
        createdAt: new Date().toISOString()
      };

      res.json([userMessage, aiMessage]);
    } catch (error: any) {
      console.error("Error processing message:", error);
      res.status(500).json({ error: "Failed to process message", details: error.message });
    }
  });

  return httpServer;
}