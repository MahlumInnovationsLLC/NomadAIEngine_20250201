import type { Express } from "express";
import { createServer, type Server } from "http";
import { analyzeDocument, checkOpenAIConnection } from "./services/azure/openai_service";
import { setupWebSocketServer } from "./services/websocket";
import { v4 as uuidv4 } from 'uuid';
import express from "express";
import multer from "multer";
import { generateReport } from "./services/document-generator";
import { listChats } from "./services/azure/cosmos_service";
import { BlobServiceClient } from "@azure/storage-blob";

// Initialize Azure Blob Storage Client
if (!process.env.AZURE_BLOB_CONNECTION_STRING) {
  throw new Error("Azure Blob Storage connection string not found");
}

console.log("Attempting to connect to Azure Blob Storage...");
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_BLOB_CONNECTION_STRING
);
console.log("Successfully created Blob Service Client");

const containerName = "documents"; // Container name in Azure Blob Storage

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const wsServer = setupWebSocketServer(httpServer);

  // Add uploads directory for serving generated files
  app.use('/uploads', express.static('uploads'));

  // Blob Storage endpoints
  app.get("/api/documents/browse", async (req, res) => {
    try {
      console.log("Listing blobs from container:", containerName);
      const containerClient = blobServiceClient.getContainerClient(containerName);
      const path = (req.query.path as string) || "";
      console.log("Browsing path:", path);

      // Get all blobs with the specified prefix
      const blobs = containerClient.listBlobsByHierarchy("/", { prefix: path });

      const items = [];
      for await (const item of blobs) {
        // Check if it's a virtual directory (folder)
        if (item.kind === "prefix") {
          items.push({
            name: item.name.split("/").slice(-2)[0],
            path: item.name,
            type: "folder"
          });
        } else {
          // It's a blob (file)
          const blobItem = item;
          items.push({
            name: blobItem.name.split("/").pop() || "",
            path: blobItem.name,
            type: "file",
            size: blobItem.properties?.contentLength,
            lastModified: blobItem.properties?.lastModified?.toISOString()
          });
        }
      }

      console.log("Found items:", items);
      res.json(items);
    } catch (error) {
      console.error("Error listing blobs:", error);
      res.status(500).json({ error: "Failed to list documents" });
    }
  });

  // Route to handle file uploads
  app.post("/api/documents/upload", upload.array('files'), async (req, res) => {
    try {
      const containerClient = blobServiceClient.getContainerClient(containerName);
      const path = req.body.path || "";
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      console.log("Uploading files to container:", containerName, "path:", path);
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

  // Add folder creation endpoint
  app.post("/api/documents/folders", async (req, res) => {
    try {
      const containerClient = blobServiceClient.getContainerClient(containerName);
      const { path } = req.body;

      if (!path) {
        return res.status(400).json({ error: "Path is required" });
      }

      // In Azure Blob Storage, folders are virtual and created by adding a blob with
      // the folder name as prefix ending with a forward slash
      const blockBlobClient = containerClient.getBlockBlobClient(`${path}/.folder`);
      await blockBlobClient.uploadData(Buffer.from(''));

      res.json({ message: "Folder created successfully", path });
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(500).json({ error: "Failed to create folder" });
    }
  });

  // Chat history endpoint
  app.get("/api/chats", async (req, res) => {
    try {
      const userKey = 'default_user';
      const chats = await listChats(userKey);
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

  // Equipment Types endpoints
  app.post("/api/equipment-types", (req, res) => {
    try {
      const type = req.body;
      const existingType = equipmentTypes.find(
        t => t.manufacturer === type.manufacturer && t.model === type.model
      );

      if (existingType) {
        return res.json(existingType);
      }

      const newType = {
        id: uuidv4(),
        ...type
      };
      equipmentTypes.push(newType);
      res.json(newType);
    } catch (error) {
      console.error("Error creating equipment type:", error);
      res.status(500).json({ error: "Failed to create equipment type" });
    }
  });

  // Equipment endpoints
  app.get("/api/equipment", (req, res) => {
    res.json(equipment);
  });

  app.post("/api/equipment", (req, res) => {
    try {
      const equipmentData = req.body;
      const newEquipment = {
        id: uuidv4(),
        ...equipmentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      equipment.push(newEquipment);
      res.json(newEquipment);
    } catch (error) {
      console.error("Error creating equipment:", error);
      res.status(500).json({ error: "Failed to create equipment" });
    }
  });

  // Add equipment update endpoint
  app.patch("/api/equipment/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const equipmentIndex = equipment.findIndex(e => e.id === id);
      if (equipmentIndex === -1) {
        return res.status(404).json({ error: "Equipment not found" });
      }

      equipment[equipmentIndex] = {
        ...equipment[equipmentIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      res.json(equipment[equipmentIndex]);
    } catch (error) {
      console.error("Error updating equipment:", error);
      res.status(500).json({ error: "Failed to update equipment" });
    }
  });

  // Add equipment predictions endpoint
  app.get("/api/equipment/:id/predictions", (req, res) => {
    try {
      const { id } = req.params;
      const equipment_item = equipment.find(e => e.id === id);

      if (!equipment_item) {
        return res.status(404).json({ error: "Equipment not found" });
      }

      // Generate mock prediction data
      const now = new Date();
      const predictions = Array.from({ length: 24 }, (_, i) => {
        const hour = new Date(now);
        hour.setHours(hour.getHours() + i);
        return {
          timestamp: hour.toISOString(),
          predictedUsage: Math.round(Math.random() * 100),
          confidence: 0.7 + Math.random() * 0.3
        };
      });

      res.json({
        equipment: equipment_item,
        predictions,
        lastUpdated: now.toISOString()
      });
    } catch (error) {
      console.error("Error generating predictions:", error);
      res.status(500).json({ error: "Failed to generate predictions" });
    }
  });

  // Generate detailed report endpoint
  app.post("/api/generate-report", async (req, res) => {
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

  // Simple message endpoint that processes messages with Azure OpenAI
  app.post("/api/messages", async (req, res) => {
    try {
      console.log("Received message request:", req.body);
      const { content } = req.body;

      if (!content) {
        console.log("Missing content in request");
        return res.status(400).json({ error: "Content is required" });
      }

      // Generate user message
      const userMessage = {
        id: uuidv4(),
        role: 'user',
        content,
        createdAt: new Date().toISOString()
      };

      console.log("Generated user message:", userMessage);

      // Check if user is requesting a downloadable report
      const isReportRequest = content.toLowerCase().includes('report') || 
                             content.toLowerCase().includes('document') || 
                             content.toLowerCase().includes('download');

      // Get AI response using Azure OpenAI
      let aiResponse;
      let downloadUrl;
      try {
        console.log("Getting AI response for content:", content);
        aiResponse = await analyzeDocument(content);
        console.log("Received AI response:", aiResponse);

        // If this is a report request, generate a downloadable document
        if (isReportRequest && aiResponse) {
          console.log("Generating downloadable report...");
          const filename = await generateReport(aiResponse);
          if (filename) {
            downloadUrl = `/uploads/${filename}`;
            aiResponse = `${aiResponse}\n\nI've prepared a detailed report for you. You can download it here: [Download Report](${downloadUrl})`;
          }
        }
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

      console.log("Generated AI message:", aiMessage);
      console.log("Sending response with both messages");

      res.json([userMessage, aiMessage]);
    } catch (error: any) {
      console.error("Error processing message:", error);
      res.status(500).json({ error: "Failed to process message", details: error.message });
    }
  });

  // Check Azure OpenAI connection status
  app.get("/api/azure/status", async (req, res) => {
    try {
      console.log("Checking Azure services status...");
      const status = await checkOpenAIConnection();
      res.json(status);
    } catch (error) {
      console.error("Error checking Azure OpenAI status:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to check Azure OpenAI status",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });


  return httpServer;
}

let equipment = [];
let equipmentTypes = [];