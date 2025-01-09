import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import multer from "multer";
import { ContainerClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from 'uuid';
import { generateReport } from "./services/document-generator";
import { listChats } from "./services/azure/cosmos_service";
import { analyzeDocument, checkOpenAIConnection } from "./services/azure/openai_service";
import { setupWebSocketServer } from "./services/websocket";
import {
  initializeEquipmentDatabase,
  getEquipmentType,
  createEquipmentType,
  getAllEquipment,
  createEquipment,
  updateEquipment,
  type Equipment,
  type EquipmentType
} from "./services/azure/equipment_service";

// Add new imports for dashboard endpoints
import { getStorageMetrics, getRecentActivity } from "./services/azure/blob_service";


// Initialize Azure Blob Storage Client with SAS token
const sasUrl = "https://gymaidata.blob.core.windows.net/documents?sp=racwdli&st=2025-01-09T20:30:31Z&se=2026-01-02T04:30:31Z&spr=https&sv=2022-11-02&sr=c&sig=eCSIm%2B%2FjBLs2DjKlHicKtZGxVWIPihiFoRmld2UbpIE%3D";

if (!sasUrl) {
  throw new Error("Azure Blob Storage SAS URL not found");
}

console.log("Creating Container Client with SAS token...");
const containerClient = new ContainerClient(sasUrl);

console.log("Successfully created Container Client");

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  try {
    // Initialize Equipment Database
    console.log("Initializing Equipment Database...");
    await initializeEquipmentDatabase();
    console.log("Equipment Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Equipment Database:", error);
    throw error;
  }

  // Add uploads directory for serving generated files
  app.use('/uploads', express.static('uploads'));

  // Equipment Types endpoints
  app.post("/api/equipment-types", async (req, res) => {
    try {
      const type = req.body;
      const existingType = await getEquipmentType(type.manufacturer, type.model);

      if (existingType) {
        return res.json(existingType);
      }

      const newType = await createEquipmentType(type);
      res.json(newType);
    } catch (error) {
      console.error("Error creating equipment type:", error);
      res.status(500).json({ error: "Failed to create equipment type" });
    }
  });

  // Equipment endpoints
  app.get("/api/equipment", async (req, res) => {
    try {
      const equipment = await getAllEquipment();
      res.json(equipment);
    } catch (error) {
      console.error("Error getting equipment:", error);
      res.status(500).json({ error: "Failed to get equipment" });
    }
  });

  app.post("/api/equipment", async (req, res) => {
    try {
      const equipmentData = req.body;
      const newEquipment = await createEquipment(equipmentData);
      res.json(newEquipment);
    } catch (error) {
      console.error("Error creating equipment:", error);
      res.status(500).json({ error: "Failed to create equipment" });
    }
  });

  app.patch("/api/equipment/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedEquipment = await updateEquipment(id, updates);
      res.json(updatedEquipment);
    } catch (error) {
      console.error("Error updating equipment:", error);
      res.status(500).json({ error: "Failed to update equipment" });
    }
  });

  // Add equipment predictions endpoint
  app.get("/api/equipment/:id/predictions", (req, res) => {
    try {
      const { id } = req.params;

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
        equipment: { id },
        predictions,
        lastUpdated: now.toISOString()
      });
    } catch (error) {
      console.error("Error generating predictions:", error);
      res.status(500).json({ error: "Failed to generate predictions" });
    }
  });

  // Blob Storage endpoints
  app.get("/api/documents/browse", async (req, res) => {
    try {
      console.log("Listing blobs from container:", "documents");
      const path = (req.query.path as string) || "";
      console.log("Browsing path:", path);

      // List all blobs in the path
      const items = [];
      const listOptions = {
        prefix: path,
        delimiter: '/'
      };

      // Get all blobs with the specified prefix
      const blobs = containerClient.listBlobsByHierarchy('/', listOptions);

      console.log("Starting blob enumeration...");
      for await (const item of blobs) {
        console.log("Found item:", item.kind === "prefix" ? "Directory:" : "File:", item.name, "Details:", item);

        // Check if it's a virtual directory (folder)
        if (item.kind === "prefix") {
          // Get folder name by removing the trailing slash
          const folderPath = item.name;
          const folderName = folderPath.split('/').filter(Boolean).pop() || "";

          items.push({
            name: folderName,
            path: folderPath,
            type: "folder"
          });
        } else {
          // It's a blob (file)
          const blobItem = item;
          const fileName = blobItem.name.split("/").pop() || "";

          // Don't include folder markers
          if (!fileName.startsWith('.folder')) {
            items.push({
              name: fileName,
              path: blobItem.name,
              type: "file",
              size: blobItem.properties?.contentLength,
              lastModified: blobItem.properties?.lastModified?.toISOString()
            });
          }
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
      const path = req.body.path || "";
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      console.log("Uploading files to container:", "documents", "path:", path);
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
      const { path } = req.body;

      if (!path) {
        return res.status(400).json({ error: "Path is required" });
      }

      console.log("Creating folder:", path);

      // Create a zero-length blob with the folder name as prefix
      const folderPath = path.endsWith('/') ? path : `${path}/`;
      const blockBlobClient = containerClient.getBlockBlobClient(`${folderPath}.folder`);
      await blockBlobClient.uploadData(Buffer.from(''));

      console.log("Successfully created folder:", path);
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

  // Add dashboard metrics endpoint
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const [storageMetrics, azureStatus] = await Promise.all([
        getStorageMetrics(),
        checkOpenAIConnection()
      ]);

      const stats = {
        totalDocuments: storageMetrics.totalDocuments,
        totalStorageSize: storageMetrics.totalSize,
        documentTypes: storageMetrics.documentTypes,
        aiServiceStatus: azureStatus.some(s => s.name === "Azure OpenAI" && s.status === "connected"),
        storageStatus: azureStatus.some(s => s.name === "Azure Blob Storage" && s.status === "connected"),
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  });

  app.get("/api/dashboard/activity", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const recentActivity = await getRecentActivity(limit);
      res.json(recentActivity);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  return httpServer;
}