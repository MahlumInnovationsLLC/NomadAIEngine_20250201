import express, { type Express } from "express";
import { createServer } from "http";
import { WebSocketServer } from 'ws';
import { db } from "@db";
import { CosmosClient } from "@azure/cosmos";
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from "./auth-middleware.js";
import { getEquipmentType, createEquipmentType, getAllEquipment, createEquipment, updateEquipment, uploadEquipmentImage } from './services/azure/equipment_service.js';
import trainingRouter from "./routes/training.js";
import { registerQualityRoutes } from "./routes/manufacturing/quality.js";
import azureADRouter from "./routes/azure-ad.js";

// Initialize Cosmos DB client
const cosmosClient = new CosmosClient(process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING || '');
const cosmosDatabase = cosmosClient.database("NomadAIEngineDB");
const containers = {};

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to create facility notifications
async function createFacilityNotification({
  buildingSystemId,
  type,
  title,
  message,
  priority = 'medium'
}) {
  try {
    const [notification] = await db
      .insert(facilityNotifications)
      .values({
        buildingSystemId,
        type,
        title,
        message,
        priority,
        status: 'unread',
        createdAt: new Date(),
      })
      .returning();
    return notification;
  } catch (error) {
    console.error("Error creating facility notification:", error);
    throw error;
  }
}

async function initializeContainers() {
  const containerConfigs = [
    { id: "chats", partitionKey: "/userKey" },
    { id: "equipment", partitionKey: "/id" },
    { id: "equipment-types", partitionKey: "/id" },
    { id: "building-systems", partitionKey: "/id" }
  ];
  try {
    await Promise.all(
      containerConfigs.map(async (config) => {
        const { container } = await cosmosDatabase.containers.createIfNotExists({
          id: config.id,
          partitionKey: { paths: [config.partitionKey] }
        });
        containers[config.id] = container;
      })
    );
    console.log("Successfully initialized all containers");
  } catch (error) {
    console.error("Error initializing containers:", error);
    throw error;
  }
}

// Initialize containers
initializeContainers().catch(console.error);

export function registerRoutes(app) {
  // Status endpoint for connection testing
  app.get("/api/status", (_req, res) => {
    res.json({
      status: "ok",
      time: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      }
    });
  });

  // Building Systems endpoints
  app.get("/api/facility/building-systems", async (_req, res) => {
    try {
      const systems = await db.select().from(buildingSystems);
      res.json(systems);
    } catch (error) {
      console.error("Error fetching building systems:", error);
      res.status(500).json({ error: "Failed to fetch building systems" });
    }
  });

  app.post("/api/facility/building-systems", async (req, res) => {
    try {
      const systemData = req.body;
      const newSystem = {
        name: systemData.name,
        type: systemData.type,
        status: 'operational',
        location: systemData.location,
        notes: systemData.notes || null,
        healthScore: '100',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const [createdSystem] = await db
        .insert(buildingSystems)
        .values(newSystem)
        .returning();

      await createFacilityNotification({
        type: 'system_created',
        title: `New building system created: ${newSystem.name}`,
        message: `A new building system of type ${newSystem.type} has been added.`
      });

      res.json(createdSystem);
    } catch (error) {
      console.error("Error creating building system:", error);
      res.status(500).json({ error: "Failed to create building system" });
    }
  });

  // Register other routes
  app.use("/api/training", trainingRouter);
  app.use("/api/azure-ad", azureADRouter);
  registerQualityRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}

export function setupWebSocketServer(httpServer, app) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/socket.io'
  });

  const clients = new Map();
  const rooms = new Map();

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'join_room') {
          const roomName = data.room;
          if (!rooms.has(roomName)) {
            rooms.set(roomName, new Set());
          }
          rooms.get(roomName)?.add(ws);
          console.log(`Client joined room: ${roomName}`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      rooms.forEach(clients => clients.delete(ws));
    });
  });

  // Add broadcast helper
  wss.broadcastToRoom = (room, message) => {
    const clients = rooms.get(room);
    if (clients) {
      const messageStr = JSON.stringify(message);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }
  };

  return wss;
}